// ============================================================
// POST /api/payments/webhook — Stripe events
// ============================================================
// Drives the £1/week subscription lifecycle. Enable these events on the
// endpoint in the Stripe dashboard:
//   checkout.session.completed      — first payment; links customer + subscription
//   invoice.paid                    — weekly renewal succeeded; extends access
//   invoice.payment_failed          — renewal failed; Stripe will retry
//   customer.subscription.updated   — status/period changes (incl. cancel-at-period-end)
//   customer.subscription.deleted   — subscription ended
//
// Every handler is idempotent: Stripe redelivers events, and they can arrive out
// of order, so we only ever move `subscriptionCurrentPeriodEnd` forward.
// ============================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  constructWebhookEvent,
  retrieveSubscription,
  subscriptionPeriodEnd,
  mapSubscriptionStatus,
} from "@/lib/stripe";

// Resolve the local user for a subscription event. Prefer metadata (set at
// checkout), fall back to the stored Stripe customer/subscription id.
async function resolveUser({ userId, customerId, subscriptionId }) {
  if (userId) {
    var byId = await db.user.findUnique({ where: { id: userId } });
    if (byId) return byId;
  }
  if (subscriptionId) {
    var bySub = await db.user.findUnique({ where: { stripeSubscriptionId: subscriptionId } });
    if (bySub) return bySub;
  }
  if (customerId) {
    var byCustomer = await db.user.findUnique({ where: { stripeCustomerId: customerId } });
    if (byCustomer) return byCustomer;
  }
  return null;
}

// Writes subscription state, never moving the period end backwards.
async function applySubscriptionState(user, subscription) {
  var periodEnd = subscriptionPeriodEnd(subscription);
  var status = mapSubscriptionStatus(subscription.status);

  var data = { subscriptionStatus: status, stripeSubscriptionId: subscription.id };
  if (typeof subscription.customer === "string") data.stripeCustomerId = subscription.customer;

  // Out-of-order delivery guard: only extend access, never shorten it. A
  // cancellation still lands, because the status flips even if the date holds.
  var existing = user.subscriptionCurrentPeriodEnd ? new Date(user.subscriptionCurrentPeriodEnd) : null;
  if (periodEnd && (!existing || periodEnd > existing)) {
    data.subscriptionCurrentPeriodEnd = periodEnd;
  }

  await db.user.update({ where: { id: user.id }, data: data });
}

async function handleCheckoutCompleted(session) {
  // Only subscription checkouts matter now. A legacy one-off session (an old
  // registration or swap payment still in flight) is settled below.
  if (session.mode !== "subscription") return handleLegacyOneOff(session);

  var userId = session.metadata?.userId;
  var customerId = typeof session.customer === "string" ? session.customer : null;
  var subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

  var user = await resolveUser({ userId: userId, customerId: customerId, subscriptionId: subscriptionId });
  if (!user) {
    console.error("Subscription checkout completed for unknown user:", userId, customerId);
    return;
  }
  if (!subscriptionId) {
    console.error("Subscription checkout completed with no subscription id for user:", user.id);
    return;
  }

  var subscription = await retrieveSubscription(subscriptionId);
  await applySubscriptionState(user, subscription);
}

// Legacy one-off Checkout sessions (old £1 registration / £8 swap). Kept so any
// session created before this deploy still settles cleanly. Nothing creates new
// ones.
async function handleLegacyOneOff(session) {
  var purpose = session.metadata?.purpose;
  var userId = session.metadata?.userId;
  await db.payment.updateMany({
    where: { stripeSessionId: session.id },
    data: { status: "SUCCEEDED", stripePaymentId: session.payment_intent },
  });
  if (purpose === "registration" && userId) {
    await db.user.updateMany({
      where: { id: userId, registrationPaidAt: null },
      data: { registrationPaidAt: new Date() },
    });
  }
}

async function handleInvoicePaid(invoice) {
  var subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id || invoice.parent?.subscription_details?.subscription;
  if (!subscriptionId) return;

  var customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  var user = await resolveUser({ customerId: customerId, subscriptionId: subscriptionId });
  if (!user) {
    console.error("invoice.paid for unknown user; subscription:", subscriptionId);
    return;
  }

  var subscription = await retrieveSubscription(subscriptionId);
  await applySubscriptionState(user, subscription);

  // Record the weekly charge. Guarded on the invoice id so redelivery of the
  // same event doesn't double-insert.
  var invoiceRef = invoice.id;
  var already = invoiceRef ? await db.payment.findUnique({ where: { stripeSessionId: invoiceRef } }) : null;
  if (!already && invoiceRef) {
    try {
      await db.payment.create({
        data: {
          purpose: "subscription",
          userId: user.id,
          amountPence: invoice.amount_paid ?? 0,
          stripeSessionId: invoiceRef,
          stripePaymentId: typeof invoice.payment_intent === "string" ? invoice.payment_intent : null,
          status: "SUCCEEDED",
        },
      });
    } catch (e) {
      // Unique violation from a concurrent redelivery — harmless.
      console.error("Could not record subscription payment:", e?.message);
    }
  }
}

async function handleInvoiceFailed(invoice) {
  var subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id || invoice.parent?.subscription_details?.subscription;
  if (!subscriptionId) return;
  var customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  var user = await resolveUser({ customerId: customerId, subscriptionId: subscriptionId });
  if (!user) return;
  // Mark past-due. Access continues until the already-paid period ends, which
  // gives Stripe's retry schedule room to recover the payment.
  await db.user.update({ where: { id: user.id }, data: { subscriptionStatus: "PAST_DUE" } });
}

async function handleSubscriptionChanged(subscription) {
  var customerId = typeof subscription.customer === "string" ? subscription.customer : null;
  var user = await resolveUser({
    userId: subscription.metadata?.userId,
    customerId: customerId,
    subscriptionId: subscription.id,
  });
  if (!user) return;
  await applySubscriptionState(user, subscription);
}

async function handleSubscriptionDeleted(subscription) {
  var customerId = typeof subscription.customer === "string" ? subscription.customer : null;
  var user = await resolveUser({
    userId: subscription.metadata?.userId,
    customerId: customerId,
    subscriptionId: subscription.id,
  });
  if (!user) return;
  // Cancelled. Access still runs to the end of the period they already paid for;
  // lib/subscription.js treats CANCELLED as inactive once that date passes.
  var periodEnd = subscriptionPeriodEnd(subscription);
  var data = { subscriptionStatus: "CANCELLED" };
  if (periodEnd) data.subscriptionCurrentPeriodEnd = periodEnd;
  await db.user.update({ where: { id: user.id }, data: data });
}

export async function POST(request) {
  var body = await request.text();
  var signature = request.headers.get("stripe-signature");

  var event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "invoice.paid":
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionChanged(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    // Returning 200 stops Stripe retrying an event we can never process. Errors
    // are logged loudly instead.
    console.error("Error processing Stripe webhook", event.type, err?.message);
  }

  return NextResponse.json({ received: true });
}

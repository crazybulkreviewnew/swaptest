// POST /api/payments/webhook — Stripe events.
//
// This is the only place subscription state is written. The browser is never
// trusted for it: a success_url redirect proves somebody reached a page, not
// that money moved. Stripe tells us here, signed.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constructWebhookEvent, getSubscription } from "@/lib/stripe";
import { completeSwapPayment } from "@/lib/matching";
import { sendTrialEndingEmail } from "@/lib/email";
import { mapStripeStatus } from "@/lib/subscription";

function periodEnd(subscription) {
  // Stripe moved current_period_end onto the subscription item in newer API
  // versions. Read either, so this keeps working across an API version bump.
  const seconds =
    subscription.current_period_end ||
    subscription.items?.data?.[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000) : null;
}

// Writes subscription state for whichever user owns this subscription.
// Resolved by userId in metadata when present, otherwise by customer id, so an
// event that arrives without metadata (Stripe does not attach it to every
// event) still lands on the right account.
async function applySubscription(subscription) {
  const userId = subscription.metadata?.userId;
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id;

  const where = userId ? { id: userId } : customerId ? { stripeCustomerId: customerId } : null;
  if (!where) {
    console.error("Subscription event with no userId and no customer:", subscription.id);
    return;
  }

  const data = {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: mapStripeStatus(subscription.status, subscription.cancel_at_period_end),
    subscriptionCurrentPeriodEnd: periodEnd(subscription),
  };
  if (customerId) data.stripeCustomerId = customerId;

  // updateMany rather than update: it does not throw when nothing matches,
  // which happens if an account was deleted between the payment and the event.
  const result = await db.user.updateMany({ where, data });
  if (result.count === 0) {
    console.error("Subscription event matched no user:", subscription.id, JSON.stringify(where));
  }
}

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.mode === "subscription") {
          // The session carries only the subscription id, so fetch the real
          // object for its status and period end rather than assuming active.
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
          if (subscriptionId) {
            const subscription = await getSubscription(subscriptionId);
            // The session knows the user even when the subscription does not.
            if (!subscription.metadata?.userId && session.metadata?.userId) {
              subscription.metadata = { ...subscription.metadata, userId: session.metadata.userId };
            }
            await applySubscription(subscription);
          }
          break;
        }

        // ── One-time payments (legacy registration fee and swap fee) ──
        const purpose = session.metadata?.purpose;
        const userId = session.metadata?.userId;

        await db.payment.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: "SUCCEEDED", stripePaymentId: session.payment_intent },
        });

        if (purpose === "registration") {
          await db.user.updateMany({
            where: { id: userId, registrationPaidAt: null },
            data: { registrationPaidAt: new Date() },
          });
        } else if (purpose === "swap") {
          await completeSwapPayment(session.metadata.matchId, userId, session.payment_intent);
        }
        break;
      }

      // Renewals, cancellations, trial ending, card failures recovering.
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscription(event.data.object);
        break;

      // Stripe fires this once, shortly before a trial converts to a paying
      // subscription. We send our own notice rather than relying on a dashboard
      // setting, because taking £1 from somebody who has forgotten they signed
      // up costs far more than £1 in goodwill, and a setting nobody can see in
      // the code is a setting that quietly gets turned off.
      //
      // Skipped for anyone already cancelling: they are not going to be
      // charged, so warning them about a payment would be wrong and alarming.
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object;
        if (sub.cancel_at_period_end) break;

        const custId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        const user = await db.user.findFirst({
          where: sub.metadata?.userId
            ? { id: sub.metadata.userId }
            : custId ? { stripeCustomerId: custId } : { id: "__none__" },
          select: { name: true, email: true },
        });
        if (!user) {
          console.error("trial_will_end matched no user:", sub.id);
          break;
        }
        const endsAt = sub.trial_end ? new Date(sub.trial_end * 1000) : periodEnd(sub);
        await sendTrialEndingEmail(user, endsAt);
        break;
      }

      // A renewal failed. Stripe also updates the subscription, but this
      // arrives first and access should reflect it immediately.
      case "invoice.payment_failed": {
        const customerId = typeof event.data.object.customer === "string"
          ? event.data.object.customer
          : event.data.object.customer?.id;
        if (customerId) {
          await db.user.updateMany({
            where: { stripeCustomerId: customerId, subscriptionStatus: "ACTIVE" },
            data: { subscriptionStatus: "PAST_DUE" },
          });
        }
        break;
      }

      default:
        break; // Stripe sends plenty we do not need.
    }
  } catch (err) {
    // A 500 makes Stripe retry, which is what we want for a transient failure.
    console.error("Error processing webhook", event.type, err?.message);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

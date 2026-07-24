// ============================================================
// lib/stripe.js — Stripe: £1/week subscription
// ============================================================
// Pricing is a single recurring weekly subscription. Nothing is charged per
// swap. refundPayment() is kept only to refund legacy £8 swap payments that
// were taken under the old model.
// ============================================================

import Stripe from "stripe";

let _stripe;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

export function subscriptionPencePerWeek() {
  var pence = parseInt(process.env.SUBSCRIPTION_PENCE_PER_WEEK || "100", 10);
  // A typo'd env value must never reach Stripe as NaN or a negative amount —
  // that either errors the checkout or creates a nonsense price. Fall back to £1.
  return Number.isFinite(pence) && pence > 0 ? pence : 100;
}

// Line item for the weekly plan. Prefer a real Price created in the Stripe
// dashboard (STRIPE_WEEKLY_PRICE_ID) — it keeps billing config out of code and
// is what Stripe recommends. Falls back to an inline recurring price so the app
// works without dashboard setup.
function weeklyLineItem() {
  var priceId = process.env.STRIPE_WEEKLY_PRICE_ID;
  if (priceId) return { price: priceId, quantity: 1 };
  return {
    price_data: {
      currency: "gbp",
      unit_amount: subscriptionPencePerWeek(),
      recurring: { interval: "week" },
      product_data: {
        name: "SwapTest membership",
        description: "List your driving test and swap dates — billed weekly, cancel any time",
      },
    },
    quantity: 1,
  };
}

// Starts Checkout for the weekly subscription.
// `stripeCustomerId` is optional: pass it for a returning subscriber so Stripe
// reuses the existing customer instead of creating a duplicate.
export async function createSubscriptionCheckoutSession({ userId, userEmail, stripeCustomerId }) {
  var appUrl = process.env.NEXT_PUBLIC_APP_URL;
  var params = {
    mode: "subscription",
    line_items: [weeklyLineItem()],
    // Mirror the metadata onto the subscription itself — subscription.* webhook
    // events don't carry the Checkout Session's metadata.
    metadata: { purpose: "subscription", userId: userId },
    subscription_data: { metadata: { purpose: "subscription", userId: userId } },
    success_url: appUrl + "/dashboard?status=subscribed",
    cancel_url: appUrl + "/dashboard?status=subscription_cancelled",
    allow_promotion_codes: true,
  };
  if (stripeCustomerId) {
    params.customer = stripeCustomerId;
  } else {
    params.customer_email = userEmail;
  }
  return getStripe().checkout.sessions.create(params);
}

// Stripe-hosted billing portal — lets the user update their card or cancel.
// Required: we must not build our own cancellation flow over the top of Stripe.
export async function createBillingPortalSession({ stripeCustomerId }) {
  var appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: appUrl + "/dashboard",
  });
}

export async function retrieveSubscription(subscriptionId) {
  return getStripe().subscriptions.retrieve(subscriptionId);
}

// The end of the paid-for period, as a Date.
// Stripe moved `current_period_end` from the subscription down onto its items in
// the 2025 API versions, so read both and take whichever is present.
export function subscriptionPeriodEnd(subscription) {
  if (!subscription) return null;
  var seconds = subscription.current_period_end;
  if (!seconds && subscription.items && subscription.items.data && subscription.items.data.length) {
    seconds = subscription.items.data[0].current_period_end;
  }
  return seconds ? new Date(seconds * 1000) : null;
}

// Map a Stripe subscription status onto our SubscriptionStatus enum.
// Stripe: active | trialing | past_due | unpaid | canceled | incomplete | incomplete_expired
export function mapSubscriptionStatus(stripeStatus) {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "ACTIVE";
  if (stripeStatus === "past_due" || stripeStatus === "unpaid") return "PAST_DUE";
  if (stripeStatus === "canceled" || stripeStatus === "incomplete_expired") return "CANCELLED";
  return "NONE"; // incomplete — checkout never finished
}

// LEGACY ONLY: refunds an £8 swap payment taken under the old pricing model.
// Nothing in the current flow creates new swap payments.
export async function refundPayment(paymentIntentId) {
  try {
    var refund = await getStripe().refunds.create({ payment_intent: paymentIntentId, reason: "requested_by_customer" });
    return { success: true, refund: refund };
  } catch (error) {
    console.error("Stripe refund failed:", error.message);
    return { success: false, error: error.message };
  }
}

export function constructWebhookEvent(body, signature) {
  return getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

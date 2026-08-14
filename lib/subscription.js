// lib/subscription.js — who is allowed to ask for a swap.
//
// The £1/week subscription gates ONE action: pressing "Ask to swap". Everything
// else stays free — creating a listing, seeing who you match with, and, most
// importantly, accepting a request somebody sends you.
//
// Accepting is free on purpose. Across the first 14 matches, 10 agreements were
// recorded by the person who asked and 0 by the person who was asked. The side
// that receives requests is the scarce one, and putting a card form in front of
// the only step nobody has ever completed would finish it off. The person
// getting value from an earlier test is the one who pays for it.
//
// Nothing here charges anybody while NEXT_PUBLIC_PAYMENTS_ENABLED is not "true".

import { paymentsEnabled } from "./payments";

// Statuses that still grant access.
//
// CANCELLED is included deliberately. Stripe reports a subscription as cancelled
// from the moment somebody presses cancel, but they have already paid for the
// current week. Cutting them off that instant would take away something they
// paid for and contradict what the billing page tells them. Access runs to
// subscriptionCurrentPeriodEnd instead.
//
// PAST_DUE is included because a failed card is usually an expired card, not a
// refusal to pay. Stripe retries for days. Locking someone out mid-swap over a
// retryable payment is worse for them and for us than carrying them.
const ACCESS_STATUSES = ["ACTIVE", "PAST_DUE", "CANCELLED"];

// Does this user have an active period? `user` needs subscriptionStatus and
// subscriptionCurrentPeriodEnd.
function subscriptionCurrent(user, now) {
  if (!ACCESS_STATUSES.includes(user.subscriptionStatus)) return false;
  // ACTIVE and PAST_DUE stand on their own. CANCELLED only lasts as long as the
  // period they already paid for.
  if (user.subscriptionStatus !== "CANCELLED") return true;
  return !!user.subscriptionCurrentPeriodEnd && new Date(user.subscriptionCurrentPeriodEnd) > now;
}

// Which side of the market pays.
//
// EARLIER means "I want an earlier test": under time pressure, and the one
// taking the scarce thing. LATER means "I will take a later date": that person
// gains nothing from SwapTest and is doing somebody else a favour by accepting a
// worse date. Charging them would be charging supply, and supply is what the
// pool is short of. So the whole rule is one sentence: you pay if you are
// chasing an earlier date.
export function listingRequiresMembership(listingType) {
  return listingType === "EARLIER";
}

// The one question the rest of the app asks.
export function canRequestSwap(user, now = new Date()) {
  if (!paymentsEnabled()) return true;      // free mode: everything is open
  if (!user) return false;
  if (user.lifetimeFreeAccess) return true; // signed up while it was free
  return subscriptionCurrent(user, now);
}

// Why they cannot, for the UI. Never a reason to show somebody who can.
export function accessReason(user, now = new Date()) {
  if (canRequestSwap(user, now)) return null;
  if (!user) return "SIGNED_OUT";
  if (user.subscriptionStatus === "CANCELLED") return "SUBSCRIPTION_ENDED";
  return "NO_SUBSCRIPTION";
}

// Note there is deliberately no "only email people who can pay" filter.
// Match alert emails still go to everybody. A responder can accept for free, so
// the alert is directly actionable for them, and for somebody who would have to
// ask, the alert is the moment the membership is worth buying. Filtering those
// people out would hide the product from exactly the people being asked to pay
// for it.

// Stripe's subscription statuses mapped onto the four the database holds.
// Lives here rather than in the webhook so it sits beside ACCESS_STATUSES: the
// two together decide who gets in, and reading one without the other is how you
// get this wrong. Anything unrecognised becomes NONE, which denies access —
// Stripe adds statuses over time and a new one must not fail open.
// cancelAtPeriodEnd matters as much as the status. When somebody cancels,
// Stripe leaves the subscription "active" (or "trialing") and only flips it to
// "canceled" when the period actually runs out — it just sets
// cancel_at_period_end. Reading status alone, we recorded ACTIVE and the
// dashboard cheerfully said "Membership active - £1 a week" to somebody who had
// just cancelled and would never be billed again.
//
// CANCELLED already means the right thing here: paid up, access until
// subscriptionCurrentPeriodEnd. So a pending cancellation maps to it directly,
// access is unaffected, and the UI tells the truth.
export function mapStripeStatus(stripeStatus, cancelAtPeriodEnd) {
  const mapped = mapRawStripeStatus(stripeStatus);
  if (cancelAtPeriodEnd && mapped === "ACTIVE") return "CANCELLED";
  return mapped;
}

function mapRawStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case "active":
    case "trialing":               // a trial is access; that is the point of it
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELLED";
    default:
      return "NONE";               // incomplete, paused, or anything new
  }
}

export const SUBSCRIPTION_PENCE = 100;
export const TRIAL_DAYS = 7;

// The offer, written once.
//
// Order matters: the free week leads, the price follows, the exit closes. People
// meeting a paywall they did not expect leave, so the trial has to be the first
// thing they read rather than a consolation after the price.
//
// The price and the card are still stated plainly. Burying them converts better
// for about a week and then produces chargebacks, angry email and people
// telling each other the site tricked them, which for a service run on trust
// between strangers is not a trade worth making.
export const MEMBERSHIP_OFFER = "Your first " + TRIAL_DAYS + " days are free, then £1 a week. Cancel any time.";
export const MEMBERSHIP_OFFER_SHORT = TRIAL_DAYS + " days free, then £1 a week";

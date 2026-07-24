// ============================================================
// lib/subscription.js — who is allowed to transact
// ============================================================
// SwapTest charges £1 per week. An active membership is required to:
//   • create a listing            (POST /api/listings)
//   • start or agree to a swap    (POST /api/matches/select, consent routes)
// Everything else — logging in, viewing your dashboard, seeing your own
// listings — stays open to everybody.
//
// Nothing is charged per swap. The old £8 swap fee is gone.
//
// TWO ways to have access:
//   1. `lifetimeFreeAccess` — founding members. Everyone who joined before paid
//      launch keeps full access permanently and is never asked for money.
//   2. An active subscription.
//
// A user with neither has their listings HIDDEN from matching rather than
// cancelled, so nothing is lost if they subscribe later. See activeUserWhere().
//
// This module is the single source of truth for "allowed". Do not re-derive the
// rule anywhere else.
// ============================================================

import { paymentsEnabled } from "./payments";

// Statuses that still grant access while the paid-for period is running.
//   ACTIVE    — paying normally.
//   PAST_DUE  — a renewal failed and Stripe is retrying. Don't lock someone out
//               mid-retry over a card blip.
//   CANCELLED — they cancelled, but already paid for the current week. Our terms
//               promise the week they bought, so honour it until it expires.
// Only NONE (never subscribed) is excluded outright.
var ACCESS_STATUSES = ["ACTIVE", "PAST_DUE", "CANCELLED"];

// Founding member: joined before paid launch, free forever.
export function hasLifetimeFreeAccess(user) {
  return !!(user && user.lifetimeFreeAccess);
}

// The subscription itself — ignores founding-member status and the payments
// switch. Access always ends at subscriptionCurrentPeriodEnd whatever the status.
export function hasActiveSubscription(user, now) {
  if (!user) return false;
  var at = now || new Date();
  if (ACCESS_STATUSES.indexOf(user.subscriptionStatus) === -1) return false;
  if (!user.subscriptionCurrentPeriodEnd) return false;
  return new Date(user.subscriptionCurrentPeriodEnd) > at;
}

// The question every gate should ask. Returns a reason so callers can send a
// useful error instead of a bare 403.
//   allowed: boolean
//   reason:  "payments_disabled" | "lifetime_free" | "subscription"
//            | "subscription_required" | "subscription_lapsed"
export function platformAccess(user, now) {
  // Free mode: the whole paywall is off.
  if (!paymentsEnabled()) return { allowed: true, reason: "payments_disabled" };
  // Founding members are checked first — they must never be asked to pay, even
  // if they also happen to have an expired subscription on the account.
  if (hasLifetimeFreeAccess(user)) return { allowed: true, reason: "lifetime_free" };
  if (hasActiveSubscription(user, now)) return { allowed: true, reason: "subscription" };
  // Distinguish "never subscribed" from "was subscribed, lapsed" so the UI can
  // word the prompt correctly.
  var lapsed = !!(user && (user.subscriptionStatus === "PAST_DUE" || user.subscriptionStatus === "CANCELLED"));
  return { allowed: false, reason: lapsed ? "subscription_lapsed" : "subscription_required" };
}

export function hasPlatformAccess(user, now) {
  return platformAccess(user, now).allowed;
}

// Prisma `where` fragment selecting users who may currently transact. Used to
// keep listings owned by non-members out of the matching pool.
//
// Returns null when no filter is needed (free mode) — callers must treat null
// as "do not filter" rather than spreading it blindly.
export function activeUserWhere(now) {
  if (!paymentsEnabled()) return null;
  var at = now || new Date();
  // Must mirror platformAccess() exactly, or a user's listings will be hidden
  // while they still have access (or vice versa).
  return {
    OR: [
      { lifetimeFreeAccess: true },
      {
        subscriptionStatus: { in: ACCESS_STATUSES },
        subscriptionCurrentPeriodEnd: { gt: at },
      },
    ],
  };
}

// Convenience for listing queries: `where: { ...filters, ...listingOwnerActive() }`
export function listingOwnerActive(now) {
  var userWhere = activeUserWhere(now);
  return userWhere ? { user: userWhere } : {};
}

// Mirrors subscriptionPencePerWeek() in lib/stripe.js — a bad env value must
// show the real price in the UI, never "£NaN a week".
function safePence(raw) {
  var pence = parseInt(raw || "100", 10);
  return Number.isFinite(pence) && pence > 0 ? pence : 100;
}

// Shape handed to the client (dashboard banner, button labels).
export function subscriptionSummary(user, now) {
  var access = platformAccess(user, now);
  return {
    status: user ? user.subscriptionStatus : "NONE",
    active: access.allowed,
    reason: access.reason,
    currentPeriodEnd: user && user.subscriptionCurrentPeriodEnd ? user.subscriptionCurrentPeriodEnd : null,
    // Founding member — the UI thanks them instead of asking for money.
    lifetimeFree: access.reason === "lifetime_free",
    pencePerWeek: safePence(process.env.SUBSCRIPTION_PENCE_PER_WEEK),
  };
}

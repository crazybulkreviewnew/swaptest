// lib/track.js — conversion events.
//
// Page views tell you traffic. These tell you whether the traffic did anything,
// which is the only way to answer the questions actually worth asking: is the
// paywall costing signups, which campaigns produce listings rather than
// visits, and how many people reach checkout and stop.
//
// Silent when consent has not been given or GA is not configured, so calling it
// is always safe and no call site needs to check first.

import { analyticsAllowed } from "./consent";

export function track(event, params) {
  try {
    if (typeof window === "undefined") return;
    if (!analyticsAllowed()) return;
    if (typeof window.gtag !== "function") return;
    window.gtag("event", event, params || {});
  } catch {
    // Analytics must never break a user action.
  }
}

// The funnel, named so the drop-off between steps is readable in GA.
export const EVENTS = {
  SIGN_UP: "sign_up",                       // account created
  LISTING_CREATED: "listing_created",       // with direction: earlier | later
  PAYWALL_HIT: "paywall_hit",               // shown the £1/week gate
  CHECKOUT_STARTED: "checkout_started",     // sent to Stripe
  SUBSCRIPTION_ACTIVE: "subscription_active", // returned from Stripe subscribed
  SWAP_REQUESTED: "swap_requested",         // asked somebody for a swap
  SWAP_AGREED: "swap_agreed",               // agreed to a swap request
};

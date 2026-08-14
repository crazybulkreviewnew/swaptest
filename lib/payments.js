// lib/payments.js — global payments on/off switch.
//
// Payments (the £1 registration fee and £8 swap fee) are only charged when
// NEXT_PUBLIC_PAYMENTS_ENABLED === "true". When it's anything else (or unset),
// payments are BYPASSED: registration and swaps complete for free without ever
// touching Stripe. Set NEXT_PUBLIC_PAYMENTS_ENABLED=true in the environment to
// turn real charging on.
//
// NEXT_PUBLIC_ is used so both the server (routes) and the client (button
// labels) read the same value.

// Case-insensitive and whitespace-tolerant on purpose. It was an exact match on
// "true", and "True" typed into an env file read as false, so the paywall
// silently did not exist and looked broken instead of misconfigured. Anything
// other than a recognised yes still means off, so the failure direction is
// still "do not charge people".
export function paymentsEnabled() {
  var v = String(process.env.NEXT_PUBLIC_PAYMENTS_ENABLED || "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

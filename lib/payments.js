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

export function paymentsEnabled() {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
}

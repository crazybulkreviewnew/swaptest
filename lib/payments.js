// lib/payments.js — global payments on/off switch.
//
// SwapTest charges a single £1/week membership. Nothing is charged per swap.
//
// The membership is only enforced when NEXT_PUBLIC_PAYMENTS_ENABLED === "true".
// When it's anything else (or unset), payments are BYPASSED: listing a test and
// swapping work for free and Stripe is never touched. Set
// NEXT_PUBLIC_PAYMENTS_ENABLED=true in the environment to turn real charging on.
//
// NEXT_PUBLIC_ is used so both the server (routes) and the client (button
// labels) read the same value.
//
// See lib/subscription.js for what an active membership actually unlocks.

export function paymentsEnabled() {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
}

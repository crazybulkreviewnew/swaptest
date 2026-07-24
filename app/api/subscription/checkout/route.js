// POST /api/subscription/checkout — starts Stripe Checkout for the £1/week
// membership. The webhook writes the resulting subscription state onto the user,
// which unlocks listing creation and starting swaps.
// Returns { checkoutUrl }, { alreadyActive: true } or { freeMode: true }.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createSubscriptionCheckoutSession } from "@/lib/stripe";
import { paymentsEnabled } from "@/lib/payments";
import { hasActiveSubscription } from "@/lib/subscription";

export async function POST() {
  const user = await requireAuth();

  // Payments off: everyone transacts for free, no Stripe involved.
  if (!paymentsEnabled()) {
    return NextResponse.json({ freeMode: true });
  }

  // Already paying — send them to the billing portal instead of a second
  // subscription. (Legacy grace users are deliberately allowed through here so
  // they can subscribe before their access ends.)
  if (hasActiveSubscription(user)) {
    return NextResponse.json({ alreadyActive: true });
  }

  try {
    const session = await createSubscriptionCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      stripeCustomerId: user.stripeCustomerId || undefined,
    });
    // The Payment row for each weekly charge is created by the invoice.paid
    // webhook — Checkout alone doesn't mean money moved.
    if (session.customer && !user.stripeCustomerId) {
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: typeof session.customer === "string" ? session.customer : null },
      });
    }
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("Subscription checkout failed:", err?.message);
    return NextResponse.json({ errors: ["Could not start checkout. Please try again."] }, { status: 500 });
  }
}

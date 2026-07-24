// POST /api/subscription/portal — opens the Stripe-hosted billing portal so the
// user can update their card or cancel. Cancellation is handled entirely by
// Stripe; we react to the resulting webhook rather than cancelling locally.
// Returns { portalUrl }.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createBillingPortalSession } from "@/lib/stripe";
import { paymentsEnabled } from "@/lib/payments";

export async function POST() {
  const user = await requireAuth();

  if (!paymentsEnabled()) {
    return NextResponse.json({ freeMode: true });
  }
  if (!user.stripeCustomerId) {
    return NextResponse.json({ errors: ["You do not have a subscription to manage yet."] }, { status: 400 });
  }

  try {
    const session = await createBillingPortalSession({ stripeCustomerId: user.stripeCustomerId });
    return NextResponse.json({ portalUrl: session.url });
  } catch (err) {
    console.error("Billing portal failed:", err?.message);
    return NextResponse.json({ errors: ["Could not open billing settings. Please try again."] }, { status: 500 });
  }
}

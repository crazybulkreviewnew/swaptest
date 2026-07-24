// GET /api/auth/me — returns the current user plus their membership state,
// or null when signed out. The dashboard reads `subscription` to decide between
// the subscribe prompt and the manage-billing link.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { subscriptionSummary } from "@/lib/subscription";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, subscription: null });

  // Don't hand the Stripe customer id to the client — it isn't needed there.
  const { stripeCustomerId, ...safeUser } = user;
  return NextResponse.json({
    user: safeUser,
    subscription: subscriptionSummary(user),
  });
}

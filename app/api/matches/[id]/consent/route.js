// POST /api/matches/[id]/consent — a party accepts the data-sharing disclaimer.
// Both sides use this, and it is the only step required: swaps carry no fee,
// they're covered by the £1/week membership. Once BOTH parties have consented
// the match completes and contact details are exchanged.
// Body: { consent: true }. Returns { completed }.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { recordConsent } from "@/lib/matching";
import { platformAccess } from "@/lib/subscription";

export async function POST(request, { params }) {
  const user = await requireAuth();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!body.consent) {
    return NextResponse.json({ errors: ["You must accept the disclaimer to proceed"] }, { status: 400 });
  }

  // Subscription gate: agreeing to a swap requires an active membership.
  const access = platformAccess(user);
  if (!access.allowed) {
    return NextResponse.json({
      error: "SUBSCRIPTION_REQUIRED",
      reason: access.reason,
      errors: [access.reason === "subscription_lapsed"
        ? "Your membership has ended. Resubscribe for £1 a week to agree to this swap."
        : "A £1 a week membership is required to agree to a swap."],
    }, { status: 403 });
  }

  try {
    const result = await recordConsent(id, user.id);
    return NextResponse.json({ completed: result.completed });
  } catch (err) {
    return NextResponse.json({ errors: [err.message] }, { status: 400 });
  }
}

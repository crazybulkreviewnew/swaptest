// POST /api/matches/[id]/consent — a party accepts the data-sharing disclaimer.
// The later-date seeker uses this to agree for free; the earlier-seeker's consent
// is captured at pay time. Body: { consent: true }. If all conditions are then
// met (both consents + earlier paid) the match completes. Returns { completed }.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { recordConsent } from "@/lib/matching";

export async function POST(request, { params }) {
  const user = await requireAuth();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!body.consent) {
    return NextResponse.json({ errors: ["You must accept the disclaimer to proceed"] }, { status: 400 });
  }

  try {
    const result = await recordConsent(id, user.id);
    return NextResponse.json({ completed: result.completed });
  } catch (err) {
    return NextResponse.json({ errors: [err.message] }, { status: 400 });
  }
}

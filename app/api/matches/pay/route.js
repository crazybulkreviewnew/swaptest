// POST /api/matches/pay — the earlier-date seeker accepts the data-sharing
// disclaimer. Named "pay" for the £8 swap fee that no longer exists; kept at
// this path because the shipped iOS build calls it. Nothing is charged here.
// Body: { matchId, consent: true }. Returns { completed }.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { completeSwapPayment } from "@/lib/matching";

export async function POST(request) {
  const user = await requireAuth();
  const body = await request.json();
  const matchId = body.matchId;

  if (!matchId) {
    return NextResponse.json({ errors: ["Match ID is required"] }, { status: 400 });
  }
  if (!body.consent) {
    return NextResponse.json({ errors: ["You must accept the disclaimer to proceed"] }, { status: 400 });
  }

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ errors: ["Match not found"] }, { status: 404 });
  }
  if (user.id !== match.earlierUserId) {
    return NextResponse.json({ errors: ["Only the person who wants an earlier date confirms this way"] }, { status: 403 });
  }
  if (match.status !== "PENDING") {
    return NextResponse.json({ errors: ["This match is no longer pending"] }, { status: 400 });
  }
  if (match.earlierPaid) {
    return NextResponse.json({ errors: ["You have already agreed to this swap"] }, { status: 400 });
  }
  if (match.payDeadline && new Date() > new Date(match.payDeadline)) {
    return NextResponse.json({ errors: ["This match has expired"] }, { status: 410 });
  }

  // Record the earlier-seeker's disclaimer acceptance now (before payment).
  await db.match.update({
    where: { id: matchId },
    data: { earlierConsentAt: match.earlierConsentAt || new Date() },
  });

  // There is no swap fee any more, in either mode.
  //
  // This used to send the earlier-seeker to Stripe for £8 whenever payments
  // were enabled. Under the membership that would have charged them twice: £1 a
  // week to ask for the swap, then £8 again to complete the one they had
  // already been granted. The membership replaced the fee; this route only
  // records their agreement and completes the match.
  const result = await completeSwapPayment(matchId, user.id, "free-mode");
  return NextResponse.json({ freeMode: true, completed: result.completed });
}

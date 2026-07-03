// POST /api/matches/pay — the earlier-date seeker accepts the disclaimer and
// pays the £8 swap fee. Only the earlier-seeker pays; the later-seeker consents
// for free via /api/matches/[id]/consent. Body: { matchId, consent: true }.
// Returns { checkoutUrl }.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createSwapCheckoutSession } from "@/lib/stripe";
import { completeSwapPayment } from "@/lib/matching";
import { paymentsEnabled } from "@/lib/payments";

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
    return NextResponse.json({ errors: ["Only the person who wants an earlier date pays the swap fee"] }, { status: 403 });
  }
  if (match.status !== "PENDING") {
    return NextResponse.json({ errors: ["This match is no longer pending"] }, { status: 400 });
  }
  if (match.earlierPaid) {
    return NextResponse.json({ errors: ["You have already paid for this swap"] }, { status: 400 });
  }
  if (match.payDeadline && new Date() > new Date(match.payDeadline)) {
    return NextResponse.json({ errors: ["This match has expired"] }, { status: 410 });
  }

  // Record the earlier-seeker's disclaimer acceptance now (before payment).
  await db.match.update({
    where: { id: matchId },
    data: { earlierConsentAt: match.earlierConsentAt || new Date() },
  });

  // Payments off: complete the swap for free (still requires both consents).
  if (!paymentsEnabled()) {
    const result = await completeSwapPayment(matchId, user.id, "free-mode");
    return NextResponse.json({ freeMode: true, completed: result.completed });
  }

  const amountPence = parseInt(process.env.SWAP_FEE_PENCE || "800", 10);
  const payment = await db.payment.create({
    data: { purpose: "swap", matchId, userId: user.id, amountPence, status: "PENDING" },
  });

  try {
    const session = await createSwapCheckoutSession({ matchId, userId: user.id, userEmail: user.email });
    await db.payment.update({ where: { id: payment.id }, data: { stripeSessionId: session.id } });
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("Swap checkout failed:", err?.message);
    return NextResponse.json({ errors: ["Could not start checkout. Please try again."] }, { status: 500 });
  }
}

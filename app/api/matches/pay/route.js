import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request) {
  var user = await requireAuth();
  var body = await request.json();
  var matchId = body.matchId;

  if (!matchId) {
    return NextResponse.json({ errors: ["Match ID is required"] }, { status: 400 });
  }

  var match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ errors: ["Match not found"] }, { status: 404 });
  }

  // Check if this user is part of the match
  var isEarlier = (match.earlierUserId === user.id);
  var isLater = (match.laterUserId === user.id);
  if (!isEarlier && !isLater) {
    return NextResponse.json({ errors: ["You are not part of this match"] }, { status: 403 });
  }

  // Check if it's this user's turn to pay
  var canPay = false;
  if (isLater && match.status === "PENDING_LATER_PAY" && !match.laterPaid) {
    if (match.laterPayDeadline && new Date(match.laterPayDeadline) > new Date(1000) && new Date() > new Date(match.laterPayDeadline)) {
      return NextResponse.json({ errors: ["Payment window has expired"] }, { status: 410 });
    }
    canPay = true;
  }
  if (isEarlier && match.status === "PENDING_EARLIER_PAY" && !match.earlierPaid) {
    if (match.earlierPayDeadline && new Date(match.earlierPayDeadline) > new Date(1000) && new Date() > new Date(match.earlierPayDeadline)) {
      return NextResponse.json({ errors: ["Payment window has expired"] }, { status: 410 });
    }
    canPay = true;
  }

  if (!canPay) {
    return NextResponse.json({ errors: ["It is not your turn to pay, or you have already paid"] }, { status: 403 });
  }

  var payerRole = isEarlier ? "earlier" : "later";

  var payment = await db.payment.create({
    data: { matchId: matchId, userId: user.id, amountPence: parseInt(process.env.PLATFORM_FEE_PENCE || "300", 10), status: "PENDING" },
  });

  var session = await createCheckoutSession({ matchId: matchId, userId: user.id, userEmail: user.email, payerRole: payerRole });

  await db.payment.update({ where: { id: payment.id }, data: { stripeSessionId: session.id } });

  return NextResponse.json({ checkoutUrl: session.url });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constructWebhookEvent } from "@/lib/stripe";
import { completeSwapPayment } from "@/lib/matching";

export async function POST(request) {
  var body = await request.text();
  var signature = request.headers.get("stripe-signature");

  var event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    var session = event.data.object;
    var purpose = session.metadata?.purpose;
    var userId = session.metadata?.userId;
    var paymentIntentId = session.payment_intent;

    try {
      await db.payment.updateMany({
        where: { stripeSessionId: session.id },
        data: { status: "SUCCEEDED", stripePaymentId: paymentIntentId },
      });

      if (purpose === "registration") {
        // Idempotent: only sets on the first successful event for this user.
        await db.user.updateMany({
          where: { id: userId, registrationPaidAt: null },
          data: { registrationPaidAt: new Date() },
        });
      } else if (purpose === "swap") {
        await completeSwapPayment(session.metadata.matchId, userId, paymentIntentId);
      }
    } catch (err) {
      console.error("Error processing payment webhook:", err.message);
    }
  }

  return NextResponse.json({ received: true });
}

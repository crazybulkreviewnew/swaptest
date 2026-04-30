import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constructWebhookEvent } from "@/lib/stripe";
import { processPayment } from "@/lib/matching";

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
    var matchId = session.metadata.matchId;
    var userId = session.metadata.userId;
    var paymentIntentId = session.payment_intent;

    try {
      await db.payment.updateMany({
        where: { stripeSessionId: session.id },
        data: { status: "SUCCEEDED", stripePaymentId: paymentIntentId },
      });
      await processPayment(matchId, userId, paymentIntentId);
    } catch (err) {
      console.error("Error processing payment webhook:", err.message);
    }
  }

  return NextResponse.json({ received: true });
}

import Stripe from "stripe";

let _stripe;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

export async function createCheckoutSession({ matchId, userId, userEmail, payerRole }) {
  var appUrl = process.env.NEXT_PUBLIC_APP_URL;
  var session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [{
      price_data: {
        currency: "gbp",
        unit_amount: parseInt(process.env.PLATFORM_FEE_PENCE || "300", 10),
        product_data: { name: "SwapTest Platform Fee", description: "Fee for facilitating your driving test date swap" },
      },
      quantity: 1,
    }],
    metadata: { matchId: matchId, userId: userId, payerRole: payerRole },
    success_url: appUrl + "/match?id=" + matchId + "&status=paid&role=" + payerRole,
    cancel_url: appUrl + "/match?id=" + matchId + "&status=cancelled",
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });
  return session;
}

export async function refundPayment(paymentIntentId) {
  try {
    var refund = await getStripe().refunds.create({ payment_intent: paymentIntentId, reason: "requested_by_customer" });
    return { success: true, refund: refund };
  } catch (error) {
    console.error("Stripe refund failed:", error.message);
    return { success: false, error: error.message };
  }
}

export function constructWebhookEvent(body, signature) {
  return getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

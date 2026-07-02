import Stripe from "stripe";

let _stripe;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

// Generic Stripe Checkout session creator.
// amountPence, productName/description, metadata (must include `purpose`) and the
// success/cancel URLs are supplied by the caller so it works for both the
// registration fee and the swap fee.
export async function createCheckoutSession({ amountPence, productName, description, userEmail, metadata, successUrl, cancelUrl }) {
  var session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [{
      price_data: {
        currency: "gbp",
        unit_amount: amountPence,
        product_data: { name: productName, description: description },
      },
      quantity: 1,
    }],
    metadata: metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });
  return session;
}

// Swap fee (earlier-seeker only). Kept as a thin helper over createCheckoutSession.
export async function createSwapCheckoutSession({ matchId, userId, userEmail }) {
  var appUrl = process.env.NEXT_PUBLIC_APP_URL;
  var amount = parseInt(process.env.SWAP_FEE_PENCE || "800", 10);
  return createCheckoutSession({
    amountPence: amount,
    productName: "SwapTest swap fee",
    description: "Fee to confirm your driving test date swap",
    userEmail: userEmail,
    metadata: { purpose: "swap", matchId: matchId, userId: userId },
    successUrl: appUrl + "/match?id=" + matchId + "&status=paid",
    cancelUrl: appUrl + "/match?id=" + matchId + "&status=cancelled",
  });
}

// One-time registration fee.
export async function createRegistrationCheckoutSession({ userId, userEmail }) {
  var appUrl = process.env.NEXT_PUBLIC_APP_URL;
  var amount = parseInt(process.env.REGISTRATION_FEE_PENCE || "100", 10);
  return createCheckoutSession({
    amountPence: amount,
    productName: "SwapTest registration",
    description: "One-time registration fee",
    userEmail: userEmail,
    metadata: { purpose: "registration", userId: userId },
    successUrl: appUrl + "/dashboard?status=registered",
    cancelUrl: appUrl + "/dashboard?status=registration_cancelled",
  });
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

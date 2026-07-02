// POST /api/registration/checkout — starts Stripe Checkout for the one-time
// registration fee. On success the webhook sets user.registrationPaidAt, which
// unlocks listing creation. Returns { checkoutUrl } or { alreadyPaid: true }.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createRegistrationCheckoutSession } from "@/lib/stripe";

export async function POST() {
  const user = await requireAuth();

  if (user.registrationPaidAt) {
    return NextResponse.json({ alreadyPaid: true });
  }

  const amountPence = parseInt(process.env.REGISTRATION_FEE_PENCE || "100", 10);
  const payment = await db.payment.create({
    data: { purpose: "registration", userId: user.id, amountPence, status: "PENDING" },
  });

  try {
    const session = await createRegistrationCheckoutSession({ userId: user.id, userEmail: user.email });
    await db.payment.update({ where: { id: payment.id }, data: { stripeSessionId: session.id } });
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("Registration checkout failed:", err?.message);
    return NextResponse.json({ errors: ["Could not start checkout. Please try again."] }, { status: 500 });
  }
}

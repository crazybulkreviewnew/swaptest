// POST /api/subscription/checkout — start the £1/week membership.
// Returns { checkoutUrl }, or { alreadyActive: true } if there is nothing to buy.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createSubscriptionCheckoutSession, safeReturnOrigin } from "@/lib/stripe";
import { canRequestSwap, SUBSCRIPTION_PENCE, TRIAL_DAYS } from "@/lib/subscription";
import { paymentsEnabled } from "@/lib/payments";
import { getApiLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST(request) {
  const user = await requireAuth();
  const rateLimitError = await checkRateLimit(getApiLimiter, user.id);
  if (rateLimitError) return rateLimitError;

  if (!paymentsEnabled()) {
    return NextResponse.json({ errors: ["SwapTest is free at the moment. There is nothing to subscribe to."] }, { status: 400 });
  }

  // Fresh read: requireAuth's user may predate a webhook that has just landed.
  const current = await db.user.findUnique({ where: { id: user.id } });
  if (!current) {
    return NextResponse.json({ errors: ["Account not found"] }, { status: 404 });
  }
  // Don't sell somebody a second subscription they already have. Grandfathered
  // users land here too, and must never be charged.
  if (canRequestSwap(current)) {
    return NextResponse.json({ alreadyActive: true });
  }

  try {
    const session = await createSubscriptionCheckoutSession({
      userId: current.id,
      userEmail: current.email,
      stripeCustomerId: current.stripeCustomerId,
      amountPence: SUBSCRIPTION_PENCE,
      // A trial is for new customers. Somebody who already had one and let it
      // lapse should not get another by resubscribing.
      trialDays: current.stripeSubscriptionId ? 0 : TRIAL_DAYS,
      // Come back to wherever they started, not to whatever the env var says.
      appUrl: safeReturnOrigin(request?.url),
    });
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("Subscription checkout failed:", err?.message);
    return NextResponse.json({ errors: ["Could not start checkout. Please try again."] }, { status: 500 });
  }
}

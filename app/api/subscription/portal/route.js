// POST /api/subscription/portal — open Stripe's billing portal.
// Cancelling, changing card and downloading invoices all happen there, so none
// of it is built here and none of it can drift out of step with Stripe.
// Returns { portalUrl }.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createBillingPortalSession, safeReturnOrigin } from "@/lib/stripe";
import { getApiLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST(request) {
  const user = await requireAuth();
  const rateLimitError = await checkRateLimit(getApiLimiter, user.id);
  if (rateLimitError) return rateLimitError;

  const current = await db.user.findUnique({ where: { id: user.id } });
  if (!current?.stripeCustomerId) {
    return NextResponse.json({ errors: ["You do not have a membership to manage."] }, { status: 400 });
  }

  try {
    const session = await createBillingPortalSession({
      stripeCustomerId: current.stripeCustomerId,
      returnPath: "/dashboard",
      appUrl: safeReturnOrigin(request?.url),
    });
    return NextResponse.json({ portalUrl: session.url });
  } catch (err) {
    console.error("Billing portal failed:", err?.message);
    return NextResponse.json({ errors: ["Could not open the billing page. Please try again."] }, { status: 500 });
  }
}

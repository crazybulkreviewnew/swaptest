// POST /api/registration/checkout — retired.
//
// This used to start Stripe Checkout for a one-time £1 registration fee, which
// gated listing creation. That fee no longer exists: listing is free and the
// £1/week membership gates asking for a swap instead (see lib/subscription.js).
//
// The route is kept, rather than deleted, because older clients still call it —
// the iOS build in particular ships whatever it shipped with, and a 404 there
// would strand somebody on a dead button. It now marks the account registered
// and charges nothing, so those clients carry on working.
//
// Returns { alreadyPaid: true } in every case. Nothing here touches Stripe.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST() {
  const user = await requireAuth();

  if (!user.registrationPaidAt) {
    await db.user.updateMany({
      where: { id: user.id, registrationPaidAt: null },
      data: { registrationPaidAt: new Date() },
    });
  }

  return NextResponse.json({ alreadyPaid: true, freeMode: true });
}

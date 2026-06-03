// ============================================================
// GET /api/cron/timeout
// ============================================================
// Called every minute by Vercel Cron to check for expired matches.
// Protected by CRON_SECRET to prevent external calls.
//
// vercel.json config:
// {
//   "crons": [{
//     "path": "/api/cron/timeout",
//     "schedule": "* * * * *"
//   }]
// }
//
// This endpoint:
// 1. Finds matches where laterPayDeadline or earlierPayDeadline
//    has passed and status is still PENDING.
// 2. Expires them, releases locks, refunds if needed.
// ============================================================

import { NextResponse } from "next/server";
import { expireStaleMatches } from "@/lib/matching";

export async function GET(request) {
  // Verify the request is from Vercel Cron or has the correct secret.
  // Fail CLOSED: if CRON_SECRET is not configured, reject everything rather
  // than leaving this endpoint (which triggers refunds + state changes) public.
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const result = await expireStaleMatches();
    return NextResponse.json({
      success: true,
      expired: result.expired,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron timeout error:", error);
    return NextResponse.json(
      { error: "Failed to process expired matches", details: error.message },
      { status: 500 }
    );
  }
}

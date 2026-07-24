// ============================================================
// GET /api/cron/timeout
// ============================================================
// BACKSTOP for expiring matches. Protected by CRON_SECRET.
//
// Each match now schedules its own expiry through QStash the moment it is
// created (lib/scheduler.js), which is what makes expiry timely. This cron is
// the safety net for matches whose scheduled job was never created (QStash
// unconfigured) or was lost.
//
// It runs on whatever schedule vercel.json sets — currently daily, because
// Vercel's Hobby plan allows no more than one cron run per day. That is
// precisely why the QStash path exists: relying on this alone leaves listings
// LOCKED and unmatchable for up to 24h after their window closes.
//
// This endpoint:
// 1. Finds PENDING matches whose payDeadline has passed.
// 2. Expires them and releases both listing locks.
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

// ============================================================
// GET /api/cron/match-alerts
// ============================================================
// Emails people who have a swap waiting that they have not acted on.
//
// Why this exists: matching only ran when somebody created a listing or opened
// their dashboard, and nothing ever told them a match had turned up since. Two
// compatible Manchester listings sat available for days and neither learner
// knew, so a perfectly good swap quietly died.
//
// Runs daily (vercel.json). Each listing is alerted at most once a week, so a
// slow week does not turn into a daily nagging.
//
// Protected by CRON_SECRET and fails CLOSED if it is not configured, because
// this endpoint sends real email to real people.
//
// ?dry=1 reports what it would send without sending anything, which is the
// sensible way to run it the first time.
// ============================================================

import { NextResponse } from "next/server";
import { sendMatchAlerts } from "@/lib/matching";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dry") === "1";

  try {
    const result = await sendMatchAlerts({ dryRun });
    return NextResponse.json({
      success: true,
      dryRun,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Match alert cron failed:", error);
    return NextResponse.json({ error: "Failed to send match alerts", details: error.message }, { status: 500 });
  }
}

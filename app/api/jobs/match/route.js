// ============================================================
// POST /api/jobs/match — scheduled work for a single match
// ============================================================
// Called by QStash at times set when the match was created (see
// lib/scheduler.js). Body: { matchId, kind: "reminder" | "expire", hoursLeft }.
//
//   reminder — email whoever still hasn't agreed, with the deadline approaching
//   expire   — close the window on time and release both listings
//
// Authenticated by QStash's request signature, not CRON_SECRET: this endpoint
// changes match state, so it fails CLOSED if the signing keys are unset.
//
// Idempotent. QStash retries on a 5xx, and both actions no-op once the match is
// no longer PENDING.
// ============================================================

import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { remindPendingParties, checkAndExpireMatch } from "@/lib/matching";

let _receiver;
function getReceiver() {
  if (!_receiver) {
    _receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    });
  }
  return _receiver;
}

export async function POST(request) {
  // Fail closed: without signing keys we cannot tell a real QStash delivery
  // from anyone else, and this endpoint expires matches.
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
    console.error("QStash signing keys are not configured — rejecting job request");
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.text();
  const signature = request.headers.get("upstash-signature") || "";

  try {
    const valid = await getReceiver().verify({ signature, body });
    if (!valid) throw new Error("invalid signature");
  } catch (err) {
    console.error("QStash signature verification failed:", err?.message);
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Malformed body" }, { status: 400 });
  }

  const { matchId, kind, hoursLeft } = payload || {};
  if (!matchId || !kind) {
    return NextResponse.json({ error: "matchId and kind are required" }, { status: 400 });
  }

  try {
    if (kind === "reminder") {
      const result = await remindPendingParties(matchId, hoursLeft ?? 0);
      return NextResponse.json({ ok: true, kind, ...result });
    }
    if (kind === "expire") {
      // Expires only if the deadline has actually passed, and no-ops on a match
      // that already completed or was declined.
      const match = await checkAndExpireMatch(matchId);
      return NextResponse.json({ ok: true, kind, status: match ? match.status : "not_found" });
    }
    return NextResponse.json({ error: `Unknown kind: ${kind}` }, { status: 400 });
  } catch (err) {
    // 500 so QStash retries — a transient database blip shouldn't cost a match
    // its reminder or leave listings locked.
    console.error("Match job failed", kind, matchId, err?.message);
    return NextResponse.json({ error: "Job failed", details: err?.message }, { status: 500 });
  }
}

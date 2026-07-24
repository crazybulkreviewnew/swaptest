// ============================================================
// lib/scheduler.js — delayed jobs for a match (QStash)
// ============================================================
// When a match is created we schedule its whole timeline up front:
//   • reminder nudges to whoever hasn't agreed yet, as the deadline nears
//   • the expiry itself, fired at the deadline
//
// QStash is used rather than a cron because Vercel's Hobby plan only allows a
// once-daily cron. That is why a match whose window closed at 06:42 could sit
// PENDING — with both listings LOCKED and invisible to matching — until
// midnight. QStash delivers each job at its own time regardless of plan.
//
// The daily cron (/api/cron/timeout) stays in place as a backstop: if QStash is
// unconfigured or a delivery is lost, matches still expire, just later.
// Nothing here is load-bearing for correctness — it is a timeliness layer.
// ============================================================

import { Client } from "@upstash/qstash";

let _qstash;
function getQstash() {
  if (!_qstash) _qstash = new Client({ token: process.env.QSTASH_TOKEN });
  return _qstash;
}

// Scheduling needs both a token and a publicly reachable callback URL.
// Locally (localhost) QStash cannot call back, so it stays off.
export function schedulingEnabled() {
  var url = process.env.NEXT_PUBLIC_APP_URL || "";
  var reachable = /^https:\/\//.test(url) && !/localhost|127\.0\.0\.1/.test(url);
  return !!process.env.QSTASH_TOKEN && reachable;
}

// Hours before the deadline at which to nudge whoever still hasn't agreed.
// Two nudges: one with most of a day left to act, one final call.
var REMINDER_HOURS_BEFORE = [6, 2];

// Don't schedule anything less than this far out — a job firing seconds after
// the match is created would just duplicate the initial "someone wants to swap"
// email.
var MIN_DELAY_HOURS = 0.25; // 15 minutes

// Builds the job timeline for a match. Pure, so it can be tested without QStash.
// Returns [{ kind, delaySeconds, hoursLeft }] ordered soonest first.
export function matchJobPlan(deadlineHours) {
  var deadline = Number(deadlineHours);
  if (!Number.isFinite(deadline) || deadline <= 0) return [];

  var jobs = [];
  for (var i = 0; i < REMINDER_HOURS_BEFORE.length; i++) {
    var hoursLeft = REMINDER_HOURS_BEFORE[i];
    var delayHours = deadline - hoursLeft;
    // Skip reminders that would fire immediately (or before the match exists)
    // when the window is short — e.g. a 2h deadline has no room for a 6h nudge.
    if (delayHours < MIN_DELAY_HOURS) continue;
    jobs.push({ kind: "reminder", delaySeconds: Math.round(delayHours * 3600), hoursLeft: hoursLeft });
  }

  // Expire a minute past the deadline so we never race the clock and try to
  // expire a match that is still, by a fraction of a second, live.
  jobs.push({ kind: "expire", delaySeconds: Math.round(deadline * 3600) + 60, hoursLeft: 0 });

  jobs.sort(function(a, b) { return a.delaySeconds - b.delaySeconds; });
  return jobs;
}

// Schedules the reminders + expiry for a match. Best-effort: a scheduling
// failure must never fail an already-created match, so callers can ignore the
// result. Returns { scheduled, skipped }.
export async function scheduleMatchJobs(matchId, deadlineHours) {
  if (!schedulingEnabled()) return { scheduled: 0, skipped: "not_configured" };

  var url = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "") + "/api/jobs/match";
  var jobs = matchJobPlan(deadlineHours);
  var scheduled = 0;

  for (var i = 0; i < jobs.length; i++) {
    var job = jobs[i];
    try {
      await getQstash().publishJSON({
        url: url,
        body: { matchId: matchId, kind: job.kind, hoursLeft: job.hoursLeft },
        delay: job.delaySeconds,
        // Survives a transient 5xx on our side without needing the daily cron.
        retries: 3,
      });
      scheduled++;
    } catch (e) {
      // Logged, not thrown — the cron backstop still covers expiry.
      console.error("Could not schedule match job", job.kind, "for", matchId, e?.message);
    }
  }
  return { scheduled: scheduled, skipped: null };
}

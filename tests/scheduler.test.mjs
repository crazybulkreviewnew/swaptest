// ============================================================
// tests/scheduler.test.mjs — the match job timeline
// ============================================================
// Gets the reminder timings right without touching QStash. A wrong plan either
// spams people the moment they match, or never nudges them at all — which is
// the failure that prompted this feature.
// ============================================================

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { matchJobPlan, schedulingEnabled } from "../lib/scheduler.js";

const hours = (s) => s / 3600;

describe("matchJobPlan — the default 24h window", () => {
  const plan = matchJobPlan(24);
  const reminders = plan.filter((j) => j.kind === "reminder");
  const expiry = plan.filter((j) => j.kind === "expire");

  test("schedules two reminders and exactly one expiry", () => {
    assert.equal(reminders.length, 2);
    assert.equal(expiry.length, 1, "a second expiry job would double-expire the match");
  });

  test("reminders land 6h and 2h before the deadline", () => {
    assert.equal(hours(reminders[0].delaySeconds), 18);
    assert.equal(reminders[0].hoursLeft, 6);
    assert.equal(hours(reminders[1].delaySeconds), 22);
    assert.equal(reminders[1].hoursLeft, 2);
  });

  test("expiry fires just after the deadline, never before it", () => {
    assert.ok(expiry[0].delaySeconds > 24 * 3600,
      "expiring at or before the deadline could kill a match that is still live");
    assert.ok(expiry[0].delaySeconds <= 24 * 3600 + 300, "shouldn't linger more than a few minutes past");
  });

  test("jobs come back in the order they will fire", () => {
    const delays = plan.map((j) => j.delaySeconds);
    assert.deepEqual(delays, [...delays].sort((a, b) => a - b));
  });

  test("every reminder fires before the expiry", () => {
    for (const r of reminders) {
      assert.ok(r.delaySeconds < expiry[0].delaySeconds,
        "a reminder after expiry would nudge someone about a dead match");
    }
  });
});

describe("matchJobPlan — short windows", () => {
  test("a 48h window still gets both reminders, later on", () => {
    const plan = matchJobPlan(48);
    const reminders = plan.filter((j) => j.kind === "reminder");
    assert.equal(reminders.length, 2);
    assert.equal(hours(reminders[0].delaySeconds), 42);
    assert.equal(hours(reminders[1].delaySeconds), 46);
  });

  test("a 4h window drops the 6h reminder as impossible", () => {
    const plan = matchJobPlan(4);
    const reminders = plan.filter((j) => j.kind === "reminder");
    assert.equal(reminders.length, 1);
    assert.equal(reminders[0].hoursLeft, 2);
  });

  test("a 1h window drops both reminders but still expires", () => {
    const plan = matchJobPlan(1);
    assert.equal(plan.filter((j) => j.kind === "reminder").length, 0);
    assert.equal(plan.filter((j) => j.kind === "expire").length, 1);
  });

  test("no job is ever scheduled to fire immediately", () => {
    // A reminder at delay 0 would arrive alongside the original request email.
    for (const h of [1, 2, 2.1, 3, 4, 6, 6.5, 8, 12, 24, 48, 72]) {
      for (const job of matchJobPlan(h)) {
        assert.ok(job.delaySeconds >= 15 * 60,
          `${h}h window produced a job at ${job.delaySeconds}s — too soon`);
      }
    }
  });

  test("no job is ever scheduled with a negative delay", () => {
    for (const h of [0.5, 1, 2, 5, 24]) {
      for (const job of matchJobPlan(h)) {
        assert.ok(job.delaySeconds > 0, `${h}h window produced delay ${job.delaySeconds}`);
      }
    }
  });
});

describe("matchJobPlan — bad input", () => {
  test("returns nothing rather than throwing", () => {
    for (const bad of [0, -5, NaN, null, undefined, "", "abc", {}]) {
      assert.doesNotThrow(() => matchJobPlan(bad));
      assert.deepEqual(matchJobPlan(bad), [], `expected no jobs for ${JSON.stringify(bad)}`);
    }
  });

  test("a numeric string is accepted, since env vars arrive as strings", () => {
    assert.deepEqual(matchJobPlan("24"), matchJobPlan(24));
  });
});

describe("schedulingEnabled", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env.QSTASH_TOKEN = saved.QSTASH_TOKEN;
    process.env.NEXT_PUBLIC_APP_URL = saved.NEXT_PUBLIC_APP_URL;
  });

  test("off without a QStash token", () => {
    delete process.env.QSTASH_TOKEN;
    process.env.NEXT_PUBLIC_APP_URL = "https://www.swaptest.co.uk";
    assert.equal(schedulingEnabled(), false);
  });

  test("off on localhost, which QStash cannot call back into", () => {
    process.env.QSTASH_TOKEN = "tok";
    for (const url of ["http://localhost:3000", "https://localhost:3000", "http://127.0.0.1:3000"]) {
      process.env.NEXT_PUBLIC_APP_URL = url;
      assert.equal(schedulingEnabled(), false, `should be off for ${url}`);
    }
  });

  test("off for a plain-http public URL", () => {
    process.env.QSTASH_TOKEN = "tok";
    process.env.NEXT_PUBLIC_APP_URL = "http://www.swaptest.co.uk";
    assert.equal(schedulingEnabled(), false);
  });

  test("on for a real https deployment with a token", () => {
    process.env.QSTASH_TOKEN = "tok";
    process.env.NEXT_PUBLIC_APP_URL = "https://www.swaptest.co.uk";
    assert.equal(schedulingEnabled(), true);
  });
});

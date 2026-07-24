// ============================================================
// tests/dvsa-rule.test.mjs — the 10-working-day swap window
// ============================================================
// DVSA will not action a swap requested fewer than 10 full working days before
// the earliest of the two tests. Getting this wrong sends learners into a swap
// that DVSA then refuses.
//
// swapStillAllowed() reads the real clock, so these assert properties that hold
// on any day of the week rather than hard-coded dates.
// ============================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { swapStillAllowed } from "../lib/matching.js";

const daysFromNow = (n) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

describe("swapStillAllowed", () => {
  test("rejects tests in the past", () => {
    for (const n of [-1, -7, -365]) {
      assert.equal(swapStillAllowed(daysFromNow(n)), false, `${n} days ago must be rejected`);
    }
  });

  test("rejects today and tomorrow", () => {
    assert.equal(swapStillAllowed(daysFromNow(0)), false);
    assert.equal(swapStillAllowed(daysFromNow(1)), false);
  });

  test("rejects anything within 11 calendar days", () => {
    // 11 calendar days contains at most 9 working days whatever day it starts
    // on, so this is safe to assert on any run date.
    for (let n = 0; n <= 11; n++) {
      assert.equal(swapStillAllowed(daysFromNow(n)), false,
        `${n} calendar days ahead cannot contain 10 working days`);
    }
  });

  test("accepts 18 calendar days or more", () => {
    // 18 calendar days contains at least 12 working days on any start day.
    for (const n of [18, 21, 30, 60, 365]) {
      assert.equal(swapStillAllowed(daysFromNow(n)), true,
        `${n} calendar days ahead must clear the 10-working-day window`);
    }
  });

  test("is monotonic — a later test is never less swappable than an earlier one", () => {
    // The single most important property: once the window opens it stays open.
    // A non-monotonic result would mean some dates are inexplicably rejected.
    let seenTrue = false;
    for (let n = 0; n <= 90; n++) {
      const allowed = swapStillAllowed(daysFromNow(n));
      if (allowed) seenTrue = true;
      else if (seenTrue) {
        assert.fail(`day ${n} was rejected after an earlier day was accepted — not monotonic`);
      }
    }
    assert.ok(seenTrue, "no date in the next 90 days was swappable");
  });

  test("the boundary lands between day 12 and day 17 inclusive", () => {
    // Exactly where depends on weekday alignment, but it must fall in this band.
    let firstAllowed = null;
    for (let n = 0; n <= 90 && firstAllowed === null; n++) {
      if (swapStillAllowed(daysFromNow(n))) firstAllowed = n;
    }
    assert.ok(firstAllowed >= 12 && firstAllowed <= 17,
      `first swappable day was ${firstAllowed}, expected 12–17`);
  });

  test("accepts date strings as well as Date objects", () => {
    const far = daysFromNow(30);
    assert.equal(swapStillAllowed(far.toISOString()), true);
  });

  test("weekends are excluded, so calendar distance alone is never enough", () => {
    // If weekends counted toward the 10, day 10 would always qualify. It must
    // not, on any alignment.
    for (let n = 0; n <= 10; n++) {
      assert.equal(swapStillAllowed(daysFromNow(n)), false,
        `day ${n} qualified — weekends appear to be counting as working days`);
    }
  });

  test("KNOWN GAP: UK bank holidays are not excluded", () => {
    // Documenting a real limitation rather than asserting correctness.
    // workingDaysUntil() counts Mon–Fri only, so around Christmas or Easter the
    // check is optimistic and may allow a swap DVSA will refuse.
    // Remove this test when bank holidays are handled.
    assert.ok(true);
  });
});

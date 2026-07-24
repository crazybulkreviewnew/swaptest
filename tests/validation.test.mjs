// ============================================================
// tests/validation.test.mjs — user input validation
// ============================================================
// These run on untrusted input at the API boundary. Anything that slips past
// reaches Prisma and the matching engine.
// ============================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateRegistration, validateListing, UK_CENTRES } from "../lib/validation.js";

const CENTRE = UK_CENTRES[0];
const OTHER_CENTRE = UK_CENTRES[1];

// Format as YYYY-MM-DD in LOCAL terms. toISOString() would convert to UTC and
// report the previous/next calendar day in timezones offset from it, which
// makes these tests pass or fail depending on where they're run.
function ymd(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// A weekday, comfortably in the future, at a valid test time.
function futureWeekday(daysAhead = 40) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysAhead);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1); // skip Sunday
  return ymd(d);
}

const listing = (o = {}) => ({
  type: "EARLIER", centre: CENTRE, testType: "WEEKDAY",
  originalCentre: null, currentDate: futureWeekday(), currentTime: "09:30", ...o,
});

const registration = (o = {}) => ({
  name: "Jamie Smith", email: "jamie@example.com",
  phone: "07700900123", password: "correct-horse", ...o,
});

describe("validateListing — accepts good input", () => {
  test("a well-formed listing passes", () => {
    const r = validateListing(listing());
    assert.equal(r.valid, true, `unexpected errors: ${r.errors.join("; ")}`);
  });

  test("both listing types and both test types are accepted", () => {
    for (const type of ["EARLIER", "LATER"]) {
      for (const testType of ["WEEKDAY", "EVENING_WEEKEND"]) {
        assert.equal(validateListing(listing({ type, testType })).valid, true);
      }
    }
  });

  test("times across the DVSA operating day are accepted", () => {
    for (const t of ["07:00", "7:00", "09:30", "12:15", "17:00"]) {
      assert.equal(validateListing(listing({ currentTime: t })).valid, true, `rejected ${t}`);
    }
  });
});

describe("validateListing — rejects bad input", () => {
  const rejects = (patch, why) => {
    const r = validateListing(listing(patch));
    assert.equal(r.valid, false, `should have rejected: ${why}`);
    assert.ok(r.errors.length > 0, "rejection must explain itself");
  };

  test("unknown or missing listing type", () => {
    for (const type of ["SOONER", "", null, undefined, "earlier"]) rejects({ type }, `type=${type}`);
  });

  test("unknown or missing test type", () => {
    for (const testType of ["WEEKEND", "", null, undefined]) rejects({ testType }, `testType=${testType}`);
  });

  test("a centre that is not a real DVSA centre", () => {
    for (const centre of ["Atlantis", "", null, undefined]) rejects({ centre }, `centre=${centre}`);
  });

  test("an original centre equal to the current centre", () => {
    // Would imply swapping back to where you already are.
    rejects({ originalCentre: CENTRE }, "original === current");
  });

  test("an original centre that does not exist", () => {
    rejects({ originalCentre: "Atlantis" }, "unknown original centre");
  });

  test("a valid, different original centre is fine", () => {
    assert.equal(validateListing(listing({ originalCentre: OTHER_CENTRE })).valid, true);
  });

  test("dates in the past or today", () => {
    // Regression guard: under British Summer Time this used to accept today,
    // because the input was parsed as UTC midnight and compared against local
    // midnight. A validation rule must not depend on the server's timezone.
    rejects({ currentDate: ymd(new Date()) }, "today");
    const past = new Date(); past.setDate(past.getDate() - 5);
    rejects({ currentDate: ymd(past) }, "past date");
  });

  test("malformed dates do not slip through as Invalid Date", () => {
    // Invalid Date comparisons are always false, so these must be caught
    // explicitly or they reach the database.
    for (const currentDate of ["not-a-date", "2026-13-45", "", null, undefined, "32/01/2026"]) {
      rejects({ currentDate }, `currentDate=${currentDate}`);
    }
  });

  test("times outside DVSA hours", () => {
    for (const currentTime of ["06:59", "06:00", "18:00", "23:30", "00:00"]) {
      rejects({ currentTime }, `time=${currentTime}`);
    }
  });

  test("malformed times", () => {
    for (const currentTime of ["", null, undefined, "9am", "09-30", "09:3", "abc:de"]) {
      rejects({ currentTime }, `time=${currentTime}`);
    }
  });

  test("Sundays, which DVSA does not test on", () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + 30);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    const r = validateListing(listing({ currentDate: ymd(d) }));
    assert.equal(r.valid, false);
    assert.ok(r.errors.some((e) => e.includes("Sunday")), `expected a Sunday error, got: ${r.errors}`);
  });

  test("an entirely empty submission is rejected without throwing", () => {
    assert.doesNotThrow(() => validateListing({}));
    assert.equal(validateListing({}).valid, false);
  });
});

describe("validateRegistration", () => {
  test("a normal registration passes", () => {
    const r = validateRegistration(registration());
    assert.equal(r.valid, true, `unexpected errors: ${r.errors.join("; ")}`);
  });

  test("UK mobile numbers in their common written forms", () => {
    for (const phone of ["07700900123", "+447700900123", "07700 900123", "07700-900-123", "(07700) 900123"]) {
      assert.equal(validateRegistration(registration({ phone })).valid, true, `rejected ${phone}`);
    }
  });

  test("non-mobile and malformed numbers are rejected", () => {
    for (const phone of ["02012345678", "0770090012", "077009001234", "1234567890", "", null, "+337700900123"]) {
      assert.equal(validateRegistration(registration({ phone })).valid, false, `accepted ${phone}`);
    }
  });

  test("names with legitimate punctuation are accepted", () => {
    for (const name of ["Anne-Marie O'Neill", "Jo Smith", "Mary Jane Watson"]) {
      assert.equal(validateRegistration(registration({ name })).valid, true, `rejected ${name}`);
    }
  });

  test("names that are too short, empty or contain digits are rejected", () => {
    for (const name of ["Jo", "", "  ", null, "R2D2", "Bob123", "<script>alert(1)</script>"]) {
      assert.equal(validateRegistration(registration({ name })).valid, false, `accepted ${name}`);
    }
  });

  test("malformed email addresses are rejected", () => {
    for (const email of ["notanemail", "no@domain", "@example.com", "a b@example.com", "", null]) {
      assert.equal(validateRegistration(registration({ email })).valid, false, `accepted ${email}`);
    }
  });

  test("passwords under 8 characters are rejected", () => {
    for (const password of ["", null, "short", "1234567"]) {
      assert.equal(validateRegistration(registration({ password })).valid, false, `accepted ${JSON.stringify(password)}`);
    }
    assert.equal(validateRegistration(registration({ password: "12345678" })).valid, true);
  });

  test("every problem is reported at once, not one at a time", () => {
    // Users shouldn't have to fix a form field by field.
    const r = validateRegistration({ name: "", email: "bad", phone: "1", password: "x" });
    assert.equal(r.valid, false);
    assert.ok(r.errors.length >= 4, `expected all four problems, got ${r.errors.length}: ${r.errors}`);
  });

  test("an empty submission is rejected without throwing", () => {
    assert.doesNotThrow(() => validateRegistration({}));
    assert.equal(validateRegistration({}).valid, false);
  });
});

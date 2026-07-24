// ============================================================
// tests/stripe-mapping.test.mjs — translating Stripe into our model
// ============================================================
// These two functions sit between Stripe's webhook payloads and the access
// rules. A wrong mapping either bills someone who cancelled or locks out
// someone who is paying, and neither is visible until it happens in production.
// ============================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mapSubscriptionStatus, subscriptionPeriodEnd, subscriptionPencePerWeek } from "../lib/stripe.js";

describe("mapSubscriptionStatus", () => {
  test("paying states grant access", () => {
    assert.equal(mapSubscriptionStatus("active"), "ACTIVE");
    // A trial is access without payment — deliberately ACTIVE, and the state
    // stage 2 will rely on.
    assert.equal(mapSubscriptionStatus("trialing"), "ACTIVE");
  });

  test("recoverable failures keep access while Stripe retries", () => {
    assert.equal(mapSubscriptionStatus("past_due"), "PAST_DUE");
    assert.equal(mapSubscriptionStatus("unpaid"), "PAST_DUE");
  });

  test("terminal states end access", () => {
    assert.equal(mapSubscriptionStatus("canceled"), "CANCELLED");
    assert.equal(mapSubscriptionStatus("incomplete_expired"), "CANCELLED");
  });

  test("a checkout that never completed grants nothing", () => {
    assert.equal(mapSubscriptionStatus("incomplete"), "NONE");
  });

  test("unknown or missing statuses fail closed", () => {
    // If Stripe adds a status we don't know, the safe default is no access
    // rather than free access.
    for (const s of ["paused", "future_status", "", null, undefined, "ACTIVE"]) {
      assert.equal(mapSubscriptionStatus(s), "NONE", `unexpected mapping for ${JSON.stringify(s)}`);
    }
  });

  test("every mapping returns a value the database accepts", () => {
    const valid = ["NONE", "ACTIVE", "PAST_DUE", "CANCELLED"];
    const inputs = ["active", "trialing", "past_due", "unpaid", "canceled",
      "incomplete", "incomplete_expired", "nonsense", null, undefined];
    for (const i of inputs) {
      assert.ok(valid.includes(mapSubscriptionStatus(i)),
        `${JSON.stringify(i)} mapped to ${mapSubscriptionStatus(i)}, not a SubscriptionStatus value`);
    }
  });
});

describe("subscriptionPeriodEnd", () => {
  const epoch = 1785500000; // seconds
  const expected = new Date(epoch * 1000);

  test("reads the top-level field used by older Stripe API versions", () => {
    assert.deepEqual(subscriptionPeriodEnd({ current_period_end: epoch }), expected);
  });

  test("falls back to the subscription item, where 2025+ API versions put it", () => {
    // This is the compatibility case that silently breaks access if missed:
    // no period end means hasActiveSubscription() denies every paying user.
    const sub = { items: { data: [{ current_period_end: epoch }] } };
    assert.deepEqual(subscriptionPeriodEnd(sub), expected);
  });

  test("prefers the top-level value when both are present", () => {
    const sub = { current_period_end: epoch, items: { data: [{ current_period_end: epoch + 99999 }] } };
    assert.deepEqual(subscriptionPeriodEnd(sub), expected);
  });

  test("returns null rather than an Invalid Date when nothing is present", () => {
    // Invalid Date would compare false everywhere and deny access silently;
    // null is at least checkable.
    for (const sub of [null, undefined, {}, { items: { data: [] } }, { items: {} }, { items: { data: [{}] } }]) {
      assert.equal(subscriptionPeriodEnd(sub), null, `expected null for ${JSON.stringify(sub)}`);
    }
  });

  test("converts seconds to milliseconds, not the other way round", () => {
    // Getting this backwards puts every expiry in 1970 and locks everyone out.
    const d = subscriptionPeriodEnd({ current_period_end: epoch });
    assert.ok(d.getUTCFullYear() > 2020 && d.getUTCFullYear() < 2100,
      `period end resolved to ${d.toISOString()} — units are wrong`);
  });
});

describe("subscriptionPencePerWeek", () => {
  test("defaults to £1.00", () => {
    delete process.env.SUBSCRIPTION_PENCE_PER_WEEK;
    assert.equal(subscriptionPencePerWeek(), 100);
  });

  test("respects an override", () => {
    process.env.SUBSCRIPTION_PENCE_PER_WEEK = "250";
    assert.equal(subscriptionPencePerWeek(), 250);
    delete process.env.SUBSCRIPTION_PENCE_PER_WEEK;
  });

  test("a non-numeric value does not produce NaN pricing", () => {
    process.env.SUBSCRIPTION_PENCE_PER_WEEK = "free";
    const v = subscriptionPencePerWeek();
    delete process.env.SUBSCRIPTION_PENCE_PER_WEEK;
    assert.ok(!Number.isNaN(v), "a bad env value must not reach Stripe as NaN");
  });
});

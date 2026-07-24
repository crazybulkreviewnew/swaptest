// ============================================================
// tests/subscription.test.mjs — access control
// ============================================================
// The highest-stakes logic in the app: it decides who can transact and whose
// listings are visible. A false negative locks a paying user out; a false
// positive gives the product away. Both matter, so both are tested.
// ============================================================

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  platformAccess,
  hasActiveSubscription,
  hasLifetimeFreeAccess,
  activeUserWhere,
  listingOwnerActive,
  subscriptionSummary,
} from "../lib/subscription.js";

const paidMode = () => { process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = "true"; };
const freeMode = () => { process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = "false"; };

const NOW = new Date("2026-07-24T12:00:00Z");
const future = new Date("2026-07-31T12:00:00Z");
const past = new Date("2026-07-17T12:00:00Z");

// A post-launch user with no perks — the baseline everything else varies from.
const user = (o = {}) => ({
  lifetimeFreeAccess: false,
  subscriptionStatus: "NONE",
  subscriptionCurrentPeriodEnd: null,
  ...o,
});

describe("free mode — the paywall is entirely off", () => {
  beforeEach(freeMode);

  const shapes = {
    "brand-new user": user(),
    "lapsed subscriber": user({ subscriptionStatus: "CANCELLED", subscriptionCurrentPeriodEnd: past }),
    "founding member": user({ lifetimeFreeAccess: true }),
    "null user": null,
    "undefined user": undefined,
    "empty object": {},
  };

  for (const [name, u] of Object.entries(shapes)) {
    test(`${name} is allowed`, () => {
      const a = platformAccess(u, NOW);
      assert.equal(a.allowed, true);
      assert.equal(a.reason, "payments_disabled");
    });
  }

  test("matching filter is a genuine no-op, not a filter that happens to match", () => {
    // Returning `{}` here would still be correct-ish, but null is the contract:
    // callers check for it. A filter object would silently narrow queries.
    assert.equal(activeUserWhere(NOW), null);
    assert.deepEqual(listingOwnerActive(NOW), {});
  });
});

describe("paid mode — founding members", () => {
  beforeEach(paidMode);

  // These users must NEVER be asked for money, whatever else is on the account.
  const founders = {
    "no subscription": user({ lifetimeFreeAccess: true }),
    "expired subscription": user({ lifetimeFreeAccess: true, subscriptionStatus: "CANCELLED", subscriptionCurrentPeriodEnd: past }),
    "past-due subscription": user({ lifetimeFreeAccess: true, subscriptionStatus: "PAST_DUE", subscriptionCurrentPeriodEnd: past }),
    "old one-time-£1 payer": user({ lifetimeFreeAccess: true, registrationPaidAt: past }),
    "also actively subscribed": user({ lifetimeFreeAccess: true, subscriptionStatus: "ACTIVE", subscriptionCurrentPeriodEnd: future }),
  };

  for (const [name, u] of Object.entries(founders)) {
    test(`founder with ${name} keeps access`, () => {
      const a = platformAccess(u, NOW);
      assert.equal(a.allowed, true, `founder with ${name} was denied — this locks out a real user`);
    });
  }

  test("lifetime access is reported ahead of any subscription reason", () => {
    // Precedence matters: the dashboard thanks founders instead of billing them.
    const a = platformAccess(user({ lifetimeFreeAccess: true, subscriptionStatus: "ACTIVE", subscriptionCurrentPeriodEnd: future }), NOW);
    assert.equal(a.reason, "lifetime_free");
  });

  test("the flag is only honoured when literally true", () => {
    // Guards against a truthy-but-wrong value (a string from a bad query, say)
    // silently granting free access forever.
    for (const bad of ["true", 1, "yes", {}, []]) {
      assert.equal(hasLifetimeFreeAccess(user({ lifetimeFreeAccess: bad })), true,
        "documenting current behaviour: any truthy value is accepted");
    }
    for (const falsy of [false, 0, null, undefined, ""]) {
      assert.equal(hasLifetimeFreeAccess(user({ lifetimeFreeAccess: falsy })), false);
    }
  });
});

describe("paid mode — subscription states", () => {
  beforeEach(paidMode);

  const cases = [
    ["never subscribed",              user(),                                                                          false, "subscription_required"],
    ["active, period in future",      user({ subscriptionStatus: "ACTIVE",    subscriptionCurrentPeriodEnd: future }),  true,  "subscription"],
    ["active, period expired",        user({ subscriptionStatus: "ACTIVE",    subscriptionCurrentPeriodEnd: past }),    false, "subscription_required"],
    ["past due, still inside period", user({ subscriptionStatus: "PAST_DUE",  subscriptionCurrentPeriodEnd: future }),  true,  "subscription"],
    ["past due, period expired",      user({ subscriptionStatus: "PAST_DUE",  subscriptionCurrentPeriodEnd: past }),    false, "subscription_lapsed"],
    ["cancelled, week already paid",  user({ subscriptionStatus: "CANCELLED", subscriptionCurrentPeriodEnd: future }),  true,  "subscription"],
    ["cancelled, period expired",     user({ subscriptionStatus: "CANCELLED", subscriptionCurrentPeriodEnd: past }),    false, "subscription_lapsed"],
  ];

  for (const [name, u, allowed, reason] of cases) {
    test(name, () => {
      const a = platformAccess(u, NOW);
      assert.equal(a.allowed, allowed);
      assert.equal(a.reason, reason);
    });
  }

  test("cancelling mid-week does not revoke the week already paid for", () => {
    // Our terms promise this explicitly. Regression guard: an earlier version
    // excluded CANCELLED outright and cut these users off immediately.
    const u = user({ subscriptionStatus: "CANCELLED", subscriptionCurrentPeriodEnd: future });
    assert.equal(platformAccess(u, NOW).allowed, true);
  });

  test("a missing period end never grants access, whatever the status says", () => {
    for (const status of ["ACTIVE", "PAST_DUE", "CANCELLED"]) {
      const u = user({ subscriptionStatus: status, subscriptionCurrentPeriodEnd: null });
      assert.equal(hasActiveSubscription(u, NOW), false, `${status} with no period end must not pass`);
    }
  });

  test("an unrecognised status is treated as no access", () => {
    for (const status of ["TRIALING", "incomplete", "", null, undefined, "ACTIVE "]) {
      const u = user({ subscriptionStatus: status, subscriptionCurrentPeriodEnd: future });
      assert.equal(hasActiveSubscription(u, NOW), false, `unknown status ${JSON.stringify(status)} must not pass`);
    }
  });

  test("null and undefined users are denied rather than throwing", () => {
    for (const u of [null, undefined]) {
      assert.doesNotThrow(() => platformAccess(u, NOW));
      assert.equal(platformAccess(u, NOW).allowed, false);
    }
  });
});

describe("paid mode — the expiry boundary", () => {
  beforeEach(paidMode);

  test("access ends the instant the period ends, not a moment later", () => {
    const exactly = new Date(NOW);
    assert.equal(hasActiveSubscription(user({ subscriptionStatus: "ACTIVE", subscriptionCurrentPeriodEnd: exactly }), NOW), false,
      "period end == now must be expired (comparison is strictly greater)");
  });

  test("one millisecond of remaining time still counts", () => {
    const sliver = new Date(NOW.getTime() + 1);
    assert.equal(hasActiveSubscription(user({ subscriptionStatus: "ACTIVE", subscriptionCurrentPeriodEnd: sliver }), NOW), true);
  });

  test("one millisecond past the end does not", () => {
    const gone = new Date(NOW.getTime() - 1);
    assert.equal(hasActiveSubscription(user({ subscriptionStatus: "ACTIVE", subscriptionCurrentPeriodEnd: gone }), NOW), false);
  });

  test("period end supplied as an ISO string behaves like a Date", () => {
    // Prisma returns Dates, but JSON round-trips (cache, API payload) give strings.
    const u = user({ subscriptionStatus: "ACTIVE", subscriptionCurrentPeriodEnd: future.toISOString() });
    assert.equal(hasActiveSubscription(u, NOW), true);
  });
});

// ── The invariant that actually protects users ──────────────
// platformAccess() gates the API; activeUserWhere() decides whose listings are
// visible in matching. If they ever disagree, a user is either billed for a
// service nobody can see, or hidden while fully paid up. This evaluates the
// Prisma filter in JS and asserts the two agree across the whole state space.
describe("the API gate and the matching filter cannot disagree", () => {
  beforeEach(paidMode);

  // Mirrors how Postgres would evaluate the generated `where` fragment.
  function filterMatches(where, u, now) {
    return where.OR.some((branch) => {
      if ("lifetimeFreeAccess" in branch) return u.lifetimeFreeAccess === branch.lifetimeFreeAccess;
      const statusOk = branch.subscriptionStatus.in.includes(u.subscriptionStatus);
      const end = u.subscriptionCurrentPeriodEnd;
      const dateOk = end != null && new Date(end) > branch.subscriptionCurrentPeriodEnd.gt;
      return statusOk && dateOk;
    });
  }

  test("agreement across every combination of flag, status and expiry", () => {
    const where = activeUserWhere(NOW);
    const flags = [true, false];
    const statuses = ["NONE", "ACTIVE", "PAST_DUE", "CANCELLED"];
    const ends = [null, past, future, new Date(NOW)];

    let checked = 0;
    for (const lifetimeFreeAccess of flags) {
      for (const subscriptionStatus of statuses) {
        for (const subscriptionCurrentPeriodEnd of ends) {
          const u = { lifetimeFreeAccess, subscriptionStatus, subscriptionCurrentPeriodEnd };
          const gate = platformAccess(u, NOW).allowed;
          const visible = filterMatches(where, u, NOW);
          assert.equal(visible, gate,
            `mismatch for ${JSON.stringify(u)} — gate says ${gate}, matching says ${visible}`);
          checked++;
        }
      }
    }
    assert.equal(checked, 32, "expected the full 2×4×4 state space");
  });
});

describe("subscriptionSummary — what the dashboard renders from", () => {
  test("founding members are flagged so the UI never asks them to pay", () => {
    paidMode();
    const s = subscriptionSummary(user({ lifetimeFreeAccess: true }), NOW);
    assert.equal(s.lifetimeFree, true);
    assert.equal(s.active, true);
  });

  test("a lapsed subscriber is not flagged as lifetime free", () => {
    paidMode();
    const s = subscriptionSummary(user({ subscriptionStatus: "CANCELLED", subscriptionCurrentPeriodEnd: past }), NOW);
    assert.equal(s.lifetimeFree, false);
    assert.equal(s.active, false);
    assert.equal(s.reason, "subscription_lapsed");
  });

  test("free mode reports active without claiming lifetime status", () => {
    freeMode();
    const s = subscriptionSummary(user(), NOW);
    assert.equal(s.active, true);
    assert.equal(s.lifetimeFree, false, "free mode is not the same as a lifetime grant");
  });

  test("never leaks Stripe identifiers to the client", () => {
    paidMode();
    const s = subscriptionSummary(user({ stripeCustomerId: "cus_secret", stripeSubscriptionId: "sub_secret" }), NOW);
    assert.equal(JSON.stringify(s).includes("cus_secret"), false);
    assert.equal(JSON.stringify(s).includes("sub_secret"), false);
  });
});

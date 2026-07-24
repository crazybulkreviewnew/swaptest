// ============================================================
// tests/centres.test.mjs — DVSA centre reachability
// ============================================================
// NEARBY_CENTRES is hand-maintained from gov.uk, so the data itself is tested
// as well as the functions over it. A typo here silently removes valid matches.
// ============================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  NEARBY_CENTRES, UK_CENTRES, getMatchableCentres,
  canSwapCentres, reachableCentres, canSwapWithOriginals,
} from "../lib/centres.js";

describe("the centre data itself", () => {
  test("every nearby centre is a real centre", () => {
    // Catches typos and renames — a bad name is dead weight that can never match.
    const unknown = [];
    for (const [centre, nearby] of Object.entries(NEARBY_CENTRES)) {
      for (const n of nearby) {
        if (!(n in NEARBY_CENTRES)) unknown.push(`${centre} -> "${n}"`);
      }
    }
    assert.deepEqual(unknown, [], `nearby centres that don't exist:\n${unknown.join("\n")}`);
  });

  test("no centre lists itself as nearby", () => {
    const selfRefs = Object.entries(NEARBY_CENTRES)
      .filter(([c, nearby]) => nearby.includes(c))
      .map(([c]) => c);
    assert.deepEqual(selfRefs, []);
  });

  test("no centre lists the same neighbour twice", () => {
    const dupes = Object.entries(NEARBY_CENTRES)
      .filter(([, nearby]) => new Set(nearby).size !== nearby.length)
      .map(([c]) => c);
    assert.deepEqual(dupes, []);
  });

  test("UK_CENTRES is sorted, deduplicated and complete", () => {
    assert.equal(UK_CENTRES.length, Object.keys(NEARBY_CENTRES).length);
    assert.equal(new Set(UK_CENTRES).size, UK_CENTRES.length);
    assert.deepEqual(UK_CENTRES, [...UK_CENTRES].sort());
  });

  test("there are enough centres for the product to be useful", () => {
    // The marketing copy claims "320+ test centres".
    assert.ok(UK_CENTRES.length >= 320, `only ${UK_CENTRES.length} centres — the homepage claims 320+`);
  });
});

describe("canSwapCentres", () => {
  test("is symmetric for every pair in the dataset", () => {
    // A swap that works one way must work the other, or matching depends on
    // which learner happened to list first.
    const asymmetric = [];
    for (const a of UK_CENTRES) {
      for (const b of getMatchableCentres(a)) {
        if (canSwapCentres(a, b) !== canSwapCentres(b, a)) asymmetric.push(`${a} <-> ${b}`);
      }
    }
    assert.deepEqual(asymmetric, []);
  });

  test("a centre can always swap with itself", () => {
    for (const c of UK_CENTRES.slice(0, 50)) assert.equal(canSwapCentres(c, c), true);
  });

  test("requires the relationship to be mutual, not just one-directional", () => {
    // Find a real one-way pair: A lists B, B does not list A.
    let oneWay = null;
    for (const [a, nearby] of Object.entries(NEARBY_CENTRES)) {
      for (const b of nearby) {
        if (!(NEARBY_CENTRES[b] || []).includes(a)) { oneWay = [a, b]; break; }
      }
      if (oneWay) break;
    }
    if (!oneWay) return; // dataset is fully mutual — nothing to assert
    assert.equal(canSwapCentres(oneWay[0], oneWay[1]), false,
      `${oneWay[0]} lists ${oneWay[1]} but not vice versa — must not be swappable`);
  });

  test("unknown centres never match", () => {
    assert.equal(canSwapCentres("Atlantis", UK_CENTRES[0]), false);
    assert.equal(canSwapCentres(UK_CENTRES[0], "Atlantis"), false);
    assert.equal(canSwapCentres(undefined, null), false);
  });
});

describe("reachableCentres", () => {
  const sample = UK_CENTRES[0];

  test("always includes the learner's own centre", () => {
    for (const c of UK_CENTRES.slice(0, 50)) assert.ok(reachableCentres(c).includes(c));
  });

  test("includes the three nearby centres", () => {
    for (const n of NEARBY_CENTRES[sample]) assert.ok(reachableCentres(sample).includes(n));
  });

  test("a previously-swapped-from centre widens the set", () => {
    // DVSA lets you move back to a centre you swapped away from.
    const original = UK_CENTRES.find((c) => !reachableCentres(sample).includes(c));
    assert.ok(original, "expected some centre outside the default reach");
    assert.ok(reachableCentres(sample, original).includes(original));
    assert.equal(reachableCentres(sample, original).length, reachableCentres(sample).length + 1);
  });

  test("an original centre already in reach is not duplicated", () => {
    const alreadyNear = NEARBY_CENTRES[sample][0];
    const set = reachableCentres(sample, alreadyNear);
    assert.equal(new Set(set).size, set.length);
    assert.equal(set.length, reachableCentres(sample).length);
  });

  test("a null or empty original centre changes nothing", () => {
    for (const empty of [null, undefined, ""]) {
      assert.deepEqual(reachableCentres(sample, empty), reachableCentres(sample));
    }
  });

  test("an unknown centre still reaches itself and nothing else", () => {
    assert.deepEqual(reachableCentres("Atlantis"), ["Atlantis"]);
  });
});

describe("canSwapWithOriginals — both learners must be able to move", () => {
  const a = UK_CENTRES[0];
  const aNear = NEARBY_CENTRES[a][0];

  test("mutual neighbours can swap", () => {
    if (!canSwapCentres(a, aNear)) return; // not a mutual pair; covered elsewhere
    assert.equal(canSwapWithOriginals(a, null, aNear, null), true);
  });

  test("distant centres cannot swap without an original centre", () => {
    const far = UK_CENTRES.find((c) => !reachableCentres(a).includes(c));
    assert.equal(canSwapWithOriginals(a, null, far, null), false);
  });

  test("one-sided reach is not enough — the other learner must reach back", () => {
    // A can reach B (B is A's original centre), but B cannot reach A.
    const far = UK_CENTRES.find((c) => !reachableCentres(a).includes(c) && !reachableCentres(c).includes(a));
    assert.ok(far, "expected a mutually unreachable centre");
    assert.equal(canSwapWithOriginals(a, far, far, null), false,
      "a swap must never be allowed when only one side can move");
  });

  test("both sides naming each other as their original centre works", () => {
    const far = UK_CENTRES.find((c) => !reachableCentres(a).includes(c) && !reachableCentres(c).includes(a));
    assert.equal(canSwapWithOriginals(a, far, far, a), true);
  });

  test("is symmetric — argument order cannot change the answer", () => {
    const far = UK_CENTRES.find((c) => !reachableCentres(a).includes(c));
    const combos = [[a, null, far, null], [a, far, far, null], [a, far, far, a], [a, null, far, a]];
    for (const [ac, ao, bc, bo] of combos) {
      assert.equal(canSwapWithOriginals(ac, ao, bc, bo), canSwapWithOriginals(bc, bo, ac, ao),
        `asymmetry for ${ac}/${ao} vs ${bc}/${bo}`);
    }
  });
});

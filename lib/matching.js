import { db } from "./db";
import { sendSwapRequestEmail, sendContactExchange, sendExpiredNotification, sendActionNeededEmail, sendMatchFoundEmail, sendDeclinedNotification } from "./email";
import { refundPayment } from "./stripe";
import { reachableCentres, canSwapWithOriginals } from "./centres";
import { SWAP_DEADLINE_HOURS } from "./swap-window";

// DVSA rule: a swap must be requested at least 10 full working days before the
// EARLIEST of the two tests. (The later-seeker always holds the earlier date.)
// NOTE: this counts Mon–Fri only; it does not yet exclude UK bank holidays.
var MIN_SWAP_WORKING_DAYS = 10;

function workingDaysBetween(from, target) {
  var d = new Date(from); d.setHours(0, 0, 0, 0);
  var t = new Date(target); t.setHours(0, 0, 0, 0);
  var count = 0;
  d.setDate(d.getDate() + 1); // start counting from the day after `from`
  while (d < t) {
    var day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function workingDaysUntil(target) {
  return workingDaysBetween(new Date(), target);
}

// The earliest of the two tests must be far enough out to be swappable.
export function swapStillAllowed(earliestTestDate) {
  return workingDaysUntil(earliestTestDate) >= MIN_SWAP_WORKING_DAYS;
}

// The last moment at which this swap could still be actioned by DVSA.
//
// The 10 working day rule is checked when a match is created but never again,
// so a match can sit open past the point where DVSA would refuse it and then
// "expire" long after it was already dead. With a 24 hour window that was
// mostly theoretical. At 3 days it is not, so the window gets clamped: there is
// no value in holding two listings hostage for a swap that can no longer happen.
//
// Returns null if the rule is already broken, which createMatch rejects anyway.
export function swapCutoff(earliestTestDate) {
  var day = new Date(); day.setHours(23, 59, 0, 0);
  var last = null;
  // Terminates: each step moves `day` forward, which can only reduce the count.
  while (workingDaysBetween(day, earliestTestDate) >= MIN_SWAP_WORKING_DAYS) {
    last = new Date(day);
    day.setDate(day.getDate() + 1);
  }
  return last;
}

// ── Matching ──────────────────────────────────────────────
// Simplified: no date-preference intervals. An EARLIER-seeker accepts any date
// earlier than their current test; a LATER-seeker accepts any later date. So a
// match is just: opposite type + compatible centre + the LATER listing's date is
// strictly before the EARLIER listing's date (so the swap benefits both).

export async function findMatches(earlierListing) {
  // Candidate's current centre must be one this learner can move to; same test
  // type (DVSA rule); the LATER slot must be earlier than ours.
  var matchableCentres = reachableCentres(earlierListing.centre, earlierListing.originalCentre);
  var matches = await db.listing.findMany({
    where: {
      type: "LATER",
      status: "AVAILABLE",
      testType: earlierListing.testType,
      centre: { in: matchableCentres },
      lockedByMatchId: null,
      userId: { not: earlierListing.userId },
      currentDate: { lt: earlierListing.currentDate },
    },
    // Do NOT expose the candidate's name (or any PII) before a swap is agreed.
    orderBy: { currentDate: "asc" },
  });
  // Both learners must be able to reach each other's centre (bidirectional), and
  // the earliest test (the candidate's) must leave DVSA's 10-working-day window.
  return matches.filter(function(m) {
    if (!swapStillAllowed(m.currentDate)) return false;
    return canSwapWithOriginals(earlierListing.centre, earlierListing.originalCentre, m.centre, m.originalCentre);
  });
}

export async function findMatchesForLater(laterListing) {
  // The later-seeker holds the earlier of the two dates, so if THEIR test is
  // inside DVSA's 10-working-day window no swap can be requested at all.
  if (!swapStillAllowed(laterListing.currentDate)) return [];
  var matchableCentres = reachableCentres(laterListing.centre, laterListing.originalCentre);
  var matches = await db.listing.findMany({
    where: {
      type: "EARLIER",
      status: "AVAILABLE",
      testType: laterListing.testType,
      centre: { in: matchableCentres },
      lockedByMatchId: null,
      userId: { not: laterListing.userId },
      currentDate: { gt: laterListing.currentDate },
    },
    // Do NOT expose the candidate's name (or any PII) before a swap is agreed.
    orderBy: { currentDate: "asc" },
  });
  return matches.filter(function(m) {
    return canSwapWithOriginals(laterListing.centre, laterListing.originalCentre, m.centre, m.originalCentre);
  });
}

// ── Create match ──────────────────────────────────────────
// Locks both listings and opens a single response window (see lib/swap-window).
// No payment/consent yet.

export async function createMatch(earlierListingId, laterListingId, initiatorUserId) {
  try {
    var result = await db.$transaction(async function(tx) {
      var laterListing = await tx.listing.findUnique({ where: { id: laterListingId } });
      if (!laterListing) throw new Error("Listing not found");
      if (laterListing.status !== "AVAILABLE") throw new Error("This slot is no longer available");
      if (laterListing.lockedByMatchId) throw new Error("This slot is locked by another match");
      var earlierListing = await tx.listing.findUnique({ where: { id: earlierListingId } });
      if (!earlierListing) throw new Error("Your listing was not found");
      if (earlierListing.status !== "AVAILABLE") throw new Error("Your listing is no longer available");
      // Access control: the initiator MUST own one of the two listings (IDOR guard).
      if (initiatorUserId !== earlierListing.userId && initiatorUserId !== laterListing.userId) {
        throw new Error("You can only start a swap from your own listing");
      }
      if (earlierListing.userId === laterListing.userId) {
        throw new Error("You cannot match a listing with your own listing");
      }
      // DVSA: the earliest of the two tests (the later-seeker's) must be at least
      // 10 full working days away for the swap to be requestable.
      if (!swapStillAllowed(laterListing.currentDate)) {
        throw new Error("This swap can no longer be requested — DVSA needs at least 10 working days before the earliest of the two tests.");
      }
      // Never let the window outlive the point where DVSA would refuse the change.
      var deadline = new Date(Date.now() + SWAP_DEADLINE_HOURS * 60 * 60 * 1000);
      var cutoff = swapCutoff(laterListing.currentDate);
      if (cutoff && deadline > cutoff) deadline = cutoff;
      var match = await tx.match.create({
        data: {
          earlierUserId: earlierListing.userId, laterUserId: laterListing.userId,
          earlierListingId: earlierListingId, laterListingId: laterListingId,
          initiatedByUserId: initiatorUserId, status: "PENDING",
          payDeadline: deadline,
        },
      });
      await tx.listing.update({ where: { id: laterListingId }, data: { status: "LOCKED", lockedByMatchId: match.id } });
      await tx.listing.update({ where: { id: earlierListingId }, data: { status: "LOCKED", lockedByMatchId: match.id } });
      return match;
    });
    var match = await db.match.findUnique({
      where: { id: result.id },
      include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
    });
    var responder = (match.initiatedByUserId === match.earlierUserId) ? match.laterUser : match.earlierUser;
    var initiatorListing = (match.initiatedByUserId === match.earlierUserId) ? match.earlierListing : match.laterListing;
    var responderListing = (match.initiatedByUserId === match.earlierUserId) ? match.laterListing : match.earlierListing;
    // Match + locks are already committed; an email failure must not fail the match.
    try {
      await sendSwapRequestEmail(match, responder, initiatorListing, responderListing);
    } catch (e) {
      console.error("Swap request email failed:", e?.message);
    }
    return { match: result, error: null };
  } catch (error) {
    return { match: null, error: error.message };
  }
}

// ── Completion (dual consent + earlier's £8 payment) ──────
// A match completes only when BOTH parties have accepted the data-sharing
// disclaimer AND the earlier-date seeker has paid the swap fee.

export async function maybeCompleteMatch(matchId) {
  var match = await db.match.findUnique({
    where: { id: matchId },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  if (!match || match.status !== "PENDING") return { completed: false };
  if (!(match.earlierConsentAt && match.laterConsentAt && match.earlierPaid)) return { completed: false };

  await db.$transaction(async function(tx) {
    await tx.match.update({ where: { id: matchId }, data: { status: "COMPLETED", completedAt: new Date() } });
    await tx.listing.update({ where: { id: match.earlierListingId }, data: { status: "MATCHED" } });
    await tx.listing.update({ where: { id: match.laterListingId }, data: { status: "MATCHED" } });
  });
  try { await sendContactExchange(match); } catch (e) { console.error("Contact exchange email failed:", e?.message); }
  return { completed: true };
}

// Record a party's acceptance of the data-sharing disclaimer.
// The later-seeker uses this directly (free). The earlier-seeker's consent is
// captured at pay time, but this also works for them.
export async function recordConsent(matchId, userId) {
  var match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found");
  if (match.earlierUserId !== userId && match.laterUserId !== userId) throw new Error("You are not part of this match");
  if (match.status !== "PENDING") throw new Error("This match is no longer pending");
  var isEarlier = userId === match.earlierUserId;
  await db.match.update({
    where: { id: matchId },
    data: isEarlier ? { earlierConsentAt: new Date() } : { laterConsentAt: new Date() },
  });
  var result = await maybeCompleteMatch(matchId);
  // If not complete yet, tell the other party their partner agreed.
  //
  // Not when the initiator is the one agreeing. They agree moments after the
  // match is created, so the other party would get "your swap partner agreed,
  // you are one step away" seconds after the request email, having done nothing
  // yet. This email is written for the reverse order — the person who was asked
  // agrees, and the asker is told to confirm — which is the only case it now
  // fires in.
  if (!result.completed && userId !== match.initiatedByUserId) {
    try {
      var m = await db.match.findUnique({ where: { id: matchId }, include: { earlierUser: true, laterUser: true, earlierListing: true, laterListing: true } });
      var other = userId === m.earlierUserId ? m.laterUser : m.earlierUser;
      await sendActionNeededEmail(other, m);
    } catch (e) { console.error("Action-needed email failed:", e?.message); }
  }
  return result;
}

// Called from the Stripe webhook once the earlier-seeker's £8 payment succeeds.
export async function completeSwapPayment(matchId, payingUserId, stripePaymentId) {
  var match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found");
  if (payingUserId !== match.earlierUserId) throw new Error("Only the earlier-date seeker pays the swap fee");
  await db.match.update({
    where: { id: matchId },
    data: {
      earlierPaid: true,
      earlierPaymentId: stripePaymentId,
      // Consent is captured before checkout, but guarantee it's set on payment too.
      earlierConsentAt: match.earlierConsentAt || new Date(),
    },
  });
  var result = await maybeCompleteMatch(matchId);
  // Earlier-seeker just agreed/paid; if the later-seeker hasn't consented yet, nudge them.
  // Skipped when the earlier-seeker is the initiator, for the same reason as in
  // recordConsent: the later-seeker has only just been sent the request.
  if (!result.completed && payingUserId !== match.initiatedByUserId) {
    try {
      var m = await db.match.findUnique({ where: { id: matchId }, include: { earlierUser: true, laterUser: true, earlierListing: true, laterListing: true } });
      await sendActionNeededEmail(m.laterUser, m);
    } catch (e) { console.error("Action-needed email failed:", e?.message); }
  }
  return result;
}

// ── Match alerts ──────────────────────────────────────────
// Matching only ever ran when somebody created a listing or opened their
// dashboard, and nothing told them a swap had appeared since. People were
// sitting on live matches without knowing. This walks the available listings
// and emails the owner when there is something waiting.
//
// Deliberately quiet: a listing is only alerted if it has not been alerted in
// the last ALERT_COOLDOWN_DAYS. Nobody gets the same nudge every morning.

var ALERT_COOLDOWN_DAYS = 7;

export async function sendMatchAlerts(options) {
  var opts = options || {};
  var dryRun = !!opts.dryRun;
  var now = new Date();
  var cooldownBefore = new Date(now.getTime() - ALERT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  var today = new Date(now); today.setHours(0, 0, 0, 0);

  var listings = await db.listing.findMany({
    where: {
      status: "AVAILABLE",
      lockedByMatchId: null,
      // A test that has already happened cannot be swapped.
      currentDate: { gte: today },
      OR: [{ lastMatchAlertAt: null }, { lastMatchAlertAt: { lt: cooldownBefore } }],
    },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  var alerted = 0, skipped = 0, failed = 0;
  var details = [];

  for (var i = 0; i < listings.length; i++) {
    var listing = listings[i];
    var matches = [];
    try {
      matches = listing.type === "EARLIER"
        ? await findMatches(listing)
        : await findMatchesForLater(listing);
    } catch (e) {
      console.error("Match lookup failed for listing", listing.id, e?.message);
      failed++;
      continue;
    }

    if (!matches.length) { skipped++; continue; }

    details.push({
      listingId: listing.id,
      centre: listing.centre,
      type: listing.type,
      email: listing.user.email,
      matches: matches.length,
    });

    if (dryRun) { alerted++; continue; }

    try {
      await sendMatchFoundEmail(listing.user, listing, matches);
      // Stamped only after the email is away, so a send failure is retried on
      // the next run rather than silently swallowed for a week.
      await db.listing.update({ where: { id: listing.id }, data: { lastMatchAlertAt: now } });
      alerted++;
    } catch (e) {
      console.error("Match alert failed for listing", listing.id, e?.message);
      failed++;
    }
  }

  return { considered: listings.length, alerted: alerted, noMatches: skipped, failed: failed, details: details };
}

// ── Expiry / decline ──────────────────────────────────────

async function expireOne(match, now) {
  if (match.earlierPaid && match.earlierPaymentId) {
    try { await refundPayment(match.earlierPaymentId); } catch (e) { /* best-effort */ }
  }
  await db.$transaction(async function(tx) {
    await tx.match.update({ where: { id: match.id }, data: { status: "EXPIRED", expiredAt: now } });
    await tx.listing.update({ where: { id: match.earlierListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
    await tx.listing.update({ where: { id: match.laterListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
  });
  try { await sendExpiredNotification(match, "expired"); } catch (e) { /* best-effort */ }
}

// A listing whose test date has passed is dead. DVSA cannot move a test that
// has already happened, so it can never be part of a swap.
//
// Left alone these accumulate, and they do real harm rather than just sitting
// there: creating a listing is rejected when one already exists at the same
// centre, so somebody whose test date passed and who has since rebooked is told
// "you already have an active listing at this centre" and cannot list the new
// one. Thirty-nine people were in exactly that position when this was written,
// with no way to see why.
export async function expireStaleListings() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  // AVAILABLE only. A LOCKED listing belongs to a live match, and that match's
  // own deadline releases it; expiring it here would break the match underneath
  // whoever is still deciding.
  var result = await db.listing.updateMany({
    where: { status: "AVAILABLE", currentDate: { lt: today } },
    data: { status: "EXPIRED" },
  });
  return { expired: result.count };
}

export async function expireStaleMatches() {
  var now = new Date();
  var stale = await db.match.findMany({
    where: { status: "PENDING", payDeadline: { lt: now } },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  for (var i = 0; i < stale.length; i++) {
    await expireOne(stale[i], now);
  }
  return { expired: stale.length };
}

export async function declineMatch(matchId, userId) {
  var match = await db.match.findUnique({
    where: { id: matchId },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  if (!match) throw new Error("Match not found");
  // Access control: the user must be one of the two parties (IDOR guard).
  if (match.earlierUserId !== userId && match.laterUserId !== userId) throw new Error("You are not part of this match");
  if (match.initiatedByUserId === userId) throw new Error("You initiated this match — you cannot decline it");
  // Refund the earlier-seeker if they had already paid before the decline.
  if (match.earlierPaid && match.earlierPaymentId) {
    try { await refundPayment(match.earlierPaymentId); } catch (e) { /* best-effort */ }
  }
  await db.$transaction(async function(tx) {
    await tx.match.update({ where: { id: matchId }, data: { status: "DECLINED" } });
    await tx.listing.update({ where: { id: match.earlierListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
    await tx.listing.update({ where: { id: match.laterListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
  });
  // Tell the person who asked. Without this a decline is silent and they only
  // find out by opening the dashboard, which is worse than the timeout path —
  // that at least sends something. Best-effort: the decline itself has committed.
  try { await sendDeclinedNotification(match); } catch (e) { /* best-effort */ }
  return { success: true };
}

export async function checkAndExpireMatch(matchId) {
  var now = new Date();
  var match = await db.match.findUnique({
    where: { id: matchId },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  if (!match) return null;
  if (match.status === "PENDING" && match.payDeadline && now > new Date(match.payDeadline)) {
    await expireOne(match, now);
    return await db.match.findUnique({
      where: { id: matchId },
      include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
    });
  }
  return match;
}

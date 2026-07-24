import { db } from "./db";
import { sendSwapRequestEmail, sendContactExchange, sendExpiredNotification, sendActionNeededEmail, sendSwapReminderEmail } from "./email";
import { scheduleMatchJobs } from "./scheduler";
import { refundPayment } from "./stripe";
import { reachableCentres, canSwapWithOriginals } from "./centres";
import { listingOwnerActive } from "./subscription";

// How long a match stays open for both parties to agree.
// Guarded: a malformed env value would otherwise make payDeadline an Invalid
// Date, and matches would never expire back into the pool.
var SWAP_DEADLINE_HOURS = (function() {
  var hours = parseInt(process.env.SWAP_DEADLINE_HOURS || "24", 10);
  return Number.isFinite(hours) && hours > 0 ? hours : 24;
})();

// DVSA rule: a swap must be requested at least 10 full working days before the
// EARLIEST of the two tests. (The later-seeker always holds the earlier date.)
// NOTE: this counts Mon–Fri only; it does not yet exclude UK bank holidays.
var MIN_SWAP_WORKING_DAYS = 10;

function workingDaysUntil(target) {
  var d = new Date(); d.setHours(0, 0, 0, 0);
  var t = new Date(target); t.setHours(0, 0, 0, 0);
  var count = 0;
  d.setDate(d.getDate() + 1); // start counting from tomorrow
  while (d < t) {
    var day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// The earliest of the two tests must be far enough out to be swappable.
export function swapStillAllowed(earliestTestDate) {
  return workingDaysUntil(earliestTestDate) >= MIN_SWAP_WORKING_DAYS;
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
      // Listings belonging to lapsed subscribers are hidden, not deleted — they
      // return to the pool as soon as the owner resubscribes.
      ...listingOwnerActive(),
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
      // See findMatches — lapsed subscribers' listings are hidden from the pool.
      ...listingOwnerActive(),
    },
    // Do NOT expose the candidate's name (or any PII) before a swap is agreed.
    orderBy: { currentDate: "asc" },
  });
  return matches.filter(function(m) {
    return canSwapWithOriginals(laterListing.centre, laterListing.originalCentre, m.centre, m.originalCentre);
  });
}

// ── Create match ──────────────────────────────────────────
// Locks both listings and opens a single 24h window. No payment/consent yet.

export async function createMatch(earlierListingId, laterListingId, initiatorUserId) {
  var deadline = new Date(Date.now() + SWAP_DEADLINE_HOURS * 60 * 60 * 1000);
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
    // Schedule the nudges and the expiry now, while we know the deadline.
    // Best-effort: the daily cron still expires the match if this fails.
    try {
      await scheduleMatchJobs(result.id, SWAP_DEADLINE_HOURS);
    } catch (e) {
      console.error("Could not schedule match jobs:", e?.message);
    }
    return { match: result, error: null };
  } catch (error) {
    return { match: null, error: error.message };
  }
}

// ── Completion (dual consent) ─────────────────────────────
// A match completes as soon as BOTH parties have accepted the data-sharing
// disclaimer. Swaps carry no fee — they're covered by the £1/week subscription.

export async function maybeCompleteMatch(matchId) {
  var match = await db.match.findUnique({
    where: { id: matchId },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  if (!match || match.status !== "PENDING") return { completed: false };
  if (!(match.earlierConsentAt && match.laterConsentAt)) return { completed: false };

  await db.$transaction(async function(tx) {
    await tx.match.update({ where: { id: matchId }, data: { status: "COMPLETED", completedAt: new Date() } });
    await tx.listing.update({ where: { id: match.earlierListingId }, data: { status: "MATCHED" } });
    await tx.listing.update({ where: { id: match.laterListingId }, data: { status: "MATCHED" } });
  });
  try { await sendContactExchange(match); } catch (e) { console.error("Contact exchange email failed:", e?.message); }
  return { completed: true };
}

// Record a party's acceptance of the data-sharing disclaimer. Both sides use
// this; it is the only step needed to complete a match.
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
  if (!result.completed) {
    try {
      var m = await db.match.findUnique({ where: { id: matchId }, include: { earlierUser: true, laterUser: true, earlierListing: true, laterListing: true } });
      var other = userId === m.earlierUserId ? m.laterUser : m.earlierUser;
      await sendActionNeededEmail(other, m);
    } catch (e) { console.error("Action-needed email failed:", e?.message); }
  }
  return result;
}

// ── Reminders ─────────────────────────────────────────────
// Nudge whoever still hasn't agreed as the deadline nears. Called by the
// scheduled job in /api/jobs/match. Safe to call more than once — QStash may
// retry — because it only ever sends email, and skips anyone who has agreed.

export async function remindPendingParties(matchId, hoursLeft) {
  var match = await db.match.findUnique({
    where: { id: matchId },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  if (!match) return { reminded: 0, reason: "not_found" };
  if (match.status !== "PENDING") return { reminded: 0, reason: "not_pending" };

  // If the window closed before this fired, expire rather than nudge — no point
  // asking someone to act on a dead match.
  if (match.payDeadline && new Date() > new Date(match.payDeadline)) {
    await expireOne(match, new Date());
    return { reminded: 0, reason: "expired_instead" };
  }

  // Only the party who hasn't agreed. Usually one person; both if neither has.
  var targets = [];
  if (!match.earlierConsentAt) targets.push(match.earlierUser);
  if (!match.laterConsentAt) targets.push(match.laterUser);

  var sent = 0;
  for (var i = 0; i < targets.length; i++) {
    try {
      await sendSwapReminderEmail(targets[i], match, hoursLeft);
      sent++;
    } catch (e) {
      console.error("Reminder email failed for", targets[i].id, e?.message);
    }
  }
  return { reminded: sent, reason: null };
}

// ── Expiry / decline ──────────────────────────────────────

async function expireOne(match, now) {
  // LEGACY: refund an £8 swap fee taken under the old pricing model. New matches
  // are never charged, so this is a no-op for them.
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
  var match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found");
  // Access control: the user must be one of the two parties (IDOR guard).
  if (match.earlierUserId !== userId && match.laterUserId !== userId) throw new Error("You are not part of this match");
  if (match.initiatedByUserId === userId) throw new Error("You initiated this match — you cannot decline it");
  // LEGACY: refund the earlier-seeker if they paid under the old swap-fee model.
  if (match.earlierPaid && match.earlierPaymentId) {
    try { await refundPayment(match.earlierPaymentId); } catch (e) { /* best-effort */ }
  }
  await db.$transaction(async function(tx) {
    await tx.match.update({ where: { id: matchId }, data: { status: "DECLINED" } });
    await tx.listing.update({ where: { id: match.earlierListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
    await tx.listing.update({ where: { id: match.laterListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
  });
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

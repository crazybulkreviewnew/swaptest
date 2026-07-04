import { db } from "./db";
import { sendSwapRequestEmail, sendContactExchange, sendExpiredNotification, sendActionNeededEmail } from "./email";
import { refundPayment } from "./stripe";
import { reachableCentres, canSwapWithOriginals } from "./centres";

// How long a match stays open for both parties to consent + the earlier-seeker to pay.
var SWAP_DEADLINE_HOURS = parseInt(process.env.SWAP_DEADLINE_HOURS || "24", 10);

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
  // Both learners must be able to reach each other's centre (bidirectional).
  return matches.filter(function(m) {
    return canSwapWithOriginals(earlierListing.centre, earlierListing.originalCentre, m.centre, m.originalCentre);
  });
}

export async function findMatchesForLater(laterListing) {
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
  if (!result.completed) {
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
  if (!result.completed) {
    try {
      var m = await db.match.findUnique({ where: { id: matchId }, include: { earlierUser: true, laterUser: true, earlierListing: true, laterListing: true } });
      await sendActionNeededEmail(m.laterUser, m);
    } catch (e) { console.error("Action-needed email failed:", e?.message); }
  }
  return result;
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
  // Refund the earlier-seeker if they had already paid before the decline.
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

import { db } from "./db";
import { sendSwapRequestEmail, sendPayNowEmail, sendContactExchange, sendExpiredNotification, sendRefundNotification } from "./email";
import { refundPayment } from "./stripe";
import { getMatchableCentres, canSwapCentres } from "./centres";

var TIMEOUT_MINUTES = parseInt(process.env.MATCH_TIMEOUT_MINUTES || "30", 10);

export async function findMatches(earlierListing) {
  var matchableCentres = getMatchableCentres(earlierListing.centre);
  var matches = await db.listing.findMany({
    where: {
      type: "LATER", status: "AVAILABLE", centre: { in: matchableCentres }, lockedByMatchId: null,
      currentDate: {
        gte: earlierListing.preferredDateFrom,
        ...(earlierListing.preferredDateTo ? { lte: earlierListing.preferredDateTo } : { lt: earlierListing.currentDate }),
      },
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { currentDate: "asc" },
  });
  return matches.filter(function(m) {
    if (new Date(m.currentDate) >= new Date(earlierListing.currentDate)) return false;
    if (!canSwapCentres(earlierListing.centre, m.centre)) return false;
    var earlierDate = new Date(earlierListing.currentDate);
    var laterWantsFrom = new Date(m.preferredDateFrom);
    var laterWantsTo = m.preferredDateTo ? new Date(m.preferredDateTo) : null;
    if (earlierDate < laterWantsFrom) return false;
    if (laterWantsTo && earlierDate > laterWantsTo) return false;
    return true;
  });
}

export async function findMatchesForLater(laterListing) {
  var matchableCentres = getMatchableCentres(laterListing.centre);
  var matches = await db.listing.findMany({
    where: {
      type: "EARLIER", status: "AVAILABLE", centre: { in: matchableCentres }, lockedByMatchId: null,
      currentDate: {
        gte: laterListing.preferredDateFrom,
        ...(laterListing.preferredDateTo ? { lte: laterListing.preferredDateTo } : undefined),
      },
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { currentDate: "asc" },
  });
  return matches.filter(function(m) {
    if (new Date(m.currentDate) <= new Date(laterListing.currentDate)) return false;
    if (!canSwapCentres(laterListing.centre, m.centre)) return false;
    var laterDate = new Date(laterListing.currentDate);
    var earlierWantsFrom = new Date(m.preferredDateFrom);
    var earlierWantsTo = m.preferredDateTo ? new Date(m.preferredDateTo) : new Date(m.currentDate);
    if (laterDate < earlierWantsFrom) return false;
    if (laterDate > earlierWantsTo) return false;
    return true;
  });
}

export async function createMatch(earlierListingId, laterListingId, initiatorUserId) {
  var deadline = new Date(Date.now() + TIMEOUT_MINUTES * 60 * 1000);
  try {
    var result = await db.$transaction(async function(tx) {
      var laterListing = await tx.listing.findUnique({ where: { id: laterListingId } });
      if (!laterListing) throw new Error("Listing not found");
      if (laterListing.status !== "AVAILABLE") throw new Error("This slot is no longer available");
      if (laterListing.lockedByMatchId) throw new Error("This slot is locked by another match");
      var earlierListing = await tx.listing.findUnique({ where: { id: earlierListingId } });
      if (!earlierListing) throw new Error("Your listing was not found");
      if (earlierListing.status !== "AVAILABLE") throw new Error("Your listing is no longer available");
      var initiatorIsEarlier = (initiatorUserId === earlierListing.userId);
      var initialStatus = initiatorIsEarlier ? "PENDING_LATER_PAY" : "PENDING_EARLIER_PAY";
      var match = await tx.match.create({
        data: {
          earlierUserId: earlierListing.userId, laterUserId: laterListing.userId,
          earlierListingId: earlierListingId, laterListingId: laterListingId,
          initiatedByUserId: initiatorUserId, status: initialStatus,
          laterPayDeadline: initiatorIsEarlier ? deadline : new Date(0),
          earlierPayDeadline: initiatorIsEarlier ? null : deadline,
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
    await sendSwapRequestEmail(match, responder, initiatorListing, responderListing);
    return { match: result, error: null };
  } catch (error) {
    return { match: null, error: error.message };
  }
}

export async function processPayment(matchId, payingUserId, stripePaymentId) {
  var match = await db.match.findUnique({
    where: { id: matchId },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  if (!match) throw new Error("Match not found");
  var isEarlierPaying = (payingUserId === match.earlierUserId);
  var isLaterPaying = (payingUserId === match.laterUserId);
  if (!isEarlierPaying && !isLaterPaying) throw new Error("User is not part of this match");
  var otherAlreadyPaid = isLaterPaying ? match.earlierPaid : match.laterPaid;
  if (otherAlreadyPaid) {
    await db.$transaction(async function(tx) {
      var updateData = { status: "COMPLETED", completedAt: new Date() };
      if (isEarlierPaying) { updateData.earlierPaid = true; updateData.earlierPaymentId = stripePaymentId; }
      else { updateData.laterPaid = true; updateData.laterPaymentId = stripePaymentId; }
      await tx.match.update({ where: { id: matchId }, data: updateData });
      await tx.listing.update({ where: { id: match.earlierListingId }, data: { status: "MATCHED" } });
      await tx.listing.update({ where: { id: match.laterListingId }, data: { status: "MATCHED" } });
    });
    await sendContactExchange(match);
    return { success: true, completed: true };
  }
  var newDeadline = new Date(Date.now() + TIMEOUT_MINUTES * 60 * 1000);
  var newStatus = isLaterPaying ? "PENDING_EARLIER_PAY" : "PENDING_LATER_PAY";
  var updateData = { status: newStatus };
  if (isEarlierPaying) { updateData.earlierPaid = true; updateData.earlierPaymentId = stripePaymentId; updateData.laterPayDeadline = newDeadline; }
  else { updateData.laterPaid = true; updateData.laterPaymentId = stripePaymentId; updateData.earlierPayDeadline = newDeadline; }
  await db.match.update({ where: { id: matchId }, data: updateData });
  var otherUser = isLaterPaying ? match.earlierUser : match.laterUser;
  var otherListing = isLaterPaying ? match.earlierListing : match.laterListing;
  await sendPayNowEmail(match, otherUser, otherListing);
  return { success: true, completed: false };
}

export async function expireStaleMatches() {
  var now = new Date();
  var expired = 0;
  var timer1Expired = await db.match.findMany({
    where: { status: "PENDING_LATER_PAY", laterPayDeadline: { lt: now, gt: new Date(1000) } },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  for (var i = 0; i < timer1Expired.length; i++) {
    var m = timer1Expired[i];
    if (m.earlierPaid && m.earlierPaymentId) { try { await refundPayment(m.earlierPaymentId); } catch(e) {} }
    await db.$transaction(async function(tx) {
      await tx.match.update({ where: { id: m.id }, data: { status: "EXPIRED_TIMER1", expiredAt: now } });
      await tx.listing.update({ where: { id: m.earlierListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
      await tx.listing.update({ where: { id: m.laterListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
    });
    try { await sendExpiredNotification(m, "timer1"); } catch(e) {} expired++;
  }
  var timer2Expired = await db.match.findMany({
    where: { status: "PENDING_EARLIER_PAY", earlierPayDeadline: { lt: now, gt: new Date(1000) } },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  for (var j = 0; j < timer2Expired.length; j++) {
    var m2 = timer2Expired[j];
    if (m2.laterPaid && m2.laterPaymentId) { try { await refundPayment(m2.laterPaymentId); } catch(e) {} }
    await db.$transaction(async function(tx) {
      await tx.match.update({ where: { id: m2.id }, data: { status: "EXPIRED_TIMER2", expiredAt: now } });
      await tx.listing.update({ where: { id: m2.earlierListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
      await tx.listing.update({ where: { id: m2.laterListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
    });
    try { await sendRefundNotification(m2); } catch(e) {} expired++;
  }
  return { expired: expired };
}

export async function declineMatch(matchId, userId) {
  var match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found");
  if (match.initiatedByUserId === userId) throw new Error("You initiated this match — you cannot decline it");
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
  var isExpiredLater = match.status === "PENDING_LATER_PAY" && match.laterPayDeadline && new Date(match.laterPayDeadline) > new Date(1000) && now > new Date(match.laterPayDeadline);
  var isExpiredEarlier = match.status === "PENDING_EARLIER_PAY" && match.earlierPayDeadline && new Date(match.earlierPayDeadline) > new Date(1000) && now > new Date(match.earlierPayDeadline);
  if (isExpiredLater || isExpiredEarlier) {
    if (match.laterPaid && match.laterPaymentId) { try { await refundPayment(match.laterPaymentId); } catch(e) {} }
    if (match.earlierPaid && match.earlierPaymentId) { try { await refundPayment(match.earlierPaymentId); } catch(e) {} }
    await db.$transaction(async function(tx) {
      await tx.match.update({ where: { id: matchId }, data: { status: isExpiredLater ? "EXPIRED_TIMER1" : "EXPIRED_TIMER2", expiredAt: now } });
      await tx.listing.update({ where: { id: match.earlierListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
      await tx.listing.update({ where: { id: match.laterListingId }, data: { status: "AVAILABLE", lockedByMatchId: null } });
    });
    try { await sendExpiredNotification(match, isExpiredLater ? "timer1" : "timer2"); } catch(e) {}
    return await db.match.findUnique({ where: { id: matchId }, include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true } });
  }
  return match;
}

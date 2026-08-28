import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { validateListing } from "@/lib/validation";
import { findMatches, findMatchesForLater } from "@/lib/matching";
import { canRequestSwap, accessReason, listingRequiresMembership } from "@/lib/subscription";

export async function POST(request) {
  var user = await requireAuth();

  var body = await request.json();
  var type = body.type;
  var centre = body.centre;
  var testType = body.testType;
  var originalCentre = body.originalCentre || null;
  var currentDate = body.currentDate;
  var currentTime = body.currentTime;

  var validation = validateListing({ type: type, centre: centre, testType: testType, originalCentre: originalCentre, currentDate: currentDate, currentTime: currentTime });
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  // Listing an EARLIER test needs a membership; listing a LATER one is free.
  // Validation runs first so somebody with a typo in their date is told about
  // the typo rather than being sent to a card form and finding out afterwards.
  //
  // Read fresh: the session token predates any subscription bought since.
  if (listingRequiresMembership(type)) {
    var current = await db.user.findUnique({ where: { id: user.id } });
    if (!canRequestSwap(current)) {
      return NextResponse.json({
        error: "SUBSCRIPTION_REQUIRED",
        reason: accessReason(current),
        errors: ["You need a SwapTest membership to list a test when you are looking for an earlier date. Listing a test you are happy to move later is free."],
      }, { status: 402 });
    }
  }

  // Only a listing for a test that has not happened yet should block a new one.
  // Without the date check, somebody whose test date passed could never list
  // their rebooked test at the same centre, and the error told them they had an
  // active listing when what they actually had was a dead one.
  var todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  var existing = await db.listing.findFirst({
    where: {
      userId: user.id, centre: centre,
      status: { in: ["AVAILABLE", "LOCKED"] },
      currentDate: { gte: todayStart },
    },
  });
  if (existing) {
    return NextResponse.json({ errors: ["You already have an active listing at this centre"] }, { status: 409 });
  }

  var listing = await db.listing.create({
    data: {
      userId: user.id, type: type, centre: centre,
      testType: testType, originalCentre: originalCentre,
      currentDate: new Date(currentDate), currentTime: currentTime,
      status: "AVAILABLE",
    },
  });

  var matches = [];
  if (type === "EARLIER") {
    matches = await findMatches(listing);
  } else {
    matches = await findMatchesForLater(listing);
  }

  return NextResponse.json({ listing: listing, matches: matches });
}

export async function GET() {
  var user = await requireAuth();

  var listings = await db.listing.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      // No partner PII here — the dashboard only needs match status/deadline.
      matchesAsEarlier: {
        where: { status: { notIn: ["EXPIRED", "DECLINED", "CANCELLED"] } },
      },
      matchesAsLater: {
        where: { status: { notIn: ["EXPIRED", "DECLINED", "CANCELLED"] } },
      },
    },
  });

  var newMatches = [];
  for (var i = 0; i < listings.length; i++) {
    var l = listings[i];
    var hasActiveMatch = (l.matchesAsEarlier && l.matchesAsEarlier.length > 0) || (l.matchesAsLater && l.matchesAsLater.length > 0);
    if (l.status === "AVAILABLE" && !hasActiveMatch) {
      var found = [];
      if (l.type === "EARLIER") {
        found = await findMatches(l);
      } else {
        found = await findMatchesForLater(l);
      }
      if (found.length > 0) {
        newMatches.push({ listingId: l.id, listingType: l.type, matches: found });
      }
    }
  }

  return NextResponse.json({ listings: listings, newMatches: newMatches });
}

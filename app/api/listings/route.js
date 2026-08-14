import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { validateListing } from "@/lib/validation";
import { findMatches, findMatchesForLater } from "@/lib/matching";

export async function POST(request) {
  var user = await requireAuth();

  // Listing is free, deliberately. The one-time registration fee that used to
  // gate this is gone, replaced by the £1/week membership, and that membership
  // gates asking for a swap rather than listing.
  //
  // A pool with listings in it is the product. Charging at the point where
  // somebody adds supply shrinks the thing everybody is here for, and it takes
  // money before they have seen a single match. The charge sits at the point
  // where they get something: asking a real person for a real date.

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

  var existing = await db.listing.findFirst({
    where: { userId: user.id, centre: centre, status: { in: ["AVAILABLE", "LOCKED"] } },
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

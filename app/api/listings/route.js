import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { validateListing } from "@/lib/validation";
import { findMatches, findMatchesForLater } from "@/lib/matching";

export async function POST(request) {
  var user = await requireAuth();
  var body = await request.json();
  var type = body.type;
  var centre = body.centre;
  var currentDate = body.currentDate;
  var currentTime = body.currentTime;
  var preferredDateFrom = body.preferredDateFrom;
  var preferredDateTo = body.preferredDateTo;

  var validation = validateListing({ type: type, centre: centre, currentDate: currentDate, currentTime: currentTime, preferredDateFrom: preferredDateFrom, preferredDateTo: preferredDateTo });
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
      currentDate: new Date(currentDate), currentTime: currentTime,
      preferredDateFrom: new Date(preferredDateFrom),
      preferredDateTo: preferredDateTo ? new Date(preferredDateTo) : null,
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
      matchesAsEarlier: {
        where: { status: { notIn: ["EXPIRED_TIMER1", "EXPIRED_TIMER2", "DECLINED", "CANCELLED"] } },
        include: { laterUser: { select: { name: true } }, laterListing: true },
      },
      matchesAsLater: {
        where: { status: { notIn: ["EXPIRED_TIMER1", "EXPIRED_TIMER2", "DECLINED", "CANCELLED"] } },
        include: { earlierUser: { select: { name: true } }, earlierListing: true },
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

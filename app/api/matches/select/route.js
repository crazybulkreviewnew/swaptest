import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createMatch } from "@/lib/matching";
import { getMatchLimiter, checkRateLimit } from "@/lib/ratelimit";
import { canRequestSwap, accessReason } from "@/lib/subscription";

export async function POST(request) {
  var user = await requireAuth();
  var rateLimitError = await checkRateLimit(getMatchLimiter, user.id);
  if (rateLimitError) return rateLimitError;

  var body = await request.json();
  var myListingId = body.myListingId;
  var targetListingId = body.targetListingId;

  // Support old format too
  var earlierListingId = body.earlierListingId;
  var laterListingId = body.laterListingId;

  if (myListingId && targetListingId) {
    // New format: figure out which is earlier and which is later
    var myListing = await db.listing.findUnique({ where: { id: myListingId } });
    var targetListing = await db.listing.findUnique({ where: { id: targetListingId } });
    if (!myListing || !targetListing) {
      return NextResponse.json({ errors: ["Listing not found"] }, { status: 404 });
    }
    if (myListing.type === "EARLIER") {
      earlierListingId = myListingId;
      laterListingId = targetListingId;
    } else {
      earlierListingId = targetListingId;
      laterListingId = myListingId;
    }
  }

  if (!earlierListingId || !laterListingId) {
    return NextResponse.json({ errors: ["Listing IDs are required"] }, { status: 400 });
  }

  // The paywall, and the only one on this route. Membership means one thing:
  // you are chasing an earlier date. Somebody who owns the LATER listing is
  // taking a worse date to make the swap possible, so they ask, accept and
  // list for nothing, whichever side happens to press the button first.
  //
  // Mostly redundant, since listing an EARLIER test already requires a
  // membership, but it catches a subscription that lapsed between listing and
  // asking rather than trusting that the earlier check still holds.
  //
  // Read fresh from the database rather than trusting the session: the token
  // was issued before they subscribed, and a stale copy would lock out somebody
  // who has just paid.
  var earlierListing = (myListing && myListing.id === earlierListingId)
    ? myListing
    : await db.listing.findUnique({ where: { id: earlierListingId } });

  if (earlierListing && earlierListing.userId === user.id) {
    var current = await db.user.findUnique({ where: { id: user.id } });
    if (!canRequestSwap(current)) {
      return NextResponse.json({
        error: "SUBSCRIPTION_REQUIRED",
        reason: accessReason(current),
        errors: ["You need a SwapTest membership to ask for a swap to an earlier date."],
      }, { status: 402 });
    }
  }

  var result = await createMatch(earlierListingId, laterListingId, user.id);
  if (result.error) {
    return NextResponse.json({ errors: [result.error] }, { status: 409 });
  }
  return NextResponse.json({ match: result.match });
}

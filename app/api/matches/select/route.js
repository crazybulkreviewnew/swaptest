import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createMatch } from "@/lib/matching";
import { getMatchLimiter, checkRateLimit } from "@/lib/ratelimit";

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

  var result = await createMatch(earlierListingId, laterListingId, user.id);
  if (result.error) {
    return NextResponse.json({ errors: [result.error] }, { status: 409 });
  }
  return NextResponse.json({ match: result.match });
}

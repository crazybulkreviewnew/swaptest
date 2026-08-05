// GET /api/matches/preview?mine=<listingId>&theirs=<listingId>
//
// Describes a swap that does not exist yet, so the initiator can look at it
// before committing. Nothing is written and nothing is locked.
//
// "Ask to swap" used to create the match immediately, which locked both
// listings, started the clock and emailed the other party before the person
// asking had agreed to anything. This endpoint is what that button navigates to
// instead.
//
// The candidate is validated by running the real matching functions and
// checking this listing is among the results, rather than re-implementing the
// rules here. If the rules change, this changes with them.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { findMatches, findMatchesForLater } from "@/lib/matching";

export async function GET(request) {
  const user = await requireAuth();
  const { searchParams } = new URL(request.url);
  const mineId = searchParams.get("mine");
  const theirsId = searchParams.get("theirs");

  if (!mineId || !theirsId) {
    return NextResponse.json({ errors: ["Both listings are required"] }, { status: 400 });
  }

  const mine = await db.listing.findUnique({ where: { id: mineId } });
  if (!mine) {
    return NextResponse.json({ errors: ["Listing not found"] }, { status: 404 });
  }
  // Access control: you can only preview a swap from your own listing.
  if (mine.userId !== user.id) {
    return NextResponse.json({ errors: ["That is not your listing"] }, { status: 403 });
  }

  const candidates = mine.type === "EARLIER"
    ? await findMatches(mine)
    : await findMatchesForLater(mine);

  const theirs = candidates.find((c) => c.id === theirsId);
  if (!theirs) {
    // Either it was never a valid pairing, or somebody else got there first.
    return NextResponse.json(
      { errors: ["This swap is no longer available. It may have been taken by somebody else."] },
      { status: 409 }
    );
  }

  // Only ever the test details. No name, email or phone until both parties
  // have agreed and contact details are exchanged.
  return NextResponse.json({
    mine: {
      id: mine.id,
      type: mine.type,
      currentDate: mine.currentDate,
      currentTime: mine.currentTime,
      centre: mine.centre,
      testType: mine.testType,
    },
    theirs: {
      id: theirs.id,
      currentDate: theirs.currentDate,
      currentTime: theirs.currentTime,
      centre: theirs.centre,
      testType: theirs.testType,
    },
    sameCentre: mine.centre === theirs.centre,
  });
}

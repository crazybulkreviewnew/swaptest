import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { checkAndExpireMatch } from "@/lib/matching";

export async function GET(request, { params }) {
  var user = await requireAuth();
  var id = (await params).id;

  await checkAndExpireMatch(id);

  var match = await db.match.findUnique({
    where: { id: id },
    include: {
      earlierUser: { select: { id: true, name: true, email: true, phone: true } },
      laterUser: { select: { id: true, name: true, email: true, phone: true } },
      earlierListing: true,
      laterListing: true,
    },
  });

  if (!match) {
    return NextResponse.json({ errors: ["Match not found"] }, { status: 404 });
  }

  if (match.earlierUserId !== user.id && match.laterUserId !== user.id) {
    return NextResponse.json({ errors: ["Unauthorised"] }, { status: 403 });
  }

  var role = match.earlierUserId === user.id ? "earlier" : "later";
  var isInitiator = match.initiatedByUserId === user.id;

  var safeMatch = {
    id: match.id,
    status: match.status,
    earlierPaid: match.earlierPaid,
    earlierConsentAt: match.earlierConsentAt,
    laterConsentAt: match.laterConsentAt,
    // Whether the current viewer has already consented / paid, for the UI.
    youConsented: role === "earlier" ? !!match.earlierConsentAt : !!match.laterConsentAt,
    youPaid: role === "earlier" ? match.earlierPaid : true, // later never pays
    payDeadline: match.payDeadline,
    createdAt: match.createdAt,
    completedAt: match.completedAt,
    initiatedByUserId: match.initiatedByUserId,
    earlierUserId: match.earlierUserId,
    laterUserId: match.laterUserId,
    role: role,
    isInitiator: isInitiator,
    // Contact details only after the swap is COMPLETED.
    earlierUser: match.status === "COMPLETED" ? match.earlierUser : { id: match.earlierUser.id, name: match.earlierUser.name },
    laterUser: match.status === "COMPLETED" ? match.laterUser : { id: match.laterUser.id, name: match.laterUser.name },
    earlierListing: match.earlierListing,
    laterListing: match.laterListing,
  };

  return NextResponse.json({ match: safeMatch });
}

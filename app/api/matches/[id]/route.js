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
    laterPaid: match.laterPaid,
    earlierPaid: match.earlierPaid,
    laterPayDeadline: match.laterPayDeadline,
    earlierPayDeadline: match.earlierPayDeadline,
    createdAt: match.createdAt,
    completedAt: match.completedAt,
    initiatedByUserId: match.initiatedByUserId,
    earlierUserId: match.earlierUserId,
    laterUserId: match.laterUserId,
    role: role,
    isInitiator: isInitiator,
    earlierUser: match.status === "COMPLETED" ? match.earlierUser : { id: match.earlierUser.id, name: match.earlierUser.name },
    laterUser: match.status === "COMPLETED" ? match.laterUser : { id: match.laterUser.id, name: match.laterUser.name },
    earlierListing: match.earlierListing,
    laterListing: match.laterListing,
  };

  return NextResponse.json({ match: safeMatch });
}

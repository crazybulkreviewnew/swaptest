import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendContactExchange } from "@/lib/email";

export async function POST(request, { params }) {
  var user = await requireAuth();
  var id = (await params).id;
  var match = await db.match.findUnique({
    where: { id: id },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  if (!match) return NextResponse.json({ errors: ["Match not found"] }, { status: 404 });
  if (match.initiatedByUserId === user.id) return NextResponse.json({ errors: ["Waiting for the other person to agree"] }, { status: 400 });
  if (match.earlierUserId !== user.id && match.laterUserId !== user.id) return NextResponse.json({ errors: ["You are not part of this match"] }, { status: 403 });
  if (match.status !== "PENDING_LATER_PAY" && match.status !== "PENDING_EARLIER_PAY") return NextResponse.json({ errors: ["This match is no longer pending"] }, { status: 400 });

  await db.$transaction(async function(tx) {
    await tx.match.update({ where: { id: id }, data: { status: "COMPLETED", completedAt: new Date() } });
    await tx.listing.update({ where: { id: match.earlierListingId }, data: { status: "MATCHED" } });
    await tx.listing.update({ where: { id: match.laterListingId }, data: { status: "MATCHED" } });
  });

  var completed = await db.match.findUnique({
    where: { id: id },
    include: { laterUser: true, earlierUser: true, laterListing: true, earlierListing: true },
  });
  try { await sendContactExchange(completed); } catch(e) { console.error("Email failed:", e); }
  return NextResponse.json({ success: true });
}

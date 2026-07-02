import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { validateListing } from "@/lib/validation";

export async function DELETE(request, { params }) {
  var user = await requireAuth();
  var id = (await params).id;
  var listing = await db.listing.findUnique({ where: { id: id } });
  if (!listing) return NextResponse.json({ errors: ["Listing not found"] }, { status: 404 });
  if (listing.userId !== user.id) return NextResponse.json({ errors: ["You can only delete your own listings"] }, { status: 403 });
  if (listing.status === "LOCKED") return NextResponse.json({ errors: ["Cannot delete a listing with an active match"] }, { status: 400 });
  if (listing.status === "MATCHED") return NextResponse.json({ errors: ["Cannot delete a listing that has been swapped"] }, { status: 400 });
  await db.listing.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}

export async function PUT(request, { params }) {
  var user = await requireAuth();
  var id = (await params).id;
  var listing = await db.listing.findUnique({ where: { id: id } });
  if (!listing) return NextResponse.json({ errors: ["Listing not found"] }, { status: 404 });
  if (listing.userId !== user.id) return NextResponse.json({ errors: ["You can only edit your own listings"] }, { status: 403 });
  if (listing.status === "LOCKED") return NextResponse.json({ errors: ["Cannot edit a listing with an active match"] }, { status: 400 });
  if (listing.status === "MATCHED") return NextResponse.json({ errors: ["Cannot edit a listing that has been swapped"] }, { status: 400 });
  var body = await request.json();
  var type = body.type || listing.type;
  var centre = body.centre || listing.centre;
  var currentDate = body.currentDate;
  var currentTime = body.currentTime || listing.currentTime;
  var validation = validateListing({ type: type, centre: centre, currentDate: currentDate, currentTime: currentTime });
  if (!validation.valid) return NextResponse.json({ errors: validation.errors }, { status: 400 });
  var updated = await db.listing.update({
    where: { id: id },
    data: { type: type, centre: centre, currentDate: new Date(currentDate), currentTime: currentTime },
  });
  return NextResponse.json({ listing: updated });
}

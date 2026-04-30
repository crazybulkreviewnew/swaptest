// POST /api/matches/[id]/decline — Later person declines

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { declineMatch } from "@/lib/matching";

export async function POST(request, { params }) {
  const user = await requireAuth();
  const { id } = await params;

  try {
    await declineMatch(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ errors: [error.message] }, { status: 400 });
  }
}

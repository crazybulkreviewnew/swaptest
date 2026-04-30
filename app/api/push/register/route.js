// ============================================================
// POST /api/push/register
// ============================================================
// Stores the iOS push notification device token for a user.
// Called by the native app on launch after getting APNs token.
//
// NOTE: To use this, add these fields to your User model in
// prisma/schema.prisma:
//
//   pushToken    String?   // APNs device token
//   pushPlatform String?   // "ios" or "android"
//
// Then run: npx prisma db push
// ============================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(request) {
  const user = await requireAuth();
  const { token, platform } = await request.json();

  if (!token) {
    return NextResponse.json({ errors: ["Token is required"] }, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      pushToken: token,
      pushPlatform: platform || "ios",
    },
  });

  return NextResponse.json({ success: true });
}

// GET /api/auth/me — returns current user or null

import { NextResponse } from "next/server";
import { getCurrentUser, publicUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  // Shaped, not raw: see publicUser in lib/auth.
  return NextResponse.json({ user: publicUser(user) });
}

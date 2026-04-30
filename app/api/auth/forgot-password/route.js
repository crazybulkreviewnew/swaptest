import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { getAuthLimiter, checkRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";

export async function POST(request) {
  var headersList = await headers();
  var ip = headersList.get("x-forwarded-for") || "unknown";
  var rateLimitError = await checkRateLimit(getAuthLimiter, ip);
  if (rateLimitError) return rateLimitError;

  var body = await request.json();
  var email = body.email;

  if (!email || !email.trim()) {
    return NextResponse.json({ errors: ["Email is required"] }, { status: 400 });
  }

  // Always return success even if email not found (prevents email enumeration)
  var user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    var token = await createResetToken(user.email);
    var resetUrl = process.env.NEXT_PUBLIC_APP_URL + "/reset-password?token=" + token;
    try { await sendPasswordResetEmail(user, resetUrl); } catch(e) { console.error("Reset email failed:", e); }
  }

  return NextResponse.json({ message: "If an account exists with that email, a password reset link has been sent." });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyResetToken, hashPassword } from "@/lib/auth";

export async function POST(request) {
  var body = await request.json();
  var token = body.token;
  var newPassword = body.password;

  if (!token) {
    return NextResponse.json({ errors: ["Reset token is required"] }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ errors: ["Password must be at least 8 characters"] }, { status: 400 });
  }

  var payload = await verifyResetToken(token);
  if (!payload || !payload.email) {
    return NextResponse.json({ errors: ["This reset link is invalid or has expired. Please request a new one."] }, { status: 400 });
  }

  var user = await db.user.findUnique({
    where: { email: payload.email },
  });
  if (!user) {
    return NextResponse.json({ errors: ["Account not found"] }, { status: 404 });
  }

  // Single-use enforcement: the link is bound to the tokenVersion it was issued
  // with. If it no longer matches, the link has already been used (or a newer
  // one was issued) and must be rejected.
  if ((payload.ver ?? 0) !== user.tokenVersion) {
    return NextResponse.json({ errors: ["This reset link is invalid or has expired. Please request a new one."] }, { status: 400 });
  }

  var hashedPassword = await hashPassword(newPassword);
  // Bumping tokenVersion invalidates this reset link AND every existing login
  // session for the account.
  await db.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, tokenVersion: { increment: 1 } },
  });

  return NextResponse.json({ message: "Your password has been reset. You can now log in with your new password." });
}

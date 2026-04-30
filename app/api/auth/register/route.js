import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { validateRegistration } from "@/lib/validation";
import { getAuthLimiter, checkRateLimit } from "@/lib/ratelimit";
import { sendWelcomeEmail } from "@/lib/email";
import { headers } from "next/headers";

export async function POST(request) {
  var headersList = await headers();
  var ip = headersList.get("x-forwarded-for") || "unknown";
  var rateLimitError = await checkRateLimit(getAuthLimiter, ip);
  if (rateLimitError) return rateLimitError;

  var body = await request.json();
  var name = body.name;
  var email = body.email;
  var phone = body.phone;
  var password = body.password;

  var validation = validateRegistration({ name: name, email: email, phone: phone, password: password });
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  var existing = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ errors: ["An account with this email already exists"] }, { status: 409 });
  }

  var hashedPassword = await hashPassword(password);
  var user = await db.user.create({
    data: { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password: hashedPassword },
  });

  // Send welcome email (don't block registration if it fails)
  try { await sendWelcomeEmail({ name: user.name, email: user.email }); } catch(e) { console.error("Welcome email failed:", e); }

  var token = await createToken(user.id);
  var response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  response.cookies.set("swaptest_token", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/",
  });
  return response;
}

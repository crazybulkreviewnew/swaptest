import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { getAuthLimiter, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { headers } from "next/headers";

export async function POST(request) {
  var headersList = await headers();
  var ip = getClientIp(headersList);
  var rateLimitError = await checkRateLimit(getAuthLimiter, ip);
  if (rateLimitError) return rateLimitError;

  var body = await request.json();
  var email = body.email;
  var password = body.password;

  if (!email || !password) {
    return NextResponse.json({ errors: ["Email and password are required"] }, { status: 400 });
  }

  var user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json({ errors: ["Invalid email or password"] }, { status: 401 });
  }

  var token = await createToken(user.id, user.tokenVersion);
  var response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  response.cookies.set("swaptest_token", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/",
  });
  return response;
}

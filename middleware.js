// ============================================================
// middleware.js — Route Protection
// ============================================================
// Runs BEFORE every matched route. Checks for valid JWT token
// and redirects unauthenticated users to login.
// Uses 'jose' (not jsonwebtoken) because middleware runs on Edge.
// ============================================================

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Same guard as lib/auth.js, checked on use rather than on import. Middleware
// runs on the Edge as its own bundle, so it reads the environment
// independently and needs its own check.
function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Refusing to verify a token with a guessable key.");
  }
  return new TextEncoder().encode(secret);
}

const TOKEN_NAME = "swaptest_token";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/match", "/swap"];

// Routes that should redirect TO dashboard if already logged in
const AUTH_ROUTES = ["/register", "/login"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_NAME)?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, jwtSecret());
      isAuthenticated = true;
    } catch {
      // Invalid/expired token — treat as unauthenticated
    }
  }

  // Protected routes: redirect to login if not authenticated
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      // Keep the query string, not just the path. Without it, a responder who
      // clicked "Agree to Swap" in an email was sent to /login?redirect=/match,
      // and after signing in landed on /match with no id — a blank page reading
      // "No match ID provided", with no way back to the swap they were invited
      // to. Every responder arriving from an email hit this, which is why none
      // of them ever completed. The same applied to /swap/confirm?mine=…&theirs=…
      loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth routes: redirect to dashboard if already logged in
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/match/:path*", "/swap/:path*", "/register", "/login"],
};

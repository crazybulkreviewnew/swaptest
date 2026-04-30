// ============================================================
// middleware.js — Route Protection
// ============================================================
// Runs BEFORE every matched route. Checks for valid JWT token
// and redirects unauthenticated users to login.
// Uses 'jose' (not jsonwebtoken) because middleware runs on Edge.
// ============================================================

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const TOKEN_NAME = "swaptest_token";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/match"];

// Routes that should redirect TO dashboard if already logged in
const AUTH_ROUTES = ["/register", "/login"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_NAME)?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      // Invalid/expired token — treat as unauthenticated
    }
  }

  // Protected routes: redirect to login if not authenticated
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
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
  matcher: ["/dashboard/:path*", "/match/:path*", "/register", "/login"],
};

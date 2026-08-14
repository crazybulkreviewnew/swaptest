// ============================================================
// lib/auth.js — Authentication Helpers
// ============================================================
// Handles JWT tokens, password hashing, and request auth.
// Uses 'jose' for Edge-compatible JWT (works in middleware).
// Uses 'bcryptjs' for password hashing (pure JS, no native deps).
// ============================================================

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";

// Fail loudly rather than silently. TextEncoder().encode(undefined) does not
// throw: it encodes the string "undefined", so a missing JWT_SECRET would leave
// the app signing and verifying sessions with a publicly guessable key, and
// anyone could forge a token for any account. Nothing about that failure is
// visible from outside, so it has to be caught here.
//
// Checked on use rather than on import. Next collects page data at build time,
// which imports this module without ever signing anything, so a module-level
// throw would make the build require production secrets it does not need.
function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Refusing to sign or verify a token with a guessable key.");
  }
  return new TextEncoder().encode(secret);
}

const TOKEN_NAME = "swaptest_token";
const TOKEN_EXPIRY = "7d";

// ── Password Hashing ──────────────────────────────────────

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ── JWT Tokens ────────────────────────────────────────────

export async function createToken(userId, tokenVersion = 0) {
  // ver is checked against the user's current tokenVersion on every request,
  // so bumping tokenVersion (e.g. on password reset) invalidates old tokens.
  return new SignJWT({ userId, ver: tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(jwtSecret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    return payload;
  } catch {
    return null;
  }
}

// ── Cookie Management ─────────────────────────────────────

export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

// ── Get Current User from Request ─────────────────────────

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.userId) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    // Subscription fields are included so the dashboard can show membership
    // state without a second query. Note this is still a snapshot: the paywall
    // in /api/matches/select re-reads the user, because somebody may have
    // subscribed since this request began.
    select: {
      id: true, name: true, email: true, phone: true, tokenVersion: true,
      registrationPaidAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      subscriptionCurrentPeriodEnd: true,
      lifetimeFreeAccess: true,
    },
  });
  if (!user) return null;

  // Reject tokens issued before the latest password reset.
  if ((payload.ver ?? 0) !== user.tokenVersion) return null;

  // Don't leak tokenVersion to callers.
  const { tokenVersion, ...safeUser } = user;
  return safeUser;
}

// ── Require Auth (use in API routes) ──────────────────────
// Returns the user or throws a Response.

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorised" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

// ── Password Reset Tokens ────────────────────────────────

export async function createResetToken(email, tokenVersion = 0) {
  // ver binds the link to the current tokenVersion; once a reset bumps the
  // version, this link (and any older one) can no longer be reused.
  return new SignJWT({ email: email, purpose: "password-reset", ver: tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(jwtSecret());
}

export async function verifyResetToken(token) {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    if (payload.purpose !== "password-reset") return null;
    return payload;
  } catch {
    return null;
  }
}

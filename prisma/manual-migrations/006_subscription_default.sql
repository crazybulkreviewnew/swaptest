-- ============================================================
-- 006_subscription_default.sql
-- ============================================================
-- Run this in Neon BEFORE turning payments on.
--
-- Migration 004 added lifetimeFreeAccess with a default of TRUE so that every
-- user who had already signed up while SwapTest was free kept it free. That
-- worked: all 192 existing users have it. But the default was never changed
-- back, so every NEW signup is also being granted permanent free access.
--
-- Left as is, switching payments on would gate nobody. Everyone who registers
-- would be grandfathered into a free tier the moment they created an account.
--
-- This flips the default for future rows only. It does NOT touch any existing
-- row, so the 192 users keep their free access exactly as promised.
--
-- Safe to run more than once.
-- ============================================================

ALTER TABLE "User" ALTER COLUMN "lifetimeFreeAccess" SET DEFAULT false;

-- ── Verify ──────────────────────────────────────────────────
-- Expected: column_default = false, and lifetime_users unchanged at 192.
SELECT
  (SELECT column_default
     FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'lifetimeFreeAccess') AS new_default,
  (SELECT COUNT(*) FROM "User" WHERE "lifetimeFreeAccess") AS lifetime_users,
  (SELECT COUNT(*) FROM "User") AS total_users;

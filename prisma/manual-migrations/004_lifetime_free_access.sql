-- ============================================================
-- Migration 004 — founding members get free access for life
-- ============================================================
-- Run ONCE against production (Neon SQL Editor) BEFORE deploying the new code.
--
-- Policy: every user who joins while SwapTest is free keeps full access
-- permanently and is never charged. Only users onboarded AFTER paid launch
-- ever pay the £1/week.
--
-- This replaces the earlier LEGACY_ACCESS_UNTIL approach, which granted the old
-- one-time-£1 payers a temporary grace window and gave free-mode signups no
-- protection at all. Access is now a flag on the row rather than a date in the
-- environment, so it cannot be lost to a missing or mistyped config value.
--
-- The column DEFAULTS TO TRUE. That is deliberate: while the site is free, every
-- new signup automatically becomes a founding member with no extra step. The
-- default is flipped to FALSE at paid launch — see the block at the bottom.
--
-- Non-destructive. Rollback: restore from a Neon branch/snapshot taken first.
-- ============================================================

BEGIN;

-- Add the flag, defaulting to TRUE, and backfill every existing user.
-- (ADD COLUMN ... DEFAULT true already backfills existing rows in Postgres 11+;
-- the explicit UPDATE makes it safe on older versions and safe to re-run.)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lifetimeFreeAccess" BOOLEAN NOT NULL DEFAULT true;
UPDATE "User" SET "lifetimeFreeAccess" = true WHERE "lifetimeFreeAccess" IS DISTINCT FROM true;

-- Matching filters on this flag, and it is highly skewed while the site is free,
-- so a partial index on the paying minority is the useful one after launch.
CREATE INDEX IF NOT EXISTS "User_lifetimeFreeAccess_idx"
  ON "User"("lifetimeFreeAccess") WHERE "lifetimeFreeAccess" = false;

COMMIT;

-- ============================================================
-- DO NOT RUN THIS YET — paid launch only.
-- ============================================================
-- Run this single statement at the moment you switch
-- NEXT_PUBLIC_PAYMENTS_ENABLED to "true". From then on, new signups default to
-- paying. Everyone who registered before this point keeps lifetimeFreeAccess =
-- true and is unaffected.
--
--   ALTER TABLE "User" ALTER COLUMN "lifetimeFreeAccess" SET DEFAULT false;
--
-- Also update prisma/schema.prisma to @default(false) in the same change, so the
-- schema and the database agree.
--
-- If you forget this step, new users get free access — a revenue leak, not a
-- lockout. That is the intended direction to fail in.
-- ============================================================

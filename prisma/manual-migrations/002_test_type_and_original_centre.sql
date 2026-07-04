-- ============================================================
-- Migration 002 — test type + original centre
-- ============================================================
-- Run ONCE against production (Neon SQL Editor) BEFORE deploying the new code.
-- Adds the DVSA "same test type" rule and the "swapped before → original centre"
-- field to listings. Existing listings default to WEEKDAY. Non-destructive.
-- Rollback: restore from a Neon branch/snapshot taken before running.
-- ============================================================

BEGIN;

-- Test-type enum (guarded so it's safe to re-run).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TestType') THEN
    CREATE TYPE "TestType" AS ENUM ('WEEKDAY', 'EVENING_WEEKEND');
  END IF;
END $$;

-- Add columns. Existing rows get testType = WEEKDAY via the default.
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "testType" "TestType" NOT NULL DEFAULT 'WEEKDAY';
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "originalCentre" TEXT;

COMMIT;

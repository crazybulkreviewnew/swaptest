-- ============================================================
-- Migration 001 — paid model + simplified matching
-- ============================================================
-- Run this ONCE against the production (Neon) database BEFORE deploying the
-- new code. `prisma db push` is NOT safe here because of the enum remap, so run
-- this SQL by hand (ideally on a Neon BRANCH first to rehearse).
--
-- It preserves all Users, Listings, Payments and Matches. It only drops columns
-- that are no longer used, and it GRANDFATHERS every existing user as
-- registration-paid so they are not locked out of creating listings.
--
-- Rollback: restore from a Neon branch/snapshot taken immediately before.
-- ============================================================

BEGIN;

-- 0. Clear any in-flight matches so no half-migrated payment state remains.
--    (Old two-sided payment states don't map cleanly to the new model.)
UPDATE "Listing"
   SET status = 'AVAILABLE', "lockedByMatchId" = NULL
 WHERE "lockedByMatchId" IN (
   SELECT id FROM "Match" WHERE status IN ('PENDING_LATER_PAY','PENDING_EARLIER_PAY')
 );
UPDATE "Match" SET status = 'CANCELLED'
 WHERE status IN ('PENDING_LATER_PAY','PENDING_EARLIER_PAY');

-- 1. Listing — drop the preferred-date interval columns (data no longer used).
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "preferredDateFrom";
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "preferredDateTo";

-- 2. User — add registration flag, then grandfather all existing users as paid.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "registrationPaidAt" TIMESTAMP(3);
UPDATE "User" SET "registrationPaidAt" = NOW() WHERE "registrationPaidAt" IS NULL;

-- 3. Match — new consent + single-deadline columns; drop the later-payer + two-timer columns.
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "earlierConsentAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "laterConsentAt"   TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "payDeadline"      TIMESTAMP(3);
ALTER TABLE "Match" DROP COLUMN IF EXISTS "laterPaid";
ALTER TABLE "Match" DROP COLUMN IF EXISTS "laterPaymentId";
ALTER TABLE "Match" DROP COLUMN IF EXISTS "laterPayDeadline";
ALTER TABLE "Match" DROP COLUMN IF EXISTS "earlierPayDeadline";

-- 4. MatchStatus enum — remap old values, then swap the type.
ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
CREATE TYPE "MatchStatus" AS ENUM ('PENDING','COMPLETED','EXPIRED','DECLINED','CANCELLED');
ALTER TABLE "Match" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Match" ALTER COLUMN status TYPE "MatchStatus" USING (
  CASE status::text
    WHEN 'PENDING_LATER_PAY'   THEN 'PENDING'
    WHEN 'PENDING_EARLIER_PAY' THEN 'PENDING'
    WHEN 'EXPIRED_TIMER1'      THEN 'EXPIRED'
    WHEN 'EXPIRED_TIMER2'      THEN 'EXPIRED'
    ELSE status::text            -- COMPLETED / DECLINED / CANCELLED unchanged
  END::"MatchStatus"
);
ALTER TABLE "Match" ALTER COLUMN status SET DEFAULT 'PENDING';
DROP TYPE "MatchStatus_old";

-- old indexes on the dropped deadline columns are removed automatically with the columns;
-- add the new one to match the Prisma schema.
CREATE INDEX IF NOT EXISTS "Match_payDeadline_idx" ON "Match" ("payDeadline");

-- 5. Payment — matchId now nullable (registration payments have no match) + purpose.
ALTER TABLE "Payment" ALTER COLUMN "matchId" DROP NOT NULL;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "purpose" TEXT NOT NULL DEFAULT 'swap';

COMMIT;

-- After running: deploy the new code, set REGISTRATION_FEE_PENCE / SWAP_FEE_PENCE /
-- SWAP_DEADLINE_HOURS in Vercel, and confirm the Stripe webhook is configured.

-- ============================================================
-- Migration 005 — remember who we have told about a waiting match
-- ============================================================
-- Run ONCE against production (Neon SQL Editor) BEFORE deploying the new code.
--
-- Background: matches were being found and shown on the dashboard, but nobody
-- was ever told they existed. A learner had to log in and understand that the
-- row on screen needed clicking. In Manchester that cost a real swap: two
-- compatible listings sat available for days and neither person acted.
--
-- A daily job now emails people when a swap is waiting for them. This column
-- records when we last did that for a given listing, so the job can skip anyone
-- told recently instead of emailing the same person every morning.
--
-- Non-destructive: one nullable column. Existing listings start as NULL, which
-- the job reads as "never told", so everyone with a waiting match gets one
-- email on the first run.
-- Rollback: restore from a Neon branch/snapshot taken before running.
-- ============================================================

BEGIN;

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "lastMatchAlertAt" TIMESTAMP(3);

-- The job looks for available listings that are either never alerted or last
-- alerted a while ago, so it reads this column alongside status.
CREATE INDEX IF NOT EXISTS "Listing_status_lastMatchAlertAt_idx"
  ON "Listing"("status", "lastMatchAlertAt");

COMMIT;

-- ============================================================
-- After running:
--   1. Deploy the code.
--   2. Add the cron entry (vercel.json already contains it) and confirm it
--      appears under Vercel -> Settings -> Cron Jobs.
--   3. The first run will email everyone who currently has a waiting match.
--      That is intended: those people have been waiting without knowing.
-- ============================================================

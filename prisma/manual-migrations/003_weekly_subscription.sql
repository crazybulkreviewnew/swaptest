-- ============================================================
-- Migration 003 — £1/week subscription, no per-swap fee
-- ============================================================
-- Run ONCE against production (Neon SQL Editor) BEFORE deploying the new code.
--
-- Replaces the old pricing model:
--   was: one-time £1 registration + £8 per completed swap
--   now: £1 per week, nothing charged per swap
--
-- Existing one-time-£1 payers keep their "registrationPaidAt" timestamp and are
-- granted access until LEGACY_ACCESS_UNTIL (see .env.example). Their access is
-- read from that column by lib/subscription.js — no data is rewritten here.
--
-- Non-destructive: nothing is dropped. The legacy Match.earlierPaid /
-- earlierPaymentId columns are kept so historic swaps stay refundable.
-- Rollback: restore from a Neon branch/snapshot taken before running.
-- ============================================================

BEGIN;

-- Subscription status enum (guarded so it's safe to re-run).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'PAST_DUE', 'CANCELLED');
  END IF;
END $$;

-- Subscription columns on User.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionCurrentPeriodEnd" TIMESTAMP(3);

-- Unique constraints on the Stripe identifiers (guarded).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'User_stripeCustomerId_key') THEN
    CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'User_stripeSubscriptionId_key') THEN
    CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
  END IF;
END $$;

-- Matching filters on these two columns together.
CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_subscriptionCurrentPeriodEnd_idx"
  ON "User"("subscriptionStatus", "subscriptionCurrentPeriodEnd");

-- Payment.purpose now defaults to "subscription". Existing rows keep their
-- current value ("registration" / "swap") so historic records stay accurate.
ALTER TABLE "Payment" ALTER COLUMN "purpose" SET DEFAULT 'subscription';

COMMIT;

-- ============================================================
-- After running:
--   1. Create the £1/week recurring Price in Stripe and set
--      STRIPE_WEEKLY_PRICE_ID (or leave it unset to have the app build the
--      price inline from SUBSCRIPTION_PENCE_PER_WEEK).
--   2. Add these Stripe webhook events to the endpoint:
--      checkout.session.completed, invoice.paid, invoice.payment_failed,
--      customer.subscription.updated, customer.subscription.deleted
--   3. Set LEGACY_ACCESS_UNTIL to the date existing £1 payers lose free access.
--   4. Remove the now-unused REGISTRATION_FEE_PENCE / SWAP_FEE_PENCE vars.
--   5. Deploy.
-- ============================================================

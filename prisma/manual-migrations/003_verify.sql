-- ============================================================
-- Verify migration 003 — £1/week subscription
-- ============================================================
-- Paste into the Neon SQL Editor and run. READ-ONLY: it only inspects the
-- catalog and counts rows, it never writes.
--
-- Every row should come back status = 'PASS'. Anything else means the
-- migration did not fully apply — re-run 003_weekly_subscription.sql (it is
-- guarded with IF NOT EXISTS, so re-running is safe).
-- ============================================================

WITH expected_cols(col, want_type, want_null) AS (
  VALUES
    ('stripeCustomerId',             'text',                        'YES'),
    ('stripeSubscriptionId',         'text',                        'YES'),
    ('subscriptionStatus',           'USER-DEFINED',                'NO'),
    ('subscriptionCurrentPeriodEnd', 'timestamp without time zone', 'YES'),
    -- legacy column: must still be here, one-time payers depend on it
    ('registrationPaidAt',           'timestamp without time zone', 'YES')
),
actual_cols AS (
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'User'
),
col_checks AS (
  SELECT
    1 AS sort,
    'column: User.' || e.col AS check_name,
    e.want_type || ' / nullable=' || e.want_null AS expected,
    COALESCE(a.data_type || ' / nullable=' || a.is_nullable, 'MISSING') AS actual,
    CASE WHEN a.data_type = e.want_type AND a.is_nullable = e.want_null
         THEN 'PASS' ELSE 'FAIL' END AS status
  FROM expected_cols e
  LEFT JOIN actual_cols a ON a.column_name = e.col
),
enum_check AS (
  SELECT
    2 AS sort,
    'enum: SubscriptionStatus' AS check_name,
    'NONE, ACTIVE, PAST_DUE, CANCELLED' AS expected,
    COALESCE((
      SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
      FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'SubscriptionStatus'
    ), 'MISSING') AS actual,
    CASE WHEN (
      SELECT count(*) FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'SubscriptionStatus'
        AND e.enumlabel IN ('NONE','ACTIVE','PAST_DUE','CANCELLED')
    ) = 4 THEN 'PASS' ELSE 'FAIL' END AS status
),
expected_idx(idx) AS (
  VALUES
    ('User_stripeCustomerId_key'),
    ('User_stripeSubscriptionId_key'),
    ('User_subscriptionStatus_subscriptionCurrentPeriodEnd_idx')
),
idx_checks AS (
  SELECT
    3 AS sort,
    'index: ' || e.idx AS check_name,
    'exists' AS expected,
    COALESCE(i.indexname, 'MISSING') AS actual,
    CASE WHEN i.indexname IS NOT NULL THEN 'PASS' ELSE 'FAIL' END AS status
  FROM expected_idx e
  LEFT JOIN pg_indexes i
    ON i.indexname = e.idx AND i.tablename = 'User' AND i.schemaname = 'public'
),
default_check AS (
  SELECT
    4 AS sort,
    'default: Payment.purpose' AS check_name,
    'subscription' AS expected,
    COALESCE((
      SELECT column_default FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'purpose'
    ), 'MISSING') AS actual,
    CASE WHEN COALESCE((
      SELECT column_default FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Payment' AND column_name = 'purpose'
    ), '') LIKE '%subscription%' THEN 'PASS' ELSE 'FAIL' END AS status
),
-- The migration must not have put anybody on a subscription. In free mode
-- every user should still be sitting at NONE.
data_check AS (
  SELECT
    5 AS sort,
    'data: no user auto-subscribed' AS check_name,
    '0' AS expected,
    (SELECT count(*)::text FROM "User" WHERE "subscriptionStatus" <> 'NONE') AS actual,
    CASE WHEN (SELECT count(*) FROM "User" WHERE "subscriptionStatus" <> 'NONE') = 0
         THEN 'PASS' ELSE 'FAIL' END AS status
),
-- Informational: how many legacy one-time-£1 payers exist. Drives whether you
-- need LEGACY_ACCESS_UNTIL set before switching to paid mode.
legacy_check AS (
  SELECT
    6 AS sort,
    'info: legacy one-time payers' AS check_name,
    'informational' AS expected,
    (SELECT count(*)::text FROM "User" WHERE "registrationPaidAt" IS NOT NULL) AS actual,
    'INFO' AS status
)
SELECT check_name, expected, actual, status FROM (
  SELECT * FROM col_checks
  UNION ALL SELECT * FROM enum_check
  UNION ALL SELECT * FROM idx_checks
  UNION ALL SELECT * FROM default_check
  UNION ALL SELECT * FROM data_check
  UNION ALL SELECT * FROM legacy_check
) results
ORDER BY sort, check_name;

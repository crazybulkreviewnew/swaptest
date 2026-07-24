-- ============================================================
-- Verify migration 004 — free access for life
-- ============================================================
-- Paste into the Neon SQL Editor and run. READ-ONLY.
-- Every row should read PASS. Run it again right before paid launch as a final
-- check that no existing user has lost their founding-member status.
-- ============================================================

WITH col AS (
  SELECT data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'lifetimeFreeAccess'
)
SELECT check_name, expected, actual, status FROM (

  SELECT 1 AS sort,
    'column: User.lifetimeFreeAccess' AS check_name,
    'boolean / not null' AS expected,
    COALESCE((SELECT data_type || ' / nullable=' || is_nullable FROM col), 'MISSING') AS actual,
    CASE WHEN (SELECT data_type FROM col) = 'boolean'
          AND (SELECT is_nullable FROM col) = 'NO'
         THEN 'PASS' ELSE 'FAIL' END AS status

  UNION ALL
  -- While free: default must be TRUE so new signups become founding members
  -- automatically. At paid launch this deliberately becomes 'false'.
  SELECT 2,
    'default: lifetimeFreeAccess',
    'true (pre-launch) / false (post-launch)',
    COALESCE((SELECT column_default FROM col), 'MISSING'),
    CASE WHEN COALESCE((SELECT column_default FROM col), '') IN ('true', 'false')
         THEN 'PASS' ELSE 'FAIL' END

  UNION ALL
  SELECT 3,
    'index: User_lifetimeFreeAccess_idx',
    'exists',
    COALESCE((SELECT indexname FROM pg_indexes
              WHERE tablename = 'User' AND indexname = 'User_lifetimeFreeAccess_idx'), 'MISSING'),
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes
                      WHERE tablename = 'User' AND indexname = 'User_lifetimeFreeAccess_idx')
         THEN 'PASS' ELSE 'FAIL' END

  UNION ALL
  -- THE IMPORTANT ONE: nobody who already exists may be missing the flag.
  SELECT 4,
    'data: every existing user is free for life',
    '0 users without it',
    (SELECT count(*)::text FROM "User" WHERE "lifetimeFreeAccess" = false),
    CASE WHEN (SELECT count(*) FROM "User" WHERE "lifetimeFreeAccess" = false) = 0
         THEN 'PASS' ELSE 'FAIL' END

  UNION ALL
  SELECT 5,
    'info: founding members',
    'informational',
    (SELECT count(*)::text FROM "User" WHERE "lifetimeFreeAccess" = true),
    'INFO'

  UNION ALL
  SELECT 6,
    'info: of those, old one-time-£1 payers',
    'informational',
    (SELECT count(*)::text FROM "User"
     WHERE "lifetimeFreeAccess" = true AND "registrationPaidAt" IS NOT NULL),
    'INFO'

) results ORDER BY sort;

-- NOTE on check 4 after paid launch: once the default flips to false, users who
-- sign up afterwards will correctly have lifetimeFreeAccess = false, and this
-- check will start reporting them. From that point read it as "should equal the
-- number of post-launch signups", not "must be zero".

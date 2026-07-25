-- ============================================================
-- Verify migration 005 — match alerts
-- ============================================================
-- Paste into the Neon SQL Editor and run. READ-ONLY.
-- Every row should read PASS before the new code is deployed.
-- ============================================================

SELECT check_name, expected, actual, status FROM (

  SELECT 1 AS sort,
    'column: Listing.lastMatchAlertAt' AS check_name,
    'timestamp, nullable' AS expected,
    COALESCE((
      SELECT data_type || ' / nullable=' || is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Listing' AND column_name = 'lastMatchAlertAt'
    ), 'MISSING') AS actual,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Listing'
        AND column_name = 'lastMatchAlertAt' AND data_type LIKE 'timestamp%' AND is_nullable = 'YES'
    ) THEN 'PASS' ELSE 'FAIL' END AS status

  UNION ALL
  SELECT 2,
    'index: Listing_status_lastMatchAlertAt_idx',
    'exists',
    COALESCE((SELECT indexname FROM pg_indexes
              WHERE tablename = 'Listing' AND indexname = 'Listing_status_lastMatchAlertAt_idx'), 'MISSING'),
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes
                      WHERE tablename = 'Listing' AND indexname = 'Listing_status_lastMatchAlertAt_idx')
         THEN 'PASS' ELSE 'FAIL' END

  UNION ALL
  -- Nobody has been alerted yet, so the first run will reach everyone who has
  -- been sitting on a match without knowing.
  SELECT 3,
    'data: listings already alerted',
    '0 before first run',
    (SELECT count(*)::text FROM "Listing" WHERE "lastMatchAlertAt" IS NOT NULL),
    'INFO'

  UNION ALL
  SELECT 4,
    'info: available listings with a future test',
    'informational',
    (SELECT count(*)::text FROM "Listing"
     WHERE status = 'AVAILABLE' AND "lockedByMatchId" IS NULL AND "currentDate" >= CURRENT_DATE),
    'INFO'

) results ORDER BY sort;

-- ============================================================================
--  Migration: daily platform-visit log
--  Date: 2026-07-13
--
--  The study-activity heatmap (components/dashboard/ActivityHeatmapCard.tsx)
--  used to light up a day only when the user SUBMITTED a test — activity was
--  derived purely from test_attempts. We now want any visit to the platform to
--  count a day as "active", so we record one row per (user, calendar day) the
--  first time they load a page that day.
--
--  Written by a lightweight client beacon on page load (POST /api/visit →
--  app/api/visit/route.ts), throttled to once per day per user. A submitted test
--  still lights the day up via test_attempts, so this table only needs to cover
--  the "visited but didn't submit" case.
--
--  One row per user per active day (PRIMARY KEY makes the write idempotent), so
--  the table stays tiny and the trailing-year read on the dashboard is cheap.
--
--  Idempotent: safe to run more than once.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_active_days (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active_date DATE NOT NULL,   -- server-local calendar day the user was active
    PRIMARY KEY (user_id, active_date)
);

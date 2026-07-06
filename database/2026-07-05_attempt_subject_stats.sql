-- ============================================================================
--  Migration: per-attempt, per-subject correct / incorrect / unanswered tallies
--  Date: 2026-07-05
--
--  Powers the "Subject → Test Breakdown" bar chart on the user dashboard
--  (components/dashboard/AccuracyTrendCard.tsx). test_attempts only stores an
--  attempt's OVERALL totals, and user_subject_mastery only keeps a LIFETIME
--  running rollup per subject — neither can be sliced "per mock test". This
--  lightweight table stores one row per (attempt, subject) so the breakdown can
--  be read with a single group-by, keeping the dashboard O(1)-ish.
--
--  Written for EVERY completed attempt (saveQuizAttempt); the dashboard filters
--  the display to mock tests only, but collecting for all sources costs a
--  handful of rows per attempt and avoids a future backfill.
--
--  Idempotent: safe to run more than once.
-- ============================================================================

CREATE TABLE IF NOT EXISTS attempt_subject_stats (
    attempt_id  UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    subject_id  UUID NOT NULL REFERENCES subjects(id)      ON DELETE CASCADE,
    correct     INT  NOT NULL DEFAULT 0,   -- questions answered correctly
    incorrect   INT  NOT NULL DEFAULT 0,   -- questions answered incorrectly
    unanswered  INT  NOT NULL DEFAULT 0,   -- questions left blank
    PRIMARY KEY (attempt_id, subject_id)
);

-- Reverse lookups by subject (e.g. "all breakdowns touching Cardiology").
CREATE INDEX IF NOT EXISTS idx_attempt_subject_stats_subject
    ON attempt_subject_stats(subject_id);

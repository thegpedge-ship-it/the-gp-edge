-- ============================================================================
-- Migration: Relax question_feedback constraints for dynamic option counts
-- Date: 2026-08-18
--
-- Questions can have 2–10 options (not always A–E). This replaces the
-- hardcoded enum constraints with pattern-based checks:
--   issue_where  → option_a .. option_j  (matches option_<lowercase letter>)
--   suggested_answer → A .. J            (single uppercase letter)
-- ============================================================================

BEGIN;

-- 1. Drop the old hardcoded constraints
ALTER TABLE question_feedback DROP CONSTRAINT IF EXISTS chk_feedback_issue_where;
ALTER TABLE question_feedback DROP CONSTRAINT IF EXISTS chk_feedback_suggested_answer;

-- 2. Re-add issue_where — allow option_a through option_j via pattern
ALTER TABLE question_feedback
  ADD CONSTRAINT chk_feedback_issue_where
  CHECK (issue_where IN (
    'stem',
    'lead_in',
    'answer_key',
    'explanation',
    'reference',
    'image_table'
  ) OR issue_where ~ '^option_[a-j]$');

-- 3. Re-add suggested_answer — any single uppercase letter A-J
ALTER TABLE question_feedback
  ADD CONSTRAINT chk_feedback_suggested_answer
  CHECK (
    (suggested_answer IS NULL)
    OR
    (exam_type = 'AKT'
     AND issue_type = 'keyed_answer_wrong'
     AND suggested_answer ~ '^[A-J]$')
  );

COMMIT;

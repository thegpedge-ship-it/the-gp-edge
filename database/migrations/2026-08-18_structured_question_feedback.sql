BEGIN;

-- 1. Add new structured columns
ALTER TABLE question_feedback
  ADD COLUMN IF NOT EXISTS exam_type   TEXT,
  ADD COLUMN IF NOT EXISTS issue_where TEXT,
  ADD COLUMN IF NOT EXISTS issue_type  TEXT,
  ADD COLUMN IF NOT EXISTS suggested_answer TEXT,
  ADD COLUMN IF NOT EXISTS disputed_answer  TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';

-- 2. Rename old free-text "feedback" → "comment" (optional note alongside structured fields)
ALTER TABLE question_feedback RENAME COLUMN feedback TO comment;

-- 3. Make comment nullable (structured fields now carry the primary info)
ALTER TABLE question_feedback ALTER COLUMN comment DROP NOT NULL;

-- 4. Constraint: exam_type must be AKT or KFP
ALTER TABLE question_feedback
  ADD CONSTRAINT chk_feedback_exam_type
  CHECK (exam_type IN ('AKT', 'KFP'));

-- 5. Constraint: issue_where — shared across both exam types
ALTER TABLE question_feedback
  ADD CONSTRAINT chk_feedback_issue_where
  CHECK (issue_where IN (
    'stem',
    'lead_in',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'option_e',
    'answer_key',
    'explanation',
    'reference',
    'image_table'
  ));

-- 6. Constraint: issue_type — AKT issues
--    Keyed answer wrong | More than one defensible answer | No correct option |
--    Out of date | Drug error | Stem ambiguous | Explanation contradicts key |
--    Poor distractor | Typo
--
--    KFP issues
--    Schedule of answers wrong | More than one defensible answer | No correct option |
--    Out of date | Drug error | Stem ambiguous or case data inconsistent |
--    Explanation contradicts key | Typo
ALTER TABLE question_feedback
  ADD CONSTRAINT chk_feedback_issue_type
  CHECK (
    (exam_type = 'AKT' AND issue_type IN (
      'keyed_answer_wrong',
      'more_than_one_defensible',
      'no_correct_option',
      'out_of_date',
      'drug_error',
      'stem_ambiguous',
      'explanation_contradicts_key',
      'poor_distractor',
      'typo'
    ))
    OR
    (exam_type = 'KFP' AND issue_type IN (
      'schedule_wrong',
      'more_than_one_defensible',
      'no_correct_option',
      'out_of_date',
      'drug_error',
      'stem_ambiguous_or_inconsistent',
      'explanation_contradicts_key',
      'typo'
    ))
  );

-- 7. Constraint: suggested_answer only valid for AKT + keyed_answer_wrong
ALTER TABLE question_feedback
  ADD CONSTRAINT chk_feedback_suggested_answer
  CHECK (
    (suggested_answer IS NULL)
    OR
    (exam_type = 'AKT'
     AND issue_type = 'keyed_answer_wrong'
     AND suggested_answer IN ('A', 'B', 'C', 'D', 'E'))
  );

-- 8. Constraint: disputed_answer only valid for KFP + schedule_wrong
ALTER TABLE question_feedback
  ADD CONSTRAINT chk_feedback_disputed_answer
  CHECK (
    (disputed_answer IS NULL)
    OR
    (exam_type = 'KFP'
     AND issue_type = 'schedule_wrong'
     AND LENGTH(TRIM(disputed_answer)) > 0)
  );

-- 9. Constraint: status lifecycle
ALTER TABLE question_feedback
  ADD CONSTRAINT chk_feedback_status
  CHECK (status IN ('open', 'under_review', 'accepted', 'rejected', 'resolved'));

-- 10. Index for admin queries — filter by status, exam type, issue type
CREATE INDEX IF NOT EXISTS idx_qfeedback_status     ON question_feedback (status);
CREATE INDEX IF NOT EXISTS idx_qfeedback_exam_type  ON question_feedback (exam_type);
CREATE INDEX IF NOT EXISTS idx_qfeedback_issue_type ON question_feedback (issue_type);

COMMIT;

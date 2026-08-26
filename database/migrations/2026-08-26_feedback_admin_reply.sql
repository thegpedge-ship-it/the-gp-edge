BEGIN;

ALTER TABLE question_feedback
  ADD COLUMN IF NOT EXISTS admin_reply TEXT;

ALTER TABLE question_feedback
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_qfeedback_user_question
  ON question_feedback (user_id, question_id);

COMMIT;

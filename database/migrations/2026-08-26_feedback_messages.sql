BEGIN;

CREATE TABLE IF NOT EXISTS feedback_messages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id  UUID NOT NULL REFERENCES question_feedback(id) ON DELETE CASCADE,
    sender_role  TEXT NOT NULL,
    message      TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_fm_sender_role CHECK (sender_role IN ('user', 'admin')),
    CONSTRAINT chk_fm_message_not_empty CHECK (LENGTH(TRIM(message)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_fm_feedback_created
  ON feedback_messages (feedback_id, created_at ASC);

COMMIT;

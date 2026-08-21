-- ============================================================================
-- Migration: Create note_template_feedback for structured Note Template reviews
-- Date: 2026-08-21
--
-- Implements the "Note template" section of the Report-a-Problem spec:
--
--   Common fields (all feedback types):
--     severity          – typo_or_presentation | content_may_be_wrong | could_cause_harm
--     whats_wrong       – free text (1-2 lines, what's incorrect)
--     source            – optional reference (eTG/AMH/RACGP)
--
--   Note-template-specific:
--     section_where     – SOAP heading or field from the template
--     issue_type        – clinical_content_wrong | missing_field | software_issue
--                         | export_formatting | typo
--     wrong_detail      – (conditional) free text when issue = clinical_content_wrong
--     software_name     – (conditional) when issue = software_issue:
--                         best_practice | medical_director | zedmed | helix | other
--
--   Silent capture:
--     template_id, template_name, version_label, user_id, created_at
-- ============================================================================

BEGIN;

-- 1. Create the table
CREATE TABLE IF NOT EXISTS note_template_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES autofill_templates(id) ON DELETE CASCADE,
    template_name   TEXT NOT NULL,
    version_label   TEXT,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Common fields (shared across all four feedback types per spec)
    severity        TEXT NOT NULL,
    whats_wrong     TEXT NOT NULL,
    source          TEXT,

    -- Note-template-specific structured fields
    section_where   TEXT NOT NULL,
    issue_type      TEXT NOT NULL,

    -- Conditional fields
    wrong_detail    TEXT,
    software_name   TEXT,

    -- Admin workflow
    status          TEXT NOT NULL DEFAULT 'open',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Constraint: severity values
ALTER TABLE note_template_feedback
  ADD CONSTRAINT chk_ntf_severity
  CHECK (severity IN (
    'typo_or_presentation',
    'content_may_be_wrong',
    'could_cause_harm'
  ));

-- 3. Constraint: issue_type values
ALTER TABLE note_template_feedback
  ADD CONSTRAINT chk_ntf_issue_type
  CHECK (issue_type IN (
    'clinical_content_wrong',
    'missing_field',
    'software_issue',
    'export_formatting',
    'typo'
  ));

-- 4. Constraint: wrong_detail only when issue = clinical_content_wrong
ALTER TABLE note_template_feedback
  ADD CONSTRAINT chk_ntf_wrong_detail
  CHECK (
    (wrong_detail IS NULL)
    OR
    (issue_type = 'clinical_content_wrong'
     AND LENGTH(TRIM(wrong_detail)) > 0)
  );

-- 5. Constraint: software_name only when issue = software_issue
ALTER TABLE note_template_feedback
  ADD CONSTRAINT chk_ntf_software_name
  CHECK (
    (software_name IS NULL)
    OR
    (issue_type = 'software_issue'
     AND software_name IN (
       'best_practice',
       'medical_director',
       'zedmed',
       'helix',
       'other'
     ))
  );

-- 6. Constraint: status lifecycle (matches question_feedback)
ALTER TABLE note_template_feedback
  ADD CONSTRAINT chk_ntf_status
  CHECK (status IN ('open', 'under_review', 'accepted', 'rejected', 'resolved'));

-- 7. Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_ntf_status      ON note_template_feedback (status);
CREATE INDEX IF NOT EXISTS idx_ntf_template    ON note_template_feedback (template_id);
CREATE INDEX IF NOT EXISTS idx_ntf_issue_type  ON note_template_feedback (issue_type);
CREATE INDEX IF NOT EXISTS idx_ntf_created     ON note_template_feedback (created_at DESC);

COMMIT;

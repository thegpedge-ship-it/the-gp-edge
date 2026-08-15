-- ============================================================================
--  GP EDGE — Add exam_type_code to user_subject_mastery
--
--  Splits mastery tracking per exam type so AKT and KFP have independent
--  weak/strong subject data. Existing rows default to 'AKT'.
--
--  Safe to re-run: uses IF NOT EXISTS / IF EXISTS guards.
-- ============================================================================

BEGIN;

-- 1. Add the column (defaults existing rows to 'AKT')
ALTER TABLE user_subject_mastery
  ADD COLUMN IF NOT EXISTS exam_type_code TEXT NOT NULL DEFAULT 'AKT';

-- 2. Add FK to exam_types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_mastery_exam_type'
      AND table_name = 'user_subject_mastery'
  ) THEN
    ALTER TABLE user_subject_mastery
      ADD CONSTRAINT fk_mastery_exam_type
      FOREIGN KEY (exam_type_code) REFERENCES exam_types(code)
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

-- 3. Drop the old PK and create the new composite PK
ALTER TABLE user_subject_mastery
  DROP CONSTRAINT IF EXISTS user_subject_mastery_pkey;

ALTER TABLE user_subject_mastery
  ADD CONSTRAINT user_subject_mastery_pkey
  PRIMARY KEY (user_id, subject_id, exam_type_code);

COMMIT;

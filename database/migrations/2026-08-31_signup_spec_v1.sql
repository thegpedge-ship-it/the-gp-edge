-- ============================================================================
--  GP EDGE — Sign-Up Data Specification v1.0
--  Date: 2026-08-31
--  Applies to: PostgreSQL 15+ (Neon)
--
--  Summary of changes:
--    1. users table → add sign-up spec fields (postgraduate_year, exam_target_code,
--       terms acceptance, primary_medical_degree, exam_history, fellowship_status,
--       country, state_territory, referral_source)
--    2. users table → drop racgp_id, hospital, bio (spec §5)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Add new columns to users
-- ────────────────────────────────────────────────────────────────────────────

-- Step 1 fields (mandatory at sign-up)
ALTER TABLE users ADD COLUMN IF NOT EXISTS postgraduate_year  INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS exam_target_code   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at  TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_version    TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ;

-- Step 2 fields (optional, collected during onboarding)
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_medical_degree TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS exam_history           TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS fellowship_status      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country                TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state_territory        TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_source        TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_source_other  TEXT;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Drop removed fields (spec §5: "drop the columns and delete the values")
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE users DROP COLUMN IF EXISTS racgp_id;
ALTER TABLE users DROP COLUMN IF EXISTS hospital;
ALTER TABLE users DROP COLUMN IF EXISTS bio;

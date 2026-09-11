-- =============================================================================
-- Migration: Consolidated Runtime DDL Removal
-- Date: 2026-09-11
-- Purpose: Formalize all tables, types, and columns previously created on-demand
--          at application runtime into a permanent database migration.
-- =============================================================================

-- 1. Custom Role Columns
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS can_view_pii BOOLEAN DEFAULT false;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_code_check;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check;

-- 2. Admin Users Session & Role Columns
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role_code TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active_session_token TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active_session_started_at TIMESTAMPTZ;

-- 3. Users Role Columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[];

-- 4. Rate Cards Versioning Table
CREATE TABLE IF NOT EXISTS rate_card_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INT NOT NULL UNIQUE,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  rates JSONB NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Baseline Rate Card Version 1 if not present
INSERT INTO rate_card_versions (version, effective_from, effective_to, rates, created_by, created_at)
VALUES (
  1,
  '2026-01-01T00:00:00Z',
  NULL,
  '{
    "draft:question": 120.0,
    "draft:medical_condition": 350.0,
    "draft:approach": 250.0,
    "draft:autofill_template": 150.0,
    "draft:quiz": 100.0,
    "draft:mock_test": 200.0,
    "review:question": 75.0,
    "review:medical_condition": 180.0,
    "review:approach": 130.0,
    "review:autofill_template": 80.0,
    "review:quiz": 60.0,
    "review:mock_test": 120.0,
    "remediation:question": 50.0,
    "remediation:medical_condition": 120.0,
    "remediation:approach": 90.0,
    "remediation:autofill_template": 50.0,
    "remediation:quiz": 40.0,
    "remediation:mock_test": 80.0
  }'::jsonb,
  'system',
  NOW()
)
ON CONFLICT (version) DO NOTHING;

-- 5. Content Edit History & Versions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'edit_change_type') THEN
    CREATE TYPE edit_change_type AS ENUM ('added','deleted','modified','status_change','meta_change','restored');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS content_edit_history (
  id              BIGSERIAL PRIMARY KEY,
  entity_id       TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  field_name      TEXT NOT NULL,
  change_type     edit_change_type NOT NULL,
  old_content     TEXT,
  new_content     TEXT,
  admin_user_id   TEXT,
  admin_user_name TEXT,
  session_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  version_number  INT NOT NULL,
  label           TEXT,
  full_html       TEXT,
  metadata        JSONB,
  created_by      TEXT,
  created_by_name TEXT,
  restored_from   UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Notifications Table & Scheduled Column
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  message      TEXT,
  payload      JSONB,
  scheduled_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- 7. Taxonomy Columns (Questions, Medical Conditions, Autofill Templates)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_code VARCHAR(20);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS home_unit VARCHAR(20);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS group_code VARCHAR(50);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS cross_ref_units JSONB DEFAULT '[]'::jsonb;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS depth_tier VARCHAR(50);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS cross_cutting_tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_type VARCHAR(100);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS taxonomy_version VARCHAR(20) DEFAULT '1.1';

ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS topic_code VARCHAR(20);
ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS home_unit VARCHAR(20);
ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS group_code VARCHAR(50);
ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS cross_ref_units JSONB DEFAULT '[]'::jsonb;
ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS depth_tier VARCHAR(50);
ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS cross_cutting_tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS topic_type VARCHAR(100);
ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS taxonomy_version VARCHAR(20) DEFAULT '1.1';

ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS topic_code VARCHAR(20);
ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS home_unit VARCHAR(20);
ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS group_code VARCHAR(50);
ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS cross_ref_units JSONB DEFAULT '[]'::jsonb;
ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS depth_tier VARCHAR(50);
ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS cross_cutting_tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS topic_type VARCHAR(100);
ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS taxonomy_version VARCHAR(20) DEFAULT '1.1';

-- 8. Tags Category Column
ALTER TABLE tags ADD COLUMN IF NOT EXISTS tag_category TEXT DEFAULT 'general';

-- 9. Question Events Audit Table
CREATE TABLE IF NOT EXISTS question_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'human',
  actor_id UUID,
  actor_name TEXT,
  fields_changed JSONB,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Master Taxonomy Units & Topics Tables
CREATE TABLE IF NOT EXISTS taxonomy_units (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  kind VARCHAR(50) DEFAULT 'owner',
  groups JSONB,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taxonomy_topics (
  code VARCHAR(20) PRIMARY KEY,
  label VARCHAR(500) NOT NULL,
  topic_type VARCHAR(100) NOT NULL,
  home_unit VARCHAR(20) NOT NULL,
  group_code VARCHAR(50),
  cross_refs JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  depth VARCHAR(50) DEFAULT 'Core',
  status VARCHAR(50) DEFAULT 'active',
  merged_into JSONB DEFAULT '[]'::jsonb,
  cross_cutting_tags JSONB DEFAULT '[]'::jsonb,
  taxonomy_version VARCHAR(20) DEFAULT '1.1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_topics_home_unit ON taxonomy_topics(home_unit);
CREATE INDEX IF NOT EXISTS idx_taxonomy_topics_depth ON taxonomy_topics(depth);
CREATE INDEX IF NOT EXISTS idx_taxonomy_topics_status ON taxonomy_topics(status);

-- 11. Pipeline Tasks Table
CREATE TABLE IF NOT EXISTS pipeline_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  task_type TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  assigned_to_name TEXT,
  status TEXT NOT NULL DEFAULT 'offered',
  offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  take_up_deadline TIMESTAMPTZ NOT NULL,
  rate_card_version_at_acceptance INT,
  payment_liability_amount NUMERIC(10, 2) DEFAULT 0.00,
  is_payable BOOLEAN NOT NULL DEFAULT TRUE,
  rework_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Item Reviews Table
CREATE TABLE IF NOT EXISTS item_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  reviewer_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  outcome TEXT,
  rubric_version INT NOT NULL DEFAULT 1,
  rubric_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_correction BOOLEAN NOT NULL DEFAULT FALSE,
  original_review_id UUID,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Contributor Statements Table
CREATE TABLE IF NOT EXISTS contributor_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_number TEXT NOT NULL UNIQUE,
  contributor_id TEXT NOT NULL,
  contributor_name TEXT NOT NULL,
  contributor_email TEXT,
  contributor_abn TEXT,
  is_credit_only BOOLEAN NOT NULL DEFAULT FALSE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_items_count INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  is_adjustment BOOLEAN NOT NULL DEFAULT FALSE,
  adjustment_to_statement_id UUID,
  adjustment_reason TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Item Error Reports Table
CREATE TABLE IF NOT EXISTS item_error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  reporter_user_id TEXT NOT NULL,
  reporter_name TEXT,
  reporter_email TEXT,
  error_category TEXT NOT NULL,
  description TEXT NOT NULL,
  context_snapshot JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open',
  triage_outcome TEXT,
  triaged_by TEXT,
  triaged_at TIMESTAMPTZ,
  reporter_notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Audit Settings Table
CREATE TABLE IF NOT EXISTS audit_settings (
  id INT PRIMARY KEY DEFAULT 1,
  sampling_rate_standard INT NOT NULL DEFAULT 15,
  cadence TEXT NOT NULL DEFAULT 'quarterly',
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Audit Findings Table
CREATE TABLE IF NOT EXISTS audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  auditor_id TEXT NOT NULL,
  auditor_name TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  finding_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  closed_by TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Unified Tasks Table
CREATE TABLE IF NOT EXISTS unified_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_type TEXT NOT NULL,
  linked_entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  assigned_to TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_liability_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Admin Invitations Table
CREATE TABLE IF NOT EXISTS admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  invitation_token TEXT NOT NULL UNIQUE,
  invited_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Admin Password Reset Requests Table
CREATE TABLE IF NOT EXISTS admin_password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  admin_name TEXT,
  admin_username TEXT,
  admin_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);



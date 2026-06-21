-- ============================================================================
--  GP EDGE — Production Database Schema
--  Engine : PostgreSQL 15+  (works on Supabase / Neon / RDS / Cloud SQL)
--  Binary file storage : Cloudflare R2  (only metadata + object keys live here)
--
--  Design principles
--    * 3NF / BCNF throughout — no repeating groups, no transitive dependencies.
--    * Every multi-valued attribute (options, tags, symptoms, notes ...) is a
--      child table — NOT a comma string or array — so there is zero redundancy.
--    * All derived/aggregate numbers (attempts, avg score, mastery, usage,
--      study-streak, rank) are COMPUTED via views / materialized views, never
--      duplicated into base tables.  See section 13.
--    * Surrogate UUID primary keys; natural keys kept UNIQUE where they exist.
--    * Referential integrity enforced with FKs + ON DELETE rules.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";        -- case-insensitive email/slug

-- ----------------------------------------------------------------------------
-- 0. ENUM TYPES  (small, stable value sets)
-- ----------------------------------------------------------------------------
CREATE TYPE difficulty_level    AS ENUM ('easy','medium','hard');
CREATE TYPE question_status     AS ENUM ('draft','review','published','archived');
CREATE TYPE quiz_status         AS ENUM ('draft','active','suspended','archived');
CREATE TYPE content_status      AS ENUM ('draft','review','published','archived');
CREATE TYPE template_status     AS ENUM ('draft','active','suspended','archived');
CREATE TYPE field_type          AS ENUM ('text','textarea','numeric','dropdown','checkbox','date');
CREATE TYPE complexity_level    AS ENUM ('simple','moderate','complex');
CREATE TYPE attempt_source      AS ENUM ('quiz','mock_test','subtopic','mock_drill','custom');
CREATE TYPE attempt_status      AS ENUM ('in_progress','completed','abandoned','expired');
CREATE TYPE billing_cycle       AS ENUM ('monthly','annual');
CREATE TYPE subscription_status AS ENUM ('trialing','active','past_due','canceled','expired');
CREATE TYPE payment_status      AS ENUM ('pending','succeeded','failed','refunded');
CREATE TYPE file_status         AS ENUM ('pending','active','quarantined','deleted');
CREATE TYPE log_severity        AS ENUM ('info','warning','critical');
CREATE TYPE bookmark_kind       AS ENUM ('saved','flagged');
CREATE TYPE content_kind        AS ENUM ('Condition','Guideline','Protocol','Pathway','Document','Note');
CREATE TYPE condition_item_kind AS ENUM ('symptom','diagnosis_criterion','treatment_option','clinical_note');
CREATE TYPE mock_availability   AS ENUM ('available','locked');
CREATE TYPE account_status      AS ENUM ('active','suspended','deleted');

-- ============================================================================
-- 1. FILE STORAGE  (Cloudflare R2 object registry — single source of truth)
--    Binary bytes live in R2; this table holds only the metadata + key.
--    Any table that needs a file references files(id).
-- ============================================================================
CREATE TABLE files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket          TEXT        NOT NULL,                 -- R2 bucket name
    object_key      TEXT        NOT NULL,                 -- unique R2 key (uuid-filename)
    original_name   TEXT        NOT NULL,
    mime_type       TEXT        NOT NULL,
    size_bytes      BIGINT      NOT NULL CHECK (size_bytes >= 0),
    checksum_sha256 TEXT,                                 -- integrity / dedupe
    status          file_status NOT NULL DEFAULT 'pending',
    uploaded_by     UUID,                                 -- FK added after users exist
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (bucket, object_key)
);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);

-- ============================================================================
-- 2. IDENTITY & ACCESS
-- ============================================================================

-- 2.1 End users (students / GP registrars). Auth is delegated to Clerk;
--     we store the Clerk subject id + a synced profile.
CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id    TEXT        UNIQUE NOT NULL,
    email            CITEXT      UNIQUE NOT NULL,
    first_name       TEXT,
    last_name        TEXT,
    avatar_file_id   UUID REFERENCES files(id) ON DELETE SET NULL,
    -- profile (1:1 attributes kept inline — single-valued, fully dependent on user)
    role_title       TEXT,                  -- e.g. "GP Registrar — PGY3"
    hospital         TEXT,
    location         TEXT,
    bio              TEXT,
    racgp_id         TEXT,                  -- professional registration no.
    exam_target      TEXT,                  -- e.g. "AKT — Aug 2026"
    status           account_status NOT NULL DEFAULT 'active',
    joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at   TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE files ADD CONSTRAINT fk_files_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Free-form admin notes about a user (was an array on the mock) -> child table
CREATE TABLE user_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    note        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_notes_user ON user_notes(user_id);

-- 2.2 RBAC for the admin console
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,        -- Super Admin, Admin, Moderator, Viewer
    description TEXT
);

CREATE TABLE permissions (
    key         TEXT PRIMARY KEY,            -- dashboard, questions, billing ...
    label       TEXT NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id        INT  NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_key)
);

-- 2.3 Admin operators (separate from end users; own credential security flags)
CREATE TABLE admin_users (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                     TEXT   NOT NULL,
    username                 CITEXT UNIQUE NOT NULL,
    email                    CITEXT UNIQUE NOT NULL,
    password_hash            TEXT   NOT NULL,
    role_id                  INT    NOT NULL REFERENCES roles(id),
    mfa_enabled              BOOLEAN NOT NULL DEFAULT false,
    oauth_enabled            BOOLEAN NOT NULL DEFAULT false,
    forgot_password_enabled  BOOLEAN NOT NULL DEFAULT true,
    status                   account_status NOT NULL DEFAULT 'active',
    password_changed_at      TIMESTAMPTZ,
    last_login_at            TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-admin permission overrides on top of the role preset (optional grants)
CREATE TABLE admin_user_permissions (
    admin_user_id  UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
    granted        BOOLEAN NOT NULL DEFAULT true,   -- false = explicit revoke
    PRIMARY KEY (admin_user_id, permission_key)
);

-- 2.4 Immutable audit trail
CREATE TABLE audit_logs (
    id            BIGSERIAL PRIMARY KEY,
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action        TEXT         NOT NULL,
    category      TEXT,                       -- Questions, Users, Content ...
    severity      log_severity NOT NULL DEFAULT 'info',
    entity_type   TEXT,                       -- target table
    entity_id     TEXT,                       -- target row id
    metadata      JSONB,                      -- before/after diff, ip, ua ...
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_admin ON audit_logs(admin_user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================================
-- 3. CLINICAL TAXONOMY  (shared by questions, library, autofills)
-- ============================================================================

-- Exam programs (AKT, KFP ...) kept as a table so new exams need no migration.
CREATE TABLE exam_types (
    code  TEXT PRIMARY KEY,                   -- 'AKT', 'KFP'
    name  TEXT NOT NULL                       -- 'Applied Knowledge Test'
);

-- Clinical systems / subjects (Cardiovascular, Respiratory ...)
CREATE TABLE subjects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    icon        TEXT,                          -- ui icon key
    color       TEXT,                          -- ui accent
    sort_order  INT  NOT NULL DEFAULT 0
);

-- Subtopics belong to exactly one subject (Cardio -> "Heart Failure")
CREATE TABLE subtopics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    slug        TEXT NOT NULL,
    name        TEXT NOT NULL,
    sort_order  INT  NOT NULL DEFAULT 0,
    UNIQUE (subject_id, slug)
);
CREATE INDEX idx_subtopics_subject ON subtopics(subject_id);

-- Global tag vocabulary, reused everywhere (questions, templates, conditions)
CREATE TABLE tags (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug  CITEXT UNIQUE NOT NULL,
    label TEXT NOT NULL
);

-- ============================================================================
-- 4. QUESTION BANK & QUIZZES
-- ============================================================================

CREATE TABLE questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stem            TEXT          NOT NULL,        -- the question text
    rationale       TEXT,
    subtopic_id     UUID          REFERENCES subtopics(id) ON DELETE SET NULL,
    subject_id      UUID          REFERENCES subjects(id)  ON DELETE SET NULL,
    exam_type_code  TEXT          REFERENCES exam_types(code),
    difficulty      difficulty_level NOT NULL DEFAULT 'medium',
    status          question_status  NOT NULL DEFAULT 'draft',
    image_file_id   UUID          REFERENCES files(id) ON DELETE SET NULL,
    created_by      UUID          REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_subtopic ON questions(subtopic_id);
CREATE INDEX idx_questions_status   ON questions(status);

-- Options normalised out of the array+correctIndex pair => no redundancy.
-- "Exactly one correct option" is enforced by a partial unique index.
CREATE TABLE question_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    position    SMALLINT NOT NULL,            -- display order (0..n)
    is_correct  BOOLEAN  NOT NULL DEFAULT false,
    UNIQUE (question_id, position)
);
CREATE UNIQUE INDEX uq_question_one_correct
    ON question_options(question_id) WHERE is_correct;

CREATE TABLE question_tags (
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES tags(id)      ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

-- Quiz templates authored in the admin console
CREATE TABLE quizzes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT          NOT NULL,
    description     TEXT,
    exam_type_code  TEXT          REFERENCES exam_types(code),
    time_limit_min  INT           CHECK (time_limit_min >= 0),
    passing_score   SMALLINT      CHECK (passing_score BETWEEN 0 AND 100),
    randomize       BOOLEAN       NOT NULL DEFAULT true,
    status          quiz_status   NOT NULL DEFAULT 'draft',
    created_by      UUID          REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE quiz_questions (
    quiz_id     UUID     NOT NULL REFERENCES quizzes(id)   ON DELETE CASCADE,
    question_id UUID     NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    position    SMALLINT NOT NULL,
    PRIMARY KEY (quiz_id, question_id),
    UNIQUE (quiz_id, position)
);

-- Mock exams (full AKT simulations). Per-user progress lives in test_attempts.
CREATE TABLE mock_tests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT          NOT NULL,
    subtitle        TEXT,
    exam_type_code  TEXT          REFERENCES exam_types(code),
    question_count  INT           NOT NULL CHECK (question_count > 0),
    duration_min    INT           NOT NULL CHECK (duration_min  > 0),
    availability    mock_availability NOT NULL DEFAULT 'available',
    unlock_at       TIMESTAMPTZ,                -- when a locked mock opens
    unlock_hint     TEXT,
    sort_order      INT           NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Fixed question set for a mock (omit if mocks draw randomly at runtime)
CREATE TABLE mock_test_questions (
    mock_test_id UUID     NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
    question_id  UUID     NOT NULL REFERENCES questions(id)  ON DELETE CASCADE,
    position     SMALLINT NOT NULL,
    PRIMARY KEY (mock_test_id, question_id),
    UNIQUE (mock_test_id, position)
);

-- ============================================================================
-- 5. TEST TAKING & PERFORMANCE  (raw events → all analytics derive from here)
-- ============================================================================

CREATE TABLE test_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source          attempt_source NOT NULL,
    quiz_id         UUID REFERENCES quizzes(id)    ON DELETE SET NULL,
    mock_test_id    UUID REFERENCES mock_tests(id) ON DELETE SET NULL,
    subtopic_id     UUID REFERENCES subtopics(id)  ON DELETE SET NULL,
    title_snapshot  TEXT,                       -- label for custom/drill attempts
    status          attempt_status NOT NULL DEFAULT 'in_progress',
    total_questions INT  NOT NULL DEFAULT 0,
    correct_count   INT  NOT NULL DEFAULT 0,    -- maintained per answer (running)
    score_percent   NUMERIC(5,2),               -- final score, set on submit
    duration_seconds INT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at    TIMESTAMPTZ,
    -- a row must point at the source matching `source`
    CONSTRAINT chk_attempt_source CHECK (
        (source = 'quiz'      AND quiz_id      IS NOT NULL) OR
        (source = 'mock_test' AND mock_test_id IS NOT NULL) OR
        (source = 'subtopic'  AND subtopic_id  IS NOT NULL) OR
        (source IN ('mock_drill','custom'))
    )
);
CREATE INDEX idx_attempts_user    ON test_attempts(user_id);
CREATE INDEX idx_attempts_quiz    ON test_attempts(quiz_id);
CREATE INDEX idx_attempts_started ON test_attempts(started_at);

CREATE TABLE attempt_answers (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id         UUID NOT NULL REFERENCES test_attempts(id)   ON DELETE CASCADE,
    question_id        UUID NOT NULL REFERENCES questions(id)       ON DELETE CASCADE,
    selected_option_id UUID REFERENCES question_options(id)         ON DELETE SET NULL,
    is_correct         BOOLEAN,                 -- NULL = unattempted
    time_spent_seconds INT,
    answered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (attempt_id, question_id)
);
CREATE INDEX idx_answers_question ON attempt_answers(question_id);

-- User-curated questions (saved / flagged). One row per (user, question, kind).
CREATE TABLE user_question_bookmarks (
    user_id     UUID NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    kind        bookmark_kind NOT NULL DEFAULT 'saved',
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, question_id, kind)
);

-- ============================================================================
-- 6. CLINICAL AUTOFILL TEMPLATES  (SOAP note generators)
-- ============================================================================

CREATE TABLE autofill_templates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    description   TEXT,
    category      TEXT,                         -- Acute, Chronic, Screening ...
    subject_id    UUID REFERENCES subjects(id) ON DELETE SET NULL,
    status        template_status NOT NULL DEFAULT 'draft',
    author        TEXT,
    current_version_id UUID,                    -- FK set after versions table
    created_by    UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Version history. The actual SOAP content lives ONLY here (never duplicated
-- onto the template), so editing a draft never disturbs the published copy.
CREATE TABLE autofill_template_versions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id       UUID NOT NULL REFERENCES autofill_templates(id) ON DELETE CASCADE,
    version_label     TEXT NOT NULL,            -- 'v3.1'
    change_log        TEXT,
    subjective        TEXT,
    objective         TEXT,
    assessment        TEXT,
    plan              TEXT,
    doctor_summary    TEXT,
    patient_resources TEXT,
    references_text   TEXT,
    followup_notes    TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (template_id, version_label)
);
ALTER TABLE autofill_templates ADD CONSTRAINT fk_template_current_version
    FOREIGN KEY (current_version_id)
    REFERENCES autofill_template_versions(id) ON DELETE SET NULL;

-- Dynamic input fields shown when filling a template
CREATE TABLE autofill_fields (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id  UUID NOT NULL REFERENCES autofill_templates(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    field_type   field_type NOT NULL DEFAULT 'text',
    required     BOOLEAN NOT NULL DEFAULT false,
    placeholder  TEXT,
    position     SMALLINT NOT NULL,
    UNIQUE (template_id, position)
);

-- Options for dropdown fields (multi-valued -> own table)
CREATE TABLE autofill_field_options (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id  UUID NOT NULL REFERENCES autofill_fields(id) ON DELETE CASCADE,
    value     TEXT NOT NULL,
    position  SMALLINT NOT NULL,
    UNIQUE (field_id, position)
);

CREATE TABLE autofill_template_tags (
    template_id UUID NOT NULL REFERENCES autofill_templates(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES tags(id)               ON DELETE CASCADE,
    PRIMARY KEY (template_id, tag_id)
);

-- Users saving a template to their personal library
CREATE TABLE user_saved_templates (
    user_id     UUID NOT NULL REFERENCES users(id)               ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES autofill_templates(id)  ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, template_id)
);

-- Each time a user generates a note from a template (drives usageCount/lastUsed)
CREATE TABLE autofill_usages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES autofill_templates(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    used_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_autofill_usage_template ON autofill_usages(template_id);

-- ============================================================================
-- 7. MEDICAL LIBRARY  (conditions, guidelines + R2 PDF attachments)
-- ============================================================================

CREATE TABLE medical_conditions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    subject_id    UUID REFERENCES subjects(id) ON DELETE SET NULL,
    category      TEXT,
    kind          content_kind  NOT NULL DEFAULT 'Condition',
    status        content_status NOT NULL DEFAULT 'draft',
    is_premium    BOOLEAN NOT NULL DEFAULT false,
    clinical_notes TEXT,
    author        TEXT,
    created_by    UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    last_updated  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_conditions_subject ON medical_conditions(subject_id);

-- Symptoms / diagnosis criteria / treatment options unified — same shape,
-- distinguished by item_kind. Eliminates three near-identical tables.
CREATE TABLE condition_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_id UUID NOT NULL REFERENCES medical_conditions(id) ON DELETE CASCADE,
    item_kind    condition_item_kind NOT NULL,
    content      TEXT NOT NULL,
    position     SMALLINT NOT NULL,
    UNIQUE (condition_id, item_kind, position)
);

-- References carry an optional URL, so they get their own table
CREATE TABLE condition_references (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_id UUID NOT NULL REFERENCES medical_conditions(id) ON DELETE CASCADE,
    text         TEXT NOT NULL,
    url          TEXT,
    position     SMALLINT NOT NULL,
    UNIQUE (condition_id, position)
);

-- PDF / DOCX attachments -> point at the R2 files registry
CREATE TABLE condition_documents (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_id UUID NOT NULL REFERENCES medical_conditions(id) ON DELETE CASCADE,
    file_id      UUID NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
    total_pages  INT,
    summary      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE condition_tags (
    condition_id UUID NOT NULL REFERENCES medical_conditions(id) ON DELETE CASCADE,
    tag_id       UUID NOT NULL REFERENCES tags(id)               ON DELETE CASCADE,
    PRIMARY KEY (condition_id, tag_id)
);

-- Links a library article to the questions that reference it (used-in-questions)
CREATE TABLE condition_questions (
    condition_id UUID NOT NULL REFERENCES medical_conditions(id) ON DELETE CASCADE,
    question_id  UUID NOT NULL REFERENCES questions(id)          ON DELETE CASCADE,
    PRIMARY KEY (condition_id, question_id)
);

-- ============================================================================
-- 8. MBS BILLING REFERENCE
-- ============================================================================

CREATE TABLE mbs_categories (
    id    SERIAL PRIMARY KEY,
    name  TEXT UNIQUE NOT NULL            -- Standard Consults, Mental Health ...
);

CREATE TABLE mbs_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_number     TEXT UNIQUE NOT NULL,           -- '23', '721', '2713'
    human_title     TEXT NOT NULL,
    official_title  TEXT NOT NULL,
    category_id     INT  REFERENCES mbs_categories(id) ON DELETE SET NULL,
    time_min        SMALLINT,
    time_max        SMALLINT,
    complexity      complexity_level,
    schedule_fee    NUMERIC(10,2) NOT NULL CHECK (schedule_fee   >= 0),
    medicare_rebate NUMERIC(10,2) NOT NULL CHECK (medicare_rebate >= 0),
    bulk_billable   BOOLEAN NOT NULL DEFAULT true,
    plain_english   TEXT,
    comparison_item_id UUID REFERENCES mbs_items(id) ON DELETE SET NULL,  -- self-ref
    effective_from  DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mbs_item_common_uses (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id   UUID NOT NULL REFERENCES mbs_items(id) ON DELETE CASCADE,
    text      TEXT NOT NULL,
    position  SMALLINT NOT NULL,
    UNIQUE (item_id, position)
);

CREATE TABLE mbs_item_restrictions (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id   UUID NOT NULL REFERENCES mbs_items(id) ON DELETE CASCADE,
    text      TEXT NOT NULL,
    position  SMALLINT NOT NULL,
    UNIQUE (item_id, position)
);

CREATE TABLE mbs_item_notes (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id   UUID NOT NULL REFERENCES mbs_items(id) ON DELETE CASCADE,
    text      TEXT NOT NULL,
    position  SMALLINT NOT NULL,
    UNIQUE (item_id, position)
);

-- Search keywords reuse the global tag vocabulary
CREATE TABLE mbs_item_tags (
    item_id UUID NOT NULL REFERENCES mbs_items(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES tags(id)      ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

CREATE TABLE mbs_scenarios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id         UUID NOT NULL REFERENCES mbs_items(id) ON DELETE CASCADE,
    presentation    TEXT NOT NULL,
    time_label      TEXT,
    complexity      complexity_level,
    correct_item_id UUID REFERENCES mbs_items(id) ON DELETE SET NULL,
    reasoning       TEXT
);

CREATE TABLE user_favourite_mbs_items (
    user_id    UUID NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    item_id    UUID NOT NULL REFERENCES mbs_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, item_id)
);

-- ============================================================================
-- 9. SUBSCRIPTIONS, PLANS & PAYMENTS
-- ============================================================================

CREATE TABLE plans (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          TEXT UNIQUE NOT NULL,        -- free, core, premium
    name          TEXT NOT NULL,
    tagline       TEXT,
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_annual  NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency      CHAR(3) NOT NULL DEFAULT 'AUD',
    badge         TEXT,                         -- 'MOST POPULAR'
    is_highlighted BOOLEAN NOT NULL DEFAULT false,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    sort_order    INT NOT NULL DEFAULT 0
);

-- Catalogue of feature descriptions (defined once, reused across plans)
CREATE TABLE features (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code  TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL
);

-- What each plan offers for each feature ("50 templates", "Unlimited", "—")
CREATE TABLE plan_features (
    plan_id    UUID NOT NULL REFERENCES plans(id)    ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    value      TEXT NOT NULL,                  -- display value for comparison grid
    included   BOOLEAN NOT NULL DEFAULT true,
    position   SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (plan_id, feature_id)
);

CREATE TABLE subscriptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id              UUID NOT NULL REFERENCES plans(id),
    cycle                billing_cycle NOT NULL,
    status               subscription_status NOT NULL DEFAULT 'active',
    provider             TEXT,                       -- 'stripe'
    provider_sub_id      TEXT UNIQUE,
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    cancel_at            TIMESTAMPTZ,
    canceled_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- one active subscription per user
CREATE UNIQUE INDEX uq_user_active_subscription
    ON subscriptions(user_id) WHERE status IN ('active','trialing','past_due');

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          NUMERIC(10,2) NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'AUD',
    status          payment_status NOT NULL DEFAULT 'pending',
    provider_ref    TEXT UNIQUE,                -- gateway charge/invoice id
    invoice_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_user ON payments(user_id);

-- ============================================================================
-- 10. ENGAGEMENT  (badges, notifications, activity)
-- ============================================================================

CREATE TABLE badges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    image_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    criteria    JSONB                          -- rule that awards the badge
);

CREATE TABLE user_badges (
    user_id   UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    badge_id  UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, badge_id)
);

-- Broadcast / templated notifications authored by admins or the system
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type        TEXT NOT NULL,                 -- streak, milestone, content ...
    title       TEXT NOT NULL,
    message     TEXT,
    payload     JSONB,                         -- e.g. {count: 12}
    created_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-user delivery + read/dismiss state (state stored once, here)
CREATE TABLE user_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    is_dismissed    BOOLEAN NOT NULL DEFAULT false,
    delivered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at         TIMESTAMPTZ,
    UNIQUE (user_id, notification_id)
);
CREATE INDEX idx_user_notif_user ON user_notifications(user_id);

-- User activity feed (dashboard "recent activity")
CREATE TABLE user_activity_events (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,                 -- mock, autofill, mbs, study
    title       TEXT NOT NULL,
    meta        TEXT,
    entity_type TEXT,
    entity_id   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_user ON user_activity_events(user_id, created_at DESC);

-- ============================================================================
-- 11. APP SETTINGS  (key/value system configuration)
-- ============================================================================
CREATE TABLE app_settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 12. updated_at trigger helper
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_quizzes_updated   BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON autofill_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 13. DERIVED ANALYTICS  (no redundancy: numbers are COMPUTED, not stored)
--     Refresh the materialized views on a schedule or via triggers.
-- ============================================================================

-- Quiz stats: attempts + average score (replaces stored attempts/avgScore)
CREATE MATERIALIZED VIEW mv_quiz_stats AS
SELECT q.id AS quiz_id,
       count(a.id)                       AS attempts,
       round(avg(a.score_percent), 1)    AS avg_score
FROM quizzes q
LEFT JOIN test_attempts a
       ON a.quiz_id = q.id AND a.status = 'completed'
GROUP BY q.id;

-- Per-user, per-subject mastery (replaces stored performance/mastery)
CREATE MATERIALIZED VIEW mv_user_subject_performance AS
SELECT ta.user_id,
       q.subject_id,
       count(*) FILTER (WHERE aa.is_correct IS TRUE)  AS correct,
       count(*) FILTER (WHERE aa.is_correct IS FALSE) AS incorrect,
       count(*) FILTER (WHERE aa.is_correct IS NULL)  AS unattempted,
       round(100.0 * count(*) FILTER (WHERE aa.is_correct IS TRUE)
             / NULLIF(count(*) FILTER (WHERE aa.is_correct IS NOT NULL),0), 1) AS mastery
FROM attempt_answers aa
JOIN test_attempts ta ON ta.id = aa.attempt_id
JOIN questions     q  ON q.id  = aa.question_id
GROUP BY ta.user_id, q.subject_id;

-- Daily study activity heatmap (replaces stored studyActivity array)
CREATE MATERIALIZED VIEW mv_user_daily_activity AS
SELECT ta.user_id,
       date(aa.answered_at) AS day,
       count(*)             AS questions_answered
FROM attempt_answers aa
JOIN test_attempts ta ON ta.id = aa.attempt_id
GROUP BY ta.user_id, date(aa.answered_at);

-- Template usage counts + last-used (replaces stored usageCount/lastUsed)
CREATE MATERIALIZED VIEW mv_template_usage AS
SELECT t.id AS template_id,
       count(u.id)   AS usage_count,
       max(u.used_at) AS last_used_at
FROM autofill_templates t
LEFT JOIN autofill_usages u ON u.template_id = t.id
GROUP BY t.id;

-- Subtopic question counts (replaces stored questionCount everywhere)
CREATE VIEW v_subtopic_question_counts AS
SELECT s.id AS subtopic_id,
       count(q.id) FILTER (WHERE q.status = 'published') AS published_questions
FROM subtopics s
LEFT JOIN questions q ON q.subtopic_id = s.id
GROUP BY s.id;

-- ============================================================================
--  END OF SCHEMA
-- ============================================================================

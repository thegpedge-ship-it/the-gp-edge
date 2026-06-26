-- ============================================================================
--  GP EDGE — Production Database Schema
--  Engine : PostgreSQL 15+  (works on Supabase / Neon / RDS / Cloud SQL)
--  Binary file storage : Cloudflare R2  (only metadata + object keys live here)
--
--  Design principles
--    * 3NF / BCNF throughout — no repeating groups, no transitive dependencies.
--    * Every multi-valued attribute (options, tags, symptoms ...) is a
--      child table — NOT a comma string or array — so there is zero redundancy.
--    * Derived numbers (avg score, mastery, usage, ...) are COMPUTED in views,
--      EXCEPT a few hot dashboard aggregates that are kept as maintained summary
--      tables so the dashboard never recomputes from raw rows.  See sections 13/14.
--    * Surrogate UUID primary keys; natural keys kept UNIQUE where they exist.
--    * Referential integrity enforced with FKs + ON DELETE rules.
--    * Soft delete (deleted_at) on every admin-authored / historically-referenced
--      table — nothing is ever physically removed.  See section 0 notes.
-- ============================================================================
--
--  REVISION LOG — changes made to satisfy the Developer Requirements Brief
--  ---------------------------------------------------------------------------
--   Brief §1  Roles      -> roles restricted to 3 (CHECK + stable `code`);
--                           single-Super-Admin enforced in the DB by a trigger;
--                           admin_users.created_by records who created an admin.
--   Brief §2  Exams      -> quiz_configs (+ child tables) save a user's quiz
--                           choices; user_subject_mastery stores weak/strong
--                           scores for drills; attempt_questions /
--                           attempt_question_options snapshot the WHOLE question
--                           set (answered or not) at start; test_attempts gets a
--                           server-side expires_at (tab-close-proof timer); a
--                           trigger LOCKS an attempt once submitted.
--   Brief §3  Questions  -> question_subjects / question_subtopics give true
--                           many-to-many; old attempts read the snapshot, so
--                           editing a question never changes past attempts.
--   Brief §4  Dashboard  -> maintained summary tables (user_subject_mastery,
--                           user_performance_summary) keep the dashboard fast.
--   Brief §5  Autofill   -> versions store formatted content (content_format) and
--                           are full-text searchable; versions.created_by + when.
--   Brief §6  Directory  -> content_kind gains 'Approach'; FTS search_vector so
--                           Condition Search & Approach Search drop in with no
--                           rebuild; proper search instead of exact match.
--   Brief §7  MBS        -> mbs_sync_runs logs every government pull;
--                           mbs_item_fee_history keeps fee history (no overwrite);
--                           mbs_items records last_synced_at + source.
--   Brief §8  Subs       -> features.is_premium flag (add premium features with
--                           no schema change); trials, refunds, promo codes.
--   Brief §9  Badges     -> user_badge_progress shows progress ("4 of 7").
--   Brief §10 Settings   -> user_preferences (theme, notifications, defaults...).
--   Brief §11 Platform   -> deleted_at soft delete; created_at/updated_at +
--                           triggers everywhere; audit_logs already present;
--                           BRIN indexes + partitioning notes for scale.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";        -- case-insensitive email/slug
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- fuzzy / similarity search

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
CREATE TYPE payment_status      AS ENUM ('pending','succeeded','failed','refunded','partially_refunded');
CREATE TYPE file_status         AS ENUM ('pending','active','quarantined','deleted');
CREATE TYPE log_severity        AS ENUM ('info','warning','critical');
CREATE TYPE bookmark_kind       AS ENUM ('saved','flagged');
-- Brief §6: 'Approach' added so an Approach Search can be layered on with no rebuild.
CREATE TYPE content_kind        AS ENUM ('Condition','Approach','Guideline','Protocol','Pathway','Document','Note');
CREATE TYPE condition_item_kind AS ENUM ('symptom','diagnosis_criterion','treatment_option','clinical_note');
CREATE TYPE mock_availability   AS ENUM ('available','locked');
CREATE TYPE account_status      AS ENUM ('active','suspended','deleted');
-- New in this revision:
CREATE TYPE content_format      AS ENUM ('plaintext','html','markdown');   -- Brief §5 formatting
CREATE TYPE subject_strength    AS ENUM ('weak','developing','strong');    -- Brief §2/§4 drills
CREATE TYPE discount_type       AS ENUM ('percent','fixed_amount');        -- Brief §8 promo codes
CREATE TYPE mbs_sync_status     AS ENUM ('running','success','partial','failed'); -- Brief §7
CREATE TYPE refund_status       AS ENUM ('pending','succeeded','failed');  -- Brief §8 refunds

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
    -- An upload comes from exactly one actor: an end user OR an admin (most
    -- files — question images, medical directory PDFs, badge art — are uploaded
    -- by admins). Both FKs are added after their target tables exist.
    uploaded_by       UUID,                               -- end user uploader
    uploaded_by_admin UUID,                               -- admin uploader
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (bucket, object_key),
    -- at most one uploader actor may be set
    CONSTRAINT one_uploader CHECK (
        (uploaded_by IS NOT NULL)::int + (uploaded_by_admin IS NOT NULL)::int <= 1
    )
);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_uploaded_by_admin ON files(uploaded_by_admin);

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
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ                          -- Brief §11 soft delete
);
ALTER TABLE files ADD CONSTRAINT fk_files_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- 2.1b Per-user preferences (Brief §10 — did not exist before).
--      One row per user. Common prefs are typed columns; anything new goes in
--      `extra` (JSONB) so adding a preference needs no migration.
CREATE TABLE user_preferences (
    user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme                 TEXT    NOT NULL DEFAULT 'system',   -- light | dark | system
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    email_notifications   BOOLEAN NOT NULL DEFAULT true,
    push_notifications    BOOLEAN NOT NULL DEFAULT false,
    default_exam_type_code TEXT,                               -- FK added after exam_types
    default_question_count INT    CHECK (default_question_count > 0),
    language              TEXT    NOT NULL DEFAULT 'en-AU',
    timezone              TEXT    NOT NULL DEFAULT 'Australia/Sydney',
    extra                 JSONB   NOT NULL DEFAULT '{}'::jsonb,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 RBAC for the admin console
-- Brief §1: exactly three roles exist. `code` is the stable machine key the
-- single-super-admin trigger keys off; the CHECK stops a 4th role being added.
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    code        TEXT UNIQUE NOT NULL CHECK (code IN ('super_admin','admin','user')),
    name        TEXT UNIQUE NOT NULL CHECK (name IN ('Super Admin','Admin','User')),
    description TEXT
);

-- The three roles are a fixed lookup. They are seeded with explicit, stable ids
-- so the `one_super_admin` partial unique index below can key off a constant
-- (Postgres forbids subqueries / non-immutable expressions in an index predicate).
INSERT INTO roles (id, code, name, description) VALUES
    (1, 'super_admin', 'Super Admin', 'Full control; exactly one exists'),
    (2, 'admin',       'Admin',       'Operator with role + per-admin permissions'),
    (3, 'user',        'User',        'End user / student');
SELECT setval(pg_get_serial_sequence('roles','id'), 3, true);

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
--     Brief §1: created_by records who created each admin. The Super Admin is
--     created once at bootstrap (created_by NULL); every other admin is created
--     BY the Super Admin (or a permitted Admin).
CREATE TABLE admin_users (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                     TEXT   NOT NULL,
    username                 CITEXT UNIQUE NOT NULL,
    email                    CITEXT UNIQUE NOT NULL,
    password_hash            TEXT   NOT NULL,
    role_id                  INT    NOT NULL REFERENCES roles(id),
    created_by               UUID   REFERENCES admin_users(id) ON DELETE SET NULL,
    mfa_enabled              BOOLEAN NOT NULL DEFAULT false,
    oauth_enabled            BOOLEAN NOT NULL DEFAULT false,
    forgot_password_enabled  BOOLEAN NOT NULL DEFAULT true,
    status                   account_status NOT NULL DEFAULT 'active',
    password_changed_at      TIMESTAMPTZ,
    last_login_at            TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ                     -- Brief §11 soft delete
);
CREATE INDEX idx_admin_users_created_by ON admin_users(created_by);

-- files uploaded by an admin (question images, directory PDFs, badge art).
ALTER TABLE files ADD CONSTRAINT fk_files_uploaded_by_admin
    FOREIGN KEY (uploaded_by_admin) REFERENCES admin_users(id) ON DELETE SET NULL;

-- Brief §1: the DATABASE (not just the app) blocks a second Super Admin and
-- blocks anyone — including the Super Admin — from creating another one.
CREATE OR REPLACE FUNCTION enforce_single_super_admin() RETURNS TRIGGER AS $$
DECLARE
    super_role_id INT;
    existing      INT;
BEGIN
    SELECT id INTO super_role_id FROM roles WHERE code = 'super_admin';
    IF NEW.role_id = super_role_id THEN
        SELECT count(*) INTO existing
        FROM admin_users
        WHERE role_id = super_role_id
          AND deleted_at IS NULL
          AND id <> NEW.id;
        IF existing > 0 THEN
            RAISE EXCEPTION 'Only one Super Admin may exist in the system';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_super_admin
    BEFORE INSERT OR UPDATE OF role_id ON admin_users
    FOR EACH ROW EXECUTE FUNCTION enforce_single_super_admin();

-- Hard safety net: a trigger alone can be bypassed under concurrent inserts
-- (two transactions each see zero existing Super Admins, both commit). A partial
-- unique index makes a second Super Admin physically impossible. role_id = 1 is
-- the seeded super_admin id (a constant — index predicates can't use subqueries).
CREATE UNIQUE INDEX one_super_admin ON admin_users (role_id)
    WHERE role_id = 1;

-- Per-admin permission overrides on top of the role preset (optional grants).
-- Brief §1: two admins can share a role yet differ here (one edits questions,
-- the other can't).  granted = false is an explicit revoke.
CREATE TABLE admin_user_permissions (
    admin_user_id  UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
    granted        BOOLEAN NOT NULL DEFAULT true,   -- false = explicit revoke
    PRIMARY KEY (admin_user_id, permission_key)
);

-- 2.4 Immutable audit trail (Brief §11 — every admin action, who + when).
--     Append-only & high-volume -> see partitioning note in section 15.
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
CREATE INDEX idx_audit_admin   ON audit_logs(admin_user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
-- BRIN is tiny & ideal for an append-only, time-ordered log at scale.
CREATE INDEX brin_audit_created ON audit_logs USING brin(created_at);

-- ============================================================================
-- 3. CLINICAL TAXONOMY  (shared by questions, library, autofills)
-- ============================================================================

-- Exam programs (AKT, KFP ...) kept as a table so new exams need no migration.
CREATE TABLE exam_types (
    code  TEXT PRIMARY KEY,                   -- 'AKT', 'KFP'
    name  TEXT NOT NULL                       -- 'Applied Knowledge Test'
);
ALTER TABLE user_preferences ADD CONSTRAINT fk_pref_exam_type
    FOREIGN KEY (default_exam_type_code) REFERENCES exam_types(code) ON DELETE SET NULL;

-- Clinical systems / subjects (Cardiovascular, Respiratory ...)
CREATE TABLE subjects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    icon        TEXT,                          -- ui icon key
    color       TEXT,                          -- ui accent
    sort_order  INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

-- Subtopics belong to exactly one subject (Cardio -> "Heart Failure")
CREATE TABLE subtopics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    slug        TEXT NOT NULL,
    name        TEXT NOT NULL,
    sort_order  INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
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

-- Brief §3: questions keep a *primary* subject/subtopic for fast default
-- filtering & analytics, but a question may map to MANY subjects and MANY
-- subtopics via the junction tables below.
CREATE TABLE questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stem            TEXT          NOT NULL,        -- the question text
    rationale       TEXT,
    subtopic_id     UUID          REFERENCES subtopics(id) ON DELETE SET NULL,  -- primary
    subject_id      UUID          REFERENCES subjects(id)  ON DELETE SET NULL,  -- primary
    exam_type_code  TEXT          REFERENCES exam_types(code),
    difficulty      difficulty_level NOT NULL DEFAULT 'medium',
    status          question_status  NOT NULL DEFAULT 'draft',
    image_file_id   UUID          REFERENCES files(id) ON DELETE SET NULL,
    created_by      UUID          REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ                     -- Brief §11 soft delete
);
CREATE INDEX idx_questions_subtopic ON questions(subtopic_id);
CREATE INDEX idx_questions_status   ON questions(status);

-- Brief §3: a question can belong to MORE THAN ONE subject / sub-subject.
CREATE TABLE question_subjects (
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    subject_id  UUID NOT NULL REFERENCES subjects(id)  ON DELETE CASCADE,
    PRIMARY KEY (question_id, subject_id)
);
CREATE TABLE question_subtopics (
    question_id UUID NOT NULL REFERENCES questions(id)  ON DELETE CASCADE,
    subtopic_id UUID NOT NULL REFERENCES subtopics(id)  ON DELETE CASCADE,
    PRIMARY KEY (question_id, subtopic_id)
);

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
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
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
    created_by      UUID          REFERENCES admin_users(id) ON DELETE SET NULL,  -- admin who built it (parity with quizzes)
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

-- Brief §2: Mock Test = a fixed question set built by an admin in advance.
CREATE TABLE mock_test_questions (
    mock_test_id UUID     NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
    question_id  UUID     NOT NULL REFERENCES questions(id)  ON DELETE CASCADE,
    position     SMALLINT NOT NULL,
    PRIMARY KEY (mock_test_id, question_id),
    UNIQUE (mock_test_id, position)
);

-- Brief §2 (Create Quiz): persist the user's build choices so a quiz can be
-- reused / shown again. The chosen subjects & subtopics are normalised out.
CREATE TABLE quiz_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           TEXT,                       -- user-given name, optional
    difficulty      difficulty_level,           -- NULL = mixed
    exam_type_code  TEXT REFERENCES exam_types(code),
    question_count  INT  NOT NULL CHECK (question_count > 0),
    time_limit_min  INT  CHECK (time_limit_min >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_configs_user ON quiz_configs(user_id);

CREATE TABLE quiz_config_subjects (
    config_id  UUID NOT NULL REFERENCES quiz_configs(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id)     ON DELETE CASCADE,
    PRIMARY KEY (config_id, subject_id)
);
CREATE TABLE quiz_config_subtopics (
    config_id   UUID NOT NULL REFERENCES quiz_configs(id) ON DELETE CASCADE,
    subtopic_id UUID NOT NULL REFERENCES subtopics(id)    ON DELETE CASCADE,
    PRIMARY KEY (config_id, subtopic_id)
);

-- ============================================================================
-- 5. TEST TAKING & PERFORMANCE  (raw events → all analytics derive from here)
-- ============================================================================

-- Brief §2: server-authoritative timer. expires_at is computed at start from the
-- source's duration; the client cannot reset it by closing the tab, and the
-- server treats now() > expires_at as expired. status is LOCKED once submitted
-- (see trigger below).
CREATE TABLE test_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source          attempt_source NOT NULL,
    quiz_id         UUID REFERENCES quizzes(id)      ON DELETE SET NULL,
    mock_test_id    UUID REFERENCES mock_tests(id)   ON DELETE SET NULL,
    subtopic_id     UUID REFERENCES subtopics(id)    ON DELETE SET NULL,
    quiz_config_id  UUID REFERENCES quiz_configs(id) ON DELETE SET NULL,  -- Create Quiz / drill
    title_snapshot  TEXT,                       -- label for custom/drill attempts
    status          attempt_status NOT NULL DEFAULT 'in_progress',
    total_questions INT  NOT NULL DEFAULT 0,
    correct_count   INT  NOT NULL DEFAULT 0,    -- maintained per answer (running)
    score_percent   NUMERIC(5,2),               -- final score, set on submit
    duration_seconds INT,                       -- allotted time in seconds
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,                -- Brief §2 tab-close-proof deadline
    last_seen_at    TIMESTAMPTZ,                -- heartbeat, for resume
    submitted_at    TIMESTAMPTZ,
    -- a row must point at the source matching `source`
    CONSTRAINT chk_attempt_source CHECK (
        (source = 'quiz'       AND quiz_id      IS NOT NULL) OR
        (source = 'mock_test'  AND mock_test_id IS NOT NULL) OR
        (source = 'subtopic'   AND subtopic_id  IS NOT NULL) OR
        (source IN ('mock_drill','custom'))
    )
);
CREATE INDEX idx_attempts_user    ON test_attempts(user_id);
CREATE INDEX idx_attempts_quiz    ON test_attempts(quiz_id);
CREATE INDEX idx_attempts_started ON test_attempts(started_at);

-- Brief §2 + §3: the WHOLE question set is frozen against the attempt the
-- moment it starts — including questions not yet answered — and stores a
-- SNAPSHOT of the stem/options. So leaving & returning shows the same set, and
-- if an admin later edits (or soft-deletes) the question, this past attempt
-- still shows the original wording & correct answer.
CREATE TABLE attempt_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id          UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id         UUID REFERENCES questions(id) ON DELETE SET NULL,  -- original (nullable if purged)
    position            SMALLINT NOT NULL,
    stem_snapshot       TEXT NOT NULL,
    rationale_snapshot  TEXT,
    difficulty_snapshot difficulty_level,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (attempt_id, position),
    UNIQUE (attempt_id, question_id)
);
CREATE INDEX idx_attempt_questions_attempt ON attempt_questions(attempt_id);

-- Snapshot of each option as it was when the attempt started.
CREATE TABLE attempt_question_options (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id UUID NOT NULL REFERENCES attempt_questions(id) ON DELETE CASCADE,
    option_id           UUID REFERENCES question_options(id) ON DELETE SET NULL,  -- original
    label_snapshot      TEXT NOT NULL,
    position            SMALLINT NOT NULL,
    is_correct          BOOLEAN  NOT NULL DEFAULT false,
    UNIQUE (attempt_question_id, position)
);

-- One answer row per snapshotted question. is_correct NULL = still unanswered.
CREATE TABLE attempt_answers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id UUID NOT NULL UNIQUE REFERENCES attempt_questions(id) ON DELETE CASCADE,
    selected_option_id  UUID REFERENCES attempt_question_options(id) ON DELETE SET NULL,
    is_correct          BOOLEAN,                 -- NULL = unattempted
    time_spent_seconds  INT,
    answered_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_answers_attempt_question ON attempt_answers(attempt_question_id);

-- Brief §2: once submitted/expired, an attempt is LOCKED — no edits, no reopen.
CREATE OR REPLACE FUNCTION lock_submitted_attempt() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('completed','expired') THEN
        RAISE EXCEPTION 'Attempt % is locked (status=%) and cannot be modified',
            OLD.id, OLD.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_attempt
    BEFORE UPDATE ON test_attempts
    FOR EACH ROW EXECUTE FUNCTION lock_submitted_attempt();

-- Block edits to answers belonging to a locked attempt.
CREATE OR REPLACE FUNCTION lock_submitted_attempt_answers() RETURNS TRIGGER AS $$
DECLARE st attempt_status;
BEGIN
    SELECT ta.status INTO st
    FROM attempt_questions aq
    JOIN test_attempts ta ON ta.id = aq.attempt_id
    WHERE aq.id = COALESCE(NEW.attempt_question_id, OLD.attempt_question_id);
    IF st IN ('completed','expired') THEN
        RAISE EXCEPTION 'Cannot modify answers of a locked attempt';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_attempt_answers
    BEFORE INSERT OR UPDATE OR DELETE ON attempt_answers
    FOR EACH ROW EXECUTE FUNCTION lock_submitted_attempt_answers();

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
    current_version_id UUID,                    -- FK set after versions table
    created_by    UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ                    -- Brief §11 soft delete
);

-- Version history. The actual SOAP content lives ONLY here (never duplicated
-- onto the template), so editing a draft never disturbs the published copy.
-- Brief §5: content is FORMATTED (bold/bullets/headings) — content_format tells
-- the client how to render the stored body so it copies "as-is". created_by +
-- created_at record which admin authored each version and when.
CREATE TABLE autofill_template_versions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id       UUID NOT NULL REFERENCES autofill_templates(id) ON DELETE CASCADE,
    version_label     TEXT NOT NULL,            -- 'v3.1'
    change_log        TEXT,
    content_format    content_format NOT NULL DEFAULT 'html',  -- Brief §5
    subjective        TEXT,
    objective         TEXT,
    assessment        TEXT,
    plan              TEXT,
    doctor_summary    TEXT,
    patient_resources TEXT,
    references_text   TEXT,
    followup_notes    TEXT,
    -- Brief §5: searchable by CONTENT, not just by name. Generated FTS column.
    search_vector     tsvector GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(subjective,'')        || ' ' ||
            coalesce(objective,'')         || ' ' ||
            coalesce(assessment,'')        || ' ' ||
            coalesce(plan,'')              || ' ' ||
            coalesce(doctor_summary,'')    || ' ' ||
            coalesce(patient_resources,'') || ' ' ||
            coalesce(references_text,'')   || ' ' ||
            coalesce(followup_notes,'')
        )
    ) STORED,
    created_by        UUID REFERENCES admin_users(id) ON DELETE SET NULL,  -- Brief §5
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (template_id, version_label)
);
CREATE INDEX idx_template_versions_fts
    ON autofill_template_versions USING gin(search_vector);
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
-- 7. MEDICAL LIBRARY / DIRECTORY  (conditions, approaches + R2 PDF attachments)
-- ============================================================================

-- Brief §6: `kind` distinguishes Condition vs Approach (and more) so the two
-- planned searches (Condition Search / Approach Search) are just filters on the
-- same table — no rebuild needed. search_vector gives proper (non-exact) search.
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
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(name,'')           || ' ' ||
            coalesce(category,'')       || ' ' ||
            coalesce(clinical_notes,''))
    ) STORED,
    created_by    UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ                       -- Brief §11 soft delete
);
CREATE INDEX idx_conditions_subject ON medical_conditions(subject_id);
CREATE INDEX idx_conditions_kind    ON medical_conditions(kind);
CREATE INDEX idx_conditions_fts     ON medical_conditions USING gin(search_vector);
CREATE INDEX idx_conditions_name_trgm ON medical_conditions USING gin(name gin_trgm_ops);

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

-- Brief §6: each piece of content can link to specific questions.
CREATE TABLE condition_questions (
    condition_id UUID NOT NULL REFERENCES medical_conditions(id) ON DELETE CASCADE,
    question_id  UUID NOT NULL REFERENCES questions(id)          ON DELETE CASCADE,
    PRIMARY KEY (condition_id, question_id)
);

-- ============================================================================
-- 8. MBS BILLING REFERENCE
--    Brief §7: this data comes from the OFFICIAL government MBS source, never
--    admin uploads. We track when it was last pulled, keep fee history, and log
--    every sync run.
-- ============================================================================

CREATE TABLE mbs_categories (
    id    SERIAL PRIMARY KEY,
    name  TEXT UNIQUE NOT NULL            -- Standard Consults, Mental Health ...
);

-- A sync run = one pull from the government source. The latest success row tells
-- us "when data was last pulled". (Brief §7)
CREATE TABLE mbs_sync_runs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url    TEXT NOT NULL,                 -- gov endpoint / file pulled
    source_label  TEXT,                          -- e.g. 'MBS XML 2026-05'
    status        mbs_sync_status NOT NULL DEFAULT 'running',
    items_added   INT NOT NULL DEFAULT 0,
    items_updated INT NOT NULL DEFAULT 0,
    items_removed INT NOT NULL DEFAULT 0,
    error_text    TEXT,                          -- populated on partial/failed
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at  TIMESTAMPTZ
);
CREATE INDEX idx_mbs_sync_completed ON mbs_sync_runs(completed_at DESC);

CREATE TABLE mbs_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_number     TEXT UNIQUE NOT NULL,           -- '23', '721', '2713'
    human_title     TEXT NOT NULL,
    official_title  TEXT NOT NULL,
    category_id     INT  REFERENCES mbs_categories(id) ON DELETE SET NULL,
    time_min        SMALLINT,
    time_max        SMALLINT,
    complexity      complexity_level,
    schedule_fee    NUMERIC(10,2) NOT NULL CHECK (schedule_fee    >= 0),  -- current fee
    medicare_rebate NUMERIC(10,2) NOT NULL CHECK (medicare_rebate >= 0),  -- current rebate
    bulk_billable   BOOLEAN NOT NULL DEFAULT true,
    plain_english   TEXT,
    comparison_item_id UUID REFERENCES mbs_items(id) ON DELETE SET NULL,  -- self-ref
    effective_from  DATE,
    source          TEXT,                          -- Brief §7: which gov dataset
    last_synced_at  TIMESTAMPTZ,                   -- Brief §7: when last pulled
    last_sync_id    UUID REFERENCES mbs_sync_runs(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ                     -- Brief §11 soft delete (gov item retired)
);

-- Brief §7: keep a HISTORY of fee/rebate changes — never overwrite old numbers.
-- A new row is inserted each time a sync detects the fee changed; effective_to
-- on the prior row is closed off.
CREATE TABLE mbs_item_fee_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id         UUID NOT NULL REFERENCES mbs_items(id) ON DELETE CASCADE,
    schedule_fee    NUMERIC(10,2) NOT NULL CHECK (schedule_fee    >= 0),
    medicare_rebate NUMERIC(10,2) NOT NULL CHECK (medicare_rebate >= 0),
    effective_from  DATE NOT NULL,
    effective_to    DATE,                          -- NULL = currently in effect
    sync_id         UUID REFERENCES mbs_sync_runs(id) ON DELETE SET NULL,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mbs_fee_history_item ON mbs_item_fee_history(item_id, effective_from DESC);
-- Only one "current" (open-ended) fee row per item.
CREATE UNIQUE INDEX uq_mbs_fee_current
    ON mbs_item_fee_history(item_id) WHERE effective_to IS NULL;

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
    trial_days    INT NOT NULL DEFAULT 0 CHECK (trial_days >= 0),  -- Brief §8 free trials
    badge         TEXT,                         -- 'MOST POPULAR'
    is_highlighted BOOLEAN NOT NULL DEFAULT false,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    sort_order    INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);

-- Catalogue of feature descriptions (defined once, reused across plans).
-- Brief §8: flag a feature as premium and attach it to a plan — a NEW premium
-- feature is just a new row here + plan_features link; NO schema change.
CREATE TABLE features (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code       TEXT UNIQUE NOT NULL,
    label      TEXT NOT NULL,
    is_premium BOOLEAN NOT NULL DEFAULT false   -- Brief §8
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

-- Brief §8: discount / promo codes.
CREATE TABLE promo_codes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code             CITEXT UNIQUE NOT NULL,
    description      TEXT,
    discount_type    discount_type NOT NULL,
    discount_value   NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),  -- % or amount
    currency         CHAR(3),                       -- for fixed_amount only
    plan_id          UUID REFERENCES plans(id) ON DELETE CASCADE,        -- NULL = any plan
    max_redemptions  INT  CHECK (max_redemptions IS NULL OR max_redemptions > 0),
    times_redeemed   INT  NOT NULL DEFAULT 0,
    valid_from       TIMESTAMPTZ,
    valid_until      TIMESTAMPTZ,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    created_by       UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ
);

CREATE TABLE subscriptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id              UUID NOT NULL REFERENCES plans(id),
    cycle                billing_cycle NOT NULL,
    status               subscription_status NOT NULL DEFAULT 'active',
    provider             TEXT,                       -- 'stripe'
    provider_sub_id      TEXT UNIQUE,
    promo_code_id        UUID REFERENCES promo_codes(id) ON DELETE SET NULL,  -- Brief §8
    trial_start          TIMESTAMPTZ,                -- Brief §8 free trials
    trial_end            TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    cancel_at            TIMESTAMPTZ,
    canceled_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- Brief §8: refunds (full or partial; a payment can have more than one).
CREATE TABLE refunds (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id    UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    reason        TEXT,
    status        refund_status NOT NULL DEFAULT 'pending',
    provider_ref  TEXT UNIQUE,                  -- gateway refund id
    created_by    UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at  TIMESTAMPTZ
);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);

-- Audit which user redeemed which promo (and on what subscription/payment).
CREATE TABLE promo_redemptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id   UUID NOT NULL REFERENCES promo_codes(id)   ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id)          ON DELETE SET NULL,
    payment_id      UUID REFERENCES payments(id)               ON DELETE SET NULL,
    redeemed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (promo_code_id, user_id)             -- one redemption per user per code
);

-- ============================================================================
-- 10. ENGAGEMENT  (badges, notifications, activity)
-- ============================================================================

-- Brief §9: badges are awarded automatically. target_value + progress_unit let
-- the UI render progress ("4 of 7 days") alongside earned/not-earned.
CREATE TABLE badges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    image_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    criteria    JSONB,                         -- rule that awards the badge
    target_value INT,                          -- Brief §9: e.g. 7 (days)
    progress_unit TEXT,                        -- Brief §9: e.g. 'days','questions'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE user_badges (
    user_id   UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    badge_id  UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, badge_id)
);

-- Brief §9: running progress toward a not-yet-earned badge (maintained as the
-- user is active), so the dashboard shows "4 of 7" without recomputation.
CREATE TABLE user_badge_progress (
    user_id       UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    badge_id      UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    current_value INT  NOT NULL DEFAULT 0,
    target_value  INT  NOT NULL,               -- copied from badge at tracking start
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
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

-- User activity feed (dashboard "recent activity"). High-volume -> BRIN + see §15.
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
CREATE INDEX brin_activity_created ON user_activity_events USING brin(created_at);

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
-- 12. updated_at trigger helper  (Brief §11 — every important table tracks when
--     it was created and last changed)
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated      BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_prefs_updated BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_admin_users_updated BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subjects_updated   BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subtopics_updated  BEFORE UPDATE ON subtopics
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_questions_updated  BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_quizzes_updated    BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_quiz_configs_updated BEFORE UPDATE ON quiz_configs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_mock_tests_updated BEFORE UPDATE ON mock_tests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_templates_updated  BEFORE UPDATE ON autofill_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_conditions_updated BEFORE UPDATE ON medical_conditions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_mbs_items_updated  BEFORE UPDATE ON mbs_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_plans_updated      BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_promo_codes_updated BEFORE UPDATE ON promo_codes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_badges_updated     BEFORE UPDATE ON badges
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 13. MAINTAINED DASHBOARD SUMMARIES  (Brief §2 & §4)
--     These are NOT recomputed from raw rows on every page load. The app updates
--     them incrementally when an attempt is submitted (a single UPSERT per
--     subject), so the dashboard and Mock Drill subject-selection read one tiny
--     row each instead of scanning attempt_answers.
-- ============================================================================

-- Per-user, per-subject mastery & weak/strong flag (drives Mock Drill + dashboard)
CREATE TABLE user_subject_mastery (
    user_id        UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    subject_id     UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    correct_count  INT NOT NULL DEFAULT 0,
    incorrect_count INT NOT NULL DEFAULT 0,
    total_answered INT NOT NULL DEFAULT 0,
    mastery_percent NUMERIC(5,2),
    strength       subject_strength,            -- weak | developing | strong
    last_attempt_at TIMESTAMPTZ,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, subject_id)
);
CREATE INDEX idx_mastery_user_strength ON user_subject_mastery(user_id, strength);

-- One-row-per-user rollup for the top-of-dashboard cards (accuracy, totals, streak)
CREATE TABLE user_performance_summary (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_attempts      INT NOT NULL DEFAULT 0,
    total_questions     INT NOT NULL DEFAULT 0,
    total_correct       INT NOT NULL DEFAULT 0,
    overall_accuracy    NUMERIC(5,2),
    current_streak_days INT NOT NULL DEFAULT 0,
    longest_streak_days INT NOT NULL DEFAULT 0,
    last_active_date    DATE,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 14. DERIVED ANALYTICS  (computed views — for reporting / back-office, and to
--     rebuild the section-13 summaries from scratch if they ever drift)
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

-- Per-user, per-subject mastery rebuilt from the snapshotted attempt data.
-- (Source of truth for refilling user_subject_mastery.)
CREATE MATERIALIZED VIEW mv_user_subject_performance AS
SELECT ta.user_id,
       q.subject_id,
       count(*) FILTER (WHERE aa.is_correct IS TRUE)  AS correct,
       count(*) FILTER (WHERE aa.is_correct IS FALSE) AS incorrect,
       count(*) FILTER (WHERE aa.is_correct IS NULL)  AS unattempted,
       round(100.0 * count(*) FILTER (WHERE aa.is_correct IS TRUE)
             / NULLIF(count(*) FILTER (WHERE aa.is_correct IS NOT NULL),0), 1) AS mastery
FROM attempt_answers aa
JOIN attempt_questions aq ON aq.id = aa.attempt_question_id
JOIN test_attempts     ta ON ta.id = aq.attempt_id
JOIN questions         q  ON q.id  = aq.question_id
GROUP BY ta.user_id, q.subject_id;

-- Daily study activity heatmap (replaces stored studyActivity array)
CREATE MATERIALIZED VIEW mv_user_daily_activity AS
SELECT ta.user_id,
       date(aa.answered_at) AS day,
       count(*)             AS questions_answered
FROM attempt_answers aa
JOIN attempt_questions aq ON aq.id = aa.attempt_question_id
JOIN test_attempts     ta ON ta.id = aq.attempt_id
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
       count(q.id) FILTER (WHERE q.status = 'published' AND q.deleted_at IS NULL)
           AS published_questions
FROM subtopics s
LEFT JOIN questions q ON q.subtopic_id = s.id
GROUP BY s.id;

-- ============================================================================
-- 15. SCALE NOTES  (Brief §11 — a few thousand → hundreds of thousands of users)
-- ----------------------------------------------------------------------------
--  The three append-only / fastest-growing tables are test_attempts +
--  attempt_answers (exam history), audit_logs, and user_activity_events.
--  For high volume, declare them as RANGE-partitioned by month BEFORE go-live
--  (cheap now, painful to retrofit):
--
--    CREATE TABLE audit_logs (...) PARTITION BY RANGE (created_at);
--    CREATE TABLE audit_logs_2026_06 PARTITION OF audit_logs
--      FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
--    -- automate monthly partition creation with pg_partman or a cron job.
--
--  Partition attempt_answers by answered_at and user_activity_events by
--  created_at the same way. The BRIN indexes above keep time-range scans cheap.
--  Dashboard reads hit the maintained summaries in section 13, not raw rows, so
--  per-user page loads stay O(1) regardless of total history size.
-- ============================================================================

-- ============================================================================
--  END OF SCHEMA
-- ============================================================================

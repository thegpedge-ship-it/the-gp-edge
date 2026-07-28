-- ============================================================================
--  GP EDGE — Stripe Integration Migration
--  Date: 2026-07-27
--  Applies to: PostgreSQL 15+ (Neon)
--
--  Summary of changes:
--    1. users table       → stripe_customer_id, user_role, has_purchased_registrar,
--                           free_questions_left, free_templates_left, free_topics_left
--    2. subscriptions     → access_level, access_expires_at, payment_mode,
--                           stripe_price_id, stripe_checkout_session_id
--    3. payments          → stripe_price_id (which product was purchased)
--    4. New ENUMs         → user_role_kind, access_level_kind, payment_mode_kind
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. New ENUM types (idempotent guard via DO block)
-- ────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- user_role_kind: Registrar vs Fellow (determines which plans are visible)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_kind') THEN
    CREATE TYPE user_role_kind AS ENUM ('REGISTRAR', 'FELLOW');
  END IF;

  -- access_level_kind: what the user currently has access to
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level_kind') THEN
    CREATE TYPE access_level_kind AS ENUM (
      'FREE',
      'REGISTRAR',
      'FELLOWSHIP',
      'POST_REGISTRAR_UPGRADE'
    );
  END IF;

  -- payment_mode_kind: one-time charge vs recurring subscription
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_mode_kind') THEN
    CREATE TYPE payment_mode_kind AS ENUM ('payment', 'subscription');
  END IF;
END
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Extend the `users` table
-- ────────────────────────────────────────────────────────────────────────────

-- Stripe customer ID (set when a checkout session is first created)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Clinical role: determines which pricing plans are visible to this user.
-- Default 'REGISTRAR' (most users are GP Registrars).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS user_role user_role_kind NOT NULL DEFAULT 'REGISTRAR';

-- Tracks whether this user has EVER purchased the $1500 or $2500 Registrar plan.
-- Once TRUE, it is NEVER set back to FALSE (even after expiry or cancellation).
-- This flag enables the Post-Registrar Upgrade plan to be offered.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_purchased_registrar BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Lifetime free-tier quotas ─────────────────────────────────────────────
-- These are one-time, non-refreshing quota buckets.
-- They decrement atomically every time a free user consumes a unit.
-- If a user buys a paid plan on first sign-up, the webhook sets these to 0
-- immediately so that once their plan expires they see 0 free quota left.

-- Page 1 — Exam Prep: 15 questions (10 AKT + 5 KFP) lifetime
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS free_questions_left INT NOT NULL DEFAULT 15
  CONSTRAINT chk_free_questions_left CHECK (free_questions_left >= 0);

-- Page 2 — Note Templates: 5 templates lifetime
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS free_templates_left INT NOT NULL DEFAULT 5
  CONSTRAINT chk_free_templates_left CHECK (free_templates_left >= 0);

-- Page 3 — Study / Clinical Notes: 10 topics lifetime
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS free_topics_left INT NOT NULL DEFAULT 10
  CONSTRAINT chk_free_topics_left CHECK (free_topics_left >= 0);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Extend the `subscriptions` table
-- ────────────────────────────────────────────────────────────────────────────

-- The effective access level this subscription grants.
-- 'FREE' is the baseline when no active subscription exists;
-- a row with access_level='FREE' and status='canceled' is the resting state
-- after an active subscription ends.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS access_level access_level_kind NOT NULL DEFAULT 'FREE';

-- For Registrar one-time payments ($1500/$2500) this is the hard expiry date
-- (now + 6 months or now + 12 months set by the webhook).
-- For recurring subscriptions, this mirrors current_period_end.
-- canAccessExamPrep() checks access_level='REGISTRAR' AND access_expires_at > now().
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;

-- Whether this row originated from a one-time payment or a recurring subscription.
-- Needed to distinguish Registrar ($1500/$2500, mode='payment') from all others.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_mode payment_mode_kind;

-- The Stripe Price ID that triggered this subscription row.
-- Stored so webhook handlers can identify 6-month vs 12-month registrar plans
-- without re-querying Stripe.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- The Stripe Checkout Session ID (cs_...) — useful for deduplication and
-- matching checkout.session.completed events to the right subscription row.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT UNIQUE;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Extend the `payments` table
-- ────────────────────────────────────────────────────────────────────────────

-- Which Stripe Price was purchased in this payment.
-- For one-time Registrar payments this identifies 6-month vs 12-month.
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Indexes for common access-control queries
-- ────────────────────────────────────────────────────────────────────────────

-- Fast lookup of active subscription by user_id + access_level
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_access
  ON subscriptions(user_id, access_level)
  WHERE status IN ('active', 'trialing');

-- Fast lookup of non-expired registrar access
CREATE INDEX IF NOT EXISTS idx_subscriptions_registrar_expiry
  ON subscriptions(user_id, access_expires_at)
  WHERE access_level = 'REGISTRAR';

-- ============================================================================
--  END OF MIGRATION
-- ============================================================================

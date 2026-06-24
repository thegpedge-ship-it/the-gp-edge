# GP Edge — Production Database Design

A normalized, redundancy-free relational design for the **GP Edge** RACGP
exam-prep & clinical-tools platform.

- **SQL engine:** PostgreSQL 15+ (portable to any SQL DB — MySQL/MariaDB users
  swap `gen_random_uuid()` → `UUID()` and `ENUM`/`CHECK` accordingly).
- **File / blob storage:** **Cloudflare R2**. The database stores *only* object
  metadata + keys — never the binary bytes.
- **DDL:** [`schema.sql`](schema.sql) · **ER diagram:** [`er-diagram.html`](er-diagram.html)

> **Revision note.** This design was extended to satisfy the *Developer
> Requirements Brief*. The brief's 11 sections are mapped to concrete schema
> changes in the **REVISION LOG** comment at the top of `schema.sql`, and
> summarised in [§8 below](#8-requirements-brief--how-each-item-is-met).

---

## 1. What the app does (scope captured from the codebase)

| Module (route) | Captured entities |
|---|---|
| Exam Prep (`/exam-prep`, `/test/*`) | subjects → subtopics → quizzes, question bank, mock tests, attempts |
| Clinical Autofills (`/dashboard/clinical-autofills`) | SOAP templates, dynamic fields, versions |
| Medical Library (`/dashboard/medical-library`, `/medical-library/view-pdf`) | conditions, approaches, guidelines, PDF documents (R2) |
| Bill Better / MBS (`/components/mbs-billing`) | MBS items, fee history, sync runs, scenarios, favourites |
| Pricing & Billing (`/dashboard/pricing`, `/billing`) | plans, features, subscriptions, payments, refunds, promo codes |
| Dashboard / analytics | maintained summaries, performance, study activity, badges, notifications |
| Admin console (`/admin/*`) | RBAC roles/permissions, admin users, audit log, settings |
| Auth | Clerk (external) → mirrored `users` table |

The current app keeps everything in `localStorage` mock files; this design is the
production backend that replaces them.

---

## 2. Storage strategy — SQL + Cloudflare R2

```
                upload (presigned PUT)            read (public / signed URL)
  Browser  ───────────────────────────►  R2 bucket  ◄───────────────────────  Browser
     │                                       ▲
     │ 1. request presigned URL              │ 3. store returned object_key
     ▼                                       │
  Next.js server action ───────────────► files table (Postgres)
  (actions/storage.actions.ts)            id, bucket, object_key, mime, size…
```

- A single **`files`** table is the one registry for every R2 object (question
  images, condition PDFs/DOCX, profile avatars, badge art, invoices).
- Domain tables never store a URL string. They hold a **`file_id` FK** → `files`.
  The public URL is derived from `bucket + object_key` at read time, so changing
  the R2 domain/CDN needs **zero data migration**.
- `files.checksum_sha256` enables integrity checks and de-duplication.
- An upload is attributed to exactly one actor — `uploaded_by` (end user) **or**
  `uploaded_by_admin` (admin), enforced by the `one_uploader` CHECK. Most files
  (question images, directory PDFs, badge art) are uploaded by admins.
- `ON DELETE RESTRICT` on `condition_documents.file_id` prevents orphaning a
  referenced PDF; an R2 lifecycle/cron job garbage-collects `status='deleted'`
  rows after the object is removed from the bucket.

This is the canonical pattern: **bytes in R2, metadata in SQL** — no large blobs
in the relational store, no broken-link redundancy.

---

## 3. How redundancy was eliminated (normalization)

The mock data had many shapes that violate normal forms. Each was fixed:

| Mock-data smell | Normal form issue | Fix in schema |
|---|---|---|
| `options: string[] + correctIndex` on a question | 1NF (repeating group) | `question_options` table; one-correct enforced by partial unique index |
| `tags: string[]`, `topics: string[]` | 1NF + duplicated strings | global `tags` + `question_tags`/`*_tags` join tables |
| single `subject`/`subtopic` per question | couldn't model a question in many systems | `question_subjects` / `question_subtopics` many-to-many (primary cols kept for fast default filtering) |
| `symptoms[]`, `diagnosisCriteria[]`, `treatmentOptions[]` | 1NF ×3 | one unified `condition_items` table keyed by `item_kind` |
| `commonUses[]`, `billingRestrictions[]`, `officialNotes[]`, `searchTags[]` | 1NF | `mbs_item_common_uses`, `mbs_item_restrictions`, `mbs_item_notes`, `mbs_item_tags` |
| `sampleFields[].options[]` on autofill | nested repeating group | `autofill_fields` → `autofill_field_options` |
| `attempts`, `avgScore`, `usageCount`, `questionCount`, `rank` stored on rows | derived data duplicated (update anomalies) | **computed** via views / materialized views (§14 of `schema.sql`) |
| `author: "GP Edge Content Team"` free text repeated | partial dependency / typos | `created_by` FK → `admin_users` (free-text `author` kept only as legacy label) |
| autofill `content` duplicated alongside `subjective/objective/...` | redundant copies | SOAP content lives **only** in `autofill_template_versions`; the template row keeps metadata + `current_version_id` |
| per-notification `read`/`dismissed` mixed with broadcast text | mixing entity + per-user state | `notifications` (content) + `user_notifications` (per-user state) |
| `topic` string ("Cardiology") + separate exam-prep subject tree | inconsistent taxonomy | one `subjects → subtopics` hierarchy referenced everywhere |

**Result:** every non-key attribute depends on the key, the whole key, and
nothing but the key (3NF/BCNF). No fact is stored in two places.

> **Deliberate, controlled denormalization.** Two kinds of derived data are kept
> *maintained* rather than recomputed, because the brief requires the dashboard
> and Mock-Drill selection to stay fast at hundreds of thousands of users:
> `user_subject_mastery` and `user_performance_summary` (§13 of `schema.sql`).
> They are incrementally UPSERTed when an attempt is submitted and can be rebuilt
> from the materialized views at any time, so they never become a source of
> divergent truth.

---

## 4. Entity groups (71 tables)

1. **File storage** — `files`
2. **Identity & access** — `users`, `user_preferences`, `user_notes`, `roles`,
   `permissions`, `role_permissions`, `admin_users`, `admin_user_permissions`,
   `audit_logs`
3. **Taxonomy** — `exam_types`, `subjects`, `subtopics`, `tags`
4. **Question bank & quizzes** — `questions`, `question_subjects`,
   `question_subtopics`, `question_options`, `question_tags`, `quizzes`,
   `quiz_questions`, `quiz_configs`, `quiz_config_subjects`,
   `quiz_config_subtopics`, `mock_tests`, `mock_test_questions`
5. **Test taking & performance** — `test_attempts`, `attempt_questions`,
   `attempt_question_options`, `attempt_answers`, `user_question_bookmarks`
6. **Autofills** — `autofill_templates`, `autofill_template_versions`,
   `autofill_fields`, `autofill_field_options`, `autofill_template_tags`,
   `user_saved_templates`, `autofill_usages`
7. **Medical library** — `medical_conditions`, `condition_items`,
   `condition_references`, `condition_documents`, `condition_tags`,
   `condition_questions`
8. **MBS billing** — `mbs_categories`, `mbs_sync_runs`, `mbs_items`,
   `mbs_item_fee_history`, `mbs_item_common_uses`, `mbs_item_restrictions`,
   `mbs_item_notes`, `mbs_item_tags`, `mbs_scenarios`, `user_favourite_mbs_items`
9. **Subscriptions & payments** — `plans`, `features`, `plan_features`,
   `promo_codes`, `subscriptions`, `payments`, `refunds`, `promo_redemptions`
10. **Engagement** — `badges`, `user_badges`, `user_badge_progress`,
    `notifications`, `user_notifications`, `user_activity_events`
11. **Settings** — `app_settings`
12. **Dashboard summaries (maintained)** — `user_subject_mastery`,
    `user_performance_summary`

---

## 5. Key relationships (crow's-foot summary)

- `subjects 1—* subtopics 1—* quizzes`
- `questions *—* tags`, `questions 1—* question_options`
- `questions *—* subjects` (`question_subjects`), `questions *—* subtopics` (`question_subtopics`)
- `quizzes *—* questions` (`quiz_questions`)
- `users 1—* quiz_configs *—* subjects/subtopics` (saved Create-Quiz choices)
- `users 1—* test_attempts 1—* attempt_questions 1—* attempt_question_options`
- `attempt_questions 1—1 attempt_answers` (one answer row per snapshotted question)
- `attempt_questions *—1 questions` (original, nullable — snapshot keeps history)
- `users 1—* user_subject_mastery *—1 subjects` (maintained drill/dashboard scores)
- `autofill_templates 1—* autofill_template_versions` (and `current_version_id` back-ref)
- `autofill_templates 1—* autofill_fields 1—* autofill_field_options`
- `medical_conditions 1—* condition_items / condition_references / condition_documents`
- `medical_conditions *—* questions` (`condition_questions`)
- `condition_documents *—1 files` (R2)
- `mbs_items 1—* scenarios / uses / restrictions / notes / fee_history`; `mbs_items` self-ref `comparison_item_id`
- `mbs_sync_runs 1—* mbs_items` (last sync) and `1—* mbs_item_fee_history`
- `users 1—* subscriptions *—1 plans *—* features`; `subscriptions *—1 promo_codes`
- `payments 1—* refunds`; `promo_codes 1—* promo_redemptions`
- `users 1—* user_badges *—1 badges`; `users 1—* user_badge_progress *—1 badges`
- `users 1—* user_notifications *—1 notifications`
- `admin_users *—1 roles *—* permissions`; `admin_users` self-ref `created_by`

---

## 6. Integrity & performance notes

- **FKs everywhere** with deliberate `ON DELETE` (`CASCADE` for child rows,
  `SET NULL` for optional links / history, `RESTRICT` for referenced R2 files).
- **CHECK constraints**: score 0–100, non-negative fees, attempt-source matches
  its FK, one-correct-option, 3-role whitelist, etc.
- **Triggers as DB-level rules** (not just app code):
  - `enforce_single_super_admin` — guarantees the system can never hold a second
    Super Admin (brief §1). Backed by the `one_super_admin` **partial unique
    index** (`role_id = 1`) as a hard safety net the trigger can't lose to a
    concurrent insert race.
  - `lock_submitted_attempt` / `lock_submitted_attempt_answers` — a `completed`
    or `expired` attempt is immutable: no edits, no reopening (brief §2).
  - `set_updated_at` — keeps `updated_at` current on every important table (§12).
- **Partial unique indexes**: one active subscription per user; one correct
  option per question; one current (open-ended) fee row per MBS item; one Super
  Admin (`role_id = 1`).
- **Full-text search** (brief §5/§6): generated `tsvector` columns + GIN indexes
  on `autofill_template_versions` and `medical_conditions`; trigram index on
  `medical_conditions.name` for fuzzy matching — proper search, not exact match.
- **Soft delete** (brief §11): `deleted_at` on every admin-authored / historically
  referenced table; nothing is ever physically removed, so old attempts and audit
  logs never break. Reads filter `WHERE deleted_at IS NULL`.
- **Scale** (brief §11): BRIN indexes on the append-only hot tables
  (`audit_logs`, `user_activity_events`); §15 of `schema.sql` documents the
  range-partition-by-month plan for those plus `attempt_answers`. Dashboard reads
  hit the maintained summaries (§13), not raw rows, so per-user page loads stay
  O(1) regardless of total history.
- `updated_at` maintained by a trigger; UUID PKs for safe distributed inserts.

---

## 7. Migration path from the current app

1. Provision Postgres (Supabase/Neon) and run `schema.sql`.
2. Seed lookups: `exam_types`, `subjects`/`subtopics` (from
   `components/exam-prep/data.ts`), `plans`/`features` (from pricing page),
   `permissions` (from `useAdminRole.ts` / audit page). The three roles
   (`super_admin`=1 / `admin`=2 / `user`=3) are seeded by `schema.sql` itself
   with fixed ids; insert the single bootstrap Super Admin.
3. Backfill content: questions, quizzes, autofills, conditions, MBS items from
   the existing mock arrays.
4. Point `actions/storage.actions.ts` to also `INSERT` into `files` after a
   successful presigned upload.
5. On exam start, snapshot the chosen questions into `attempt_questions` /
   `attempt_question_options` and set `test_attempts.expires_at` server-side.
6. On exam submit, set status `completed`, then UPSERT `user_subject_mastery` /
   `user_performance_summary` for that user.
7. Replace each `localStorage` getter/setter with a query against these tables.

---

## 8. Requirements brief — how each item is met

| Brief § | Requirement | Where it lives |
|---|---|---|
| 1 | Only 3 roles; **DB** blocks a 2nd Super Admin; admins record who created them | `roles` CHECK + `code`; `enforce_single_super_admin` trigger + `one_super_admin` partial unique index; `admin_users.created_by` |
| 2 | Save Create-Quiz choices; store weak/strong scores; freeze full question set; tab-proof timer; lock on submit | `quiz_configs` (+children); `user_subject_mastery`; `attempt_questions` / `attempt_question_options`; `test_attempts.expires_at`; lock triggers |
| 3 | Multi subject/sub-subject; reuse; link to library; old attempts keep original | `question_subjects` / `question_subtopics`; `condition_questions`; attempt snapshots |
| 4 | Fast dashboard via running summaries | `user_subject_mastery`, `user_performance_summary` (maintained) |
| 5 | Formatted templates; copy as-is; content search; version author + date | `autofill_template_versions.content_format`, `search_vector` (GIN), `created_by`/`created_at` |
| 6 | Condition + Approach searches without rebuild; proper search | `content_kind` incl. `'Approach'`; `search_vector` + trigram index |
| 7 | Government source; last-pulled; fee history; sync log | `mbs_items.source`/`last_synced_at`; `mbs_item_fee_history`; `mbs_sync_runs` |
| 8 | Premium feature flag; trials; refunds; promo codes | `features.is_premium`; `plans.trial_days` + `subscriptions.trial_*`; `refunds`; `promo_codes` / `promo_redemptions` |
| 9 | Badge progress, not just earned | `user_badge_progress`; `badges.target_value`/`progress_unit` |
| 10 | User preferences | `user_preferences` |
| 11 | Soft delete; created/updated timestamps; admin action log; scale | `deleted_at` columns; `set_updated_at` triggers; `audit_logs`; BRIN + partition plan (§15) |

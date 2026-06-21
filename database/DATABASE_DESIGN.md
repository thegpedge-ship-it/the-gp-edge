# GP Edge — Production Database Design

A normalized, redundancy-free relational design for the **GP Edge** RACGP
exam-prep & clinical-tools platform.

- **SQL engine:** PostgreSQL 15+ (portable to any SQL DB — MySQL/MariaDB users
  swap `gen_random_uuid()` → `UUID()` and `ENUM`/`CHECK` accordingly).
- **File / blob storage:** **Cloudflare R2**. The database stores *only* object
  metadata + keys — never the binary bytes.
- **DDL:** [`schema.sql`](schema.sql) · **ER diagram:** [`er-diagram.html`](er-diagram.html)

---

## 1. What the app does (scope captured from the codebase)

| Module (route) | Captured entities |
|---|---|
| Exam Prep (`/exam-prep`, `/test/*`) | subjects → subtopics → quizzes, question bank, mock tests, attempts |
| Clinical Autofills (`/dashboard/clinical-autofills`) | SOAP templates, dynamic fields, versions |
| Medical Library (`/dashboard/medical-library`, `/medical-library/view-pdf`) | conditions, guidelines, PDF documents (R2) |
| Bill Better / MBS (`/components/mbs-billing`) | MBS items, scenarios, favourites |
| Pricing & Billing (`/dashboard/pricing`, `/billing`) | plans, features, subscriptions, payments |
| Dashboard / analytics | stats, performance, study activity, badges, notifications |
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
| `symptoms[]`, `diagnosisCriteria[]`, `treatmentOptions[]` | 1NF ×3 | one unified `condition_items` table keyed by `item_kind` |
| `commonUses[]`, `billingRestrictions[]`, `officialNotes[]`, `searchTags[]` | 1NF | `mbs_item_common_uses`, `mbs_item_restrictions`, `mbs_item_notes`, `mbs_item_tags` |
| `sampleFields[].options[]` on autofill | nested repeating group | `autofill_fields` → `autofill_field_options` |
| `attempts`, `avgScore`, `usageCount`, `questionCount`, `mastery`, `rank`, study-streak stored on rows | derived data duplicated (update anomalies) | **computed** via views / materialized views (§13 of `schema.sql`) |
| `author: "GP Edge Content Team"` free text repeated | partial dependency / typos | `created_by` FK → `admin_users` (free-text `author` kept only as legacy label) |
| autofill `content` duplicated alongside `subjective/objective/...` | redundant copies | SOAP content lives **only** in `autofill_template_versions`; the template row keeps metadata + `current_version_id` |
| per-notification `read`/`dismissed` mixed with broadcast text | mixing entity + per-user state | `notifications` (content) + `user_notifications` (per-user state) |
| `topic` string ("Cardiology") + separate exam-prep subject tree | inconsistent taxonomy | one `subjects → subtopics` hierarchy referenced everywhere |

**Result:** every non-key attribute depends on the key, the whole key, and
nothing but the key (3NF/BCNF). No fact is stored in two places.

---

## 4. Entity groups (55 tables)

1. **File storage** — `files`
2. **Identity & access** — `users`, `user_notes`, `roles`, `permissions`,
   `role_permissions`, `admin_users`, `admin_user_permissions`, `audit_logs`
3. **Taxonomy** — `exam_types`, `subjects`, `subtopics`, `tags`
4. **Question bank & quizzes** — `questions`, `question_options`, `question_tags`,
   `quizzes`, `quiz_questions`, `mock_tests`, `mock_test_questions`
5. **Test taking & performance** — `test_attempts`, `attempt_answers`,
   `user_question_bookmarks`
6. **Autofills** — `autofill_templates`, `autofill_template_versions`,
   `autofill_fields`, `autofill_field_options`, `autofill_template_tags`,
   `user_saved_templates`, `autofill_usages`
7. **Medical library** — `medical_conditions`, `condition_items`,
   `condition_references`, `condition_documents`, `condition_tags`,
   `condition_questions`
8. **MBS billing** — `mbs_categories`, `mbs_items`, `mbs_item_common_uses`,
   `mbs_item_restrictions`, `mbs_item_notes`, `mbs_item_tags`, `mbs_scenarios`,
   `user_favourite_mbs_items`
9. **Subscriptions & payments** — `plans`, `features`, `plan_features`,
   `subscriptions`, `payments`
10. **Engagement** — `badges`, `user_badges`, `notifications`,
    `user_notifications`, `user_activity_events`
11. **Settings** — `app_settings`

---

## 5. Key relationships (crow's-foot summary)

- `subjects 1—* subtopics 1—* quizzes`
- `questions *—* tags`, `questions 1—* question_options`
- `quizzes *—* questions` (`quiz_questions`)
- `users 1—* test_attempts 1—* attempt_answers *—1 questions`
- `attempt_answers *—1 question_options` (the selected answer)
- `autofill_templates 1—* autofill_template_versions` (and `current_version_id` back-ref)
- `autofill_templates 1—* autofill_fields 1—* autofill_field_options`
- `medical_conditions 1—* condition_items / condition_references / condition_documents`
- `condition_documents *—1 files` (R2)
- `mbs_items 1—* scenarios / uses / restrictions / notes`; `mbs_items` self-ref `comparison_item_id`
- `users 1—* subscriptions *—1 plans *—* features`
- `users 1—* user_badges *—1 badges`; `users 1—* user_notifications *—1 notifications`
- `admin_users *—1 roles *—* permissions`

---

## 6. Integrity & performance notes

- **FKs everywhere** with deliberate `ON DELETE` (`CASCADE` for child rows,
  `SET NULL` for optional links, `RESTRICT` for referenced R2 files).
- **CHECK constraints**: score 0–100, non-negative fees, attempt-source matches
  its FK, one-correct-option, etc.
- **Partial unique indexes**: one active subscription per user; one correct
  option per question.
- **Indexes** on every FK used for lookups + hot query paths
  (`test_attempts.user_id`, `audit_logs.created_at`, …).
- **Derived numbers** never stored — refresh the materialized views on a cron
  (e.g. every few minutes) or via triggers for real-time needs.
- `updated_at` maintained by a trigger; UUID PKs for safe distributed inserts.

---

## 7. Migration path from the current app

1. Provision Postgres (Supabase/Neon) and run `schema.sql`.
2. Seed lookups: `exam_types`, `subjects`/`subtopics` (from
   `components/exam-prep/data.ts`), `plans`/`features` (from pricing page),
   `roles`/`permissions` (from `useAdminRole.ts` / audit page).
3. Backfill content: questions, quizzes, autofills, conditions, MBS items from
   the existing mock arrays.
4. Point `actions/storage.actions.ts` to also `INSERT` into `files` after a
   successful presigned upload.
5. Replace each `localStorage` getter/setter with a query against these tables.

-- ============================================================================
--  Migration: rebuild MBS as a semantic-search index
--  Date: 2026-07-18
--
--  The original MBS schema (Brief §7) modelled billing reference data by hand:
--  curated human titles, categories, fee history, scenarios, restrictions and
--  admin-authored notes across ten tables. That design assumed we would author
--  and maintain the clinical content ourselves.
--
--  We are replacing it with a search-first design driven entirely by the
--  government's official monthly XML dump (database/MBS-XML-2026-07-01.XML):
--
--    * Item number + descriptor come straight from <ItemNum> / <Description>.
--    * The descriptor is embedded into a vector so doctors can search by
--      CLINICAL MEANING rather than keywords — "lung scan for smoker" must
--      match "computed tomography of chest ..." even with no shared words.
--    * detail_json holds the full item view (fees, associated notes, rules)
--      built on demand from the MBS item page, so we never hand-maintain it.
--
--  The government XML carries no short title and no explanatory-note text, so
--  neither is stored here: titles are generated at ingestion and notes arrive
--  with detail_json.
--
--  user_favourite_mbs_items is KEPT. It is re-keyed from the old UUID
--  mbs_items.id to the government item number, which must happen while the old
--  table still exists to provide the mapping — hence step 1 running before the
--  drops in step 2.
--
--  Idempotent: safe to run more than once.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Re-key saved favourites onto the government item number
--    Runs FIRST: once mbs_items is dropped there is no way to translate a
--    stored UUID back to an item number, and every favourite becomes an
--    orphaned reference to nothing.
-- ----------------------------------------------------------------------------
ALTER TABLE user_favourite_mbs_items
    ADD COLUMN IF NOT EXISTS item_num INTEGER;

-- The old item_number was TEXT; the guard skips any non-numeric value rather
-- than aborting the whole migration on a bad cast.
UPDATE user_favourite_mbs_items f
SET    item_num = m.item_number::INTEGER
FROM   mbs_items m
WHERE  f.item_id = m.id
  AND  m.item_number ~ '^[0-9]+$'
  AND  f.item_num IS NULL;

-- Favourites pointing at rows that no longer exist (or a non-numeric item
-- number) cannot be carried across.
DELETE FROM user_favourite_mbs_items WHERE item_num IS NULL;

ALTER TABLE user_favourite_mbs_items
    DROP CONSTRAINT IF EXISTS user_favourite_mbs_items_pkey;
ALTER TABLE user_favourite_mbs_items
    DROP COLUMN IF EXISTS item_id;
ALTER TABLE user_favourite_mbs_items
    ALTER COLUMN item_num SET NOT NULL;
ALTER TABLE user_favourite_mbs_items
    ADD PRIMARY KEY (user_id, item_num);

-- ----------------------------------------------------------------------------
-- 2. Remove the previous MBS schema
--    CASCADE also clears the dependent indexes, FKs and the
--    trg_mbs_items_updated trigger that hung off mbs_items.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS mbs_scenarios         CASCADE;
DROP TABLE IF EXISTS mbs_item_tags         CASCADE;
DROP TABLE IF EXISTS mbs_item_notes        CASCADE;
DROP TABLE IF EXISTS mbs_item_restrictions CASCADE;
DROP TABLE IF EXISTS mbs_item_common_uses  CASCADE;
DROP TABLE IF EXISTS mbs_item_fee_history  CASCADE;
DROP TABLE IF EXISTS mbs_items             CASCADE;
DROP TABLE IF EXISTS mbs_sync_runs         CASCADE;
DROP TABLE IF EXISTS mbs_categories        CASCADE;

-- Only the sync-run tracking used this enum.
DROP TYPE IF EXISTS mbs_sync_status;

-- ----------------------------------------------------------------------------
-- 3. pgvector — provides the VECTOR column type and the HNSW index method
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- 4. The new MBS table
--    One row per government item. item_num is the government's own identifier
--    and is globally unique, so it doubles as the primary key — no surrogate id
--    and no lookup needed when hydrating a detail page from a search result.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mbs_items (
    -- <ItemNum> from the XML, e.g. 3, 23, 721.
    item_num     INTEGER PRIMARY KEY,

    -- <Description>: the full official descriptor. This is the only clinical
    -- prose the XML gives us and is what gets embedded.
    description  TEXT NOT NULL,

    -- Embedding of description from Gemini gemini-embedding-001, requested at
    -- 768 of its available dimensions. NOT 3072: pgvector cannot build an HNSW
    -- index above 2000 dimensions, so a larger vector would force every search
    -- into a sequential scan. Changing model or dimension count means altering
    -- this column and re-embedding every row.
    -- Nullable so rows can be inserted by the XML parser before the (slower,
    -- rate-limited) embedding pass fills them in.
    embedding    VECTOR(768),

    -- Full item detail (fees, benefits, associated notes, rules) as structured
    -- JSON, assembled from the MBS item page at view time. JSONB rather than
    -- columns because the shape varies by category and we do not query into it.
    detail_json  JSONB
);

-- ----------------------------------------------------------------------------
-- 5. Vector index
--    HNSW with cosine distance: the search path embeds the doctor's query and
--    takes nearest neighbours, so ORDER BY embedding <=> $1 LIMIT n must not
--    degrade into a sequential scan over every item.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_mbs_items_embedding
    ON mbs_items USING hnsw (embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- 6. Re-point favourites at the new table
--    NOT VALID because mbs_items is empty until the XML ingestion runs, so the
--    carried-over favourites have nothing to reference yet. New rows are still
--    checked immediately; run the VALIDATE below once ingestion has completed.
-- ----------------------------------------------------------------------------
ALTER TABLE user_favourite_mbs_items
    DROP CONSTRAINT IF EXISTS user_favourite_mbs_items_item_num_fkey;
ALTER TABLE user_favourite_mbs_items
    ADD CONSTRAINT user_favourite_mbs_items_item_num_fkey
    FOREIGN KEY (item_num) REFERENCES mbs_items(item_num) ON DELETE CASCADE
    NOT VALID;

-- Run AFTER the XML has been ingested:
--   ALTER TABLE user_favourite_mbs_items
--       VALIDATE CONSTRAINT user_favourite_mbs_items_item_num_fkey;

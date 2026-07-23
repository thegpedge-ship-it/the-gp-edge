-- ============================================================================
--  Migration: retire MBS items instead of deleting them
--  Date: 2026-07-18
--  Follows: 2026-07-18_mbs_semantic_search.sql
--
--  Each monthly XML is a full snapshot of the CURRENT schedule, so an item the
--  government has withdrawn simply stops appearing in the file. Three ways to
--  handle that, and only one is safe:
--
--    * Leave it        -> the retired item keeps a valid vector and keeps
--                         ranking in search, indistinguishable from a live item.
--                         A doctor bills it and the claim is rejected.
--    * Delete it       -> user_favourite_mbs_items cascades, so users silently
--                         lose saved items, and a truncated upload becomes an
--                         irreversible mass delete.
--    * Retire it (this) -> the row stays, so favourites and historical lookups
--                         still resolve, but it is excluded from search and the
--                         detail page can warn that it was withdrawn.
--
--  retired_at is also reversible: an item that reappears in a later release is
--  un-retired by setting it back to NULL, which matters when a bad upload
--  retires rows that were never actually withdrawn.
--
--  Idempotent: safe to run more than once.
-- ============================================================================

-- NULL = currently listed by the government. Set = date we first saw it absent.
ALTER TABLE mbs_items
    ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ;

-- ----------------------------------------------------------------------------
-- Search only ever looks at live items, so the vector index is made partial.
--
-- This is a correctness fix, not just a size saving: filtering a full HNSW index
-- with `WHERE retired_at IS NULL` post-filters AFTER the index has already
-- chosen its nearest neighbours, so a query asking for 20 results can quietly
-- return fewer once retired rows are discarded. Indexing only live rows means
-- LIMIT 20 always yields 20.
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_mbs_items_embedding;

CREATE INDEX IF NOT EXISTS idx_mbs_items_embedding_active
    ON mbs_items USING hnsw (embedding vector_cosine_ops)
    WHERE retired_at IS NULL;

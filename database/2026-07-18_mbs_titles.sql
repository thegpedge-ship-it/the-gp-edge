-- ============================================================================
--  Migration: generated titles + their own search vector
--  Date: 2026-07-18
--  Follows: 2026-07-18_mbs_retired_at.sql
--
--  The government XML has no title. <Description> is a single dense sentence of
--  legal drafting ("Professional attendance at consulting rooms (other than a
--  service to which another item applies) by a general practitioner for an
--  obvious problem characterised by..."), which reads badly as a result card and
--  embeds poorly against a short query.
--
--  So we generate a short clinical title per item with an LLM and give it its
--  OWN vector, rather than folding it into the description vector. Embedding
--  models pool across tokens, so a six-word title concatenated onto a hundred-word
--  descriptor contributes only a few percent of the signal and gets diluted
--  exactly when it would help most — on short queries. Two vectors let search
--  score a query against title and description independently and take the better
--  match: short queries land on titles, detailed clinical queries on descriptors.
--
--  Both columns are nullable and filled by separate resumable passes, so a run
--  interrupted by an LLM rate limit leaves usable partial state rather than
--  failing the whole import.
--
--  Idempotent: safe to run more than once.
-- ============================================================================

-- Short human-readable title, LLM-generated from description.
-- NULL = not generated yet.
ALTER TABLE mbs_items
    ADD COLUMN IF NOT EXISTS title TEXT;

-- Vector of `title` alone. Same model and dimensions as the description vector
-- so the two are directly comparable in one query.
ALTER TABLE mbs_items
    ADD COLUMN IF NOT EXISTS title_embedding VECTOR(768);

-- Partial for the same reason as the description index: search only ever looks
-- at live items, and filtering a full HNSW index post-filters after neighbour
-- selection, so LIMIT n could quietly return fewer than n.
CREATE INDEX IF NOT EXISTS idx_mbs_items_title_embedding_active
    ON mbs_items USING hnsw (title_embedding vector_cosine_ops)
    WHERE retired_at IS NULL;

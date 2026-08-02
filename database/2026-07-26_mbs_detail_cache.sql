-- Cache of the AI-structured MBS item detail.
--
-- detail_json already exists on mbs_items (reserved for structured detail). The
-- item detail view previously scraped the government page on every click and
-- injected raw HTML. It now builds structured JSON once, stores it here, and
-- reuses it — refetching only when the stored copy is older than a month, since
-- fees and descriptors do change between schedule releases.
--
-- detail_fetched_at records when the structured JSON was last built so the view
-- can decide whether to serve the cache or rebuild it. NULL = never built.
ALTER TABLE mbs_items
    ADD COLUMN IF NOT EXISTS detail_fetched_at TIMESTAMPTZ;

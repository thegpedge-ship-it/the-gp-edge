"use server";

import { query, queryOne } from "@/lib/db";
import {
  embedTexts,
  embedQuery,
  toVectorLiteral,
  EMBED_BATCH_SIZE,
} from "@/lib/mbs/embed";
import { generateTitles, TITLE_BATCH_SIZE } from "@/lib/mbs/title";
import type { MbsXmlItem } from "@/lib/mbs/parseMbsXml";
import { MBS_RESULT_LIMIT, MBS_SEARCH_POOL } from "@/lib/mbs/constants";
import { ensureDbUser } from "@/lib/user";

export interface SyncBatchResult {
  inserted: number;
  updated: number;
  unchanged: number;
}

export interface EmbedBatchResult {
  embedded: number;
  remaining: number;
}

export interface MbsStats {
  total: number;
  /** Rows holding descriptor text. Should always equal total — a drift here
   *  means the parser wrote a row it should have skipped. */
  descriptions: number;
  embedded: number;
  /** Live items still needing a description vector — retired ones excluded. */
  pending: number;
  retired: number;
  /** Live items that have a generated title. */
  titled: number;
  /** Live items still needing a title. */
  titlePending: number;
  /** Live items whose title has been embedded. */
  titleEmbedded: number;
  /** Live titled items still needing a title vector. */
  titleEmbedPending: number;
}

export interface TitleBatchResult {
  generated: number;
  remaining: number;
  /** A few freshly written titles, so the admin can eyeball the quality. */
  sample: { itemNum: number; title: string }[];
}

/**
 * Upsert one batch of XML items.
 *
 * The WHERE on DO UPDATE is what makes a re-upload of the same file cheap: rows
 * whose descriptor is byte-identical are not written at all, so they keep their
 * existing vector and cost nothing to re-embed. Only genuinely changed rows are
 * touched.
 *
 * Clearing the derived columns on a description change is the correctness point.
 * The vector, the generated title and the title's vector are all products of the
 * OLD text; keeping any of them would leave the row answering searches with a
 * meaning it no longer has. NULLing them re-queues the row for each pass, which
 * select exactly on those NULLs.
 *
 * `xmax = 0` distinguishes an inserted row from an updated one, so the admin
 * page can report added vs changed without a second query.
 */
export async function syncMbsBatchAction(
  items: MbsXmlItem[],
): Promise<SyncBatchResult> {
  if (items.length === 0) return { inserted: 0, updated: 0, unchanged: 0 };

  const itemNums = items.map((i) => i.itemNum);
  const descriptions = items.map((i) => i.description);

  const rows = await query<{ inserted: boolean }>(
    `INSERT INTO mbs_items (item_num, description)
     SELECT * FROM UNNEST($1::int[], $2::text[])
     ON CONFLICT (item_num) DO UPDATE
        SET description     = EXCLUDED.description,
            embedding       = NULL,
            title           = NULL,
            title_embedding = NULL
      WHERE mbs_items.description IS DISTINCT FROM EXCLUDED.description
     RETURNING (xmax = 0) AS inserted`,
    [itemNums, descriptions],
  );

  const inserted = rows.filter((r) => r.inserted).length;
  const updated = rows.length - inserted;

  return { inserted, updated, unchanged: items.length - rows.length };
}

/**
 * Embed up to one batch of rows that have no vector yet.
 *
 * Driven entirely off `embedding IS NULL` rather than a caller-supplied list, so
 * the pass is resumable: a crash, a closed browser tab or an exhausted quota
 * just means the next run picks up the rows that were missed. Callers loop until
 * `remaining` reaches 0.
 */
export async function embedPendingBatchAction(): Promise<EmbedBatchResult> {
  // Retired items are excluded: they are outside the partial search index, so
  // embedding them would spend API quota on vectors no query can ever reach.
  const pending = await query<{ item_num: number; description: string }>(
    `SELECT item_num, description
       FROM mbs_items
      WHERE embedding IS NULL
        AND retired_at IS NULL
      ORDER BY item_num
      LIMIT $1`,
    [EMBED_BATCH_SIZE],
  );

  if (pending.length === 0) return { embedded: 0, remaining: 0 };

  const vectors = await embedTexts(
    pending.map((r) => r.description),
    "RETRIEVAL_DOCUMENT",
  );

  // embedTexts guarantees positional alignment and throws otherwise, so zipping
  // by index here is safe.
  await query(
    `UPDATE mbs_items AS m
        SET embedding = v.embedding::vector
       FROM UNNEST($1::int[], $2::text[]) AS v(item_num, embedding)
      WHERE m.item_num = v.item_num`,
    [pending.map((r) => r.item_num), vectors.map(toVectorLiteral)],
  );

  const remaining = await queryOne<{ count: string }>(
    `SELECT count(*)::text AS count
       FROM mbs_items
      WHERE embedding IS NULL AND retired_at IS NULL`,
  );

  return { embedded: pending.length, remaining: Number(remaining?.count ?? 0) };
}

/** Row counts backing the admin page's progress and final verification. */
export async function getMbsStatsAction(): Promise<MbsStats> {
  const row = await queryOne<Record<string, string>>(
    // Every count except `total` and `descriptions` is scoped to live items:
    // retired rows are deliberately never embedded, so counting them would make
    // 100% unreachable and the completion figure meaningless.
    `SELECT count(*)::text AS total,
            count(description)::text AS descriptions,
            count(*) FILTER (WHERE embedding IS NOT NULL AND retired_at IS NULL)::text AS embedded,
            count(*) FILTER (WHERE embedding IS NULL AND retired_at IS NULL)::text AS pending,
            count(*) FILTER (WHERE retired_at IS NOT NULL)::text AS retired,
            count(*) FILTER (WHERE title IS NOT NULL AND retired_at IS NULL)::text AS titled,
            count(*) FILTER (WHERE title IS NULL AND retired_at IS NULL)::text AS title_pending,
            count(*) FILTER (WHERE title_embedding IS NOT NULL AND retired_at IS NULL)::text AS title_embedded,
            count(*) FILTER (WHERE title IS NOT NULL
                               AND title_embedding IS NULL
                               AND retired_at IS NULL)::text AS title_embed_pending
       FROM mbs_items`,
  );
  return {
    total: Number(row?.total ?? 0),
    descriptions: Number(row?.descriptions ?? 0),
    embedded: Number(row?.embedded ?? 0),
    pending: Number(row?.pending ?? 0),
    retired: Number(row?.retired ?? 0),
    titled: Number(row?.titled ?? 0),
    titlePending: Number(row?.title_pending ?? 0),
    titleEmbedded: Number(row?.title_embedded ?? 0),
    titleEmbedPending: Number(row?.title_embed_pending ?? 0),
  };
}

/**
 * Title one batch of items that have none yet.
 *
 * Selected by `title IS NULL` so the pass is resumable in the same way as
 * embedding — generation is the most rate-limited step in the pipeline and will
 * routinely be interrupted, so partial progress must always be safe to keep.
 *
 * Writes are keyed by the item number the model echoed back, not by position,
 * and only rows still missing a title are updated, so a retry can never
 * overwrite a good title with a later one.
 */
export async function generateTitlesBatchAction(): Promise<TitleBatchResult> {
  const pending = await query<{ item_num: number; description: string }>(
    `SELECT item_num, description
       FROM mbs_items
      WHERE title IS NULL
        AND retired_at IS NULL
      ORDER BY item_num
      LIMIT $1`,
    [TITLE_BATCH_SIZE],
  );

  if (pending.length === 0) return { generated: 0, remaining: 0, sample: [] };

  const titles = await generateTitles(
    pending.map((r) => ({ itemNum: r.item_num, description: r.description })),
  );

  const itemNums = [...titles.keys()];
  const values = itemNums.map((n) => titles.get(n)!);

  if (itemNums.length > 0) {
    await query(
      `UPDATE mbs_items AS m
          SET title = v.title
         FROM UNNEST($1::int[], $2::text[]) AS v(item_num, title)
        WHERE m.item_num = v.item_num
          AND m.title IS NULL`,
      [itemNums, values],
    );
  }

  const remaining = await queryOne<{ count: string }>(
    `SELECT count(*)::text AS count
       FROM mbs_items
      WHERE title IS NULL AND retired_at IS NULL`,
  );

  return {
    generated: itemNums.length,
    remaining: Number(remaining?.count ?? 0),
    sample: itemNums.slice(0, 3).map((n) => ({ itemNum: n, title: titles.get(n)! })),
  };
}

/**
 * Embed one batch of titles.
 *
 * Separate from the description pass and stored in its own column: a title
 * folded into the description text would contribute only a few percent of the
 * pooled signal, which is precisely the short-query case it exists to serve.
 */
export async function embedTitlesBatchAction(): Promise<EmbedBatchResult> {
  const pending = await query<{ item_num: number; title: string }>(
    `SELECT item_num, title
       FROM mbs_items
      WHERE title IS NOT NULL
        AND title_embedding IS NULL
        AND retired_at IS NULL
      ORDER BY item_num
      LIMIT $1`,
    [EMBED_BATCH_SIZE],
  );

  if (pending.length === 0) return { embedded: 0, remaining: 0 };

  const vectors = await embedTexts(
    pending.map((r) => r.title),
    "RETRIEVAL_DOCUMENT",
  );

  await query(
    `UPDATE mbs_items AS m
        SET title_embedding = v.embedding::vector
       FROM UNNEST($1::int[], $2::text[]) AS v(item_num, embedding)
      WHERE m.item_num = v.item_num`,
    [pending.map((r) => r.item_num), vectors.map(toVectorLiteral)],
  );

  const remaining = await queryOne<{ count: string }>(
    `SELECT count(*)::text AS count
       FROM mbs_items
      WHERE title IS NOT NULL AND title_embedding IS NULL AND retired_at IS NULL`,
  );

  return { embedded: pending.length, remaining: Number(remaining?.count ?? 0) };
}

export interface RetireResult {
  /** Newly marked as withdrawn by this upload. */
  retired: number;
  /** Previously retired items that reappeared in this file. */
  restored: number;
  /** A sample of the retired item numbers, for the admin summary. */
  retiredSample: number[];
}

/**
 * Reconcile the table against the uploaded file's item list.
 *
 * Items missing from the file are retired, not deleted — user_favourite_mbs_items
 * cascades on delete, so removing rows would silently destroy saved favourites,
 * and one truncated upload would become an irreversible mass delete. A retired
 * row still resolves for favourites and historical lookups but is excluded from
 * search by the partial vector index.
 *
 * The restore half matters just as much: if a bad file retires rows that were
 * never actually withdrawn, re-uploading a correct file un-retires them. Without
 * it, a single bad upload would be permanent.
 */
export async function retireMissingMbsItemsAction(
  xmlItemNums: number[],
): Promise<RetireResult> {
  const retiredRows = await query<{ item_num: number }>(
    `UPDATE mbs_items
        SET retired_at = now()
      WHERE retired_at IS NULL
        AND NOT (item_num = ANY($1::int[]))
     RETURNING item_num`,
    [xmlItemNums],
  );

  const restoredRows = await query<{ item_num: number }>(
    `UPDATE mbs_items
        SET retired_at = NULL
      WHERE retired_at IS NOT NULL
        AND item_num = ANY($1::int[])
     RETURNING item_num`,
    [xmlItemNums],
  );

  return {
    retired: retiredRows.length,
    restored: restoredRows.length,
    retiredSample: retiredRows.slice(0, 60).map((r) => r.item_num),
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   USER-FACING SEARCH
   ══════════════════════════════════════════════════════════════════════════ */

export interface MbsSearchHit {
  itemNum: number;
  title: string | null;
  description: string;
  /** Cosine similarity 0..1. Null for the unsearched default listing. */
  score: number | null;
  /** Which vector produced the winning score — useful for debugging odd hits. */
  matchedOn: "title" | "description" | null;
  saved: boolean;
}

/** Item numbers the signed-in user has saved. Empty when signed out. */
async function savedItemNums(): Promise<Set<number>> {
  const user = await ensureDbUser();
  if (!user) return new Set();
  const rows = await query<{ item_num: number }>(
    `SELECT item_num FROM user_favourite_mbs_items WHERE user_id = $1`,
    [user.id],
  );
  return new Set(rows.map((r) => r.item_num));
}

export interface MbsPage {
  items: MbsSearchHit[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Paginated browse listing — every live item in the schedule.
 *
 * Deliberately does NOT filter on `embedding IS NOT NULL`, unlike search.
 * Browsing needs no vector, so requiring one would hide thousands of perfectly
 * valid items whenever the embedding passes are incomplete, and the schedule
 * would look far smaller than it is.
 *
 * Ordered by item number so the grid is stable across visits and paging is
 * meaningful — a non-deterministic order makes page 2 overlap page 1.
 */
export async function listMbsItemsAction(
  page = 1,
  pageSize = MBS_RESULT_LIMIT,
): Promise<MbsPage> {
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * pageSize;

  const [rows, countRow, saved] = await Promise.all([
    query<{ item_num: number; title: string | null; description: string }>(
      `SELECT item_num, title, description
         FROM mbs_items
        WHERE retired_at IS NULL
        ORDER BY item_num
        LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    ),
    queryOne<{ count: string }>(
      `SELECT count(*)::text AS count FROM mbs_items WHERE retired_at IS NULL`,
    ),
    savedItemNums(),
  ]);

  const total = Number(countRow?.count ?? 0);

  return {
    items: rows.map((r) => ({
      itemNum: r.item_num,
      title: r.title,
      description: r.description,
      score: null,
      matchedOn: null,
      saved: saved.has(r.item_num),
    })),
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Semantic search across BOTH vectors.
 *
 * Each branch runs its own nearest-neighbour scan so it can use its own partial
 * HNSW index. Scoring GREATEST(...) across both vectors in a single ORDER BY
 * instead would be one expression over two indexes — unindexable, and it would
 * sequential-scan all 6,000 rows on every keystroke.
 *
 * Both branches over-fetch (3x the limit) before merging: if each returned only
 * `limit`, an item ranked just outside the top 12 on BOTH vectors would be lost
 * even though its combined standing beats items that made one list.
 */
export async function searchMbsAction(
  text: string,
  limit = MBS_SEARCH_POOL,
): Promise<MbsSearchHit[]> {
  const q = text.trim();
  // Below three characters an embedding is noise, and the call still costs
  // quota. The client enforces this too; this is the backstop.
  if (q.length < 3) return [];

  // RETRIEVAL_QUERY, not RETRIEVAL_DOCUMENT — Gemini places queries and
  // documents in deliberately different regions of the space.
  const vec = toVectorLiteral(await embedQuery(q));
  const overFetch = Math.max(limit * 3, 40);

  const [rows, saved] = await Promise.all([
    query<{
      item_num: number;
      title: string | null;
      description: string;
      score: string;
      matched_on: "title" | "description";
    }>(
      `WITH by_description AS (
         SELECT item_num,
                1 - (embedding <=> $1::vector) AS score,
                'description'::text AS matched_on
           FROM mbs_items
          WHERE retired_at IS NULL AND embedding IS NOT NULL
          ORDER BY embedding <=> $1::vector
          LIMIT $2
       ),
       by_title AS (
         SELECT item_num,
                1 - (title_embedding <=> $1::vector) AS score,
                'title'::text AS matched_on
           FROM mbs_items
          WHERE retired_at IS NULL AND title_embedding IS NOT NULL
          ORDER BY title_embedding <=> $1::vector
          LIMIT $2
       ),
       merged AS (
         SELECT DISTINCT ON (item_num) item_num, score, matched_on
           FROM (SELECT * FROM by_description UNION ALL SELECT * FROM by_title) u
          ORDER BY item_num, score DESC
       )
       SELECT m.item_num, i.title, i.description, m.score::text, m.matched_on
         FROM merged m
         JOIN mbs_items i USING (item_num)
        ORDER BY m.score DESC
        LIMIT $3`,
      [vec, overFetch, limit],
    ),
    savedItemNums(),
  ]);

  return rows.map((r) => ({
    itemNum: r.item_num,
    title: r.title,
    description: r.description,
    score: Number(r.score),
    matchedOn: r.matched_on,
    saved: saved.has(r.item_num),
  }));
}

/**
 * Save or unsave an item for the signed-in user.
 *
 * Returns the resulting state so the caller can reconcile against what it
 * optimistically rendered, rather than assuming the toggle landed.
 */
export async function toggleMbsFavouriteAction(
  itemNum: number,
): Promise<{ saved: boolean }> {
  const user = await ensureDbUser();
  if (!user) return { saved: false };

  const deleted = await query<{ item_num: number }>(
    `DELETE FROM user_favourite_mbs_items
      WHERE user_id = $1 AND item_num = $2
      RETURNING item_num`,
    [user.id, itemNum],
  );
  if (deleted.length > 0) return { saved: false };

  // ON CONFLICT guards the double-click race where two toggles arrive together.
  await query(
    `INSERT INTO user_favourite_mbs_items (user_id, item_num)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [user.id, itemNum],
  );
  return { saved: true };
}

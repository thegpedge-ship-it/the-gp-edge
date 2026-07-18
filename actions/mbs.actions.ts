"use server";

import { query, queryOne } from "@/lib/db";
import { embedTexts, toVectorLiteral, EMBED_BATCH_SIZE } from "@/lib/mbs/embed";
import type { MbsXmlItem } from "@/lib/mbs/parseMbsXml";

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
  embedded: number;
  /** Live items still needing a vector — retired ones are not counted. */
  pending: number;
  retired: number;
}

/**
 * Upsert one batch of XML items.
 *
 * The WHERE on DO UPDATE is what makes a re-upload of the same file cheap: rows
 * whose descriptor is byte-identical are not written at all, so they keep their
 * existing vector and cost nothing to re-embed. Only genuinely changed rows are
 * touched.
 *
 * Setting embedding = NULL on a description change is the correctness point —
 * without it a row would keep the vector of its OLD text and quietly answer
 * searches with a stale meaning. NULLing it re-queues the row for the embed
 * pass, which selects exactly `WHERE embedding IS NULL`.
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
        SET description = EXCLUDED.description,
            embedding   = NULL
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
  const row = await queryOne<{
    total: string;
    embedded: string;
    pending: string;
    retired: string;
  }>(
    `SELECT count(*)::text AS total,
            count(embedding)::text AS embedded,
            count(*) FILTER (WHERE embedding IS NULL AND retired_at IS NULL)::text AS pending,
            count(*) FILTER (WHERE retired_at IS NOT NULL)::text AS retired
       FROM mbs_items`,
  );
  return {
    total: Number(row?.total ?? 0),
    embedded: Number(row?.embedded ?? 0),
    pending: Number(row?.pending ?? 0),
    retired: Number(row?.retired ?? 0),
  };
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

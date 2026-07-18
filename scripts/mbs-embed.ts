/**
 * Pass 2 — build search vectors for rows that lack one.
 *
 *   npm run mbs:embed
 *
 * Selects `WHERE embedding IS NULL` on every iteration rather than working from
 * a list captured up front, which makes the script resumable: interrupt it, hit
 * a quota ceiling, or re-run it after mbs-ingest.ts changed some descriptions,
 * and it simply processes whatever still needs doing. Re-running when everything
 * is embedded is a no-op.
 */
import "dotenv/config";
import { pool } from "../lib/db";
import {
  embedTexts,
  toVectorLiteral,
  EMBED_BATCH_SIZE,
  EMBED_MODEL,
  EMBED_DIM,
} from "../lib/mbs/embed";

async function main() {
  // Retired items sit outside the partial search index, so embedding them would
  // spend quota on vectors no query can reach.
  const { rows: before } = await pool.query<{ pending: string }>(
    `SELECT count(*)::text AS pending
       FROM mbs_items
      WHERE embedding IS NULL AND retired_at IS NULL`,
  );
  const pending = Number(before[0].pending);

  if (pending === 0) {
    console.log("Every item already has a vector. Nothing to do.");
    await pool.end();
    return;
  }

  const batches = Math.ceil(pending / EMBED_BATCH_SIZE);
  console.log(
    `${pending} items to embed via ${EMBED_MODEL} @ ${EMBED_DIM}d — ` +
      `${batches} batched request(s) of up to ${EMBED_BATCH_SIZE}.\n`,
  );

  let done = 0;
  for (;;) {
    const { rows } = await pool.query<{ item_num: number; description: string }>(
      `SELECT item_num, description
         FROM mbs_items
        WHERE embedding IS NULL AND retired_at IS NULL
        ORDER BY item_num
        LIMIT $1`,
      [EMBED_BATCH_SIZE],
    );
    if (rows.length === 0) break;

    // Throws on any count/dimension mismatch, so vectors can never be zipped
    // onto the wrong item numbers below.
    const vectors = await embedTexts(
      rows.map((r) => r.description),
      "RETRIEVAL_DOCUMENT",
    );

    await pool.query(
      `UPDATE mbs_items AS m
          SET embedding = v.embedding::vector
         FROM UNNEST($1::int[], $2::text[]) AS v(item_num, embedding)
        WHERE m.item_num = v.item_num`,
      [rows.map((r) => r.item_num), vectors.map(toVectorLiteral)],
    );

    done += rows.length;
    process.stdout.write(`\r  embedded ${done}/${pending}`);
  }
  process.stdout.write("\n");

  const { rows: after } = await pool.query<{ total: string; embedded: string }>(
    `SELECT count(*)::text AS total, count(embedding)::text AS embedded FROM mbs_items`,
  );
  console.log(`\n${after[0].embedded}/${after[0].total} items now have vectors.`);

  await pool.end();
}

main().catch(async (err) => {
  console.error("\nEmbedding failed:", err);
  console.error("Re-run `npm run mbs:embed` — completed rows are kept and will be skipped.");
  await pool.end();
  process.exit(1);
});

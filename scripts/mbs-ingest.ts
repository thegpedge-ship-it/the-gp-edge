/**
 * Pass 1 — load an MBS XML dump into mbs_items.
 *
 *   npm run mbs:ingest -- database/MBS-XML-2026-07-01.XML
 *
 * The CLI equivalent of the admin "Update MBS" page, sharing the same parser and
 * the same upsert so both produce identical results. Useful for the initial bulk
 * load, where driving 6,000 rows through a browser is pointless.
 *
 * Makes no network calls: rows land with embedding = NULL and mbs-embed.ts fills
 * them in. Splitting the two means a failure in the slow, rate-limited embedding
 * half never costs you the fast half.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseMbsXml } from "../lib/mbs/parseMbsXml";
import { pool } from "../lib/db";

const SYNC_BATCH = 300;

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error("Usage: npm run mbs:ingest -- <path-to-MBS-XML-file>");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  console.log(`Reading ${filePath}`);
  const xml = readFileSync(filePath, "utf8");

  const { items, duplicates, skipped } = parseMbsXml(xml);
  console.log(`Parsed ${items.length} items (${duplicates} duplicate, ${skipped} skipped)`);
  if (items.length === 0) {
    console.error("Nothing to ingest.");
    process.exit(1);
  }

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  for (let i = 0; i < items.length; i += SYNC_BATCH) {
    const batch = items.slice(i, i + SYNC_BATCH);

    // Unchanged descriptions are skipped by the WHERE clause so they keep their
    // vector; a changed one clears embedding so mbs-embed.ts re-queues the row
    // rather than leaving a vector that describes the OLD text.
    const { rows } = await pool.query<{ inserted: boolean }>(
      `INSERT INTO mbs_items (item_num, description)
       SELECT * FROM UNNEST($1::int[], $2::text[])
       ON CONFLICT (item_num) DO UPDATE
          SET description = EXCLUDED.description,
              embedding   = NULL
        WHERE mbs_items.description IS DISTINCT FROM EXCLUDED.description
       RETURNING (xmax = 0) AS inserted`,
      [batch.map((b) => b.itemNum), batch.map((b) => b.description)],
    );

    const batchInserted = rows.filter((r) => r.inserted).length;
    inserted += batchInserted;
    updated += rows.length - batchInserted;
    unchanged += batch.length - rows.length;

    process.stdout.write(
      `\r  synced ${Math.min(i + batch.length, items.length)}/${items.length}`,
    );
  }
  process.stdout.write("\n");

  // Items absent from this file are retired rather than deleted (favourites
  // cascade on delete); items that reappear are un-retired, so a bad upload is
  // recoverable by re-running with a correct file.
  const itemNums = items.map((i) => i.itemNum);
  const { rowCount: retired } = await pool.query(
    `UPDATE mbs_items SET retired_at = now()
      WHERE retired_at IS NULL AND NOT (item_num = ANY($1::int[]))`,
    [itemNums],
  );
  const { rowCount: restored } = await pool.query(
    `UPDATE mbs_items SET retired_at = NULL
      WHERE retired_at IS NOT NULL AND item_num = ANY($1::int[])`,
    [itemNums],
  );

  const { rows: stats } = await pool.query<{
    total: string;
    pending: string;
    retired: string;
  }>(
    `SELECT count(*)::text AS total,
            count(*) FILTER (WHERE embedding IS NULL AND retired_at IS NULL)::text AS pending,
            count(*) FILTER (WHERE retired_at IS NOT NULL)::text AS retired
       FROM mbs_items`,
  );

  console.log(`\nAdded     ${inserted}`);
  console.log(`Updated   ${updated}`);
  console.log(`Unchanged ${unchanged}`);
  if (retired) console.log(`Retired   ${retired} (absent from this file)`);
  if (restored) console.log(`Restored  ${restored} (reappeared in this file)`);

  console.log(
    `\nTable holds ${stats[0].total} items ` +
      `(${stats[0].retired} retired); ${stats[0].pending} need embedding.`,
  );
  console.log(`\nNext: npm run mbs:embed`);
  await pool.end();
}

main().catch(async (err) => {
  console.error("\nIngest failed:", err);
  await pool.end();
  process.exit(1);
});

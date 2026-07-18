/**
 * Parser for the government MBS XML dump (e.g. MBS-XML-2026-07-01.XML).
 *
 * Defines exactly what counts as an item, which the admin "Update MBS" page
 * relies on when it compares the XML item count against the row count to decide
 * whether a reconciliation pass is needed.
 *
 * Pure JS with no Node APIs: the admin page parses the upload in the BROWSER so
 * an 8MB file never crosses the network, and only small batches are posted to
 * the server.
 */
import { XMLParser } from "fast-xml-parser";

export interface MbsXmlItem {
  itemNum: number;
  description: string;
}

export interface ParseMbsXmlResult {
  items: MbsXmlItem[];
  /** <Data> blocks repeating an ItemNum already seen. Last occurrence wins. */
  duplicates: number;
  /** <Data> blocks dropped for a missing/non-numeric ItemNum or empty Description. */
  skipped: number;
}

/**
 * Elements the government ships are flat <Data> blocks under an <MBS_XML> root.
 * We keep only the two fields the search index needs; everything else (fees,
 * EMSN caps, dates) is re-read live from the MBS item page at view time.
 */
export function parseMbsXml(xml: string): ParseMbsXmlResult {
  const parser = new XMLParser({
    ignoreAttributes: true,
    // Keep every value a string. ItemNum is cast explicitly below, and letting
    // the parser coerce would turn an empty <Description/> into a boolean/number.
    parseTagValue: false,
    trimValues: true,
  });

  const doc = parser.parse(xml);
  const root = doc?.MBS_XML;
  if (!root) {
    throw new Error(
      "Not an MBS XML file: expected a root <MBS_XML> element. " +
        "Download the XML from the MBS Online monthly downloads page.",
    );
  }

  const raw = root.Data;
  const blocks: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

  // Keyed by item number so a repeated ItemNum collapses to its last occurrence
  // rather than reaching Postgres, where ON CONFLICT DO UPDATE would abort the
  // whole statement with "cannot affect row a second time".
  const byItemNum = new Map<number, string>();
  let duplicates = 0;
  let skipped = 0;

  for (const block of blocks) {
    const itemNum = Number(String(block?.ItemNum ?? "").trim());
    const description = String(block?.Description ?? "").trim();

    if (!Number.isInteger(itemNum) || itemNum <= 0 || description === "") {
      skipped++;
      continue;
    }
    if (byItemNum.has(itemNum)) duplicates++;
    byItemNum.set(itemNum, description);
  }

  const items = Array.from(byItemNum, ([itemNum, description]) => ({
    itemNum,
    description,
  }));

  return { items, duplicates, skipped };
}

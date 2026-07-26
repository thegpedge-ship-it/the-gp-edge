/**
 * LLM structuring of a scraped MBS item page into consistent, displayable JSON.
 *
 * The government item page is raw HTML whose layout varies by item category.
 * Injecting it verbatim gives every item a different-looking page and leaks the
 * source site's styling. Instead we pass the page's text to Gemini and get back
 * a fixed shape — a one-line summary plus an ordered list of labelled sections —
 * so every item renders through the same component with the same structure.
 *
 * Server-only: reads GEMINI_API_KEY. The same key covers this, titles and
 * embeddings.
 */
import { GoogleGenAI } from "@google/genai";
import { DailyQuotaError } from "./embed";

/**
 * Structuring is a light extraction task, not reasoning, so the cheapest
 * Flash-tier model fits — the same one titles use. Overridable by env var
 * because Google retires these ahead of schedule (see lib/mbs/title.ts); when a
 * model 404s the fix should be a .env change, not a redeploy.
 */
export const STRUCTURE_MODEL =
  process.env.GEMINI_STRUCTURE_MODEL ?? "gemini-3.1-flash-lite";

const SYSTEM_INSTRUCTION = `
You convert one item's page from the Australian Medicare Benefits Schedule (MBS)
into a list of labelled fields that a GP will read to understand the item.

You are given the plain text of the item's page. Your job is to capture ALL of
its information — be exhaustive, not selective. Divide the content into logical
fields yourself and choose a clear, short title for each field. Do not summarise,
shorten, or merge away information, and do not decide something is unimportant
and drop it — every meaningful piece of information on the page must appear in
some field.

Rules:
- YOU decide how to divide the content and what to title each field. Write each
  "label" as a clear, short Title-Case heading for the information it holds.
- Put that field's content in "value" as clean readable text, copied VERBATIM.
  Never paraphrase or abbreviate a value. Preserve line breaks within a value
  where they aid readability (e.g. a fee/benefit table or a list of conditions).
- Extract only what the text states — never invent a fee, amount, or detail.
- The ONLY thing you must leave out is a related-items / associated-items / "see
  also" list of OTHER item numbers. Everything else on the page must be included.
  (Explanatory-note references are NOT related items — include them.)
- Skip only pure site navigation, headers, footers, and boilerplate. Do not
  include HTML tags.

Return { "sections": [ { "label", "value" }, ... ] } covering everything on the page.
`.trim();

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    sections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          value: { type: "STRING" },
        },
        required: ["label", "value"],
      },
    },
  },
  required: ["sections"],
} as const;

export interface StructuredSection {
  label: string;
  value: string;
}

/** A "Related Items" / "Associated Items" / "See Also" LIST of other item
 *  numbers is excluded from the detail view. Matched narrowly (the word must be
 *  followed by "items") so legitimate content like "Associated Explanatory
 *  Notes" is kept. Also drops such sections from older cached rows. */
export function isRelatedSection(label: string): boolean {
  return /\b(related|associated)\s+items?\b|\bsee also\b/i.test(label);
}

export interface StructuredDetail {
  sections: StructuredSection[];
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env — the same key covers structuring, titles and embeddings.",
    );
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

const RETRYABLE = /\b(429|500|502|503|504|RESOURCE_EXHAUSTED|UNAVAILABLE)\b/i;
const DAILY_QUOTA = /PerDay|RequestsPerDay/i;

/** Gemini states the wait it wants on a rate limit; honour it rather than guess. */
function retryDelayMs(err: unknown): number | null {
  const raw = String(err);
  const match =
    raw.match(/"retryDelay"\s*:\s*"([\d.]+)s"/) ?? raw.match(/retry in ([\d.]+)s/i);
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) + 500 : null;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (DAILY_QUOTA.test(String(err))) {
        throw new DailyQuotaError(
          "Gemini daily generation quota exhausted. It resets at midnight US Pacific time.",
        );
      }
      if (!RETRYABLE.test(String(err)) || attempt === attempts - 1) throw err;
      const wait = retryDelayMs(err) ?? Math.min(1000 * 2 ** attempt, 30_000);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastError;
}

/**
 * Structure one item's page text into { summary, sections }.
 *
 * `pageText` is the government page's text (tags already stripped by the caller).
 * Returns null only if the model gives an unusable response after retries — the
 * caller decides whether to surface an error or fall back to the raw page.
 */
export async function structureItemDetail(
  itemNum: number,
  pageText: string,
): Promise<StructuredDetail> {
  const ai = getClient();

  const response = (await withRetry(() =>
    ai.models.generateContent({
      model: STRUCTURE_MODEL,
      contents: `Item number: ${itemNum}\n\nPage text:\n${pageText}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA as any,
        // Extraction, not creativity — keep it literal and stable.
        temperature: 0.1,
      },
    }),
  )) as any;

  const text = response.text;
  if (!text) throw new Error("Structure model returned an empty response.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `Structure model returned invalid JSON: ${String(text).slice(0, 200)}`,
    );
  }

  const rawSections = (parsed as any)?.sections;
  const sections: StructuredSection[] = Array.isArray(rawSections)
    ? rawSections
        .map((s: any) => ({
          label: String(s?.label ?? "").trim(),
          value: String(s?.value ?? "").trim(),
        }))
        .filter(
          (s: StructuredSection) =>
            s.label !== "" && s.value !== "" && !isRelatedSection(s.label),
        )
    : [];

  if (sections.length === 0) {
    throw new Error("Structure model returned no usable content.");
  }

  return { sections };
}

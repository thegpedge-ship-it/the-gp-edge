/**
 * LLM-generated titles for MBS items.
 *
 * Server-only: reads GEMINI_API_KEY. The same key covers this and embeddings.
 */
import { GoogleGenAI } from "@google/genai";
import { DailyQuotaError } from "./embed";

/**
 * Writing a short title from a description is a simple, high-volume task, so
 * the cheapest current Flash-tier model is the right fit rather than a
 * reasoning model.
 *
 * Overridable by env var because Google retires these faster than its own
 * published schedule — gemini-2.5-flash started returning 404 in July 2026,
 * months ahead of its announced October shutdown. When that happens again, the
 * fix should be a .env change, not a code change and redeploy.
 */
export const TITLE_MODEL = process.env.GEMINI_TITLE_MODEL ?? "gemini-3.1-flash-lite";

/**
 * Items per request.
 *
 * Deliberately large. The generation free tier is capped on requests per DAY,
 * not just per minute, so 6,000 items titled one-per-call would exhaust a day's
 * quota many times over. At 40 per call the whole schedule fits in ~150
 * requests.
 */
export const TITLE_BATCH_SIZE = 40;

/** Generation is far more rate-limited than embedding; pace well under it. */
export const TITLE_PAUSE_MS = 6000;

export interface TitleInput {
  itemNum: number;
  description: string;
}

const SYSTEM_INSTRUCTION = `
You write short titles for items in the Australian Medicare Benefits Schedule (MBS).
Australian GPs search these titles to find the right item number to bill.

For each item, write a title that:
- is 3 to 9 words, in Title Case, with no trailing full stop
- leads with the service itself (e.g. "GP Consultation", "Chest CT", "Skin Lesion Excision")
- keeps any level, duration, or complexity the description states (e.g. "Level B", "20-40 Minutes")
- uses the words a clinician would actually search, not the legal phrasing of the descriptor
- never includes the item number, dollar amounts, or the word "Item"

Base the title ONLY on the description you are given. Never invent a body site,
duration, level, or clinical detail that the description does not state. If a
description is vague, write a correspondingly general title rather than guessing.

Return one entry per input item, echoing its itemNum exactly.
`.trim();

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      itemNum: { type: "INTEGER" },
      title: { type: "STRING" },
    },
    required: ["itemNum", "title"],
  },
} as const;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env — the same key covers titles and embeddings.",
    );
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

const RETRYABLE = /\b(429|500|502|503|504|RESOURCE_EXHAUSTED|UNAVAILABLE)\b/i;

/** See lib/mbs/embed.ts — a daily allowance does not refill on a retry timer. */
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
          "Gemini daily generation quota exhausted. It resets at midnight US Pacific time. " +
            "Titles already generated are saved — re-run then and it will resume.",
        );
      }

      if (!RETRYABLE.test(String(err)) || attempt === attempts - 1) throw err;
      const wait = retryDelayMs(err) ?? Math.min(1000 * 2 ** attempt, 30_000);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastError;
}

/** Collapse whitespace and strip a trailing full stop the model may add anyway. */
function tidy(title: string): string {
  return title.replace(/\s+/g, " ").trim().replace(/\.$/, "");
}

/**
 * Title a batch of items in one request.
 *
 * Returns a Map keyed by item number rather than a positional array: the model
 * echoes each itemNum back, so results are matched by identity instead of by
 * order. A reordered or short response therefore just yields fewer entries —
 * it can never silently attach one item's title to another item's row.
 *
 * Callers write only what the Map contains and leave the rest NULL for the next
 * pass to retry.
 */
export async function generateTitles(items: TitleInput[]): Promise<Map<number, string>> {
  if (items.length === 0) return new Map();

  const ai = getClient();
  const payload = items.map((i) => ({ itemNum: i.itemNum, description: i.description }));

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: TITLE_MODEL,
      contents: JSON.stringify(payload),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA as any,
        // Titles should be stable and literal, not creative.
        temperature: 0.2,
      },
    }),
  ) as any;

  const text = response.text;
  if (!text) throw new Error("Title model returned an empty response.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Title model returned invalid JSON: ${text.slice(0, 200)}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Title model did not return an array.");
  }

  // Only accept entries whose itemNum was actually in this batch — guards
  // against the model echoing an id it invented or carried over.
  const requested = new Set(items.map((i) => i.itemNum));
  const titles = new Map<number, string>();

  for (const entry of parsed) {
    const itemNum = Number((entry as any)?.itemNum);
    const title = tidy(String((entry as any)?.title ?? ""));
    if (!requested.has(itemNum) || title === "") continue;
    titles.set(itemNum, title.slice(0, 200));
  }

  return titles;
}

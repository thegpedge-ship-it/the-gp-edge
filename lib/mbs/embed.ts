/**
 * Gemini embeddings for MBS semantic search.
 *
 * Server-only: reads GEMINI_API_KEY, so never import this from a client
 * component. The admin page reaches it through actions/mbs.actions.ts.
 */
import { GoogleGenAI } from "@google/genai";

export const EMBED_MODEL = "gemini-embedding-001";

/**
 * Must match VECTOR(768) in the mbs_items table. Deliberately not 3072:
 * pgvector cannot build an HNSW index above 2000 dimensions, so a larger vector
 * would silently turn every search into a sequential scan.
 */
export const EMBED_DIM = 768;

/** Gemini caps a single batchEmbed call at 100 inputs. */
export const EMBED_BATCH_SIZE = 100;

export type EmbedTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env — the same key covers both " +
        "embeddings and the detail-page extraction.",
    );
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Gemini only returns unit-length vectors at its full 3072 dimensions; any
 * truncated (MRL) size comes back unnormalised, so we normalise here. Cosine
 * distance would rescale anyway, but storing unit vectors keeps `1 - (a <=> b)`
 * a true cosine similarity in [0,1] and makes stored vectors comparable.
 */
function normalise(values: number[]): number[] {
  let sumSquares = 0;
  for (const v of values) sumSquares += v * v;
  const magnitude = Math.sqrt(sumSquares);
  return magnitude > 0 ? values.map((v) => v / magnitude) : values;
}

const RETRYABLE = /\b(429|500|502|503|504|RESOURCE_EXHAUSTED|UNAVAILABLE)\b/i;

/**
 * A per-DAY quota, as opposed to a per-minute rate limit.
 *
 * The distinction decides whether retrying is useful at all. A per-minute limit
 * clears in seconds; a daily allowance does not come back until it resets, so
 * retrying only burns more of an allowance that is already gone — and failed
 * requests still count against it. Treating the two the same turned one
 * exhausted quota into five wasted requests and a 3-minute hang.
 */
const DAILY_QUOTA = /PerDay|RequestsPerDay/i;

export class DailyQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DailyQuotaError";
  }
}

/**
 * Gemini returns the exact wait it wants on a rate limit, e.g.
 *   "retryDelay":"7s"   /   "Please retry in 7.245923113s"
 * Honouring that beats guessing: a blind exponential backoff that tops out
 * below the requested delay just burns every attempt and fails anyway.
 */
function retryDelayMs(err: unknown): number | null {
  const raw = String(err);
  const match =
    raw.match(/"retryDelay"\s*:\s*"([\d.]+)s"/) ??
    raw.match(/retry in ([\d.]+)s/i);
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) + 500 : null;
}

/**
 * A full ingest is ~61 sequential calls against a free tier that allows 100
 * embedding requests per minute, so hitting a limit mid-run is expected rather
 * than exceptional. Waits for however long the API asks, falling back to
 * exponential backoff when it does not say. A non-retryable error (bad key, bad
 * request) throws immediately rather than burning every attempt on it.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Fail immediately rather than spending more of an allowance that is
      // already exhausted.
      if (DAILY_QUOTA.test(String(err))) {
        throw new DailyQuotaError(
          "Gemini daily embedding quota exhausted (free tier allows 1,000 requests per day). " +
            "It resets at midnight US Pacific time. Descriptions are already saved — " +
            "re-run then and it will resume from where it stopped.",
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
 * Embed a batch of texts in ONE request. Batching is purely a transport
 * optimisation — each text is embedded independently and the vectors are
 * identical to embedding them one at a time.
 *
 * Returns vectors positionally aligned with `texts`. The length assertion below
 * is the important one: if the API ever returned a short or reordered list, the
 * caller would zip vectors onto the wrong item numbers and searches would return
 * confidently wrong results with no error anywhere.
 */
export async function embedTexts(
  texts: string[],
  taskType: EmbedTaskType = "RETRIEVAL_DOCUMENT",
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > EMBED_BATCH_SIZE) {
    throw new Error(
      `embedTexts received ${texts.length} texts; max is ${EMBED_BATCH_SIZE}.`,
    );
  }

  const ai = getClient();
  const response = await withRetry(() =>
    ai.models.embedContent({
      model: EMBED_MODEL,
      contents: texts,
      config: { outputDimensionality: EMBED_DIM, taskType },
    }),
  ) as any;

  const embeddings = response.embeddings ?? [];
  if (embeddings.length !== texts.length) {
    throw new Error(
      `Embedding count mismatch: sent ${texts.length}, received ${embeddings.length}. ` +
        "Refusing to write potentially misaligned vectors.",
    );
  }

  return embeddings.map((e: any, i: number) => {
    const values = e.values ?? [];
    if (values.length !== EMBED_DIM) {
      throw new Error(
        `Embedding ${i} has ${values.length} dimensions, expected ${EMBED_DIM}.`,
      );
    }
    return normalise(values);
  });
}

/** Render a vector in the literal form pgvector accepts: '[0.1,0.2,...]'. */
export function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

/** Embed a doctor's search query. RETRIEVAL_QUERY is asymmetric with
 *  RETRIEVAL_DOCUMENT — using the wrong one measurably degrades match quality. */
export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text], "RETRIEVAL_QUERY");
  return vector;
}

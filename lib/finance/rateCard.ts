/**
 * Rate Card Engine for GP EDGE
 *
 * Rules:
 * 1. Rates are defined by Task Type × Content Type.
 * 2. Versioned with effective dates; the version in force at the Date of Acceptance governs (Rule R5).
 * 3. Centralized single function `resolveRate(taskType, contentType, acceptanceDate, contributor)`.
 *    The `contributor` argument is accepted and ignored in v1.
 * 4. Regenerating historical statements reproduces original amounts exactly.
 * 5. Bank details are NEVER stored anywhere.
 */

import { query, queryOne, execute } from "@/lib/db";
import { PermissionUser } from "@/lib/relationalPermissions";

export type TaskType = "draft" | "review" | "remediation";
export type ContentType =
  | "question"
  | "medical_condition"
  | "approach"
  | "autofill_template"
  | "quiz"
  | "mock_test";

export interface RateCardVersion {
  id?: string;
  version: number;
  effectiveFrom: string; // ISO date string e.g. "2026-01-01T00:00:00Z"
  effectiveTo?: string | null; // null if active
  rates: Record<string, number>; // key: `${taskType}:${contentType}` -> amount in AUD
  createdAt?: string;
  createdBy?: string;
}

// Canonical Default Baseline Rate Card Versions
const DEFAULT_RATE_CARDS: RateCardVersion[] = [
  {
    version: 1,
    effectiveFrom: "2026-01-01T00:00:00Z",
    effectiveTo: null,
    rates: {
      "draft:question": 120.0,
      "draft:medical_condition": 350.0,
      "draft:approach": 250.0,
      "draft:autofill_template": 150.0,
      "draft:quiz": 100.0,
      "draft:mock_test": 200.0,

      "review:question": 75.0,
      "review:medical_condition": 180.0,
      "review:approach": 130.0,
      "review:autofill_template": 80.0,
      "review:quiz": 60.0,
      "review:mock_test": 120.0,

      "remediation:question": 50.0,
      "remediation:medical_condition": 120.0,
      "remediation:approach": 90.0,
      "remediation:autofill_template": 50.0,
      "remediation:quiz": 40.0,
      "remediation:mock_test": 80.0,
    },
  },
];

/**
 * Initializes rate cards table in PostgreSQL if not already created.
 */
export async function initRateCardsTable(): Promise<void> {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS rate_card_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version INT NOT NULL UNIQUE,
        effective_from TIMESTAMPTZ NOT NULL,
        effective_to TIMESTAMPTZ,
        rates JSONB NOT NULL,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const count = await queryOne<{ count: string }>(
      `SELECT count(*) as count FROM rate_card_versions`
    );
    if (count && parseInt(count.count, 10) === 0) {
      for (const rc of DEFAULT_RATE_CARDS) {
        await execute(
          `INSERT INTO rate_card_versions (version, effective_from, effective_to, rates, created_by, created_at)
           VALUES ($1, $2, $3, $4::jsonb, 'system', NOW())`,
          [rc.version, rc.effectiveFrom, rc.effectiveTo || null, JSON.stringify(rc.rates)]
        );
      }
    }
  } catch (err) {
    console.error("[initRateCardsTable] Error:", err);
  }
}

/**
 * Rate resolution happens in exactly ONE function, taking:
 * (taskType, contentType, acceptanceDate, contributor).
 *
 * The contributor argument is accepted and ignored in v1.
 * Every monetary calculation MUST call this function rather than reading a rate directly.
 */
export async function resolveRate(
  taskType: TaskType,
  contentType: ContentType,
  acceptanceDate: Date | string,
  contributor?: string | PermissionUser
): Promise<{ rate: number; version: number; effectiveFrom: string }> {
  await initRateCardsTable();

  const accDate = typeof acceptanceDate === "string" ? new Date(acceptanceDate) : acceptanceDate;
  const accIso = accDate.toISOString();

  // Normalize task type and content type keys
  const normalizedTaskType = taskType.toLowerCase() as TaskType;
  const normalizedContentType = contentType.toLowerCase() as ContentType;
  const rateKey = `${normalizedTaskType}:${normalizedContentType}`;

  try {
    // Find rate card version in force at the acceptance date
    const matchedVersion = await queryOne<{
      version: number;
      effective_from: Date;
      effective_to: Date | null;
      rates: Record<string, number>;
    }>(
      `SELECT version, effective_from, effective_to, rates
         FROM rate_card_versions
        WHERE effective_from <= $1
          AND (effective_to IS NULL OR effective_to > $1)
        ORDER BY version DESC
        LIMIT 1`,
      [accIso]
    );

    if (matchedVersion) {
      const rates =
        typeof matchedVersion.rates === "string"
          ? JSON.parse(matchedVersion.rates)
          : matchedVersion.rates;
      const rate = rates[rateKey] ?? (normalizedTaskType === "review" ? 75.0 : 120.0);
      return {
        rate: Number(rate),
        version: matchedVersion.version,
        effectiveFrom: matchedVersion.effective_from.toISOString(),
      };
    }
  } catch (err) {
    console.error("[resolveRate] Query error, falling back to default:", err);
  }

  // Fallback to latest default version
  const fallback = DEFAULT_RATE_CARDS[0];
  const rate = fallback.rates[rateKey] ?? 75.0;
  return {
    rate,
    version: fallback.version,
    effectiveFrom: fallback.effectiveFrom,
  };
}

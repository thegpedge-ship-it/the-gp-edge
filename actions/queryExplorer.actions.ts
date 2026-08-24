"use server";

import { query, queryOne } from "@/lib/db";
import { PermissionUser } from "@/lib/relationalPermissions";
import { buildBulkQuestionWhereClause, BulkQuestionFilters } from "@/lib/questionQueryFilters";


export interface QuestionRow {
  id: string;
  uqid: string | null;
  stem: string;
  [key: string]: any;
}

/** "Which live items have never been reviewed" */
export async function findNeverReviewedLiveItemsAction(): Promise<{ success: boolean; rows: QuestionRow[]; error?: string }> {
  try {
    const rows = await query<QuestionRow>(
      `SELECT id, uqid, stem, exam_type_code AS "examType", created_at AS "createdAt"
         FROM questions
        WHERE deleted_at IS NULL AND status = 'published' AND date_last_reviewed IS NULL
        ORDER BY created_at ASC`
    );
    return { success: true, rows };
  } catch (error: any) {
    console.error("findNeverReviewedLiveItemsAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

const REVIEW_CYCLE_BY_VOLATILITY: Record<string, string> = {
  Volatile: "6 months",
  Standard: "12 months",
  Stable: "24 months",
};

/** "What is overdue for review" — sorted Volatile first, per volatility-based review cycle */
export async function findOverdueForReviewAction(): Promise<{ success: boolean; rows: (QuestionRow & { reviewDueBy: string; volatilityTier: string | null })[]; error?: string }> {
  try {
    const rows = await query<any>(
      `SELECT * FROM (
         SELECT q.id, q.uqid, q.stem, q.volatility_tier AS "volatilityTier", q.exam_type_code AS "examType",
                (COALESCE(q.date_last_reviewed, q.created_at) + (
                  CASE q.volatility_tier
                    WHEN 'Volatile' THEN INTERVAL '6 months'
                    WHEN 'Standard' THEN INTERVAL '12 months'
                    WHEN 'Stable' THEN INTERVAL '24 months'
                    ELSE INTERVAL '12 months'
                  END
                )) AS "reviewDueBy"
           FROM questions q
          WHERE q.deleted_at IS NULL AND q.status = 'published'
       ) sub
       WHERE "reviewDueBy" < NOW()
       ORDER BY CASE "volatilityTier" WHEN 'Volatile' THEN 0 WHEN 'Standard' THEN 1 WHEN 'Stable' THEN 2 ELSE 3 END, "reviewDueBy" ASC`
    );
    return { success: true, rows: rows.map((r) => ({ ...r, reviewDueBy: new Date(r.reviewDueBy).toISOString() })) };
  } catch (error: any) {
    console.error("findOverdueForReviewAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

/** "Which items had their keyed answer changed after sign-off" */
export async function findAnswerChangedAfterSignoffAction(): Promise<{ success: boolean; rows: QuestionRow[]; error?: string }> {
  try {
    const rows = await query<QuestionRow>(
      `SELECT DISTINCT q.id, q.uqid, q.stem, q.exam_type_code AS "examType"
         FROM questions q
         JOIN question_events e_edit ON e_edit.question_id = q.id AND e_edit.event_type = 'edited'
           AND e_edit.fields_changed @> '["answer"]'::jsonb
         JOIN question_events e_sign ON e_sign.question_id = q.id AND e_sign.event_type = 'signedoff'
        WHERE e_edit.created_at > e_sign.created_at AND q.deleted_at IS NULL
        ORDER BY q.stem`
    );
    return { success: true, rows };
  } catch (error: any) {
    console.error("findAnswerChangedAfterSignoffAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

/** "Recall everything from one generation run" — a batchId or writtenBy+dates. Thin wrapper
 * over the same filter engine the bulk-edit preview uses, since it's the same query shape. */
export async function recallByBatchOrAuthorAction(filters: BulkQuestionFilters): Promise<{ success: boolean; rows: QuestionRow[]; error?: string }> {
  try {
    const { where, params } = buildBulkQuestionWhereClause(filters);
    const rows = await query<QuestionRow>(
      `SELECT q.id, q.uqid, q.stem, q.batch_id AS "batchId", q.created_by AS "writtenBy", q.created_at AS "createdAt"
         FROM questions q
         LEFT JOIN subtopics st ON st.id = q.subtopic_id
        WHERE ${where}
        ORDER BY q.created_at DESC
        LIMIT 2000`,
      params
    );
    return { success: true, rows };
  } catch (error: any) {
    console.error("recallByBatchOrAuthorAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

const DEFAULT_QUOTA_BY_DEPTH: Record<string, { min?: number; max?: number }> = {
  Core: { min: 8 },
  Working: { min: 4 },
  Awareness: { max: 1 },
};

/** "Where is coverage short" — item count per topicCode against the quota implied by depthTier,
 * rolled up to unit, split by bank. Returns both under- and over-served topics. */
export async function getCoverageVsQuotaAction(): Promise<{
  success: boolean;
  underServed: any[];
  overServed: any[];
  error?: string;
}> {
  try {
    const rows = await query<any>(
      `SELECT q.topic_code AS "topicCode", q.home_unit AS "homeUnit", q.depth_tier AS "depthTier",
              q.exam_type_code AS "examType", COUNT(*)::int AS "itemCount"
         FROM questions q
        WHERE q.deleted_at IS NULL AND q.status = 'published' AND q.topic_code IS NOT NULL
        GROUP BY q.topic_code, q.home_unit, q.depth_tier, q.exam_type_code
        ORDER BY q.home_unit, q.topic_code`
    );
    const underServed: any[] = [];
    const overServed: any[] = [];
    for (const r of rows) {
      const quota = DEFAULT_QUOTA_BY_DEPTH[r.depthTier as string];
      if (!quota) continue;
      if (quota.min != null && r.itemCount < quota.min) underServed.push({ ...r, quota: quota.min, kind: "min" });
      if (quota.max != null && r.itemCount > quota.max) overServed.push({ ...r, quota: quota.max, kind: "max" });
    }
    return { success: true, underServed, overServed };
  } catch (error: any) {
    console.error("getCoverageVsQuotaAction error:", error);
    return { success: false, underServed: [], overServed: [], error: error.message };
  }
}

/** "How long is the proofing queue and how fast is it moving" */
export async function getProofingQueueStatsAction(): Promise<{
  success: boolean;
  queueLength: number;
  throughputByActorWeek: { actorName: string; week: string; proofed: number }[];
  error?: string;
}> {
  try {
    const queueRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM questions WHERE deleted_at IS NULL AND status = 'review'`
    );
    const throughput = await query<any>(
      `SELECT actor_name AS "actorName", to_char(date_trunc('week', created_at), 'YYYY-MM-DD') AS week, COUNT(*)::int AS proofed
         FROM question_events
        WHERE event_type IN ('reviewed', 'signedoff')
        GROUP BY actor_name, date_trunc('week', created_at)
        ORDER BY week DESC, proofed DESC
        LIMIT 200`
    );
    return { success: true, queueLength: parseInt(queueRow?.count || "0", 10), throughputByActorWeek: throughput };
  } catch (error: any) {
    console.error("getProofingQueueStatsAction error:", error);
    return { success: false, queueLength: 0, throughputByActorWeek: [], error: error.message };
  }
}

/**
 * AKT/KFP quality signals — items nobody/everybody gets right, computed from live attempt data.
 * direction "low" = actualCorrectRate below threshold (nobody gets it right); "high" = above (everybody does).
 */
export async function findPerformanceOutlierQuestionsAction(params: {
  examType: "AKT" | "KFP";
  direction: "low" | "high";
  thresholdPercent: number; // 0-100
  minAttempts: number;
}): Promise<{ success: boolean; rows: (QuestionRow & { attempts: number; correctRatePercent: number })[]; error?: string }> {
  try {
    const comparator = params.direction === "low" ? "<" : ">";
    const rows = await query<any>(
      `SELECT q.id, q.uqid, q.stem, COUNT(*)::int AS attempts,
              ROUND(AVG(CASE WHEN aa.is_correct THEN 100.0 ELSE 0 END), 1) AS "correctRatePercent"
         FROM attempt_questions aq
         JOIN attempt_answers aa ON aa.attempt_question_id = aq.id
         JOIN questions q ON q.id = aq.question_id
        WHERE q.exam_type_code = $1 AND q.deleted_at IS NULL AND aa.is_correct IS NOT NULL
        GROUP BY q.id, q.uqid, q.stem
       HAVING COUNT(*) >= $2 AND AVG(CASE WHEN aa.is_correct THEN 100.0 ELSE 0 END) ${comparator} $3
        ORDER BY "correctRatePercent" ${params.direction === "low" ? "ASC" : "DESC"}`,
      [params.examType, params.minAttempts, params.thresholdPercent]
    );
    return { success: true, rows };
  } catch (error: any) {
    console.error("findPerformanceOutlierQuestionsAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

/**
 * "Which wrong option is nobody choosing" — the main KFP/AKT distractor-quality signal.
 * Flags options picked by fewer than maxPickPercent of candidates, among questions with
 * at least minAttempts recorded attempts.
 */
export async function findWeakDistractorsAction(params: {
  examType: "AKT" | "KFP";
  maxPickPercent: number; // 0-100
  minAttempts: number;
}): Promise<{
  success: boolean;
  rows: { questionId: string; uqid: string | null; stem: string; optionLabel: string; position: number; pickPercent: number; attempts: number }[];
  error?: string;
}> {
  try {
    const rows = await query<any>(
      `SELECT q.id AS "questionId", q.uqid, q.stem, aqo.label_snapshot AS "optionLabel", aqo.position,
              COUNT(DISTINCT aq.id)::int AS attempts,
              ROUND(100.0 * COUNT(*) FILTER (WHERE aa.selected_option_id = aqo.id) / NULLIF(COUNT(DISTINCT aq.id), 0), 1) AS "pickPercent"
         FROM attempt_questions aq
         JOIN attempt_question_options aqo ON aqo.attempt_question_id = aq.id AND aqo.is_correct = false
         JOIN questions q ON q.id = aq.question_id
         LEFT JOIN attempt_answers aa ON aa.attempt_question_id = aq.id
        WHERE q.exam_type_code = $1 AND q.deleted_at IS NULL
        GROUP BY q.id, q.uqid, q.stem, aqo.position, aqo.label_snapshot
       HAVING COUNT(DISTINCT aq.id) >= $2
          AND (100.0 * COUNT(*) FILTER (WHERE aa.selected_option_id = aqo.id) / NULLIF(COUNT(DISTINCT aq.id), 0)) < $3
        ORDER BY "pickPercent" ASC`,
      [params.examType, params.minAttempts, params.maxPickPercent]
    );
    return { success: true, rows };
  } catch (error: any) {
    console.error("findWeakDistractorsAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

function significantWords(text: string): Set<string> {
  const stopwords = new Set(["the", "and", "for", "with", "that", "this", "from", "have", "which", "what", "when", "into", "most", "likely", "presents", "presenting", "patient", "years", "old"]);
  return new Set(
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopwords.has(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * "Which items in this topic test the same thing" — testablePoint word-overlap heuristic
 * within a topicCode. Not a DB-level similarity search; fetches the (small) per-topic
 * group and compares pairwise in JS, since testablePoint is admin-only free text.
 */
export async function findSimilarTestablePointsAction(params: {
  topicCode?: string;
  minSimilarity?: number; // 0-1, default 0.5
}): Promise<{
  success: boolean;
  pairs: { aId: string; aUqid: string | null; aPoint: string; bId: string; bUqid: string | null; bPoint: string; similarity: number; topicCode: string }[];
  error?: string;
}> {
  try {
    const minSim = params.minSimilarity ?? 0.5;
    const conditions = ["q.deleted_at IS NULL", "q.testable_point IS NOT NULL", "q.testable_point != ''", "q.topic_code IS NOT NULL"];
    const qParams: any[] = [];
    if (params.topicCode) {
      qParams.push(params.topicCode.toLowerCase());
      conditions.push(`st.slug = $${qParams.length}`);
    }
    const rows = await query<{ id: string; uqid: string | null; testable_point: string; topic_code: string }>(
      `SELECT q.id, q.uqid, q.testable_point, q.topic_code
         FROM questions q
         LEFT JOIN subtopics st ON st.id = q.subtopic_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY q.topic_code`,
      qParams
    );

    const byTopic = new Map<string, typeof rows>();
    for (const r of rows) {
      if (!byTopic.has(r.topic_code)) byTopic.set(r.topic_code, []);
      byTopic.get(r.topic_code)!.push(r);
    }

    const pairs: { aId: string; aUqid: string | null; aPoint: string; bId: string; bUqid: string | null; bPoint: string; similarity: number; topicCode: string }[] = [];
    for (const [topicCode, items] of byTopic) {
      const tokenized = items.map((it) => ({ ...it, words: significantWords(it.testable_point) }));
      for (let i = 0; i < tokenized.length; i++) {
        for (let j = i + 1; j < tokenized.length; j++) {
          const sim = jaccardSimilarity(tokenized[i].words, tokenized[j].words);
          if (sim >= minSim) {
            pairs.push({
              aId: tokenized[i].id, aUqid: tokenized[i].uqid, aPoint: tokenized[i].testable_point,
              bId: tokenized[j].id, bUqid: tokenized[j].uqid, bPoint: tokenized[j].testable_point,
              similarity: Math.round(sim * 100) / 100, topicCode,
            });
          }
        }
      }
    }
    pairs.sort((a, b) => b.similarity - a.similarity);
    return { success: true, pairs: pairs.slice(0, 500) };
  } catch (error: any) {
    console.error("findSimilarTestablePointsAction error:", error);
    return { success: false, pairs: [], error: error.message };
  }
}

/** "Which items the users keep flagging" — reads the real subscriber "report an issue" flow
 * (question_feedback, submitted from the live quiz via saveQuestionFeedback in
 * app/exam-prep/actions.ts), and distinguishes repeat-flagging by the same reporter from
 * flags spread across different reporters. */
export async function getMostFlaggedQuestionsAction(minFlags: number = 1): Promise<{
  success: boolean;
  rows: { questionId: string; uqid: string | null; stem: string; flagCount: number; distinctReporters: number; openCount: number }[];
  error?: string;
}> {
  try {
    const rows = await query<any>(
      `SELECT q.id AS "questionId", q.uqid, q.stem,
              COUNT(qf.id)::int AS "flagCount",
              COUNT(DISTINCT qf.user_id)::int AS "distinctReporters",
              COUNT(qf.id) FILTER (WHERE qf.status = 'open')::int AS "openCount"
         FROM question_feedback qf
         JOIN questions q ON q.id = qf.question_id
        WHERE q.deleted_at IS NULL
        GROUP BY q.id, q.uqid, q.stem
       HAVING COUNT(qf.id) >= $1
        ORDER BY "flagCount" DESC`,
      [minFlags]
    );
    return { success: true, rows };
  } catch (error: any) {
    console.error("getMostFlaggedQuestionsAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

export interface CrossTypeSearchResult {
  itemType: "question" | "library" | "note_template";
  id: string;
  uqid?: string | null;
  title: string;
  snippet: string;
  status: string | null;
  createdAt: string | null;
}

/**
 * "Every item that mentions a keyword anywhere" — searches across questions, library
 * (medical_conditions), and note templates (autofill_templates) and merges results.
 * Bank and volatilityTier filters only apply to questions (the other two item types don't
 * carry those fields).
 */
export async function searchAllItemsAction(params: {
  keyword: string;
  itemTypes?: ("question" | "library" | "note_template")[];
  examType?: string;
  volatilityTier?: string;
  createdFrom?: string;
  createdTo?: string;
}): Promise<{ success: boolean; results: CrossTypeSearchResult[]; error?: string }> {
  try {
    const kw = params.keyword?.trim();
    if (!kw) return { success: true, results: [] };
    const want = (t: CrossTypeSearchResult["itemType"]) => !params.itemTypes || params.itemTypes.includes(t);
    const results: CrossTypeSearchResult[] = [];

    if (want("question")) {
      const { where, params: qParams } = buildBulkQuestionWhereClause({
        keyword: kw,
        examType: params.examType,
        volatilityTier: params.volatilityTier,
        createdFrom: params.createdFrom,
        createdTo: params.createdTo,
      });
      const rows = await query<any>(
        `SELECT q.id, q.uqid, q.stem, q.status, q.created_at AS "createdAt"
           FROM questions q
           LEFT JOIN subtopics st ON st.id = q.subtopic_id
          WHERE ${where}
          ORDER BY q.created_at DESC
          LIMIT 200`,
        qParams
      );
      for (const r of rows) {
        results.push({
          itemType: "question", id: r.id, uqid: r.uqid, title: r.stem?.slice(0, 120) || "(untitled)",
          snippet: r.stem?.slice(0, 200) || "", status: r.status, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        });
      }
    }

    if (want("library")) {
      const conditions = ["mc.deleted_at IS NULL", "(mc.name ILIKE $1 OR mc.category ILIKE $1 OR mc.clinical_notes ILIKE $1)"];
      const libParams: any[] = [`%${kw}%`];
      if (params.createdFrom) { libParams.push(params.createdFrom); conditions.push(`mc.created_at >= $${libParams.length}`); }
      if (params.createdTo) { libParams.push(params.createdTo); conditions.push(`mc.created_at <= $${libParams.length}`); }
      const rows = await query<any>(
        `SELECT mc.id, mc.name, mc.status, mc.clinical_notes, mc.created_at AS "createdAt"
           FROM medical_conditions mc
          WHERE ${conditions.join(" AND ")}
          ORDER BY mc.created_at DESC
          LIMIT 200`,
        libParams
      );
      for (const r of rows) {
        results.push({
          itemType: "library", id: r.id, title: r.name, snippet: (r.clinical_notes || "").slice(0, 200),
          status: r.status, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        });
      }
    }

    if (want("note_template")) {
      const conditions = ["t.deleted_at IS NULL", "(t.name ILIKE $1 OR t.description ILIKE $1 OR t.category ILIKE $1)"];
      const tplParams: any[] = [`%${kw}%`];
      if (params.createdFrom) { tplParams.push(params.createdFrom); conditions.push(`t.created_at >= $${tplParams.length}`); }
      if (params.createdTo) { tplParams.push(params.createdTo); conditions.push(`t.created_at <= $${tplParams.length}`); }
      const rows = await query<any>(
        `SELECT t.id, t.name, t.status, t.description, t.created_at AS "createdAt"
           FROM autofill_templates t
          WHERE ${conditions.join(" AND ")}
          ORDER BY t.created_at DESC
          LIMIT 200`,
        tplParams
      );
      for (const r of rows) {
        results.push({
          itemType: "note_template", id: r.id, title: r.name, snippet: (r.description || "").slice(0, 200),
          status: r.status, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        });
      }
    }

    return { success: true, results };
  } catch (error: any) {
    console.error("searchAllItemsAction error:", error);
    return { success: false, results: [], error: error.message };
  }
}

/**
 * Items stuck in draft/review longer than maxDays. There's no formal task/due-date system for
 * questions (that lives in the separate pipeline spec) — "time since last touched" is the
 * practical proxy for "past due" until that exists.
 */
export async function findStalledInPipelineAction(params: {
  status: "draft" | "review";
  maxDays: number;
}): Promise<{ success: boolean; rows: (QuestionRow & { daysStalled: number })[]; error?: string }> {
  try {
    const rows = await query<any>(
      `SELECT id, uqid, stem, exam_type_code AS "examType", created_at AS "createdAt",
              EXTRACT(DAY FROM NOW() - updated_at)::int AS "daysStalled"
         FROM questions
        WHERE deleted_at IS NULL AND status = $1 AND updated_at < NOW() - ($2 || ' days')::interval
        ORDER BY updated_at ASC`,
      [params.status, params.maxDays]
    );
    return { success: true, rows };
  } catch (error: any) {
    console.error("findStalledInPipelineAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

/**
 * Self-review leakage — the same admin both authored and reviewed/signed off an item.
 * Most useful once distinct reviewer roles/accounts are in real use.
 */
export async function findSelfReviewedItemsAction(): Promise<{ success: boolean; rows: (QuestionRow & { authorName: string | null })[]; error?: string }> {
  try {
    const rows = await query<any>(
      `SELECT q.id, q.uqid, q.stem, au.name AS "authorName"
         FROM questions q
         LEFT JOIN admin_users au ON au.id = q.created_by
        WHERE q.deleted_at IS NULL
          AND q.created_by IS NOT NULL
          AND (q.created_by = q.reviewed_by OR q.created_by = q.signed_off_by)
        ORDER BY q.updated_at DESC`
    );
    return { success: true, rows };
  } catch (error: any) {
    console.error("findSelfReviewedItemsAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

/** Completed review but no sign-off — blocking publish. */
export async function findReviewedNotSignedOffAction(): Promise<{ success: boolean; rows: (QuestionRow & { dateLastReviewed: string })[]; error?: string }> {
  try {
    const rows = await query<any>(
      `SELECT id, uqid, stem, status, date_last_reviewed AS "dateLastReviewed"
         FROM questions
        WHERE deleted_at IS NULL AND date_last_reviewed IS NOT NULL AND signed_off_by IS NULL AND status != 'published'
        ORDER BY date_last_reviewed ASC`
    );
    return { success: true, rows: rows.map((r) => ({ ...r, dateLastReviewed: new Date(r.dateLastReviewed).toISOString() })) };
  } catch (error: any) {
    console.error("findReviewedNotSignedOffAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

/** Per-topic growth trend — items created in the last 30 days vs. the 30 days before that. */
export async function getTopicGrowthTrendAction(): Promise<{
  success: boolean;
  rows: { topicCode: string; homeUnit: string | null; last30: number; prior30: number; trend: "growing" | "slowing" | "flat" | "stalled" }[];
  error?: string;
}> {
  try {
    const rows = await query<any>(
      `SELECT topic_code AS "topicCode", home_unit AS "homeUnit",
              COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS "last30",
              COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days')::int AS "prior30"
         FROM questions
        WHERE deleted_at IS NULL AND topic_code IS NOT NULL
        GROUP BY topic_code, home_unit
        ORDER BY "last30" DESC`
    );
    const withTrend = rows.map((r: any) => ({
      ...r,
      trend: (r.last30 === 0 && r.prior30 === 0 ? "stalled" : r.last30 > r.prior30 ? "growing" : r.last30 < r.prior30 ? "slowing" : "flat") as any,
    }));
    return { success: true, rows: withTrend };
  } catch (error: any) {
    console.error("getTopicGrowthTrendAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

/**
 * Items citing a source that are also overdue for review — the practical proxy for "source
 * doc/edition now stale," since `sourceRefs[].edition` is free text (e.g. "March 2025") and
 * not reliably parseable as a real date to diff against.
 */
export async function findStaleSourcedItemsAction(): Promise<{
  success: boolean;
  rows: (QuestionRow & { volatilityTier: string | null; sourceRefs: any[]; reviewDueBy: string })[];
  error?: string;
}> {
  try {
    const rows = await query<any>(
      `SELECT * FROM (
         SELECT q.id, q.uqid, q.stem, q.volatility_tier AS "volatilityTier", q.source_refs AS "sourceRefs",
                (COALESCE(q.date_last_reviewed, q.created_at) + (
                  CASE q.volatility_tier
                    WHEN 'Volatile' THEN INTERVAL '6 months'
                    WHEN 'Standard' THEN INTERVAL '12 months'
                    WHEN 'Stable' THEN INTERVAL '24 months'
                    ELSE INTERVAL '12 months'
                  END
                )) AS "reviewDueBy"
           FROM questions q
          WHERE q.deleted_at IS NULL AND q.status = 'published'
            AND jsonb_array_length(COALESCE(q.source_refs, '[]'::jsonb)) > 0
       ) sub
       WHERE "reviewDueBy" < NOW()
       ORDER BY "reviewDueBy" ASC`
    );
    return { success: true, rows: rows.map((r: any) => ({ ...r, reviewDueBy: new Date(r.reviewDueBy).toISOString() })) };
  } catch (error: any) {
    console.error("findStaleSourcedItemsAction error:", error);
    return { success: false, rows: [], error: error.message };
  }
}

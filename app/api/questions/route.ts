import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * GET /api/questions
 * Returns all non-deleted questions with 3-zone fields, options, tags,
 * and version history from Neon.
 * Supports ?uqid=AKT-000142 for direct lookup and ?includeArchived=true.
 */
export async function GET(req: NextRequest) {
  // ── DB fetch ──────────────────────────────────────────────────────────────
  try {
    const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "true";
    const uqidFilter = req.nextUrl.searchParams.get("uqid");
    const searchParam = req.nextUrl.searchParams.get("search");

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    if (!includeArchived) conditions.push("q.deleted_at IS NULL");
    if (uqidFilter) {
      params.push(uqidFilter.toUpperCase());
      conditions.push(`q.uqid = $${params.length}`);
    }
    if (searchParam) {
      params.push(`%${searchParam}%`);
      const p = params.length;
      conditions.push(`(
        q.stem ILIKE $${p}
        OR q.lead_in ILIKE $${p}
        OR q.uqid ILIKE $${p}
        OR q.id::text ILIKE $${p}
        OR q.knowledge_bank ILIKE $${p}
        OR q.pearl ILIKE $${p}
        OR q.why_correct ILIKE $${p}
        OR q.rationale ILIKE $${p}
        OR s.name ILIKE $${p}
        OR EXISTS (
          SELECT 1 FROM question_tags qt
          JOIN tags t ON t.id = qt.tag_id
          WHERE qt.question_id = q.id AND t.label ILIKE $${p}
        )
      )`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Questions — all 3-zone fields
    const rows = await query<any>(
      `SELECT
         q.id,
         q.uqid,
         q.stem,
         q.lead_in               AS "leadIn",
         q.stem                  AS text,
         q.rationale,
         q.why_correct           AS "whyCorrect",
         q.knowledge_bank        AS "knowledgeBank",
         q.pearl,
         q.difficulty,
         q.status,
         q.deleted_at,
         q.exam_type_code        AS "examType",
         q.kfp_correct_count     AS "kfpCorrectCount",
         q.version,
         q.parent_id             AS "parentId",
         q.batch_id              AS "batchId",
         s.name                  AS topic,
         f.object_key            AS image_object_key,
         q.created_at,
         q.updated_at
       FROM questions q
       LEFT JOIN subjects  s ON s.id = q.subject_id
       LEFT JOIN files     f ON f.id = q.image_file_id
       ${whereClause}
       ORDER BY q.created_at DESC`
      , params
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const questionIds = rows.map((r: any) => r.id);

    // Options per question (with distractor rationale)
    const optRows = await query<any>(
      `SELECT question_id, label, position, is_correct, distractor_rationale
         FROM question_options
        WHERE question_id = ANY($1::uuid[])
        ORDER BY question_id, position ASC`,
      [questionIds]
    );

    // Tags per question
    const tagRows = await query<any>(
      `SELECT qt.question_id, t.label
         FROM question_tags qt
         JOIN tags t ON t.id = qt.tag_id
        WHERE qt.question_id = ANY($1::uuid[])`,
      [questionIds]
    );

    // Version history — sourced from audit_log (already stored per question via recordAuditLog)
    // No separate versions table needed.

    const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

    // Build maps
    const optMap = new Map<string, any[]>();
    for (const o of optRows) {
      if (!optMap.has(o.question_id)) optMap.set(o.question_id, []);
      optMap.get(o.question_id)!.push(o);
    }

    const tagMap = new Map<string, string[]>();
    for (const t of tagRows) {
      if (!tagMap.has(t.question_id)) tagMap.set(t.question_id, []);
      tagMap.get(t.question_id)!.push(t.label);
    }


    const questions = rows.map((q: any, idx: number) => {
      const opts = (optMap.get(q.id) ?? []).sort((a: any, b: any) => a.position - b.position);
      const correctIndices = opts
        .map((o: any, i: number) => (o.is_correct ? i : -1))
        .filter((i: number) => i >= 0);
      const correctIndex = correctIndices[0] ?? 0;
      const examType = (q.examType ?? "AKT") as "AKT" | "KFT" | "KFP";
      const isKft = examType === "KFT" || examType === "KFP";
      const kfpCorrectCount: number | undefined =
        isKft
          ? (q.kfpCorrectCount != null ? Number(q.kfpCorrectCount) : correctIndices.length || 1)
          : undefined;

      const isDeleted = q.deleted_at !== null && q.deleted_at !== undefined;
      const status = isDeleted ? "archived" : (q.status === "archived" ? "published" : q.status || "published");

      // Per-option distractor rationales (parallel array to options[])
      const distractorRationales = opts.map((o: any) => o.distractor_rationale ?? "");

      // Combine stem + leadIn as text for backward compat
      const stem = q.stem ?? "";
      const leadIn = q.leadIn ?? "";
      const text = leadIn ? `${stem}\n\n${leadIn}`.trim() : stem;

      return {
        id: idx + 2855,
        dbId: q.id,
        uqid: q.uqid ?? undefined,
        // Zone 1
        stem,
        leadIn,
        text,
        image: q.image_object_key ? `${publicBase}/${q.image_object_key}` : undefined,
        // Zone 2
        options: opts.map((o: any) => o.label),
        correctIndex,
        correctIndices: correctIndices.length > 0 ? correctIndices : [correctIndex],
        kftCorrectCount: isKft ? kfpCorrectCount : undefined,
        kfpCorrectCount,
        whyCorrect: q.whyCorrect ?? undefined,
        rationale: q.rationale ?? q.whyCorrect ?? "",
        // Zone 3
        distractorRationales: distractorRationales.some((d: string) => d) ? distractorRationales : undefined,
        knowledgeBank: q.knowledgeBank ?? undefined,
        pearl: q.pearl ?? undefined,
        // Classification
        topic: q.topic ?? "General",
        difficulty: capitalize(q.difficulty) as "Easy" | "Medium" | "Hard",
        examType,
        status: status as any,
        tags: tagMap.get(q.id) ?? ["General"],
        // Identity
        version: q.version ?? 1,
        parentId: q.parentId ?? undefined,
        batchId: q.batchId ?? undefined,
      };
    });

    return NextResponse.json({ success: true, data: questions });
  } catch (err: any) {
    console.error("GET /api/questions error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function capitalize(s: string | null | undefined): string {
  if (!s) return "Medium";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

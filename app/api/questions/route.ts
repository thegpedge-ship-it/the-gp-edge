import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { getUserAccess } from "@/lib/access";
import prisma from "@/lib/prisma";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * GET /api/questions
 * Returns all non-deleted questions with their options and tags from Neon.
 * Requires an authenticated user.
 */
export async function GET(_req: NextRequest) {
  // ── Access control: Authenticated users ──────────────────────────────────
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
  } catch (accessErr) {
    console.error("[GET /api/questions] access check error:", accessErr);
    return NextResponse.json({ success: false, error: "Access check failed." }, { status: 403 });
  }

  // ── DB fetch (only reached if access check passes) ───────────────────────────
  try {
    // Questions
    const rows = await query<any>(
      `SELECT
         q.id,
         q.stem              AS text,
         q.rationale,
         q.difficulty,
         q.status,
         q.exam_type_code    AS "examType",
         s.name              AS topic,
         f.object_key        AS image_object_key,
         q.created_at,
         q.updated_at
       FROM questions q
       LEFT JOIN subjects  s ON s.id = q.subject_id
       LEFT JOIN files     f ON f.id = q.image_file_id
       WHERE q.deleted_at IS NULL
       ORDER BY q.created_at DESC`
    );

    // Options per question
    const optRows = await query<any>(
      `SELECT question_id, label, position, is_correct
         FROM question_options
        ORDER BY question_id, position ASC`
    );

    // Tags per question
    const tagRows = await query<any>(
      `SELECT qt.question_id, t.label
         FROM question_tags qt
         JOIN tags t ON t.id = qt.tag_id`
    );

    const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

    const optMap = new Map<string, { label: string; position: number; is_correct: boolean }[]>();
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
      const opts = (optMap.get(q.id) ?? []).sort((a, b) => a.position - b.position);
      const correctIndex = opts.findIndex((o) => o.is_correct);
      return {
        // Use a stable numeric id for legacy compatibility
        id: idx + 2855,
        dbId: q.id,
        text: q.text,
        options: opts.map((o) => o.label),
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        rationale: q.rationale ?? "",
        topic: q.topic ?? "General",
        difficulty: capitalize(q.difficulty) as "Easy" | "Medium" | "Hard",
        examType: (q.examType ?? "AKT") as "AKT" | "KFP",
        status: q.status as "draft" | "review" | "published",
        tags: tagMap.get(q.id) ?? ["General"],
        image: q.image_object_key ? `${publicBase}/${q.image_object_key}` : undefined,
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

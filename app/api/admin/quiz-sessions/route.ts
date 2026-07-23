import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type QuizSessionRow = {
  id: string;
  quiz_name: string | null;
  user_label: string;
  status: "in_progress" | "abandoned" | "expired";
  started_at: string;
  last_seen_at: string | null;
  submitted_at: string | null;
  total_questions: number;
  answered_count: number;
  is_stuck: boolean;
};

export async function GET(_req: NextRequest) {
  try {
    const rows = await query<QuizSessionRow>(`
      WITH answered AS (
        SELECT
          aq.attempt_id,
          COUNT(*) FILTER (WHERE aa.is_correct IS NOT NULL) AS answered_count
        FROM attempt_questions aq
        LEFT JOIN attempt_answers aa ON aa.attempt_question_id = aq.id
        GROUP BY aq.attempt_id
      )
      SELECT
        ta.id,
        mt.name AS quiz_name,
        COALESCE(
          NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''),
          u.email,
          'Account #' || RIGHT(ta.id::text, 4)
        ) AS user_label,
        ta.status,
        ta.started_at,
        ta.last_seen_at,
        ta.submitted_at,
        COALESCE(ta.total_questions, mt.question_count, 0) AS total_questions,
        COALESCE(ans.answered_count, 0) AS answered_count,
        CASE
          WHEN ta.status = 'in_progress'
           AND COALESCE(ta.last_seen_at, ta.started_at) < NOW() - INTERVAL '20 minutes'
          THEN true
          ELSE false
        END AS is_stuck
      FROM test_attempts ta
      LEFT JOIN mock_tests mt ON mt.id = ta.mock_test_id
      LEFT JOIN users u ON u.id = ta.user_id
      LEFT JOIN answered ans ON ans.attempt_id = ta.id
      WHERE ta.source = 'mock_test'
        AND (
          ta.status IN ('abandoned', 'expired')
          OR (
            ta.status = 'in_progress'
            AND COALESCE(ta.last_seen_at, ta.started_at) < NOW() - INTERVAL '20 minutes'
          )
        )
      ORDER BY COALESCE(ta.last_seen_at, ta.started_at) DESC
      LIMIT 12
    `);

    return NextResponse.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        user: row.user_label,
        quiz: row.quiz_name || "Untitled Mock Exam",
        startedAt: row.started_at,
        lastSeenAt: row.last_seen_at,
        submittedAt: row.submitted_at,
        totalQuestions: row.total_questions,
        answeredCount: row.answered_count,
        status: row.status,
        isStuck: row.is_stuck,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/admin/quiz-sessions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
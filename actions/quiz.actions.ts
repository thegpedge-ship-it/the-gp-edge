"use server";

import { query, queryOne, execute } from "@/lib/db";
import { importQuestionsAction } from "./question.actions";
import { revalidatePath } from "next/cache";

export interface SyncQuizInput {
  name: string;
  description?: string;
  timeLimit: number;
  passingScore: number;
  randomize: boolean;
  status: "draft" | "active" | "archived";
  examType: "AKT" | "KFP";
  questionLimit?: number;
}

/**
 * Synchronizes a mock exam configuration and its question associations to the database.
 * Saves to both the `quizzes` and `mock_tests` tables.
 */
export async function syncQuizToDbAction(
  quiz: SyncQuizInput,
  questionsList: any[],
  createdBy?: string
) {
  try {
    const statusMap: Record<string, string> = {
      draft: "active",
      active: "active",
      archived: "archived",
    };
    const dbStatus = statusMap[quiz.status] || "active";
    const examTypeCode = quiz.examType || "AKT";
    const qCount = questionsList.length;

    // Sync questions first
    if (qCount > 0) {
      await importQuestionsAction(questionsList);
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const creatorId = createdBy && uuidRegex.test(createdBy) ? createdBy : null;

    // ── quizzes table ──────────────────────────────────────────────
    let dbQuiz = await queryOne<{ id: string }>(
      `SELECT id FROM quizzes WHERE name = $1 LIMIT 1`,
      [quiz.name]
    );

    if (dbQuiz) {
      await execute(
        `UPDATE quizzes
           SET description = $1, time_limit_min = $2, passing_score = $3,
               randomize = $4, status = $5, exam_type_code = $6,
               created_by = $7, question_limit = $8, updated_at = NOW()
         WHERE id = $9`,
        [
          quiz.description || "",
          quiz.timeLimit,
          quiz.passingScore,
          quiz.randomize,
          dbStatus,
          examTypeCode,
          creatorId,
          quiz.questionLimit ?? 50,
          dbQuiz.id,
        ]
      );
      await execute(`DELETE FROM quiz_questions WHERE quiz_id = $1`, [dbQuiz.id]);
    } else {
      dbQuiz = await queryOne<{ id: string }>(
        `INSERT INTO quizzes
           (name, description, time_limit_min, passing_score, randomize,
            status, exam_type_code, created_by, question_limit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          quiz.name,
          quiz.description || "",
          quiz.timeLimit,
          quiz.passingScore,
          quiz.randomize,
          dbStatus,
          examTypeCode,
          creatorId,
          quiz.questionLimit ?? 50,
        ]
      );
    }

    // Rebuild quiz_questions
    for (let i = 0; i < questionsList.length; i++) {
      const q = questionsList[i];
      if (!q?.text) continue;
      const question = await queryOne<{ id: string }>(
        `SELECT id FROM questions WHERE stem = $1 LIMIT 1`,
        [q.text.trim()]
      );
      if (question) {
        await execute(
          `INSERT INTO quiz_questions (quiz_id, question_id, position)
           VALUES ($1, $2, $3)
           ON CONFLICT (quiz_id, question_id) DO NOTHING`,
          [dbQuiz!.id, question.id, i]
        );
      }
    }

    // ── mock_tests table ───────────────────────────────────────────
    let dbMockId: string | null = null;

    if (qCount > 0) {
      const availabilityVal = "available";

      let dbMock = await queryOne<{ id: string }>(
        `SELECT id FROM mock_tests WHERE name = $1 LIMIT 1`,
        [quiz.name]
      );

      if (dbMock) {
        await execute(
          `UPDATE mock_tests
             SET subtitle = $1, exam_type_code = $2, question_count = $3,
                 duration_min = $4, availability = $5, created_by = $6, updated_at = NOW()
           WHERE id = $7`,
          [
            quiz.description || "",
            examTypeCode,
            qCount,
            quiz.timeLimit || 60,
            availabilityVal,
            creatorId,
            dbMock.id,
          ]
        );
        await execute(`DELETE FROM mock_test_questions WHERE mock_test_id = $1`, [dbMock.id]);
      } else {
        dbMock = await queryOne<{ id: string }>(
          `INSERT INTO mock_tests
             (name, subtitle, exam_type_code, question_count, duration_min,
              availability, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            quiz.name,
            quiz.description || "",
            examTypeCode,
            qCount,
            quiz.timeLimit || 60,
            availabilityVal,
            creatorId,
          ]
        );
      }

      dbMockId = dbMock!.id;

      for (let i = 0; i < questionsList.length; i++) {
        const q = questionsList[i];
        if (!q?.text) continue;
        const question = await queryOne<{ id: string }>(
          `SELECT id FROM questions WHERE stem = $1 LIMIT 1`,
          [q.text.trim()]
        );
        if (question) {
          await execute(
            `INSERT INTO mock_test_questions (mock_test_id, question_id, position)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [dbMockId, question.id, i]
          );
        }
      }
    } else {
      // Remove from mock_tests if quiz now has 0 questions
      const existingMock = await queryOne<{ id: string }>(
        `SELECT id FROM mock_tests WHERE name = $1 LIMIT 1`,
        [quiz.name]
      );
      if (existingMock) {
        await execute(`DELETE FROM mock_tests WHERE id = $1`, [existingMock.id]);
      }
    }

    revalidatePath("/exam-prep");
    revalidatePath("/dashboard");

    return { success: true, dbId: dbQuiz!.id, dbMockId };
  } catch (error: any) {
    console.error("Failed to sync quiz to database:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches all quizzes from the Neon database and maps them to the
 * local Quiz interface shape used by the admin UI.
 */
export async function fetchQuizzesFromDbAction(): Promise<
  {
    id: number;
    dbId: string;
    name: string;
    description: string;
    topics: string[];
    questionIds: number[];
    questionCount: number;
    timeLimit: number;
    passingScore: number;
    attempts: number;
    avgScore: number;
    status: "active" | "draft" | "suspended";
    examType: "AKT" | "KFP" | "Mixed";
    randomize: boolean;
    questionLimit: number;
    updatedAt: string;
  }[]
> {
  try {
    // Self-heal: synchronize any mock_tests that do not have matching quiz entries
    const orphanedMocks = await query<{
      id: string;
      name: string;
      subtitle: string | null;
      duration_min: number | null;
      exam_type_code: string | null;
    }>(
      `SELECT id, name, subtitle, duration_min, exam_type_code
         FROM mock_tests
        WHERE deleted_at IS NULL
          AND id NOT IN (SELECT id FROM quizzes)
          AND name NOT IN (SELECT name FROM quizzes)`
    );

    for (const m of orphanedMocks) {
      await execute(
        `INSERT INTO quizzes (id, name, description, time_limit_min, passing_score, randomize, status, exam_type_code)
         VALUES ($1, $2, $3, $4, 65, true, 'active', $5)
         ON CONFLICT (id) DO NOTHING`,
        [m.id, m.name, m.subtitle || "", m.duration_min || 60, m.exam_type_code || "AKT"]
      );

      const mockQuestions = await query<{ question_id: string; position: number }>(
        `SELECT question_id, position FROM mock_test_questions WHERE mock_test_id = $1`,
        [m.id]
      );
      for (const mq of mockQuestions) {
        await execute(
          `INSERT INTO quiz_questions (quiz_id, question_id, position)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [m.id, mq.question_id, mq.position]
        );
      }
    }

    const rows = await query<{
      id: string;
      name: string;
      description: string | null;
      exam_type_code: string | null;
      time_limit_min: number | null;
      passing_score: number | null;
      randomize: boolean;
      status: string;
      updated_at: Date;
      question_count: number;
      attempts_count: number;
      avg_score: number;
      topics: string[] | null;
    }>(
      `SELECT q.id, q.name, q.description, q.exam_type_code, q.time_limit_min,
              q.passing_score, q.randomize, q.status, q.updated_at,
              (SELECT COUNT(*)::int FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count,
              (
                SELECT COUNT(*)::int 
                  FROM test_attempts ta 
                 WHERE ta.quiz_id = q.id 
                    OR ta.mock_test_id = (SELECT mt.id FROM mock_tests mt WHERE mt.name = q.name LIMIT 1)
              ) AS attempts_count,
              (
                SELECT ROUND(COALESCE(AVG(ta.score_percent), 0))::int 
                  FROM test_attempts ta 
                 WHERE (ta.quiz_id = q.id OR ta.mock_test_id = (SELECT mt.id FROM mock_tests mt WHERE mt.name = q.name LIMIT 1))
                   AND ta.status = 'completed'
              ) AS avg_score,
              (SELECT ARRAY_AGG(DISTINCT s.name) FROM quiz_questions qq JOIN questions qst ON qst.id = qq.question_id JOIN subjects s ON s.id = qst.subject_id WHERE qq.quiz_id = q.id) AS topics
         FROM quizzes q
        WHERE q.deleted_at IS NULL
        ORDER BY q.updated_at DESC`
    );

    return rows.map((q, idx) => ({
      id: idx + 1,
      dbId: q.id,
      name: q.name,
      description: q.description ?? "",
      topics: q.topics?.filter(Boolean) ?? ["General"],
      questionIds: [],
      questionCount: q.question_count ?? 0,
      timeLimit: q.time_limit_min ?? 60,
      passingScore: q.passing_score ?? 65,
      attempts: q.attempts_count ?? 0,
      avgScore: q.avg_score ?? 0,
      status: (q.status === "active" ? "active" : q.status === "draft" ? "draft" : "suspended") as any,
      examType: (q.exam_type_code ?? "AKT") as any,
      randomize: q.randomize,
      questionLimit: 50,
      updatedAt: q.updated_at?.toISOString() ?? new Date().toISOString(),
    }));
  } catch (error: any) {
    console.error("fetchQuizzesFromDbAction error:", error);
    return [];
  }
}

/**
 * Deletes a quiz from both quizzes and mock_tests tables.
 */
export async function deleteQuizFromDbAction(quizName: string) {
  try {
    const quiz = await queryOne<{ id: string }>(`SELECT id FROM quizzes WHERE name = $1 LIMIT 1`, [quizName]);
    const mock = await queryOne<{ id: string }>(`SELECT id FROM mock_tests WHERE name = $1 LIMIT 1`, [quizName]);

    if (quiz) {
      await execute(`DELETE FROM test_attempts WHERE quiz_id = $1`, [quiz.id]);
      await execute(`DELETE FROM quizzes WHERE id = $1`, [quiz.id]);
    }
    if (mock) {
      await execute(`DELETE FROM test_attempts WHERE mock_test_id = $1`, [mock.id]);
      await execute(`DELETE FROM mock_tests WHERE id = $1`, [mock.id]);
    }

    revalidatePath("/exam-prep");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete quiz from database:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches a single quiz by its DB UUID along with its question DB UUIDs for the edit page.
 */
export async function fetchQuizByDbIdAction(dbId: string): Promise<{
  name: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  randomize: boolean;
  status: string;
  examType: string;
  questionLimit: number;
  questionDbIds: string[];
} | null> {
  try {
    const quiz = await queryOne<{
      name: string;
      description: string | null;
      time_limit_min: number | null;
      passing_score: number | null;
      randomize: boolean;
      status: string;
      exam_type_code: string | null;
    }>(
      `SELECT name, description, time_limit_min, passing_score,
              randomize, status, exam_type_code
         FROM quizzes WHERE id = $1 AND deleted_at IS NULL`,
      [dbId]
    );
    if (!quiz) return null;

    const qqs = await query<{ question_id: string }>(
      `SELECT question_id FROM quiz_questions WHERE quiz_id = $1 ORDER BY position ASC`,
      [dbId]
    );

    return {
      name: quiz.name,
      description: quiz.description ?? "",
      timeLimit: quiz.time_limit_min ?? 60,
      passingScore: quiz.passing_score ?? 65,
      randomize: quiz.randomize,
      status: quiz.status,
      examType: quiz.exam_type_code ?? "AKT",
      questionLimit: 50,
      questionDbIds: qqs.map((q) => q.question_id),
    };
  } catch (error: any) {
    console.error("fetchQuizByDbIdAction error:", error);
    return null;
  }
}

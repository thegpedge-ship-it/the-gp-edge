"use server";

import { query, queryOne, execute } from "@/lib/db";
import { importQuestionsAction } from "./question.actions";

export interface SyncQuizInput {
  name: string;
  description?: string;
  timeLimit: number;
  passingScore: number;
  randomize: boolean;
  status: "draft" | "active" | "archived";
  examType: "AKT" | "KFP";
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
               created_by = $7, updated_at = NOW()
         WHERE id = $8`,
        [
          quiz.description || "",
          quiz.timeLimit,
          quiz.passingScore,
          quiz.randomize,
          dbStatus,
          examTypeCode,
          creatorId,
          dbQuiz.id,
        ]
      );
      await execute(`DELETE FROM quiz_questions WHERE quiz_id = $1`, [dbQuiz.id]);
    } else {
      dbQuiz = await queryOne<{ id: string }>(
        `INSERT INTO quizzes
           (name, description, time_limit_min, passing_score, randomize,
            status, exam_type_code, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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

    return { success: true, dbId: dbQuiz!.id, dbMockId };
  } catch (error: any) {
    console.error("Failed to sync quiz to database:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a quiz from both quizzes and mock_tests tables.
 */
export async function deleteQuizFromDbAction(quizName: string) {
  try {
    await execute(`DELETE FROM quizzes WHERE name = $1`, [quizName]);
    await execute(`DELETE FROM mock_tests WHERE name = $1`, [quizName]);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete quiz from database:", error);
    return { success: false, error: error.message };
  }
}

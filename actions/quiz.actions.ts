"use server";

import { query, queryOne, execute } from "@/lib/db";
import { importQuestionsAction } from "./question.actions";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { DEFAULT_QUIZZES } from "@/lib/quizData";
import { evaluateRelationalPermission, recordAuditLog, PermissionUser } from "@/lib/relationalPermissions";


export interface SyncQuizInput {
  name: string;
  description?: string;
  timeLimit: number;
  passingScore: number;
  randomize: boolean;
  isFree?: boolean;
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
  createdBy?: string,
  adminUser?: PermissionUser
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
      await importQuestionsAction(questionsList, adminUser);
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const creatorId = createdBy && uuidRegex.test(createdBy) ? createdBy : null;

    // ── quizzes table ──────────────────────────────────────────────
    let dbQuiz = await queryOne<{ id: string }>(
      `SELECT id FROM quizzes WHERE name = $1 LIMIT 1`,
      [quiz.name]
    );

    if (adminUser) {
      const permCheck = await evaluateRelationalPermission({
        user: adminUser,
        capability: quiz.status === "active" ? "publish" : dbQuiz ? "edit" : "create",
        item: dbQuiz ? { id: dbQuiz.id, type: "quiz" } : undefined,
      });
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }
    }

    if (dbQuiz) {
      await execute(
        `UPDATE quizzes
           SET description = $1, time_limit_min = $2, passing_score = $3,
               randomize = $4, status = $5, exam_type_code = $6,
               created_by = $7, question_limit = $8, is_free = $9, updated_at = NOW()
         WHERE id = $10`,
        [
          quiz.description || "",
          quiz.timeLimit,
          quiz.passingScore,
          quiz.randomize,
          dbStatus,
          examTypeCode,
          creatorId,
          quiz.questionLimit ?? 50,
          quiz.isFree ?? false,
          dbQuiz.id,
        ]
      );
      await execute(`DELETE FROM quiz_questions WHERE quiz_id = $1`, [dbQuiz.id]);
    } else {
      dbQuiz = await queryOne<{ id: string }>(
        `INSERT INTO quizzes
           (name, description, time_limit_min, passing_score, randomize,
            status, exam_type_code, created_by, question_limit, is_free)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
          quiz.isFree ?? false,
        ]
      );
    }

    await recordAuditLog({
      adminUserId: adminUser?.id || creatorId,
      action: dbQuiz ? "update" : "create",
      category: "quiz",
      entityType: "quiz",
      entityId: dbQuiz!.id,
      metadata: { name: quiz.name, status: dbStatus },
    });


    // Pre-fetch all matching questions in a single query
    const questionMap = new Map<string, string>(); // stem -> id
    const stems = questionsList.map(q => q.text?.trim()).filter(Boolean);
    if (stems.length > 0) {
      const matchingQuestions = await query<{ id: string; stem: string }>(
        `SELECT id, stem FROM questions WHERE stem = ANY($1::text[])`,
        [stems]
      );
      matchingQuestions.forEach(q => questionMap.set(q.stem.trim().toLowerCase(), q.id));
    }

    // Rebuild quiz_questions
    for (let i = 0; i < questionsList.length; i++) {
      const q = questionsList[i];
      if (!q?.text) continue;
      const questionId = questionMap.get(q.text.trim().toLowerCase());
      if (questionId) {
        await execute(
          `INSERT INTO quiz_questions (quiz_id, question_id, position)
           VALUES ($1, $2, $3)
           ON CONFLICT (quiz_id, question_id) DO NOTHING`,
          [dbQuiz!.id, questionId, i]
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
                 duration_min = $4, availability = $5, created_by = $6,
                 is_free = $7, updated_at = NOW()
           WHERE id = $8`,
          [
            quiz.description || "",
            examTypeCode,
            qCount,
            quiz.timeLimit || 60,
            availabilityVal,
            creatorId,
            quiz.isFree ?? false,
            dbMock.id,
          ]
        );
        await execute(`DELETE FROM mock_test_questions WHERE mock_test_id = $1`, [dbMock.id]);
      } else {
        dbMock = await queryOne<{ id: string }>(
          `INSERT INTO mock_tests
             (name, subtitle, exam_type_code, question_count, duration_min,
              availability, created_by, is_free)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            quiz.name,
            quiz.description || "",
            examTypeCode,
            qCount,
            quiz.timeLimit || 60,
            availabilityVal,
            creatorId,
            quiz.isFree ?? false,
          ]
        );
      }

      dbMockId = dbMock!.id;

      for (let i = 0; i < questionsList.length; i++) {
        const q = questionsList[i];
        if (!q?.text) continue;
        const questionId = questionMap.get(q.text.trim().toLowerCase());
        if (questionId) {
          await execute(
            `INSERT INTO mock_test_questions (mock_test_id, question_id, position)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [dbMockId, questionId, i]
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
        await execute(`UPDATE mock_tests SET deleted_at = NOW() WHERE id = $1`, [existingMock.id]);
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
 * Fetches all quizzes from the Neon database via Prisma first.
 * Falls back to DEFAULT_QUIZZES inside catch block only.
 */
export async function fetchQuizzesFromDbAction(includeArchived: boolean = false): Promise<
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
    status: "active" | "draft" | "suspended" | "archived";
    examType: "AKT" | "KFP" | "Mixed";
    randomize: boolean;
    isFree: boolean;
    questionLimit: number;
    updatedAt: string;
  }[]
> {
  try {
    const dbQuizzes = await prisma.quizzes.findMany({
      where: includeArchived ? {} : { deleted_at: null },
      orderBy: [{ is_free: "desc" }, { updated_at: "desc" }],
      include: {
        quiz_questions: {
          orderBy: { position: "asc" },
          include: { questions: { include: { subjects: { select: { name: true } } } } },
        },
        test_attempts: { select: { id: true, status: true, score_percent: true } },
      },
    });

    if (dbQuizzes && dbQuizzes.length > 0) {
      return dbQuizzes.map((q: any, idx: number) => {
        const topics = Array.from(
          new Set(
            q.quiz_questions
              .map((qq: any) => qq.questions?.subjects?.name)
              .filter(Boolean) as string[]
          )
        );

        const completedAttempts = q.test_attempts.filter((ta: any) => ta.status === "completed" || ta.score_percent !== null);
        const totalScore = completedAttempts.reduce((acc: number, curr: any) => acc + Number(curr.score_percent || 0), 0);
        const avgScore = completedAttempts.length > 0 ? Math.round(totalScore / completedAttempts.length) : 0;

        const isDeleted = q.deleted_at !== null && q.deleted_at !== undefined;
        const status = isDeleted ? "archived" : (q.status === "archived" ? "active" : q.status === "active" ? "active" : q.status === "draft" ? "draft" : "suspended");

        return {
          id: idx + 1,
          dbId: q.id,
          name: q.name,
          description: q.description ?? "",
          topics: topics.length > 0 ? topics : ["General"],
          questionIds: [],
          questionCount: q.quiz_questions.length,
          timeLimit: q.time_limit_min ?? 60,
          passingScore: q.passing_score ?? 65,
          attempts: q.test_attempts.length,
          avgScore,
          status: status as any,
          examType: (q.exam_type_code ?? "AKT") as any,
          randomize: q.randomize,
          isFree: q.is_free,
          questionLimit: q.question_limit ?? 50,
          updatedAt: q.updated_at ? q.updated_at.toISOString() : new Date().toISOString(),
        };
      });
    }
  } catch (error: any) {
    console.error("fetchQuizzesFromDbAction error, falling back to backup data:", error);
  }
  return DEFAULT_QUIZZES as any;
}

/**
 * Deletes a quiz from both quizzes and mock_tests tables.
 */
export async function deleteQuizFromDbAction(quizName: string, adminUser?: PermissionUser) {
  try {
    const quiz = await queryOne<{ id: string }>(`SELECT id FROM quizzes WHERE name = $1 AND deleted_at IS NULL LIMIT 1`, [quizName]);
    const mock = await queryOne<{ id: string }>(`SELECT id FROM mock_tests WHERE name = $1 AND deleted_at IS NULL LIMIT 1`, [quizName]);

    if (adminUser) {
      const permCheck = await evaluateRelationalPermission({
        user: adminUser,
        capability: "archive_item",
        item: { id: quiz?.id || mock?.id || quizName, type: "quiz" },
      });
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }
    }

    if (quiz) {
      await execute(`UPDATE quizzes SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [quiz.id]);
    }
    if (mock) {
      await execute(`UPDATE mock_tests SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [mock.id]);
    }

    if (adminUser) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "archive",
        category: "quiz",
        entityType: "quiz",
        entityId: quiz?.id || mock?.id || quizName,
        metadata: { name: quizName, archivedBy: adminUser.name },
      });
    }

    revalidatePath("/exam-prep");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to archive quiz in database:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Restores an archived quiz from the database.
 * SA-ONLY (Super Admin)!
 */
export async function restoreQuizInDbAction(quizName: string, adminUser: PermissionUser) {
  try {
    const permCheck = await evaluateRelationalPermission({
      user: adminUser,
      capability: "restore_item",
      item: { id: quizName, type: "quiz" },
    });

    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason };
    }

    await execute(`UPDATE quizzes SET deleted_at = NULL, updated_at = NOW() WHERE name = $1`, [quizName]);
    await execute(`UPDATE mock_tests SET deleted_at = NULL, updated_at = NOW() WHERE name = $1`, [quizName]);

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "restore",
      category: "quiz",
      entityType: "quiz",
      entityId: quizName,
      metadata: { name: quizName, restoredBy: adminUser.name },
    });

    revalidatePath("/exam-prep");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to restore quiz in database:", error);
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
  isFree: boolean;
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
      is_free: boolean;
      status: string;
      exam_type_code: string | null;
    }>(
      `SELECT name, description, time_limit_min, passing_score,
              randomize, is_free, status, exam_type_code
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
      isFree: quiz.is_free ?? false,
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

/**
 * Light, dedicated mutation Server Action to toggle the is_free status of a Quiz in Neon DB via Prisma.
 */
export async function toggleQuizFreeStatus(
  id: string,
  is_free: boolean
): Promise<{ success: boolean; quiz?: any; error?: string }> {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let targetId: string;

    if (uuidRegex.test(id)) {
      // id is already a UUID — use it directly
      targetId = id;
    } else {
      // id is a name or numeric string — resolve to a UUID first
      const existing = await prisma.quizzes.findFirst({
        where: { name: id, deleted_at: null },
        select: { id: true },
      });
      if (!existing) {
        return { success: false, error: `Quiz "${id}" not found in database.` };
      }
      targetId = existing.id;
    }

    const updated = await prisma.quizzes.update({
      where: { id: targetId },
      data: { is_free, updated_at: new Date() },
    });

    // Also update matching mock_tests row
    try {
      await prisma.mock_tests.updateMany({
        where: { OR: [{ id: targetId }, { name: updated.name }] },
        data: { is_free, updated_at: new Date() },
      });
    } catch {
      await execute(
        `UPDATE mock_tests SET is_free = $1, updated_at = NOW() WHERE id = $2 OR name = $3`,
        [is_free, targetId, updated.name]
      );
    }

    revalidatePath("/admin/quizzes");
    revalidatePath("/dashboard/exam-prep");
    revalidatePath("/exam-prep");
    revalidatePath("/dashboard");

    return { success: true, quiz: updated };
  } catch (error: any) {
    console.error("Error toggling quiz free status:", error);
    return { success: false, error: error.message || "Failed to update quiz free status." };
  }
}

/**
 * Light, dedicated mutation Server Action to toggle the is_free status of a Mock Test in Neon DB via Prisma.
 */
export async function toggleMockTestFreeStatus(
  id: string,
  is_free: boolean
): Promise<{ success: boolean; item?: any; error?: string }> {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let targetId = id;
    if (!uuidRegex.test(id)) {
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM mock_tests WHERE name = $1 AND deleted_at IS NULL LIMIT 1`,
        [id]
      );
      if (existing) targetId = existing.id;
    }

    try {
      await prisma.mock_tests.updateMany({
        where: { OR: [{ id: targetId }, { name: id }] },
        data: { is_free, updated_at: new Date() },
      });
    } catch {
      await execute(
        `UPDATE mock_tests SET is_free = $1, updated_at = NOW() WHERE id = $2 OR name = $3`,
        [is_free, targetId, id]
      );
    }

    revalidatePath("/admin/quizzes");
    revalidatePath("/dashboard/exam-prep");
    revalidatePath("/exam-prep");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error toggling mock test free status:", error);
    return { success: false, error: error.message || "Failed to update mock test free status." };
  }
}

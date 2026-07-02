"use server";

import prisma from "@/lib/prisma";

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
 * Synchronizes a mock exam configuration and its question associations to the PostgreSQL database.
 * Saves to BOTH the `quizzes` and `mock_tests` tables so that it is visible everywhere.
 * Note: To satisfy the database check constraint "mock_tests_question_count_check",
 * mock test records are only created/updated in the `mock_tests` table if they contain at least 1 question.
 */
export async function syncQuizToDbAction(quiz: SyncQuizInput, questionStems: string[], createdBy?: string) {
  try {
    const statusMap: Record<string, "draft" | "active" | "suspended" | "archived"> = {
      draft: "draft",
      active: "active",
      archived: "archived",
    };
    const dbStatus = statusMap[quiz.status] || "draft";
    const examTypeCode = quiz.examType || "AKT";
    const qCount = questionStems.length;

    // Validate that createdBy is a valid UUID format before saving to database
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const creatorId = createdBy && uuidRegex.test(createdBy) ? createdBy : null;

    // ────────────────────────────────────────────────────────────────
    // 1. Sync to the `quizzes` / `quiz_questions` tables
    // ────────────────────────────────────────────────────────────────
    let dbQuiz = await prisma.quizzes.findFirst({
      where: { name: quiz.name },
    });

    if (dbQuiz) {
      dbQuiz = await prisma.quizzes.update({
        where: { id: dbQuiz.id },
        data: {
          description: quiz.description || "",
          time_limit_min: quiz.timeLimit,
          passing_score: quiz.passingScore,
          randomize: quiz.randomize,
          status: dbStatus,
          exam_type_code: examTypeCode,
          created_by: creatorId,
          updated_at: new Date(),
        },
      });

      await prisma.quiz_questions.deleteMany({
        where: { quiz_id: dbQuiz.id },
      });
    } else {
      dbQuiz = await prisma.quizzes.create({
        data: {
          name: quiz.name,
          description: quiz.description || "",
          time_limit_min: quiz.timeLimit,
          passing_score: quiz.passingScore,
          randomize: quiz.randomize,
          status: dbStatus,
          exam_type_code: examTypeCode,
          created_by: creatorId,
        },
      });
    }

    // ────────────────────────────────────────────────────────────────
    // 2. Rebuild Question associations for the `quizzes` table
    // ────────────────────────────────────────────────────────────────
    const quizQuestionsData = [];
    for (let index = 0; index < questionStems.length; index++) {
      const stem = questionStems[index];
      if (!stem) continue;

      const question = await prisma.questions.findFirst({
        where: { stem: stem.trim() },
      });

      if (question) {
        quizQuestionsData.push({
          quiz_id: dbQuiz.id,
          question_id: question.id,
          position: index,
        });
      }
    }

    if (quizQuestionsData.length > 0) {
      await prisma.quiz_questions.createMany({
        data: quizQuestionsData,
        skipDuplicates: true,
      });
    }

    // ────────────────────────────────────────────────────────────────
    // 3. Sync to the `mock_tests` / `mock_test_questions` tables
    // ────────────────────────────────────────────────────────────────
    if (qCount > 0) {
      let dbMock = await prisma.mock_tests.findFirst({
        where: { name: quiz.name },
      });

      const availabilityVal: "available" | "locked" = quiz.status === "active" ? "available" : "locked";

      if (dbMock) {
        dbMock = await prisma.mock_tests.update({
          where: { id: dbMock.id },
          data: {
            subtitle: quiz.description || "",
            exam_type_code: examTypeCode,
            question_count: qCount,
            duration_min: quiz.timeLimit || 60,
            availability: availabilityVal,
            created_by: creatorId,
            updated_at: new Date(),
          },
        });

        await prisma.mock_test_questions.deleteMany({
          where: { mock_test_id: dbMock.id },
        });
      } else {
        dbMock = await prisma.mock_tests.create({
          data: {
            name: quiz.name,
            subtitle: quiz.description || "",
            exam_type_code: examTypeCode,
            question_count: qCount,
            duration_min: quiz.timeLimit || 60,
            availability: availabilityVal,
            created_by: creatorId,
          },
        });
      }

      // Rebuild mock_test_questions mapping
      const mockQuestionsData = [];
      for (let index = 0; index < questionStems.length; index++) {
        const stem = questionStems[index];
        if (!stem) continue;

        const question = await prisma.questions.findFirst({
          where: { stem: stem.trim() },
        });

        if (question) {
          mockQuestionsData.push({
            mock_test_id: dbMock.id,
            question_id: question.id,
            position: index,
          });
        }
      }

      if (mockQuestionsData.length > 0) {
        await prisma.mock_test_questions.createMany({
          data: mockQuestionsData,
          skipDuplicates: true,
        });
      }

      return { success: true, dbId: dbQuiz.id, dbMockId: dbMock.id };
    } else {
      // If the quiz has 0 questions, ensure it does not exist in the mock_tests table to satisfy check constraints
      const dbMock = await prisma.mock_tests.findFirst({
        where: { name: quiz.name },
      });
      if (dbMock) {
        await prisma.mock_tests.delete({
          where: { id: dbMock.id },
        });
      }
      return { success: true, dbId: dbQuiz.id, dbMockId: null };
    }
  } catch (error: any) {
    console.error("Failed to sync quiz to database:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a quiz from both the `quizzes` and `mock_tests` tables in the database.
 */
export async function deleteQuizFromDbAction(quizName: string) {
  try {
    const dbQuiz = await prisma.quizzes.findFirst({
      where: { name: quizName },
    });
    if (dbQuiz) {
      await prisma.quizzes.delete({
        where: { id: dbQuiz.id },
      });
    }

    const dbMock = await prisma.mock_tests.findFirst({
      where: { name: quizName },
    });
    if (dbMock) {
      await prisma.mock_tests.delete({
        where: { id: dbMock.id },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete quiz from database:", error);
    return { success: false, error: error.message };
  }
}

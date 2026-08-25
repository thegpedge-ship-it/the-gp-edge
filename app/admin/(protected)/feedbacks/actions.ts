"use server";

import { query } from "@/lib/db";

export interface QuestionFeedbackRow {
  id: string;
  question_id: string;
  user_email: string;
  user_name: string;
  feedback: string;
  created_at: string;
}

export interface LibraryFeedbackRow {
  id: string;
  condition_id: string;
  condition_name: string;
  user_email: string;
  user_name: string;
  feedback: string;
  created_at: string;
}

export async function getQuestionFeedbacks(page: number = 1, pageSize: number = 50): Promise<{
  rows: QuestionFeedbackRow[];
  total: number;
}> {
  const offset = (page - 1) * pageSize;

  const [countRows, dataRows] = await Promise.all([
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM question_feedback`),
    query(
      `SELECT
         qf.id,
         qf.question_id,
         u.email AS user_email,
         COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.email) AS user_name,
         qf.feedback,
         qf.created_at
       FROM question_feedback qf
       JOIN users u ON u.id = qf.user_id
       ORDER BY qf.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    ),
  ]);

  return {
    rows: dataRows.map((r: any) => ({
      id: r.id,
      question_id: r.question_id,
      user_email: r.user_email,
      user_name: r.user_name,
      feedback: r.feedback,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    })),
    total: countRows[0]?.total ?? 0,
  };
}

export async function getLibraryFeedbacks(page: number = 1, pageSize: number = 50): Promise<{
  rows: LibraryFeedbackRow[];
  total: number;
}> {
  const offset = (page - 1) * pageSize;

  const [countRows, dataRows] = await Promise.all([
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM medical_library_feedback`),
    query(
      `SELECT
         mlf.id,
         mlf.condition_id,
         mlf.condition_name,
         u.email AS user_email,
         COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.email) AS user_name,
         mlf.feedback,
         mlf.created_at
       FROM medical_library_feedback mlf
       JOIN users u ON u.id = mlf.user_id
       ORDER BY mlf.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    ),
  ]);

  return {
    rows: dataRows.map((r: any) => ({
      id: r.id,
      condition_id: r.condition_id,
      condition_name: r.condition_name,
      user_email: r.user_email,
      user_name: r.user_name,
      feedback: r.feedback,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    })),
    total: countRows[0]?.total ?? 0,
  };
}

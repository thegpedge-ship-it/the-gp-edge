"use server";

import { query } from "@/lib/db";
import { recordAuditLog } from "@/lib/relationalPermissions";

interface AuditActor {
  id?: string;
  name?: string;
  email?: string;
}

/** Escapes a single CSV field per RFC 4180 (wraps in quotes, doubles embedded quotes). */
function csvField(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvField).join(","));
  }
  return lines.join("\r\n");
}

export interface QuestionFeedbackRow {
  id: string;
  question_id: string;
  question_uqid: string | null;
  user_email: string;
  user_name: string;
  exam_type: string | null;
  issue_where: string | null;
  issue_type: string | null;
  suggested_answer: string | null;
  disputed_answer: string | null;
  comment: string | null;
  status: string;
  created_at: string;
  admin_reply: string | null;
  replied_at: string | null;
  thread_count: number;
  has_user_message: boolean;
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
         q.uqid AS question_uqid,
         u.email AS user_email,
         COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.email) AS user_name,
         COALESCE(qf.exam_type, q.exam_type_code) AS exam_type,
         qf.issue_where,
         qf.issue_type,
         qf.suggested_answer,
         qf.disputed_answer,
         qf.comment,
         qf.status,
         qf.created_at,
         qf.admin_reply,
         qf.replied_at,
         COALESCE(fm_agg.thread_count, 0)::int AS thread_count,
         COALESCE(fm_agg.has_user_message, false) AS has_user_message
       FROM question_feedback qf
       JOIN users u ON u.id = qf.user_id
       LEFT JOIN questions q ON q.id = qf.question_id
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*)::int AS thread_count,
           BOOL_OR(fm.sender_role = 'user') AS has_user_message
         FROM feedback_messages fm
         WHERE fm.feedback_id = qf.id
       ) fm_agg ON true
       ORDER BY
         CASE WHEN qf.status IN ('open','under_review') THEN 0 ELSE 1 END,
         CASE WHEN COALESCE(fm_agg.has_user_message, false) THEN 0 ELSE 1 END,
         CASE WHEN qf.admin_reply IS NOT NULL OR COALESCE(fm_agg.thread_count, 0) > 0 THEN 0 ELSE 1 END,
         qf.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    ),
  ]);

  return {
    rows: dataRows.map((r: any) => ({
      id: r.id,
      question_id: r.question_id,
      question_uqid: r.question_uqid ?? null,
      user_email: r.user_email,
      user_name: r.user_name,
      exam_type: r.exam_type ?? null,
      issue_where: r.issue_where ?? null,
      issue_type: r.issue_type ?? null,
      suggested_answer: r.suggested_answer ?? null,
      disputed_answer: r.disputed_answer ?? null,
      comment: r.comment ?? null,
      status: r.status ?? "open",
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      admin_reply: r.admin_reply ?? null,
      replied_at: r.replied_at instanceof Date ? r.replied_at.toISOString() : r.replied_at ? String(r.replied_at) : null,
      thread_count: r.thread_count ?? 0,
      has_user_message: r.has_user_message ?? false,
    })),
    total: countRows[0]?.total ?? 0,
  };
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: "open" | "under_review" | "accepted" | "rejected" | "resolved",
  adminUser?: AuditActor
): Promise<{ ok: boolean }> {
  const before = await query<{ status: string }>(`SELECT status FROM question_feedback WHERE id = $1`, [feedbackId]);
  await query(`UPDATE question_feedback SET status = $1 WHERE id = $2`, [status, feedbackId]);
  await recordAuditLog({
    adminUserId: adminUser?.id,
    action: "update_feedback_status",
    category: "feedback",
    entityType: "question_feedback",
    entityId: feedbackId,
    metadata: {
      fromStatus: before[0]?.status ?? null,
      toStatus: status,
      changedBy: adminUser?.name || adminUser?.email,
    },
  });
  return { ok: true };
}

export async function saveAdminReply(
  feedbackId: string,
  reply: string,
  adminUser?: AuditActor
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = reply.trim();
  if (!trimmed) return { ok: false, error: "Reply cannot be empty." };
  if (trimmed.length > 200) return { ok: false, error: "Reply must be 200 characters or fewer." };
  await query(
    `UPDATE question_feedback SET admin_reply = $1, replied_at = NOW() WHERE id = $2`,
    [trimmed, feedbackId]
  );
  await recordAuditLog({
    adminUserId: adminUser?.id,
    action: "reply_feedback",
    category: "feedback",
    entityType: "question_feedback",
    entityId: feedbackId,
    metadata: { reply: trimmed, repliedBy: adminUser?.name || adminUser?.email },
  });
  return { ok: true };
}

export interface AdminFeedbackMessage {
  id: string;
  feedbackId: string;
  senderRole: "user" | "admin";
  message: string;
  createdAt: string;
}

export async function getFeedbackMessages(feedbackId: string): Promise<AdminFeedbackMessage[]> {
  const rows = await query(
    `SELECT id, feedback_id, sender_role, message, created_at
     FROM feedback_messages
     WHERE feedback_id = $1
     ORDER BY created_at ASC`,
    [feedbackId]
  );
  return rows.map((r: any) => ({
    id: r.id,
    feedbackId: r.feedback_id,
    senderRole: r.sender_role,
    message: r.message,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }));
}

export async function sendAdminFeedbackMessage(
  feedbackId: string,
  message: string,
  adminUser?: AuditActor
): Promise<{ ok: boolean; error?: string; messageId?: string; createdAt?: string }> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: "Message cannot be empty." };
  if (trimmed.length > 200) return { ok: false, error: "Message must be 200 characters or fewer." };

  const exists = await query(`SELECT id FROM question_feedback WHERE id = $1`, [feedbackId]);
  if (exists.length === 0) return { ok: false, error: "Feedback not found." };

  const result = await query(
    `INSERT INTO feedback_messages (feedback_id, sender_role, message)
     VALUES ($1, 'admin', $2)
     RETURNING id, created_at`,
    [feedbackId, trimmed]
  );
  const row = result[0] as any;

  await recordAuditLog({
    adminUserId: adminUser?.id,
    action: "send_feedback_message",
    category: "feedback",
    entityType: "question_feedback",
    entityId: feedbackId,
    metadata: { message: trimmed, sentBy: adminUser?.name || adminUser?.email },
  });

  return {
    ok: true,
    messageId: row.id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export interface NoteTemplateFeedbackRow {
  id: string;
  template_id: string;
  template_name: string;
  version_label: string | null;
  user_email: string;
  user_name: string;
  severity: string;
  whats_wrong: string;
  source: string | null;
  section_where: string;
  issue_type: string;
  wrong_detail: string | null;
  software_name: string | null;
  status: string;
  created_at: string;
}

export async function getNoteTemplateFeedbacks(page: number = 1, pageSize: number = 50): Promise<{
  rows: NoteTemplateFeedbackRow[];
  total: number;
}> {
  const offset = (page - 1) * pageSize;

  const [countRows, dataRows] = await Promise.all([
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM note_template_feedback`),
    query(
      `SELECT
         ntf.id,
         ntf.template_id,
         ntf.template_name,
         ntf.version_label,
         u.email AS user_email,
         COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.email) AS user_name,
         ntf.severity,
         ntf.whats_wrong,
         ntf.source,
         ntf.section_where,
         ntf.issue_type,
         ntf.wrong_detail,
         ntf.software_name,
         ntf.status,
         ntf.created_at
       FROM note_template_feedback ntf
       JOIN users u ON u.id = ntf.user_id
       ORDER BY ntf.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    ),
  ]);

  return {
    rows: dataRows.map((r: any) => ({
      id: r.id,
      template_id: r.template_id,
      template_name: r.template_name,
      version_label: r.version_label ?? null,
      user_email: r.user_email,
      user_name: r.user_name,
      severity: r.severity,
      whats_wrong: r.whats_wrong,
      source: r.source ?? null,
      section_where: r.section_where,
      issue_type: r.issue_type,
      wrong_detail: r.wrong_detail ?? null,
      software_name: r.software_name ?? null,
      status: r.status ?? "open",
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    })),
    total: countRows[0]?.total ?? 0,
  };
}

export async function updateNoteTemplateFeedbackStatus(
  feedbackId: string,
  status: "open" | "under_review" | "accepted" | "rejected" | "resolved",
  adminUser?: AuditActor
): Promise<{ ok: boolean }> {
  const before = await query<{ status: string }>(`SELECT status FROM note_template_feedback WHERE id = $1`, [feedbackId]);
  await query(`UPDATE note_template_feedback SET status = $1 WHERE id = $2`, [status, feedbackId]);
  await recordAuditLog({
    adminUserId: adminUser?.id,
    action: "update_feedback_status",
    category: "feedback",
    entityType: "note_template_feedback",
    entityId: feedbackId,
    metadata: {
      fromStatus: before[0]?.status ?? null,
      toStatus: status,
      changedBy: adminUser?.name || adminUser?.email,
    },
  });
  return { ok: true };
}

export async function exportQuestionFeedbacksCsvAction(adminUser?: AuditActor): Promise<string> {
  const rows = await query<any>(
    `SELECT
       qf.id, qf.question_id, q.uqid AS question_uqid,
       u.email AS user_email,
       COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.email) AS user_name,
       COALESCE(qf.exam_type, q.exam_type_code) AS exam_type,
       qf.issue_where, qf.issue_type, qf.suggested_answer, qf.disputed_answer,
       qf.comment, qf.status, qf.created_at, qf.admin_reply, qf.replied_at
     FROM question_feedback qf
     JOIN users u ON u.id = qf.user_id
     LEFT JOIN questions q ON q.id = qf.question_id
     ORDER BY qf.created_at DESC`
  );

  const csv = toCsv(
    ["ID", "Question ID", "Question Code", "Reporter Email", "Reporter Name", "Exam Type", "Issue Location", "Issue Type", "Suggested Answer", "Disputed Answer", "Comment", "Status", "Reported At", "Admin Reply", "Replied At"],
    rows.map((r) => [
      r.id,
      r.question_id,
      r.question_uqid ?? "",
      r.user_email,
      r.user_name,
      r.exam_type ?? "",
      r.issue_where ?? "",
      r.issue_type ?? "",
      r.suggested_answer ?? "",
      r.disputed_answer ?? "",
      r.comment ?? "",
      r.status ?? "open",
      r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      r.admin_reply ?? "",
      r.replied_at instanceof Date ? r.replied_at.toISOString() : r.replied_at ? String(r.replied_at) : "",
    ])
  );

  await recordAuditLog({
    adminUserId: adminUser?.id,
    action: "export_feedback_csv",
    category: "feedback",
    entityType: "question_feedback",
    entityId: "bulk",
    metadata: { rowCount: rows.length, exportedBy: adminUser?.name || adminUser?.email },
  });

  return csv;
}

export async function exportNoteTemplateFeedbacksCsvAction(adminUser?: AuditActor): Promise<string> {
  const rows = await query<any>(
    `SELECT
       ntf.id, ntf.template_id, ntf.template_name, ntf.version_label,
       u.email AS user_email,
       COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.email) AS user_name,
       ntf.severity, ntf.whats_wrong, ntf.source, ntf.section_where, ntf.issue_type,
       ntf.wrong_detail, ntf.software_name, ntf.status, ntf.created_at
     FROM note_template_feedback ntf
     JOIN users u ON u.id = ntf.user_id
     ORDER BY ntf.created_at DESC`
  );

  const csv = toCsv(
    ["ID", "Template ID", "Template Name", "Version", "Reporter Email", "Reporter Name", "Severity", "What's Wrong", "Source", "Section", "Issue Type", "Detail", "Software", "Status", "Reported At"],
    rows.map((r) => [
      r.id,
      r.template_id,
      r.template_name,
      r.version_label ?? "",
      r.user_email,
      r.user_name,
      r.severity,
      r.whats_wrong,
      r.source ?? "",
      r.section_where,
      r.issue_type,
      r.wrong_detail ?? "",
      r.software_name ?? "",
      r.status ?? "open",
      r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    ])
  );

  await recordAuditLog({
    adminUserId: adminUser?.id,
    action: "export_feedback_csv",
    category: "feedback",
    entityType: "note_template_feedback",
    entityId: "bulk",
    metadata: { rowCount: rows.length, exportedBy: adminUser?.name || adminUser?.email },
  });

  return csv;
}

export async function exportLibraryFeedbacksCsvAction(adminUser?: AuditActor): Promise<string> {
  const rows = await query<any>(
    `SELECT
       mlf.id, mlf.condition_id, mlf.condition_name,
       u.email AS user_email,
       COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.email) AS user_name,
       mlf.feedback, mlf.created_at
     FROM medical_library_feedback mlf
     JOIN users u ON u.id = mlf.user_id
     ORDER BY mlf.created_at DESC`
  );

  const csv = toCsv(
    ["ID", "Condition ID", "Condition Name", "Reporter Email", "Reporter Name", "Feedback", "Reported At"],
    rows.map((r) => [
      r.id,
      r.condition_id,
      r.condition_name,
      r.user_email,
      r.user_name,
      r.feedback,
      r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    ])
  );

  await recordAuditLog({
    adminUserId: adminUser?.id,
    action: "export_feedback_csv",
    category: "feedback",
    entityType: "library_feedback",
    entityId: "bulk",
    metadata: { rowCount: rows.length, exportedBy: adminUser?.name || adminUser?.email },
  });

  return csv;
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

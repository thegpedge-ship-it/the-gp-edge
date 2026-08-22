"use server";

import { query, queryOne, execute } from "@/lib/db";
import {
  PermissionUser,
  evaluateRelationalPermission,
  recordAuditLog,
} from "@/lib/relationalPermissions";

export interface ItemErrorReport {
  id: string;
  itemId: string;
  itemType: string;
  reporterUserId: string;
  reporterName?: string;
  reporterEmail?: string;
  errorCategory: "clinical_factual" | "dose_error" | "ambiguity" | "formatting" | "typo" | "other";
  description: string;
  contextSnapshot?: any;
  status: "open" | "under_review" | "resolved" | "dismissed";
  triageOutcome?: string | null;
  triagedBy?: string | null;
  triagedAt?: string | null;
  reporterNotified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Initializes item_error_reports table.
 */
async function initErrorReportsTable(): Promise<void> {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS item_error_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        reporter_user_id TEXT NOT NULL,
        reporter_name TEXT,
        reporter_email TEXT,
        error_category TEXT NOT NULL,
        description TEXT NOT NULL,
        context_snapshot JSONB DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'open',
        triage_outcome TEXT,
        triaged_by TEXT,
        triaged_at TIMESTAMPTZ,
        reporter_notified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error("[initErrorReportsTable] Error:", err);
  }
}

/**
 * 1. Submit Item Error Report
 * Submittable from the item itself by any user with automatic context snapshot.
 * Creates a remediation task in the single queue.
 */
export async function submitItemErrorReportAction(params: {
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template" | "quiz" | "mock_test";
  errorCategory: "clinical_factual" | "dose_error" | "ambiguity" | "formatting" | "typo" | "other";
  description: string;
  contextSnapshot?: any;
  user: PermissionUser;
}): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    const { itemId, itemType, errorCategory, description, contextSnapshot = {}, user } = params;

    if (!description || description.trim().length < 5) {
      return { success: false, error: "Please provide a detailed error description (minimum 5 characters)." };
    }

    await initErrorReportsTable();

    const inserted = await queryOne<{ id: string }>(
      `INSERT INTO item_error_reports
        (item_id, item_type, reporter_user_id, reporter_name, reporter_email, error_category, description, context_snapshot, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'open', NOW(), NOW())
       RETURNING id`,
      [
        itemId,
        itemType,
        user.id,
        user.name || user.username || "Subscriber",
        user.email || "",
        errorCategory,
        description.trim(),
        JSON.stringify(contextSnapshot),
      ]
    );

    // Create a task in the single queue pipeline_tasks
    await execute(`
      INSERT INTO pipeline_tasks
        (item_id, item_type, task_type, assigned_to, assigned_to_name, status, rework_type, created_at, updated_at)
      VALUES ($1, $2, 'remediation', 'unassigned', 'Error Triage Pool', 'offered', 'change_of_direction', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [itemId, itemType]).catch(() => {});

    await recordAuditLog({
      adminUserId: user.id,
      action: "submit_error_report",
      category: "error_report",
      entityType: itemType,
      entityId: itemId,
      metadata: {
        reportId: inserted?.id,
        errorCategory,
        reporter: user.name || user.email,
        description: description.trim(),
      },
    });

    return { success: true, reportId: inserted?.id };
  } catch (err: any) {
    console.error("Error submitting error report:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 2. Triage Error Report & Notify Reporter
 * SA, CE, OM only. Closes feedback loop with the reporter.
 */
export async function triageErrorReportAction(params: {
  reportId: string;
  status: "under_review" | "resolved" | "dismissed";
  triageOutcome: string;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { reportId, status, triageOutcome, adminUser } = params;

    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "triage_error_report",
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    await initErrorReportsTable();

    const report = await queryOne<any>(
      `SELECT * FROM item_error_reports WHERE id = $1`,
      [reportId]
    );
    if (!report) return { success: false, error: "Error report not found." };

    await execute(
      `UPDATE item_error_reports
          SET status = $1,
              triage_outcome = $2,
              triaged_by = $3,
              triaged_at = NOW(),
              reporter_notified = TRUE,
              updated_at = NOW()
        WHERE id = $4`,
      [status, triageOutcome.trim(), adminUser.name || adminUser.email, reportId]
    );

    // If reporter has a user record, send in-app notification to close the feedback loop
    if (report.reporter_user_id) {
      await execute(`
        INSERT INTO user_notifications (user_id, notification_id, is_read, delivered_at)
        SELECT $1::uuid, n.id, FALSE, NOW()
          FROM notifications n
         WHERE n.type = 'error_report_outcome'
         LIMIT 1
      `, [report.reporter_user_id]).catch(() => {});
    }

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "triage_error_report",
      category: "error_report",
      entityType: report.item_type,
      entityId: report.item_id,
      metadata: {
        reportId,
        status,
        triageOutcome,
        triagedBy: adminUser.name || adminUser.email,
        reporterNotified: true,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error triaging error report:", err);
    return { success: false, error: err.message };
  }
}

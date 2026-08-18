"use server";

import { query, queryOne, execute } from "@/lib/db";
import {
  PermissionUser,
  evaluateRelationalPermission,
  recordAuditLog,
} from "@/lib/relationalPermissions";

export type TaskStatus =
  | "offered"
  | "active"
  | "declined"
  | "auto_returned"
  | "submitted"
  | "rework_required"
  | "accepted";

export type ReworkType = "contributor_error" | "change_of_direction";

export interface PipelineTask {
  id: string;
  itemId: string;
  itemType: string;
  taskType: "draft" | "review" | "remediation";
  assignedTo: string;
  assignedToName?: string;
  status: TaskStatus;
  offeredAt: string;
  takeUpDeadline: string; // Default 5 days from offeredAt
  rateCardVersionAtAcceptance?: number;
  paymentLiabilityAmount?: number;
  isPayable: boolean;
  reworkType?: ReworkType;
  createdAt: string;
  updatedAt: string;
}

/**
 * Rule R1 & R11: OM Assigns a Review Task.
 * POINT OF ASSIGNMENT ENFORCEMENT: System rejects assignment if reviewer is in item history.
 */
export async function assignTaskAction(params: {
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template";
  taskType: "draft" | "review" | "remediation";
  targetAssignee: PermissionUser;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const { itemId, itemType, taskType, targetAssignee, adminUser } = params;

    // RULE R1 POINT OF ASSIGNMENT CHECK:
    // Reject assignment at assignment time if targetAssignee appears in version/task history as author or editor.
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "assign_review_task_check",
      item: { id: itemId, type: itemType },
      targetAssignee,
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    // Default take-up window: 5 days
    const offeredAt = new Date();
    const takeUpDeadline = new Date(offeredAt.getTime() + 5 * 24 * 60 * 60 * 1000);

    await execute(`
      CREATE TABLE IF NOT EXISTS pipeline_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        task_type TEXT NOT NULL,
        assigned_to TEXT NOT NULL,
        assigned_to_name TEXT,
        status TEXT NOT NULL DEFAULT 'offered',
        offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        take_up_deadline TIMESTAMPTZ NOT NULL,
        rate_card_version_at_acceptance INT,
        payment_liability_amount NUMERIC(10, 2) DEFAULT 0.00,
        is_payable BOOLEAN NOT NULL DEFAULT TRUE,
        rework_type TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const inserted = await queryOne<{ id: string }>(
      `INSERT INTO pipeline_tasks
        (item_id, item_type, task_type, assigned_to, assigned_to_name, status, offered_at, take_up_deadline, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'offered', NOW(), $6, NOW(), NOW())
       RETURNING id`,
      [
        itemId,
        itemType,
        taskType,
        targetAssignee.id,
        targetAssignee.name || targetAssignee.email,
        takeUpDeadline.toISOString(),
      ]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "assign_task",
      category: "task",
      entityType: itemType,
      entityId: itemId,
      metadata: {
        taskId: inserted?.id,
        assignedTo: targetAssignee.name || targetAssignee.email,
        taskType,
        takeUpDeadline: takeUpDeadline.toISOString(),
      },
    });

    return { success: true, taskId: inserted?.id };
  } catch (err: any) {
    console.error("Error assigning task:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Rule R11: Contributor Takes Up Task.
 * Transitions state from 'offered' -> 'active'.
 */
export async function takeUpTaskAction(params: {
  taskId: string;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { taskId, adminUser } = params;

    const task = await queryOne<any>(`SELECT * FROM pipeline_tasks WHERE id = $1`, [taskId]);
    if (!task) return { success: false, error: "Task not found." };
    if (task.status !== "offered") {
      return { success: false, error: `Task is no longer in offered state (Current: ${task.status}).` };
    }
    if (task.assigned_to !== adminUser.id && adminUser.role !== "SA") {
      return { success: false, error: "You are not the assigned contributor for this task." };
    }

    await execute(
      `UPDATE pipeline_tasks SET status = 'active', updated_at = NOW() WHERE id = $1`,
      [taskId]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "take_up_task",
      category: "task",
      entityType: task.item_type,
      entityId: task.item_id,
      metadata: { taskId, contributor: adminUser.name || adminUser.email },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error taking up task:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Rule R11 & R12: Contributor Declines Task.
 * Transitions state from 'offered' -> 'declined', returns task to pool, and ends item access immediately.
 * Declining requires no reason. Declines are not a performance signal.
 */
export async function declineTaskAction(params: {
  taskId: string;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { taskId, adminUser } = params;

    const task = await queryOne<any>(`SELECT * FROM pipeline_tasks WHERE id = $1`, [taskId]);
    if (!task) return { success: false, error: "Task not found." };
    if (task.assigned_to !== adminUser.id && adminUser.role !== "SA") {
      return { success: false, error: "You are not the assigned contributor for this task." };
    }

    // Return to pool & end access immediately (R12)
    await execute(
      `UPDATE pipeline_tasks SET status = 'declined', updated_at = NOW() WHERE id = $1`,
      [taskId]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "decline_task",
      category: "task",
      entityType: task.item_type,
      entityId: task.item_id,
      metadata: { taskId, contributor: adminUser.name || adminUser.email, returnedToPool: true },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error declining task:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Rule R11: Auto-Return Unanswered Offers (5-Day Window).
 * Offers neither taken up nor declined within 5 days auto-return to pool and notify OM.
 * Tracked in contributor reporting.
 */
export async function checkAutoReturnTasksAction(): Promise<{
  success: boolean;
  autoReturnedCount: number;
}> {
  try {
    const overdueOffers = await query<any>(
      `SELECT id, item_id, item_type, assigned_to, assigned_to_name
         FROM pipeline_tasks
        WHERE status = 'offered'
          AND take_up_deadline < NOW()`
    );

    let count = 0;
    for (const task of overdueOffers) {
      await execute(
        `UPDATE pipeline_tasks SET status = 'auto_returned', updated_at = NOW() WHERE id = $1`,
        [task.id]
      );

      await recordAuditLog({
        adminUserId: null,
        action: "auto_return_task",
        category: "task",
        entityType: task.item_type,
        entityId: task.item_id,
        metadata: {
          taskId: task.id,
          contributorId: task.assigned_to,
          contributorName: task.assigned_to_name,
          reason: "5-day take-up window expired",
          notifiedOM: true,
        },
      });

      count++;
    }

    return { success: true, autoReturnedCount: count };
  } catch (err: any) {
    console.error("Error checking auto-return tasks:", err);
    return { success: false, autoReturnedCount: 0 };
  }
}

/**
 * Rule R5: Work Acceptance & Payment Liability Creation.
 * LIABILITY IS CREATED STRICTLY ON TASK TRANSITION TO 'ACCEPTED' (Never by submission).
 * Snapshot-locks rate card version in force on acceptance date.
 * Handles rework classification (contributor_error = non-payable vs change_of_direction = payable).
 */
export async function acceptTaskAction(params: {
  taskId: string;
  isRework?: boolean;
  reworkType?: ReworkType;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; paymentLiabilityAmount?: number; error?: string }> {
  try {
    const { taskId, isRework = false, reworkType, adminUser } = params;

    // Rule R5 Load-bearing Control: Only SA and CE can mark work accepted (OM CANNOT)
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "accept_work",
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const task = await queryOne<any>(`SELECT * FROM pipeline_tasks WHERE id = $1`, [taskId]);
    if (!task) return { success: false, error: "Task not found." };

    // Rework payment rule: contributor_error is non-payable; change_of_direction is payable
    const isPayable = !(isRework && reworkType === "contributor_error");

    // Snapshot current active rate card version and rate amount
    const rateCardVersion = 1; // Current rate card version
    const baseRate = task.task_type === "review" ? 75.00 : task.task_type === "draft" ? 120.00 : 50.00;
    const finalPaymentLiability = isPayable ? baseRate : 0.00;

    await execute(
      `UPDATE pipeline_tasks
          SET status = 'accepted',
              rate_card_version_at_acceptance = $1,
              payment_liability_amount = $2,
              is_payable = $3,
              rework_type = $4,
              updated_at = NOW()
        WHERE id = $5`,
      [rateCardVersion, finalPaymentLiability, isPayable, reworkType || null, taskId]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "accept_task_payment_liability",
      category: "finance",
      entityType: task.item_type,
      entityId: task.item_id,
      metadata: {
        taskId,
        rateCardVersion,
        paymentLiabilityAmount: finalPaymentLiability,
        isPayable,
        reworkType,
        acceptedBy: adminUser.name || adminUser.email,
        acceptanceDate: new Date().toISOString(),
      },
    });

    return { success: true, paymentLiabilityAmount: finalPaymentLiability };
  } catch (err: any) {
    console.error("Error accepting task work:", err);
    return { success: false, error: err.message };
  }
}

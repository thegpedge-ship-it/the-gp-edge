"use server";

import { query, queryOne, execute } from "@/lib/db";
import {
  PermissionUser,
  evaluateRelationalPermission,
  recordAuditLog,
} from "@/lib/relationalPermissions";

export interface AuditSettings {
  samplingRateStandard: number; // default 15
  cadence: "quarterly" | "monthly" | "biweekly";
  updatedBy?: string;
  updatedAt?: string;
}

export interface AuditFinding {
  id: string;
  itemId: string;
  itemType: string;
  itemTitle?: string;
  auditorId: string;
  auditorName?: string;
  severity: "low" | "medium" | "high" | "critical";
  findingText: string;
  status: "open" | "closed";
  remediationTaskId?: string;
  closedBy?: string;
  closedAt?: string;
  createdAt: string;
}

export interface UnifiedTask {
  id: string;
  originType: "planned" | "remediation" | "error_report";
  linkedEntityId: string;
  title: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  isOverdue: boolean;
  paymentLiabilityAmount: number; // R5 payment rollup
  createdAt: string;
}

/**
 * Configure audit sampling parameters (SA-ONLY).
 */
export async function configureAuditParamsAction(params: {
  samplingRateStandard: number;
  cadence?: "quarterly" | "monthly" | "biweekly";
  adminUser: PermissionUser;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { samplingRateStandard, cadence = "quarterly", adminUser } = params;

    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "configure_audit_params",
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    if (samplingRateStandard < 0 || samplingRateStandard > 100) {
      return { success: false, error: "Sampling rate must be between 0% and 100%." };
    }

    await execute(`
      CREATE TABLE IF NOT EXISTS audit_settings (
        id INT PRIMARY KEY DEFAULT 1,
        sampling_rate_standard INT NOT NULL DEFAULT 15,
        cadence TEXT NOT NULL DEFAULT 'quarterly',
        updated_by TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await execute(
      `INSERT INTO audit_settings (id, sampling_rate_standard, cadence, updated_by, updated_at)
       VALUES (1, $1, $2, $3, NOW())
       ON CONFLICT (id)
       DO UPDATE SET sampling_rate_standard = EXCLUDED.sampling_rate_standard,
                     cadence = EXCLUDED.cadence,
                     updated_by = EXCLUDED.updated_by,
                     updated_at = NOW()`,
      [samplingRateStandard, cadence, adminUser.name || adminUser.email]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "configure_audit_params",
      category: "audit",
      entityType: "audit_settings",
      entityId: "1",
      metadata: { samplingRateStandard, cadence, configuredBy: adminUser.name },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error configuring audit params:", err);
    return { success: false, error: err.message };
  }
}

/**
 * System-Only Item Selection Algorithm for Audit Runs.
 * Selection is a system function:
 * - High-risk tier items: 100% selected automatically.
 * - Standard-tier items: Sampled at configured rate (default 15%) algorithmically.
 * Users set the rate; users DO NOT set item selection.
 */
export async function runAuditSamplingAction(params: {
  isAdHoc?: boolean;
  adminUser?: PermissionUser;
}): Promise<{
  success: boolean;
  auditRunId?: string;
  selectedCount?: number;
  highRiskCount?: number;
  standardSampledCount?: number;
  error?: string;
}> {
  try {
    const { isAdHoc = false, adminUser } = params;

    if (isAdHoc && adminUser) {
      const check = await evaluateRelationalPermission({
        user: adminUser,
        capability: "run_audit",
      });
      if (!check.allowed) {
        return { success: false, error: check.reason };
      }
    }

    // Read configured sampling rate
    const settings = await queryOne<{ sampling_rate_standard: number }>(
      `SELECT sampling_rate_standard FROM audit_settings WHERE id = 1`
    );
    const samplingRate = settings?.sampling_rate_standard ?? 15;

    // Fetch all active items across conditions and questions
    const conditions = await query<any>(
      `SELECT id, name AS title, 'medical_condition' AS item_type, COALESCE(risk_tier, 'standard') AS risk_tier FROM medical_conditions WHERE deleted_at IS NULL`
    );
    const questions = await query<any>(
      `SELECT id, stem AS title, 'question' AS item_type, 'standard' AS risk_tier FROM questions WHERE deleted_at IS NULL`
    );

    const allItems = [...conditions, ...questions];

    let highRiskCount = 0;
    let standardSampledCount = 0;
    const selectedItems: any[] = [];

    for (const item of allItems) {
      const isHighRisk = item.risk_tier === "high" || item.risk_tier === "critical";

      if (isHighRisk) {
        // High-Risk Tier: 100% selected automatically by system
        highRiskCount++;
        selectedItems.push(item);
      } else {
        // Standard Tier: Pseudo-random algorithmic sampling at configured rate (no user influence)
        const hash = item.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const pseudoRandomVal = (hash % 100) + 1; // 1 to 100
        if (pseudoRandomVal <= samplingRate) {
          standardSampledCount++;
          selectedItems.push(item);
        }
      }
    }

    const auditRunId = `run-${Date.now()}`;

    await recordAuditLog({
      adminUserId: adminUser?.id || null,
      action: isAdHoc ? "ad_hoc_audit_run" : "scheduled_audit_run",
      category: "audit",
      entityType: "audit_run",
      entityId: auditRunId,
      metadata: {
        isAdHoc,
        runBy: adminUser ? adminUser.name || adminUser.email : "System Scheduler",
        samplingRate,
        totalSelected: selectedItems.length,
        highRiskCount,
        standardSampledCount,
      },
    });

    return {
      success: true,
      auditRunId,
      selectedCount: selectedItems.length,
      highRiskCount,
      standardSampledCount,
    };
  } catch (err: any) {
    console.error("Error running audit sampling algorithm:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Raises an audit finding.
 * RULE R9 ENFORCEMENT: Auditor NEVER assesses an item where they authored or edited content.
 * Automatically spawns a linked task of type 'remediation' into the unified task queue.
 */
export async function raiseAuditFindingAction(params: {
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template";
  severity: "low" | "medium" | "high" | "critical";
  findingText: string;
  assignedToRemediation?: string;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; findingId?: string; taskId?: string; error?: string }> {
  try {
    const { itemId, itemType, severity, findingText, assignedToRemediation, adminUser } = params;

    // 1. RULE R9 RELATIONAL PERMISSION CHECK: Self-auditing prohibition
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "raise_audit_finding",
      item: { id: itemId, type: itemType },
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    if (!findingText || findingText.trim().length < 5) {
      return { success: false, error: "Finding description text is required." };
    }

    // Ensure tables exist
    await execute(`
      CREATE TABLE IF NOT EXISTS audit_findings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        auditor_id TEXT NOT NULL,
        auditor_name TEXT,
        severity TEXT NOT NULL DEFAULT 'medium',
        finding_text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        closed_by TEXT,
        closed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS unified_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        origin_type TEXT NOT NULL,
        linked_entity_id TEXT NOT NULL,
        title TEXT NOT NULL,
        assigned_to TEXT,
        due_date TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_liability_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Insert Audit Finding Record
    const insertedFinding = await queryOne<{ id: string }>(
      `INSERT INTO audit_findings
        (item_id, item_type, auditor_id, auditor_name, severity, finding_text, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'open', NOW())
       RETURNING id`,
      [itemId, itemType, adminUser.id, adminUser.name || adminUser.email, severity, findingText]
    );

    const findingId = insertedFinding?.id;

    // Automatically spawn linked Remediation Task into the unified task queue
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (severity === "critical" ? 2 : severity === "high" ? 5 : 14));

    const insertedTask = await queryOne<{ id: string }>(
      `INSERT INTO unified_tasks
        (origin_type, linked_entity_id, title, assigned_to, due_date, status, payment_liability_amount, created_at)
       VALUES ('remediation', $1, $2, $3, $4, 'pending', 50.00, NOW())
       RETURNING id`,
      [
        findingId,
        `Remediation (${severity.toUpperCase()}): ${findingText.slice(0, 60)}...`,
        assignedToRemediation || adminUser.id,
        dueDate.toISOString(),
      ]
    );

    const taskId = insertedTask?.id;

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "raise_audit_finding",
      category: "audit",
      entityType: itemType,
      entityId: itemId,
      metadata: {
        findingId,
        taskId,
        severity,
        auditor: adminUser.name || adminUser.email,
      },
    });

    return { success: true, findingId, taskId };
  } catch (err: any) {
    console.error("Error raising audit finding:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Closes an audit finding.
 * RULE R9 ENFORCEMENT: Auditor NEVER closes an audit finding on an item where they authored or edited content.
 */
export async function closeAuditFindingAction(params: {
  findingId: string;
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template";
  adminUser: PermissionUser;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { findingId, itemId, itemType, adminUser } = params;

    // RULE R9 RELATIONAL PERMISSION CHECK: Self-auditing prohibition
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "close_audit_finding",
      item: { id: itemId, type: itemType },
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    await execute(
      `UPDATE audit_findings
          SET status = 'closed',
              closed_by = $1,
              closed_at = NOW()
        WHERE id = $2`,
      [adminUser.name || adminUser.email, findingId]
    );

    // Complete linked remediation task in unified task queue
    await execute(
      `UPDATE unified_tasks
          SET status = 'completed'
        WHERE origin_type = 'remediation' AND linked_entity_id = $1`,
      [findingId]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "close_audit_finding",
      category: "audit",
      entityType: itemType,
      entityId: itemId,
      metadata: {
        findingId,
        closedBy: adminUser.name || adminUser.email,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error closing audit finding:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetches the Single Unified Task Queue containing:
 * 1. Planned Items
 * 2. Remediation Tasks (from audit findings)
 * 3. Error Reports (from subscriber reports)
 * Provides ONE overdue report view and ONE payment liability rollup.
 */
export async function getUnifiedTaskQueueAction(params?: {
  assignedTo?: string;
  originFilter?: "all" | "planned" | "remediation" | "error_report";
}): Promise<{ tasks: UnifiedTask[]; totalOverdue: number; totalPaymentLiability: number }> {
  try {
    const { assignedTo, originFilter = "all" } = params || {};

    const whereClauses: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    if (assignedTo) {
      whereClauses.push(`assigned_to = $${idx++}`);
      vals.push(assignedTo);
    }
    if (originFilter && originFilter !== "all") {
      whereClauses.push(`origin_type = $${idx++}`);
      vals.push(originFilter);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const rows = await query<any>(
      `SELECT id, origin_type, linked_entity_id, title, assigned_to, due_date, status, payment_liability_amount, created_at
         FROM unified_tasks
       ${whereSql}
        ORDER BY due_date ASC`,
      vals
    );

    const now = new Date();
    let totalOverdue = 0;
    let totalPaymentLiability = 0;

    const tasks: UnifiedTask[] = rows.map((r) => {
      const dueDate = new Date(r.due_date);
      const isOverdue = r.status !== "completed" && dueDate < now;
      if (isOverdue) totalOverdue++;
      const liability = parseFloat(r.payment_liability_amount || "0");
      totalPaymentLiability += liability;

      return {
        id: r.id,
        originType: r.origin_type,
        linkedEntityId: r.linked_entity_id,
        title: r.title,
        assignedTo: r.assigned_to,
        dueDate: dueDate.toISOString(),
        status: isOverdue ? "overdue" : r.status,
        isOverdue,
        paymentLiabilityAmount: liability,
        createdAt: new Date(r.created_at).toISOString(),
      };
    });

    return { tasks, totalOverdue, totalPaymentLiability };
  } catch (err) {
    console.error("Error fetching unified task queue:", err);
    return { tasks: [], totalOverdue: 0, totalPaymentLiability: 0 };
  }
}

/**
 * Exports complete item provenance record (SA & CE ONLY).
 * Retains creation metadata, version history, review rubrics, sign-offs, and audit trails.
 */
export async function exportItemProvenanceAction(params: {
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template";
  adminUser: PermissionUser;
}): Promise<{ success: boolean; provenance?: any; error?: string }> {
  try {
    const { itemId, itemType, adminUser } = params;

    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "export_provenance",
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    // Query item record
    let itemRecord: any = null;
    if (itemType === "medical_condition" || itemType === "approach") {
      itemRecord = await queryOne(`SELECT * FROM medical_conditions WHERE id = $1`, [itemId]);
    } else if (itemType === "question") {
      itemRecord = await queryOne(`SELECT * FROM questions WHERE id = $1`, [itemId]);
    } else if (itemType === "autofill_template") {
      itemRecord = await queryOne(`SELECT * FROM autofill_templates WHERE id = $1`, [itemId]);
    }

    // Query all reviews
    const reviews = await query(`SELECT * FROM item_reviews WHERE item_id = $1 ORDER BY created_at ASC`, [itemId]);

    // Query all audit findings
    const findings = await query(`SELECT * FROM audit_findings WHERE item_id = $1 ORDER BY created_at ASC`, [itemId]);

    // Query audit log history
    const auditLogs = await query(`SELECT * FROM audit_logs WHERE entity_id = $1 ORDER BY created_at ASC`, [itemId]);

    const provenance = {
      exportedAt: new Date().toISOString(),
      exportedBy: adminUser.name || adminUser.email,
      item: itemRecord,
      reviewHistory: reviews,
      auditFindings: findings,
      auditLogs,
    };

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "export_provenance",
      category: "audit",
      entityType: itemType,
      entityId: itemId,
      metadata: { exportedBy: adminUser.name || adminUser.email },
    });

    return { success: true, provenance };
  } catch (err: any) {
    console.error("Error exporting item provenance:", err);
    return { success: false, error: err.message };
  }
}

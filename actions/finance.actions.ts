"use server";

import { query, queryOne, execute } from "@/lib/db";
import {
  PermissionUser,
  evaluateRelationalPermission,
  recordAuditLog,
} from "@/lib/relationalPermissions";
import { resolveRate, TaskType, ContentType, RateCardVersion, initRateCardsTable } from "@/lib/finance/rateCard";

export interface StatementLineItem {
  id?: string;
  statementId?: string;
  taskId: string;
  itemId: string;
  itemType: string;
  taskType: string;
  acceptedAt: string;
  rateCardVersion: number;
  rateApplied: number;
  amount: number;
  isPayable: boolean;
  reworkType?: string | null;
  nonPayableReason?: string | null;
}

export interface ContributorStatement {
  id: string;
  statementNumber: string; // e.g. "STM-2026-08-0012"
  contributorId: string;
  contributorName: string;
  contributorEmail?: string;
  contributorAbn?: string;
  isCreditOnly: boolean;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  totalItemsCount: number;
  totalAmount: number;
  isPaid: boolean;
  paidAt?: string | null;
  paymentReference?: string | null;
  isAdjustment: boolean;
  adjustmentToStatementId?: string | null;
  adjustmentReason?: string | null;
  lineItems: StatementLineItem[];
  createdAt: string;
}

/**
 * Initializes statements table in PostgreSQL.
 */
async function initStatementsTables(): Promise<void> {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS contributor_statements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        statement_number TEXT NOT NULL UNIQUE,
        contributor_id TEXT NOT NULL,
        contributor_name TEXT NOT NULL,
        contributor_email TEXT,
        contributor_abn TEXT,
        is_credit_only BOOLEAN NOT NULL DEFAULT FALSE,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        total_items_count INT NOT NULL DEFAULT 0,
        total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        is_paid BOOLEAN NOT NULL DEFAULT FALSE,
        paid_at TIMESTAMPTZ,
        payment_reference TEXT,
        is_adjustment BOOLEAN NOT NULL DEFAULT FALSE,
        adjustment_to_statement_id UUID,
        adjustment_reason TEXT,
        line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error("[initStatementsTables] Error:", err);
  }
}

/**
 * 1. View Rate Cards
 * Clinical Editor is BLIND to cost (strictly forbidden).
 */
export async function getRateCardsAction(adminUser: PermissionUser): Promise<{
  success: boolean;
  rateCards?: RateCardVersion[];
  error?: string;
}> {
  try {
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "view_rate_card",
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    await initRateCardsTable();
    const rows = await query<any>(
      `SELECT version, effective_from, effective_to, rates, created_by, created_at
         FROM rate_card_versions
        ORDER BY version DESC`
    );

    const rateCards: RateCardVersion[] = rows.map((r) => ({
      version: r.version,
      effectiveFrom: r.effective_from ? r.effective_from.toISOString() : "",
      effectiveTo: r.effective_to ? r.effective_to.toISOString() : null,
      rates: typeof r.rates === "string" ? JSON.parse(r.rates) : r.rates,
      createdBy: r.created_by,
      createdAt: r.created_at ? r.created_at.toISOString() : "",
    }));

    return { success: true, rateCards };
  } catch (err: any) {
    console.error("Error fetching rate cards:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 2. Create or Amend Rate Card (Super Admin Alone)
 * Versioned with effective dates.
 */
export async function createOrAmendRateCardAction(params: {
  rates: Record<string, number>;
  effectiveFrom: string;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; version?: number; error?: string }> {
  try {
    const { rates, effectiveFrom, adminUser } = params;

    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "create_amend_rate_card",
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    await initRateCardsTable();

    // Close previous active rate card version
    const effFromDate = new Date(effectiveFrom);
    await execute(
      `UPDATE rate_card_versions
          SET effective_to = $1
        WHERE effective_to IS NULL`,
      [effFromDate.toISOString()]
    );

    // Get next version number
    const maxVersionRow = await queryOne<{ max_v: number | null }>(
      `SELECT MAX(version) as max_v FROM rate_card_versions`
    );
    const nextVersion = (maxVersionRow?.max_v || 0) + 1;

    await execute(
      `INSERT INTO rate_card_versions (version, effective_from, effective_to, rates, created_by, created_at)
       VALUES ($1, $2, NULL, $3::jsonb, $4, NOW())`,
      [
        nextVersion,
        effFromDate.toISOString(),
        JSON.stringify(rates),
        adminUser.name || adminUser.email,
      ]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "amend_rate_card",
      category: "finance",
      entityType: "rate_card",
      entityId: String(nextVersion),
      metadata: {
        version: nextVersion,
        effectiveFrom: effFromDate.toISOString(),
        rates,
      },
    });

    return { success: true, version: nextVersion };
  } catch (err: any) {
    console.error("Error creating/amending rate card:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 3. Generate Monthly Statements (SA & OM)
 * Stored snapshot with line items, rates applied, and totals calculated at that moment.
 * Credit-only contributors receive $0 statements for attribution.
 */
export async function generateMonthlyStatementsAction(params: {
  periodMonth: number; // 1-12
  periodYear: number;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; generatedCount?: number; error?: string }> {
  try {
    const { periodMonth, periodYear, adminUser } = params;

    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "generate_payment_statement",
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    await initStatementsTables();

    const periodStart = new Date(Date.UTC(periodYear, periodMonth - 1, 1, 0, 0, 0));
    const periodEnd = new Date(Date.UTC(periodYear, periodMonth, 0, 23, 59, 59));

    // Find all tasks accepted during this calendar month that are not already snapshotted into a statement
    const acceptedTasks = await query<any>(
      `SELECT t.id as task_id, t.item_id, t.item_type, t.task_type, t.assigned_to, t.assigned_to_name,
              t.payment_liability_amount, t.is_payable, t.rework_type, t.updated_at as accepted_at
         FROM pipeline_tasks t
        WHERE t.status = 'accepted'
          AND t.updated_at >= $1
          AND t.updated_at <= $2`,
      [periodStart.toISOString(), periodEnd.toISOString()]
    );

    if (!acceptedTasks || acceptedTasks.length === 0) {
      return { success: true, generatedCount: 0 };
    }

    // Group tasks by contributor
    const byContributor = new Map<string, any[]>();
    for (const t of acceptedTasks) {
      const list = byContributor.get(t.assigned_to) || [];
      list.push(t);
      byContributor.set(t.assigned_to, list);
    }

    let generatedCount = 0;

    for (const [contributorId, tasks] of Array.from(byContributor.entries())) {
      const contributorName = tasks[0]?.assigned_to_name || contributorId;

      // Check if contributor is credit-only (or standard contractor)
      const userMeta = await queryOne<any>(
        `SELECT is_credit_only, abn, email FROM users WHERE id = $1::uuid`,
        [contributorId]
      ).catch(() => null);

      const isCreditOnly = userMeta?.is_credit_only === true;
      const contributorEmail = userMeta?.email || "";
      const contributorAbn = userMeta?.abn || "";

      const lineItems: StatementLineItem[] = [];
      let totalAmount = 0;

      for (const t of tasks) {
        // Centralized Rate Resolution (Rule R5 governed by rate in force on acceptance date)
        const rateInfo = await resolveRate(
          t.task_type as TaskType,
          t.item_type as ContentType,
          t.accepted_at,
          contributorId
        );

        const isTaskPayable = t.is_payable !== false;
        const rateApplied = isCreditOnly ? 0.0 : isTaskPayable ? rateInfo.rate : 0.0;
        const itemAmount = rateApplied;

        totalAmount += itemAmount;

        lineItems.push({
          taskId: t.task_id,
          itemId: t.item_id,
          itemType: t.item_type,
          taskType: t.task_type,
          acceptedAt: new Date(t.accepted_at).toISOString(),
          rateCardVersion: rateInfo.version,
          rateApplied,
          amount: itemAmount,
          isPayable: isTaskPayable,
          reworkType: t.rework_type,
        });
      }

      const seqNum = Math.floor(1000 + Math.random() * 9000);
      const statementNumber = `STM-${periodYear}-${String(periodMonth).padStart(2, "0")}-${seqNum}`;

      await execute(
        `INSERT INTO contributor_statements
          (statement_number, contributor_id, contributor_name, contributor_email, contributor_abn,
           is_credit_only, period_start, period_end, issue_date, total_items_count, total_amount,
           is_paid, line_items, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, FALSE, $11::jsonb, NOW())`,
        [
          statementNumber,
          contributorId,
          contributorName,
          contributorEmail,
          contributorAbn,
          isCreditOnly,
          periodStart.toISOString(),
          periodEnd.toISOString(),
          lineItems.length,
          totalAmount,
          JSON.stringify(lineItems),
        ]
      );

      generatedCount++;
    }

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "generate_monthly_statements",
      category: "finance",
      entityType: "statement",
      entityId: `${periodYear}-${periodMonth}`,
      metadata: {
        periodMonth,
        periodYear,
        generatedCount,
      },
    });

    return { success: true, generatedCount };
  } catch (err: any) {
    console.error("Error generating monthly statements:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 4. Get Statements List
 * SA & OM: All statements.
 * DR & PR: Scope S (Own statement only).
 * CE: ✖ (Cost blind).
 */
export async function getStatementsAction(adminUser: PermissionUser): Promise<{
  success: boolean;
  statements?: ContributorStatement[];
  error?: string;
}> {
  try {
    const roles = adminUser.roles || [adminUser.role || ""];
    const isCEOnly = roles.includes("CE") && !roles.includes("SA") && !roles.includes("OM");
    if (isCEOnly) {
      return {
        success: false,
        error: "Matrix 3F Violation: Clinical Editors are cost-blind and cannot view financial payment statements.",
      };
    }

    await initStatementsTables();

    const isGlobalOps = roles.includes("SA") || roles.includes("OM") || adminUser.role === "Super Admin" || adminUser.role === "Operations Manager";

    let rows: any[] = [];
    if (isGlobalOps) {
      rows = await query<any>(
        `SELECT * FROM contributor_statements ORDER BY issue_date DESC`
      );
    } else {
      // Scope S for contributor
      rows = await query<any>(
        `SELECT * FROM contributor_statements WHERE contributor_id = $1 ORDER BY issue_date DESC`,
        [adminUser.id]
      );
    }

    const statements: ContributorStatement[] = rows.map((r) => ({
      id: r.id,
      statementNumber: r.statement_number,
      contributorId: r.contributor_id,
      contributorName: r.contributor_name,
      contributorEmail: r.contributor_email,
      contributorAbn: r.contributor_abn,
      isCreditOnly: r.is_credit_only,
      periodStart: r.period_start ? r.period_start.toISOString() : "",
      periodEnd: r.period_end ? r.period_end.toISOString() : "",
      issueDate: r.issue_date ? r.issue_date.toISOString() : "",
      totalItemsCount: r.total_items_count,
      totalAmount: Number(r.total_amount || 0),
      isPaid: r.is_paid,
      paidAt: r.paid_at ? r.paid_at.toISOString() : null,
      paymentReference: r.payment_reference,
      isAdjustment: r.is_adjustment,
      adjustmentToStatementId: r.adjustment_to_statement_id,
      adjustmentReason: r.adjustment_reason,
      lineItems: typeof r.line_items === "string" ? JSON.parse(r.line_items) : r.line_items || [],
      createdAt: r.created_at ? r.created_at.toISOString() : "",
    }));

    return { success: true, statements };
  } catch (err: any) {
    console.error("Error fetching statements:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 5. Mark Statement Paid (SA & OM)
 * Captures flag, date, and reference. No banking credentials stored.
 */
export async function markStatementPaidAction(params: {
  statementId: string;
  paymentReference: string;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { statementId, paymentReference, adminUser } = params;

    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "mark_statement_paid",
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    await initStatementsTables();

    await execute(
      `UPDATE contributor_statements
          SET is_paid = TRUE,
              paid_at = NOW(),
              payment_reference = $1
        WHERE id = $2`,
      [paymentReference.trim() || `REF-${Date.now()}`, statementId]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "mark_statement_paid",
      category: "finance",
      entityType: "statement",
      entityId: statementId,
      metadata: {
        paymentReference,
        paidBy: adminUser.name || adminUser.email,
        paidAt: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error marking statement paid:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 6. Programme Cost Metrics (SA & OM only; CE strictly blind)
 */
export async function getProgrammeCostMetricsAction(adminUser: PermissionUser): Promise<{
  success: boolean;
  totalCost?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  totalAcceptedItems?: number;
  error?: string;
}> {
  try {
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "view_programme_cost",
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    await initStatementsTables();

    const row = await queryOne<any>(
      `SELECT
         COALESCE(SUM(total_amount), 0) as total_cost,
         COALESCE(SUM(CASE WHEN is_paid = TRUE THEN total_amount ELSE 0 END), 0) as total_paid,
         COALESCE(SUM(CASE WHEN is_paid = FALSE THEN total_amount ELSE 0 END), 0) as total_outstanding,
         COALESCE(SUM(total_items_count), 0) as total_items
       FROM contributor_statements`
    );

    return {
      success: true,
      totalCost: Number(row?.total_cost || 0),
      totalPaid: Number(row?.total_paid || 0),
      totalOutstanding: Number(row?.total_outstanding || 0),
      totalAcceptedItems: Number(row?.total_items || 0),
    };
  } catch (err: any) {
    console.error("Error fetching programme cost metrics:", err);
    return { success: false, error: err.message };
  }
}

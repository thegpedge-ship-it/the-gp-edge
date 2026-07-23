"use server";

import { query, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

export interface BillingStats {
  mrr: number;
  averageRevenuePerUser: string;
  stripeSuccessRate: string;
  pendingRefundsCount: number;
  annualPlanAdoptionPercent: number;
  activeSubscriptionsCount: number;
  annualSubCount: number;
  monthlySubCount: number;
}

export interface SubscriptionItem {
  id: string;
  user: string;
  plan: string;
  amount: string;
  status: "active" | "suspended" | "draft" | "review" | "published" | "failed" | "premium" | "free" | "pending" | "success" | "warning" | "archived";
  statusLabel: string;
  start: string;
  nextBilling: string;
}

export interface FailedPaymentItem {
  id: string;
  user: string;
  amount: string;
  date: string;
  reason: string;
  retries: number;
}

export interface RefundRequestItem {
  id: string;
  user: string;
  amount: string;
  reason: string;
  date: string;
  status: "pending" | "approved" | "denied";
  note?: string;
}

export interface RevenueChartItem {
  month: string;
  revenue: number;
}

export interface BillingPageData {
  stats: BillingStats;
  subscriptions: SubscriptionItem[];
  failedPayments: FailedPaymentItem[];
  monthlyRevenue: RevenueChartItem[];
  refunds: RefundRequestItem[];
}

/**
 * Main query action for retrieving billing page metrics and tables.
 */
export async function getAdminBillingDataAction(): Promise<BillingPageData> {
  try {

    // 2. Fetch Active Subscriptions
    const subRows = await query<any>(`
      SELECT s.id, s.status, s.cycle, s.current_period_start, s.current_period_end,
             p.name AS plan_name, p.price_monthly, p.price_annual,
             u.email, u.first_name, u.last_name
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        JOIN users u ON s.user_id = u.id
       WHERE u.deleted_at IS NULL
       ORDER BY s.created_at DESC
    `);

    // Map subscription rows to frontend interface
    const subscriptions: SubscriptionItem[] = subRows.map((row) => {
      const userName = row.first_name || row.last_name
        ? `${row.first_name || ""} ${row.last_name || ""}`.trim()
        : row.email;
      
      const amountStr = row.cycle === "annual"
        ? `$${Number(row.price_annual).toFixed(0)}/yr`
        : `$${Number(row.price_monthly).toFixed(0)}/mo`;

      const startStr = row.current_period_start
        ? new Date(row.current_period_start).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "N/A";

      const nextBillingStr = row.current_period_end
        ? new Date(row.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "N/A";

      // Map DB enum: trialing, active, past_due, canceled, expired
      let variant: SubscriptionItem["status"] = "active";
      let statusLabel = "Active";

      if (row.status === "trialing") {
        variant = "success";
        statusLabel = "Trialing";
      } else if (row.status === "past_due") {
        variant = "warning";
        statusLabel = "Past Due";
      } else if (row.status === "canceled") {
        variant = "suspended";
        statusLabel = "Canceled";
      } else if (row.status === "expired") {
        variant = "archived";
        statusLabel = "Expired";
      }

      return {
        id: row.id,
        user: userName,
        plan: row.plan_name,
        amount: amountStr,
        status: variant,
        statusLabel,
        start: startStr,
        nextBilling: nextBillingStr,
      };
    });

    // 3. Fetch Failed Payments
    const failedRows = await query<any>(`
      SELECT p.id, p.amount, p.created_at,
             u.email, u.first_name, u.last_name
        FROM payments p
        JOIN users u ON p.user_id = u.id
       WHERE p.status = 'failed' AND u.deleted_at IS NULL
       ORDER BY p.created_at DESC
    `);

    const failedPayments: FailedPaymentItem[] = failedRows.map((row) => {
      const userName = row.first_name || row.last_name
        ? `${row.first_name || ""} ${row.last_name || ""}`.trim()
        : row.email;

      const dateStr = new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

      return {
        id: row.id,
        user: userName,
        amount: `$${Number(row.amount).toFixed(2)}`,
        date: dateStr,
        reason: "Card declined",
        retries: 1, // Defaulting retry count
      };
    });

    // 4. Fetch Refunds
    const refundRows = await query<any>(`
      SELECT r.id, r.amount, r.reason, r.status, r.created_at,
             u.email, u.first_name, u.last_name
        FROM refunds r
        JOIN payments p ON r.payment_id = p.id
        JOIN users u ON p.user_id = u.id
       WHERE u.deleted_at IS NULL
       ORDER BY r.created_at DESC
    `);

    const refunds: RefundRequestItem[] = refundRows.map((row) => {
      const userName = row.first_name || row.last_name
        ? `${row.first_name || ""} ${row.last_name || ""}`.trim()
        : row.email;

      const dateStr = new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

      // Map DB enum: pending, succeeded, failed
      let status: RefundRequestItem["status"] = "pending";
      if (row.status === "succeeded") {
        status = "approved";
      } else if (row.status === "failed") {
        status = "denied";
      }

      return {
        id: row.id,
        user: userName,
        amount: `$${Number(row.amount).toFixed(2)}`,
        reason: row.reason || "Refund requested",
        date: dateStr,
        status,
        note: row.reason,
      };
    });

    // 5. Fetch Succeeded Payments for Revenue Graph (last 5 months)
    const revenueRows = await query<any>(`
      SELECT TO_CHAR(paid_at, 'Mon') AS month,
             SUM(amount) AS revenue,
             DATE_TRUNC('month', paid_at) AS month_date
        FROM payments
       WHERE status = 'succeeded' AND paid_at IS NOT NULL
       GROUP BY DATE_TRUNC('month', paid_at), TO_CHAR(paid_at, 'Mon')
       ORDER BY month_date ASC
    `);

    // Prepare chronological list of last 5 months
    const monthlyRevenue: RevenueChartItem[] = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString("en-US", { month: "short" });
      monthlyRevenue.push({ month: monthName, revenue: 0 });
    }

    // Populate actual revenues
    for (const row of revenueRows) {
      const match = monthlyRevenue.find((m) => m.month.toLowerCase() === row.month.trim().toLowerCase());
      if (match) {
        match.revenue = Number(row.revenue);
      }
    }

    // 6. Aggregate KPIs
    // Calculate MRR
    const activeSubs = await query<any>(`
      SELECT s.cycle, p.price_monthly, p.price_annual
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
       WHERE s.status IN ('active', 'trialing')
    `);

    let mrr = 0;
    for (const sub of activeSubs) {
      if (sub.cycle === "monthly") {
        mrr += Number(sub.price_monthly || 0);
      } else if (sub.cycle === "annual") {
        mrr += Number(sub.price_annual || 0) / 12;
      }
    }

    // Subscription counts
    const activeSubscriptionsCount = activeSubs.length;
    
    const annualSubCount = activeSubs.filter(sub => sub.cycle === "annual").length;
    const monthlySubCount = activeSubs.filter(sub => sub.cycle === "monthly").length;

    // Annual Plan Adoption percentage
    const annualPlanAdoptionPercent = activeSubscriptionsCount > 0
      ? Math.round((annualSubCount / activeSubscriptionsCount) * 100)
      : 0;

    // Pending refunds
    const pendingRefundsCount = refunds.filter(r => r.status === "pending").length;

    // Average Revenue Per User (ARPU)
    const arpuRow = await queryOne<{ total: string; users: string }>(`
      SELECT SUM(amount) AS total, COUNT(DISTINCT user_id) AS users 
        FROM payments 
       WHERE status = 'succeeded'
    `);
    const totalRev = Number(arpuRow?.total || 0);
    const uniqueUsers = Number(arpuRow?.users || 0);
    const averageRevenuePerUser = uniqueUsers > 0
      ? `$${(totalRev / uniqueUsers).toFixed(2)}`
      : "$0.00";

    // Stripe Success Rate
    const rateRow = await queryOne<{ succeeded: string; failed: string }>(`
      SELECT COUNT(*) FILTER (WHERE status = 'succeeded') AS succeeded,
             COUNT(*) FILTER (WHERE status = 'failed') AS failed
        FROM payments
    `);
    const succeededCount = Number(rateRow?.succeeded || 0);
    const failedCount = Number(rateRow?.failed || 0);
    const totalAttempts = succeededCount + failedCount;
    const stripeSuccessRate = totalAttempts > 0
      ? `${((succeededCount / totalAttempts) * 100).toFixed(1)}%`
      : "100%";

    const stats: BillingStats = {
      mrr,
      averageRevenuePerUser,
      stripeSuccessRate,
      pendingRefundsCount,
      annualPlanAdoptionPercent,
      activeSubscriptionsCount,
      annualSubCount,
      monthlySubCount,
    };

    return {
      stats,
      subscriptions,
      failedPayments,
      monthlyRevenue,
      refunds,
    };
  } catch (err) {
    console.error("Error executing getAdminBillingDataAction:", err);
    throw err;
  }
}

/**
 * Server action to process (approve / deny) a pending refund.
 */
export async function updateRefundStatusAction(
  refundId: string,
  action: "approve" | "deny",
  note: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const status = action === "approve" ? "succeeded" : "failed";
    const processedAt = new Date();

    // 1. Update refund status
    await execute(
      `UPDATE refunds 
          SET status = $1::refund_status, reason = $2, processed_at = $3
        WHERE id = $4`,
      [status, note, processedAt, refundId]
    );

    // 2. If approved, transition the related payment's status to 'refunded'
    if (action === "approve") {
      const refund = await queryOne<{ payment_id: string }>(
        `SELECT payment_id FROM refunds WHERE id = $1`,
        [refundId]
      );
      if (refund?.payment_id) {
        await execute(
          `UPDATE payments 
              SET status = 'refunded', paid_at = NOW() 
            WHERE id = $1`,
          [refund.payment_id]
        );
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error processing refund status update:", error);
    return { success: false, error: error.message || "Failed to update refund status in database." };
  }
}


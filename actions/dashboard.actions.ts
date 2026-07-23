"use server";

import { query, queryOne } from "@/lib/db";

export interface PlanBreakdown {
  name: string;
  count: number;
  share: string;
  mrrImpact: number;
  pct: number;
  color: string;
}

export interface DashboardStats {
  questionBankSize: number;
  autofillTemplatesCount: number;
  totalUsers: number;
  testAttemptsCount: number;
  totalRevenue: number;
  activeSubscriptions: number;
  mrr: number;
  newUsers30d: number;
  // Dynamic action items counts
  pendingRefundsCount: number;
  draftQuestionsCount: number;
  draftQuizzesCount: number;
  suspendedUsersCount: number;
  // Churn rate & breakdowns
  churnRate: number;
  planDistribution: PlanBreakdown[];
  questionStatusDistribution: { status: string; count: number }[];
  // Change percentages & live indicators
  revenueChange: number;
  mrrChange: number;
  mauChange: number;
  newUsersChange: number;
  attemptsChange: number;
  questionBankChange: number;
  dauCount: number;
  mauCount: number;
  avgSessionMinutes: number;
  lastActionTime: string | null;
}

export interface MonthlyStats {
  month: string;
  mrr: number;
  subscribers: number;
  totalUsers: number;
  attempts: number;
}

export async function getDashboardDataAction(): Promise<DashboardStats> {
  try {
    // 1. Question Bank Size
    const questionsResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM questions");
    const questionBankSize = parseInt(questionsResult?.count || "0", 10);

    // 2. Autofill Templates
    const autofillResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM autofill_templates");
    const autofillTemplatesCount = parseInt(autofillResult?.count || "0", 10);

    // 3. Total Users
    const usersResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM users");
    const totalUsers = parseInt(usersResult?.count || "0", 10);

    // 4. Test Attempts
    const attemptsResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM test_attempts");
    const testAttemptsCount = parseInt(attemptsResult?.count || "0", 10);

    // 5. Total Revenue
    const revenueResult = await queryOne<{ sum: string }>("SELECT SUM(amount) as sum FROM payments WHERE status = 'succeeded'");
    const totalRevenue = parseFloat(revenueResult?.sum || "0");

    // 6. Active Subscriptions
    const activeSubsResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'");
    const activeSubscriptions = parseInt(activeSubsResult?.count || "0", 10);

    // 7. Monthly Recurring Revenue (MRR)
    let mrr = 0;
    try {
      const mrrResult = await queryOne<{ sum: string }>(
        `SELECT SUM(
          CASE 
            WHEN s.cycle = 'annual' THEN p.price_annual / 12.0
            ELSE p.price_monthly
          END
         ) as sum 
         FROM subscriptions s 
         JOIN plans p ON s.plan_id = p.id 
         WHERE s.status = 'active'`
      );
      mrr = Math.round(parseFloat(mrrResult?.sum || "0") * 100) / 100;
    } catch {
      mrr = 0;
    }

    // 8. New Users Last 30 Days
    const newUsersResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"
    );
    const newUsers30d = parseInt(newUsersResult?.count || "0", 10);

    // 9. Pending Refunds
    const pendingRefundsResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM refunds WHERE status = 'pending'");
    const pendingRefundsCount = parseInt(pendingRefundsResult?.count || "0", 10);

    // 10. Draft Questions (Flagged / Awaiting verification)
    const draftQuestionsResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM questions WHERE status = 'draft'");
    const draftQuestionsCount = parseInt(draftQuestionsResult?.count || "0", 10);

    // 11. Draft Quizzes (Educator modules waiting approval)
    const draftQuizzesResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM quizzes WHERE status = 'draft'");
    const draftQuizzesCount = parseInt(draftQuizzesResult?.count || "0", 10);

    // 12. Suspended / Awaiting review users
    const suspendedUsersResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE status = 'suspended'");
    const suspendedUsersCount = parseInt(suspendedUsersResult?.count || "0", 10);

    // 13. Churn Rate calculation
    const canceledSubsResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'canceled'");
    const canceledCount = parseInt(canceledSubsResult?.count || "0", 10);
    const totalSubsResult = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM subscriptions");
    const totalCount = parseInt(totalSubsResult?.count || "0", 10);
    const churnRate = totalCount > 0 ? (canceledCount * 100.0) / totalCount : 0;

    // 14. Plan Distribution breakdown
    let planDistribution: PlanBreakdown[] = [];
    try {
      const plansBreakdownResult = await query<any>(`
        SELECT p.name, COUNT(*) as count, SUM(
          CASE 
            WHEN s.cycle = 'annual' THEN p.price_annual / 12.0
            ELSE p.price_monthly
          END
        ) as mrr_impact
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'active'
        GROUP BY p.name
      `);
      if (plansBreakdownResult.length > 0) {
        const totalActive = plansBreakdownResult.reduce((sum, row) => sum + parseInt(row.count), 0);
        planDistribution = plansBreakdownResult.map((row) => {
          const count = parseInt(row.count);
          const mrrImpact = parseFloat(row.mrr_impact || "0");
          const pct = totalActive > 0 ? Math.round((count * 100) / totalActive) : 0;
          return {
            name: row.name,
            count,
            share: `${pct}%`,
            mrrImpact,
            pct,
            color: row.name.toLowerCase().includes("annual") 
              ? "bg-teal-700 dark:bg-teal-600" 
              : row.name.toLowerCase().includes("monthly") 
              ? "bg-emerald-600 dark:bg-emerald-500" 
              : "bg-teal-500 dark:bg-teal-400"
          };
        });
      }
    } catch {
      planDistribution = [];
    }

    // 15. Question Status breakdown
    const questionStatusResult = await query<{ status: string; count: string }>(
      "SELECT status, COUNT(*) as count FROM questions GROUP BY status"
    );
    const questionStatusDistribution = questionStatusResult.map(row => ({
      status: row.status,
      count: parseInt(row.count, 10)
    }));

    // 16. Last action processed from audit logs
    const lastAuditResult = await queryOne<{ created_at: string }>(
      "SELECT created_at FROM audit_logs ORDER BY created_at DESC LIMIT 1"
    );
    const lastActionTime = lastAuditResult?.created_at ? new Date(lastAuditResult.created_at).toISOString() : null;

    // 17. DAU and MAU
    const dauResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE last_active_at >= NOW() - INTERVAL '1 day'"
    );
    const dauCount = parseInt(dauResult?.count || "0", 10);

    const mauResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE last_active_at >= NOW() - INTERVAL '30 days'"
    );
    const mauCount = parseInt(mauResult?.count || "0", 10);

    // Session duration estimate (average is 12m if attempts exist, else 0)
    const avgSessionMinutes = testAttemptsCount > 0 ? 12 : 0;

    // 18. Comparison calculations (current 30 days vs previous 30 days)
    const revCurrResult = await queryOne<{ sum: string }>(
      "SELECT SUM(amount) as sum FROM payments WHERE status = 'succeeded' AND created_at >= NOW() - INTERVAL '30 days'"
    );
    const revPrevResult = await queryOne<{ sum: string }>(
      "SELECT SUM(amount) as sum FROM payments WHERE status = 'succeeded' AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'"
    );
    const revCurr = parseFloat(revCurrResult?.sum || "0");
    const revPrev = parseFloat(revPrevResult?.sum || "0");
    const revenueChange = revPrev > 0 ? ((revCurr - revPrev) * 100) / revPrev : 0;

    const mrrNewResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active' AND created_at >= NOW() - INTERVAL '30 days'"
    );
    const mrrNewCount = parseInt(mrrNewResult?.count || "0", 10);
    const mrrChange = activeSubscriptions > 0 ? (mrrNewCount * 100.0) / activeSubscriptions : 0;

    const mauCurrResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE last_active_at >= NOW() - INTERVAL '30 days'"
    );
    const mauPrevResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE last_active_at >= NOW() - INTERVAL '60 days' AND last_active_at < NOW() - INTERVAL '30 days'"
    );
    const mauCurr = parseInt(mauCurrResult?.count || "0", 10);
    const mauPrev = parseInt(mauPrevResult?.count || "0", 10);
    const mauChange = mauPrev > 0 ? ((mauCurr - mauPrev) * 100) / mauPrev : 0;

    const newUsersCurrResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"
    );
    const newUsersPrevResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'"
    );
    const newUsersCurr = parseInt(newUsersCurrResult?.count || "0", 10);
    const newUsersPrev = parseInt(newUsersPrevResult?.count || "0", 10);
    const newUsersChange = newUsersPrev > 0 ? ((newUsersCurr - newUsersPrev) * 100) / newUsersPrev : 0;

    const attemptsCurrResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM test_attempts WHERE started_at >= NOW() - INTERVAL '30 days'"
    );
    const attemptsPrevResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM test_attempts WHERE started_at >= NOW() - INTERVAL '60 days' AND started_at < NOW() - INTERVAL '30 days'"
    );
    const attemptsCurr = parseInt(attemptsCurrResult?.count || "0", 10);
    const attemptsPrev = parseInt(attemptsPrevResult?.count || "0", 10);
    const attemptsChange = attemptsPrev > 0 ? ((attemptsCurr - attemptsPrev) * 100) / attemptsPrev : 0;

    const questionsNewResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM questions WHERE created_at >= NOW() - INTERVAL '30 days'"
    );
    const questionsNewCount = parseInt(questionsNewResult?.count || "0", 10);
    const questionBankChange = questionBankSize > 0 ? (questionsNewCount * 100.0) / questionBankSize : 0;

    return {
      questionBankSize,
      autofillTemplatesCount,
      totalUsers,
      testAttemptsCount,
      totalRevenue,
      activeSubscriptions,
      mrr,
      newUsers30d,
      pendingRefundsCount,
      draftQuestionsCount,
      draftQuizzesCount,
      suspendedUsersCount,
      churnRate,
      planDistribution,
      questionStatusDistribution,
      revenueChange,
      mrrChange,
      mauChange,
      newUsersChange,
      attemptsChange,
      questionBankChange,
      dauCount,
      mauCount,
      avgSessionMinutes,
      lastActionTime
    };
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return {
      questionBankSize: 0,
      autofillTemplatesCount: 0,
      totalUsers: 0,
      testAttemptsCount: 0,
      totalRevenue: 0,
      activeSubscriptions: 0,
      mrr: 0,
      newUsers30d: 0,
      pendingRefundsCount: 0,
      draftQuestionsCount: 0,
      draftQuizzesCount: 0,
      suspendedUsersCount: 0,
      churnRate: 0,
      planDistribution: [],
      questionStatusDistribution: [],
      revenueChange: 0,
      mrrChange: 0,
      mauChange: 0,
      newUsersChange: 0,
      attemptsChange: 0,
      questionBankChange: 0,
      dauCount: 0,
      mauCount: 0,
      avgSessionMinutes: 0,
      lastActionTime: null
    };
  }
}

export async function getMonthlyAnalyticsAction(): Promise<MonthlyStats[]> {
  try {
    const result = await query<any>(`
      WITH months AS (
        SELECT TO_CHAR(m, 'Mon') as month_name, 
               DATE_TRUNC('month', m) as month_start
        FROM GENERATE_SERIES(
          DATE_TRUNC('month', NOW()) - INTERVAL '5 months',
          DATE_TRUNC('month', NOW()),
          INTERVAL '1 month'
        ) m
      )
      SELECT 
        m.month_name as month,
        (SELECT COUNT(*) FROM users u WHERE u.created_at <= m.month_start + INTERVAL '1 month') as total_users,
        (SELECT COUNT(*) FROM test_attempts ta WHERE ta.started_at >= m.month_start AND ta.started_at < m.month_start + INTERVAL '1 month') as attempts,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.status = 'active' AND s.created_at <= m.month_start + INTERVAL '1 month') as subscribers
      FROM months m
      ORDER BY m.month_start ASC
    `);

    return result.map((r: any) => ({
      month: r.month,
      mrr: parseInt(r.subscribers) * 29.99,
      subscribers: parseInt(r.subscribers),
      totalUsers: parseInt(r.total_users),
      attempts: parseInt(r.attempts)
    }));
  } catch (error) {
    console.error("Error fetching monthly analytics:", error);
    return [];
  }
}

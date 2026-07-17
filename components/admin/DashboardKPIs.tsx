"use client";

import { motion } from "framer-motion";

interface Segment {
  label: string;
  flex: number;
  color: string;
}

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  trendPositive: boolean;
  timeframeText: string;
  rangeText: string;
  segments: Segment[];
}

function KPICard({ title, value, change, trend, trendPositive, timeframeText, rangeText, segments }: KPICardProps) {
  const hasCurrency = value ? value.startsWith("$") : false;
  const displayValue = hasCurrency ? value.slice(1) : value;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }
      }}
      className="p-[22px_24px_18px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-[0_1px_1px_rgba(14,17,22,0.04),0_20px_40px_-24px_rgba(14,17,22,0.18)] dark:shadow-none hover:shadow-md transition-all duration-300 w-full flex flex-col justify-between"
    >
      <div>
        {/* HEADER */}
        <header className="flex items-center justify-between mb-3 select-none">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
            <svg 
              className="w-3.5 h-3.5 text-slate-450 dark:text-slate-505" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              aria-hidden="true"
            >
              <rect width={20} height={12} x={2} y={6} rx={2} />
              <circle cx={12} cy={12} r={2} />
              <path d="M6 12h.01" />
              <path d="M18 12h.01" />
            </svg>
            {title}
          </span>
          <span className="h-6 px-2.5 inline-grid place-items-center bg-[#f3f6fa] dark:bg-slate-950 border border-[#eef2f6] dark:border-slate-805 rounded-full text-[10px] font-semibold text-slate-500 dark:text-slate-450">
            {rangeText}
          </span>
        </header>

        {/* VALUE */}
        <div className="font-sans font-bold text-3.5xl lg:text-4xl tracking-tight leading-none text-slate-900 dark:text-slate-50 tabular-nums">
          {hasCurrency && (
            <span className="text-xl lg:text-2xl font-semibold text-slate-400 dark:text-slate-550 mr-0.5 select-none">
              $
            </span>
          )}
          {displayValue}
        </div>

        {/* DELTA */}
        <div className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold ${
          trendPositive 
            ? "text-[#2bc48a] dark:text-emerald-450" 
            : "text-rose-500 dark:text-rose-450"
        }`}>
          <svg 
            className={`w-3.5 h-3.5 ${trend === "down" ? "rotate-180" : ""}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            aria-hidden="true"
          >
            <path d="m7 17 5-5 5 5" />
            <path d="M7 7h10v10" />
          </svg>
          {change} vs. last {timeframeText}
        </div>

        {/* PROGRESS BAR */}
        <div className="flex h-2 mt-4.5 rounded-full overflow-hidden bg-[#f3f6fa] dark:bg-slate-950/80" aria-hidden="true">
          {segments.map((seg, idx) => {
            const isStriped = seg.color.startsWith("repeating");
            return (
              <span 
                key={idx}
                className="h-full"
                style={{ 
                  flex: seg.flex,
                  background: isStriped ? seg.color : undefined,
                  backgroundColor: isStriped ? undefined : seg.color
                }} 
              />
            );
          })}
        </div>
      </div>

      {/* LEGEND */}
      <footer className="flex gap-3.5 mt-4 text-[11px] font-semibold text-slate-500 dark:text-slate-450 flex-wrap select-none">
        {segments.map((seg, idx) => {
          const isStriped = seg.color.startsWith("repeating");
          return (
            <span key={idx} className="inline-flex items-center gap-1.5">
              <i 
                className="w-2 h-2 rounded-full inline-block" 
                style={{ 
                  background: isStriped ? "repeating-linear-gradient(135deg, #e3e8ee 0 2px, #94a3b8 2px 4px)" : seg.color 
                }} 
              />
              {seg.label}
            </span>
          );
        })}
      </footer>
    </motion.div>
  );
}

interface PlanBreakdown {
  name: string;
  count: number;
  share: string;
  mrrImpact: number;
  pct: number;
  color: string;
}

interface DashboardStats {
  questionBankSize: number;
  autofillTemplatesCount: number;
  totalUsers: number;
  testAttemptsCount: number;
  totalRevenue: number;
  activeSubscriptions: number;
  mrr: number;
  newUsers30d: number;
  churnRate: number;
  planDistribution: PlanBreakdown[];
  questionStatusDistribution: { status: string; count: number }[];
  revenueChange: number;
  mrrChange: number;
  mauChange: number;
  newUsersChange: number;
  attemptsChange: number;
  questionBankChange: number;
}

interface DashboardKPIsProps {
  timeframe: string;
  stats: DashboardStats | null;
}

export function DashboardKPIs({ timeframe, stats }: DashboardKPIsProps) {
  const tfSuffix = timeframe === "7d" ? "week" : timeframe === "90d" ? "quarter" : "month";
  const rangeLabel = timeframe === "7d" ? "7 days" : timeframe === "90d" ? "90 days" : "30 days";

  // Use live stats if loaded, otherwise fall back to 0
  const revenueValue = stats ? `$${stats.totalRevenue.toLocaleString()}` : "$0";
  const mrrValue = stats ? `$${stats.mrr.toLocaleString()}` : "$0";
  const activeUsersValue = stats ? stats.totalUsers.toLocaleString() : "0";
  const newUsersValue = stats ? `+${stats.newUsers30d}` : "+0";
  const questionBankValue = stats ? stats.questionBankSize.toLocaleString() : "0";
  const attemptsValue = stats ? stats.testAttemptsCount.toLocaleString() : "0";

  // Formatted change strings
  const formatChange = (val: number) => {
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  const revenueChangeStr = stats ? formatChange(stats.revenueChange) : "0.0%";
  const mrrChangeStr = stats ? formatChange(stats.mrrChange) : "0.0%";
  const mauChangeStr = stats ? formatChange(stats.mauChange) : "0.0%";
  const newUsersChangeStr = stats ? formatChange(stats.newUsersChange) : "0.0%";
  const attemptsChangeStr = stats ? formatChange(stats.attemptsChange) : "0.0%";
  const questionBankChangeStr = stats ? formatChange(stats.questionBankChange) : "0.0%";

  // Conversion rate value and change
  const conversionRateValue = (stats && stats.totalUsers > 0) 
    ? `${((stats.activeSubscriptions * 100) / stats.totalUsers).toFixed(1)}%` 
    : "0.0%";
  const conversionChangeStr = stats && stats.totalUsers > 0 
    ? formatChange(((stats.activeSubscriptions * 100) / stats.totalUsers) - 0)
    : "0.0%";

  // Churn calculations
  const churnValue = stats ? `${stats.churnRate.toFixed(1)}%` : "2.3%";
  const retainedPct = stats ? Math.round(100 - stats.churnRate) : 98;
  const churnedPct = stats ? Math.round(stats.churnRate) : 2;

  // Dynamic segments for Total Revenue and Monthly Recurring Revenue based on plan distribution
  const revenueSegments = (stats && stats.planDistribution.length > 0) ? stats.planDistribution.map(p => ({
    label: p.name,
    flex: p.pct,
    color: p.color.includes("teal") ? "#0f766e" : p.color.includes("emerald") ? "#059669" : "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)"
  })) : [
    { label: "Direct", flex: 100, color: "#0f766e" }
  ];

  // Dynamic segments for Active Users based on premium subscriptions
  const totalUsersCount = stats ? stats.totalUsers : 0;
  const activeSubsCount = stats ? stats.activeSubscriptions : 0;
  const trialCount = Math.max(0, totalUsersCount - activeSubsCount);
  const activeUsersSegments = (stats && totalUsersCount > 0) ? [
    { label: "Premium", flex: Math.round((activeSubsCount * 100) / totalUsersCount), color: "#0f766e" },
    { label: "Trial/Free", flex: Math.max(1, Math.round((trialCount * 100) / totalUsersCount)), color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
  ] : [
    { label: "Basic", flex: 100, color: "#0f766e" }
  ];

  // Dynamic segments for Conversion Rate based on active subscriptions
  const conversionPct = (stats && stats.totalUsers > 0) ? Math.round((stats.activeSubscriptions * 100) / stats.totalUsers) : 0;
  const conversionSegments = (stats && stats.totalUsers > 0) ? [
    { label: "Premium", flex: conversionPct, color: "#0f766e" },
    { label: "Trial/Free", flex: Math.max(1, Math.round(100 - conversionPct)), color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
  ] : [
    { label: "Organic", flex: 100, color: "#0f766e" }
  ];

  // Calculate dynamic segments percentages if stats is loaded
  const totalQuestions = stats?.questionStatusDistribution.reduce((sum, q) => sum + q.count, 0) || 0;
  const questionsSegments = (stats && stats.questionStatusDistribution.length > 0 && totalQuestions > 0) ? stats.questionStatusDistribution.map(q => {
    const pct = Math.round((q.count * 100) / totalQuestions);
    return {
      label: q.status.charAt(0).toUpperCase() + q.status.slice(1),
      flex: pct,
      color: q.status === "published" ? "#0f766e" : q.status === "draft" ? "#059669" : "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)"
    };
  }) : [
    { label: "Published", flex: 60, color: "#0f766e" },
    { label: "Draft", flex: 25, color: "#059669" },
    { label: "In Review", flex: 15, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
  ];

  const kpis: KPICardProps[] = [
    {
      title: "Total Revenue",
      value: revenueValue,
      change: revenueChangeStr,
      trend: stats && stats.revenueChange >= 0 ? "up" : "down",
      trendPositive: stats ? stats.revenueChange >= 0 : true,
      timeframeText: tfSuffix,
      rangeText: rangeLabel,
      segments: revenueSegments
    },
    {
      title: "Monthly Recurring Revenue",
      value: mrrValue,
      change: mrrChangeStr,
      trend: stats && stats.mrrChange >= 0 ? "up" : "down",
      trendPositive: stats ? stats.mrrChange >= 0 : true,
      timeframeText: tfSuffix,
      rangeText: rangeLabel,
      segments: revenueSegments
    },
    {
      title: "Active Users (MAU)",
      value: activeUsersValue,
      change: mauChangeStr,
      trend: stats && stats.mauChange >= 0 ? "up" : "down",
      trendPositive: stats ? stats.mauChange >= 0 : true,
      timeframeText: tfSuffix,
      rangeText: rangeLabel,
      segments: activeUsersSegments
    },
    {
      title: "New User Growth",
      value: newUsersValue,
      change: newUsersChangeStr,
      trend: stats && stats.newUsersChange >= 0 ? "up" : "down",
      trendPositive: stats ? stats.newUsersChange >= 0 : true,
      timeframeText: tfSuffix,
      rangeText: rangeLabel,
      segments: [
        { label: "Organic", flex: 100, color: "#0f766e" }
      ]
    },
    {
      title: "Conversion Rate",
      value: conversionRateValue,
      change: conversionChangeStr,
      trend: stats && stats.activeSubscriptions > 0 ? "up" : "down",
      trendPositive: stats ? stats.activeSubscriptions > 0 : true,
      timeframeText: tfSuffix,
      rangeText: "Ratio",
      segments: conversionSegments
    },
    {
      title: "Churn Rate",
      value: churnValue,
      change: stats && stats.churnRate > 0 ? "+0.0%" : "-0.0%",
      trend: stats && stats.churnRate > 0 ? "up" : "down",
      trendPositive: stats ? stats.churnRate <= 2.3 : true,
      timeframeText: tfSuffix,
      rangeText: rangeLabel,
      segments: [
        { label: "Retained", flex: retainedPct, color: "#0f766e" },
        { label: "Churned", flex: churnedPct, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
      ]
    },
    {
      title: "Question Bank Size",
      value: questionBankValue,
      change: questionBankChangeStr,
      trend: stats && stats.questionBankChange >= 0 ? "up" : "down",
      trendPositive: stats ? stats.questionBankChange >= 0 : true,
      timeframeText: tfSuffix,
      rangeText: "Questions",
      segments: questionsSegments
    },
    {
      title: "Test Attempts",
      value: attemptsValue,
      change: attemptsChangeStr,
      trend: stats && stats.attemptsChange >= 0 ? "up" : "down",
      trendPositive: stats ? stats.attemptsChange >= 0 : true,
      timeframeText: tfSuffix,
      rangeText: "Attempts",
      segments: [
        { label: "Completed", flex: 80, color: "#0f766e" },
        { label: "In Progress", flex: 20, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
      ]
    }
  ];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.03
          }
        }
      }}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {kpis.map((kpi, idx) => (
        <KPICard key={idx} {...kpi} />
      ))}
    </motion.div>
  );
}

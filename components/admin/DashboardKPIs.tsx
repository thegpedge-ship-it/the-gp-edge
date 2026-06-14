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

interface DashboardKPIsProps {
  timeframe: string;
}

export function DashboardKPIs({ timeframe }: DashboardKPIsProps) {
  const tfSuffix = timeframe === "7d" ? "week" : timeframe === "90d" ? "quarter" : "month";
  const rangeLabel = timeframe === "7d" ? "7 days" : timeframe === "90d" ? "90 days" : "30 days";

  const kpis: KPICardProps[] = [
    {
      title: "Total Revenue",
      value: timeframe === "7d" ? "$18,450" : timeframe === "90d" ? "$228,900" : "$75,300",
      change: "34.2%",
      trend: "up",
      trendPositive: true,
      timeframeText: tfSuffix,
      rangeText: rangeLabel,
      segments: [
        { label: "Annual", flex: 54, color: "#0f766e" },
        { label: "Monthly", flex: 33, color: "#059669" },
        { label: "Basic", flex: 13, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
      ]
    },
    {
      title: "Monthly Recurring Revenue",
      value: "$17,100",
      change: "18.0%",
      trend: "up",
      trendPositive: true,
      timeframeText: tfSuffix,
      rangeText: rangeLabel,
      segments: [
        { label: "Annual", flex: 54, color: "#0f766e" },
        { label: "Monthly", flex: 33, color: "#059669" },
        { label: "Basic", flex: 13, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
      ]
    },
    {
      title: "Active Users (MAU)",
      value: timeframe === "7d" ? "8,420" : timeframe === "90d" ? "14,120" : "12,847",
      change: "8.5%",
      trend: "up",
      trendPositive: true,
      timeframeText: tfSuffix,
      rangeText: rangeLabel,
      segments: [
        { label: "Premium", flex: 65, color: "#0f766e" },
        { label: "Trial", flex: 25, color: "#0d9488" },
        { label: "Guest", flex: 10, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
      ]
    },
    {
      title: "New User Growth",
      value: timeframe === "7d" ? "+284" : timeframe === "90d" ? "+3,180" : "+1,107",
      change: "12.4%",
      trend: "up",
      trendPositive: true,
      timeframeText: tfSuffix,
      rangeText: rangeLabel,
      segments: [
        { label: "Organic", flex: 50, color: "#0f766e" },
        { label: "Referral", flex: 30, color: "#059669" },
        { label: "Campaign", flex: 20, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
      ]
    },
    {
      title: "Conversion Rate",
      value: "18.4%",
      change: "1.2%",
      trend: "up",
      trendPositive: true,
      timeframeText: tfSuffix,
      rangeText: "Ratio",
      segments: [
        { label: "Converted", flex: 18, color: "#0f766e" },
        { label: "Trial Active", flex: 67, color: "#059669" },
        { label: "Dropped", flex: 15, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
      ]
    },
    {
      title: "Churn Rate",
      value: "2.3%",
      change: "-0.5%",
      trend: "down",
      trendPositive: true, // Churn rate drop is positive
      timeframeText: tfSuffix,
      rangeText: rangeLabel,
      segments: [
        { label: "Retained", flex: 98, color: "#0f766e" },
        { label: "Churned", flex: 2, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
      ]
    },
    {
      title: "Question Bank Size",
      value: timeframe === "7d" ? "4,792" : timeframe === "90d" ? "4,847" : "4,847",
      change: "8.2%",
      trend: "up",
      trendPositive: true,
      timeframeText: tfSuffix,
      rangeText: "Questions",
      segments: [
        { label: "Published", flex: 60, color: "#0f766e" },
        { label: "Draft", flex: 25, color: "#059669" },
        { label: "In Review", flex: 15, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
      ]
    },
    {
      title: "Autofill Templates",
      value: timeframe === "7d" ? "142" : timeframe === "90d" ? "156" : "156",
      change: "5.4%",
      trend: "up",
      trendPositive: true,
      timeframeText: tfSuffix,
      rangeText: "Templates",
      segments: [
        { label: "Published", flex: 75, color: "#0f766e" },
        { label: "Draft", flex: 15, color: "#059669" },
        { label: "In Review", flex: 10, color: "repeating-linear-gradient(135deg, #e3e8ee 0 4px, transparent 4px 8px)" }
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

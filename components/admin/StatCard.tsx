"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  icon: React.ReactNode;
  accentColor?: "teal" | "emerald" | "amber" | "red" | "violet" | "slate";
}

const accentMap = {
  teal: { iconBg: "bg-teal-100 dark:bg-teal-500/20", iconText: "text-teal-600 dark:text-teal-400", bar: "from-teal-400 to-teal-500" },
  emerald: { iconBg: "bg-emerald-100 dark:bg-emerald-500/20", iconText: "text-emerald-600 dark:text-emerald-400", bar: "from-emerald-400 to-emerald-500" },
  amber: { iconBg: "bg-amber-100 dark:bg-amber-500/20", iconText: "text-amber-600 dark:text-amber-400", bar: "from-amber-400 to-amber-500" },
  red: { iconBg: "bg-red-100 dark:bg-red-500/20", iconText: "text-red-600 dark:text-red-400", bar: "from-red-400 to-red-500" },
  violet: { iconBg: "bg-violet-100 dark:bg-violet-500/20", iconText: "text-violet-600 dark:text-violet-400", bar: "from-violet-400 to-violet-500" },
  slate: { iconBg: "bg-slate-100 dark:bg-slate-700", iconText: "text-slate-600 dark:text-slate-400", bar: "from-slate-400 to-slate-500" },
};

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  accentColor = "teal",
}: StatCardProps) {
  const colors = accentMap[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-[0_10px_30px_-8px_rgba(16,185,129,0.2)] transition-shadow duration-300 p-5"
    >
      {/* Left accent bar */}
      <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${colors.bar}`} />

      <div className="relative pl-3">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center ${colors.iconText}`}>
            {icon}
          </div>
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                trend.positive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
              }`}
            >
              <svg
                className={`w-3 h-3 ${trend.positive ? "" : "rotate-180"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
              {trend.value}
            </span>
          )}
        </div>
        <p className="font-serif text-[2rem] leading-none text-slate-900 dark:text-slate-50 tracking-tight mb-0.5 tabular-nums">{value}</p>
        <p className="text-[13px] font-normal text-slate-500 dark:text-slate-400">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

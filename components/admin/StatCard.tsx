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
  teal: {
    bg: "bg-teal-50",
    iconBg: "bg-teal-100",
    iconText: "text-teal-600",
    trendPositive: "text-teal-600 bg-teal-50",
    trendNegative: "text-red-600 bg-red-50",
  },
  emerald: {
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    trendPositive: "text-emerald-600 bg-emerald-50",
    trendNegative: "text-red-600 bg-red-50",
  },
  amber: {
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    trendPositive: "text-emerald-600 bg-emerald-50",
    trendNegative: "text-red-600 bg-red-50",
  },
  red: {
    bg: "bg-red-50",
    iconBg: "bg-red-100",
    iconText: "text-red-600",
    trendPositive: "text-emerald-600 bg-emerald-50",
    trendNegative: "text-red-600 bg-red-50",
  },
  violet: {
    bg: "bg-violet-50",
    iconBg: "bg-violet-100",
    iconText: "text-violet-600",
    trendPositive: "text-emerald-600 bg-emerald-50",
    trendNegative: "text-red-600 bg-red-50",
  },
  slate: {
    bg: "bg-slate-50",
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    trendPositive: "text-emerald-600 bg-emerald-50",
    trendNegative: "text-red-600 bg-red-50",
  },
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
      className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 p-5 shadow-md shadow-slate-200/30 hover:shadow-lg hover:border-teal-200/50 transition-all duration-300 group relative overflow-hidden"
    >
      {/* Left accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-all duration-300 opacity-0 group-hover:opacity-100 ${
        accentColor === "teal" ? "bg-teal-500" :
        accentColor === "emerald" ? "bg-emerald-500" :
        accentColor === "amber" ? "bg-amber-500" :
        accentColor === "red" ? "bg-red-500" :
        accentColor === "violet" ? "bg-violet-500" : "bg-slate-400"
      }`} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/10 pointer-events-none rounded-2xl" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center ${colors.iconText} group-hover:scale-105 transition-transform duration-300`}>
            {icon}
          </div>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                trend.positive ? colors.trendPositive : colors.trendNegative
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
        <p className="text-3xl font-normal text-slate-900 tracking-tight mb-0.5 font-serif leading-none tabular-nums">{value}</p>
        <p className="text-[13px] font-medium text-slate-500 tracking-wide">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}

        {/* Minimal accent line */}
        <div className="mt-4 pt-3 border-t border-slate-100/60">
          <div className={`h-0.5 rounded-full w-8 transition-all duration-500 group-hover:w-12 ${
            accentColor === "teal" ? "bg-teal-400/60" :
            accentColor === "emerald" ? "bg-emerald-400/60" :
            accentColor === "amber" ? "bg-amber-400/60" :
            accentColor === "red" ? "bg-red-400/60" :
            accentColor === "violet" ? "bg-violet-400/60" : "bg-slate-300/60"
          }`} />
        </div>
      </div>
    </motion.div>
  );
}

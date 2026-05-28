"use client";

import { motion } from "framer-motion";

type Accent = "emerald" | "violet" | "amber" | "cyan";
type Trend = "up" | "down" | "flat";

const accentMap: Record<Accent, { bg: string; ring: string; text: string; dot: string }> = {
  emerald: {
    bg: "bg-emerald-500/10",
    ring: "border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  violet: {
    bg: "bg-violet-500/10",
    ring: "border-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    ring: "border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    ring: "border-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    dot: "bg-cyan-500",
  },
};

interface Props {
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  accent: Accent;
  caption: string;
  delay?: number;
}

export default function StatTile({ label, value, delta, trend, accent, caption, delay = 0 }: Props) {
  const c = accentMap[accent];
  const arrow =
    trend === "up" ? "M12 5v14m0-14l-5 5m5-5l5 5"
    : trend === "down" ? "M12 19V5m0 14l-5-5m5 5l5-5"
    : "M5 12h14";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className="bento-card bento-card-hover bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden"
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${c.bg} blur-2xl`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="stat-number text-slate-900 dark:text-slate-50">{value}</span>
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${c.text}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={arrow} />
            </svg>
            {delta}
          </span>
        </div>

        <p className="text-[12px] text-slate-500 dark:text-slate-400">{caption}</p>
      </div>
    </motion.div>
  );
}

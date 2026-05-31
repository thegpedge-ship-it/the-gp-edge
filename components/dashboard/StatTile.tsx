"use client";

import { motion } from "framer-motion";

type Accent = "emerald" | "violet" | "amber" | "sky";
type Trend = "up" | "down" | "flat";
type IconKey = "target" | "flame" | "trend" | "doc";

// Single, brand-consistent green/slate scheme shared by every tile so the
// four read as one set rather than a rainbow of auto-generated accents.
const brand = {
  stroke: "#10b981",
  gradFrom: "rgba(16, 185, 129, 0.16)",
  gradTo: "rgba(16, 185, 129, 0)",
};

// Trend-driven delta pill: green when improving, muted slate when flat,
// soft rose when down.
const trendPill: Record<Trend, string> = {
  up: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  flat: "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400",
  down: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
};

const icons: Record<IconKey, JSX.Element> = {
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  flame: (
    <path d="M12 2s4 4 4 8-2 6-4 6-4-2-4-6 4-8 4-8zm0 14a4 4 0 11-4-4" />
  ),
  trend: (
    <path d="M3 17l6-6 4 4 8-8M14 7h7v7" />
  ),
  doc: (
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  ),
};

interface Props {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  trend: Trend;
  accent: Accent;
  caption: string;
  icon: IconKey;
  spark: number[];
  delay?: number;
}

function buildSpark(points: number[], w: number, h: number) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const toX = (i: number) => (i / (points.length - 1)) * w;
  const toY = (v: number) => h - ((v - min) / range) * h;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p).toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return { line, area };
}

export default function StatTile({
  label,
  value,
  unit,
  delta,
  trend,
  accent,
  caption,
  icon,
  spark,
  delay = 0,
}: Props) {
  void accent;
  const W = 280;
  const H = 64;
  const { line, area } = buildSpark(spark, W, H);
  const arrow =
    trend === "up" ? "M12 5v14m0-14l-5 5m5-5l5 5"
    : trend === "down" ? "M12 19V5m0 14l-5-5m5 5l5-5"
    : "M5 12h14";
  const gradId = "statSparkGrad";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className="rounded-3xl p-px bg-gradient-to-br from-emerald-300/70 via-slate-200/50 to-teal-300/70 dark:from-emerald-500/40 dark:via-slate-700/50 dark:to-teal-500/40 shadow-sm hover:shadow-[0_10px_30px_-8px_rgba(16,185,129,0.35)] transition-shadow duration-300"
    >
      <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-white dark:bg-slate-800">
        {/* Left accent bar */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 to-teal-500 z-10" />

        {/* Silent / ghosted background graph */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-16 opacity-[0.55] dark:opacity-40 pointer-events-none"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brand.gradFrom} />
              <stop offset="100%" stopColor={brand.gradTo} />
            </linearGradient>
          </defs>
          <motion.path
            d={area}
            fill={`url(#${gradId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: delay + 0.4 }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke={brand.stroke}
            strokeWidth={1.6}
            strokeOpacity={0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: delay + 0.3 }}
          />
        </svg>

        {/* Content */}
        <div className="relative z-[1] pl-7 pr-5 py-5">
          {/* Icon + label */}
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              {icons[icon]}
            </svg>
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {label}
            </p>
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-[2rem] leading-none text-slate-900 dark:text-slate-50">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-slate-400">{unit}</span>
            )}
          </div>

          {/* Delta pill */}
          <div className="mt-3">
            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${trendPill[trend]}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={arrow} />
              </svg>
              {delta}
            </span>
            {caption && (
              <span className="text-[11px] text-slate-400 ml-1.5">{caption}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

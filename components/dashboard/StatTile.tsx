"use client";

import { motion } from "framer-motion";

type Accent = "emerald" | "violet" | "amber" | "sky";
type Trend = "up" | "down" | "flat";
type IconKey = "target" | "flame" | "trend" | "doc";

const accentMap: Record<Accent, { iconBg: string; iconText: string; stroke: string; gradFrom: string; gradTo: string }> = {
  emerald: {
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconText: "text-emerald-600 dark:text-emerald-400",
    stroke: "#10b981",
    gradFrom: "rgba(16, 185, 129, 0.25)",
    gradTo: "rgba(16, 185, 129, 0)",
  },
  amber: {
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-400",
    stroke: "#f59e0b",
    gradFrom: "rgba(245, 158, 11, 0.25)",
    gradTo: "rgba(245, 158, 11, 0)",
  },
  violet: {
    iconBg: "bg-violet-100 dark:bg-violet-500/15",
    iconText: "text-violet-600 dark:text-violet-400",
    stroke: "#8b5cf6",
    gradFrom: "rgba(139, 92, 246, 0.25)",
    gradTo: "rgba(139, 92, 246, 0)",
  },
  sky: {
    iconBg: "bg-sky-100 dark:bg-sky-500/15",
    iconText: "text-sky-600 dark:text-sky-400",
    stroke: "#0ea5e9",
    gradFrom: "rgba(14, 165, 233, 0.25)",
    gradTo: "rgba(14, 165, 233, 0)",
  },
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
  const c = accentMap[accent];
  const W = 280;
  const H = 36;
  const { line, area } = buildSpark(spark, W, H);
  const arrow =
    trend === "up" ? "M12 5v14m0-14l-5 5m5-5l5 5"
    : trend === "down" ? "M12 19V5m0 14l-5-5m5 5l5-5"
    : "M5 12h14";
  const gradId = `sparkGrad-${accent}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
          <svg className={`w-6 h-6 ${c.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            {icons[icon]}
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-3xl text-slate-900 dark:text-slate-50 leading-none">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <svg className={`w-3 h-3 ${c.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={arrow} />
            </svg>
            <span className={`text-[11px] font-semibold ${c.iconText}`}>{delta}</span>
            {caption && (
              <span className="text-[11px] text-slate-400 ml-0.5">{caption}</span>
            )}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-9 mt-3">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.gradFrom} />
            <stop offset="100%" stopColor={c.gradTo} />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.4 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={c.stroke}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: delay + 0.3 }}
        />
      </svg>
    </motion.div>
  );
}

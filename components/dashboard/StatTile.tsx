"use client";

import { memo, useId, useMemo } from "react";

type Trend = "up" | "down" | "flat";

// Single, brand-consistent green/slate scheme shared by every tile.
const brand = {
  stroke: "#10b981",
  gradFrom: "rgba(16, 185, 129, 0.16)",
  gradTo: "rgba(16, 185, 129, 0)",
};

// Trend-driven delta pill
const trendPill: Record<Trend, string> = {
  up: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  flat: "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400",
  down: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
};

interface Props {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  trend: Trend;
  caption: string;
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

/**
 * StatTile — stat card with background sparkline.
 * - Removed `accent` and `icon` props (they were voided / never used).
 * - Fixed SVG gradient ID collision by using useId() — previously all 4 tiles
 *   shared the same hardcoded ID which caused the gradient to only render on the first tile.
 * - Wrapped in React.memo to prevent unnecessary re-renders.
 * - useMemo for buildSpark to avoid recomputation on every render.
 * - No entry animation — page-level transition handled by DashboardShell/PageTransition.
 */
const StatTile = memo(function StatTile({
  label,
  value,
  unit,
  delta,
  trend,
  caption,
  spark,
}: Props) {
  // useId ensures each tile gets a unique gradient ID — fixes the bug where
  // all 4 tiles referenced the same gradient and only the first rendered correctly.
  const uid = useId();
  const gradId = `spark-grad-${uid}`;

  const W = 280;
  const H = 64;

  // Memoize the path computation — only recalculates if `spark` reference changes
  const { line, area } = useMemo(() => buildSpark(spark, W, H), [spark]);

  const arrow =
    trend === "up" ? "M12 5v14m0-14l-5 5m5-5l5 5"
    : trend === "down" ? "M12 19V5m0 14l-5-5m5 5l5-5"
    : "M5 12h14";

  return (
    <div className="rounded-3xl p-px bg-gradient-to-br from-emerald-300/70 via-slate-200/50 to-teal-300/70 dark:from-emerald-500/40 dark:via-slate-700/50 dark:to-teal-500/40 shadow-sm hover:shadow-[0_10px_30px_-8px_rgba(16,185,129,0.35)] transition-shadow duration-300">
      <div className="group relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-white dark:bg-slate-800">
        {/* Left accent bar */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 to-teal-500 z-10" />

        {/* Background sparkline */}
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
          <path d={area} fill={`url(#${gradId})`} />
          <path
            d={line}
            fill="none"
            stroke={brand.stroke}
            strokeWidth={1.6}
            strokeOpacity={0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Content */}
        <div className="relative z-[1] pl-7 pr-5 py-5">
          <div className="mb-3">
            <p className="text-[13px] font-normal text-slate-900 dark:text-slate-100 truncate">
              {label}
            </p>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-3xl md:text-4xl font-bold tracking-tighter leading-none text-slate-900 dark:text-slate-50">
              {value}
            </span>
            {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
          </div>
        </div>

        {/* Delta + description */}
        <div className="pointer-events-none absolute bottom-3 right-[5px] z-[2] flex items-center gap-0 opacity-75">
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${trendPill[trend]}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={arrow} />
            </svg>
            {delta}
          </span>
          {caption && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{caption}</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default StatTile;

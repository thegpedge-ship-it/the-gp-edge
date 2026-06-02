"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { accuracyTrend, user } from "./data";

/**
 * AccuracyTrendCard — 12-week accuracy trend chart.
 * - SVG path computations are memoized.
 * - Wrapped in React.memo.
 * - No entry animation — handled by PageTransition.
 */
const AccuracyTrendCard = memo(function AccuracyTrendCard() {
  const { points, labels, current, delta } = accuracyTrend;
  const W = 300;
  const H = 90;

  const { linePath, areaPath } = useMemo(() => {
    const min = Math.min(...points) - 4;
    const max = Math.max(...points) + 2;
    const toX = (i: number) => (i / (points.length - 1)) * W;
    const toY = (v: number) => H - ((v - min) / (max - min)) * H;

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p).toFixed(1)}`)
      .join(" ");
    const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
    return { linePath, areaPath };
  }, [points]);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Accuracy trend
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl text-slate-900 dark:text-slate-50">
              {current}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              +{delta}% vs prev
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <button type="button" className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">12w</button>
          <button type="button" className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">6m</button>
          <button type="button" className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">All</button>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full h-24" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaPath}
          fill="url(#trendArea)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="#0d9488"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
        {points.map((p, i) => {
          const min = Math.min(...points) - 4;
          const max = Math.max(...points) + 2;
          const toX = (idx: number) => (idx / (points.length - 1)) * W;
          const toY = (v: number) => H - ((v - min) / (max - min)) * H;
          return (
            <circle
              key={i}
              cx={toX(i)}
              cy={toY(p)}
              r={i === points.length - 1 ? 3.5 : 0}
              fill="#0d9488"
              stroke="white"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>

      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        {labels.filter((_, i) => i % 2 === 0).map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 00-3.6 10.8c.4.3.6.8.6 1.3v.4h6v-.4c0-.5.2-1 .6-1.3A6 6 0 0012 3z" />
            <path d="M9 19h6M10 21.5h4" />
          </svg>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Up every week this month, {user.firstName}. Keep showing up — consistency wins.
          </p>
        </div>
      </div>
    </div>
  );
});

export default AccuracyTrendCard;

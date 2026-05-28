"use client";

import { motion } from "framer-motion";
import { accuracyTrend } from "./data";

export default function AccuracyTrendCard() {
  const { points, labels, current, delta } = accuracyTrend;
  const min = Math.min(...points) - 4;
  const max = Math.max(...points) + 2;
  const W = 300;
  const H = 90;

  const toX = (i: number) => (i / (points.length - 1)) * W;
  const toY = (v: number) => H - ((v - min) / (max - min)) * H;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p).toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-7"
    >
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

      <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full h-32" preserveAspectRatio="none">
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
          transition={{ duration: 0.6, delay: 0.4 }}
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
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(p)}
            r={i === points.length - 1 ? 3.5 : 0}
            fill="#0d9488"
            stroke="white"
            strokeWidth={1.5}
          />
        ))}
      </svg>

      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        {labels.filter((_, i) => i % 2 === 0).map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </motion.div>
  );
}

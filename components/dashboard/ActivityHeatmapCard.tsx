"use client";

import { motion } from "framer-motion";
import { heatmap } from "./data";

const heatColor = (v: number) => {
  if (v === 0) return "bg-slate-100 dark:bg-slate-800";
  if (v === 1) return "bg-emerald-200 dark:bg-emerald-900/60";
  if (v === 2) return "bg-emerald-400 dark:bg-emerald-700";
  if (v === 3) return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-600 dark:bg-emerald-400";
};

export default function ActivityHeatmapCard() {
  const activeDays = heatmap.filter((v) => v > 0).length;
  const totalSessions = heatmap.reduce((sum, v) => sum + v, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-6"
    >
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Study Activity
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Last 12 weeks
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Active days</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{activeDays}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Sessions</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{totalSessions}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Array.from({ length: 12 }).map((_, w) => (
          <div key={w} className="flex flex-col gap-1.5 flex-shrink-0">
            {Array.from({ length: 7 }).map((_, d) => {
              const v = heatmap[w * 7 + d] ?? 0;
              return (
                <motion.div
                  key={d}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.1 + (w * 7 + d) * 0.003 }}
                  title={`${v} sessions`}
                  className={`w-4 h-4 rounded-[4px] ${heatColor(v)}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-slate-400 dark:text-slate-500">
        <span>Less</span>
        <span className="w-3 h-3 rounded-[3px] bg-slate-100 dark:bg-slate-800" />
        <span className="w-3 h-3 rounded-[3px] bg-emerald-200 dark:bg-emerald-900/60" />
        <span className="w-3 h-3 rounded-[3px] bg-emerald-400 dark:bg-emerald-700" />
        <span className="w-3 h-3 rounded-[3px] bg-emerald-500" />
        <span className="w-3 h-3 rounded-[3px] bg-emerald-600 dark:bg-emerald-400" />
        <span>More</span>
      </div>
    </motion.div>
  );
}

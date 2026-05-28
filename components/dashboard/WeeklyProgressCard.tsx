"use client";

import { motion } from "framer-motion";
import { weeklyProgress } from "./data";

export default function WeeklyProgressCard() {
  const max = Math.max(...weeklyProgress.days.map((d) => d.qs));
  const pct = Math.round((weeklyProgress.totalQs / weeklyProgress.goalQs) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-7"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
            This week
          </p>
          <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">
            {weeklyProgress.totalQs} <span className="text-slate-400 text-lg">/ {weeklyProgress.goalQs}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {Math.floor(weeklyProgress.totalMin / 60)}h {weeklyProgress.totalMin % 60}m spent · {pct}% of weekly goal
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          On track
        </span>
      </div>

      <div className="flex items-end gap-2 h-32">
        {weeklyProgress.days.map((d, i) => {
          const h = (d.qs / max) * 100;
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex-1 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 + i * 0.04 }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-teal-600 to-emerald-400 relative group"
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {d.qs} qs
                  </span>
                </motion.div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { performance } from "./data";

const barColor: Record<string, string> = {
  emerald: "from-emerald-400 to-teal-500",
  cyan: "from-cyan-400 to-sky-500",
  violet: "from-violet-400 to-fuchsia-500",
  amber: "from-amber-400 to-orange-500",
};

export default function PerformanceCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Subject mastery
          </p>
          <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">
            Where you stand
          </h3>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-teal-600 hover:text-teal-500 transition-colors"
        >
          Full breakdown →
        </button>
      </div>

      <div className="space-y-3">
        {performance.map((row, i) => (
          <div key={row.subject}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {row.subject}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-serif font-semibold text-slate-900 dark:text-slate-50">
                  {row.mastery}%
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    row.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                  }`}
                >
                  {row.change >= 0 ? "+" : ""}
                  {row.change}
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${row.mastery}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 + i * 0.05 }}
                className={`h-full rounded-full bg-gradient-to-r ${barColor[row.color]}`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

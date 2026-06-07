"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { performance } from "./data";

/**
 * PerformanceCard — subject mastery bar chart.
 * - Wrapped in React.memo.
 * - No entry animation — handled by PageTransition.
 * - Bar animations kept (content-level, not page-entry).
 */
const PerformanceCard = memo(function PerformanceCard() {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6">
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
              <span className="text-sm font-serif font-semibold text-slate-900 dark:text-slate-50">
                {row.mastery}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${row.mastery}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.04 }}
                className="h-full rounded-full bg-emerald-400 dark:bg-emerald-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default PerformanceCard;

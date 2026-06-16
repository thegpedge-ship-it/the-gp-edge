"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { performance } from "./data";

const PerformanceCard = memo(function PerformanceCard({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (subject: string | null) => void;
}) {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm pl-6 pr-4 pt-6 pb-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100">
            Subject Mastery
          </h3>
        </div>
      </div>

      <div className="flex flex-col justify-between flex-1">
        {performance.map((row, i) => {
          const isActive = selected === row.subject;
          return (
            <div
              key={row.subject}
              onClick={() => onSelect(isActive ? null : row.subject)}
              className={`cursor-pointer group rounded-lg px-2.5 py-1 -mx-2.5 transition-colors ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-900/30"
                  : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
              }`}
            >
              <div className="flex items-baseline justify-between mb-0.5">
                <span
                  className={`text-[13px] font-medium transition-colors ${
                    isActive
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                  }`}
                >
                  {row.subject}
                </span>
                <span className="text-sm font-sans font-bold text-slate-900 dark:text-slate-50">
                  {row.mastery}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${row.mastery}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.04 }}
                  className={`h-full rounded-full ${
                    isActive
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : "bg-emerald-400 dark:bg-emerald-500"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default PerformanceCard;

"use client";

import { motion } from "framer-motion";
import { dailyPractice } from "./data";

export default function DailyPracticeCard() {
  const pct = Math.round((dailyPractice.doneQs / dailyPractice.goalQs) * 100);
  const done = dailyPractice.blocks.filter((b) => b.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-7"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Daily practice · {dailyPractice.date}
          </p>
          <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">
            {done} of {dailyPractice.blocks.length} blocks done
          </h3>
        </div>
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-700" />
            <motion.circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#0d9488"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 15}
              initial={{ strokeDashoffset: 2 * Math.PI * 15 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - pct / 100) }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold font-serif text-slate-800 dark:text-slate-100">{pct}%</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {dailyPractice.doneQs} of {dailyPractice.goalQs} questions today
      </p>

      <ul className="space-y-2">
        {dailyPractice.blocks.map((b, i) => (
          <motion.li
            key={b.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.45 + i * 0.06 }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
              b.done
                ? "bg-emerald-50/60 dark:bg-emerald-900/15 border-emerald-100 dark:border-emerald-900/30"
                : "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-700"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                b.done ? "bg-emerald-500" : "border-2 border-slate-300 dark:border-slate-600"
              }`}
            >
              {b.done && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`flex-1 text-sm ${b.done ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-800 dark:text-slate-100 font-medium"}`}>
              {b.name}
            </span>
            <span className="text-[11px] text-slate-400">{b.minutes}m</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

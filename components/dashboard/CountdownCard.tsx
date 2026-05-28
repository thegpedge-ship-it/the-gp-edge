"use client";

import { motion } from "framer-motion";
import { upcomingExam } from "./data";

export default function CountdownCard() {
  const e = upcomingExam;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200/60 dark:border-emerald-800/40 p-7 shadow-sm"
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/30 dark:bg-white/5 blur-2xl" />

      <div className="relative">
        <p className="text-[12px] uppercase tracking-widest font-semibold text-teal-700 dark:text-teal-300 mb-2">
          Next mock
        </p>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-serif text-6xl font-medium text-slate-900 dark:text-slate-50 tracking-tight">
            {e.daysAway}
          </span>
          <span className="text-base font-medium text-slate-600 dark:text-slate-300">
            days
          </span>
        </div>

        <p className="font-serif text-lg text-slate-800 dark:text-slate-100 mb-5">
          {e.name}
        </p>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {e.dateLabel} · {e.timeLabel}
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {e.totalQuestions} questions · {Math.floor(e.durationMin / 60)}h {e.durationMin % 60}m
          </div>
        </div>

        <button
          type="button"
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-300 active:scale-[0.97]"
        >
          View study plan
        </button>
      </div>
    </motion.div>
  );
}

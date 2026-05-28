"use client";

import { motion } from "framer-motion";
import { examPaths } from "./data";

const accentMap: Record<string, { bg: string; ring: string; text: string; bar: string }> = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    ring: "border-emerald-200 dark:border-emerald-800/40",
    text: "text-emerald-700 dark:text-emerald-300",
    bar: "from-emerald-400 to-teal-500",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-900/20",
    ring: "border-violet-200 dark:border-violet-800/40",
    text: "text-violet-700 dark:text-violet-300",
    bar: "from-violet-400 to-fuchsia-500",
  },
};

export default function ExamPathsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-7"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Exam preparation
          </p>
          <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">
            Your two paths
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {examPaths.map((e, i) => {
          const c = accentMap[e.accent];
          return (
            <motion.div
              key={e.code}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35 + i * 0.1 }}
              className={`rounded-2xl border ${c.ring} ${c.bg} p-5`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${c.text}`}>{e.code}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{e.name}</p>
                </div>
                <span className="font-serif text-3xl text-slate-900 dark:text-slate-50">{e.readiness}%</span>
              </div>

              <div className="h-1.5 rounded-full bg-white/70 dark:bg-slate-900/40 overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${e.readiness}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.5 + i * 0.1 }}
                  className={`h-full rounded-full bg-gradient-to-r ${c.bar}`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-3">
                <span>{e.mocksDone}/{e.mocksTotal} mocks done</span>
                <span>Next: {e.nextMilestone}</span>
              </div>

              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:shadow-sm transition"
              >
                Continue {e.code} prep
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

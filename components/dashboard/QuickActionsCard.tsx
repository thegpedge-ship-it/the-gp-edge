"use client";

import { motion } from "framer-motion";

const actions = [
  {
    key: "new-quiz",
    title: "Start new quiz",
    caption: "Pick subject & difficulty",
    primary: true,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    ),
  },
  {
    key: "practice",
    title: "Practice mode",
    caption: "Untimed, with hints",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 21l3-2 3 2-.75-4M5 9.5a7 7 0 1114 0c0 3.87-3.5 7-7 7s-7-3.13-7-7z" />
    ),
  },
  {
    key: "mock",
    title: "Full mock exam",
    caption: "Timed, exam conditions",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
];

export default function QuickActionsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-7"
    >
      <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
        Jump in
      </p>
      <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50 mb-5">
        Quick actions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((a, i) => (
          <motion.button
            key={a.key}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 + i * 0.07 }}
            className={`group text-left p-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 ${
              a.primary
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 hover:shadow-xl"
                : "bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-900"
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              a.primary
                ? "bg-emerald-400/20 text-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-600"
                : "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
            }`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {a.icon}
              </svg>
            </div>
            <p className="font-semibold text-sm leading-tight">{a.title}</p>
            <p className={`text-xs mt-1 ${a.primary ? "text-slate-300 dark:text-slate-500" : "text-slate-500 dark:text-slate-400"}`}>
              {a.caption}
            </p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

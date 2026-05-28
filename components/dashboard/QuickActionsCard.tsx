"use client";

import { motion } from "framer-motion";
import { quickActionChips } from "./data";

type Accent = "emerald" | "amber" | "violet" | "sky" | "rose";

const accentMap: Record<Accent, { bg: string; text: string }> = {
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
  amber: { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  violet: { bg: "bg-violet-100 dark:bg-violet-500/15", text: "text-violet-600 dark:text-violet-400" },
  sky: { bg: "bg-sky-100 dark:bg-sky-500/15", text: "text-sky-600 dark:text-sky-400" },
  rose: { bg: "bg-rose-100 dark:bg-rose-500/15", text: "text-rose-600 dark:text-rose-400" },
};

const icons: Record<string, JSX.Element> = {
  book: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 6.25v13M12 6.25a4 4 0 00-4-4H3v15.5h5a4 4 0 014 4M12 6.25a4 4 0 014-4h5v15.5h-5a4 4 0 00-4 4" />
  ),
  doc: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  bookmark: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z" />
  ),
  chart: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 17l6-6 4 4 8-8M14 7h7v7" />
  ),
};

export default function QuickActionsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">
          Quick actions
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {quickActionChips.map((a, i) => {
            const c = accentMap[a.accent];
            return (
              <motion.button
                key={a.key}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.25 + i * 0.05 }}
                className="group inline-flex items-center gap-2.5 px-3 py-2 rounded-full bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center ${c.bg}`}>
                  <svg
                    className={`w-4 h-4 ${c.text}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {icons[a.icon]}
                  </svg>
                </span>
                <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 pr-1">
                  {a.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

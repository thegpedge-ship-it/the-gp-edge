"use client";

import { motion } from "framer-motion";
import { quickAccess } from "./data";

const accentMap: Record<string, { bg: string; iconBg: string; iconText: string; badge: string }> = {
  emerald: {
    bg: "from-emerald-50 to-white dark:from-emerald-900/15 dark:to-slate-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconText: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  violet: {
    bg: "from-violet-50 to-white dark:from-violet-900/15 dark:to-slate-800",
    iconBg: "bg-violet-100 dark:bg-violet-500/15",
    iconText: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-100/70 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  },
  cyan: {
    bg: "from-cyan-50 to-white dark:from-cyan-900/15 dark:to-slate-800",
    iconBg: "bg-cyan-100 dark:bg-cyan-500/15",
    iconText: "text-cyan-600 dark:text-cyan-400",
    badge: "bg-cyan-100/70 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",
  },
  amber: {
    bg: "from-amber-50 to-white dark:from-amber-900/15 dark:to-slate-800",
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100/70 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
};

const iconMap: Record<string, JSX.Element> = {
  mbs: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8V6m0 12v2M5 12a7 7 0 1114 0 7 7 0 01-14 0z" />,
  autofills: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
  conditions: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.25v13M12 6.25a4 4 0 00-4-4H3v15.5h5a4 4 0 014 4M12 6.25a4 4 0 014-4h5v15.5h-5a4 4 0 00-4 4" />,
  notes: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />,
};

export default function QuickAccessCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-7"
    >
      <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
        Quick access
      </p>
      <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50 mb-5">
        Your library
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickAccess.map((q, i) => {
          const c = accentMap[q.accent];
          return (
            <motion.a
              key={q.key}
              href="#"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
              className={`group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${c.bg} border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.iconBg}`}>
                <svg className={`w-5 h-5 ${c.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {iconMap[q.key]}
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{q.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{q.caption}</p>
              <span className={`inline-block mt-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.badge}`}>
                {q.badge}
              </span>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
}

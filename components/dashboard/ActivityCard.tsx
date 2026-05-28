"use client";

import { motion } from "framer-motion";
import { activity } from "./data";

const typeMeta: Record<string, { color: string; icon: JSX.Element }> = {
  mock: {
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  autofill: {
    color: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  },
  mbs: {
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l3 1m0 0l-3 9a5 5 0 006 0m-6-9l6 1m6 7l3 9a5 5 0 006 0m-6-9l-6 1m-1-9l3 9a5 5 0 006 0M9 4l3-1m0 0l3 1m0 0v9" />,
  },
  study: {
    color: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.25v13M12 6.25a4 4 0 00-4-4H3v15.5h5a4 4 0 014 4M12 6.25a4 4 0 014-4h5v15.5h-5a4 4 0 00-4 4" />,
  },
};

export default function ActivityCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-7"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Activity timeline
          </p>
          <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">
            Recent
          </h3>
        </div>
        <button type="button" className="text-xs font-semibold text-teal-600 hover:text-teal-500">
          View all →
        </button>
      </div>

      <ol className="relative space-y-4">
        <span className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-700" />
        {activity.map((item, i) => {
          const m = typeMeta[item.type];
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.06 }}
              className="relative flex gap-3 pl-0"
            >
              <div className={`relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-white dark:ring-slate-800 ${m.color}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {m.icon}
                </svg>
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.meta}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.timeAgo}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </motion.div>
  );
}

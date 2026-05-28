"use client";

import { motion } from "framer-motion";
import { aiRecommendations } from "./data";

const tagColor: Record<string, string> = {
  Priority: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  "Quick win": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  Stretch: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
};

export default function AIRecommendationsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-white dark:from-violet-900/30 dark:via-slate-800 dark:to-slate-800 border border-violet-200/60 dark:border-violet-800/30 shadow-sm p-7"
    >
      <div className="absolute top-4 right-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 dark:bg-slate-900/60 backdrop-blur border border-violet-200/60 dark:border-violet-700/40 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.6-6.2 4.6 2.4-7.4L2 9.4h7.6z" />
          </svg>
          AI
        </span>
      </div>

      <p className="text-[12px] uppercase tracking-widest font-semibold text-violet-700 dark:text-violet-300 mb-1">
        For you, today
      </p>
      <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50 mb-5">
        Smart study plan
      </h3>

      <ul className="space-y-3">
        {aiRecommendations.map((r, i) => (
          <motion.li
            key={r.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
            className="group rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur border border-white/60 dark:border-slate-700/40 p-4 hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                {r.title}
              </p>
              <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tagColor[r.tag]}`}>
                {r.tag}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{r.reason}</p>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {r.minutes} min
              </span>
              <span className="text-[11px] font-semibold text-teal-600 group-hover:translate-x-0.5 transition-transform">
                Start →
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

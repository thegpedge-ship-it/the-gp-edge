"use client";

import { motion } from "framer-motion";
import { continueSession } from "./data";

export default function ContinueCard() {
  const s = continueSession;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-slate-950 text-white p-7 lg:p-8 shadow-2xl shadow-slate-900/20"
    >
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            In progress
          </span>
          <span className="text-[12px] text-slate-400">{s.subtitle}</span>
        </div>

        <h3 className="font-serif text-3xl lg:text-4xl tracking-tight leading-tight mb-2">
          {s.title}
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Last question: <span className="text-slate-200">{s.lastTopic}</span> · {s.difficulty} difficulty
        </p>

        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Block progress</span>
            <span className="font-semibold text-slate-200">{s.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${s.progress}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
            />
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Left</p>
              <p className="font-serif text-2xl text-white">{s.questionsLeft} <span className="text-sm text-slate-400">qs</span></p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Est. time</p>
              <p className="font-serif text-2xl text-white">{s.estMinutes} <span className="text-sm text-slate-400">min</span></p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-400 text-slate-900 font-semibold text-sm hover:bg-emerald-300 transition-all duration-300 active:scale-[0.97] shadow-lg shadow-emerald-400/20"
          >
            Resume
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

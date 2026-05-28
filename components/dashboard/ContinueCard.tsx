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
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white p-7 lg:p-8 shadow-2xl shadow-slate-900/20"
    >
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* ECG line on the right */}
      <svg
        viewBox="0 0 400 120"
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-44 opacity-70 pointer-events-none"
        preserveAspectRatio="xMaxYMid meet"
      >
        <defs>
          <linearGradient id="ecgGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0" />
            <stop offset="20%" stopColor="#5eead4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#5eead4" stopOpacity="1" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0 60 L60 60 L80 60 L90 55 L100 60 L130 60 L145 50 L155 70 L165 20 L175 95 L185 60 L210 60 L225 55 L235 60 L260 60 L275 40 L290 80 L305 15 L320 100 L335 60 L380 60 L400 60"
          fill="none"
          stroke="url(#ecgGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        />
        {/* Heart icon at the right end */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.4 }}
          style={{ transformOrigin: "380px 60px" }}
        >
          <path
            d="M380 65 c-3 -3 -8 -3 -8 2 c0 5 8 10 8 10 s8 -5 8 -10 c0 -5 -5 -5 -8 -2 z"
            fill="#5eead4"
            opacity="0.9"
          />
        </motion.g>
      </svg>

      <div className="relative max-w-[60%]">
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
      </div>

      <div className="relative">
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
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Left</p>
                <p className="font-serif text-xl text-white">{s.questionsLeft} <span className="text-xs text-slate-400">qs</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4m0 0a3 3 0 016 0V5a3 3 0 00-6 0v2zm0 0H3m4 0h2m4 14v-4m0 0a3 3 0 116 0v2a3 3 0 11-6 0v-2zm0 0h2m-2 0h-2" />
                </svg>
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Est. time</p>
                <p className="font-serif text-xl text-white">{s.estMinutes} <span className="text-xs text-slate-400">min</span></p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-400 text-slate-900 font-semibold text-sm hover:bg-emerald-300 transition-all duration-300 active:scale-[0.97] shadow-lg shadow-emerald-400/20"
          >
            Resume Mock
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { upcomingMock, mockDrill, subjects } from "./data";

/* ─── Countdown Hook ──────────────────────────────────────────────────── */
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

/* ─── Countdown Digit ─────────────────────────────────────────────────── */
function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-10 h-10 rounded-lg bg-slate-900 dark:bg-slate-950 flex items-center justify-center shadow-lg border border-slate-700/50">
        <span className="text-lg font-extrabold text-emerald-400 font-mono tracking-tight">
          {String(value).padStart(2, "0")}
        </span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/50" />
      </div>
      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">{label}</span>
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function SidePanel() {
  const countdown = useCountdown(upcomingMock.date);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const spotsFilled = Math.round((upcomingMock.registeredCount / upcomingMock.totalSpots) * 100);

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ─── 1. Upcoming Mock Exam — Hero Card ─────────────────── */}
      <div className="relative glass dark:glass-strong rounded-2xl p-4 border border-emerald-200/50 dark:border-emerald-800/40 shadow-lg overflow-hidden group flex-shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-teal-400/10 dark:bg-teal-500/5 group-hover:scale-110 transition-transform duration-700" />

        <div className="relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/50 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Upcoming</span>
          </div>

          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-0.5">{upcomingMock.title}</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">{upcomingMock.subtitle}</p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Digit value={countdown.days} label="Days" />
            <span className="text-slate-500 dark:text-slate-600 font-bold text-lg mt-[-12px]">:</span>
            <Digit value={countdown.hours} label="Hrs" />
            <span className="text-slate-500 dark:text-slate-600 font-bold text-lg mt-[-12px]">:</span>
            <Digit value={countdown.mins} label="Min" />
            <span className="text-slate-500 dark:text-slate-600 font-bold text-lg mt-[-12px]">:</span>
            <Digit value={countdown.secs} label="Sec" />
          </div>

          {/* Spots Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-[11px] font-bold mb-1.5">
              <span className="text-slate-500 dark:text-slate-400">{upcomingMock.registeredCount} registered</span>
              <span className="text-emerald-600 dark:text-emerald-400">{upcomingMock.totalSpots - upcomingMock.registeredCount} spots left</span>
            </div>
            <div className="h-1.5 bg-slate-200/60 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${spotsFilled}%` }} />
            </div>
          </div>

          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[13px] font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2">
            Register Now
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>

      {/* ─── 2. Create Your Own Quiz ───────────────────────────── */}
      <div className="glass dark:glass-strong rounded-2xl border border-slate-200/50 dark:border-slate-700/40 shadow-md overflow-hidden flex-shrink-0">
        <button
          onClick={() => setShowQuizBuilder(!showQuizBuilder)}
          className="w-full px-4 py-3 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Create Your Own Quiz</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Pick your topics, set your rules.</p>
            </div>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showQuizBuilder ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {showQuizBuilder && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Select Topics</p>
                <div className="flex flex-wrap gap-1.5 mb-4 max-h-36 overflow-y-auto pr-1">
                  {subjects.map((s) => {
                    const isSelected = selectedTopics.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleTopic(s.id)}
                        className={`
                          px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-200
                          ${isSelected
                            ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/20"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                          }
                        `}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>

                {selectedTopics.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[12px] font-bold text-teal-600 dark:text-teal-400">
                      {selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} selected
                    </span>
                    <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-[12px] font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1.5">
                      Start Quiz
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </motion.div>
                )}

                {selectedTopics.length === 0 && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-1">Tap topics above to build your custom quiz.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── 3. Mock Drill ─────────────────────────────────────── */}
      <div className="glass dark:glass-strong rounded-3xl p-5 border border-slate-200/50 dark:border-slate-700/40 shadow-md group hover:shadow-lg hover:border-teal-400/40 dark:hover:border-teal-500/30 transition-all duration-300 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
            </svg>
          </div>
          <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{mockDrill.title}</h3>
        </div>

        <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex-1">
          {mockDrill.description}
        </p>

        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
            {mockDrill.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            {mockDrill.questionCount} Qs
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {mockDrill.difficulty}
          </span>
        </div>

        <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-[13px] font-bold shadow-md shadow-amber-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2">
          Start Mock Drill
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </div>
  );
}

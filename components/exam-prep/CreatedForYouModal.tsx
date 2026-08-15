"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Clock, Hash } from "lucide-react";
import { buildMockDrillQuestionSet, getMockDrillPoolSize } from "@/app/exam-prep/actions";
import { buildInstructionsUrl, saveTestPlan } from "@/lib/testSession";

const PRESETS = [25, 50, 100];
const MIN_PER_QUESTION = 1.5;

export default function CreatedForYouModal({
  open,
  onClose,
  examMode = "AKT",
}: {
  open: boolean;
  onClose: () => void;
  examMode?: "AKT" | "KFP";
}) {
  const router = useRouter();
  const [count, setCount] = useState(50);
  const [poolSize, setPoolSize] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPoolSize(null);
    getMockDrillPoolSize().then(setPoolSize).catch(() => setPoolSize(0));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const effectiveCount = poolSize !== null ? Math.min(count, poolSize) : count;
  const durationMinutes = Math.max(5, Math.round(effectiveCount * MIN_PER_QUESTION));

  const start = async () => {
    if (starting || effectiveCount === 0) return;
    setStarting(true);
    const set = await buildMockDrillQuestionSet({ count: effectiveCount });
    setStarting(false);
    if (set.questionIds.length === 0) return;
    saveTestPlan({
      testId: "drill",
      source: "mock_drill",
      name: "Mock Drill",
      questionIds: set.questionIds,
      durationMinutes,
      timed: false,
      examMode,
    });
    onClose();
    router.push(buildInstructionsUrl("drill"));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Mock Drill"
            className="relative w-[95vw] max-w-lg flex flex-col glass-strong rounded-3xl border border-slate-200/60 dark:border-slate-700/40 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-200/70 dark:border-slate-700/40 flex-shrink-0">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
              <h3 className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Mock Drill
              </h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 py-6 flex flex-col gap-6">
              <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Questions are randomly picked from your weakest subjects — a personalised drill to sharpen where you need it most.
              </p>

              {/* Question count selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Number of Questions
                  </p>
                  {poolSize !== null && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {poolSize} available
                    </span>
                  )}
                </div>
                <div className="relative flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1">
                  {PRESETS.map((n) => {
                    const clamped = poolSize !== null && n > poolSize;
                    const active = n === count;
                    return (
                      <button
                        key={n}
                        onClick={() => setCount(n)}
                        className={`relative flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 z-10 ${
                          active
                            ? "text-amber-700 dark:text-amber-300"
                            : clamped
                              ? "text-slate-400 dark:text-slate-600"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="mock-drill-tab"
                            className="absolute inset-0 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-amber-200/60 dark:border-amber-500/20"
                            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                          />
                        )}
                        <span className="relative z-10">
                          {clamped && !active ? poolSize : n}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meta chips */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                  <Hash className="w-3 h-3" />
                  <span>{effectiveCount} questions</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>~{durationMinutes} min</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                  Untimed
                </div>
              </div>

              <button
                onClick={start}
                disabled={starting || poolSize === 0}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-amber-500 disabled:opacity-60 disabled:cursor-wait text-white text-[14px] font-bold shadow-lg shadow-amber-500/25 hover:bg-amber-400 hover:-translate-y-0.5 transition-all duration-300"
              >
                {poolSize === 0
                  ? "No questions available"
                  : starting
                    ? "Preparing…"
                    : "Start Drill"}
                {!starting && poolSize !== 0 && <ArrowRight size={15} strokeWidth={2.4} />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

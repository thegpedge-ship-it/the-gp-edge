"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { buildCustomQuestionSet } from "@/app/exam-prep/actions";
import { buildInstructionsUrl, saveTestPlan } from "@/lib/testSession";
import ViewReportButton from "@/components/report/ViewReportButton";
import { FullScreenLoader } from "@/components/ui/BrandedLoader";

/* ─── "Created for You" modal ─────────────────────────────────────────────
   A ready-made mixed quiz drawn live from the whole published bank (no topic
   selection). Reuses the Mock Drill mechanics: buildCustomQuestionSet with an
   empty subtopic list = the full bank, then routes through the shared test
   plan / instructions bridge with source "mock_drill". */
const PRESETS = [25, 50, 100];
const MIN_PER_QUESTION = 1.2;

export default function CreatedForYouModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [count, setCount] = useState(50);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const durationMinutes = Math.max(5, Math.round(count * MIN_PER_QUESTION));

  const start = async () => {
    if (starting) return;
    setStarting(true);
    const set = await buildCustomQuestionSet({
      subtopicIds: [], // empty = whole bank
      count,
      title: "Created for You",
    });
    setStarting(false);
    if (set.questionIds.length === 0) return;
    saveTestPlan({
      testId: "drill",
      source: "mock_drill",
      name: "Created for You",
      questionIds: set.questionIds,
      durationMinutes,
      timed: false,
    });
    onClose();
    router.push(buildInstructionsUrl("drill"));
  };

  return (
    <>
      {starting && <FullScreenLoader message="Preparing your quiz" />}
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

          {/* Panel — compact config dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Created for You"
            className="relative w-[95vw] max-w-lg flex flex-col glass-strong rounded-3xl border border-slate-200/60 dark:border-slate-700/40 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-200/70 dark:border-slate-700/40 flex-shrink-0">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400">
                  <Sparkles size={20} strokeWidth={2} />
                </div>
                <h3 className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Created for You
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 flex flex-col gap-5">
              <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                A ready-made mixed quiz drawn from every topic in the bank — no topic selection needed.
                Great for spotting blind spots across the whole syllabus.
              </p>

              {/* Question count presets */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                  Questions
                </p>
                <div className="flex items-center gap-2">
                  {PRESETS.map((n) => {
                    const active = n === count;
                    return (
                      <button
                        key={n}
                        onClick={() => setCount(n)}
                        className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${
                          active
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-600/60"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-[12px] font-semibold text-slate-400 dark:text-slate-500 pb-1">
                <span>{count} questions</span>
                <span>&middot;</span>
                <span>~{durationMinutes} min</span>
                <span>&middot;</span>
                <span>Mixed difficulty</span>
              </div>

              {/* Start */}
              <button
                onClick={start}
                disabled={starting}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 disabled:opacity-60 disabled:cursor-wait text-white text-[14px] font-bold shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:-translate-y-0.5 transition-all duration-300"
              >
                {starting ? "Preparing…" : "Start"}
                {!starting && <ArrowRight size={15} strokeWidth={2.4} />}
              </button>

              {/* Most-recent report for this drill, if one was saved locally */}
              <div className="flex justify-center">
                <ViewReportButton testId="drill" variant="link" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

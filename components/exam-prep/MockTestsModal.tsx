"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getMockTestQuestionIds } from "@/app/exam-prep/actions";
import type { UiMockTest } from "@/app/exam-prep/actions";
import { buildInstructionsUrl, saveTestPlan } from "@/lib/testSession";

/* ─── Lock icon ───────────────────────────────────────────────────────── */
function LockIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* ─── Single test card (slim, uniform row) ────────────────────────────── */
function TestCard({
  test,
  starting,
  onStart,
}: {
  test: UiMockTest;
  starting: boolean;
  onStart: (test: UiMockTest) => void;
}) {
  const isLocked = test.availability === "locked";
  const label = isLocked ? "Locked" : test.completed ? "Completed" : "Available";
  const dot = test.completed ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600";
  const action = test.completed ? "Retake" : "Start";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors duration-200 ${
        isLocked
          ? "border-slate-200 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/20"
          : "border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 hover:border-emerald-300 dark:hover:border-emerald-700"
      }`}
    >
      {/* Left — details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{test.name}</h4>
          <span className="flex items-center gap-1.5 flex-shrink-0 text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          <span>{test.questionCount} Qs</span>
          <span>&middot;</span>
          <span>{test.durationMin} min</span>
          {test.attempts > 0 && (
            <>
              <span>&middot;</span>
              <span>{test.attempts} attempt{test.attempts === 1 ? "" : "s"}</span>
            </>
          )}
          {test.completed && test.bestScore != null && (
            <>
              <span>&middot;</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Best {test.bestScore}%</span>
            </>
          )}
        </div>
      </div>

      {/* Right — action */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isLocked ? (
          <>
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-400 dark:bg-slate-700/40 dark:text-slate-500 cursor-not-allowed"
            >
              <LockIcon />
              Locked
            </button>
            <span className="relative group/lock">
              <button
                aria-label="Why is this locked?"
                className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 text-[9px] font-bold leading-none cursor-help"
              >
                !
              </button>
              <span className="pointer-events-none absolute right-0 bottom-full mb-1.5 z-10 w-max max-w-[200px] rounded-md bg-slate-800 dark:bg-slate-700 px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 translate-y-1 transition-all duration-150 group-hover/lock:opacity-100 group-hover/lock:translate-y-0 shadow-lg">
                {test.unlockHint ?? "This test is locked for now."}
              </span>
            </span>
          </>
        ) : (
          <button
            onClick={() => onStart(test)}
            disabled={starting}
            className="px-4 py-1.5 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-wait text-white transition-colors duration-200"
          >
            {starting ? "Loading…" : action}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Modal ───────────────────────────────────────────────────────────── */
export default function MockTestsModal({
  open,
  onClose,
  tests,
}: {
  open: boolean;
  onClose: () => void;
  tests: UiMockTest[];
}) {
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleStart = async (test: UiMockTest) => {
    if (startingId) return;
    setStartingId(test.id);
    const detail = await getMockTestQuestionIds(test.id);
    setStartingId(null);
    if (!detail || detail.questionIds.length === 0) return;
    saveTestPlan({
      testId: test.id,
      source: "mock_test",
      mockTestId: test.id,
      name: test.name,
      questionIds: detail.questionIds,
      durationMinutes: detail.timeLimitMin ?? test.durationMin,
      timed: true, // mock tests are the timed test type
    });
    onClose();
    router.push(buildInstructionsUrl(test.id));
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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

          {/* Panel — 70% height, 60% width */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Mock Tests"
            className="relative w-[95vw] lg:w-[66vw] h-[77vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/70 dark:border-slate-700/40 flex-shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mock Tests</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cards — single column, centred and width-capped */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 py-5">
              {tests.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                  <p className="text-[14px] font-bold text-slate-600 dark:text-slate-300">No mock tests yet</p>
                  <p className="text-[12px] text-slate-400 dark:text-slate-500 max-w-[320px]">
                    Full AKT simulations will appear here once they&rsquo;re published.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-w-[986px] mx-auto">
                  {tests.map((test) => (
                    <TestCard
                      key={test.id}
                      test={test}
                      starting={startingId === test.id}
                      onStart={handleStart}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

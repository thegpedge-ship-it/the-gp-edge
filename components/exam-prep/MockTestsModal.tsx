"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { mockTests } from "./data";
import type { MockTest, MockTestStatus } from "./data";
import { buildInstructionsUrl } from "@/lib/testSession";

/* ─── Per-status meta (one small dot of colour, neutral everywhere else) ─ */
const STATUS_META: Record<MockTestStatus, { label: string; dot: string; action: string }> = {
  completed: { label: "Completed", dot: "bg-emerald-500", action: "Retake" },
  "in-progress": { label: "In progress", dot: "bg-amber-500", action: "Resume" },
  available: { label: "Available", dot: "bg-sky-500", action: "Start" },
  locked: { label: "Locked", dot: "bg-slate-300 dark:bg-slate-600", action: "Locked" },
};

/* ─── Single test card (uniform layout for every status) ──────────────── */
function TestCard({ test, onStart }: { test: MockTest; onStart: (id: string) => void }) {
  const meta = STATUS_META[test.status];
  const isLocked = test.status === "locked";

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-colors duration-200 ${
        isLocked
          ? "border-slate-200 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/20"
          : "border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      {/* Left — details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate">{test.name}</h4>
          <span className="flex items-center gap-1.5 flex-shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{test.subtitle}</p>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
          <span>{test.questionCount} Qs</span>
          <span>&middot;</span>
          <span>{test.duration}</span>
          {test.attempts != null && (
            <>
              <span>&middot;</span>
              <span>{test.attempts} attempt{test.attempts === 1 ? "" : "s"}</span>
            </>
          )}
          {test.status === "completed" && test.bestScore != null && (
            <>
              <span>&middot;</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Best {test.bestScore}%</span>
            </>
          )}
        </div>

        {/* In-progress — slim progress bar */}
        {test.status === "in-progress" && test.progress != null && (
          <div className="flex items-center gap-2 mt-2 max-w-[260px]">
            <div className="flex-1 h-1 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${test.progress}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 w-8 text-right">{test.progress}%</span>
          </div>
        )}
      </div>

      {/* Right — action */}
      <button
        onClick={() => onStart(test.id)}
        disabled={isLocked}
        className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors duration-200 ${
          isLocked
            ? "bg-slate-100 text-slate-400 dark:bg-slate-700/40 dark:text-slate-500 cursor-not-allowed"
            : "bg-emerald-600 hover:bg-emerald-500 text-white"
        }`}
      >
        {isLocked ? "Locked" : meta.action}
      </button>
    </div>
  );
}

/* ─── Modal ───────────────────────────────────────────────────────────── */
export default function MockTestsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleStart = (id: string) => {
    onClose();
    router.push(buildInstructionsUrl(id));
  };

  const completed = mockTests.filter((t) => t.status === "completed");
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, t) => s + (t.bestScore ?? 0), 0) / completed.length)
    : 0;

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

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Mock Tests"
            className="relative w-[92vw] lg:w-[70vw] h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/70 dark:border-slate-700/40 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mock Tests</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Full AKT simulations &middot; {mockTests.length} tests &middot; {completed.length} completed &middot; {avgScore}% avg
                </p>
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

            {/* Cards — single column, centred and width-capped for neatness */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 py-6">
              <div className="flex flex-col gap-3 max-w-2xl mx-auto">
                {mockTests.map((test) => (
                  <TestCard key={test.id} test={test} onStart={handleStart} />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

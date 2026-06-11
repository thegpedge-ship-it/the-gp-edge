"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockTests } from "./data";
import type { MockTest } from "./data";

interface Props {
  open: boolean;
  onClose: () => void;
}

/* ─── Lock icon (button only) ─────────────────────────────────────────── */
function LockIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

/* ─── Status → Button config (green / white / gray only) ──────────────── */
function getAction(status: MockTest["status"]) {
  switch (status) {
    case "in-progress":
      return { label: "Resume", className: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 hover:-translate-y-0.5", locked: false, disabled: false };
    case "completed":
      return { label: "Retake", className: "bg-white dark:bg-slate-800 border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:-translate-y-0.5", locked: false, disabled: false };
    case "locked":
      return { label: "Locked", className: "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed", locked: true, disabled: true };
    default:
      return { label: "Start", className: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 hover:-translate-y-0.5", locked: false, disabled: false };
  }
}

export default function MockTestListModal({ open, onClose }: Props) {
  const completed = mockTests.filter((t) => t.status === "completed");
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, t) => s + (t.bestScore ?? 0), 0) / completed.length)
    : 0;

  /* Lock background page scroll while the modal is open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
            style={{ height: "75vh" }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">Mock Tests</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Full AKT simulations under exam conditions</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            {/* Summary stats strip */}
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-900/10 flex items-center gap-6 flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-lg font-medium text-slate-900 dark:text-slate-100 leading-none">{mockTests.length}</span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Total</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-medium text-emerald-600 dark:text-emerald-400 leading-none">{completed.length}</span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Completed</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-medium text-emerald-600 dark:text-emerald-400 leading-none">{avgScore}%</span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Avg Score</span>
              </div>
            </div>

            {/* List — single-row cards */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-2">
              {mockTests.map((test) => {
                const action = getAction(test.status);
                const isLocked = test.status === "locked";
                const attempted = test.accuracy != null;
                return (
                  <div
                    key={test.id}
                    className={`flex items-center gap-5 rounded-lg px-4 py-2 border transition-colors duration-200 ${
                      isLocked
                        ? "border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/10 opacity-70"
                        : "border-slate-100 dark:border-slate-700/40 bg-white dark:bg-slate-800/20 hover:border-emerald-300 dark:hover:border-emerald-600"
                    }`}
                  >
                    {/* Name */}
                    <h4 className="text-[13px] font-medium text-slate-700 dark:text-slate-200 flex-1 min-w-0 truncate">{test.name}</h4>

                    {/* Inline gray stats — fixed-width block, right-aligned near button */}
                    <div className="flex items-center justify-end gap-2 flex-shrink-0 w-[320px] text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {attempted ? (
                        <>
                          <span>Acc {test.accuracy}%</span>
                          <span>&middot;</span>
                          <span>Cohort {test.cohortAccuracy}%</span>
                          <span>&middot;</span>
                          <span>Marks {test.yourMarks}</span>
                          <span>&middot;</span>
                          <span>Avg {test.avgMarks}</span>
                        </>
                      ) : test.status === "in-progress" ? (
                        <>
                          <span>{test.questionCount} Qs</span>
                          <span>&middot;</span>
                          <span>{test.duration}</span>
                          <span>&middot;</span>
                          <span>Progress {test.progress}%</span>
                        </>
                      ) : (
                        <>
                          <span>{test.questionCount} Qs</span>
                          <span>&middot;</span>
                          <span>{test.duration}</span>
                        </>
                      )}
                    </div>

                    {/* Button */}
                    <button
                      disabled={action.disabled}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${action.className}`}
                    >
                      {action.locked && <LockIcon className="w-3 h-3" />}
                      {action.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

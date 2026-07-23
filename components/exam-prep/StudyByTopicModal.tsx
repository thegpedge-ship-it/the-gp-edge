"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import SubjectMenu from "./SubjectMenu";

/* ─── Study-by-Topic modal ────────────────────────────────────────────────
   Wraps the subject → subtopic → test drill (SubjectMenu) in the shared
   exam-prep modal shell. SubjectMenu handles its own data loading and start
   navigation; this shell only owns open/close + the header. */
export default function StudyByTopicModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
            aria-label="Study by Topic"
            className="relative w-[95vw] lg:w-[76vw] max-w-[1240px] h-[88vh] flex flex-col glass-strong rounded-3xl border border-slate-200/60 dark:border-slate-700/40 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-7 py-5 border-b border-slate-200/70 dark:border-slate-700/40 flex-shrink-0">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
              <div>
                <h3 className="font-serif text-2xl md:text-[1.75rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Study by Topic
                </h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Browse subjects and subtopics, then pick a focused quiz.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {/* Body — the drill */}
            <div className="flex-1 min-h-0 overflow-hidden p-4">
              <SubjectMenu />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

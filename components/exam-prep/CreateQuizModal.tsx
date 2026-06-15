"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { subjects } from "./data";
import type { Subject } from "./data";
import {
  buildInstructionsUrl,
  saveCustomTestConfig,
} from "@/lib/testSession";

/* Default question count when the modal opens — the user can change it,
   but it is always clamped to the pool of selected subtopics. */
const DEFAULT_QUIZ_SIZE = 50;

/* ─── Green theme (matches SubjectMenu) ───────────────────────────────── */
const theme = {
  text: "text-emerald-600 dark:text-emerald-400",
  dot: "bg-emerald-500",
  activeBg: "bg-emerald-50/80 dark:bg-emerald-900/20",
};

/* ─── Flatten subtopics for lookups / totals ──────────────────────────── */
type SubtopicEntry = { subtopicId: string; subtopicName: string; questionCount: number; subjectId: string; subjectName: string };

function buildIndex(): { entries: SubtopicEntry[]; byId: Map<string, SubtopicEntry> } {
  const entries: SubtopicEntry[] = [];
  for (const s of subjects) {
    for (const st of s.subtopics) {
      entries.push({
        subtopicId: st.id,
        subtopicName: st.name,
        questionCount: st.questionCount,
        subjectId: s.id,
        subjectName: s.name,
      });
    }
  }
  return { entries, byId: new Map(entries.map((e) => [e.subtopicId, e])) };
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function CreateQuizModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { entries, byId } = useMemo(buildIndex, []);

  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [desiredCount, setDesiredCount] = useState(DEFAULT_QUIZ_SIZE);

  // Reset selection each time the modal opens fresh
  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setActiveSubject(null);
      setDesiredCount(DEFAULT_QUIZ_SIZE);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock background scroll while the modal is open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* ── Selection helpers ── */
  const toggleSubtopic = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Click a subject to drill in; click it again (or the rail header) to collapse back
  const handleSubjectClick = (subject: Subject) => {
    setActiveSubject((prev) => (prev?.id === subject.id ? null : subject));
  };

  const selectedInSubject = (subject: Subject) =>
    subject.subtopics.filter((st) => selected.has(st.id)).length;

  const allSelectedInSubject = (subject: Subject) =>
    subject.subtopics.length > 0 && subject.subtopics.every((st) => selected.has(st.id));

  const toggleSubjectAll = (subject: Subject) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const all = subject.subtopics.every((st) => next.has(st.id));
      subject.subtopics.forEach((st) => (all ? next.delete(st.id) : next.add(st.id)));
      return next;
    });
  };

  const selectAllSubjects = () => setSelected(new Set(entries.map((e) => e.subtopicId)));
  const clearAll = () => setSelected(new Set());

  /* ── Totals ── */
  const selectedList = useMemo(
    () => [...selected].map((id) => byId.get(id)).filter(Boolean) as SubtopicEntry[],
    [selected, byId],
  );
  const totalQuestions = selectedList.reduce((sum, e) => sum + e.questionCount, 0);
  // User-chosen count, always clamped to the available pool (and ≥ 1 when any topic is picked).
  const quizQuestionCount =
    totalQuestions === 0 ? 0 : Math.min(Math.max(1, desiredCount), totalQuestions);
  // Exam time scales with the quiz size: 1.5 minutes per question.
  const durationMinutes = Math.max(5, Math.ceil(quizQuestionCount * 1.5));
  const everythingSelected = selected.size === entries.length && entries.length > 0;

  /* ── Start ── */
  const startQuiz = () => {
    if (selectedList.length === 0) return;
    const name =
      selectedList.length === 1
        ? `Custom Quiz — ${selectedList[0].subtopicName}`
        : `Custom Quiz — ${selectedList.length} topics`;
    saveCustomTestConfig({
      name,
      questionCount: quizQuestionCount,
      durationMinutes,
    });
    onClose();
    router.push(buildInstructionsUrl("custom"));
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

          {/* Panel — 60% width · 80% height */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Create Your Own Quiz"
            className="relative w-[92vw] lg:w-[60vw] h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/40 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create Your Own Quiz</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Pick your topics, set your rules.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={everythingSelected ? clearAll : selectAllSubjects}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  {everythingSelected ? "Clear All" : "Select All Subjects"}
                </button>
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
            </div>

            {/* ── Subject → Subtopic drill (expand/shrink like exam-prep) ── */}
            <div className="flex-1 min-h-0 flex m-4 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden bg-white/40 dark:bg-slate-800/20">

              {/* Column 1 — Subjects (full width until a subject is picked, then a rail) */}
              <div
                className={`border-r border-slate-200/60 dark:border-slate-700/40 overflow-y-auto overflow-x-hidden scrollbar-hide transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  activeSubject ? "flex-shrink-0" : "flex-1"
                }`}
                style={activeSubject ? { width: 160 } : undefined}
              >
                <div
                  onClick={activeSubject ? () => setActiveSubject(null) : undefined}
                  className={`px-3 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-white dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between ${
                    activeSubject ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60" : ""
                  }`}
                >
                  <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest whitespace-nowrap">Subjects</p>
                  {activeSubject && <span className="text-[10px] font-extrabold leading-none text-slate-400 dark:text-slate-500">&raquo;</span>}
                </div>
                <div className="py-1">
                  {subjects.map((subject) => {
                    const isActive = activeSubject?.id === subject.id;
                    const count = selectedInSubject(subject);
                    return (
                      <button
                        key={subject.id}
                        onClick={() => handleSubjectClick(subject)}
                        title={subject.name}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all duration-150 relative min-w-0 border-b border-slate-100 dark:border-slate-800/60 ${
                          isActive ? theme.activeBg : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {isActive && <div className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full ${theme.dot}`} />}
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? theme.dot : "bg-slate-300 dark:bg-slate-600"}`} />
                        <span className={`text-[12px] truncate flex-shrink min-w-0 ${isActive ? `font-bold ${theme.text}` : "font-normal text-slate-900 dark:text-slate-100"}`}>
                          {subject.name}
                        </span>
                        {count > 0 && (
                          <span className="ml-auto flex-shrink-0 text-[10px] font-bold text-white bg-emerald-500 rounded-full px-1.5 min-w-[18px] text-center">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2 — Subtopics (multi-select) — appears once a subject is picked */}
              {activeSubject && (
              <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                <div className="px-3 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-white dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest truncate">{activeSubject.name}</p>
                  <button
                    onClick={() => toggleSubjectAll(activeSubject)}
                    className="flex-shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap"
                  >
                    {allSelectedInSubject(activeSubject) ? "Deselect all" : "Select all"}
                  </button>
                </div>

                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={activeSubject.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="py-1"
                  >
                    {activeSubject.subtopics.map((st) => {
                      const isSelected = selected.has(st.id);
                      return (
                        <button
                          key={st.id}
                          onClick={() => toggleSubtopic(st.id)}
                          title={st.name}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-150 min-w-0 border-b border-slate-100 dark:border-slate-800/60 ${
                            isSelected ? theme.activeBg : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          {/* Checkbox */}
                          <span
                            className={`flex-shrink-0 w-4 h-4 rounded-[5px] border flex items-center justify-center transition-colors ${
                              isSelected ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span className={`text-[12px] truncate flex-shrink min-w-0 ${isSelected ? `font-bold ${theme.text}` : "font-normal text-slate-900 dark:text-slate-100"}`}>
                            {st.name}
                          </span>
                          <span className="ml-auto flex-shrink-0 text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{st.questionCount} Qs</span>
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
              )}
            </div>

            {/* ── Selected topics chips (under the selection card) ── */}
            <div className="flex-shrink-0 px-5 pb-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Selected Topics ({selectedList.length})
                </p>
                {selectedList.length > 0 && (
                  <button onClick={clearAll} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors">
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto scrollbar-hide">
                {selectedList.length === 0 ? (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">No topics selected yet — pick subtopics above.</span>
                ) : (
                  selectedList.map((e) => (
                    <span
                      key={e.subtopicId}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
                    >
                      <span className="truncate max-w-[180px]">{e.subtopicName}</span>
                      <button
                        onClick={() => toggleSubtopic(e.subtopicId)}
                        aria-label={`Remove ${e.subtopicName}`}
                        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center hover:bg-emerald-200/60 dark:hover:bg-emerald-800/40 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 py-4 border-t border-slate-200/60 dark:border-slate-700/40">
              {/* Question count picker */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Questions</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {totalQuestions > 0 ? `max ${totalQuestions}` : "select topics"}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, totalQuestions)}
                    value={totalQuestions === 0 ? "" : quizQuestionCount}
                    disabled={totalQuestions === 0}
                    placeholder="0"
                    onChange={(e) => setDesiredCount(Number(e.target.value))}
                    onBlur={(e) => {
                      const n = Number(e.target.value);
                      if (!n || n < 1) setDesiredCount(1);
                      else if (n > totalQuestions) setDesiredCount(totalQuestions);
                    }}
                    className="w-40 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] font-bold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  />
                </div>

                <div className="hidden sm:block w-px self-stretch bg-slate-200 dark:bg-slate-700/60" />

                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Time</span>
                  <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200 tabular-nums mt-0.5">
                    {quizQuestionCount > 0 ? `${durationMinutes} min` : "—"}
                  </span>
                </div>
              </div>

              <button
                onClick={startQuiz}
                disabled={selectedList.length === 0}
                className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 ${
                  selectedList.length === 0
                    ? "bg-slate-200 text-slate-400 dark:bg-slate-700/40 dark:text-slate-500 cursor-not-allowed"
                    : "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:-translate-y-0.5"
                }`}
              >
                Start Quiz &rarr;
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

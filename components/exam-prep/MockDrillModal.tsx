"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { subjects } from "./data";
import type { Subject, SubTopic } from "./data";
import { buildInstructionsUrl, saveCustomTestConfig } from "@/lib/testSession";

const theme = {
  text: "text-emerald-600 dark:text-emerald-400",
  dot: "bg-emerald-500",
  activeBg: "bg-emerald-50/80 dark:bg-emerald-900/20",
};

function getTotalQuestions(subject: Subject) {
  return subject.subtopics.reduce((sum, st) => sum + st.questionCount, 0);
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MockDrillModal({ open, onClose }: Props) {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedSubtopics, setSelectedSubtopics] = useState<SubTopic[]>([]);

  const handleSubjectClick = (subject: Subject) => {
    if (selectedSubject?.id === subject.id) {
      setSelectedSubject(null);
    } else {
      setSelectedSubject(subject);
    }
  };

  const toggleSubtopic = (subtopic: SubTopic) => {
    setSelectedSubtopics((prev) => {
      const exists = prev.find((s) => s.id === subtopic.id);
      if (exists) return prev.filter((s) => s.id !== subtopic.id);
      return [...prev, subtopic];
    });
  };

  const isSubtopicSelected = (id: string) => selectedSubtopics.some((s) => s.id === id);

  const removeSubtopic = (id: string) => {
    setSelectedSubtopics((prev) => prev.filter((s) => s.id !== id));
  };

  const totalSelectedQuestions = selectedSubtopics.reduce((sum, st) => sum + st.questionCount, 0);

  const handleClose = () => {
    setSelectedSubject(null);
    setSelectedSubtopics([]);
    onClose();
  };

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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
            style={{ height: "70vh" }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Your Own Quiz</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Pick subjects and subtopics to build your custom quiz</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            {/* Body — 2-column menu */}
            <div className="flex-1 flex min-h-0 overflow-hidden">

              {/* Column 1: Subjects */}
              <div
                className={`border-r border-slate-200 dark:border-slate-700 overflow-y-auto scrollbar-hide transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  selectedSubject ? "flex-shrink-0" : "flex-1"
                }`}
                style={selectedSubject ? { width: 120 } : undefined}
              >
                <div
                  onClick={selectedSubject ? () => setSelectedSubject(null) : undefined}
                  className={`px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between ${selectedSubject ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60" : ""}`}
                >
                  <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Subjects</p>
                  {selectedSubject && (
                    <span className="text-[10px] font-extrabold leading-none text-slate-400">&raquo;</span>
                  )}
                </div>

                <div className="py-1">
                  {subjects.map((subject) => {
                    const isActive = selectedSubject?.id === subject.id;
                    const totalQ = getTotalQuestions(subject);
                    const hasSelected = subject.subtopics.some((st) => isSubtopicSelected(st.id));
                    return (
                      <button
                        key={subject.id}
                        onClick={() => handleSubjectClick(subject)}
                        title={subject.name}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all duration-150 relative min-w-0 border-b border-slate-100 dark:border-slate-800/60
                          ${isActive ? theme.activeBg : "hover:bg-slate-50 dark:hover:bg-slate-800/40"}
                        `}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="drill-subject-indicator"
                            className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full ${theme.dot}`}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          />
                        )}
                        {hasSelected && !isActive && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${isActive ? theme.dot : "bg-slate-300 dark:bg-slate-600"}`} />
                        <span className={`text-[13px] truncate transition-colors flex-shrink min-w-0 ${isActive ? `font-bold ${theme.text}` : "font-normal text-slate-900 dark:text-slate-100"}`}>
                          {subject.name}
                        </span>
                        {!selectedSubject && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto flex-shrink-0 whitespace-nowrap">{totalQ} Qs</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Subtopics (multi-select) */}
              {selectedSubject && (
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest truncate">{selectedSubject.name}</p>
                  </div>

                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={selectedSubject.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="py-1"
                    >
                      {selectedSubject.subtopics.map((st) => {
                        const checked = isSubtopicSelected(st.id);
                        return (
                          <button
                            key={st.id}
                            onClick={() => toggleSubtopic(st)}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 border-b border-slate-100 dark:border-slate-800/60
                              ${checked ? theme.activeBg : "hover:bg-slate-50 dark:hover:bg-slate-800/40"}
                            `}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                              checked
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-slate-300 dark:border-slate-600"
                            }`}>
                              {checked && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-[13px] truncate flex-1 min-w-0 text-slate-900 dark:text-slate-100`}>
                              {st.name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">{st.questionCount} Qs</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer — Selected subtopics */}
            <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 flex-shrink-0">
              {selectedSubtopics.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {selectedSubtopics.length} subtopic{selectedSubtopics.length > 1 ? "s" : ""} selected
                    </span>
                    <button
                      onClick={() => {
                        saveCustomTestConfig({
                          name: `Custom Quiz — ${selectedSubtopics.map((s) => s.name).join(", ")}`,
                          // Cap custom drills at 50 questions, ~1 min per question
                          questionCount: Math.min(totalSelectedQuestions, 50),
                          durationMinutes: Math.min(totalSelectedQuestions, 50),
                        });
                        router.push(buildInstructionsUrl("custom"));
                      }}
                      className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-[13px] font-bold shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-transform duration-300"
                    >
                      Start Quiz &rarr;
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-hide">
                    {selectedSubtopics.map((st) => (
                      <span
                        key={st.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
                      >
                        {st.name}
                        <button
                          onClick={() => removeSubtopic(st.id)}
                          className="ml-0.5 text-emerald-500 hover:text-red-500 transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-slate-400 dark:text-slate-500 text-center py-1">Select subtopics from above to build your custom quiz.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

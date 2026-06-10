"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subjects } from "./data";
import type { Subject, SubTopic } from "./data";

/* ─── Green Theme ─────────────────────────────────────────────────────── */
const theme = {
  bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
  text: "text-emerald-600 dark:text-emerald-400",
  border: "border-emerald-200/60 dark:border-emerald-800/40",
  ring: "ring-emerald-500/20",
  dot: "bg-emerald-500",
  activeBg: "bg-emerald-50/80 dark:bg-emerald-900/20",
};

/* ─── Component ───────────────────────────────────────────────────────── */
export default function SubjectMenu() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<SubTopic | null>(null);

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedSubtopic(null);
  };

  const handleSubtopicClick = (subtopic: SubTopic) => {
    setSelectedSubtopic(subtopic);
  };

  const handleExpandSubjects = () => {
    setSelectedSubject(null);
    setSelectedSubtopic(null);
  };

  const handleExpandSubtopics = () => {
    setSelectedSubtopic(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Title */}
      <div className="mb-4 pl-4 sm:pl-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Medical Subjects</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Master every topic, drill your weak areas, and pass with confidence.</p>
      </div>

      {/* ─── 3-Column Vertical Menu ───────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 gap-0 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden bg-white/40 dark:bg-slate-800/20 mt-[10px] ml-[10px]">

        {/* ── Column 1: Subjects ──────────────────────────────────────── */}
        <div
          className={`border-r border-slate-200/60 dark:border-slate-700/40 overflow-y-auto overflow-x-hidden scrollbar-hide transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            selectedSubject ? "flex-shrink-0" : "flex-1"
          }`}
          style={selectedSubject ? { width: 100 } : undefined}
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-white dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest whitespace-nowrap">Subjects</p>
            {selectedSubject && (
              <button
                onClick={handleExpandSubjects}
                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                title="Expand subjects"
              >
                <span className="text-[10px] font-extrabold leading-none">&raquo;</span>
              </button>
            )}
          </div>

          <div className="py-1">
            {subjects.map((subject) => {
              const isActive = selectedSubject?.id === subject.id;
              return (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject)}
                  title={subject.name}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all duration-150 relative min-w-0
                    ${isActive
                      ? theme.activeBg
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="subject-indicator"
                      className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full ${theme.dot}`}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${isActive ? theme.dot : "bg-slate-300 dark:bg-slate-600"}`} />
                  <span className={`text-[13px] truncate transition-colors ${isActive ? `font-bold ${theme.text}` : "font-normal text-slate-500 dark:text-slate-400"}`}>
                    {subject.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Column 2: Subtopics ─────────────────────────────────────── */}
        {selectedSubject && (
          <div
            className={`border-r border-slate-200/60 dark:border-slate-700/40 overflow-y-auto overflow-x-hidden scrollbar-hide transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              selectedSubtopic ? "flex-shrink-0" : "flex-1"
            }`}
            style={selectedSubtopic ? { width: 100 } : undefined}
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-white dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest truncate">{selectedSubject.name}</p>
              {selectedSubtopic && (
                <button
                  onClick={handleExpandSubtopics}
                  className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                  title="Expand subtopics"
                >
                  <span className="text-[10px] font-extrabold leading-none">&raquo;</span>
                </button>
              )}
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
                  const isActive = selectedSubtopic?.id === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => handleSubtopicClick(st)}
                      title={st.name}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all duration-150 relative min-w-0
                        ${isActive
                          ? theme.activeBg
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="subtopic-indicator"
                          className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full ${theme.dot}`}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )}
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${isActive ? theme.dot : "bg-slate-300 dark:bg-slate-600"}`} />
                      <span className={`text-[13px] truncate transition-colors ${isActive ? `font-bold ${theme.text}` : "font-normal text-slate-500 dark:text-slate-400"}`}>
                        {st.name}
                      </span>
                      {!selectedSubtopic && (
                        <span className={`text-[10px] font-bold flex-shrink-0 ml-auto transition-colors ${isActive ? theme.text : "text-slate-400 dark:text-slate-500"}`}>
                          {st.questionCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* ── Column 3: Tests ─────────────────────────────────────────── */}
        {selectedSubject && selectedSubtopic && (
          <div className="flex-1 overflow-y-auto scrollbar-hide scroll-smooth will-change-scroll" style={{ WebkitOverflowScrolling: "touch", transform: "translateZ(0)" }}>
            <div className="px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-white dark:bg-slate-900 sticky top-0 z-10">
              <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                Choose a test &mdash; {selectedSubtopic.name}
              </p>
            </div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={selectedSubtopic.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="p-4 flex flex-col gap-3"
              >
                {selectedSubtopic.quizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    className="group/test relative rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/40 bg-white/60 dark:bg-slate-800/30 hover:shadow-lg hover:border-emerald-400/50 dark:hover:border-emerald-500/40 hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-200 text-left will-change-transform"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 group-hover/test:text-emerald-700 dark:group-hover/test:text-emerald-300 transition-colors">
                        {quiz.name}
                      </h4>
                      <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover/test:opacity-100 transition-opacity">
                        Start &rarr;
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2.5">
                      {quiz.description}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      <span>{quiz.duration}</span>
                      <span>&middot;</span>
                      <span>{quiz.questionCount} Questions</span>
                    </div>
                  </button>
                ))}

                {/* Subtopic summary */}
                <div className="mt-1 px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/30">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Total available: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedSubtopic.questionCount} questions</span>
                    </span>
                    <span className={`font-bold ${theme.text}`}>
                      {selectedSubject.name} &rsaquo; {selectedSubtopic.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

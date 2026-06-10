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
  const [selectedSubject, setSelectedSubject] = useState<Subject>(subjects[0]);
  const [selectedSubtopic, setSelectedSubtopic] = useState<SubTopic>(subjects[0].subtopics[0]);
  const [subjectsCollapsed, setSubjectsCollapsed] = useState(false);
  const [subtopicsCollapsed, setSubtopicsCollapsed] = useState(false);

  const colors = theme;

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedSubtopic(subject.subtopics[0]);
    // Shrink subjects (user made their pick), expand subtopics so they can choose next
    setSubjectsCollapsed(true);
    setSubtopicsCollapsed(false);
  };

  const handleSubtopicClick = (subtopic: SubTopic) => {
    setSelectedSubtopic(subtopic);
    // Shrink subtopics (user made their pick), tests get max space
    setSubtopicsCollapsed(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Medical Subjects</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Master every topic, drill your weak areas, and pass with confidence.</p>
      </div>

      {/* ─── 3-Column Vertical Menu ───────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 gap-0 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden bg-white/40 dark:bg-slate-800/20">

        {/* ── Column 1: Subjects (collapsible) ────────────────────────── */}
        <div
          className="flex-shrink-0 border-r border-slate-200/60 dark:border-slate-700/40 overflow-y-auto overflow-x-hidden scrollbar-hide transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: subjectsCollapsed ? 100 : 200 }}
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-slate-50/80 dark:bg-slate-800/60 sticky top-0 z-10 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Subjects</p>
            {subjectsCollapsed && (
              <button
                onClick={() => setSubjectsCollapsed(false)}
                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                title="Expand subjects"
              >
                <span className="text-[10px] font-extrabold leading-none">&raquo;</span>
              </button>
            )}
          </div>

          <div className="py-1">
            {subjects.map((subject) => {
              const isActive = selectedSubject.id === subject.id;
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

        {/* ── Column 2: Subtopics (collapsible) ────────────────────────── */}
        <div
          className="flex-shrink-0 border-r border-slate-200/60 dark:border-slate-700/40 overflow-y-auto overflow-x-hidden scrollbar-hide transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: subtopicsCollapsed ? 100 : 220 }}
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-slate-50/80 dark:bg-slate-800/60 sticky top-0 z-10 flex items-center justify-between">
            <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${colors.text}`}>{selectedSubject.name}</p>
            {subtopicsCollapsed && (
              <button
                onClick={() => setSubtopicsCollapsed(false)}
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
                const isActive = selectedSubtopic.id === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleSubtopicClick(st)}
                    title={st.name}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all duration-150 relative min-w-0
                      ${isActive
                        ? colors.activeBg
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="subtopic-indicator"
                        className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full ${colors.dot}`}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${isActive ? colors.dot : "bg-slate-300 dark:bg-slate-600"}`} />
                    <span className={`text-[13px] truncate transition-colors ${isActive ? `font-bold ${colors.text}` : "font-normal text-slate-500 dark:text-slate-400"}`}>
                      {st.name}
                    </span>
                    {!subtopicsCollapsed && (
                      <span className={`text-[10px] font-bold flex-shrink-0 ml-auto transition-colors ${isActive ? colors.text : "text-slate-400 dark:text-slate-500"}`}>
                        {st.questionCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Column 3: Tests ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-slate-50/80 dark:bg-slate-800/60 sticky top-0 z-10">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
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
                  className="group/test relative rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/40 bg-white/60 dark:bg-slate-800/30 hover:shadow-lg hover:border-emerald-400/50 dark:hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 text-left"
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
                  <span className={`font-bold ${colors.text}`}>
                    {selectedSubject.name} &rsaquo; {selectedSubtopic.name}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

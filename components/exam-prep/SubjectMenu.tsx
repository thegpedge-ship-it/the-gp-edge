"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { subjects } from "./data";
import type { Subject, SubTopic } from "./data";
import { buildInstructionsUrl } from "@/lib/testSession";

/* ─── Green Theme ─────────────────────────────────────────────────────── */
const theme = {
  bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
  text: "text-emerald-600 dark:text-emerald-400",
  border: "border-emerald-200/60 dark:border-emerald-800/40",
  ring: "ring-emerald-500/20",
  dot: "bg-emerald-500",
  activeBg: "bg-emerald-50/80 dark:bg-emerald-900/20",
};

function getTotalQuestions(subject: Subject) {
  return subject.subtopics.reduce((sum, st) => sum + st.questionCount, 0);
}

function getMockProgress(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 100;
  return Math.max(10, Math.min(85, hash));
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function SubjectMenu() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<SubTopic | null>(null);

  const handleSubjectClick = (subject: Subject) => {
    if (selectedSubject?.id === subject.id) {
      setSelectedSubject(null);
      setSelectedSubtopic(null);
    } else {
      setSelectedSubject(subject);
      setSelectedSubtopic(null);
    }
  };

  const handleSubtopicClick = (subtopic: SubTopic) => {
    if (selectedSubtopic?.id === subtopic.id) {
      setSelectedSubtopic(null);
    } else {
      setSelectedSubtopic(subtopic);
    }
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
      <div className="mb-4 pl-4 sm:pl-6 mt-1">
        <h1 className="font-serif text-[1.5rem] md:text-[1.8rem] lg:text-[2.4rem] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100">Exam Preparation</h1>
        <p className="font-sans text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400 mt-1">Master every topic, drill your weak areas, and pass with confidence.</p>
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
          <div
            onClick={selectedSubject ? handleExpandSubjects : undefined}
            className={`px-3 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-white dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between ${selectedSubject ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60" : ""}`}
          >
            <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest whitespace-nowrap">Subjects</p>
            {selectedSubject && (
              <span className="text-[10px] font-extrabold leading-none text-slate-400 dark:text-slate-500">&raquo;</span>
            )}
          </div>

          <div className="py-1">
            {subjects.map((subject) => {
              const isActive = selectedSubject?.id === subject.id;
              const totalQ = getTotalQuestions(subject);
              const progress = getMockProgress(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject)}
                  title={subject.name}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all duration-150 relative min-w-0 border-b border-slate-100 dark:border-slate-800/60
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
                  <span className={`text-[13px] truncate transition-colors flex-shrink min-w-0 ${isActive ? `font-bold ${theme.text}` : "font-normal text-slate-900 dark:text-slate-100"}`}>
                    {subject.name}
                  </span>
                  {!selectedSubject && (
                    <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{totalQ} Qs</span>
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 w-7 text-right">{progress}%</span>
                    </div>
                  )}
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
            <div
              onClick={selectedSubtopic ? handleExpandSubtopics : undefined}
              className={`px-3 py-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-white dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between ${selectedSubtopic ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60" : ""}`}
            >
              <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest truncate">{selectedSubject.name}</p>
              {selectedSubtopic && (
                <span className="text-[10px] font-extrabold leading-none text-slate-400 dark:text-slate-500">&raquo;</span>
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
                  const progress = getMockProgress(st.id);
                  return (
                    <button
                      key={st.id}
                      onClick={() => handleSubtopicClick(st)}
                      title={st.name}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all duration-150 relative min-w-0 border-b border-slate-100 dark:border-slate-800/60
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
                      <span className={`text-[13px] truncate transition-colors flex-shrink min-w-0 ${isActive ? `font-bold ${theme.text}` : "font-normal text-slate-900 dark:text-slate-100"}`}>
                        {st.name}
                      </span>
                      {!selectedSubtopic && (
                        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{st.questionCount} Qs</span>
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 w-7 text-right">{progress}%</span>
                        </div>
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
                  <div
                    key={quiz.id}
                    className="relative rounded-2xl p-4 border border-slate-100 dark:border-slate-700/40 bg-white/60 dark:bg-slate-800/30 text-left hover:scale-[1.03] hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
                        {quiz.name}
                      </h4>
                      <span className={`text-[10px] font-normal tracking-wide px-2 py-0.5 rounded-full ${
                        quiz.difficulty === "Easy"
                          ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                          : quiz.difficulty === "Medium"
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                          : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                      }`}>
                        {quiz.difficulty}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                      {quiz.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        <span>{quiz.duration}</span>
                        <span>&middot;</span>
                        <span>{quiz.questionCount} Qs</span>
                      </div>
                      <button
                        onClick={() => router.push(buildInstructionsUrl(quiz.id))}
                        className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[12px] font-normal tracking-wide transition-colors duration-200"
                      >
                        Start
                      </button>
                    </div>
                  </div>
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

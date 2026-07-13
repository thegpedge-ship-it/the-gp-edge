"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getQuizQuestionIds } from "@/app/exam-prep/actions";
import type { ExamSubject, ExamSubtopic, ExamQuiz } from "@/app/exam-prep/actions";
import { cachedExamSubjects, cachedSubtopics, cachedQuizzes, cachedMockTests } from "@/lib/examCache";
import { buildInstructionsUrl, saveTestPlan } from "@/lib/testSession";
import ViewReportButton from "@/components/report/ViewReportButton";

/* ─── Green Theme ─────────────────────────────────────────────────────── */
const theme = {
  text: "text-emerald-600 dark:text-emerald-400",
  dot: "bg-emerald-500",
  activeBg: "bg-emerald-50/80 dark:bg-emerald-900/20",
};

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="w-7 h-7 rounded-full border-2 border-emerald-100 dark:border-emerald-900/40 border-t-emerald-500 animate-spin" />
      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{label}</p>
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function SubjectMenu() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<ExamSubject[] | null>(null); // null = loading
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<ExamSubtopic | null>(null);

  // Lazily-loaded caches, keyed by parent id.
  const [subtopicsBySubject, setSubtopicsBySubject] = useState<Record<string, ExamSubtopic[]>>({});
  const [quizzesBySubtopic, setQuizzesBySubtopic] = useState<Record<string, ExamQuiz[]>>({});
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  // Step 1 — load the user's subjects once. Also warm the mock-tests cache so
  // the "Do a Mock Test" modal opens instantly if visited next (the cache
  // de-dupes with the page-level prefetch).
  useEffect(() => {
    let cancelled = false;
    void cachedMockTests();
    cachedExamSubjects().then((s) => {
      if (!cancelled) setSubjects(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Step 2 — load subtopics when a subject is opened.
  const handleSubjectClick = async (subject: ExamSubject) => {
    if (selectedSubject?.id === subject.id) {
      setSelectedSubject(null);
      setSelectedSubtopic(null);
      return;
    }
    setSelectedSubject(subject);
    setSelectedSubtopic(null);
    if (!subtopicsBySubject[subject.id]) {
      setLoadingSubtopics(true);
      const sts = await cachedSubtopics(subject.id);
      setSubtopicsBySubject((prev) => ({ ...prev, [subject.id]: sts }));
      setLoadingSubtopics(false);
    }
  };

  // Step 3 — load quizzes when a subtopic is opened.
  const handleSubtopicClick = async (subtopic: ExamSubtopic) => {
    if (selectedSubtopic?.id === subtopic.id) {
      setSelectedSubtopic(null);
      return;
    }
    setSelectedSubtopic(subtopic);
    if (!quizzesBySubtopic[subtopic.id]) {
      setLoadingQuizzes(true);
      const qs = await cachedQuizzes(subtopic.id);
      setQuizzesBySubtopic((prev) => ({ ...prev, [subtopic.id]: qs }));
      setLoadingQuizzes(false);
    }
  };

  const handleExpandSubjects = () => {
    setSelectedSubject(null);
    setSelectedSubtopic(null);
  };

  const handleExpandSubtopics = () => {
    setSelectedSubtopic(null);
  };

  // Step 4/5 — resolve the question ids, stash the plan, go to instructions.
  const handleStart = async (quiz: ExamQuiz) => {
    if (!selectedSubtopic || startingId) return;
    setStartingId(quiz.id);
    const detail = await getQuizQuestionIds(quiz.id);
    setStartingId(null);
    if (!detail || detail.questionIds.length === 0) return;
    saveTestPlan({
      testId: quiz.id,
      source: "quiz",
      quizId: quiz.id,
      name: `${selectedSubtopic.name} — ${quiz.name}`,
      questionIds: detail.questionIds,
      durationMinutes: detail.timeLimitMin ?? 10,
      timed: false,
    });
    router.push(buildInstructionsUrl(quiz.id));
  };

  const subtopics = selectedSubject ? subtopicsBySubject[selectedSubject.id] : undefined;
  const quizzes = selectedSubtopic ? quizzesBySubtopic[selectedSubtopic.id] : undefined;

  return (
    <div className="flex flex-col h-full">
      {/* ─── 3-Column Vertical Menu ───────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 gap-0 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden bg-white/40 dark:bg-slate-800/20">

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

          {subjects === null ? (
            <Spinner label="Loading subjects…" />
          ) : subjects.length === 0 ? (
            <p className="px-4 py-10 text-center text-[12px] text-slate-400 dark:text-slate-500">
              No subjects available for your exam yet.
            </p>
          ) : (
            <div className="py-1">
              {subjects.map((subject) => {
                const isActive = selectedSubject?.id === subject.id;
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
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-auto flex-shrink-0">{subject.questionCount} Qs</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
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

            {!subtopics && loadingSubtopics ? (
              <Spinner label="Loading subtopics…" />
            ) : subtopics && subtopics.length === 0 ? (
              <p className="px-4 py-10 text-center text-[12px] text-slate-400 dark:text-slate-500">No subtopics yet.</p>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={selectedSubject.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="py-1"
                >
                  {(subtopics ?? []).map((st) => {
                    const isActive = selectedSubtopic?.id === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => handleSubtopicClick(st)}
                        title={st.name}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all duration-150 relative min-w-0 border-b border-slate-100 dark:border-slate-800/60
                          ${isActive ? theme.activeBg : "hover:bg-slate-50 dark:hover:bg-slate-800/40"}
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
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-auto flex-shrink-0">{st.questionCount} Qs</span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
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

            {!quizzes && loadingQuizzes ? (
              <Spinner label="Loading tests…" />
            ) : quizzes && quizzes.length === 0 ? (
              <p className="px-4 py-10 text-center text-[12px] text-slate-400 dark:text-slate-500">
                No tests available for this subtopic yet.
              </p>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={selectedSubtopic.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="p-4 flex flex-col gap-3"
                >
                  {(quizzes ?? []).map((quiz) => (
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
                        <div className="flex items-center gap-2.5">
                          <ViewReportButton testId={quiz.id} variant="link" />
                          <button
                            onClick={() => handleStart(quiz)}
                            disabled={startingId === quiz.id}
                            className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-wait text-white text-[12px] font-normal tracking-wide transition-colors duration-200"
                          >
                            {startingId === quiz.id ? "Loading…" : "Start"}
                          </button>
                        </div>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

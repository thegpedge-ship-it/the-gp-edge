"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import {
  themeBadge,
  themeBadgePill,
  themeBadgeSm,
  themeBorder,
  themeBtnGhost,
  themeBtnPrimary,
  themeDot,
  themeIconBtn,
  themeInput,
  themeLabel,
  themeMuted,
  themePanel,
  themeProgressFill,
  themeText,
} from "@/lib/adminTheme";
import { Quiz, Question, createQuiz, getQuizzes, deleteQuiz, getQuestions } from "@/lib/quizData";
import { addUserNotification } from "@/utils/notifications";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const stuckSessions = [
  { id: 1, user: "Account #1082", quiz: "AKT Full Mock Exam 2026", startedAt: "28 May, 10:32 AM", progress: "87/150", status: "stuck" },
  { id: 2, user: "Account #1138", quiz: "KFP Practice — Cardiovascular", startedAt: "27 May, 3:15 PM", progress: "12/26", status: "stuck" },
  { id: 3, user: "Account #1204", quiz: "Mental Health Focused Quiz", startedAt: "26 May, 9:00 AM", progress: "5/30", status: "abandoned" },
];

type ViewMode = "grid" | "table";



export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessions, setSessions] = useState(stuckSessions);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizLimit, setQuizLimit] = useState(50);
  const [quizTimeLimit, setQuizTimeLimit] = useState(60);
  const [quizPassingScore, setQuizPassingScore] = useState(65);
  const [quizRandomize, setQuizRandomize] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);

  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);

  const sortedQuizzes = useMemo(() => {
    return [...quizzes].sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return b.id - a.id;
    });
  }, [quizzes]);

  const displayedQuizzes = useMemo(() => {
    return sortedQuizzes.slice(0, visibleCount);
  }, [sortedQuizzes, visibleCount]);

  useEffect(() => {
    setQuizzes(getQuizzes());
  }, []);

  // Lock body scroll when modal or preview is open to prevent background scrolling lag
  useEffect(() => {
    if (showCreateModal || previewQuiz) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showCreateModal, previewQuiz]);

  const resetSession = (id: number) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };


  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Quiz"
        highlightedText="Management"
        subtitle="Configure and manage mock exams"
        actions={
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-teal-50/60 dark:bg-teal-950/20 rounded-xl p-1 gap-0.5 border border-teal-100 dark:border-teal-900/30">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-teal-950/40 text-teal-800 dark:text-teal-100 shadow-sm" : themeIconBtn}`}
                title="Card View"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white dark:bg-teal-950/40 text-teal-800 dark:text-teal-100 shadow-sm" : themeIconBtn}`}
                title="Table View"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </button>
            </div>
            <button
              onClick={() => {
                setQuizName("");
                setQuizDescription("");
                setQuizLimit(50);
                setQuizTimeLimit(60);
                setQuizPassingScore(65);
                setQuizRandomize(true);
                setShowCreateModal(true);
              }}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 ${themeBtnPrimary}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create Mock Exam
            </button>
          </div>
        }
        variants={itemVariants}
      />



      {viewMode === "grid" && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayedQuizzes.map((quiz, idx) => {
            return (
              <motion.div
                key={quiz.id}
                onClick={() => router.push(`/admin/quizzes/${quiz.id}/edit`)}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative ${themePanel} overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-300/60 hover:-translate-y-1 transition-all duration-300`}
              >
                {/* Header */}
                <div className="relative bg-teal-800 bg-gradient-to-r from-teal-800 to-teal-900 px-5 py-4">
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white leading-snug">{quiz.name}</p>
                      <p className="text-[11px] text-teal-100 mt-1">{quiz.questionCount} questions · {quiz.timeLimit} min</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border shrink-0 bg-white/15 text-white border-white/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                      {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  {/* Topics */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {quiz.topics.map((t) => (
                      <span key={t} className={themeBadgePill}>{t}</span>
                    ))}
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    <div className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-center">
                      <p className="text-sm font-bold text-teal-800 dark:text-teal-300">{quiz.avgScore > 0 ? `${quiz.avgScore}%` : "—"}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Avg Score</p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-center">
                      <p className="text-sm font-bold text-teal-800 dark:text-teal-300">{quiz.passingScore}%</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Pass Mark</p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-center">
                      <p className="text-sm font-bold text-teal-800 dark:text-teal-300">{quiz.attempts.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Attempts</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-teal-100/60 dark:border-teal-900/30">
                    <div className={`flex items-center gap-1 text-[10px] font-medium ${themeMuted}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {quiz.timeLimit} min limit
                    </div>
                    <div className="flex items-center gap-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPreviewQuiz(quiz); }}
                        className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`}
                        title="Preview Quiz"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <Link
                        href={`/admin/quizzes/${quiz.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`}
                        title="Edit Quiz"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this mock exam?")) {
                            const deleted = deleteQuiz(quiz.id);
                            if (deleted) setQuizzes(getQuizzes());
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all"
                        title="Delete Quiz"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ========== TABLE VIEW ========== */}
      {viewMode === "table" && (
        <motion.div variants={itemVariants} className={`${themePanel} overflow-hidden relative`}>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/15 dark:from-slate-900/60 via-transparent to-teal-50/5 dark:to-teal-950/10 pointer-events-none" />
          <div className="relative z-10">
            <div className={`px-6 py-4 border-b ${themeBorder}`}>
              <h3 className="text-sm font-bold text-teal-900 dark:text-teal-100">All Quizzes</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${themeBorder}`}>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-6 py-3">Quiz</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Questions</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Time</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Pass %</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Attempts</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Avg Score</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-50 dark:divide-teal-900/20">
                {displayedQuizzes.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => router.push(`/admin/quizzes/${q.id}/edit`)}
                    className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-teal-950 dark:text-teal-50/90">{q.name}</p>
                      <div className="flex items-center gap-1 mt-1">{q.topics.map((t) => <span key={t} className={themeBadgeSm}>{t}</span>)}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-teal-800/80 dark:text-teal-300/80">{q.questionCount}</td>
                    <td className="px-4 py-4 text-sm text-teal-800/80 dark:text-teal-300/80">{q.timeLimit} min</td>
                    <td className="px-4 py-4 text-sm font-semibold text-teal-800 dark:text-teal-300">{q.passingScore}%</td>
                    <td className="px-4 py-4 text-sm text-teal-800/80 dark:text-teal-300/80">{q.attempts.toLocaleString()}</td>
                    <td className="px-4 py-4">
                        {q.avgScore > 0 ? (
                        <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">{q.avgScore}%</span>
                      ) : <span className="text-xs text-teal-400/60">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${themeBadge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${themeDot}`} />
                        {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {sortedQuizzes.length > visibleCount && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 9)}
            className={`px-6 py-3 text-sm font-semibold rounded-xl border transition-all flex items-center gap-2 hover:shadow-lg ${themeBtnGhost} bg-white dark:bg-slate-900 border-teal-200/60 dark:border-teal-900/40 text-teal-800 dark:text-teal-300`}
          >
            <svg className="w-4 h-4 animate-bounce shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
            </svg>
            See More Quizzes
          </button>
        </div>
      )}

      {/* Stuck sessions */}
      <motion.div variants={itemVariants} className={`${themePanel} overflow-hidden relative`}>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/15 dark:from-slate-900/60 via-transparent to-teal-50/5 dark:to-teal-950/10 pointer-events-none" />
        <div className="relative z-10">
          <div className={`px-6 py-4 border-b flex items-center justify-between ${themeBorder}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${themeDot}`} />
              <h3 className="text-sm font-bold text-teal-900 dark:text-teal-100">Stuck / Abandoned Sessions</h3>
            </div>
            <span className={`text-xs ${themeMuted}`}>{sessions.length} sessions</span>
          </div>
        </div>
        {sessions.length > 0 ? (
          <div className="divide-y divide-teal-50 dark:divide-teal-900/20">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="px-6 py-4 flex items-center justify-between relative z-10 hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-teal-950 dark:text-teal-50/90">{s.user}</p>
                  <p className={`text-xs ${themeMuted}`}>{s.quiz} · Started {s.startedAt} · Progress: {s.progress}</p>
                </div>
                <button
                  onClick={() => resetSession(s.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300 ${themeBadge} hover:bg-teal-100 dark:hover:bg-teal-950/40`}
                >
                  Reset Session
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8"><p className={`text-sm ${themeMuted}`}>No stuck sessions</p></div>
        )}
      </motion.div>

      {/* Create Quiz Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50" onClick={() => setShowCreateModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 15 }} transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }} className={`fixed inset-x-4 top-[10%] mx-auto max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border rounded-2xl z-50 shadow-2xl overflow-y-auto max-h-[80vh] ${themeBorder}`}>
              <div className="p-6 text-teal-950 dark:text-teal-50/90">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-normal text-teal-900 dark:text-teal-100 tracking-tight leading-none">Create Mock Exam</h2>
                  <button onClick={() => setShowCreateModal(false)} className={`p-2 rounded-xl transition-all ${themeIconBtn}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="space-y-4">
                  <div><label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Quiz Name</label><input type="text" value={quizName} onChange={(e) => setQuizName(e.target.value)} className={`w-full px-4 py-2.5 text-sm dark:text-slate-100 rounded-xl transition-all ${themeInput}`} placeholder="e.g. AKT Mock Exam 2026" /></div>
                  <div><label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Description</label><textarea rows={2} value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} className={`w-full px-4 py-3 text-sm dark:text-slate-100 rounded-xl resize-none ${themeInput}`} placeholder="Brief description..." /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Question Limit</label><input type="number" value={quizLimit} onChange={(e) => setQuizLimit(Number(e.target.value))} className={`w-full px-4 py-2.5 text-sm dark:text-slate-100 rounded-xl ${themeInput}`} /></div>
                    <div><label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Timer (mins)</label><input type="number" value={quizTimeLimit} onChange={(e) => setQuizTimeLimit(Number(e.target.value))} className={`w-full px-4 py-2.5 text-sm dark:text-slate-100 rounded-xl ${themeInput}`} /></div>
                    <div><label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Passing Score (%)</label><input type="number" value={quizPassingScore} onChange={(e) => setQuizPassingScore(Number(e.target.value))} className={`w-full px-4 py-2.5 text-sm dark:text-slate-100 rounded-xl ${themeInput}`} /></div>
                    <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={quizRandomize} onChange={(e) => setQuizRandomize(e.target.checked)} className="w-4 h-4 rounded border-teal-300 dark:border-teal-700 text-teal-700 focus:ring-teal-700/20 dark:bg-teal-950/20" /><span className={`text-sm ${themeLabel}`}>Randomize</span></label></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowCreateModal(false)} className={themeBtnGhost}>Cancel</button>
                    <button
                      onClick={() => {
                        const finalName = quizName.trim() || "AKT Mock Exam 2026";
                        const newQuiz = createQuiz({
                          name: finalName,
                          description: quizDescription.trim(),
                          timeLimit: quizTimeLimit || 60,
                          passingScore: quizPassingScore || 65,
                          randomize: quizRandomize,
                          status: "draft",
                          examType: "AKT",
                        });
                        setQuizzes(getQuizzes());
                        setShowCreateModal(false);
                        addUserNotification(
                          `New Quiz Draft: ${finalName}`,
                          `A new mock exam draft has been created. Add questions and publish when ready.`,
                          quizLimit || 50,
                          "quiz"
                        );
                        setQuizName("");
                        setQuizDescription("");
                        setQuizLimit(50);
                        setQuizTimeLimit(60);
                        setQuizPassingScore(65);
                        router.push(`/admin/quizzes/${newQuiz.id}/edit`);
                      }}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${themeBtnPrimary}`}
                    >
                      Create Quiz
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quiz Preview Modal */}
      <AnimatePresence>
        {previewQuiz && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] cursor-pointer"
              onClick={() => setPreviewQuiz(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }}
              className={`fixed inset-x-4 top-[5%] mx-auto w-full max-w-4xl bg-white dark:bg-slate-900 border rounded-2xl z-[70] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${themeBorder}`}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#090d16] text-white rounded-t-2xl">
                <div>
                  <h3 className="font-serif text-lg font-bold">Quiz Preview</h3>
                  <p className="text-xs text-slate-400">Reviewing: {previewQuiz.name}</p>
                </div>
                <button
                  onClick={() => setPreviewQuiz(null)}
                  className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[calc(90vh-160px)] text-slate-900 dark:text-slate-100">
                {/* Quiz Meta Info */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-2">
                  <h4 className="text-sm font-bold text-teal-800 dark:text-teal-400">Quiz Specifications</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-455 leading-relaxed">
                    {previewQuiz.description || "No description provided."}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-350">Questions:</span> {previewQuiz.questionIds.length}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-350">Time Limit:</span> {previewQuiz.timeLimit} minutes
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-350">Passing Score:</span> {previewQuiz.passingScore}%
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-350">Status:</span>{" "}
                      <span className="capitalize font-semibold text-teal-700 dark:text-teal-400">{previewQuiz.status}</span>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                  {(() => {
                    const allQs = getQuestions();
                    const previewQuestions = previewQuiz.questionIds
                      .map((id) => allQs.find((q) => q.id === id))
                      .filter(Boolean) as Question[];

                    if (previewQuestions.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          No questions have been assigned to this mock exam yet.
                        </p>
                      );
                    }

                    return previewQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border ${themeBorder} ${themePanel} space-y-4 shadow-sm text-slate-900 dark:text-slate-100`}
                      >
                        {/* Question Header */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
                            Question {idx + 1} of {previewQuestions.length}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-400">
                            ID: #{q.id}
                          </span>
                        </div>

                        {/* Question Text */}
                        <p className="text-sm font-medium leading-relaxed">{q.text}</p>

                        {/* Diagnostic Image (if exists) */}
                        {q.image && (
                          <div className="max-w-md border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/20 p-2">
                            <img
                              src={q.image}
                              alt={`Clinical diagnostic for question ${q.id}`}
                              className="max-h-60 object-contain rounded mx-auto"
                            />
                          </div>
                        )}

                        {/* Multiple Choice Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {q.options.map((opt, oidx) => {
                            const isCorrect = q.correctIndex === oidx;
                            const letter = String.fromCharCode(65 + oidx);
                            return (
                              <div
                                key={oidx}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-xs font-semibold ${
                                  isCorrect
                                    ? "bg-teal-50/50 border-teal-500 text-teal-900 dark:bg-teal-950/20 dark:border-teal-700 dark:text-teal-300 shadow-sm"
                                    : "bg-slate-50/20 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 text-[10px] font-bold ${
                                    isCorrect
                                      ? "border-teal-600 dark:border-teal-400 bg-teal-600 dark:bg-teal-400 text-white"
                                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400"
                                  }`}
                                >
                                  {isCorrect ? (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    letter
                                  )}
                                </div>
                                <span className="leading-snug">{opt}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Rationale Section */}
                        <div className="bg-slate-50/60 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Rationale / Explanation
                          </span>
                          <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                            {q.rationale || "No explanation provided."}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setPreviewQuiz(null)}
                  className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition-all ${themeBtnPrimary}`}
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

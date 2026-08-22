"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import { Layers } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminRole } from "@/hooks/useAdminRole";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import CustomSelect from "@/components/admin/CustomSelect";
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
import { Quiz, Question, fetchQuestions } from "@/lib/quizData";
import { addUserNotification } from "@/utils/notifications";
import { fetchQuizzesFromDbAction, syncQuizToDbAction, deleteQuizFromDbAction, toggleQuizFreeStatus, restoreQuizInDbAction } from "@/actions/quiz.actions";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

type ViewMode = "grid" | "table";

type LiveSession = {
  id: string;
  user: string;
  quiz: string;
  startedAt: string;
  lastSeenAt: string | null;
  submittedAt: string | null;
  totalQuestions: number;
  answeredCount: number;
  status: "in_progress" | "abandoned" | "expired";
  isStuck: boolean;
};

export default function QuizzesPage() {
  const { currentAdmin, isReadOnly, canRestoreItem, canArchiveItem } = useAdminRole();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedExamType, setSelectedExamType] = useState<'ALL' | 'AKT' | 'KFP'>('ALL');
  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizLimit, setQuizLimit] = useState(50);
  const [quizTimeLimit, setQuizTimeLimit] = useState(60);
  const [quizPassingScore, setQuizPassingScore] = useState(65);
  const [quizRandomize, setQuizRandomize] = useState(true);
  const [quizExamType, setQuizExamType] = useState<'AKT' | 'KFP'>('AKT');
  const [visibleCount, setVisibleCount] = useState(9);

  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);

  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      const matchSearch = !searchQuery || q.name.toLowerCase().includes(searchQuery.toLowerCase()) || q.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" ? (q.status !== "archived") : (q.status === statusFilter);
      const rawExamType = (q.examType ?? "AKT").toUpperCase();
      const examType = rawExamType === "KFP" ? "KFP" : rawExamType;
      const matchExam = selectedExamType === 'ALL' || examType === selectedExamType;
      return matchSearch && matchStatus && matchExam;
    });
  }, [quizzes, searchQuery, statusFilter, selectedExamType]);

  const sortedQuizzes = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return b.id - a.id;
    });
  }, [filtered]);

  const displayedQuizzes = useMemo(() => {
    return sortedQuizzes.slice(0, visibleCount);
  }, [sortedQuizzes, visibleCount]);

  useEffect(() => {
    let isMounted = true;
    // Clear old localStorage mock quizzes
    try { localStorage.removeItem("gpedge_admin_quizzes"); } catch {}

    // Load quizzes from Neon DB
    fetchQuizzesFromDbAction(canRestoreItem).then((dbQuizzes) => {
      if (isMounted) setQuizzes(dbQuizzes as any);
    });

    // Load questions from DB for quiz previewing
    fetchQuestions().then((listQs) => {
      if (isMounted) setAllQuestions(listQs);
    });

    return () => {
      isMounted = false;
    };
  }, [currentAdmin, canRestoreItem]);

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

  useEffect(() => {
    let cancelled = false;

    const loadSessions = async () => {
      try {
        const res = await fetch("/api/admin/quiz-sessions", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json.success && Array.isArray(json.data)) {
          setSessions(json.data);
        }
      } catch (error) {
        console.error("Failed to load live quiz sessions:", error);
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    };

    loadSessions();
    const interval = window.setInterval(loadSessions, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const resetSession = (id: number) => {
    if (isReadOnly) return;
    setSessions((prev) => prev.filter((s) => s.id !== String(id)));
  };

  const requestDeleteQuiz = (quiz: Quiz) => {
    if (isReadOnly) return;
    setQuizToDelete(quiz);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete || !canArchiveItem) return;
    await deleteQuizFromDbAction(quizToDelete.name, currentAdmin);
    const refreshed = await fetchQuizzesFromDbAction(canRestoreItem);
    setQuizzes(refreshed as any);
    setQuizToDelete(null);
    addUserNotification("Quiz Archived", `"${quizToDelete.name}" has been archived.`, 1, "custom");
  };

  const handleRestoreQuiz = async (quiz: Quiz) => {
    if (!canRestoreItem) return;
    const res = await restoreQuizInDbAction(quiz.name, currentAdmin);
    if (!res.success) {
      alert(res.error || "Failed to restore quiz.");
      return;
    }
    const refreshed = await fetchQuizzesFromDbAction(canRestoreItem);
    setQuizzes(refreshed as any);
    addUserNotification("Quiz Restored", `Successfully restored "${quiz.name}".`, 1, "custom");
  };

  const handleToggleQuizFree = async (quiz: Quiz, newIsFree: boolean) => {
    if (isReadOnly) return;
    const targetId = (quiz as any).dbId || quiz.name;

    // Optimistic UI update
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === quiz.id || (q as any).dbId === (quiz as any).dbId
          ? { ...q, isFree: newIsFree }
          : q
      )
    );

    const res = await toggleQuizFreeStatus(targetId, newIsFree);
    if (!res.success) {
      // Revert state on failure
      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === quiz.id || (q as any).dbId === (quiz as any).dbId
            ? { ...q, isFree: !newIsFree }
            : q
        )
      );
      alert(res.error || "Failed to update quiz free status.");
    } else {
      addUserNotification(
        `Quiz Status Updated`,
        `"${quiz.name}" is now ${newIsFree ? "Free Access" : "Paid Only"}.`,
        1,
        "quiz"
      );
    }
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
                if (isReadOnly) return;
                setQuizName("");
                setQuizDescription("");
                setQuizLimit(50);
                setQuizTimeLimit(60);
                setQuizPassingScore(65);
                setQuizRandomize(true);
                setQuizExamType('AKT');
                setShowCreateModal(true);
              }}
              disabled={isReadOnly}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 ${themeBtnPrimary} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create Mock Exam
            </button>
          </div>
        }
        variants={itemVariants}
      />

      {isReadOnly && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 rounded-2xl flex gap-3 text-xs text-blue-850 dark:text-blue-300 leading-relaxed items-center shadow-sm"
        >
          <svg className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-450" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">View-Only Mode Enabled</p>
            <p className="mt-0.5 opacity-90">
              You are signed in under the <strong>Viewer</strong> role. You have full read-only access to all sections and data, but editing, adding, or deleting content is restricted.
            </p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700/60 dark:text-slate-100 transition-all"
          />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "Active Statuses" },
            { value: "active", label: "Active" },
            { value: "draft", label: "Draft" },
            { value: "suspended", label: "Suspended" },
            ...(canRestoreItem ? [{ value: "archived", label: "Archived (SA Only)" }] : []),
          ]}
          className="w-48"/>
        {/* Exam Type Tabs */}
        <div className="flex gap-2 items-center">
          {([ 'ALL', 'AKT', 'KFP' ] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedExamType(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium border ${selectedExamType === type ? 'bg-teal-100 text-teal-800 border-teal-600' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-300'} transition-all`}
            >
              {type}
            </button>
          ))}
        </div>
      </motion.div>

      {viewMode === "grid" && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayedQuizzes.map((quiz, idx) => {
            return (
              <motion.div
                key={quiz.id}
                onClick={() => router.push(`/admin/quizzes/${ (quiz as any).dbId || quiz.id }/edit`)}
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shrink-0 ${
                        (quiz.examType === 'KFP')
                          ? 'bg-purple-500/25 text-purple-200 border-purple-400/40'
                          : 'bg-teal-400/20 text-teal-100 border-teal-300/40'
                      }`}>
                        {(quiz.examType === 'KFP') ? 'KFP' : (quiz.examType || 'AKT')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleQuizFree(quiz, !quiz.isFree);
                        }}
                        disabled={isReadOnly}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                          quiz.isFree
                            ? "bg-emerald-400/20 text-emerald-200 border-emerald-400/40"
                            : "bg-white/10 text-slate-300 border-white/20"
                        } ${isReadOnly ? "opacity-50 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}`}
                        title={quiz.isFree ? "Free Access (Click to make Paid)" : "Paid Only (Click to make Free)"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${quiz.isFree ? "bg-emerald-400" : "bg-slate-400"}`} />
                        {quiz.isFree ? "Free" : "Paid"}
                      </button>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border shrink-0 bg-white/15 text-white border-white/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                        {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                      </span>
                    </div>
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
                        href={`/admin/quizzes/${ (quiz as any).dbId || quiz.id }/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`}
                        title="Edit Quiz"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
                      {quiz.status === "archived" && canRestoreItem ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRestoreQuiz(quiz); }}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer border-none bg-transparent"
                          title="Restore Quiz (SA Only)"
                        >
                          <Lucide.RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        canArchiveItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDeleteQuiz(quiz);
                            }}
                            disabled={isReadOnly}
                            className={`p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all ${isReadOnly ? "opacity-30 cursor-not-allowed" : ""}`}
                            title={isReadOnly ? "Viewers cannot archive quizzes" : "Archive Quiz"}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {displayedQuizzes.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-16 text-slate-400 dark:text-slate-500 space-y-2">
          <Layers className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-sm font-medium">No quizzes found.</p>
          {!isReadOnly && (
            <button
              onClick={() => {
                if (isReadOnly) return;
                setQuizName("");
                setQuizDescription("");
                setQuizLimit(50);
                setQuizTimeLimit(60);
                setQuizPassingScore(65);
                setQuizRandomize(true);
                setShowCreateModal(true);
              }}
              className="text-teal-600 text-xs font-semibold hover:underline cursor-pointer border-none bg-transparent"
            >
              Create your first mock exam →
            </button>
          )}
        </motion.div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {quizToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQuizToDelete(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="px-6 pt-6 pb-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete Mock Exam?</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to delete this mock exam?
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{quizToDelete.name}</span>
                </p>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                <button
                  onClick={() => setQuizToDelete(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteQuiz}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[13px] font-bold shadow-md shadow-red-600/20 transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Questions</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Time</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Pass %</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Attempts</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Avg Score</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Access Tier</th>
                  <th className="text-left text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-50 dark:divide-teal-900/20">
                {displayedQuizzes.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => router.push(`/admin/quizzes/${(q as any).dbId || q.id}/edit`)}
                    className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-teal-950 dark:text-teal-50/90">{q.name}</p>
                      <div className="flex items-center gap-1 mt-1">{q.topics.map((t) => <span key={t} className={themeBadgeSm}>{t}</span>)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                        (q.examType === 'KFP')
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/40'
                          : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800/40'
                      }`}>
                        {(q.examType === 'KFP') ? 'KFP' : (q.examType || 'AKT')}
                      </span>
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleQuizFree(q, !q.isFree);
                        }}
                        disabled={isReadOnly}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
                          q.isFree
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        } ${isReadOnly ? "opacity-50 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}`}
                        title={q.isFree ? "Free Access (Click to make Paid)" : "Paid Only (Click to make Free)"}
                      >
                        <span className={`w-2 h-2 rounded-full ${q.isFree ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {q.isFree ? "Free Access" : "Paid Only"}
                      </button>
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
        {sessionsLoading ? (
          <div className="text-center py-8">
            <p className={`text-sm ${themeMuted}`}>Loading live sessions...</p>
          </div>
        ) : sessions.length > 0 ? (
          <div className="divide-y divide-teal-50 dark:divide-teal-900/20">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="px-6 py-4 flex items-center justify-between relative z-10 hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-teal-950 dark:text-teal-50/90">{s.user}</p>
                  <p className={`text-xs ${themeMuted}`}>{s.quiz} · Started {new Date(s.startedAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · Progress: {s.answeredCount}/{s.totalQuestions}</p>
                </div>
                <button
                  onClick={() => resetSession(Number(s.id))}
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
                  {/* Exam Type Selector */}
                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${themeLabel}`}>Exam Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setQuizExamType('AKT')}
                        className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                          quizExamType === 'AKT'
                            ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30'
                            : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 hover:border-teal-400/60'
                        }`}
                      >
                        {quizExamType === 'AKT' && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-teal-600 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                        <span className="text-xs font-bold text-teal-800 dark:text-teal-300 mb-0.5">AKT</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">Applied Knowledge Test · Single best answer MCQ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizExamType('KFP')}
                        className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                          quizExamType === 'KFP'
                            ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/30'
                            : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 hover:border-purple-400/60'
                        }`}
                      >
                        {quizExamType === 'KFP' && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                        <span className="text-xs font-bold text-purple-800 dark:text-purple-300 mb-0.5">KFP</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">Key Feature Problem · Multi-select format</span>
                      </button>
                    </div>
                  </div>
                  <div><label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Quiz Name</label><input type="text" value={quizName} onChange={(e) => setQuizName(e.target.value)} className={`w-full px-4 py-2.5 text-sm dark:text-slate-100 rounded-xl transition-all ${themeInput}`} placeholder={`e.g. ${quizExamType} Mock Exam 2026`} /></div>
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
                      onClick={async () => {
                        const finalName = quizName.trim() || `${quizExamType} Mock Exam 2026`;
                        const result = await syncQuizToDbAction({
                          name: finalName,
                          description: quizDescription.trim(),
                          timeLimit: quizTimeLimit || 60,
                          passingScore: quizPassingScore || 65,
                          randomize: quizRandomize,
                          status: "active",
                          examType: quizExamType,
                          questionLimit: quizLimit || 50,
                        }, [], currentAdmin?.id);

                        if (result.success && result.dbId) {
                          // Refresh list from DB after create
                          const dbQuizzes = await fetchQuizzesFromDbAction();
                          setQuizzes(dbQuizzes as any);
                          setShowCreateModal(false);
                          addUserNotification(
                            `New Quiz Created: ${finalName}`,
                            `A new mock exam "${finalName}" has been created and published.`,
                            quizLimit || 50,
                            "quiz"
                          );
                          setQuizName("");
                          setQuizDescription("");
                          setQuizLimit(50);
                          setQuizTimeLimit(60);
                          setQuizPassingScore(65);
                          router.push(`/admin/quizzes/${result.dbId}/edit`);
                        }
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold">Quiz Preview</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      (previewQuiz.examType === 'KFP')
                        ? 'bg-purple-500/30 text-purple-200 border-purple-400/40'
                        : 'bg-teal-500/30 text-teal-200 border-teal-400/40'
                    }`}>
                      {(previewQuiz.examType === 'KFP') ? 'KFP' : (previewQuiz.examType || 'AKT')}
                    </span>
                  </div>
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
                    const previewQuestions = previewQuiz.questionIds
                      .map((id) => allQuestions.find((q) => q.id === id))
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
                        key={`${q.id}-${idx}`}
                        className={`p-5 rounded-2xl border ${themeBorder} ${themePanel} space-y-4 shadow-sm text-slate-900 dark:text-slate-100`}
                      >
                        {/* Question Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
                              Question {idx + 1} of {previewQuestions.length}
                            </span>
                            {q.topic && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/50 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800/40">
                                {q.topic}
                              </span>
                            )}
                            {q.difficulty && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                String(q.difficulty).toLowerCase() === 'easy'
                                  ? 'bg-green-50 text-green-700 border-green-200/60 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/40'
                                  : String(q.difficulty).toLowerCase() === 'hard' || String(q.difficulty) === '3' || String(q.difficulty) === '4' || String(q.difficulty) === '3/4'
                                  ? 'bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40'
                                  : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  String(q.difficulty).toLowerCase() === 'easy' ? 'bg-green-500' : (String(q.difficulty).toLowerCase() === 'hard' || String(q.difficulty) === '3' || String(q.difficulty) === '4' || String(q.difficulty) === '3/4') ? 'bg-red-500' : 'bg-amber-500'
                                }`} />
                                {(() => {
                                  const diffVal = q.difficulty as any;
                                  return diffVal === 3 || diffVal === 4 || diffVal === '3' || diffVal === '4' || diffVal === '3/4' ? 'Level 3/4' : `${q.difficulty}`;
                                })()}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200/60 dark:border-teal-800/40 bg-teal-50/50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300">
                            {q.uqid || `${(q.examType || (previewQuiz?.examType === 'KFP' ? 'KFP' : 'AKT')).toUpperCase()}-${String(q.id).padStart(6, '0')}`}
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
                          <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-line">
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

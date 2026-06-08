"use client";

import { useState, useEffect } from "react";
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
import { Quiz, createQuiz, getQuizzes } from "@/lib/quizData";
import { addUserNotification } from "@/utils/notifications";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const stuckSessions = [
  { id: 1, user: "Dr. Sarah Chen", quiz: "AKT Full Mock Exam 2026", startedAt: "28 May, 10:32 AM", progress: "87/150", status: "stuck" },
  { id: 2, user: "Dr. Tom Baker", quiz: "KFP Practice — Cardiovascular", startedAt: "27 May, 3:15 PM", progress: "12/26", status: "stuck" },
  { id: 3, user: "Dr. David Kim", quiz: "Mental Health Focused Quiz", startedAt: "26 May, 9:00 AM", progress: "5/30", status: "abandoned" },
];

type ViewMode = "grid" | "table";

/* ---------- Score Gauge Ring ---------- */
function ScoreGauge({ value, passingScore, size = 64 }: { value: number; passingScore: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const passing = value >= passingScore;
  const color = value === 0 ? "#5eead4" : "#0f766e";
  const trailColor = "#ccfbf1";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trailColor} strokeWidth="4" />
        {value > 0 && (
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - value / 100) }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{value > 0 ? `${value}%` : "—"}</span>
        <span className={`text-[7px] uppercase tracking-widest font-semibold ${themeMuted}`}>Avg</span>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    setQuizzes(getQuizzes());
  }, []);

  // Lock body scroll when modal is open to prevent background scrolling lag
  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showCreateModal]);

  const resetSession = (id: number) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const totalAttempts = quizzes.reduce((sum, q) => sum + q.attempts, 0);
  const activeQuizzes = quizzes.filter((q) => q.status === "active").length;
  const scoredQuizzes = quizzes.filter((q) => q.avgScore > 0);
  const platformAvgScore =
    scoredQuizzes.length > 0
      ? Math.round(scoredQuizzes.reduce((sum, q) => sum + q.avgScore, 0) / scoredQuizzes.length)
      : 0;
  const activeRate = quizzes.length > 0 ? Math.round((activeQuizzes / quizzes.length) * 100) : 0;

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
            <button onClick={() => setShowCreateModal(true)} className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 ${themeBtnPrimary}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create Mock Exam
            </button>
          </div>
        }
        variants={itemVariants}
      />

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Quizzes"
          percentage={`${activeQuizzes} active`}
          data={String(quizzes.length)}
          progress={activeRate}
        />
        <AnalyticsCard
          title="Total Attempts"
          percentage="+12%"
          data={totalAttempts.toLocaleString()}
          progress={Math.min(100, Math.round(totalAttempts / 50))}
        />
        <AnalyticsCard
          title="Avg Completion Rate"
          percentage="+5%"
          data="84%"
          progress={84}
        />
        <AnalyticsCard
          title="Avg Score"
          percentage={platformAvgScore >= 65 ? "+3%" : "—"}
          data={platformAvgScore > 0 ? `${platformAvgScore}%` : "—"}
          progress={platformAvgScore}
        />
      </motion.div>

      {/* ========== CARD GRID VIEW ========== */}
      {viewMode === "grid" && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {quizzes.map((quiz, idx) => {
            return (
              <motion.div
                key={quiz.id}
                onClick={() => router.push(`/admin/quizzes/${quiz.id}/edit`)}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative ${themePanel} overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-300/60 hover:-translate-y-1 transition-all duration-300`}
              >
                {/* Header — use static Tailwind classes so gradient is included in build */}
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
                      <span key={t} className={themeBadgePill}>
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Score Gauge + Metrics */}
                  <div className="flex items-center gap-4 mb-4">
                    <ScoreGauge value={quiz.avgScore} passingScore={quiz.passingScore} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-medium ${themeMuted}`}>Pass Threshold</span>
                        <span className="text-sm font-bold text-teal-800 dark:text-teal-300">{quiz.passingScore}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-medium ${themeMuted}`}>Total Attempts</span>
                        <span className="text-sm font-bold text-teal-800 dark:text-teal-300">{quiz.attempts.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-medium ${themeMuted}`}>Avg Score</span>
                        <span className={`text-sm font-bold ${quiz.avgScore > 0 ? "text-teal-700 dark:text-teal-400" : "text-teal-400/60"}`}>
                          {quiz.avgScore > 0 ? `${quiz.avgScore}%` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pass/Fail bar */}
                  {quiz.avgScore > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] uppercase tracking-wider font-semibold ${themeMuted}`}>Score vs Pass</span>
                      </div>
                      <div className="relative w-full h-2 bg-teal-100/60 dark:bg-teal-950/30 rounded-full overflow-hidden">
                        <motion.div
                          className={`absolute left-0 top-0 h-full rounded-full ${themeProgressFill}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${quiz.avgScore}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                        />
                        {/* Pass threshold marker */}
                        <div
                          className="absolute top-0 w-0.5 h-full bg-teal-700/40"
                          style={{ left: `${quiz.passingScore}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-teal-100/60 dark:border-teal-900/30">
                    <div className={`flex items-center gap-1 text-[10px] font-medium ${themeMuted}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {quiz.timeLimit} min limit
                    </div>
                    <div className="flex items-center gap-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <Link
                        href={`/admin/quizzes/${quiz.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`}
                        title="Edit Quiz"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
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
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/15 via-transparent to-teal-50/5 pointer-events-none" />
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
                {quizzes.map((q) => (
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

      {/* Stuck sessions */}
      <motion.div variants={itemVariants} className={`${themePanel} overflow-hidden relative`}>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/15 via-transparent to-teal-50/5 pointer-events-none" />
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
    </motion.div>
  );
}

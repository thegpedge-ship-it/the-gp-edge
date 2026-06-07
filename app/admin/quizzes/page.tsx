"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { addUserNotification } from "@/utils/notifications";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

interface Quiz {
  id: number;
  name: string;
  topics: string[];
  questionCount: number;
  timeLimit: number;
  passingScore: number;
  attempts: number;
  avgScore: number;
  status: "active" | "draft" | "suspended";
}

const mockQuizzes: Quiz[] = [
  { id: 1, name: "AKT Full Mock Exam 2026", topics: ["Cardiology", "Respiratory", "Mental Health", "Dermatology"], questionCount: 150, timeLimit: 210, passingScore: 65, attempts: 2340, avgScore: 72, status: "active" },
  { id: 2, name: "KFP Practice — Cardiovascular", topics: ["Cardiology"], questionCount: 26, timeLimit: 60, passingScore: 70, attempts: 876, avgScore: 68, status: "active" },
  { id: 3, name: "Mental Health Focused Quiz", topics: ["Mental Health"], questionCount: 30, timeLimit: 45, passingScore: 60, attempts: 543, avgScore: 61, status: "active" },
  { id: 4, name: "Paediatrics Rapid Fire", topics: ["Paediatrics"], questionCount: 20, timeLimit: 30, passingScore: 65, attempts: 321, avgScore: 74, status: "active" },
  { id: 5, name: "MBS Billing Mastery", topics: ["MBS Billing"], questionCount: 40, timeLimit: 60, passingScore: 75, attempts: 198, avgScore: 69, status: "active" },
  { id: 6, name: "Dermatology Deep Dive", topics: ["Dermatology"], questionCount: 25, timeLimit: 40, passingScore: 65, attempts: 0, avgScore: 0, status: "draft" },
];

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
  const color = value === 0 ? "#94a3b8" : passing ? "#10b981" : "#64748b";
  const trailColor = value === 0 ? "#f1f5f9" : passing ? "#d1fae5" : "#f1f5f9";

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
        <span className="text-[7px] uppercase tracking-widest text-slate-400 font-semibold">Avg</span>
      </div>
    </div>
  );
}

/* ---------- Topic pill accent colors ---------- */
const topicColors: Record<string, string> = {
  Cardiology: "bg-emerald-50 text-emerald-600 border-emerald-100",
  Respiratory: "bg-teal-50 text-teal-600 border-teal-100",
  "Mental Health": "bg-green-50 text-green-600 border-green-100",
  Dermatology: "bg-slate-100 text-slate-700 border-slate-200",
  Paediatrics: "bg-teal-50/50 text-teal-700 border-teal-100/50",
  "MBS Billing": "bg-emerald-50/50 text-emerald-700 border-emerald-100/50",
};

const cardGradients = [
  "from-teal-500 to-emerald-600",
  "from-emerald-600 to-green-600",
  "from-green-500 to-teal-500",
  "from-slate-500 to-slate-600",
  "from-teal-600 to-slate-600",
  "from-emerald-500 to-teal-600",
];

export default function QuizzesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessions, setSessions] = useState(stuckSessions);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [quizName, setQuizName] = useState("");
  const [quizLimit, setQuizLimit] = useState(50);

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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Quiz"
        highlightedText="Management"
        subtitle="Configure and manage mock exams"
        actions={
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950/20 rounded-xl p-1 gap-0.5 border border-slate-200 dark:border-slate-800/40">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-400"}`}
                title="Card View"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-400"}`}
                title="Table View"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </button>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-teal-600 text-sm font-semibold text-white rounded-xl hover:bg-teal-700 transition-all shadow-sm flex items-center gap-2 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create Mock Exam
            </button>
          </div>
        }
        variants={itemVariants}
      />

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Quizzes", value: mockQuizzes.length, color: "text-teal-600", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { label: "Total Attempts", value: "4,278", color: "text-emerald-600", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          { label: "Avg Completion Rate", value: "84%", color: "text-green-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Avg Score", value: "69%", color: "text-slate-600", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
        ].map((s) => (
          <div key={s.label} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-5 shadow-md shadow-slate-200/30 relative overflow-hidden group hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/5 pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <div className={`p-2 rounded-xl bg-slate-50 ${s.color} opacity-40`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ========== CARD GRID VIEW ========== */}
      {viewMode === "grid" && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mockQuizzes.map((quiz, idx) => {
            const gradient = cardGradients[idx % cardGradients.length];
            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-100/80 shadow-md shadow-slate-200/40 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-200/60 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Gradient accent header */}
                <div className={`relative bg-gradient-to-r ${gradient} px-5 py-4`}>
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white leading-snug">{quiz.name}</p>
                      <p className="text-[11px] text-white/70 mt-1">{quiz.questionCount} questions · {quiz.timeLimit} min</p>
                    </div>
                    <StatusBadge variant={quiz.status} />
                  </div>
                </div>

                <div className="p-5">
                  {/* Topics */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {quiz.topics.map((t) => (
                      <span key={t} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${topicColors[t] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Score Gauge + Metrics */}
                  <div className="flex items-center gap-4 mb-4">
                    <ScoreGauge value={quiz.avgScore} passingScore={quiz.passingScore} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Pass Threshold</span>
                        <span className="text-sm font-bold text-slate-700">{quiz.passingScore}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Total Attempts</span>
                        <span className="text-sm font-bold text-slate-700">{quiz.attempts.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Avg Score</span>
                        <span className={`text-sm font-bold ${quiz.avgScore >= quiz.passingScore ? "text-emerald-600" : quiz.avgScore > 0 ? "text-slate-600" : "text-slate-400"}`}>
                          {quiz.avgScore > 0 ? `${quiz.avgScore}%` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pass/Fail bar */}
                  {quiz.avgScore > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Score vs Pass</span>
                      </div>
                      <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`absolute left-0 top-0 h-full rounded-full ${quiz.avgScore >= quiz.passingScore ? "bg-emerald-400" : "bg-slate-400"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${quiz.avgScore}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                        />
                        {/* Pass threshold marker */}
                        <div
                          className="absolute top-0 w-0.5 h-full bg-slate-400/60"
                          style={{ left: `${quiz.passingScore}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100/60">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {quiz.timeLimit} min limit
                    </div>
                    <div className="flex items-center gap-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all" title="Edit Quiz">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="View Analytics">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
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
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 shadow-md shadow-slate-200/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="px-6 py-4 border-b border-slate-200/40">
              <h3 className="text-sm font-bold text-slate-900">All Quizzes</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/40">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Quiz</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Questions</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Time</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Pass %</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Attempts</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Avg Score</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockQuizzes.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{q.name}</p>
                      <div className="flex items-center gap-1 mt-1">{q.topics.map((t) => <span key={t} className="text-[10px] font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">{t}</span>)}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{q.questionCount}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{q.timeLimit} min</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">{q.passingScore}%</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{q.attempts.toLocaleString()}</td>
                    <td className="px-4 py-4">
                        {q.avgScore > 0 ? (
                        <span className={`text-sm font-semibold ${q.avgScore >= q.passingScore ? "text-emerald-600" : "text-slate-600"}`}>{q.avgScore}%</span>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-4"><StatusBadge variant={q.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Stuck sessions */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900">Stuck / Abandoned Sessions</h3>
            </div>
            <span className="text-xs text-slate-400">{sessions.length} sessions</span>
          </div>
        </div>
        {sessions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="px-6 py-4 flex items-center justify-between relative z-10 hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.user}</p>
                  <p className="text-xs text-slate-500">{s.quiz} · Started {s.startedAt} · Progress: {s.progress}</p>
                </div>
                <button
                  onClick={() => resetSession(s.id)}
                  className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300"
                >
                  Reset Session
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8"><p className="text-sm text-slate-400">No stuck sessions</p></div>
        )}
      </motion.div>

      {/* Create Quiz Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50" onClick={() => setShowCreateModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 15 }} transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }} className="fixed inset-x-4 top-[10%] mx-auto max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl z-50 shadow-2xl overflow-y-auto max-h-[80vh]">
              <div className="p-6 text-slate-800 dark:text-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-normal text-slate-900 dark:text-slate-100 tracking-tight leading-none">Create Mock Exam</h2>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Quiz Name</label><input type="text" value={quizName} onChange={(e) => setQuizName(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" placeholder="e.g. AKT Mock Exam 2026" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Description</label><textarea rows={2} className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-none" placeholder="Brief description..." /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Question Limit</label><input type="number" value={quizLimit} onChange={(e) => setQuizLimit(Number(e.target.value))} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Timer (mins)</label><input type="number" defaultValue={60} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Passing Score (%)</label><input type="number" defaultValue={65} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30" /></div>
                    <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-teal-500 focus:ring-teal-500/30 dark:bg-slate-800" /><span className="text-sm text-slate-600 dark:text-slate-300">Randomize</span></label></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 transition-all">Cancel</button>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        const finalName = quizName.trim() || "AKT Mock Exam 2026";
                        const finalLimit = quizLimit || 50;
                        addUserNotification(
                          `New Quiz Available: ${finalName}`,
                          `A new mock exam set containing ${finalLimit} practice questions has been configured and is ready for study.`,
                          finalLimit,
                          "quiz"
                        );
                        alert(`Quiz "${finalName}" successfully created and user notification sent!`);
                        setQuizName("");
                        setQuizLimit(50);
                      }}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-all shadow-sm"
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

"use client";

import { motion } from "framer-motion";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const topicPerformance = [
  { topic: "Cardiology", accuracy: 92, attempts: 1204, questions: 420, avgTime: "1.8 min", trend: "+3%" },
  { topic: "Respiratory", accuracy: 88, attempts: 987, questions: 380, avgTime: "1.6 min", trend: "+5%" },
  { topic: "Musculoskeletal", accuracy: 85, attempts: 756, questions: 290, avgTime: "2.1 min", trend: "+1%" },
  { topic: "Gastroenterology", accuracy: 83, attempts: 654, questions: 250, avgTime: "1.9 min", trend: "+2%" },
  { topic: "Endocrine", accuracy: 76, attempts: 543, questions: 210, avgTime: "2.3 min", trend: "-1%" },
  { topic: "Infectious Disease", accuracy: 74, attempts: 478, questions: 190, avgTime: "1.7 min", trend: "+4%" },
  { topic: "Women's Health", accuracy: 67, attempts: 198, questions: 150, avgTime: "2.5 min", trend: "+2%" },
  { topic: "Paediatrics", accuracy: 64, attempts: 256, questions: 170, avgTime: "2.4 min", trend: "-2%" },
  { topic: "Dermatology", accuracy: 62, attempts: 289, questions: 160, avgTime: "2.0 min", trend: "+6%" },
  { topic: "Mental Health", accuracy: 58, attempts: 342, questions: 200, avgTime: "2.7 min", trend: "-3%" },
];

const difficultyBreakdown = [
  { level: "Easy", accuracy: 89, attempts: 3420, color: "bg-emerald-400" },
  { level: "Medium", accuracy: 72, attempts: 4150, color: "bg-amber-400" },
  { level: "Hard", accuracy: 54, attempts: 1980, color: "bg-red-400" },
];

const readinessDistribution = [
  { range: "0-20%", count: 120, color: "bg-red-400" },
  { range: "21-40%", count: 340, color: "bg-red-300" },
  { range: "41-60%", count: 1280, color: "bg-amber-400" },
  { range: "61-80%", count: 3450, color: "bg-teal-400" },
  { range: "81-100%", count: 2100, color: "bg-emerald-400" },
];

export default function AnalyticsPage() {
  const maxReadiness = Math.max(...readinessDistribution.map((d) => d.count));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-8 shadow-xl shadow-teal-900/10 flex items-center justify-between gap-6 flex-wrap"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/[0.04] rounded-full pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-36 h-36 bg-white/[0.03] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-serif text-2xl lg:text-3xl font-normal text-white tracking-tight leading-tight mb-1">Educational Analytics</h1>
          <p className="text-sm text-teal-100 font-light">Track academic performance across topics and difficulty levels</p>
        </div>
        <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
          <span className="text-xs font-semibold text-teal-200">10 topics tracked</span>
        </div>
      </motion.div>

      {/* Topic performance grid */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40">
            <h3 className="text-sm font-bold text-slate-900">Topic Accuracy Ranking</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/40">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">#</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Topic</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Accuracy</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Attempts</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Questions</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Avg Time</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topicPerformance.map((t, i) => (
                <tr key={t.topic} className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer">
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">{i + 1}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">{t.topic}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${t.accuracy}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} className={`h-full rounded-full ${t.accuracy >= 80 ? "bg-emerald-400" : t.accuracy >= 65 ? "bg-amber-400" : "bg-red-400"}`} />
                      </div>
                      <span className={`text-sm font-bold ${t.accuracy >= 80 ? "text-emerald-600" : t.accuracy >= 65 ? "text-amber-600" : "text-red-600"}`}>{t.accuracy}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{t.attempts.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{t.questions}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{t.avgTime}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold ${t.trend.startsWith("+") ? "text-emerald-600" : t.trend.startsWith("-") ? "text-red-600" : "text-slate-400"}`}>{t.trend}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty analytics */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 mb-5">Performance by Difficulty</h3>
            <div className="space-y-5">
              {difficultyBreakdown.map((d) => (
                <div key={d.level}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{d.level}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{d.attempts.toLocaleString()} attempts</span>
                      <span className="text-sm font-bold text-slate-800">{d.accuracy}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${d.accuracy}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${d.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Readiness distribution */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 mb-5">Readiness Score Distribution</h3>
            <div className="flex items-end justify-between gap-3 h-44">
              {readinessDistribution.map((d, i) => (
                <div key={d.range} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">{d.count.toLocaleString()}</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(d.count / maxReadiness) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.1 }} className={`w-full rounded-lg ${d.color}`} />
                  <span className="text-[10px] font-medium text-slate-400">{d.range}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Topic coverage heatmap */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-sm font-bold text-slate-900 mb-5">Topic Coverage Heatmap</h3>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {topicPerformance.map((t) => (
            <div key={t.topic} className="text-center" title={`${t.topic}: ${t.questions} questions`}>
              <div className={`aspect-square rounded-xl flex items-center justify-center text-white text-xs font-bold ${t.accuracy >= 80 ? "bg-emerald-400" : t.accuracy >= 65 ? "bg-amber-400" : "bg-red-400"}`}>
                {t.questions}
              </div>
              <p className="text-[9px] text-slate-400 mt-1 truncate">{t.topic}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-[10px] text-slate-400">≥80%</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-400" /><span className="text-[10px] text-slate-400">65-79%</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" /><span className="text-[10px] text-slate-400">&lt;65%</span></div>
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
}

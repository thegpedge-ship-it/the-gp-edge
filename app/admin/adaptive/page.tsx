"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import LiveStudentSimulator from "@/components/admin/LiveStudentSimulator";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const topicPriorities = [
  { topic: "Mental Health", weight: 85, auto: true },
  { topic: "Dermatology", weight: 72, auto: true },
  { topic: "Paediatrics", weight: 68, auto: false },
  { topic: "Women's Health", weight: 60, auto: true },
  { topic: "Endocrine", weight: 55, auto: true },
  { topic: "Infectious Disease", weight: 45, auto: false },
  { topic: "Gastroenterology", weight: 30, auto: true },
  { topic: "Musculoskeletal", weight: 25, auto: true },
  { topic: "Respiratory", weight: 15, auto: true },
  { topic: "Cardiology", weight: 10, auto: true },
];

export default function AdaptivePage() {
  const [weakTopicWeight, setWeakTopicWeight] = useState(75);
  const [difficultyScaling, setDifficultyScaling] = useState(60);
  const [recencyBias, setRecencyBias] = useState(40);
  const [spacedRepetition, setSpacedRepetition] = useState(true);
  const [difficultyProgression, setDifficultyProgression] = useState(true);
  const [topicRotation, setTopicRotation] = useState(false);
  const [priorities, setPriorities] = useState(topicPriorities);

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
          <h1 className="font-serif text-2xl lg:text-3xl font-normal text-white tracking-tight leading-tight mb-1">Adaptive Learning Controls</h1>
          <p className="text-sm text-teal-100 font-light">Configure how the adaptive engine prioritizes content for students</p>
        </div>
        <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
          <svg className="w-3.5 h-3.5 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span className="text-xs font-semibold text-teal-200">Engine Active</span>
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendation Weighting */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 mb-5">Recommendation Weighting</h3>
            <div className="space-y-6">
              {[
                { label: "Weak Topic Priority", desc: "How aggressively to target weak areas", value: weakTopicWeight, set: setWeakTopicWeight, color: "teal" },
                { label: "Difficulty Scaling", desc: "How quickly difficulty ramps up", value: difficultyScaling, set: setDifficultyScaling, color: "slate" },
                { label: "Recency Bias", desc: "Weight given to recently studied topics", value: recencyBias, set: setRecencyBias, color: "emerald" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{s.label}</p>
                      <p className="text-xs text-slate-400">{s.desc}</p>
                    </div>
                    <span className={`text-sm font-bold ${s.color === "teal" ? "text-teal-600" : s.color === "slate" ? "text-slate-600" : "text-emerald-600"}`}>{s.value}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={s.value} onChange={(e) => s.set(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-teal-500" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Adaptive Sequencing Controls */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 mb-5">Adaptive Sequencing</h3>
            <div className="space-y-4">
              {[
                { label: "Spaced Repetition", desc: "Automatically space out review of previously answered questions", value: spacedRepetition, set: setSpacedRepetition },
                { label: "Difficulty Progression", desc: "Gradually increase difficulty as student improves in a topic", value: difficultyProgression, set: setDifficultyProgression },
                { label: "Topic Rotation", desc: "Force rotation between topics to prevent over-focusing", value: topicRotation, set: setTopicRotation },
              ].map((toggle) => (
                <div key={toggle.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{toggle.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{toggle.desc}</p>
                  </div>
                  <button onClick={() => toggle.set(!toggle.value)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${toggle.value ? "bg-teal-500" : "bg-slate-300"}`}>
                    <motion.div animate={{ x: toggle.value ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              ))}
            </div>

            {/* Readiness recalibration */}
            <div className="mt-6 pt-5 border-t border-slate-200/60">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Readiness Score</h4>
              <div className="bg-slate-50 rounded-xl p-4 mb-3">
                <p className="text-xs text-slate-500 font-mono">Score = (TopicAccuracy × 0.4) + (QuizPerformance × 0.35) + (Consistency × 0.25)</p>
              </div>
              <button className="w-full py-2.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-all">Recalibrate All Scores</button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Topic Priority Table */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Topic Priority Settings</h3>
            <span className="text-xs text-slate-400">Higher weight = more questions served</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200/40">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Topic</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Weight</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Auto-adjusted</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Override</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {priorities.map((p, i) => (
                <tr key={p.topic} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-slate-700">{p.topic}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.weight >= 60 ? "bg-teal-400" : p.weight >= 30 ? "bg-amber-400" : "bg-slate-300"}`} style={{ width: `${p.weight}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-8">{p.weight}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium ${p.auto ? "text-teal-600" : "text-slate-400"}`}>{p.auto ? "Auto" : "Manual"}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <input type="range" min={0} max={100} value={p.weight} onChange={(e) => { const newPriorities = [...priorities]; newPriorities[i] = { ...p, weight: Number(e.target.value), auto: false }; setPriorities(newPriorities); }} className="w-20 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-teal-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </motion.div>

      {/* Preview panel */}
      <motion.div variants={itemVariants}>
        <LiveStudentSimulator
          weakTopicWeight={weakTopicWeight}
          difficultyScaling={difficultyScaling}
          spacedRepetition={spacedRepetition}
          topicPriorities={priorities}
        />
      </motion.div>
    </motion.div>
  );
}

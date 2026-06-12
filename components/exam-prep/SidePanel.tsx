"use client";

import { mockDrill, mockTests } from "./data";

/* ─── Summary Stat ────────────────────────────────────────────────────── */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{value}</span>
      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">{label}</span>
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function SidePanel() {
  const completedMocks = mockTests.filter((t) => t.status === "completed");
  const avgScore = completedMocks.length
    ? Math.round(completedMocks.reduce((s, t) => s + (t.bestScore ?? 0), 0) / completedMocks.length)
    : 0;

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ─── 1. Upcoming Mock Exam — Hero Card ─────────────────── */}
      <div className="relative glass dark:glass-strong rounded-2xl p-4 border border-emerald-400 dark:border-emerald-600 shadow-lg overflow-hidden group flex-shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-green-400/10 dark:bg-green-500/5 group-hover:scale-110 transition-transform duration-700" />

        <div className="relative">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-0.5">Mock Tests</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">Full AKT simulations under exam conditions</p>

          {/* Summary stats */}
          <div className="flex items-stretch gap-2 mb-4 px-2 py-3 rounded-xl bg-white/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/40">
            <Stat value={String(mockTests.length)} label="Tests" />
            <div className="w-px bg-slate-200 dark:bg-slate-700/60" />
            <Stat value={String(completedMocks.length)} label="Done" />
            <div className="w-px bg-slate-200 dark:bg-slate-700/60" />
            <Stat value={`${avgScore}%`} label="Avg" />
          </div>

          <button
            onClick={() => {}}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-transform duration-300"
          >
            View Mock Tests &rarr;
          </button>
        </div>
      </div>

      {/* ─── 2. Create Your Own Quiz ───────────────────────────── */}
      <div
        onClick={() => {}}
        className="glass dark:glass-strong rounded-2xl border border-slate-200/50 dark:border-slate-700/40 shadow-md overflow-hidden flex-shrink-0 px-4 py-3 cursor-pointer"
      >
        <div>
          <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Create Your Own Quiz</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Pick your topics, set your rules.</p>
        </div>
      </div>

      {/* ─── 3. Mock Drill ─────────────────────────────────────── */}
      <div className="glass dark:glass-strong rounded-3xl p-5 border border-slate-200/50 dark:border-slate-700/40 shadow-md group hover:shadow-lg hover:border-emerald-400/40 dark:hover:border-emerald-500/30 transition-all duration-300 flex flex-col">
        <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 mb-2">{mockDrill.title}</h3>

        <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          {mockDrill.description}
        </p>

        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
          <span>{mockDrill.duration}</span>
          <span>&middot;</span>
          <span>{mockDrill.questionCount} Qs</span>
          <span>&middot;</span>
          <span>{mockDrill.difficulty}</span>
        </div>

        <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-transform duration-300">
          Start Mock Drill &rarr;
        </button>
      </div>
    </div>
  );
}

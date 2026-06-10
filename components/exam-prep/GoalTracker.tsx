"use client";

import { useState } from "react";
import { goals } from "./data";

type GoalPeriod = "daily" | "weekly" | "monthly";

const CARD_BASE = "glass dark:glass-strong rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-md hover:shadow-xl hover:border-teal-400/60 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col group relative overflow-hidden";

function ProgressBar({ done, target }: { done: number; target: number }) {
  const pct = Math.min(100, Math.round((done / target) * 100));
  return (
    <div className="h-1.5 bg-slate-200/60 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function GoalTracker() {
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>("daily");

  const currentGoal = goals[goalPeriod];
  const overallPct = Math.round(
    ((currentGoal.questions.done / currentGoal.questions.target) +
      (currentGoal.time.done / currentGoal.time.target) +
      (currentGoal.mocks.done / currentGoal.mocks.target)) / 3 * 100
  );

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Today's Goal */}
      <div className={CARD_BASE}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="font-bold text-teal-800 dark:text-teal-200 text-[16px]">Today&apos;s Goal</h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Stay consistent and achieve your daily target.</p>
          </div>
          <button className="text-[12px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-full border border-teal-100/50 dark:border-teal-800/50">Edit Goal</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-[11px] font-bold text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest mb-1.5">Questions</p>
            <div className="text-2xl font-extrabold text-teal-900 dark:text-teal-100 leading-none">
              {currentGoal.questions.done} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">/ {currentGoal.questions.target}</span>
            </div>
            <ProgressBar done={currentGoal.questions.done} target={currentGoal.questions.target} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest mb-1.5">Time</p>
            <div className="text-2xl font-extrabold text-teal-900 dark:text-teal-100 leading-none">
              {currentGoal.time.done} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">/ {currentGoal.time.target}m</span>
            </div>
            <ProgressBar done={currentGoal.time.done} target={currentGoal.time.target} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest mb-1.5">Mock Test</p>
            <div className="text-2xl font-extrabold text-teal-900 dark:text-teal-100 leading-none">
              {currentGoal.mocks.done} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">/ {currentGoal.mocks.target}</span>
            </div>
            <ProgressBar done={currentGoal.mocks.done} target={currentGoal.mocks.target} />
          </div>
        </div>

        <div className="flex items-center justify-center mt-6">
          <div className="relative w-36 h-36">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="24" fill="none" className="stroke-teal-500 transition-all duration-700 drop-shadow-sm" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - overallPct / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-teal-900 dark:text-teal-100 leading-none">{overallPct}%</span>
              <span className="text-[11px] font-semibold text-teal-600/70 dark:text-teal-500/70 uppercase tracking-wide mt-1">Done</span>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Period */}
      <div className={CARD_BASE}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-bold text-teal-800 dark:text-teal-200 text-[16px]">Goal Period</h2>
          <button className="text-[12px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-full border border-teal-100/50 dark:border-teal-800/50">Edit</button>
        </div>

        <div className="flex bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-1.5 gap-1.5 mb-5 shadow-inner">
          {(["daily", "weekly", "monthly"] as GoalPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setGoalPeriod(p)}
              className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all capitalize ${goalPeriod === p ? "bg-teal-500 text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-white/50 dark:hover:bg-slate-700/50"}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          {goalPeriod === "daily" && "Your daily goals reset every day at midnight."}
          {goalPeriod === "weekly" && "Your weekly goals reset every Monday at midnight."}
          {goalPeriod === "monthly" && "Your monthly goals reset on the 1st of each month."}
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Questions", value: currentGoal.questions.target, done: currentGoal.questions.done, suffix: "" },
            { label: "Time", value: Math.round(currentGoal.time.target / 60), done: Math.round(currentGoal.time.done / 60), suffix: " hrs" },
            { label: "Mocks", value: currentGoal.mocks.target, done: currentGoal.mocks.done, suffix: "" },
          ].map(({ label, value, done, suffix }) => (
            <div key={label} className="bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-3.5 shadow-sm">
              <p className="text-[10px] text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest font-bold mb-2">{label}</p>
              <p className="text-xl font-extrabold text-teal-900 dark:text-teal-100 leading-none">{value}{suffix}</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{done}/{value}{suffix}</p>
              <ProgressBar done={done} target={value} />
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 px-4 py-3 bg-teal-50/80 dark:bg-teal-900/20 rounded-xl border border-teal-100/50 dark:border-teal-800/30">
          <p className="text-[13px] font-bold text-teal-800 dark:text-teal-300">Keep going! You&apos;re doing great </p>
        </div>
      </div>
    </div>
  );
}

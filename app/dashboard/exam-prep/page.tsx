"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type GoalPeriod = "daily" | "weekly" | "monthly";

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ExamPrepDashboard() {
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>("daily");
  const goals = {
    daily: { questions: { done: 40, target: 80 }, time: { done: 60, target: 120 }, mocks: { done: 0, target: 1 } },
    weekly: { questions: { done: 320, target: 500 }, time: { done: 510, target: 900 }, mocks: { done: 3, target: 7 } },
    monthly: { questions: { done: 1240, target: 2000 }, time: { done: 1800, target: 3600 }, mocks: { done: 10, target: 20 } },
  };

  const currentGoal = goals[goalPeriod];
  const overallPct = Math.round(
    ((currentGoal.questions.done / currentGoal.questions.target) +
      (currentGoal.time.done / currentGoal.time.target) +
      (currentGoal.mocks.done / currentGoal.mocks.target)) / 3 * 100
  );

  const progressBar = (done: number, target: number) => {
    const pct = Math.min(100, Math.round((done / target) * 100));
    return (
      <div className="h-1.5 bg-slate-200/60 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    );
  };

  const cardBaseClass = "glass dark:glass-strong rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-md hover:shadow-xl hover:border-teal-400/60 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col group relative overflow-hidden";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 pt-6 space-y-6">

      {/* ── 1. PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="relative pt-2 pb-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-teal-700 dark:text-teal-400 tracking-tight mb-1">Exam Preparation</h1>
        <p className="text-[15px] font-medium text-teal-700/80 dark:text-teal-500/80">Your daily study workspace — AKT &amp; KFP preparation.</p>
      </div>

      {/* ── 2. TOP STATS ROW ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Questions Done", value: "1,240", sub: "Total questions completed" },
          { label: "Accuracy", value: "82%", sub: "Average accuracy" },
          { label: "Study Streak", value: "12 Days", sub: "Keep it going!" },
          { label: "Mock Test Average", value: "76%", sub: "Average across 8 tests" },
        ].map(({ label, value, sub }) => (
          <div key={label} className={`${cardBaseClass} justify-between !p-4 hover:-translate-y-1 hover:border-teal-400/60 dark:hover:border-teal-500/60`}>
            <p className="text-[11px] font-bold text-teal-600/80 dark:text-teal-400 uppercase tracking-wide mb-3">{label}</p>
            <p className="text-3xl font-extrabold text-teal-900 dark:text-teal-100 tracking-tight leading-none mb-1.5">{value}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── 3. MAIN ACTION CARDS ROW 1 ───────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1 — Start a New Quiz */}
        <div className={cardBaseClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-50 dark:from-teal-900/20 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="mb-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] leading-snug mb-1.5 group-hover:text-teal-600 transition-colors">Start a New Quiz</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Choose your exam type, topics, question count, and difficulty level.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-5 mt-1">
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-teal-300"></div>AKT or KFP</span>
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-teal-300"></div>Fixed mode</span>
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-teal-300"></div>Topic selection</span>
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-teal-300"></div>Timed practice</span>
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-teal-300"></div>Adaptive mode</span>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
            <button className="text-sm font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
              Start Quiz
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>

        {/* Card 2 — Create Your Own Mock Exam */}
        <div className={cardBaseClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-50 dark:from-teal-900/20 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="mb-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] leading-snug mb-1.5 group-hover:text-teal-600 transition-colors">Create Your Own Mock Exam</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Build a fully customized mock exam tailored to your study goals.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-5 mt-1">
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-teal-300"></div>Select topics</span>
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-teal-300"></div>Mixed subjects</span>
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-teal-300"></div>Question count</span>
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-teal-300"></div>Save presets</span>
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-teal-300"></div>Time limits</span>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
            <button className="text-sm font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
              Create Mock
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>

        {/* Card 3 — Resume Mock Exam */}
        <div className={cardBaseClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-50 dark:from-teal-900/20 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="mb-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] leading-snug mb-1.5 group-hover:text-teal-600 transition-colors">Resume Mock Exam</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Continue exactly where you left off.</p>
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-800/50 border border-teal-100/30 dark:border-teal-900/30 rounded-xl px-4 py-3.5 mb-5 mt-1 shadow-sm">
            <div className="text-[13px] font-bold text-teal-800 dark:text-teal-200 mb-0.5">AKT Mock #5</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">72 Questions Remaining</div>
            <div className="relative h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-[65%] bg-teal-500 rounded-full" />
            </div>
            <div className="text-[10px] font-medium text-right text-teal-600 dark:text-teal-400 mt-1.5 uppercase tracking-wider">65% Complete</div>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
            <button className="text-sm font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
              Resume Exam
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. MAIN ACTION CARDS ROW 2 ───────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Card 4 — Preset Mock Exams */}
        <div className={cardBaseClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-50 dark:from-teal-900/20 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="mb-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] leading-snug mb-1.5 group-hover:text-teal-600 transition-colors">Preset Mock Exams</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Jump straight into professionally curated mock exams.</p>
          </div>
          <ul className="space-y-2 mb-5 mt-1">
            {["Full AKT Simulation", "KFP Practice Set", "Rapid Revision Test", "Final Week Assessment"].map((item) => (
              <li key={item} className="text-[13px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
            <button className="text-sm font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
              Start Mock
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>

        {/* Card 5 — Drill Weak Areas */}
        <div className={cardBaseClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-50 dark:from-teal-900/20 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="mb-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] leading-snug mb-1.5 group-hover:text-teal-600 transition-colors">Drill Weak Areas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">AI identifies your weakest topics and generates focused practice.</p>
          </div>
          <div className="mb-5 mt-1">
            <p className="text-[10px] text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest font-bold mb-2.5">Blind Spots Identified</p>
            <div className="flex flex-wrap gap-2">
              {["Cardiovascular", "Endocrinology", "Dermatology"].map((chip) => (
                <span key={chip} className="px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-[11px] font-bold text-teal-700 dark:text-teal-300 shadow-sm border border-teal-100 dark:border-teal-800/50">
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
            <button className="text-sm font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
              Practice Weak Areas
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. REVIEW PAST RESULTS (FULL WIDTH) ──────────────────────────── */}
      <div className={cardBaseClass}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-50 dark:from-teal-900/10 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-xl leading-snug mb-2 group-hover:text-teal-600 transition-colors">Review Past Results</h3>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed">Track progress, monitor your improvement over time, and view detailed breakdowns of your performance across all test topics.</p>
            <button className="mt-6 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2">
              View Detailed Results
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>

          <div className="flex-1 w-full lg:max-w-md">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Average Score", value: "78%" },
                { label: "Accuracy Trend", value: "Improving" },
                { label: "Recent Exams", value: "12 Completed" },
                { label: "Topic Perf.", value: "View breakdown" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest mb-1">{label}</span>
                  <span className="font-extrabold text-teal-900 dark:text-teal-100 text-lg">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. GOALS ROW 1 ───────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Today's Goal */}
        <div className={cardBaseClass}>
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
              {progressBar(currentGoal.questions.done, currentGoal.questions.target)}
            </div>
            <div>
              <p className="text-[11px] font-bold text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest mb-1.5">Time</p>
              <div className="text-2xl font-extrabold text-teal-900 dark:text-teal-100 leading-none">
                {currentGoal.time.done} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">/ {currentGoal.time.target}m</span>
              </div>
              {progressBar(currentGoal.time.done, currentGoal.time.target)}
            </div>
            <div>
              <p className="text-[11px] font-bold text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest mb-1.5">Mock Test</p>
              <div className="text-2xl font-extrabold text-teal-900 dark:text-teal-100 leading-none">
                {currentGoal.mocks.done} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">/ {currentGoal.mocks.target}</span>
              </div>
              {progressBar(currentGoal.mocks.done, currentGoal.mocks.target)}
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
        <div className={cardBaseClass}>
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
                {progressBar(done, value)}
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 px-4 py-3 bg-teal-50/80 dark:bg-teal-900/20 rounded-xl border border-teal-100/50 dark:border-teal-800/30">
            <p className="text-[13px] font-bold text-teal-800 dark:text-teal-300">Keep going! You&apos;re doing great </p>
          </div>
        </div>
      </div>

      {/* ── 7. GOALS ROW 2 ───────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* Recent Activity */}
        <div className={cardBaseClass}>
          <h2 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] mb-5">Recent Activity</h2>
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_1.5fr_auto] gap-4 text-[10px] text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest font-bold pb-3 border-b border-teal-200/50 dark:border-teal-800/50">
              <span>Date</span><span>Activity</span><span>Result</span>
            </div>
            {[
              { date: "Today", activity: "Cardiology Quiz", result: "84%", type: "score" },
              { date: "Yesterday", activity: "AKT Mock #5", result: "In Progress", type: "progress" },
              { date: "2 Days Ago", activity: "Dermatology Practice", result: "78%", type: "score" },
              { date: "3 Days Ago", activity: "KFP Practice Set", result: "81%", type: "score" },
              { date: "4 Days Ago", activity: "Rapid Revision Test", result: "71%", type: "score" },
            ].map(({ date, activity, result, type }) => (
              <div key={`${date}-${activity}`} className="grid grid-cols-[1fr_1.5fr_auto] gap-4 items-center py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors px-2 -mx-2 rounded-lg">
                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{date}</span>
                <span className="text-[14px] font-bold text-teal-900 dark:text-teal-100">{activity}</span>
                <span className={`text-[13px] font-bold px-2.5 py-1 rounded-md ${type === "progress" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"}`}>{result}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Study Targets */}
        <div className={`${cardBaseClass} flex flex-col`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-teal-800 dark:text-teal-200 text-[16px]">Upcoming Study Targets</h2>
            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-full border border-teal-100/50 dark:border-teal-800/50">This Week</span>
          </div>
          <div className="space-y-4 flex-1">
            {[
              { task: "Complete 200 Questions", done: false },
              { task: "Finish AKT Mock #5", done: false },
              { task: "Improve Dermatology Accuracy", done: false },
              { task: "Review Endocrinology Notes", done: true },
              { task: "Complete KFP Practice Set", done: true },
            ].map(({ task, done }) => (
              <div key={task} className="flex items-start gap-3.5 group cursor-pointer">
                <div className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-all ${done ? "bg-teal-500 border-teal-500" : "border-slate-300 dark:border-slate-600 group-hover:border-teal-400 dark:bg-slate-800 bg-white"}`}>
                  {done && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-[14px] font-medium transition-colors ${done ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-300 group-hover:text-teal-800 dark:group-hover:text-teal-200"}`}>{task}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-700/80">
            <div className="flex justify-between items-center text-[12px] text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider text-teal-600/80 dark:text-teal-500/80">Week Progress</span>
              <span className="font-bold text-teal-800 dark:text-teal-200">2 / 5 Complete</span>
            </div>
            <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full" style={{ width: "40%" }} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
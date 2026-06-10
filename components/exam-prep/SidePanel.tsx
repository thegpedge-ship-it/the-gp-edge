"use client";

import { useState, useEffect } from "react";
import { upcomingMock, mockDrill } from "./data";
import MockDrillModal from "./MockDrillModal";

/* ─── Countdown Hook ──────────────────────────────────────────────────── */
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

/* ─── Countdown Digit ─────────────────────────────────────────────────── */
function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-10 h-10 rounded-lg bg-slate-900 dark:bg-slate-950 flex items-center justify-center shadow-lg border border-slate-700/50">
        <span className="text-lg font-extrabold text-emerald-400 font-mono tracking-tight">
          {String(value).padStart(2, "0")}
        </span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/50" />
      </div>
      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">{label}</span>
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function SidePanel() {
  const countdown = useCountdown(upcomingMock.date);
  const [showDrillModal, setShowDrillModal] = useState(false);

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ─── 1. Upcoming Mock Exam — Hero Card ─────────────────── */}
      <div className="relative glass dark:glass-strong rounded-2xl p-4 border border-emerald-400 dark:border-emerald-600 shadow-lg overflow-hidden group flex-shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-green-400/10 dark:bg-green-500/5 group-hover:scale-110 transition-transform duration-700" />

        <div className="relative">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-0.5">#Mock Test 234</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">{upcomingMock.subtitle}</p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Digit value={countdown.days} label="Days" />
            <span className="text-slate-500 dark:text-slate-600 font-bold text-lg mt-[-12px]">:</span>
            <Digit value={countdown.hours} label="Hrs" />
            <span className="text-slate-500 dark:text-slate-600 font-bold text-lg mt-[-12px]">:</span>
            <Digit value={countdown.mins} label="Min" />
            <span className="text-slate-500 dark:text-slate-600 font-bold text-lg mt-[-12px]">:</span>
            <Digit value={countdown.secs} label="Sec" />
          </div>

          <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-transform duration-300">
            Register Now &rarr;
          </button>
        </div>
      </div>

      {/* ─── 2. Create Your Own Quiz ───────────────────────────── */}
      <div
        onClick={() => setShowDrillModal(true)}
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

      {/* Mock Drill Modal */}
      <MockDrillModal open={showDrillModal} onClose={() => setShowDrillModal(false)} />
    </div>
  );
}

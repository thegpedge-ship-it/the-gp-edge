"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockDrill, mockTests } from "./data";
import {
  buildInstructionsUrl,
  parseDurationToMinutes,
  saveCustomTestConfig,
} from "@/lib/testSession";
import MockTestsModal from "./MockTestsModal";
import CreateQuizModal from "./CreateQuizModal";

/* ─── Summary Stat ────────────────────────────────────────────────────── */
function Stat({ value, label, onDark = false }: { value: string; label: string; onDark?: boolean }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <span className={`font-sans text-xl md:text-2xl font-bold tracking-tighter leading-none ${onDark ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>{value}</span>
      <span className={`font-sans text-[9px] font-bold uppercase tracking-wider mt-1.5 ${onDark ? "text-slate-400" : "text-slate-400 dark:text-slate-500"}`}>{label}</span>
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function SidePanel() {
  const router = useRouter();
  const [mockTestsOpen, setMockTestsOpen] = useState(false);
  const [createQuizOpen, setCreateQuizOpen] = useState(false);

  const startMockDrill = () => {
    saveCustomTestConfig({
      name: mockDrill.title,
      questionCount: mockDrill.questionCount,
      durationMinutes: parseDurationToMinutes(mockDrill.duration),
    });
    router.push(buildInstructionsUrl("custom"));
  };

  const completedMocks = mockTests.filter((t) => t.status === "completed");
  const avgScore = completedMocks.length
    ? Math.round(completedMocks.reduce((s, t) => s + (t.bestScore ?? 0), 0) / completedMocks.length)
    : 0;

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ─── 1. Mock Tests — Premium Hero Card ─────────────────── */}
      <div className="relative rounded-2xl p-5 overflow-hidden flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/50 ring-1 ring-emerald-500/10 shadow-xl shadow-slate-900/[0.07]">
        {/* Hairline emerald accent along the top edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

        <div className="relative">
          <h3 className="font-sans text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100 mb-1">Mock Tests</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-4">Full AKT simulations under exam conditions</p>

          {/* Summary stats */}
          <div className="flex items-stretch gap-2 mb-4 px-2 py-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/30">
            <Stat value={String(mockTests.length)} label="Tests" />
            <div className="w-px bg-emerald-200/70 dark:bg-emerald-800/40" />
            <Stat value={String(completedMocks.length)} label="Done" />
            <div className="w-px bg-emerald-200/70 dark:bg-emerald-800/40" />
            <Stat value={`${avgScore}%`} label="Avg" />
          </div>

          <button
            onClick={() => setMockTestsOpen(true)}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:-translate-y-0.5 transition-all duration-300"
          >
            View Mock Tests &rarr;
          </button>
        </div>
      </div>

      {/* ─── 2. Create Your Own Quiz ───────────────────────────── */}
      <div
        onClick={() => setCreateQuizOpen(true)}
        className="rounded-2xl overflow-hidden flex-shrink-0 px-5 py-3.5 cursor-pointer bg-white dark:bg-slate-900 border border-dashed border-emerald-700 dark:border-emerald-600 shadow-sm hover:shadow-md hover:border-emerald-800 dark:hover:border-emerald-500 transition-all duration-300"
      >
        <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 leading-snug">Create Your Own Quiz</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pick your topics, set your rules.</p>
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

        <button
          onClick={startMockDrill}
          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-transform duration-300"
        >
          Start Mock Drill &rarr;
        </button>
      </div>

      {/* ─── Mock Tests modal ──────────────────────────────────── */}
      <MockTestsModal open={mockTestsOpen} onClose={() => setMockTestsOpen(false)} />

      {/* ─── Create Your Own Quiz modal ────────────────────────── */}
      <CreateQuizModal open={createQuizOpen} onClose={() => setCreateQuizOpen(false)} />
    </div>
  );
}

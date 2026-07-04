"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildCustomQuestionSet } from "@/app/exam-prep/actions";
import type { UiMockTest } from "@/app/exam-prep/actions";
import { cachedMockTests } from "@/lib/examCache";
import {
  buildInstructionsUrl,
  parseDurationToMinutes,
  saveTestPlan,
} from "@/lib/testSession";
import MockTestsModal from "./MockTestsModal";
import CreateQuizModal from "./CreateQuizModal";

/* Mock Drill is a fixed configuration (not seeded content): a randomised
   full-spectrum quiz drawn live from the published question bank. */
const MOCK_DRILL = {
  title: "Mock Drill",
  description:
    "Jump into a randomised full-spectrum quiz. No topic selection — we cover everything so you can identify blind spots.",
  questionCount: 50,
  duration: "60 min",
  difficulty: "Mixed",
};

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
  const [mockTests, setMockTests] = useState<UiMockTest[]>([]);
  const [startingDrill, setStartingDrill] = useState(false);

  useEffect(() => {
    let cancelled = false;
    cachedMockTests().then((m) => {
      if (!cancelled) setMockTests(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const startMockDrill = async () => {
    if (startingDrill) return;
    setStartingDrill(true);
    const set = await buildCustomQuestionSet({
      subtopicIds: [], // empty = whole bank
      count: MOCK_DRILL.questionCount,
      title: MOCK_DRILL.title,
    });
    setStartingDrill(false);
    if (set.questionIds.length === 0) return;
    saveTestPlan({
      testId: "drill",
      source: "mock_drill",
      name: MOCK_DRILL.title,
      questionIds: set.questionIds,
      durationMinutes: parseDurationToMinutes(MOCK_DRILL.duration),
      timed: false,
    });
    router.push(buildInstructionsUrl("drill"));
  };

  const completedMocks = mockTests.filter((t) => t.completed);
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
        <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 mb-2">{MOCK_DRILL.title}</h3>

        <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          {MOCK_DRILL.description}
        </p>

        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
          <span>{MOCK_DRILL.duration}</span>
          <span>&middot;</span>
          <span>{MOCK_DRILL.questionCount} Qs</span>
          <span>&middot;</span>
          <span>{MOCK_DRILL.difficulty}</span>
        </div>

        <button
          onClick={startMockDrill}
          disabled={startingDrill}
          className="w-full py-2.5 rounded-xl bg-emerald-600 disabled:opacity-60 disabled:cursor-wait text-white text-[13px] font-bold shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-transform duration-300"
        >
          {startingDrill ? "Preparing…" : "Start Mock Drill →"}
        </button>
      </div>

      {/* ─── Mock Tests modal ──────────────────────────────────── */}
      <MockTestsModal open={mockTestsOpen} onClose={() => setMockTestsOpen(false)} tests={mockTests} />

      {/* ─── Create Your Own Quiz modal ────────────────────────── */}
      <CreateQuizModal open={createQuizOpen} onClose={() => setCreateQuizOpen(false)} />
    </div>
  );
}

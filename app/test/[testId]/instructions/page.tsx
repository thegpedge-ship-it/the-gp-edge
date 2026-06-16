"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { authorizeTestStart, resolveTestConfig } from "@/lib/testSession";
import type { TestConfig } from "@/lib/testSession";
import TestNotFound from "@/components/test/TestNotFound";

const INSTRUCTIONS = [
  "The timer starts as soon as you click “Start Test” and counts down in the top bar. The test submits automatically when time runs out.",
  "Each question has exactly one correct answer. Click an option to select it; click “Clear Response” to deselect.",
  "Use the “Previous” and “Next” buttons, or click any number in the question palette, to move between questions.",
  "You can change your answer to any question at any time before submitting.",
  "There is no negative marking — attempt every question.",
  "Click “Submit Test” in the top bar when you are done. You will be asked to confirm before your answers are submitted.",
  "Do not refresh or close the browser tab during the test — your progress will be lost.",
];

const PALETTE_LEGEND = [
  { color: "bg-emerald-500", label: "Answered", description: "You have selected an option" },
  { color: "bg-red-400", label: "Not Answered", description: "Visited but no option selected" },
  { color: "bg-slate-300 dark:bg-slate-600", label: "Not Visited", description: "You have not seen this question yet" },
];

export default function InstructionsPage() {
  const router = useRouter();
  const { testId } = useParams<{ testId: string }>();
  // undefined = resolving, null = unknown/locked test
  const [config, setConfig] = useState<TestConfig | null | undefined>(undefined);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    setConfig(resolveTestConfig(testId));
  }, [testId]);

  if (config === undefined) return null;
  if (config === null) return <TestNotFound />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Header — title + summary stats in one row */}
        <div className="px-8 py-4 border-b border-slate-200 dark:border-slate-700 bg-emerald-50/60 dark:bg-emerald-900/10 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Test Instructions</p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{config.name}</h1>
          </div>
          <div className="flex items-center gap-8 flex-shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{config.questionCount}</span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">Questions</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{config.durationMinutes} min</span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">Duration</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{config.questionCount}</span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">Total Marks</span>
            </div>
          </div>
        </div>

        {/* Body — single-column: instructions, then palette legend */}
        <div className="px-8 py-6">
          <h2 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-4">Read carefully before you begin</h2>
          <ol className="space-y-3">
            {INSTRUCTIONS.map((instruction, i) => (
              <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {instruction}
              </li>
            ))}
          </ol>

          {/* Palette legend */}
          <h2 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mt-7 mb-4">Question palette colours</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {PALETTE_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-700/40 bg-slate-50/60 dark:bg-slate-800/30 px-3 py-2.5">
                <span className={`w-7 h-7 rounded-full flex-shrink-0 ${item.color} text-white text-[11px] font-bold flex items-center justify-center`}>1</span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{item.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer — declaration + start in one row */}
        <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-6">
          <label className="flex items-center gap-3 cursor-pointer select-none min-w-0">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 flex-shrink-0 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
            />
            <span className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
              I have read and understood the instructions. I am ready to begin the test.
            </span>
          </label>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              &larr; Go Back
            </button>
            <button
              onClick={() => {
                authorizeTestStart(testId);
                router.push(`/test/${testId}/start`);
              }}
              disabled={!agreed}
              className={`px-7 py-2 rounded-lg text-[14px] font-bold transition-all duration-200 ${
                agreed
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 hover:-translate-y-0.5"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              }`}
            >
              Start Test &rarr;
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

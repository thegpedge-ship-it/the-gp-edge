"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { authorizeTestStart, loadTestPlan, planToConfig } from "@/lib/testSession";
import type { TestConfig } from "@/lib/testSession";
import TestNotFound from "@/components/test/TestNotFound";
import ExamLoadingScreen from "@/components/exam-prep/ExamLoadingScreen";

// Shown only for timed tests (mock tests).
const TIMER_INSTRUCTION =
  "The timer starts when you click “Start Test” and counts down in the top bar. The test will be submitted automatically when the time expires.";

const INSTRUCTIONS = [
  "Each question has one correct answer. Select an option to answer a question, or click “Clear Response” to remove your selection.",
  "Use the “Previous” and “Next” buttons, or select a question number from the question palette, to move between questions.",
  "You can change your answer to any question at any time before submitting the test.",
  "There is no negative marking. Attempt every question.",
  "Click “Submit Test” in the top bar when you have finished. You will be asked to confirm before your answers are submitted.",
  "Do not refresh the page or close the browser tab during the test, as your progress may be lost.",
];

const PALETTE_LEGEND = [
  {
    label: "Answered",
    description: "You have selected an option",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500 text-white",
    cardClass: "border-emerald-200/60 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/20",
  },
  {
    label: "Not Answered",
    description: "Visited but no option selected",
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-500 text-white",
    cardClass: "border-rose-200/60 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/20",
  },
  {
    label: "Not Visited",
    description: "You have not seen this question yet",
    dotClass: "bg-slate-300 dark:bg-slate-600",
    badgeClass: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    cardClass: "border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20",
  },
];

export default function InstructionsPage() {
  const router = useRouter();
  const { testId } = useParams<{ testId: string }>();
  // undefined = resolving, null = unknown/locked test
  const [config, setConfig] = useState<TestConfig | null | undefined>(undefined);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const plan = loadTestPlan(testId);
    setConfig(plan ? planToConfig(plan) : null);
  }, [testId]);

  // Never render nothing here: this is the first frame after "Start", and a
  // blank screen reads as a broken button.
  if (config === undefined) return <ExamLoadingScreen title="Preparing your test" />;
  if (config === null) return <TestNotFound />;

  const instructions = config.timed ? [TIMER_INSTRUCTION, ...INSTRUCTIONS] : INSTRUCTIONS;

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 flex items-center justify-center px-4 py-8 sm:py-12">
      <style>{`
        .ui-checkbox {
          --primary-color: #0d9488;
          --secondary-color: #fff;
          --checkbox-diameter: 18px;
          --checkbox-border-radius: 5px;
          --checkbox-border-color: #cbd5e1;
          --checkbox-border-width: 1.5px;
          --checkmark-size: 1.1;
        }

        .dark .ui-checkbox {
          --secondary-color: #0f172a;
          --checkbox-border-color: #475569;
        }

        .ui-checkbox {
          -webkit-appearance: none;
          appearance: none;
          width: var(--checkbox-diameter);
          height: var(--checkbox-diameter);
          border-radius: var(--checkbox-border-radius);
          background: var(--secondary-color);
          border: var(--checkbox-border-width) solid var(--checkbox-border-color);
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
        }

        .ui-checkbox:hover {
          border-color: var(--primary-color);
        }

        .ui-checkbox:checked {
          background: var(--primary-color);
          border-color: transparent;
        }

        .ui-checkbox::before {
          content: "";
          position: absolute;
          top: 40%;
          left: 50%;
          width: 4px;
          height: 7px;
          border-right: 2px solid #fff;
          border-bottom: 2px solid #fff;
          transform: translate(-50%, -50%) rotate(45deg) scale(0);
          opacity: 0;
          transition: all 0.15s ease;
        }

        .ui-checkbox:checked::before {
          opacity: 1;
          transform: translate(-50%, -50%) rotate(45deg) scale(var(--checkmark-size));
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* ── 1. TOP TEST HEADER (Subtle grey background with visible divider) ── */}
        <div className="relative px-6 sm:px-8 py-5 border-b border-slate-200 dark:border-slate-700/80 bg-slate-100/60 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          {/* Subtle top accent gradient bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500" />

          <div className="min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              TEST INSTRUCTIONS
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Test:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{config.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-6 sm:gap-8 flex-shrink-0 pt-1 sm:pt-0">
            <div className="flex flex-col items-center text-center">
              <span className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                {config.questionCount}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 text-center">
                QUESTIONS
              </span>
            </div>

            {config.timed && (
              <div className="flex flex-col items-center text-center">
                <span className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                  {config.durationMinutes} min
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 text-center">
                  DURATION
                </span>
              </div>
            )}

            <div className="flex flex-col items-center text-center">
              <span className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                {config.questionCount}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 text-center">
                TOTAL MARKS
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. INSTRUCTIONS SECTION ──────────────────────────────────────── */}
        <div className="px-6 sm:px-8 py-6 sm:py-7">
          <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-4">
            READ CAREFULLY BEFORE YOU BEGIN
          </p>

          <ol className="space-y-4">
            {config.timed && (
              <li className="flex items-start gap-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="flex-shrink-0 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 select-none w-6">
                  01
                </span>
                <span className="flex-1">
                  The timer starts when you click <strong className="font-semibold text-slate-900 dark:text-slate-100">“Start Test”</strong> and counts down in the top bar. The test will be <strong className="font-semibold text-slate-900 dark:text-slate-100">submitted automatically</strong> when the time expires.
                </span>
              </li>
            )}

            <li className="flex items-start gap-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="flex-shrink-0 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 select-none w-6">
                {config.timed ? "02" : "01"}
              </span>
              <span className="flex-1">
                Each question has <strong className="font-semibold text-slate-900 dark:text-slate-100">one correct answer</strong>. Select an option to answer a question, or click <strong className="font-semibold text-slate-900 dark:text-slate-100">“Clear Response”</strong> to remove your selection.
              </span>
            </li>

            <li className="flex items-start gap-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="flex-shrink-0 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 select-none w-6">
                {config.timed ? "03" : "02"}
              </span>
              <span className="flex-1">
                Use the <strong className="font-semibold text-slate-900 dark:text-slate-100">“Previous”</strong> and <strong className="font-semibold text-slate-900 dark:text-slate-100">“Next”</strong> buttons, or select a question number from the <strong className="font-semibold text-slate-900 dark:text-slate-100">question palette</strong>, to move between questions.
              </span>
            </li>

            <li className="flex items-start gap-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="flex-shrink-0 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 select-none w-6">
                {config.timed ? "04" : "03"}
              </span>
              <span className="flex-1">
                You can <strong className="font-semibold text-slate-900 dark:text-slate-100">change your answer</strong> to any question at any time before submitting the test.
              </span>
            </li>

            <li className="flex items-start gap-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="flex-shrink-0 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 select-none w-6">
                {config.timed ? "05" : "04"}
              </span>
              <span className="flex-1">
                There is <strong className="font-semibold text-slate-900 dark:text-slate-100">no negative marking</strong>. Attempt every question.
              </span>
            </li>

            <li className="flex items-start gap-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="flex-shrink-0 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 select-none w-6">
                {config.timed ? "06" : "05"}
              </span>
              <span className="flex-1">
                Click <strong className="font-semibold text-slate-900 dark:text-slate-100">“Submit Test”</strong> in the top bar when you have finished. You will be asked to <strong className="font-semibold text-slate-900 dark:text-slate-100">confirm</strong> before your answers are submitted.
              </span>
            </li>

            <li className="flex items-start gap-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="flex-shrink-0 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 select-none w-6">
                {config.timed ? "07" : "06"}
              </span>
              <span className="flex-1">
                <strong className="font-semibold text-slate-900 dark:text-slate-100">Do not refresh the page or close the browser tab</strong> during the test, as your progress may be lost.
              </span>
            </li>
          </ol>

          {/* ── 3. QUESTION PALETTE COLOURS (Enclosed section with clear divider) ── */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/80">
            <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-3.5">
              QUESTION PALETTE COLOURS
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {PALETTE_LEGEND.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 ${item.cardClass}`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex-shrink-0 ${item.badgeClass} text-[11px] font-bold flex items-center justify-center shadow-xs`}
                  >
                    1
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 4. BOTTOM ACTION BAR (Clearly divided footer with prominent sizing) ── */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-t border-slate-200 dark:border-slate-700/80 bg-slate-100/70 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <label className="flex items-center gap-3.5 cursor-pointer select-none min-w-0">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600 shrink-0"
            />
            <span className="text-sm sm:text-[15px] font-medium text-slate-800 dark:text-slate-200 leading-normal">
              I have read and understood the instructions. I am ready to begin the test.
            </span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-shrink-0">
            <button
              onClick={() => router.back()}
              className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-2xs transition-all duration-150 whitespace-nowrap cursor-pointer"
            >
              &larr; Go Back
            </button>
            <button
              onClick={() => {
                authorizeTestStart(testId);
                router.push(`/test/${testId}/start`);
              }}
              disabled={!agreed}
              className={`flex-1 sm:flex-none px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                agreed
                  ? "bg-teal-600 hover:bg-teal-500 text-white shadow-sm hover:shadow cursor-pointer"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
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

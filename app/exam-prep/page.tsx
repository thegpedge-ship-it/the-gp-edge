"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cachedMockTests, clearMockTestsCache } from "@/lib/examCache";
import type { UiMockTest } from "@/app/exam-prep/actions";
import StudyByTopicModal from "@/components/exam-prep/StudyByTopicModal";
import MockTestsModal from "@/components/exam-prep/MockTestsModal";
import CreateQuizModal from "@/components/exam-prep/CreateQuizModal";
import CreatedForYouModal from "@/components/exam-prep/CreatedForYouModal";

type ModalKey = "topic" | "mock" | "create" | "foryou";

interface StudyOption {
  key: ModalKey;
  title: string;
  description: string;
}

/* The four primary study options — presented equally, identical styling.
   Each simply opens its corresponding modal. */
const OPTIONS: StudyOption[] = [
  {
    key: "topic",
    title: "Study by Topic",
    description: "Browse subjects and subtopics, then take a focused quiz.",
  },
  {
    key: "mock",
    title: "Do a Mock Test",
    description: "Sit a full exam-condition simulation from start to finish.",
  },
  {
    key: "create",
    title: "Create Your Own Quiz",
    description: "Pick your topics and rules to build a custom quiz.",
  },
  {
    key: "foryou",
    title: "Created for You",
    description: "Jump into a ready-made mixed quiz across every topic.",
  },
];

export default function ExamPrepPage() {
  const [active, setActive] = useState<ModalKey | null>(null);
  const [mockTests, setMockTests] = useState<UiMockTest[]>([]);

  // Prefetch mock tests so the "Do a Mock Test" modal opens with data ready.
  useEffect(() => {
    let cancelled = false;
    cachedMockTests().then((m) => {
      if (!cancelled) setMockTests(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Best scores / attempt counts change after every attempt, so whenever the
  // Mock Tests modal is opened we drop any (possibly stale) cached entry and
  // pull the latest per-user stats. This keeps the "Best n%" on each card
  // correct even if the post-attempt cache-clear raced with navigating back.
  useEffect(() => {
    if (active !== "mock") return;
    let cancelled = false;
    clearMockTestsCache();
    cachedMockTests().then((m) => {
      if (!cancelled) setMockTests(m);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <div
      className="relative -mt-[18px] overflow-hidden"
      style={{ height: "calc(100vh - 150px)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="h-full flex flex-col justify-center w-full max-w-6xl mx-auto px-2 py-4"
      >
        {/* Heading */}
        <div className="mb-[51px] md:mb-[59px] text-center">
          <h1 className="font-serif text-[1.6rem] md:text-[2rem] lg:text-[2.4rem] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            Choose how to study
          </h1>
          <p className="font-sans text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2">
            Every option helps you prepare — pick where to start.
          </p>
        </div>

        {/* Four equal option cards — 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {OPTIONS.map((opt, i) => (
            <button
              key={opt.key}
              onClick={() => setActive(opt.key)}
              className="group relative flex flex-col text-left rounded-2xl p-7 h-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-600/60 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              {/* Accent bar — grows across the top edge on hover */}
              <span className="absolute top-0 left-0 h-1 w-12 rounded-full bg-emerald-500/80 group-hover:w-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />

              {/* Index numeral (typography, not an icon) */}
              <span className="font-serif text-3xl font-semibold leading-none text-slate-200 dark:text-slate-700 group-hover:text-emerald-400 dark:group-hover:text-emerald-500 transition-colors duration-300 mb-6">
                {String(i + 1).padStart(2, "0")}
              </span>

              <h3 className="font-sans text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {opt.title}
              </h3>
              <p className="font-sans text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
                {opt.description}
              </p>

              {/* Open — underline sweeps in on hover */}
              <span className="mt-6 inline-block text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="relative">
                  Open
                  <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-emerald-500 group-hover:w-full transition-all duration-300 ease-out" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── Modals — one per option ───────────────────────────────────── */}
      <StudyByTopicModal open={active === "topic"} onClose={() => setActive(null)} />
      <MockTestsModal open={active === "mock"} onClose={() => setActive(null)} tests={mockTests} />
      <CreateQuizModal open={active === "create"} onClose={() => setActive(null)} />
      <CreatedForYouModal open={active === "foryou"} onClose={() => setActive(null)} />
    </div>
  );
}

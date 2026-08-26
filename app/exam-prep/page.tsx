"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LibraryBig, ClipboardList, FilePenLine, BookCheck, Lock, Unlock, ArrowRight, Info, MessageSquare } from "lucide-react";
import Link from "next/link";
import { cachedMockTests, clearMockTestsCache } from "@/lib/examCache";
import type { UiMockTest } from "@/app/exam-prep/actions";
import { fetchQuizzesFromDbAction } from "@/actions/quiz.actions";
import { useUserAccess } from "@/hooks/useUserAccess";
import UpgradeModal from "@/components/UpgradeModal";
import StudyByTopicModal from "@/components/exam-prep/StudyByTopicModal";
import MockTestsModal from "@/components/exam-prep/MockTestsModal";
import CreateQuizModal from "@/components/exam-prep/CreateQuizModal";
import CreatedForYouModal from "@/components/exam-prep/CreatedForYouModal";
import Image from "next/image";

type ModalKey = "topic" | "mock" | "create" | "foryou";

interface StudyOption {
  key: ModalKey;
  title: string;
  description: string;
  info: string;
  icon: React.ElementType;
  iconColorClass?: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const OPTIONS: StudyOption[] = [
  {
    key: "topic",
    title: "Study by Topic",
    description: "Browse subjects and subtopics, then take a focused quiz.",
    info: "Select any subtopic from a subject and attempt questions specifically on that area. Great for targeted revision.",
    icon: LibraryBig,
    iconColorClass: "text-slate-900 dark:text-slate-100",
    colorClass: "text-[#1B895C] dark:text-[#34d399]",
    bgClass: "bg-[#F0FDF4] dark:bg-[#1B895C]/20",
    borderClass: "border-b-[#1B895C] dark:border-b-[#34d399]",
  },
  {
    key: "mock",
    title: "Do a Mock Test",
    description: "Sit a full exam-condition simulation from start to finish.",
    info: "A complete AKT/KFP exam simulation with real-time monitoring — experience exam conditions before the real thing.",
    icon: ClipboardList,
    iconColorClass: "text-slate-900 dark:text-slate-100",
    colorClass: "text-[#1B895C] dark:text-[#34d399]",
    bgClass: "bg-[#F0FDF4] dark:bg-[#1B895C]/20",
    borderClass: "border-b-[#1B895C] dark:border-b-[#34d399]",
  },
  {
    key: "create",
    title: "Create Your Own Quiz",
    description: "Pick your topics and rules to build a custom quiz.",
    info: "Choose your subtopics and the number of questions — we fetch them randomly so you can practise exactly what you need.",
    icon: FilePenLine,
    iconColorClass: "text-slate-900 dark:text-slate-100",
    colorClass: "text-[#1B895C] dark:text-[#34d399]",
    bgClass: "bg-[#F0FDF4] dark:bg-[#1B895C]/20",
    borderClass: "border-b-[#1B895C] dark:border-b-[#34d399]",
  },
  {
    key: "foryou",
    title: "Created for You",
    description: "Jump into a ready-made mixed quiz across every topic.",
    info: "We analyse your weak areas and randomly serve questions on topics you need to improve — personalised revision on autopilot.",
    icon: BookCheck,
    iconColorClass: "text-slate-900 dark:text-slate-100",
    colorClass: "text-[#1B895C] dark:text-[#34d399]",
    bgClass: "bg-[#F0FDF4] dark:bg-[#1B895C]/20",
    borderClass: "border-b-[#1B895C] dark:border-b-[#34d399]",
  },
];

export default function ExamPrepPage() {
  const { isRegistrarActive, loading: accessLoading } = useUserAccess();
  const [active, setActive] = useState<ModalKey | null>(null);
  const [mockTests, setMockTests] = useState<UiMockTest[]>([]);
  const [mockLoading, setMockLoading] = useState(true);
  const [hasFreeQuiz, setHasFreeQuiz] = useState<boolean>(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState<string | undefined>();
  const [examMode, setExamMode] = useState<"AKT" | "KFP">("AKT");

  // Check if any free quiz exists in the database
  useEffect(() => {
    fetchQuizzesFromDbAction()
      .then((data) => {
        if (Array.isArray(data)) {
          const freeExists = data.some(
            (q: any) => q.isFree === true || q.is_free === true
          );
          setHasFreeQuiz(freeExists);
        }
      })
      .catch((err) => console.error("Failed to check free quizzes:", err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMockLoading(true);
    cachedMockTests(examMode)
      .then((m) => {
        if (!cancelled) setMockTests(m);
      })
      .finally(() => {
        if (!cancelled) setMockLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [examMode]);

  // Best scores / attempt counts change after every attempt, so whenever the
  // Mock Tests modal is opened we drop any (possibly stale) cached entry and
  // pull the latest per-user stats.
  useEffect(() => {
    if (active !== "mock") return;
    let cancelled = false;
    setMockLoading(true);
    clearMockTestsCache();
    cachedMockTests(examMode)
      .then((m) => {
        if (!cancelled) setMockTests(m);
      })
      .finally(() => {
        if (!cancelled) setMockLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, examMode]);

  return (
    <div
      className="relative flex flex-col justify-center items-center py-8 lg:py-16 min-h-[calc(100vh-100px)] w-full"
    >
      <Link
        href="/exam-prep/my-feedback"
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-600 transition-all duration-200 shadow-sm"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        My Feedback
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-auto"
      >
        {/* Header Section */}
        <div className="pt-2 sm:pt-4 lg:pt-6 mb-12 sm:mb-16 lg:mb-20 flex flex-col items-center text-center justify-center w-full max-w-3xl mx-auto">
          <h1 className="font-serif text-[2.25rem] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.5rem] font-bold leading-[1.15] tracking-tight text-[#1E293B] dark:text-slate-100">
            What&apos;s your <br />
            <span className="text-[#1B895C] dark:text-[#34d399]">study plan</span> today?
          </h1>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1">
              {(["AKT", "KFP"] as const).map((mode) => {
                const active = examMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setExamMode(mode)}
                    className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 z-10 ${
                      active
                        ? "text-teal-700 dark:text-teal-300"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="exam-mode-tab"
                        className="absolute inset-0 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-teal-200/60 dark:border-teal-500/20"
                        transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                      />
                    )}
                    <span className="relative z-10">{mode}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Four option cards — 1×4 grid on desktop, 2×2 on sm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 w-full mb-4 lg:mb-8">
          {OPTIONS.map((opt, i) => {
            const hasFreeMock = mockTests.some(
              (m) => m.isFree === true || (m as any).is_free === true
            );
            const isCardLocked =
              !isRegistrarActive &&
              (opt.key === "topic" ||
                opt.key === "create" ||
                opt.key === "foryou" ||
                (opt.key === "mock" && !hasFreeMock));

            return (
              <button
                key={opt.key}
                onClick={() => {
                  if (isCardLocked) {
                    setUpgradeFeatureName(opt.title);
                    setUpgradeModalOpen(true);
                  } else {
                    setActive(opt.key);
                  }
                }}
                className={`group relative flex flex-col text-left rounded-2xl p-3.5 lg:p-6 bg-white dark:bg-[#151b23] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] border-b-4 ${opt.borderClass} ${isCardLocked ? "border-slate-200/80 dark:border-slate-800/80 shadow-sm" : ""
                  }`}
              >
                {/* Locked Card Overlay */}
                {isCardLocked && (
                  <div className="absolute inset-0 rounded-2xl bg-white/75 dark:bg-slate-900/85 backdrop-blur-[2px] z-10 flex items-center justify-center p-0 text-center">
                    <div className="premium-btn-wrapper">
                      <div className="premium-btn" aria-label="Premium access required">
                        <svg className="premium-logo-icon" height="1.25em" viewBox="0 0 576 512">
                          <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
                        </svg>
                        <span className="premium-tooltip">Premium</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Row: Icon & Number / Free Badge */}
                <div className="flex items-end justify-between mb-3 lg:mb-5">
                  <div className="flex items-end justify-start h-10 lg:h-12">
                    <opt.icon className={`w-9 h-9 lg:w-11 lg:h-11 shrink-0 ${opt.iconColorClass || opt.colorClass}`} strokeWidth={1.75} />
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    {!isRegistrarActive && opt.key === "mock" && hasFreeMock && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                        <Unlock className="w-3 h-3" /> Free
                      </span>
                    )}
                    <span className={`font-serif text-lg lg:text-3xl font-medium ${opt.colorClass} opacity-80 group-hover:opacity-100 transition-opacity`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Title & Info Button */}
                <div className="flex items-center gap-1.5 mb-0.5 lg:mb-2">
                  <h3 className="font-sans text-sm lg:text-xl font-bold text-[#1B895C] dark:text-[#34d399] tracking-tight">
                    {opt.title}
                  </h3>
                  <div className="info-trigger relative" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200 cursor-default">
                      <Info className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-slate-500 dark:text-slate-400" strokeWidth={2.5} />
                    </div>
                    <div className="info-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl text-xs font-medium leading-snug text-white bg-slate-800 dark:bg-slate-700 shadow-lg opacity-0 pointer-events-none transition-all duration-200 w-52 z-[60] text-center">
                      {opt.info}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45 -mt-1" />
                    </div>
                  </div>
                </div>
                <p className="font-sans text-[12px] lg:text-[15px] text-[#64748B] dark:text-slate-400 leading-snug lg:leading-relaxed flex-1">
                  {opt.description}
                </p>

                {/* Bottom Row: Arrow */}
                <div className="mt-2 lg:mt-6 flex justify-end">
                  <ArrowRight className={`w-4 h-4 lg:w-6 lg:h-6 ${opt.colorClass} transform group-hover:translate-x-1.5 transition-transform duration-300`} strokeWidth={2} />
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Modals — one per option ───────────────────────────────────── */}
      <StudyByTopicModal open={active === "topic"} onClose={() => setActive(null)} examMode={examMode} />
      <MockTestsModal open={active === "mock"} onClose={() => setActive(null)} tests={mockTests} loading={mockLoading} examMode={examMode} />
      <CreateQuizModal open={active === "create"} onClose={() => setActive(null)} examMode={examMode} />
      <CreatedForYouModal open={active === "foryou"} onClose={() => setActive(null)} examMode={examMode} />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName={upgradeFeatureName}
        requiredTier="registrar"
      />

      <style jsx global>{`
        .premium-btn-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .premium-btn {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(-50deg, #0d9488, #2dd4bf, #059669);
          background-size: 250%;
          background-position: left;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 0.4s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
        }
        .premium-btn:hover {
          background-position: right;
          transform: scale(1.06);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.22);
        }
        .premium-logo-icon {
          fill: #ffffff;
        }
        .premium-tooltip {
          position: absolute;
          top: -20px;
          opacity: 0;
          background: linear-gradient(to right, #0d9488, #059669);
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          pointer-events: none;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
          white-space: nowrap;
        }
        .premium-tooltip::before {
          position: absolute;
          content: "";
          width: 8px;
          height: 8px;
          background: linear-gradient(45deg, #0d9488, #059669);
          transform: rotate(45deg);
          bottom: -4px;
          left: calc(50% - 4px);
          transition: all 0.3s ease;
        }
        .premium-btn:hover .premium-tooltip {
          top: -44px;
          opacity: 1;
        }
        .info-trigger:hover .info-tooltip {
          opacity: 1;
          pointer-events: auto;
        }
        .info-trigger:hover {
          z-index: 50;
        }
        button:has(.info-trigger:hover) {
          z-index: 50;
        }
      `}</style>
    </div>
  );
}


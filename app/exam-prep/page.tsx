"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock } from "lucide-react";
import { cachedMockTests, clearMockTestsCache } from "@/lib/examCache";
import type { UiMockTest } from "@/app/exam-prep/actions";
import { fetchQuizzesFromDbAction } from "@/actions/quiz.actions";
import { useUserAccess } from "@/hooks/useUserAccess";
import UpgradeModal from "@/components/UpgradeModal";
import StudyByTopicModal from "@/components/exam-prep/StudyByTopicModal";
import MockTestsModal from "@/components/exam-prep/MockTestsModal";
import CreateQuizModal from "@/components/exam-prep/CreateQuizModal";
import CreatedForYouModal from "@/components/exam-prep/CreatedForYouModal";
import { BookOpen, FileCheck2, FileEdit, Sparkles, ArrowRight, Info } from "lucide-react";
import Image from "next/image";

type ModalKey = "topic" | "mock" | "create" | "foryou";

interface StudyOption {
  key: ModalKey;
  title: string;
  description: string;
  info: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

function StudyByTopicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="2.5" width="15" height="4.5" rx="2" strokeWidth="1.6" />
      <rect x="8.5" y="4" width="3.5" height="1.5" rx="0.75" strokeWidth="1.3" />
      <rect x="4" y="8" width="17" height="4.5" rx="2" strokeWidth="1.6" />
      <path d="M7.5 8v5.5l1.8-1.2 1.8 1.2V8" strokeWidth="1.4" />
      <rect x="5" y="13.5" width="13" height="4.5" rx="2" strokeWidth="1.6" />
      <line x1="8.5" y1="15.75" x2="12.5" y2="15.75" strokeWidth="1.4" />
      <rect x="3" y="19" width="14" height="4.5" rx="2" strokeWidth="1.6" />
      <rect x="7" y="20.5" width="4.5" height="1.5" rx="0.75" strokeWidth="1.3" />
      <line x1="2" y1="25.5" x2="20" y2="25.5" strokeWidth="1.6" />
      <circle cx="21" cy="19.5" r="4.8" strokeWidth="1.6" fill="white" className="dark:fill-[#151b23]" />
      <circle cx="21" cy="19.5" r="4.8" strokeWidth="1.6" />
      <path d="M24.4 22.9l4.6 4.6" strokeWidth="2.2" />
    </svg>
  );
}

function MockTestsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="20" height="17" rx="2.5" strokeWidth="1.6" />
      <path d="M10 3V1.8A0.8 0.8 0 0 1 10.8 1h4.4a0.8 0.8 0 0 1 0.8 0.8V3" strokeWidth="1.4" />
      <path d="M10 20l-1 4M16 20l1 4M6 24h14" strokeWidth="1.6" />
      <path d="M5.5 7.5l1.8 1.8 3.5-3.5" strokeWidth="1.5" />
      <line x1="13" y1="8" x2="18.5" y2="8" strokeWidth="1.5" />
      <path d="M5.5 11.5l1.8 1.8 3.5-3.5" strokeWidth="1.5" />
      <line x1="13" y1="12" x2="18.5" y2="12" strokeWidth="1.5" />
      <path d="M5.5 15.5l1.8 1.8 3.5-3.5" strokeWidth="1.5" />
      <line x1="13" y1="16" x2="16.5" y2="16" strokeWidth="1.5" />
      <circle cx="21" cy="20.5" r="5.5" strokeWidth="1.6" fill="white" className="dark:fill-[#151b23]" />
      <circle cx="21" cy="20.5" r="5.5" strokeWidth="1.6" />
      <path d="M21 17.5v3h2.8" strokeWidth="1.6" />
    </svg>
  );
}

function CreateQuizIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Left Document Page */}
      <path d="M6 3h11a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7L6 3z" strokeWidth="1.6" />
      <path d="M6 3v4.5H2" strokeWidth="1.4" />
      
      {/* 3 Checkmarks with horizontal lines */}
      <path d="M5 11.5l1.6 1.6 3.2-3.2" strokeWidth="1.5" />
      <line x1="12" y1="12" x2="16" y2="12" strokeWidth="1.4" />
      <path d="M5 16l1.6 1.6 3.2-3.2" strokeWidth="1.5" />
      <line x1="12" y1="16.5" x2="16" y2="16.5" strokeWidth="1.4" />
      <path d="M5 20.5l1.6 1.6 3.2-3.2" strokeWidth="1.5" />
      <line x1="12" y1="21" x2="15" y2="21" strokeWidth="1.4" />

      {/* Prominent Diagonal Pencil on Right (Matching Image 2 exactly) */}
      <g strokeWidth="1.6">
        {/* Pencil Body & Eraser Cap (Filled white so document lines don't bleed through) */}
        <path d="M26.8 6.8 C 27.6 6 27.6 4.7 26.8 3.9 C 26 3.1 24.7 3.1 23.9 3.9 L 17.5 19.5 L 21.2 23.2 L 26.8 6.8 Z" fill="white" className="dark:fill-[#151b23]" />
        {/* Pencil Outline */}
        <path d="M26.8 6.8 C 27.6 6 27.6 4.7 26.8 3.9 C 26 3.1 24.7 3.1 23.9 3.9 L 17.5 19.5 L 21.2 23.2 L 26.8 6.8 Z" strokeWidth="1.6" />
        {/* Eraser Band Separator Line */}
        <line x1="22.5" y1="5.3" x2="25.4" y2="8.2" strokeWidth="1.4" />
        {/* Sharp Pencil Tip Point */}
        <path d="M17.5 19.5 L 16 28 L 21.2 23.2 Z" fill="currentColor" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

function CreatedForYouIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="16" height="21" rx="2" strokeWidth="1.5" />
      <path d="M7 2h12a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" strokeWidth="1.6" fill="white" className="dark:fill-[#151b23]" />
      <path d="M15.5 2v4.5H19" strokeWidth="1.4" />
      <line x1="9.5" y1="8" x2="16" y2="8" strokeWidth="1.4" />
      <line x1="9.5" y1="12" x2="16" y2="12" strokeWidth="1.4" />
      <line x1="9.5" y1="16" x2="13.5" y2="16" strokeWidth="1.4" />
      <circle cx="21" cy="20.5" r="5.8" strokeWidth="1.6" fill="white" className="dark:fill-[#151b23]" />
      <circle cx="21" cy="20.5" r="5.8" strokeWidth="1.6" />
      <circle cx="21" cy="18.5" r="1.8" strokeWidth="1.4" />
      <path d="M17.2 24.2a4 4.3 0 0 1 7.6 0" strokeWidth="1.4" />
    </svg>
  );
}

const OPTIONS: StudyOption[] = [
  {
    key: "topic",
    title: "Study by Topic",
    description: "Browse subjects and subtopics, then take a focused quiz.",
    info: "Select any subtopic from a subject and attempt questions specifically on that area. Great for targeted revision.",
    icon: StudyByTopicIcon,
    colorClass: "text-[#1B895C] dark:text-[#34d399]",
    bgClass: "bg-[#F0FDF4] dark:bg-[#1B895C]/20",
    borderClass: "border-b-[#1B895C] dark:border-b-[#34d399]",
  },
  {
    key: "mock",
    title: "Do a Mock Test",
    description: "Sit a full exam-condition simulation from start to finish.",
    info: "A complete AKT/KFP exam simulation with real-time monitoring — experience exam conditions before the real thing.",
    icon: MockTestsIcon,
    colorClass: "text-[#3B82F6] dark:text-[#60a5fa]",
    bgClass: "bg-[#EFF6FF] dark:bg-[#3B82F6]/20",
    borderClass: "border-b-[#3B82F6] dark:border-b-[#60a5fa]",
  },
  {
    key: "create",
    title: "Create Your Own Quiz",
    description: "Pick your topics and rules to build a custom quiz.",
    info: "Choose your subtopics and the number of questions — we fetch them randomly so you can practise exactly what you need.",
    icon: CreateQuizIcon,
    colorClass: "text-[#7C3AED] dark:text-[#a78bfa]",
    bgClass: "bg-[#F5F3FF] dark:bg-[#7C3AED]/20",
    borderClass: "border-b-[#7C3AED] dark:border-b-[#a78bfa]",
  },
  {
    key: "foryou",
    title: "Mock Drill",
    description: "Practise your weak spots with a personalised timed drill.",
    info: "We analyse your weak areas and randomly serve questions on topics you need to improve — personalised revision on autopilot.",
    icon: CreatedForYouIcon,
    colorClass: "text-[#F59E0B] dark:text-[#fbbf24]",
    bgClass: "bg-[#FFFBEB] dark:bg-[#F59E0B]/20",
    borderClass: "border-b-[#F59E0B] dark:border-b-[#fbbf24]",
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
    cachedMockTests()
      .then((m) => {
        if (!cancelled) setMockTests(m);
      })
      .finally(() => {
        if (!cancelled) setMockLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Best scores / attempt counts change after every attempt, so whenever the
  // Mock Tests modal is opened we drop any (possibly stale) cached entry and
  // pull the latest per-user stats.
  useEffect(() => {
    if (active !== "mock") return;
    let cancelled = false;
    setMockLoading(true);
    clearMockTestsCache();
    cachedMockTests()
      .then((m) => {
        if (!cancelled) setMockTests(m);
      })
      .finally(() => {
        if (!cancelled) setMockLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <div
      className="relative flex flex-col justify-start pt-2 lg:pt-4 pb-8 lg:pb-0 overflow-visible lg:overflow-hidden min-h-[calc(100dvh-80px)] lg:min-h-0 lg:h-[calc(100vh-80px)]"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col justify-start w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Header Section */}
        <div className="mb-6 lg:mb-8 flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-8 w-full">
          {/* Typography */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-serif text-[2rem] md:text-[2.5rem] lg:text-[3rem] font-semibold leading-[1.1] tracking-tight text-[#1E293B] dark:text-slate-100">
              What&apos;s your <br className="hidden md:block" />
              <span className="text-[#1B895C]">study plan</span> today?
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
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                {examMode === "AKT" ? "Single correct answer" : "Multiple correct answers"}
              </span>
            </div>
          </div>

          {/* Illustration */}
          <div className="flex-1 flex justify-center md:justify-end relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,253,244,1)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(27,137,92,0.15)_0%,transparent_70%)] rounded-full blur-[40px] pointer-events-none w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <Image
              src="/assets/images/study-plan-illustration.png"
              alt="Study Plan Books and Graduation Cap"
              width={280}
              height={240}
              className="relative z-10 w-48 md:w-56 lg:w-[280px] object-contain mix-blend-multiply dark:mix-blend-normal"
              priority
            />
          </div>
        </div>

        {/* Four option cards — 1×4 grid on desktop, 2×2 on sm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
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
                <div className="flex items-center justify-between mb-2 lg:mb-6">
                  <div className="flex items-center justify-center">
                    <opt.icon className={`w-11 h-11 lg:w-[3.75rem] lg:h-[3.75rem] ${opt.colorClass}`} />
                  </div>
                  <div className="flex items-center gap-2">
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
                  <h3 className="font-sans text-sm lg:text-xl font-bold text-[#1E293B] dark:text-slate-100 tracking-tight">
                    {opt.title}
                  </h3>
                  <div className="info-trigger relative" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200 cursor-default">
                      <Info className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-slate-500 dark:text-slate-400" strokeWidth={2.5} />
                    </div>
                    <div className="info-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl text-xs font-medium leading-snug text-white bg-slate-800 dark:bg-slate-700 shadow-lg opacity-0 pointer-events-none transition-all duration-200 w-52 z-30 text-center">
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
      `}</style>
    </div>
  );
}


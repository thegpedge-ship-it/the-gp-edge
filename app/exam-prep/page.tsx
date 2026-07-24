"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cachedMockTests, clearMockTestsCache } from "@/lib/examCache";
import type { UiMockTest } from "@/app/exam-prep/actions";
import StudyByTopicModal from "@/components/exam-prep/StudyByTopicModal";
import MockTestsModal from "@/components/exam-prep/MockTestsModal";
import CreateQuizModal from "@/components/exam-prep/CreateQuizModal";
import CreatedForYouModal from "@/components/exam-prep/CreatedForYouModal";
import { BookText, NotebookPen, ClipboardClock, SwatchBook, ArrowRight } from "lucide-react";
import Image from "next/image";

type ModalKey = "topic" | "mock" | "create" | "foryou";

interface StudyOption {
  key: ModalKey;
  title: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const OPTIONS: StudyOption[] = [
  {
    key: "topic",
    title: "Study by Topic",
    description: "Browse subjects and subtopics, then take a focused quiz.",
    icon: BookText,
    colorClass: "text-[#1B895C] dark:text-[#34d399]",
    bgClass: "bg-[#F0FDF4] dark:bg-[#1B895C]/20",
    borderClass: "border-b-[#1B895C] dark:border-b-[#34d399]",
  },
  {
    key: "mock",
    title: "Do a Mock Test",
    description: "Sit a full exam-condition simulation from start to finish.",
    icon: NotebookPen,
    colorClass: "text-[#3B82F6] dark:text-[#60a5fa]",
    bgClass: "bg-[#EFF6FF] dark:bg-[#3B82F6]/20",
    borderClass: "border-b-[#3B82F6] dark:border-b-[#60a5fa]",
  },
  {
    key: "create",
    title: "Create Your Own Quiz",
    description: "Pick your topics and rules to build a custom quiz.",
    icon: ClipboardClock,
    colorClass: "text-[#7C3AED] dark:text-[#a78bfa]",
    bgClass: "bg-[#F5F3FF] dark:bg-[#7C3AED]/20",
    borderClass: "border-b-[#7C3AED] dark:border-b-[#a78bfa]",
  },
  {
    key: "foryou",
    title: "Created for You",
    description: "Jump into a ready-made mixed quiz across every topic.",
    icon: SwatchBook,
    colorClass: "text-[#F59E0B] dark:text-[#fbbf24]",
    bgClass: "bg-[#FFFBEB] dark:bg-[#F59E0B]/20",
    borderClass: "border-b-[#F59E0B] dark:border-b-[#fbbf24]",
  },
];

export default function ExamPrepPage() {
  const [active, setActive] = useState<ModalKey | null>(null);
  const [mockTests, setMockTests] = useState<UiMockTest[]>([]);

  useEffect(() => {
    let cancelled = false;
    cachedMockTests().then((m) => {
      if (!cancelled) setMockTests(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      className="relative flex flex-col justify-start overflow-hidden pt-2 lg:pt-4"
      style={{ height: "calc(100vh - 80px)" }}
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
            <p className="font-sans text-sm md:text-base lg:text-lg text-[#64748B] dark:text-slate-400 mt-3 max-w-md mx-auto md:mx-0">
              Every option helps you prepare — <br className="hidden sm:block" />
              pick where to start.
            </p>
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

        {/* Four option cards — 1×4 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
          {OPTIONS.map((opt, i) => (
            <button
              key={opt.key}
              onClick={() => setActive(opt.key)}
              className={`group relative flex flex-col text-left rounded-2xl p-5 lg:p-6 bg-white dark:bg-[#151b23] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] border-b-4 ${opt.borderClass}`}
            >
              {/* Top Row: Icon & Number */}
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center ${opt.bgClass}`}>
                  <opt.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${opt.colorClass}`} strokeWidth={1.5} />
                </div>
                <span className={`font-serif text-2xl lg:text-3xl font-medium ${opt.colorClass} opacity-80 group-hover:opacity-100 transition-opacity`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-sans text-lg lg:text-xl font-bold text-[#1E293B] dark:text-slate-100 mb-2 tracking-tight">
                {opt.title}
              </h3>
              <p className="font-sans text-[14px] lg:text-[15px] text-[#64748B] dark:text-slate-400 leading-snug lg:leading-relaxed flex-1">
                {opt.description}
              </p>

              {/* Bottom Row: Arrow */}
              <div className="mt-4 lg:mt-6 flex justify-end">
                <ArrowRight className={`w-5 h-5 lg:w-6 lg:h-6 ${opt.colorClass} transform group-hover:translate-x-1.5 transition-transform duration-300`} strokeWidth={2} />
              </div>
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

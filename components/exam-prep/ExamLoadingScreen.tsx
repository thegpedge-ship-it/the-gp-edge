"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import ClockLoader from "@/components/exam-prep/ClockLoader";

const STAGES = [
  { key: "connecting", label: "Connecting" },
  { key: "fetching", label: "Fetching Questions" },
  { key: "preparing", label: "Preparing Test" },
  { key: "ready", label: "Almost Ready" },
];

// 7 Waveform bars: outer grey, center teal
const BARS = [
  { color: "bg-slate-200 dark:bg-slate-700", minH: 6, maxH: 14, delay: 0.1 },
  { color: "bg-slate-200 dark:bg-slate-700", minH: 10, maxH: 22, delay: 0.2 },
  { color: "bg-slate-300 dark:bg-slate-600", minH: 14, maxH: 28, delay: 0.3 },
  { color: "bg-teal-600 dark:bg-teal-400", minH: 18, maxH: 36, delay: 0.0 }, // center tall
  { color: "bg-slate-300 dark:bg-slate-600", minH: 14, maxH: 28, delay: 0.3 },
  { color: "bg-slate-200 dark:bg-slate-700", minH: 10, maxH: 22, delay: 0.2 },
  { color: "bg-slate-200 dark:bg-slate-700", minH: 6, maxH: 14, delay: 0.1 },
];

interface ExamLoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export function ExamLoadingScreen({
  title = "Preparing your questions",
  subtitle = "Please wait while we load your test.",
}: ExamLoadingScreenProps) {
  const [activeStage, setActiveStage] = useState(0);

  // Natural progress flow while fetching (does not block data arrival)
  useEffect(() => {
    const t1 = setTimeout(() => setActiveStage(1), 450);
    const t2 = setTimeout(() => setActiveStage(2), 1200);
    const t3 = setTimeout(() => setActiveStage(3), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 select-none"
    >
      <div className="w-full max-w-[560px] flex flex-col items-center text-center">
        
        {/* 1. Centered GP Edge Logo */}
        <div className="mb-6">
          <Image
            src="/assets/logo.png"
            alt="GP Edge"
            width={64}
            height={64}
            priority
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* 2. Waveform / Equalizer Animated Bars */}
        <div className="flex items-center justify-center gap-1.5 h-10 mb-6">
          {BARS.map((bar, i) => (
            <motion.div
              key={i}
              className={`w-1 rounded-full ${bar.color}`}
              initial={{ height: bar.minH }}
              animate={{
                height: [bar.minH, bar.maxH, bar.minH],
              }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: bar.delay,
              }}
            />
          ))}
        </div>

        {/* 3. Main Text */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h2>

        {/* 4. Subtle Line - Dot - Line Divider */}
        <div className="flex items-center gap-2.5 my-3">
          <div className="w-8 sm:w-10 h-[1px] bg-slate-200 dark:bg-slate-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <div className="w-8 sm:w-10 h-[1px] bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* 5. Subtitle */}
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-10">
          {subtitle}
        </p>

        {/* 6. 4-Stage Progress Indicator */}
        <div className="w-full max-w-[480px]">
          <div className="relative flex items-center justify-between mb-2">
            {/* Background Line */}
            <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200 dark:bg-slate-800 z-0" />
            
            {/* Active Progress Line */}
            <motion.div
              className="absolute left-3 top-1/2 -translate-y-1/2 h-[2px] bg-teal-500 z-0"
              initial={{ width: "0%" }}
              animate={{
                width: `${(activeStage / (STAGES.length - 1)) * 96}%`,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />

            {/* Stage Markers */}
            {STAGES.map((st, idx) => {
              const isCompleted = idx < activeStage;
              const isCurrent = idx === activeStage;

              return (
                <div key={st.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCurrent
                        ? "border-2 border-teal-600 dark:border-teal-400 bg-white dark:bg-slate-900 ring-4 ring-teal-500/15"
                        : isCompleted
                        ? "border-2 border-teal-600 bg-teal-600 text-white"
                        : "border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {isCurrent && (
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stage Labels */}
          <div className="flex justify-between w-full text-[11px] sm:text-xs">
            {STAGES.map((st, idx) => {
              const isActive = idx <= activeStage;
              return (
                <span
                  key={st.key}
                  className={`font-medium transition-colors duration-200 ${
                    idx === 0
                      ? "text-left"
                      : idx === STAGES.length - 1
                      ? "text-right"
                      : "text-center"
                  } ${
                    isActive
                      ? "text-teal-700 dark:text-teal-400 font-semibold"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                  style={{ width: "25%" }}
                >
                  {st.label}
                </span>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ExamLoadingScreen;

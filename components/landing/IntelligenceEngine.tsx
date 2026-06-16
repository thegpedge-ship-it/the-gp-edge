"use client";

import { motion, AnimatePresence, animate, useMotionValue } from "framer-motion";
import { useState, useEffect } from "react";

// Feature icons for the 2x2 grid
const featureIcons = {
  Tracking: (
    <img
      src="/assets/tracking.png"
      alt="Tracking"
      className="w-8 h-8 object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
    />
  ),
  Analysis: (
    <img
      src="/assets/analysis.png"
      alt="Analysis"
      className="w-8 h-8 object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
    />
  ),
  Curation: (
    <img
      src="/assets/curation.png"
      alt="Curation"
      className="w-8 h-8 object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
    />
  ),
  Forecasting: (
    <img
      src="/assets/forecasting.png"
      alt="Forecasting"
      className="w-8 h-8 object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
    />
  ),
};


function CornerBrackets() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 pointer-events-none"
    >
      {/* Top Left corner */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-500" />
      {/* Top Right corner */}
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-500" />
      {/* Bottom Left corner */}
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-500" />
      {/* Bottom Right corner */}
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-500" />
    </motion.div>
  );
}

interface FloatingDashboardProps {
  setHighlightFeatures: (highlight: boolean) => void;
}

function FloatingDashboard({ setHighlightFeatures }: FloatingDashboardProps) {
  const scanY = useMotionValue(0);
  const [showScanLine, setShowScanLine] = useState(false);
  const [activeRow, setActiveRow] = useState<"cardiology" | "respiratory" | "mental-health" | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runAnimation = async () => {
      if (!isMounted) return;

      // Step 0: Rest state
      setHighlightFeatures(false);
      scanY.set(0);
      setShowScanLine(false);
      setActiveRow(null);
      setIsLocked(false);
      setShowTooltip(false);

      // Wait 0.5s in calm rest state (reduced from 1.0s)
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!isMounted) return;

      // Phase 1: Start Scanning
      setShowScanLine(true);

      // Slide to Cardiology (Y = 28px) over 0.3s (reduced from 0.4s)
      setActiveRow("cardiology");
      await animate(scanY, 28, { duration: 0.3, ease: "linear" });
      if (!isMounted) return;

      // Slide to Respiratory (Y = 84px) over 0.3s (reduced from 0.4s)
      setActiveRow("respiratory");
      await animate(scanY, 84, { duration: 0.3, ease: "linear" });
      if (!isMounted) return;

      // Slide to Mental Health (Y = 140px) over 0.3s (reduced from 0.4s)
      setActiveRow("mental-health");
      await animate(scanY, 140, { duration: 0.3, ease: "linear" });
      if (!isMounted) return;

      // Phase 2: Category Detection & Focus Lock
      setIsLocked(true);

      // Hold scan line at lock position for 0.5s (reduced from 0.8s)
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!isMounted) return;

      // Phase 3: Tooltip Verdict Reveal
      setShowTooltip(true);

      // Hold for 1.0s (reduced from 1.5s)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!isMounted) return;

      // Phase 4: Left-Pane Synchronized Highlight
      setHighlightFeatures(true);

      // Hold for 0.7s (reduced from 1.0s)
      await new Promise((resolve) => setTimeout(resolve, 700));
      if (!isMounted) return;

      // Phase 5: Cooldown & Reset
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!isMounted) return;

      // Fade out sequence (400ms, reduced from 500ms)
      setShowTooltip(false);
      setShowScanLine(false);
      setIsLocked(false);
      setHighlightFeatures(false);
      
      // Let the scan line animate back to 0 so it's ready for next loop
      animate(scanY, 0, { duration: 0.4, ease: "easeOut" });
      
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (!isMounted) return;
      
      setActiveRow(null);

      // Wait 0.3s before restarting loop (reduced from 0.5s)
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (isMounted) {
        runAnimation();
      }
    };

    runAnimation();

    return () => {
      isMounted = false;
    };
  }, [setHighlightFeatures, scanY]);

  return (
    <div
      className="relative rounded-[2rem] bg-[#0B1120] border border-slate-800/50 shadow-2xl overflow-hidden p-6 lg:p-8 select-none"
    >
      {/* Dot grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />

      {/* Teal glow */}
      <div className="absolute -top-20 -right-20 w-[250px] h-[250px] bg-gradient-to-br from-teal-500/20 via-teal-400/10 to-transparent rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10">
        {/* Dashboard header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-semibold">Your Progress</div>
              <div className="text-slate-500 text-xs">Last 7 days</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">87%</div>
            <div className="text-[10px] text-teal-400 font-medium">+12% this week</div>
          </div>
        </div>

        {/* Progress bars with Scan Line and Corner Brackets */}
        <div className="relative space-y-4 mb-5 p-2 rounded-xl bg-slate-950/20 border border-slate-900/20 overflow-hidden">
          {/* Laser scan line */}
          <AnimatePresence>
            {showScanLine && (
              <motion.div
                style={{ y: scanY }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/80 to-transparent shadow-[0_0_15px_rgba(45,212,191,0.6)] z-10 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {[
            { id: "cardiology" as const, label: "Cardiology", progress: 92, color: "bg-teal-400/80" },
            { id: "respiratory" as const, label: "Respiratory", progress: 78, color: "bg-emerald-400/80" },
            { id: "mental-health" as const, label: "Mental Health", progress: 65, color: "bg-amber-400/80" },
          ].map((item) => {
            const isActive = activeRow === item.id;
            const isMH = item.id === "mental-health";
            const showWarning = isMH && isLocked;

            return (
              <div
                key={item.id}
                className={`relative px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive ? "bg-slate-900/40" : ""
                }`}
                style={{
                  opacity: activeRow ? (isActive ? 1 : 0.4) : 0.8,
                }}
              >
                {/* Bounding Corner Brackets for Mental Health gap */}
                <AnimatePresence>
                  {showWarning && <CornerBrackets />}
                </AnimatePresence>

                <div className="flex justify-between text-xs mb-1.5">
                  <span
                    className={`transition-colors duration-300 ${
                      showWarning ? "text-amber-400 font-bold animate-pulse" : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`font-medium transition-colors duration-300 ${
                      showWarning ? "text-amber-400 font-bold animate-pulse" : "text-slate-300"
                    }`}
                  >
                    {item.progress}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.progress}%` }}
                    className={`h-full transition-colors duration-300 ${
                      showWarning ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : item.color
                    } rounded-full`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Activity Chart */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">Weekly Activity</span>
            <span className="text-[10px] text-teal-400 font-medium">View details →</span>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-12">
            {[
              { day: "W", height: 45, isToday: false },
              { day: "T", height: 75, isToday: false },
              { day: "F", height: 60, isToday: false },
              { day: "S", height: 35, isToday: false },
              { day: "S", height: 80, isToday: true },
            ].map((item, i) => (
              <div key={`activity-${i}`} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: "32px" }}>
                  <div
                    className="w-full rounded-sm transition-all duration-500"
                    style={{
                      height: `${item.height}%`,
                      minHeight: "3px",
                      backgroundColor: item.isToday ? "rgb(20, 184, 166)" : "rgba(71, 85, 105, 0.6)",
                      boxShadow: item.isToday ? "0 0 10px rgba(20,184,166,0.5)" : "none"
                    }}
                  />
                </div>
                <span className={`text-[9px] ${item.isToday ? "text-teal-400 font-medium" : "text-slate-500"}`}>
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Tooltip Verdict Card */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
            className="absolute left-4 right-4 md:left-6 md:right-6 bottom-[75px] z-30 bg-slate-950/95 border border-amber-500/40 rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md pointer-events-auto"
          >
            <div className="flex items-center gap-2 mb-2 border-b border-slate-800/60 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-teal-400 tracking-wider uppercase">ENGINE DIAGNOSTICS</span>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-slate-200">
                <span className="text-slate-400 font-medium">Gap Detected:</span>{" "}
                <span className="text-amber-400 font-semibold">Mental Health / Psychiatry</span>
              </div>
              <div className="text-[11px] text-slate-300">
                <span className="text-slate-400 font-medium">Action:</span> Prioritizing high-yield cases...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function IntelligenceEngine() {
  const [highlightFeatures, setHighlightFeatures] = useState(false);

  return (
    <section className="py-24 lg:py-32 bg-slate-50 dark:bg-transparent relative overflow-hidden transition-colors duration-300">
      {/* Light: subtle teal radial gradient — hidden in dark */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-teal-100/40 via-teal-50/20 to-transparent rounded-full blur-[120px] pointer-events-none dark:hidden" />

      {/* Light: Dot grid pattern — hidden in dark */}
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(circle_at_1px_1px,rgb(226,232,240)_1px,transparent_0)] bg-[size:24px_24px] opacity-60 pointer-events-none" />

      {/* Dark: very subtle radial accent near top (matches hero feel) */}
      <div
        className="absolute inset-0 hidden dark:block pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(90,200,176,0.05) 0%, transparent 70%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-[rgba(90,200,176,0.08)] border border-teal-200/60 dark:border-[rgba(90,200,176,0.18)] text-teal-700 dark:text-[#5AC8B0] text-xs font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Adaptive Intelligence
            </span>
            
            <h2 className="font-sans text-xl md:text-2xl lg:text-3xl font-semibold leading-snug text-slate-900 dark:text-[#F5F7FA] mb-5">
              Gets smarter the more you use it
            </h2>
            
            <p className="font-sans text-base md:text-lg font-normal leading-relaxed text-slate-600 dark:text-[#A8B1BD] mb-10">
              The GP Edge learns your <span className="text-teal-600 dark:text-[#5AC8B0] font-medium">cognitive style</span>, tracks <span className="text-teal-600 dark:text-[#5AC8B0] font-medium">knowledge gaps</span>, and adapts every session. The closer you get to exam day, the sharper your prep becomes.
            </p>

            {/* Feature pills - 2x2 grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Tracking", description: "Time per topic" },
                { label: "Analysis", description: "Weak areas" },
                { label: "Curation", description: "Daily content" },
                { label: "Forecasting", description: "Exam readiness" },
              ].map((feature, i) => {
                const isHighlighted = highlightFeatures && (feature.label === "Analysis" || feature.label === "Curation");
                return (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className={`px-4 py-3.5 rounded-xl bg-white dark:bg-[#1B212C] border cursor-pointer active:scale-[0.98] transition-all duration-300 ${
                      isHighlighted
                        ? "border-teal-400 dark:border-[rgba(90,200,176,0.5)] shadow-[0_0_15px_rgba(20,184,166,0.35)] dark:shadow-[0_0_20px_rgba(90,200,176,0.15)] scale-[1.02]"
                        : "border-slate-200 dark:border-[rgba(255,255,255,0.08)] shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-[rgba(90,200,176,0.3)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-teal-50 dark:bg-[rgba(90,200,176,0.08)] flex items-center justify-center flex-shrink-0">
                        {featureIcons[feature.label as keyof typeof featureIcons]}
                      </div>
                      <div>
                        <div className="text-slate-900 dark:text-[#F5F7FA] text-sm font-semibold">{feature.label}</div>
                        <div className="text-slate-500 dark:text-[#7D8795] text-xs">{feature.description}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right - Floating Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <FloatingDashboard setHighlightFeatures={setHighlightFeatures} />
            
          </motion.div>
        </div>
      </div>
    </section>
  );
}

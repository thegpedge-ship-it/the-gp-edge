"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimate } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const SEARCH_CYCLES = [
  {
    phrase: "Hypertension",
    conditions: [
      { title: "Essential Hypertension", subtitle: "Updated 14 Jan 24", category: "CARDIOLOGY", tag: "Condition", active: true },
      { title: "Hypertensive Crisis", subtitle: "Updated 8 Mar 24", category: "EMERGENCY", tag: "Condition", active: false },
    ],
    approaches: [
      { title: "Secondary Headaches & Painful Cranial Neuropathies", subtitle: "Updated 22 Feb 24", category: "APPROACH · NEUROLOGY", fee: "2021 01 01", active: true },
      { title: "Toxicology", subtitle: "Updated 3 Apr 24", category: "APPROACH · EMERGENCY", fee: null, active: false },
    ],
  },
  {
    phrase: "Headache",
    conditions: [
      { title: "Migraine Without Aura", subtitle: "Updated 5 Feb 24", category: "NEUROLOGY", tag: "Condition", active: true },
      { title: "Cluster Headache", subtitle: "Updated 11 Jan 24", category: "NEUROLOGY", tag: "Condition", active: false },
    ],
    approaches: [
      { title: "Secondary Headaches & Painful Cranial Neuropathies", subtitle: "Updated 22 Feb 24", category: "APPROACH · NEUROLOGY", fee: "2021 01 01", active: true },
      { title: "Headache — Primary", subtitle: "Updated 18 Mar 24", category: "APPROACH · NEUROLOGY", fee: null, active: false },
    ],
  },
];

export default function MedicalDirectorySimulation() {
  const [scope, animate] = useAnimate();
  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let currentCycle = 0;

    const safeAnimate = async (selector: string, keyframes: any, options: any) => {
      if (!isMounted || !scope.current) return;
      const el = scope.current.querySelector(selector);
      if (!el) return;
      return animate(selector, keyframes, options);
    };

    const runAnimation = async () => {
      if (!isMounted || !scope.current) return;

      // Reset
      setSearchText("");
      setIsFocused(false);
      setShowResults(false);
      setCycleIdx(currentCycle);

      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;

      // Cursor glides to search
      await safeAnimate(
        "#dir-cursor",
        { x: ["-60px", "0px"], y: ["30px", "0px"], opacity: [0, 1] },
        { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      await safeAnimate("#dir-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      setIsFocused(true);

      // Type
      const phrase = SEARCH_CYCLES[currentCycle].phrase;
      for (let i = 0; i <= phrase.length; i++) {
        if (!isMounted) return;
        setSearchText(phrase.slice(0, i));
        await new Promise((r) => setTimeout(r, 80));
      }

      await new Promise((r) => setTimeout(r, 400));
      if (!isMounted) return;
      setShowResults(true);

      // Cursor moves to a result card
      await new Promise((r) => setTimeout(r, 600));
      await safeAnimate(
        "#dir-cursor",
        { x: ["0px", "15px"], y: ["0px", "160px"] },
        { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      await safeAnimate("#dir-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      await new Promise((r) => setTimeout(r, 2000));
      if (!isMounted) return;

      // Fade, clear
      safeAnimate(
        "#dir-cursor",
        { opacity: [1, 0], y: ["160px", "190px"] },
        { duration: 0.4, ease: "easeInOut" }
      );
      setShowResults(false);
      await new Promise((r) => setTimeout(r, 400));
      setSearchText("");
      setIsFocused(false);

      await new Promise((r) => setTimeout(r, 800));
      if (!isMounted) return;

      currentCycle = (currentCycle + 1) % SEARCH_CYCLES.length;
      runAnimation();
    };

    const timeout = setTimeout(runAnimation, 1500);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [animate]);

  const cycle = SEARCH_CYCLES[cycleIdx];

  return (
    <motion.div
      ref={scope}
      variants={cardVariants}
      className="col-span-12 lg:col-span-7 relative bg-white dark:bg-[#1B212C] rounded-3xl overflow-hidden cursor-pointer border border-slate-200 dark:border-[rgba(255,255,255,0.07)] shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:border-slate-300 dark:hover:border-[rgba(90,200,176,0.25)] active:scale-[0.99] transition-all duration-300 h-[500px]"
    >
      <div className="flex flex-col h-full p-5">
        {/* Header */}
        <div className="mb-4">
          <p className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">✦ Medical Library</p>
          <h3 className="font-sans text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-1">
            Explore the Medical Directory
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Browse official guidelines, diagnostic criteria, treatment options, and clinical summaries. 21 conditions across major body systems.
          </p>
        </div>

        {/* Two search inputs */}
        <div className="grid grid-cols-2 gap-2 mb-3 relative">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all duration-200 ${
            isFocused
              ? "border-teal-400 ring-2 ring-teal-100 dark:ring-teal-900/40 bg-white dark:bg-slate-800"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          }`}>
            <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-slate-700 dark:text-slate-300 flex-1 text-[11px]">
              {searchText || <span className="text-slate-400 dark:text-slate-500">Q Hypertension</span>}
              {isFocused && searchText.length < cycle.phrase.length && (
                <span className="inline-block w-0.5 h-3 bg-teal-500 ml-0.5 animate-pulse align-middle" />
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Enter to search topics, guidelines, concepts...</span>
          </div>

          {/* Cursor */}
          <motion.div
            id="dir-cursor"
            initial={{ opacity: 0, x: "-60px", y: "30px" }}
            className="absolute top-1/2 left-1/4 -translate-y-1/2 pointer-events-none z-30"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
                fill="#1e293b"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </svg>
          </motion.div>
        </div>

        {/* Two column results */}
        <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
          {/* Medical Conditions */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Medical Conditions</p>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  {showResults ? cycle.conditions.length : 0}
                </span>
              </div>
              <button className="text-[8px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.414V19l-4-2v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                Filter by System
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-hidden">
              <AnimatePresence>
                {showResults
                  ? cycle.conditions.map((cond, i) => (
                      <motion.div
                        key={cond.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3, delay: i * 0.08 }}
                        className={`p-3 rounded-xl border transition-all duration-200 ${
                          cond.active
                            ? "border-teal-400 bg-teal-50/60 dark:bg-teal-900/15 shadow-[0_0_0_1px_rgba(20,184,166,0.2)]"
                            : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">{cond.tag}</span>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500">{cond.category}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-snug mb-1">{cond.title}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">{cond.subtitle}</p>
                        {cond.active && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                            <span className="text-[8px] text-teal-500 dark:text-teal-400 font-medium">Toxicology</span>
                          </div>
                        )}
                      </motion.div>
                    ))
                  : (
                    <div className="flex items-center justify-center h-24">
                      <p className="text-[10px] text-slate-300 dark:text-slate-600">No conditions match your filters</p>
                    </div>
                  )}
              </AnimatePresence>
            </div>
          </div>

          {/* Clinical Approaches */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Clinical Approaches</p>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  {showResults ? cycle.approaches.length : 0}
                </span>
              </div>
              <button className="text-[8px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.414V19l-4-2v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                Filter by Exam
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-hidden">
              <AnimatePresence>
                {showResults
                  ? cycle.approaches.map((app, i) => (
                      <motion.div
                        key={app.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3, delay: i * 0.08 + 0.05 }}
                        className={`p-3 rounded-xl border transition-all duration-200 ${
                          app.active
                            ? "border-teal-400 bg-teal-50/60 dark:bg-teal-900/15 shadow-[0_0_0_1px_rgba(20,184,166,0.2)]"
                            : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                        }`}
                      >
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{app.category}</span>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-snug mt-0.5 mb-1">{app.title}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">{app.subtitle}</p>
                        {app.fee && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                            <span className="text-[8px] text-teal-500 dark:text-teal-400 font-mono">{app.fee}</span>
                          </div>
                        )}
                      </motion.div>
                    ))
                  : (
                    <div className="flex items-center justify-center h-24">
                      <p className="text-[10px] text-slate-300 dark:text-slate-600">No approaches match your filters</p>
                    </div>
                  )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

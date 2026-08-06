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
    phrase: "Heart Failure",
    results: [
      { item: "66252", title: "Echocardiography for Heart Failure", desc: "Preparation of a patient for, and continuous ECG recording of, a stress test (such as during exercise or pharmacological stimulation) for the investigation of heart failure.", rebate: "$178.60", reimbursed: "75% Rebate", active: true },
      { item: "11700", title: "ECG Recording", desc: "Twelve-lead electrocardiography, tracing and report.", rebate: null, active: false },
      { item: "23", title: "GP Consultation < 20 Minutes", desc: "Professional attendance by a general practitioner at consulting rooms for an obvious problem.", rebate: null, active: false },
      { item: "24", title: "GP Consultation Out Of Rooms", desc: "Professional attendance by a general practitioner (other than attendance at consulting rooms) lasting less than 20 minutes.", rebate: null, active: false },
    ],
  },
  {
    phrase: "Mental Health Plan",
    results: [
      { item: "2715", title: "GP Mental Health Treatment Plan", desc: "Preparation, review or change of a GP Mental Health Treatment Plan for a patient.", rebate: "$100.20", reimbursed: "75% Rebate", active: true },
      { item: "2717", title: "GP Mental Health Consultation", desc: "Attendance by a general practitioner following referral from a mental health professional.", rebate: null, active: false },
      { item: "80110", title: "Focussed Psychological Strategies", desc: "Professional attendance by a general practitioner providing focussed psychological strategies.", rebate: null, active: false },
      { item: "2713", title: "Psychiatric Assessment", desc: "Preparation by a general practitioner of a comprehensive mental health assessment.", rebate: null, active: false },
    ],
  },
];

export default function MbsBillingSimulation() {
  const [scope, animate] = useAnimate();
  const [searchText, setSearchText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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
      setShowResults(false);
      setIsFocused(false);
      setCycleIdx(currentCycle);

      await new Promise((r) => setTimeout(r, 500));
      if (!isMounted) return;

      // Cursor glides to search bar
      await safeAnimate(
        "#mbs-cursor",
        { x: ["-80px", "0px"], y: ["60px", "0px"], opacity: [0, 1] },
        { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      await safeAnimate("#mbs-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      setIsFocused(true);
      if (!isMounted) return;

      // Type phrase
      const phrase = SEARCH_CYCLES[currentCycle].phrase;
      for (let i = 0; i <= phrase.length; i++) {
        if (!isMounted) return;
        setSearchText(phrase.slice(0, i));
        await new Promise((r) => setTimeout(r, 75));
      }

      await new Promise((r) => setTimeout(r, 400));
      if (!isMounted) return;
      setShowResults(true);

      // Cursor moves to first card
      await new Promise((r) => setTimeout(r, 600));
      await safeAnimate(
        "#mbs-cursor",
        { x: ["0px", "20px"], y: ["0px", "130px"] },
        { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      await safeAnimate("#mbs-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      await new Promise((r) => setTimeout(r, 2000));
      if (!isMounted) return;

      // Fade out cursor, clear
      safeAnimate(
        "#mbs-cursor",
        { opacity: [1, 0], y: ["130px", "160px"] },
        { duration: 0.4, ease: "easeInOut" }
      );
      setShowResults(false);
      await new Promise((r) => setTimeout(r, 400));
      setSearchText("");
      setIsFocused(false);

      await new Promise((r) => setTimeout(r, 800));
      if (!isMounted) return;

      // Next cycle
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
      className="col-span-12 sm:col-span-6 lg:col-span-5 relative bg-white dark:bg-[#1B212C] rounded-3xl overflow-hidden cursor-pointer border border-slate-200 dark:border-[rgba(255,255,255,0.07)] shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:border-slate-300 dark:hover:border-[rgba(90,200,176,0.25)] active:scale-[0.99] transition-all duration-300 h-[500px]"
    >
      <div className="flex flex-col h-full p-5">
        {/* Header */}
        <h3 className="font-sans text-base font-bold text-slate-900 dark:text-slate-100 mb-3">MBS Billing</h3>

        {/* Search bar */}
        <div className="relative mb-2">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
              isFocused
                ? "border-teal-400 ring-2 ring-teal-100 dark:ring-teal-900/40 bg-white dark:bg-slate-800"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            }`}
          >
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 font-medium">
              {searchText || <span className="text-slate-400 dark:text-slate-500 font-normal">Search MBS items...</span>}
              {isFocused && searchText.length < cycle.phrase.length && (
                <span className="inline-block w-0.5 h-3 bg-teal-500 ml-0.5 animate-pulse align-middle" />
              )}
            </span>
            {searchText && (
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Cursor */}
          <motion.div
            id="mbs-cursor"
            initial={{ opacity: 0, x: "-80px", y: "60px" }}
            className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none z-30"
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

        {/* Results count */}
        <AnimatePresence>
          {showResults && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"
            >
              {cycle.results.length} MATCHES — PAGE 1 OF 1
            </motion.p>
          )}
        </AnimatePresence>

        {/* Results grid */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {showResults ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-2 gap-2 h-full"
              >
                {cycle.results.map((r, i) => (
                  <motion.div
                    key={r.item}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col ${
                      r.active
                        ? "border-teal-400 bg-teal-50/60 dark:bg-teal-900/15 shadow-[0_0_0_1px_rgba(20,184,166,0.3)]"
                        : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                    }`}
                  >
                    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">ITEM {r.item}</p>
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-snug mb-1 line-clamp-2">{r.title}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 flex-1">{r.desc}</p>
                    {r.rebate && (
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-teal-100 dark:border-teal-800/40">
                        <span className="text-[8px] font-medium text-slate-500 dark:text-slate-400">{r.reimbursed}</span>
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">{r.rebate}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full"
              >
                <p className="text-[11px] text-slate-300 dark:text-slate-600">Type to search MBS items...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

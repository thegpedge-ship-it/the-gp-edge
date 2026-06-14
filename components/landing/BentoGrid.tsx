"use client";

import { motion, AnimatePresence, useAnimate } from "framer-motion";
import { useState, useEffect } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Looping Carousel Data ───────────────────────────────────────────────────
const carouselCycles = [
  [
    { name: "Type 2 Diabetes", category: "Endocrine" },
    { name: "Hypertension", category: "Cardiovascular" },
    { name: "Asthma", category: "Respiratory" },
  ],
  [
    { name: "Hypothyroidism", category: "Endocrine" },
    { name: "Atrial Fibrillation", category: "Cardiovascular" },
    { name: "Sleep Apnea", category: "Respiratory" },
  ],
  [
    { name: "Osteoporosis", category: "Musculoskeletal" },
    { name: "Bipolar Disorder", category: "Mental Health" },
    { name: "Rosacea", category: "Dermatology" },
  ],
];

function ConditionCarousel() {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCycleIndex((prev) => (prev + 1) % carouselCycles.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: { duration: 0.35, ease: [0.55, 0, 1, 0.45] },
    }),
  };

  const currentCycle = carouselCycles[cycleIndex];

  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 max-w-sm overflow-hidden">
      {/* Search bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-8 bg-white rounded-lg flex items-center px-3 border border-slate-200/80">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="ml-2 text-xs text-slate-400">Search conditions...</span>
        </div>
        {/* Cycle indicator dots */}
        <div className="flex gap-1 pr-1">
          {carouselCycles.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > cycleIndex ? 1 : -1); setCycleIndex(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === cycleIndex ? "bg-teal-500 w-3" : "bg-slate-300"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Animated condition rows — fixed height, both panels absolutely positioned */}
      <div className="relative overflow-hidden" style={{ height: "128px" }}>
        <AnimatePresence custom={direction} mode="sync">
          <motion.div
            key={cycleIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 flex flex-col gap-1.5"
          >
            {currentCycle.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-white border border-slate-100 flex-1"
              >
                <span className="text-xs font-medium text-slate-700">{item.name}</span>
                <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100/80">
                  {item.category}
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── MBS Billing Card with Interactive Search & Translate Simulation ─────────
function MBSBillingCardInline() {
  const [scope, animate] = useAnimate();
  const [searchText, setSearchText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const searchPhrase = "Mental Health Plan";

    const safeAnimate = async (selector: string, keyframes: any, options: any) => {
      if (!isMounted || !scope.current) return;
      const el = scope.current.querySelector(selector);
      if (!el) return;
      return animate(selector, keyframes, options);
    };

    const runAnimation = async () => {
      if (!isMounted || !scope.current) return;

      // Reset states - show default items first
      setSearchText("");
      setShowResult(false);
      setIsFocused(false);
      setIsButtonHovered(false);
      setIsRedirecting(false);

      // 0.0s - 0.5s: Initial state - default items visible, search bar empty
      // Brief pause to let user see the initial state
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!isMounted) return;

      // 0.5s - 1.5s: Cursor glides to search bar
      await safeAnimate(
        "#mbs-cursor",
        { x: ["-80px", "0px"], y: ["60px", "0px"], opacity: [0, 1] },
        { duration: 1.0, ease: [0.22, 1, 0.36, 1] }
      );

      if (!isMounted) return;

      // Click effect on search bar
      await safeAnimate(
        "#mbs-cursor",
        { scale: [1, 0.85, 1] },
        { duration: 0.15, ease: "easeInOut" }
      );

      setIsFocused(true);

      if (!isMounted) return;

      // 1.0s - 2.5s: Typing effect
      for (let i = 0; i <= searchPhrase.length; i++) {
        if (!isMounted) return;
        setSearchText(searchPhrase.slice(0, i));
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      if (!isMounted) return;

      // 2.5s - 3.5s: Result card slides up
      await new Promise((resolve) => setTimeout(resolve, 300));
      setShowResult(true);

      if (!isMounted) return;

      // 3.5s - 5.0s: Cursor glides to verify button
      await new Promise((resolve) => setTimeout(resolve, 800));

      await safeAnimate(
        "#mbs-cursor",
        { x: ["0px", "20px"], y: ["0px", "180px"] },
        { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
      );

      if (!isMounted) return;

      setIsButtonHovered(true);

      // Click the button
      await new Promise((resolve) => setTimeout(resolve, 300));
      await safeAnimate(
        "#mbs-cursor",
        { scale: [1, 0.85, 1] },
        { duration: 0.15, ease: "easeInOut" }
      );

      if (!isMounted) return;

      // Instantly show "Redirecting..."
      setIsRedirecting(true);

      // Pause briefly on this state (e.g. 1.2s)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (!isMounted) return;

      // Completely clear out suggestion results/canvas block to a blank state
      setShowResult(false);
      setSearchText("");
      setIsRedirecting(false);
      setIsButtonHovered(false);

      // Reset: Fade out cursor
      await safeAnimate(
        "#mbs-cursor",
        { opacity: [1, 0], y: ["180px", "200px"] },
        { duration: 0.4, ease: "easeInOut" }
      );

      if (!isMounted) return;

      setIsFocused(false);

      // Small delay before loop repeats
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isMounted) runAnimation();
    };

    const timeout = setTimeout(runAnimation, 1500);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [animate]);

  return (
    <motion.div
      ref={scope}
      variants={cardVariants}
      className="col-span-12 sm:col-span-6 lg:col-span-5 relative bg-gradient-to-br from-teal-50 to-emerald-50/80 dark:from-[#1B212C] dark:to-[#1E2835] rounded-3xl p-5 lg:p-6 overflow-hidden cursor-pointer border border-teal-200/50 dark:border-[rgba(90,200,176,0.15)] shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:border-teal-300/60 dark:hover:border-[rgba(90,200,176,0.30)] active:scale-[0.99] transition-all duration-300"
    >
      {/* Decorative circles */}
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-teal-200/30 rounded-full blur-2xl dark:opacity-0 transition-opacity" />
      <div className="absolute top-4 right-4 w-24 h-24 border border-teal-200/40 rounded-full dark:opacity-0 transition-opacity" />
      <div className="absolute top-10 right-10 w-14 h-14 border border-teal-200/30 rounded-full dark:opacity-0 transition-opacity" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          
          <span className="text-xs text-teal-600 font-medium">Full access</span>
        </div>

        <h3 className="font-sans text-xl md:text-2xl lg:text-3xl font-semibold leading-snug text-slate-900 mb-2">
          Master MBS Billing
        </h3>

        <p className="font-sans text-base md:text-lg font-normal leading-relaxed text-slate-600 mb-5">
          Interactive <span className="font-medium text-teal-600">item number explorer</span> with real-world GP scenarios.
        </p>

        {/* Interactive Search UI */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200/80 relative min-h-[280px]">
          {/* Search bar with cursor */}
          <div className="relative mb-3">
            <div
              className={`flex-1 h-9 rounded-lg flex items-center px-3 transition-all duration-200 ${
                isFocused
                  ? "bg-white border-2 border-teal-400 ring-4 ring-teal-100"
                  : "bg-slate-100 border border-transparent"
              }`}
            >
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="ml-2 text-sm text-slate-700 flex-1">
                {searchText || <span className="text-slate-400">Search items...</span>}
                {isFocused && searchText.length < 17 && (
                  <span className="inline-block w-0.5 h-4 bg-teal-500 ml-0.5 animate-pulse" />
                )}
              </span>
            </div>

            {/* Mac-style cursor */}
            <motion.div
              id="mbs-cursor"
              initial={{ opacity: 0, x: "-80px", y: "60px" }}
              className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none z-30"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
                  fill="#1e293b"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              </svg>
            </motion.div>
          </div>

          {/* Result card area - fixed height to prevent card size changes */}
          <div className="relative overflow-hidden" style={{ height: "270px" }}>
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm p-4"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-500 text-white text-xs font-bold">
                      Item 2715
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">$100.20 Rebate</span>
                  </div>

                  {/* Title */}
                  <h4 className="text-[15px] font-bold text-slate-800 mb-1.5">
                    GP Mental Health Treatment Plan
                  </h4>

                  {/* Timeframe tag */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-xs text-slate-500">20 - 39 mins</span>
                  </div>

                  {/* Simplified Criteria */}
                  <div className="bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-100">
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>Requires formal assessment & diagnosis.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>Must document a prepared care plan.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Verify button */}
                  <button
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      isButtonHovered
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : "bg-transparent text-teal-600 border border-slate-200 hover:bg-teal-50"
                    }`}
                  >
                    {isRedirecting ? "Redirecting..." : "Verify on MBS Official"}
                    {!isRedirecting && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Placeholder items when no result - Professional GP billing items */}
            {!showResult && searchText.length > 0 && (
              <div className="space-y-1.5">
                {[
                  { code: "721", label: "GP Management Plan (GPMP)", fee: "$165.90", active: true },
                  { code: "31356", label: "Malignant Skin Excision", fee: "$134.20", active: false },
                  { code: "16500", label: "Routine Antenatal Attendance", fee: "$53.15", active: false },
                ].map((item) => (
                  <div
                    key={item.code}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      item.active
                        ? "bg-teal-50 border border-teal-200"
                        : "bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.active ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-600"}`}>{item.code}</span>
                      <span className="text-xs text-slate-600 truncate">{item.label}</span>
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${item.active ? "text-emerald-600" : "text-slate-400"}`}>{item.fee}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Clinical Autofills Card with Interactive Copy Animation ─────────────────
function ClinicalAutofillsCardInline() {
  const [scope, animate] = useAnimate();
  const [isCopied, setIsCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const safeAnimate = async (selector: string, keyframes: any, options: any) => {
      if (!isMounted || !scope.current) return;
      const el = scope.current.querySelector(selector);
      if (!el) return;
      return animate(selector, keyframes, options);
    };
    
    const runAnimation = async () => {
      if (!isMounted || !scope.current) return;
      
      // Reset states
      setIsCopied(false);
      setShowToast(false);

      // 0.0s - 1.0s: Cursor glides in from off-screen to hover over button
      await safeAnimate(
        "#autofill-cursor",
        { x: ["-60px", "0px"], y: ["40px", "0px"], opacity: [0, 1] },
        { duration: 1.0, ease: [0.22, 1, 0.36, 1] }
      );

      if (!isMounted) return;

      // 1.0s - 1.2s: Click effect - cursor scales down
      await safeAnimate(
        "#autofill-cursor",
        { scale: [1, 0.85, 1] },
        { duration: 0.2, ease: "easeInOut" }
      );

      if (!isMounted) return;

      // Trigger copied state and toast
      setIsCopied(true);
      setShowToast(true);

      // 1.3s - 3.0s: Hold success state
      await new Promise((resolve) => setTimeout(resolve, 1700));

      if (!isMounted) return;

      // 3.0s - 3.5s: Cursor glides away, toast fades out
      safeAnimate(
        "#autofill-cursor",
        { x: ["0px", "80px"], y: ["0px", "-30px"], opacity: [1, 0] },
        { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
      );

      setShowToast(false);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!isMounted) return;

      // Reset button
      setIsCopied(false);

      // 2 second delay before loop repeats
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (isMounted) runAnimation();
    };

    const timeout = setTimeout(runAnimation, 1500);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [animate]);

  return (
    <motion.div
      ref={scope}
      variants={cardVariants}
      className="col-span-12 sm:col-span-6 lg:col-span-5 relative bg-white dark:bg-[#1B212C] rounded-3xl p-5 lg:p-6 overflow-hidden cursor-pointer border border-slate-200 dark:border-[rgba(255,255,255,0.07)] shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:border-slate-300 dark:hover:border-[rgba(90,200,176,0.25)] active:scale-[0.99] transition-all duration-300"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          
        </div>

        <h3 className="font-sans text-xl md:text-2xl lg:text-3xl font-semibold leading-snug text-slate-900 mb-2">
          Clinical Autofills
        </h3>

        <p className="font-sans text-base md:text-lg font-normal leading-relaxed text-slate-600 mb-5">
          <span className="font-medium text-teal-600">Copy-paste templates</span> for common GP presentations. Consult better, miss less.
        </p>

        {/* Mock editor box */}
        <div className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
          {/* Editor header */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <img
                  src="/assets/clinical_autofill_icon.png"
                  alt="URTI Template"
                  className="w-7 h-7 object-contain mix-blend-multiply"
                />
              </div>
              <span className="text-sm font-semibold text-slate-700">URTI Template</span>
            </div>

            {/* Copy button with cursor */}
            <div className="relative">
              <motion.button
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isCopied
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-teal-500 text-white shadow-md shadow-teal-500/25 hover:bg-teal-600"
                }`}
              >
                {isCopied ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  "Copy"
                )}
              </motion.button>

              {/* Mac-style cursor */}
              <motion.div
                id="autofill-cursor"
                initial={{ opacity: 0, x: "-60px", y: "40px" }}
                className="absolute -bottom-2 -right-2 pointer-events-none z-20"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
                    fill="#1e293b"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                </svg>
              </motion.div>
            </div>
          </div>

          {/* Editor content - faded template lines */}
          <div className="space-y-2.5 font-mono">
            <div className="flex items-start gap-3">
              <span className="text-[11px] text-slate-400 w-4 pt-0.5 select-none">1</span>
              <div className="flex-1">
                <span className="text-xs font-semibold text-teal-600">Hx:</span>
                <span className="text-xs text-slate-400 ml-1.5">Sore throat x 3 days, no fever...</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[11px] text-slate-400 w-4 pt-0.5 select-none">2</span>
              <div className="flex-1">
                <span className="text-xs font-semibold text-teal-600">O/E:</span>
                <span className="text-xs text-slate-400 ml-1.5">Pharynx erythematous...</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[11px] text-slate-400 w-4 pt-0.5 select-none">3</span>
              <div className="flex-1">
                <span className="text-xs font-semibold text-teal-600">Plan:</span>
                <span className="text-xs text-slate-400 ml-1.5">Supportive care...</span>
              </div>
            </div>
          </div>

          {/* Template count */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">2,600+ templates</span>
            <span className="text-[11px] font-medium text-teal-600 hover:text-teal-700 cursor-pointer">
              Browse all →
            </span>
          </div>

          {/* Toast notification */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: showToast ? 1 : 0,
              y: showToast ? 0 : 20,
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Template copied to clipboard
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Staggered Condition Tags (5 rows × 2 tags) ──────────────────────────────
// Organised into intentional rows so the layout always looks deliberate.
const tagRows = [
  [
    { name: "Diabetes", delay: 0.00 },
    { name: "HTN", delay: 0.05 },
  ],
  [
    { name: "Asthma", delay: 0.10 },
    { name: "GORD", delay: 0.15 },
  ],
  [
    { name: "Depression", delay: 0.20 },
    { name: "Melanoma", delay: 0.25 },
  ],
  [
    { name: "Heart Failure", delay: 0.30 },
    { name: "COPD", delay: 0.35 },
  ],
  [
    { name: "UTI", delay: 0.40 },
    { name: "Migraine", delay: 0.45 },
  ],
  [
    { name: "Hypothyroidism", delay: 0.50 },
  ],
];

// ─── Adaptive Exam Prep Card with Simulation Loop ─────────────────────────────
function AdaptiveExamPrepCardInline() {
  const [scope, animate] = useAnimate();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [cardiologyProgress, setCardiologyProgress] = useState(92);
  const [respiratoryProgress, setRespiratoryProgress] = useState(78);
  const [mentalHealthProgress, setMentalHealthProgress] = useState(65);
  const [overallProgress, setOverallProgress] = useState(87);
  const [showModal, setShowModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showRewardBubble, setShowRewardBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const [bubbleType, setBubbleType] = useState<"up" | "down">("up");
  const [activeBubbleCategory, setActiveBubbleCategory] = useState<string | null>(null);
  const [todayActivityHeight, setTodayActivityHeight] = useState(10);

  const questions = [
    {
      category: "Cardiology",
      title: "AKT Exam Simulation",
      subtitle: "Q1",
      question: "A 54-year-old male presents with sudden chest pain. ECG shows ST elevation in leads II, III, and aVF. Which artery is most likely occluded?",
      options: [
        { id: "A", text: "Left anterior descending (LAD)" },
        { id: "B", text: "Right coronary artery (RCA)" },
        { id: "C", text: "Left circumflex (LCx)" }
      ],
      correctId: "B",
      isCorrect: true
    },
    {
      category: "Respiratory",
      title: "KFP Practice Case",
      subtitle: "Q2",
      question: "A 22-year-old female presents with acute asthma exacerbation. Her peak flow is 50% of predicted. What is the first-line medication?",
      options: [
        { id: "A", text: "Salbutamol (SABA) via spacer" },
        { id: "B", text: "Oral prednisolone" },
        { id: "C", text: "Inhaled fluticasone" }
      ],
      correctId: "A",
      isCorrect: false
    },
    {
      category: "Mental Health",
      title: "Clinical Scenario",
      subtitle: "Q3",
      question: "A 35-year-old woman describes 3 weeks of depressed mood, insomnia, and anhedonia. Which screening tool is most appropriate?",
      options: [
        { id: "A", text: "GAD-7" },
        { id: "B", text: "AUDIT" },
        { id: "C", text: "PHQ-9" }
      ],
      correctId: "C",
      isCorrect: true
    }
  ];

  useEffect(() => {
    let isMounted = true;

    const safeAnimate = async (selector: string, keyframes: any, options: any) => {
      if (!isMounted || !scope.current) return;
      const el = scope.current.querySelector(selector);
      if (!el) return;
      return animate(selector, keyframes, options);
    };

    const runAnimation = async () => {
      if (!isMounted || !scope.current) return;

      // --- RESET EVERYTHING (Phase 1) ---
      setCardiologyProgress(92);
      setRespiratoryProgress(78);
      setMentalHealthProgress(65);
      setOverallProgress(87);
      setSelectedOption(null);
      setShowModal(false);
      setShowRewardBubble(false);
      setQuestionIndex(0);
      setTodayActivityHeight(10);

      // Reset cursor position instantly
      safeAnimate(
        "#prep-cursor",
        { x: "120px", y: "250px", opacity: 0, scale: 1 },
        { duration: 0 }
      );

      // Wait 1.0s (Phase 1)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!isMounted) return;

      // ==========================================
      // QUESTION 1 (Cardiology)
      // ==========================================
      setQuestionIndex(0);
      setShowModal(true);

      // Wait 1.5s for modal to slide up and settle
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!isMounted) return;

      // Cursor glides to Option B
      await safeAnimate(
        "#prep-cursor",
        { x: ["120px", "30px"], y: ["250px", "155px"], opacity: [0, 1] },
        { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      // Cursor squash click at 2.8s for 150ms
      await safeAnimate(
        "#prep-cursor",
        { scale: [1, 0.82, 1] },
        { duration: 0.15, ease: "easeInOut" }
      );
      if (!isMounted) return;

      // Select Option B (Correct)
      setSelectedOption("B");

      // Hold validation: 1.15s
      await new Promise((resolve) => setTimeout(resolve, 1150));
      if (!isMounted) return;

      // Exit modal
      setShowModal(false);

      // Animate progress cardiology: 92 -> 96
      animate(92, 96, {
        duration: 0.8,
        ease: "easeOut",
        onUpdate: (latest) => setCardiologyProgress(Math.round(latest)),
      });

      // Animate progress overall: 87 -> 88
      animate(87, 88, {
        duration: 0.6,
        ease: "easeOut",
        onUpdate: (latest) => setOverallProgress(Math.round(latest)),
      });

      // Show reward bubble Cardiology +4%
      setBubbleText("+4%");
      setBubbleType("up");
      setActiveBubbleCategory("Cardiology");
      setShowRewardBubble(true);

      // Q1 Complete: Animate Today's activity bar to 35%
      animate(10, 35, {
        duration: 0.6,
        ease: "easeInOut",
        onUpdate: (latest) => setTodayActivityHeight(Math.round(latest)),
      });

      // Cursor fades out / glides away
      safeAnimate(
        "#prep-cursor",
        { opacity: 0, x: "120px", y: "250px" },
        { duration: 0.4, ease: "easeInOut" }
      );

      // Wait 1.5s to settle Cardiology progress and transition
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!isMounted) return;

      setShowRewardBubble(false);
      setSelectedOption(null);

      // ==========================================
      // QUESTION 2 (Respiratory)
      // ==========================================
      setQuestionIndex(1);
      setShowModal(true);

      // Wait 1.5s for modal to slide up and settle
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!isMounted) return;

      // Cursor glides to Option C (x: 120 -> 30, y: 250 -> 185)
      await safeAnimate(
        "#prep-cursor",
        { x: ["120px", "30px"], y: ["250px", "185px"], opacity: [0, 1] },
        { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      // Cursor squash click for 150ms
      await safeAnimate(
        "#prep-cursor",
        { scale: [1, 0.82, 1] },
        { duration: 0.15, ease: "easeInOut" }
      );
      if (!isMounted) return;

      // Select Option C (Incorrect)
      setSelectedOption("C");

      // Hold validation: 1.5s (longer wait so they see incorrect vs correct reveal)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!isMounted) return;

      // Exit modal
      setShowModal(false);

      // Animate progress respiratory: 78 -> 74
      animate(78, 74, {
        duration: 0.8,
        ease: "easeOut",
        onUpdate: (latest) => setRespiratoryProgress(Math.round(latest)),
      });

      // Animate progress overall: 88 -> 87
      animate(88, 87, {
        duration: 0.6,
        ease: "easeOut",
        onUpdate: (latest) => setOverallProgress(Math.round(latest)),
      });

      // Show reward bubble Respiratory -4% (down)
      setBubbleText("-4%");
      setBubbleType("down");
      setActiveBubbleCategory("Respiratory");
      setShowRewardBubble(true);

      // Q2 Complete: Animate Today's activity bar to 60%
      animate(35, 60, {
        duration: 0.6,
        ease: "easeInOut",
        onUpdate: (latest) => setTodayActivityHeight(Math.round(latest)),
      });

      // Cursor fades out / glides away
      safeAnimate(
        "#prep-cursor",
        { opacity: 0, x: "120px", y: "250px" },
        { duration: 0.4, ease: "easeInOut" }
      );

      // Wait 1.5s to settle Respiratory progress
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!isMounted) return;

      setShowRewardBubble(false);
      setSelectedOption(null);

      // ==========================================
      // QUESTION 3 (Mental Health)
      // ==========================================
      setQuestionIndex(2);
      setShowModal(true);

      // Wait 1.5s for modal to slide up and settle
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!isMounted) return;

      // Cursor glides to Option C (x: 120 -> 30, y: 250 -> 185)
      await safeAnimate(
        "#prep-cursor",
        { x: ["120px", "30px"], y: ["250px", "185px"], opacity: [0, 1] },
        { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      // Cursor squash click for 150ms
      await safeAnimate(
        "#prep-cursor",
        { scale: [1, 0.82, 1] },
        { duration: 0.15, ease: "easeInOut" }
      );
      if (!isMounted) return;

      // Select Option C (Correct)
      setSelectedOption("C");

      // Hold validation: 1.15s
      await new Promise((resolve) => setTimeout(resolve, 1150));
      if (!isMounted) return;

      // Exit modal
      setShowModal(false);

      // Animate progress mental health: 65 -> 72
      animate(65, 72, {
        duration: 0.8,
        ease: "easeOut",
        onUpdate: (latest) => setMentalHealthProgress(Math.round(latest)),
      });

      // Animate progress overall: 87 -> 89
      animate(87, 89, {
        duration: 0.6,
        ease: "easeOut",
        onUpdate: (latest) => setOverallProgress(Math.round(latest)),
      });

      // Show reward bubble Mental Health +7%
      setBubbleText("+7%");
      setBubbleType("up");
      setActiveBubbleCategory("Mental Health");
      setShowRewardBubble(true);

      // Q3 Complete: Animate Today's activity bar to 90%
      animate(60, 90, {
        duration: 0.6,
        ease: "easeInOut",
        onUpdate: (latest) => setTodayActivityHeight(Math.round(latest)),
      });

      // Cursor fades out / glides away
      safeAnimate(
        "#prep-cursor",
        { opacity: 0, x: "120px", y: "250px" },
        { duration: 0.4, ease: "easeInOut" }
      );

      // Wait 1.5s to settle Mental Health progress
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!isMounted) return;

      setShowRewardBubble(false);
      setSelectedOption(null);

      // End hold: 2.5s before restarting loop
      await new Promise((resolve) => setTimeout(resolve, 2500));
      if (!isMounted) return;

      // Loop restart
      runAnimation();
    };

    const timeout = setTimeout(runAnimation, 1000);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [animate]);

  const currentQuestion = questions[questionIndex];

  return (
    <motion.div
      ref={scope}
      variants={cardVariants}
      className="col-span-12 lg:col-span-7 relative bg-slate-900 rounded-3xl p-6 lg:p-8 overflow-hidden cursor-pointer border border-white/10 shadow-[0_8px_40px_rgb(0,0,0,0.12)] hover:shadow-[0_16px_50px_rgb(0,0,0,0.18)] active:scale-[0.99] transition-all duration-300 h-[500px]"
    >
      {/* Dot grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />

      {/* Teal radial gradient glow */}
      <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-gradient-to-br from-teal-500/25 via-teal-400/15 to-transparent rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-[40px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold border border-amber-500/20">
            Members only
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-400 text-xs font-medium border border-teal-500/20">
            Most Popular
          </span>
        </div>

        <h3 className="font-sans text-xl md:text-2xl lg:text-3xl font-semibold leading-snug text-white mb-3">
          Adaptive Exam Prep
        </h3>

        <p className="font-sans text-base md:text-lg font-normal leading-relaxed text-slate-400 max-w-md mb-6">
          Dynamic mock exams for <span className="text-teal-400 font-medium">AKT</span> and <span className="text-teal-400 font-medium">KFP</span>. The platform learns your weak spots and prioritizes them—every minute counts.
        </p>

        {/* Premium UI mockup - Dashboard preview */}
        <div className="bg-white/[0.07] backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <img
                  src="/assets/adaptive_progress.png"
                  alt="Progress"
                  className="w-5.5 h-5.5 object-contain invert mix-blend-screen brightness-200"
                />
              </div>
              <div>
                <div className="text-xs font-medium text-white">Your Progress</div>
                <div className="text-[10px] text-slate-500">Last 7 days</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{overallProgress}%</div>
              <div className="text-[10px] text-teal-400 font-medium">+12%</div>
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-2.5">
            {[
              { label: "Cardiology", progress: cardiologyProgress, color: "bg-teal-400" },
              { label: "Respiratory", progress: respiratoryProgress, color: "bg-emerald-400" },
              { label: "Mental Health", progress: mentalHealthProgress, color: "bg-amber-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 relative">
                <span className="text-[10px] text-slate-400 w-20 truncate">{item.label}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
                <div className="w-8 flex justify-end">
                  <span className="text-[10px] font-medium text-slate-300">{item.progress}%</span>
                </div>

                {/* Reward Bubble Floating Tag */}
                {item.label === activeBubbleCategory && (
                  <AnimatePresence>
                    {showRewardBubble && (
                      <motion.span
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -18, scale: 1 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`absolute right-0 text-[10px] font-bold px-1.5 py-0.5 rounded border z-10 ${
                          bubbleType === "up"
                            ? "text-teal-400 bg-teal-950/90 border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.2)]"
                            : "text-rose-400 bg-rose-950/90 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                        }`}
                      >
                        {bubbleText}
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>

          {/* Weekly Activity Chart */}
          <div className="pt-3 mt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400">Weekly Activity</span>
              <span className="text-[9px] text-teal-400 font-medium">View details →</span>
            </div>
            <div className="flex items-end justify-between gap-1.5 h-10">
              {[
                { day: "W", height: 40, isToday: false },
                { day: "T", height: 70, isToday: false },
                { day: "F", height: 55, isToday: false },
                { day: "S", height: 30, isToday: false },
                { day: "S", height: todayActivityHeight, isToday: true },
              ].map((item, i) => (
                <div key={`activity-${i}`} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full flex items-end justify-center"
                    style={{ height: "28px" }}
                  >
                    <motion.div
                      animate={{ height: `${item.height}%` }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className={`w-full rounded-sm ${
                        item.isToday
                          ? "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]"
                          : "bg-slate-700/50"
                      }`}
                      style={{ minHeight: "2px" }}
                    />
                  </div>
                  <span className={`text-[9px] ${item.isToday ? "text-teal-400 font-medium" : "text-slate-500"}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating notification */}
          <div className="mt-3 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
            <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-medium text-white">Ready for exam!</div>
              <div className="text-[9px] text-slate-500">Confidence: High</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      <div className="absolute top-[230px] left-1/2 -translate-x-1/2 pointer-events-none z-20">
        <AnimatePresence>
          {showModal && (
            <motion.div
              id="prep-modal"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, x: -150, scale: 0.95 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-[330px] bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-teal-400 tracking-wider uppercase">{currentQuestion.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{currentQuestion.subtitle}</span>
              </div>

              {/* Question Text */}
              <p className="text-[11px] font-medium leading-relaxed text-slate-200 mb-3">
                {currentQuestion.question}
              </p>

              {/* Option Items */}
              <div className="space-y-1.5">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isCorrectAnswer = currentQuestion.correctId === opt.id;
                  const isRevealedCorrect = !currentQuestion.isCorrect && selectedOption !== null && isCorrectAnswer;

                  let rowStyle = "bg-slate-900/60 border-slate-800 text-slate-400";
                  let circleStyle = "border-slate-700 text-slate-500";
                  let showIcon = null;

                  if (isSelected) {
                    if (currentQuestion.isCorrect) {
                      rowStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]";
                      circleStyle = "border-emerald-500 text-emerald-400 bg-emerald-500/10";
                      showIcon = "check";
                    } else {
                      rowStyle = "bg-rose-500/10 border-rose-500 text-rose-400 font-semibold shadow-[0_0_12px_rgba(244,63,94,0.15)]";
                      circleStyle = "border-rose-500 text-rose-400 bg-rose-500/10";
                      showIcon = "cross";
                    }
                  } else if (isRevealedCorrect) {
                    rowStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]";
                    circleStyle = "border-emerald-500 text-emerald-400 bg-emerald-500/10";
                    showIcon = "check";
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`w-full px-3 py-2 rounded-lg text-[11px] font-medium text-left border flex items-center justify-between transition-all duration-200 ${rowStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold ${circleStyle}`}>
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </div>

                      {showIcon === "check" && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="w-3.5 h-3.5 text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}

                      {showIcon === "cross" && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="w-3.5 h-3.5 text-rose-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </motion.svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mac-style cursor */}
      <motion.div
        id="prep-cursor"
        initial={{ opacity: 0, x: 120, y: 250 }}
        style={{ left: "50%", top: "50%" }}
        className="absolute pointer-events-none z-30"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
            fill="#1e293b"
            stroke="#fff"
            strokeWidth="1.5"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default function BentoGrid() {
  return (
    <section id="tools" className="pt-10 pb-20 lg:pt-12 lg:pb-28 bg-slate-50/50 dark:bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14"
        >
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-[#5AC8B0] mb-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Four Core Tools
            </span>
            <h2 className="font-sans text-3xl lg:text-[2.5rem] font-bold text-slate-900 dark:text-[#F8FAFC] tracking-[-0.02em]">
              Everything a registrar needs
            </h2>
          </div>
          <a href="#all-tools" className="text-sm font-medium text-slate-500 dark:text-[#7D8795] hover:text-teal-600 dark:hover:text-[#5AC8B0] active:scale-[0.98] transition-all flex items-center gap-1.5 group">
            View all
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>

        {/* Premium Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-12 gap-4 lg:gap-5"
        >
          {/* Card 1: Exam Prep - Large Feature Card */}
          <AdaptiveExamPrepCardInline />

          {/* Card 2: Bill Better - Interactive MBS Search */}
          <MBSBillingCardInline />

          {/* Card 3: Autofills with Interactive Copy Animation */}
          <ClinicalAutofillsCardInline />

          {/* Card 4: Medical Directory */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 lg:col-span-7 relative bg-white dark:bg-[#1B212C] rounded-3xl p-5 lg:p-6 overflow-hidden cursor-pointer border border-slate-200 dark:border-[rgba(255,255,255,0.07)] shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:border-slate-300 dark:hover:border-[rgba(90,200,176,0.25)] active:scale-[0.99] transition-all duration-300"
          >
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-start gap-5">
              {/* Left: Header + Carousel */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-4">

                </div>

                <h3 className="font-sans text-xl md:text-2xl lg:text-3xl font-semibold leading-snug text-slate-900 mb-2">
                  Medical Directory
                </h3>

                <p className="font-sans text-base md:text-lg font-normal leading-relaxed text-slate-600 mb-4">
                  <span className="font-medium text-teal-600">300+ conditions</span> catalogued. Browse, search, and revise on the go.
                </p>

                {/* Looping Carousel */}
                <ConditionCarousel />
              </div>

              {/* Right: Staggered Condition Tags — row-by-row grouped layout */}
              <div className="lg:w-[230px] lg:pt-10 flex-shrink-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Browse by condition</p>
                <div className="flex flex-col gap-2">
                  {tagRows.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex gap-2">
                      {row.map((condition) => (
                        <motion.div
                          key={condition.name}
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.32, delay: 0.35 + condition.delay, ease: [0.22, 1, 0.36, 1] }}
                          whileHover={{ y: -2, scale: 1.04, transition: { duration: 0.14 } }}
                          className="group flex-1 min-w-0 px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center cursor-pointer bg-white border border-slate-200/80 text-slate-700 shadow-sm hover:shadow-md hover:border-teal-200 hover:bg-teal-50/60 transition-all duration-200 active:scale-[0.96]"
                        >
                          <span className="group-hover:text-teal-700 transition-colors truncate">{condition.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

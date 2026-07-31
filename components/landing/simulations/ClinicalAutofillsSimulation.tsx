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

const CATEGORY_PILLS = ["All", "General Health", "Chronic Disease", "Respiratory", "Dermatology"];

const TEMPLATES = [
  {
    id: "asthma",
    name: "Asthma Management Plan",
    tags: ["Explanation", "Guideline"],
    content: [
      "Reason for visit: Asthma review.",
      "Current symptoms: No exertional wheeze, uses reliever infrequently.",
      "Compliance: Good with preventer inhaler.",
      "Action Plan: Reviewed and updated.",
      "Follow-up: 6 months or PRN if exacerbation.",
    ],
    trigger: "Asthma",
  },
  {
    id: "urti",
    name: "URTI Template",
    tags: ["Explanation"],
    content: [
      "Reason for visit: Sore throat x 3 days, no fever.",
      "O/E: Pharynx erythematous, no exudate. Afebrile.",
      "Assessment: Viral URTI, no antibiotic indication.",
      "Plan: Supportive care, analgesia PRN.",
      "Follow-up: If not improving in 5 days.",
    ],
    trigger: "URTI",
  },
];

const SEARCH_CYCLES = ["Asthma", "URTI"];

export default function ClinicalAutofillsSimulation() {
  const [scope, animate] = useAnimate();
  const [isCopied, setIsCopied] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [activePill, setActivePill] = useState("All");
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
      setIsCopied(false);
      setSearchText("");
      setIsFocused(false);
      setActiveTemplate(null);
      setActivePill("All");
      setCycleIdx(currentCycle);

      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;

      // Cursor glides to search
      await safeAnimate(
        "#autofill-cursor",
        { x: ["-60px", "0px"], y: ["40px", "0px"], opacity: [0, 1] },
        { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      await safeAnimate("#autofill-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      setIsFocused(true);

      // Type search phrase
      const phrase = SEARCH_CYCLES[currentCycle];
      for (let i = 0; i <= phrase.length; i++) {
        if (!isMounted) return;
        setSearchText(phrase.slice(0, i));
        await new Promise((r) => setTimeout(r, 90));
      }

      await new Promise((r) => setTimeout(r, 400));
      if (!isMounted) return;

      // Show matching template
      const matched = TEMPLATES.find((t) => t.trigger === phrase) || TEMPLATES[0];
      setActiveTemplate(matched);
      setActivePill(matched.tags[0] === "Guideline" ? "Chronic Disease" : "General Health");

      // Cursor glides to copy button
      await new Promise((r) => setTimeout(r, 800));
      await safeAnimate(
        "#autofill-cursor",
        { x: ["0px", "30px"], y: ["0px", "200px"] },
        { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      await safeAnimate("#autofill-cursor", { scale: [1, 0.85, 1] }, { duration: 0.2, ease: "easeInOut" });
      if (!isMounted) return;

      setIsCopied(true);
      await new Promise((r) => setTimeout(r, 1800));
      if (!isMounted) return;

      // Fade cursor away
      safeAnimate(
        "#autofill-cursor",
        { x: ["30px", "80px"], y: ["200px", "170px"], opacity: [1, 0] },
        { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
      );
      setIsCopied(false);
      setActiveTemplate(null);
      await new Promise((r) => setTimeout(r, 500));
      setSearchText("");
      setIsFocused(false);

      await new Promise((r) => setTimeout(r, 1000));
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

  return (
    <motion.div
      ref={scope}
      variants={cardVariants}
      className="col-span-12 sm:col-span-6 lg:col-span-5 relative bg-white dark:bg-[#1B212C] rounded-3xl overflow-hidden cursor-pointer border border-slate-200 dark:border-[rgba(255,255,255,0.07)] shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:border-slate-300 dark:hover:border-[rgba(90,200,176,0.25)] active:scale-[0.99] transition-all duration-300 h-[500px]"
    >
      <div className="flex flex-col h-full p-5">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-sans text-base font-bold text-slate-900 dark:text-slate-100">Clinical Autofills</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Prevention templates — write and copy directly — clinical practice.</p>
        </div>

        {/* Search row */}
        <div className="flex gap-2 mb-3 relative">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all duration-200 ${
            isFocused
              ? "border-teal-400 ring-2 ring-teal-100 dark:ring-teal-900/40 bg-white dark:bg-slate-800"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          }`}>
            <span className="text-slate-700 dark:text-slate-300 flex-1">
              {searchText || <span className="text-slate-400 dark:text-slate-500">Medical condition...</span>}
              {isFocused && searchText.length < (SEARCH_CYCLES[cycleIdx]?.length ?? 0) && (
                <span className="inline-block w-0.5 h-3 bg-teal-500 ml-0.5 animate-pulse align-middle" />
              )}
            </span>
            {searchText && (
              <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <span className="text-xs text-slate-400 dark:text-slate-500">Search all templates...</span>
          </div>

          {/* Cursor */}
          <motion.div
            id="autofill-cursor"
            initial={{ opacity: 0, x: "-60px", y: "40px" }}
            className="absolute -bottom-2 left-1/3 pointer-events-none z-30"
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

        {/* Category Pills */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {CATEGORY_PILLS.map((pill) => (
            <span
              key={pill}
              className={`px-2.5 py-1 rounded-full text-[9px] font-semibold border transition-colors duration-200 ${
                pill === activePill || (pill === "All" && activePill === "All")
                  ? "bg-teal-500 border-teal-500 text-white"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400"
              }`}
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Results info row */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] text-slate-400 dark:text-slate-500">
            {activeTemplate ? "1 result" : "All templates"}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-slate-400 dark:text-slate-500">1 Free</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">Saved Bookmarks: 0</span>
          </div>
        </div>

        {/* Template Card Area */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence>
            {activeTemplate && (
              <motion.div
                key={activeTemplate.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{activeTemplate.name}</h4>
                    <div className="flex gap-1.5">
                      {activeTemplate.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[8px] font-semibold px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-700/50 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="text-slate-300 dark:text-slate-600 hover:text-slate-400 transition-colors ml-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>

                {/* Template content */}
                <div className="flex-1 space-y-1 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed overflow-hidden">
                  {activeTemplate.content.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>

                {/* Copy button */}
                <div className="flex justify-end mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <motion.button
                    animate={isCopied ? { scale: [1, 0.95, 1] } : {}}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                      isCopied
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                        : "bg-teal-500 text-white shadow-md shadow-teal-500/20 hover:bg-teal-600"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Quick Copy
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!activeTemplate && (
            <div className="flex items-center justify-center h-full">
              <p className="text-[11px] text-slate-300 dark:text-slate-600">Type a condition to load templates</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
=======
import { motion, AnimatePresence } from "framer-motion";

export default function ClinicalAutofillsSimulation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let active = true;
    const run = async () => {
      while (active) {
        setStep(0); // Empty search
        await new Promise((r) => setTimeout(r, 1000));
        if (!active) break;

        setStep(1); // Type "Asthma"
        await new Promise((r) => setTimeout(r, 1200));
        if (!active) break;

        setStep(2); // Card highlights
        await new Promise((r) => setTimeout(r, 1000));
        if (!active) break;

        setStep(3); // Copy button scales / clicks
        await new Promise((r) => setTimeout(r, 2000));
        if (!active) break;

        setStep(4); // Fade out and reset
        await new Promise((r) => setTimeout(r, 500));
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-[#0F1115] relative overflow-hidden flex font-sans select-none">
      <AnimatePresence mode="wait">
        {step < 4 && (
          <motion.div
            key="clinical-autofills"
          <motion.div
            key="clinical-autofills"
            initial={{ opacity: 0 }}
            {/* Scale wrapper */}
            <div className="w-[175%] h-[175%] min-w-[175%] min-h-[175%] shrink-0 origin-top-left transform scale-[0.571] flex flex-col p-8">
              
              <div className="w-full">
            {/* Scale wrapper */}
            <div className="w-[175%] h-[175%] min-w-[175%] min-h-[175%] shrink-0 origin-top-left transform scale-[0.571] flex flex-col p-8">
              
              <div className="max-w-4xl w-full mx-auto">
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Pre-written templates — edit and copy directly into Best Practice.
                  </p>
                </div>

                {/* Search Inputs */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-white dark:bg-[#1B212C] border-2 border-emerald-100 dark:border-emerald-500/20 rounded-full py-2 px-4 shadow-sm relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-5 left-2">
                      MEDICAL CONDITION
                    </label>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-slate-800 dark:text-white font-medium flex-1 flex relative h-[24px] items-center">
                        {step >= 1 ? "Asthma" : ""}
                        {step === 1 && (
                          <motion.div 
                            initial={{ left: 0 }} 
                            animate={{ left: "100%" }} 
                            transition={{ duration: 0.6, ease: "linear" }}
                            className="absolute inset-y-0 right-0 bg-white dark:bg-[#1B212C] z-10" 
                          />
                        )}
                        {step < 2 && <span className="w-[1.5px] h-5 bg-emerald-500 animate-pulse ml-0.5" />}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex-[0.8] bg-white dark:bg-[#1B212C] border border-slate-200 dark:border-slate-800 rounded-full py-2 px-4 shadow-sm relative opacity-60">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-5 left-2">
                      PRESENTATION
                    </label>
                    <div className="flex items-center gap-3 mt-1 text-slate-400">
                      <span className="font-medium text-sm">Search presentations...</span>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">SORT TEMPLATES BY CATEGORIES</label>
                  <div className="flex gap-2">
                    <span className="px-4 py-1.5 bg-[#2d6a4f] text-white text-xs font-bold rounded-full">All</span>
                    <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">Mental Health</span>
                    <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">Chronic Disease</span>
                    <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">Respiratory</span>
                    <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">Dermatology</span>
                  </div>
                </div>

                {/* Subheader */}
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="text-[10px] font-bold text-slate-500 tracking-widest">
                    ALL TEMPLATES <span className="ml-2 text-emerald-600 dark:text-emerald-400">{step >= 2 ? "1 RESULT" : "0 RESULTS"}</span>
                  </div>
                  <div className="flex gap-4 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Clear</span>
                    <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> Saved Bookmarks <span className="bg-slate-200 dark:bg-slate-800 px-1.5 rounded text-slate-600">3</span></span>
                  </div>
                </div>

                {/* Template Card */}
                {step >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      boxShadow: step >= 2 ? "0 10px 25px rgba(0,0,0,0.05)" : "none",
                      borderColor: step >= 2 ? "rgba(16, 185, 129, 0.3)" : "rgba(226, 232, 240, 1)"
                    }}
                    className="bg-white dark:bg-[#1B212C] rounded-2xl border p-6 flex flex-col relative transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Asthma Management Plan</h3>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded">RESPIRATORY</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">CHRONIC</span>
                        </div>
                      </div>
                      <div className="text-slate-300 dark:text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                    </div>

                    <div className="font-mono text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed border-l-2 border-emerald-400 pl-4 py-2">
                      {`Reason for visit: Asthma Review
Current symptoms: No nocturnal waking, uses reliever <2x/week.
Compliance: Good with preventer inhaler.
Action Plan: Reviewed and updated.
Follow-up: 6 months or PRN if exacerbation.`}
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <motion.div
                        animate={{
                          scale: step === 3 ? 0.95 : 1,
                          backgroundColor: step >= 3 ? "rgb(16, 185, 129)" : "rgb(45, 106, 79)", // #2d6a4f to green-500
                        }}
                        className="px-5 py-2.5 rounded-full flex items-center gap-2 text-white shadow-lg shadow-[#2d6a4f]/20 font-bold text-sm cursor-pointer"
                      >
                        {step >= 3 ? (
                          <>
                            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </motion.svg>
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Quick Copy</span>
                          </>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

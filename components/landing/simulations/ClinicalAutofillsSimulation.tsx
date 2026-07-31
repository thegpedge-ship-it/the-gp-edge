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

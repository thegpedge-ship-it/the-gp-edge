"use client";
import { useState, useEffect } from "react";
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
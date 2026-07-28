"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MedicalDirectorySimulation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let active = true;
    const run = async () => {
      while (active) {
        setStep(0); // Initial empty state
        await new Promise((r) => setTimeout(r, 1000));
        if (!active) break;

        setStep(1); // Typing "Hypertension"
        await new Promise((r) => setTimeout(r, 1200));
        if (!active) break;

        setStep(2); // Show Hypertension condition
        await new Promise((r) => setTimeout(r, 1000));
        if (!active) break;

        setStep(3); // Highlight a Clinical Approach
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
            key="medical-directory"
          <motion.div
            key="medical-directory"
            initial={{ opacity: 0 }}
            {/* Scale wrapper to fit complex UI in card perfectly without gaps */}
            <div className="w-[175%] h-[175%] min-w-[175%] min-h-[175%] shrink-0 origin-top-left transform scale-[0.571] flex flex-col p-8 pb-0">
              
              <div className="flex-1 flex flex-col">
                
                {/* Header section */}
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded uppercase tracking-widest border border-emerald-200/50">
                      ◆ REFERENCE LIBRARY
                    </span>
                  </div>
                  <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-3">Explore the Medical Directory</h1>
                  <p className="text-slate-600 dark:text-slate-400 text-base">
                    Browse official guidelines, diagnostic criteria, treatment options, and clinical summaries. 31 conditions across major body systems.
                  </p>
                </div>

                {/* Search Bar section */}
                <div className="pb-6 flex gap-6">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">SEARCH BY MEDICAL CONDITION</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="w-full bg-white dark:bg-[#1B212C] border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-800 dark:text-slate-200 shadow-sm flex items-center h-[46px]">
                         <span className="relative text-base">
                            {step >= 1 ? "Hypertension" : ""}
                            {step === 1 && (
                              <motion.div 
                                initial={{ left: 0 }} 
                                animate={{ left: "100%" }} 
                                transition={{ duration: 0.6, ease: "linear" }}
                                className="absolute inset-y-0 right-0 bg-white dark:bg-[#1B212C] z-10" 
                              />
                            )}
                         </span>
                         {step < 2 && <span className="w-[1.5px] h-5 bg-slate-400 animate-pulse ml-0.5" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 opacity-50">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">SEARCH BY APPROACH</label>
                    <div className="w-full bg-white dark:bg-[#1B212C] border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-400 flex items-center gap-3 h-[46px]">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                       Enter management type, guideline, category...
                    </div>
                  </div>
                </div>

                {/* Split Pane Area */}
                <div className="flex-1 flex border-t border-slate-200 dark:border-slate-800 pt-6 relative">
                  
                  {/* Left Pane - Medical Conditions */}
                  <div className="w-[55%] pr-6 border-r border-slate-200 dark:border-slate-800">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-500 tracking-widest">
                          MEDICAL CONDITIONS <span className="ml-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300">{step >= 2 ? "1" : "0"}</span>
                        </h3>
                        <button className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                          Filter by System
                        </button>
                     </div>

                     {step < 2 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-slate-400 font-semibold italic">
                          No conditions match your filters.
                        </div>
                     ) : (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white dark:bg-[#1B212C] rounded-3xl p-6 border-l-4 border-l-emerald-500 border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.04)]"
                        >
                           <div className="flex justify-between items-center mb-3">
                             <div className="flex gap-2">
                               <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-200/30">C013</span>
                               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">CONDITION</span>
                             </div>
                           </div>
                           <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2">Essential Hypertension</h4>
                           <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                              CARDIOLOGY &gt; CHRONIC
                           </div>
                           <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between">
                              <div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">SYSTEM</div>
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Cardiology</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">LAST UPDATED</div>
                                <div className="text-xs font-bold text-emerald-500">2024-03-12</div>
                              </div>
                           </div>
                        </motion.div>
                     )}
                  </div>

                  {/* Right Pane - Clinical Approaches */}
                  <div className="w-[45%] pl-6">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-500 tracking-widest">
                          CLINICAL APPROACHES <span className="ml-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300">4</span>
                        </h3>
                        <button className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                          Filter by System
                        </button>
                     </div>

                     <div className="space-y-4">
                       {/* Approach Card */}
                       <motion.div 
                          animate={{
                            scale: step >= 3 ? 1.02 : 1,
                            borderColor: step >= 3 ? "#0ea5e9" : "rgba(226, 232, 240, 1)", // light blue vs slate-200
                            boxShadow: step >= 3 ? "0 10px 25px rgba(14, 165, 233, 0.15)" : "0 4px 20px rgba(0,0,0,0.04)"
                          }}
                          className="bg-white dark:bg-[#1B212C] rounded-3xl p-6 border-l-4 border-l-sky-500 shadow-sm"
                        >
                           <div className="flex justify-between items-center mb-3">
                             <div className="flex gap-2">
                               <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded border border-sky-200/30">APP-102</span>
                               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">APPROACH</span>
                             </div>
                           </div>
                           <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Secondary Headaches & Painful Cranial Neuropathies</h4>
                           <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                              CARDIOLOGY &gt; ACUTE
                           </div>
                        </motion.div>
                     </div>
                  </div>

                  {/* Resizer bar */}
                  <div className="absolute top-0 bottom-0 left-[55%] w-[2px] bg-slate-200 dark:bg-slate-800 flex items-center justify-center transform -translate-x-1/2">
                    <div className="w-1 h-8 bg-slate-300 dark:bg-slate-600 rounded-full" />
                  </div>

                </div>
              </div>
            </div>
                            boxShadow: step >= 3 ? "0 10px 25px rgba(14, 165, 233, 0.15)" : "0 1px 2px rgba(0,0,0,0.05)"
                          }}
                          className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 border-l-4 border-l-sky-500 shadow-sm"
                        >
                           <div className="flex justify-between items-center mb-3">
                             <div className="flex gap-2">
                               <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded border border-sky-200/30">APP-102</span>
                               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">APPROACH</span>
                             </div>
                           </div>
                           <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Secondary Headaches & Painful Cranial Neuropathies</h4>
                           <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                              CARDIOLOGY &gt; ACUTE
                           </div>
                        </motion.div>
                     </div>
                  </div>

                  {/* Resizer bar */}
                  <div className="absolute top-0 bottom-0 left-[55%] w-[2px] bg-slate-200 dark:bg-slate-800 flex items-center justify-center transform -translate-x-1/2">
                    <div className="w-1 h-8 bg-slate-300 dark:bg-slate-600 rounded-full" />
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
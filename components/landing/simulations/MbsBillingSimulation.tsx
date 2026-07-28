"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MbsBillingSimulation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let active = true;
    const run = async () => {
      while (active) {
        setStep(0); // Empty state
        await new Promise((r) => setTimeout(r, 1000));
        if (!active) break;

        setStep(1); // Type "Heart Failure"
        await new Promise((r) => setTimeout(r, 1500)); 
        if (!active) break;

        setStep(2); // Show results
        await new Promise((r) => setTimeout(r, 1200));
        if (!active) break;

        setStep(3); // Expand first result / highlight rebate
        await new Promise((r) => setTimeout(r, 2000));
        if (!active) break;

        setStep(4); // Fade out
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
            key="mbs-billing"
          <motion.div
            key="mbs-billing"
            initial={{ opacity: 0 }}
            {/* Scale wrapper */}
            <div className="w-[175%] h-[175%] min-w-[175%] min-h-[175%] shrink-0 origin-top-left transform scale-[0.571] flex flex-col p-8">
              
              <div className="w-full">
            {/* Scale wrapper */}
            <div className="w-[175%] h-[175%] min-w-[175%] min-h-[175%] shrink-0 origin-top-left transform scale-[0.571] flex flex-col p-8">
              
              <div className="max-w-5xl w-full mx-auto">
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="w-full bg-white dark:bg-[#1B212C] border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 dark:text-white shadow-sm flex items-center h-[52px]">
                    <span className="text-slate-800 dark:text-white relative font-medium text-base">
                      {step >= 1 ? "Heart Failure" : ""}
                      {step === 1 && (
                         <motion.div 
                            initial={{ left: 0 }} 
                            animate={{ left: "100%" }} 
                            transition={{ duration: 0.8, ease: "linear" }}
                            className="absolute inset-y-0 right-0 bg-white dark:bg-[#1B212C] z-10" 
                         />
                      )}
                    </span>
                    {step < 2 && <span className="w-[1.5px] h-5 bg-blue-500 animate-pulse ml-0.5" />}
                  </div>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                     <span className="text-slate-300 text-lg">&times;</span>
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                  {step >= 2 ? "2 matches - page 1 of 1" : "0 matches - page 0 of 0"}
                </div>

                {/* Grid Area */}
                {step >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    {/* Item 1 */}
                    <motion.div 
                      animate={{
                        borderColor: step >= 3 ? "rgba(59, 130, 246, 0.4)" : "rgba(226, 232, 240, 1)",
                        boxShadow: step >= 3 ? "0 10px 25px rgba(59, 130, 246, 0.1)" : "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                      className="bg-white dark:bg-[#1B212C] rounded-2xl border p-5 flex flex-col relative transition-all duration-300 overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">ITEM 66252</div>
                        <div className="text-slate-300 dark:text-slate-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Echocardiography for Heart Failure</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                        Preparation of a patient for, and continuous ECG recording of, a stress test (such as during exercise or pharmacological stimulation) for the investigation of heart failure.
                      </p>
                      
                      <AnimatePresence>
                        {step >= 3 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                            className="border-t border-slate-100 dark:border-slate-800 pt-4"
                          >
                            <motion.div
                              animate={{
                                backgroundColor: step >= 3 ? "rgba(59, 130, 246, 0.1)" : "transparent",
                                borderColor: step >= 3 ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.05)"
                              }}
                              className="flex justify-between items-center p-3 rounded-xl border transition-colors duration-500"
                            >
                              <span className="text-[11px] font-bold text-slate-500">75% Rebate</span>
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                $178.60
                              </span>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Dummy Item 2 */}
                    <div className="bg-white dark:bg-[#1B212C] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col relative opacity-60">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">ITEM 11700</div>
                        <div className="text-slate-300 dark:text-slate-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">ECG Recording</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Twelve-lead electrocardiography, tracing and report.
                      </p>
                    </div>
                    
                    {/* Dummy Item 3 */}
                    <div className="bg-white dark:bg-[#1B212C] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col relative opacity-60">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">ITEM 23</div>
                        <div className="text-slate-300 dark:text-slate-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">GP Consultation &lt; 20 Minutes</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Professional attendance by a general practitioner at consulting rooms for an obvious problem.
                      </p>
                    </div>

                    {/* Dummy Item 4 */}
                    <div className="bg-white dark:bg-[#1B212C] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col relative opacity-60">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">ITEM 24</div>
                        <div className="text-slate-300 dark:text-slate-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">GP Consultation Out Of Rooms</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Professional attendance by a general practitioner (other than attendance at consulting rooms) lasting less than 20 minutes.
                      </p>
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
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExamPrepSimulation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let active = true;
    const run = async () => {
      while (active) {
        setStep(0); // Dashboard + Mock Test Popup
        await new Promise((r) => setTimeout(r, 1500));
        if (!active) break;

        setStep(1); // Exam Interface (Question Loads)
        await new Promise((r) => setTimeout(r, 1500));
        if (!active) break;

        setStep(2); // Option B selected
        await new Promise((r) => setTimeout(r, 1000));
        if (!active) break;

        setStep(3); // Correct answer (Green) + Progress Updates
        await new Promise((r) => setTimeout(r, 3000));
        if (!active) break;

        setStep(4); // Fade out / reset
        await new Promise((r) => setTimeout(r, 500));
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

      <AnimatePresence mode="wait">
          </motion.div>
        )}
      </AnimatePresence>
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Progress Tracking</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="dashboard-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            {/* Blurred background mimicking the dashboard */}
            <div className="absolute inset-0 bg-slate-100/50 dark:bg-[#0F1115]/80 backdrop-blur-sm" />
            
            {/* Mock Test Modal */}
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="relative z-10 w-full max-w-[500px] bg-white dark:bg-[#1B212C] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mock Tests</h2>
                  <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">3</span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Full AKT simulations under real exam conditions. Pick a test to begin.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[120px]">
                   <div className="flex justify-between">
                      <div className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white">1</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Completed</span>
                   </div>
                   <div className="flex justify-between items-end mt-4">
                      <span className="text-xs text-slate-500 font-bold">Best 0%</span>
                      <button className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                        Retake
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                   </div>
                </div>
                
                {/* Simulated Hover State for second card */}
                <motion.div 
                  animate={{ scale: 1.02, borderColor: "#10B981", boxShadow: "0 4px 12px rgba(16,185,129,0.15)" }}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[120px] bg-emerald-50/30 dark:bg-emerald-900/10 cursor-pointer"
                >
                   <div className="flex justify-between">
        {step >= 1 && step < 4 && (
          <motion.div
            key="exam-ui"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0F1115] flex"
          >
            {/* The scale wrapper lets us fit a large desktop UI into the small card perfectly without gaps */}
            <div className="w-[175%] h-[175%] origin-top-left transform scale-[0.571] flex gap-6 p-8">
              
              {/* Main Question Area */}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                   </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
          <motion.div
            key="exam-ui"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0F1115]"
          >
            {/* The scale wrapper lets us fit a large desktop UI into the small card perfectly without gaps */}
            <div className="w-[175%] h-[175%] min-w-[175%] min-h-[175%] shrink-0 origin-top-left transform scale-[0.571] flex gap-6 p-8">
              
              {/* Main Question Area */}
              
              {/* Main Question Area */}
              <div className="flex-1 bg-white dark:bg-[#1B212C] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-end">
                  <div className="relative">
                    <h2 className="text-xl font-bold text-[#2d6a4f] dark:text-emerald-500">Question 1 of 3</h2>
                    <div className="absolute -bottom-5 left-0 w-full h-[2px] bg-[#2d6a4f] dark:bg-emerald-500" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1 rounded">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      59:54
                    </div>
                    <button className="bg-[#2d6a4f] text-white px-4 py-2 rounded-lg font-bold text-sm">
                      Submit Test
                    </button>
                  </div>
                </div>

                {/* Question Body */}
                <div className="p-8 flex-1">
                  <div className="text-right text-xs font-bold text-slate-400 mb-4 tracking-widest">GENERAL</div>
                  <p className="text-[17px] leading-relaxed text-slate-800 dark:text-slate-200 mb-8 font-medium">
                    Chloe Barnett, aged 25 years, attends for her first Cervical Screening Test. She is asymptomatic and has no relevant medical history. She opts for a clinician-collected sample. The result returns 'HPV not detected'. What is the MOST appropriate management?
                  </p>

                  <div className="space-y-3">
                    {/* Option A */}
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 text-emerald-600 font-bold flex items-center justify-center shrink-0">A</div>
                      <span className="font-medium">Discharge her from the screening program</span>
                    </div>

                    {/* Option B */}
                    <motion.div 
                      animate={{
                        borderColor: step >= 3 ? "#10B981" : step >= 2 ? "#3b82f6" : "rgba(226, 232, 240, 1)", // emerald-500, blue-500, slate-200
                        backgroundColor: step >= 3 ? "rgba(16, 185, 129, 0.05)" : step >= 2 ? "rgba(59, 130, 246, 0.05)" : "transparent",
                      }}
                      className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors duration-300"
                    >
                      <motion.div 
                        animate={{
                          backgroundColor: step >= 3 ? "#10B981" : step >= 2 ? "#3b82f6" : "transparent",
                          borderColor: step >= 3 ? "#10B981" : step >= 2 ? "#3b82f6" : "#10B981",
                          color: step >= 2 ? "#fff" : "#059669"
                        }}
                        className="w-8 h-8 rounded-full border-2 text-emerald-600 font-bold flex items-center justify-center shrink-0 transition-colors"
                      >
                        B
                      </motion.div>
                      <span className="font-medium">Repeat the Cervical Screening Test in five years</span>
                    </motion.div>

                    {/* Option C */}
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 text-emerald-600 font-bold flex items-center justify-center shrink-0">C</div>
                      <span className="font-medium">Repeat the Cervical Screening Test in three years</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                  <button className="text-slate-400 font-bold text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Clear Response
                  </button>
                  <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 font-bold text-sm">
                      &larr; Previous
                    </button>
                    <button className="px-5 py-2.5 rounded-lg bg-[#2d6a4f] text-white font-bold text-sm">
                      Next &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-[280px] bg-white dark:bg-[#1B212C] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center relative">
                 <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-widest mb-10">YOUR PROGRESS</h3>
                 
                 {/* Circle Chart */}
                 <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-100 dark:text-slate-800" />
                      <motion.circle 
                        cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" 
                        strokeLinecap="round"
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: step >= 3 ? 251.2 - (251.2 * 0.33) : 251.2 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="text-emerald-500" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">
                        {step >= 3 ? "33%" : "0%"}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Answered</span>
                    </div>
                 </div>

                 {/* Legend */}
                 <div className="w-full space-y-3 mb-10">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" /> Answered
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      <div className="w-3 h-3 rounded-full bg-rose-400" /> Not Answered
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" /> Not Visited
                    </div>
                 </div>

                 {/* Navigator */}
                 <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-8 flex gap-3 justify-center">
                    <motion.div 
                      animate={{ 
                        backgroundColor: step >= 3 ? "#10B981" : "transparent",
                        borderColor: step >= 3 ? "#10B981" : "#F43F5E",
                        color: step >= 3 ? "white" : "#F43F5E"
                      }}
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors duration-500"
                    >
                      1
                    </motion.div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-sm">2</div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-sm">3</div>
                 </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
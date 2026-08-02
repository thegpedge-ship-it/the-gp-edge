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

const phaseVariants = {
  enter: { opacity: 0, scale: 0.98, filter: "blur(4px)" },
  center: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 1.02, filter: "blur(4px)", transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

const questions = [
  {
    index: 0,
    label: "Question 1 of 3",
    category: "GENERAL PRACTICE",
    text: "Olivia Barrett, aged 25 years, attends for her first Cervical Screening Test. She is asymptomatic and has no relevant medical history. She opts for a clinician-collected sample. The result returns HPV not detected. What is the MOST appropriate management?",
    options: [
      { id: "A", text: "Discharge her from the screening program" },
      { id: "B", text: "Repeat the Cervical Screening Test in five years" },
      { id: "C", text: "Repeat the Cervical Screening Test in three years" },
    ],
    correctId: "B",
    isCorrect: true,
  },
  {
    index: 1,
    label: "Question 2 of 3",
    category: "CARDIOLOGY",
    text: "A 68-year-old man presents with progressive exertional dyspnoea and bilateral ankle oedema. His BNP is markedly elevated. Echo shows LVEF of 35%. Which medication reduces mortality in this patient?",
    options: [
      { id: "A", text: "Furosemide" },
      { id: "B", text: "Ramipril" },
      { id: "C", text: "Digoxin" },
    ],
    correctId: "B",
    isCorrect: true,
  },
];

export default function ExamPrepSimulation() {
  const [scope, animate] = useAnimate();
  const [phase, setPhase] = useState(0); // 0: Selection, 1: Instructions, 2: Questions, 3: Success

  // Phase 1 (Selection) state
  const [isRetakeHovered, setIsRetakeHovered] = useState(false);

  // Phase 2 (Instructions) state
  const [instructionsChecked, setInstructionsChecked] = useState(false);
  const [startHovered, setStartHovered] = useState(false);

  // Phase 3 (Questions) state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);

  // Phase 4 (Success) state
  const [scoreCounter, setScoreCounter] = useState(0);

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

      // --- RESET ALL STATE ---
      setPhase(0);
      setIsRetakeHovered(false);
      setInstructionsChecked(false);
      setStartHovered(false);
      setQuestionIndex(0);
      setSelectedOption(null);
      setAnsweredCount(0);
      setProgressPct(0);
      setIsSubmitHovered(false);
      setScoreCounter(0);

      // Hide cursor initially
      safeAnimate("#prep-cursor", { x: "250px", y: "300px", opacity: 0, scale: 1 }, { duration: 0 });
      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;

      // ==========================================
      // PHASE 1: SELECTION
      // ==========================================
      // Cursor glides to 'Retake' button on the first card
      await safeAnimate(
        "#prep-cursor",
        { x: ["250px", "60px"], y: ["300px", "145px"], opacity: [0, 1] },
        { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      setIsRetakeHovered(true);
      await new Promise((r) => setTimeout(r, 400));
      if (!isMounted) return;

      // Click
      await safeAnimate("#prep-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      if (!isMounted) return;

      // Transition to Phase 2
      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setPhase(1);
      await new Promise((r) => setTimeout(r, 1000));
      if (!isMounted) return;

      // ==========================================
      // PHASE 2: INSTRUCTIONS
      // ==========================================
      // Cursor glides to Checkbox
      await safeAnimate(
        "#prep-cursor",
        { x: ["60px", "-160px"], y: ["145px", "80px"], opacity: [0, 1] },
        { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      // Click checkbox
      await safeAnimate("#prep-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      setInstructionsChecked(true);
      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;

      // Cursor glides to Start Test button
      await safeAnimate(
        "#prep-cursor",
        { x: ["-160px", "160px"], y: ["80px", "165px"] },
        { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      setStartHovered(true);
      await new Promise((r) => setTimeout(r, 300));
      if (!isMounted) return;

      // Click Start Test
      await safeAnimate("#prep-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      if (!isMounted) return;

      // Transition to Phase 3
      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setPhase(2);
      await new Promise((r) => setTimeout(r, 1000));
      if (!isMounted) return;

      // ==========================================
      // PHASE 3: QUESTIONS (Q1)
      // ==========================================
      // Cursor glides to Option B
      await safeAnimate(
        "#prep-cursor",
        { x: ["160px", "20px"], y: ["165px", "148px"], opacity: [0, 1] },
        { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      // Click Option B
      await safeAnimate("#prep-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      setSelectedOption("B");
      setAnsweredCount(1);
      setProgressPct(50);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMounted) return;

      // Cursor glides to Next button
      await safeAnimate(
        "#prep-cursor",
        { x: ["20px", "120px"], y: ["148px", "225px"] },
        { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      // Click Next
      await safeAnimate("#prep-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      if (!isMounted) return;

      // Next Question
      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setQuestionIndex(1);
      setSelectedOption(null);
      await new Promise((r) => setTimeout(r, 1000));
      if (!isMounted) return;

      // ==========================================
      // PHASE 3: QUESTIONS (Q2)
      // ==========================================
      // Cursor glides to Option B
      await safeAnimate(
        "#prep-cursor",
        { x: ["120px", "20px"], y: ["225px", "148px"], opacity: [0, 1] },
        { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      // Click Option B
      await safeAnimate("#prep-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      setSelectedOption("B");
      setAnsweredCount(2);
      setProgressPct(100);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMounted) return;

      // Cursor glides to Submit Test button
      await safeAnimate(
        "#prep-cursor",
        { x: ["20px", "60px"], y: ["148px", "-160px"] },
        { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
      );
      if (!isMounted) return;

      setIsSubmitHovered(true);
      await new Promise((r) => setTimeout(r, 300));
      if (!isMounted) return;

      // Click Submit Test
      await safeAnimate("#prep-cursor", { scale: [1, 0.85, 1] }, { duration: 0.15, ease: "easeInOut" });
      if (!isMounted) return;

      // Transition to Phase 4 (Success)
      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setPhase(3);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMounted) return;

      // ==========================================
      // PHASE 4: SUCCESS SCREEN
      // ==========================================
      // Animate score counter
      for (let i = 0; i <= 88; i += 4) {
        if (!isMounted) return;
        setScoreCounter(i);
        await new Promise((r) => setTimeout(r, 30));
      }
      setScoreCounter(88);

      // Hold on success screen
      await new Promise((r) => setTimeout(r, 4000));
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

  const currentQ = questions[questionIndex];
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const strokeDash = ((progressPct / 100) * circ).toFixed(1);

  return (
    <motion.div
      ref={scope}
      variants={cardVariants}
      className="col-span-12 lg:col-span-7 relative bg-white dark:bg-[#1B212C] rounded-3xl overflow-hidden cursor-pointer border border-slate-200 dark:border-[rgba(255,255,255,0.07)] shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:border-slate-300 dark:hover:border-[rgba(90,200,176,0.25)] active:scale-[0.99] transition-all duration-300 h-[500px] flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        {/* PHASE 0: SELECTION */}
        {phase === 0 && (
          <motion.div
            key="phase0"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-sans text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Mock Tests</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Continue where you left off or start a new simulation.</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">AKT</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">KFP</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                isRetakeHovered
                  ? "border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/10 shadow-lg shadow-teal-500/10 -translate-y-1"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              }`}>
                {isRetakeHovered && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                )}
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">COMPLETED</span>
                  <span className="text-[10px] text-slate-400">Best: 85%</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 relative z-10">RACGP AKT Full Mock 1</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 relative z-10">150 Questions • 4 Hours</p>
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-medium text-slate-400">Attempted 2d ago</span>
                  <button className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                    isRetakeHovered ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    Retake
                  </button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">IN PROGRESS</span>
                  <span className="text-[10px] text-slate-400">32%</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">RACGP KFP Mini Mock</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">26 Cases • 1.5 Hours</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400">Last saved 1h ago</span>
                  <button className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500 text-white">
                    Resume
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PHASE 1: INSTRUCTIONS */}
        {phase === 1 && (
          <motion.div
            key="phase1"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex flex-col p-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-slate-100 mb-0.5">Test Instructions</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">RACGP AKT Full Mock 1</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Questions</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">150</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">240 Mins</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Marks</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">150</p>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
              <p className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">•</span>
                The clock will be set at the server. The countdown timer at the top will display the remaining time available for you to complete the examination.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">•</span>
                Click on one of the options to select your answer. To change your answer, simply click on another desired option.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">•</span>
                You can save a question for review later by leaving it unselected and moving to the next.
              </p>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
              <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                instructionsChecked ? "bg-teal-50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800/50" : "bg-slate-50 dark:bg-slate-800/50 border-transparent"
              }`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  instructionsChecked ? "bg-teal-500 border-teal-500 text-white" : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                }`}>
                  {instructionsChecked && (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-[11px] font-medium ${instructionsChecked ? "text-teal-700 dark:text-teal-400" : "text-slate-600 dark:text-slate-400"}`}>
                  I have read and understood the instructions.
                </span>
              </div>

              <div className="flex justify-end gap-3">
                <button className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Go Back
                </button>
                <button className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                  instructionsChecked 
                    ? startHovered ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20" : "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 opacity-70"
                }`}>
                  Start Test
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: QUESTIONS */}
        {phase === 2 && (
          <motion.div
            key="phase2"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex"
          >
            {/* LEFT — Question Interface */}
            <div className="flex-1 flex flex-col p-5 border-r border-slate-100 dark:border-slate-800 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{currentQ.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">03:59:54</span>
                  <button className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
                    isSubmitHovered ? "bg-red-600 text-white" : "bg-teal-500 text-white"
                  }`}>
                    Submit Test
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-700 mb-3" />
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{currentQ.category}</p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={questionIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 min-h-0"
                >
                  <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 mb-4">{currentQ.text}</p>
                  <div className="space-y-2">
                    {currentQ.options.map((opt) => {
                      const isSelected = selectedOption === opt.id;
                      let rowCls = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300";
                      let circleCls = "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400";

                      if (isSelected) {
                        rowCls = "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.12)]";
                        circleCls = "border-teal-500 bg-teal-500 text-white";
                      }

                      return (
                        <div key={opt.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[11px] font-medium transition-all duration-200 ${rowCls}`}>
                          <span className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${circleCls}`}>{opt.id}</span>
                          <span className="leading-snug">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button className="text-[10px] text-slate-400">☐ Clear Response</button>
                <div className="flex items-center gap-2">
                  <button className="text-[10px] text-slate-400">← Previous</button>
                  <button className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-teal-500 text-white">Next →</button>
                </div>
              </div>
            </div>

            {/* RIGHT — Progress Sidebar */}
            <div className="w-[130px] flex-shrink-0 flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Your Progress</p>
              <div className="relative w-20 h-20 mb-4">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-700" />
                  <motion.circle
                    cx="40" cy="40" r={radius} fill="none" stroke="#14b8a6" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circ}
                    animate={{ strokeDashoffset: circ - Number(strokeDash) }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{progressPct}%</span>
                </div>
              </div>
              <div className="space-y-1.5 w-full mb-5">
                {[
                  { label: "Answered", color: "bg-teal-500", count: answeredCount },
                  { label: "Not Answered", color: "bg-rose-400", count: Math.max(0, 2 - answeredCount) },
                ].map(({ label, color, count }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 flex-1">{label}</span>
                    <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">{count}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap justify-center">
                {[0, 1].map((i) => {
                  const isActive = i === questionIndex;
                  const isAns = i < answeredCount || (i === questionIndex && selectedOption !== null);
                  return (
                    <motion.div
                      key={i}
                      animate={{ scale: isActive ? 1.1 : 1 }}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold border transition-all duration-200 ${
                        isAns ? "bg-teal-500 border-teal-500 text-white" : isActive ? "bg-white border-teal-400 text-teal-600" : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      {i + 1}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* PHASE 3: SUCCESS */}
        {phase === 3 && (
          <motion.div
            key="phase3"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/20 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4 text-teal-500"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Test Submitted Successfully</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6">RACGP AKT Full Mock 1</p>

              <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-5 mb-6">
                <div className="flex flex-col items-center pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Score</span>
                  <div className="flex items-baseline gap-1 text-teal-500">
                    <span className="text-4xl font-black tabular-nums">{scoreCounter}</span>
                    <span className="text-lg font-bold">%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100 dark:divide-slate-700">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correct</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">132 / 150</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attempted</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">148 / 150</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">2h 45m</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Download Report
                </button>
                <button className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-500 shadow-md shadow-teal-500/20 hover:bg-teal-600 transition-colors">
                  Back to Exam Prep
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mac-style cursor (Persists across phases) */}
      <motion.div
        id="prep-cursor"
        className="absolute pointer-events-none z-50"
        style={{ left: "50%", top: "50%" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
            fill="#1e293b"
            stroke="#fff"
            strokeWidth="1.5"
            style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

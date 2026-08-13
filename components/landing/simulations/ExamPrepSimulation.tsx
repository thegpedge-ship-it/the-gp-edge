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
  center: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 1.02, filter: "blur(4px)", transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
};

interface Question {
  index: number;
  label: string;
  category: string;
  text: string;
  options: { id: string; text: string }[];
  correctId: string;
}

const questions: Question[] = [
  {
    index: 0,
    label: "Question 1 of 3",
    category: "GENERAL PRACTICE",
    text: "Olivia Barrett, aged 25 years, attends for her first Cervical Screening Test. She is asymptomatic with no relevant history. The result returns HPV not detected. What is the MOST appropriate management?",
    options: [
      { id: "A", text: "Discharge from screening program" },
      { id: "B", text: "Repeat Cervical Screening Test in 5 years" },
      { id: "C", text: "Repeat Cervical Screening Test in 3 years" },
      { id: "D", text: "Co-test with cytology in 12 months" },
    ],
    correctId: "B",
  },
  {
    index: 1,
    label: "Question 2 of 3",
    category: "CARDIOLOGY",
    text: "A 68-year-old man presents with progressive exertional dyspnoea and ankle oedema. Echo reveals an LVEF of 35%. Which medication reduces long-term mortality in this patient?",
    options: [
      { id: "A", text: "Furosemide 40mg daily" },
      { id: "B", text: "Ramipril 2.5mg daily" },
      { id: "C", text: "Digoxin 125mcg daily" },
      { id: "D", text: "Amlodipine 5mg daily" },
    ],
    correctId: "B",
  },
  {
    index: 2,
    label: "Question 3 of 3",
    category: "ENDOCRINOLOGY",
    text: "A 52-year-old woman with T2DM has HbA1c 8.2% despite Metformin 1000mg BD. She has documented ischemic heart disease. Which agent is recommended next?",
    options: [
      { id: "A", text: "Gliclazide MR 30mg daily" },
      { id: "B", text: "Empagliflozin 10mg daily" },
      { id: "C", text: "Sitagliptin 100mg daily" },
      { id: "D", text: "Acarbose 50mg TID" },
    ],
    correctId: "B",
  },
];

export default function ExamPrepSimulation() {
  const [scope, animate] = useAnimate();

  // Phases matching exact 7-stage Exam Prep lifecycle:
  // 0: Exam Prep / Mock Selection Hub
  // 1: Test Instructions Page
  // 2: Preparing / Loading Questions Screen
  // 3: Live Question Interface
  // 4: Submit Test Confirmation Popup Modal
  // 5: Test Results / Submitted Successfully Page
  const [phase, setPhase] = useState<number>(0);

  // Interaction states
  const [isRetakeHovered, setIsRetakeHovered] = useState(false);
  const [instructionsChecked, setInstructionsChecked] = useState(false);
  const [startHovered, setStartHovered] = useState(false);

  const [loadProgress, setLoadProgress] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [hoveredOpt, setHoveredOpt] = useState<string | null>(null);
  const [isNextHovered, setIsNextHovered] = useState(false);
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
  const [isConfirmHovered, setIsConfirmHovered] = useState(false);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [scoreCounter, setScoreCounter] = useState(0);

  // Manual interaction handlers
  const handleSelectOption = (optId: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: optId }));
  };

  const handleClearResponse = () => {
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionIndex];
      return copy;
    });
  };

  const handleNextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  const handlePrevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    }
  };

  // Derived metrics
  const answeredCount = Object.keys(userAnswers).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  // Helper function to dynamically calculate target element coordinates relative to container
  const getTargetCoords = (elementId: string) => {
    if (!scope.current) return null;
    const container = scope.current.getBoundingClientRect();
    const target = scope.current.querySelector(`#${elementId}`);
    if (!target) return null;
    const targetRect = target.getBoundingClientRect();

    // Center offset of target relative to container center (0,0)
    const x = targetRect.left + targetRect.width / 2 - (container.left + container.width / 2);
    const y = targetRect.top + targetRect.height / 2 - (container.top + container.height / 2);
    return { x, y };
  };

  // Auto-play animation loop with dynamic DOM-based target positioning
  useEffect(() => {
    let isMounted = true;

    const safeAnimate = async (selector: string, keyframes: any, options: any) => {
      if (!isMounted || !scope.current) return;
      const el = scope.current.querySelector(selector);
      if (!el) return;
      return animate(selector, keyframes, options);
    };

    const glideTo = async (elementId: string, duration = 0.65) => {
      if (!isMounted) return;
      const coords = getTargetCoords(elementId);
      if (!coords) return;
      return safeAnimate(
        "#prep-cursor",
        { x: coords.x, y: coords.y, opacity: 1 },
        { duration, ease: [0.22, 1, 0.36, 1] }
      );
    };

    const triggerClick = async () => {
      if (!isMounted) return;
      // Trigger subtle ripple ring + cursor click bounce
      safeAnimate("#prep-cursor-ripple", { opacity: [0, 0.7, 0], scale: [0.4, 1.8, 2.2] }, { duration: 0.35 });
      await safeAnimate("#prep-cursor", { scale: [1, 0.8, 1] }, { duration: 0.15, ease: "easeInOut" });
    };

    const runAnimation = async () => {
      if (!isMounted || !scope.current) return;

      // Reset states
      setPhase(0);
      setIsRetakeHovered(false);
      setInstructionsChecked(false);
      setStartHovered(false);
      setLoadProgress(0);
      setQuestionIndex(0);
      setUserAnswers({});
      setHoveredOpt(null);
      setIsNextHovered(false);
      setIsSubmitHovered(false);
      setIsConfirmHovered(false);
      setShowSubmitModal(false);
      setScoreCounter(0);

      // Hide cursor initially at bottom right
      safeAnimate("#prep-cursor", { x: 240, y: 220, opacity: 0, scale: 1 }, { duration: 0 });
      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;

      // ==========================================
      // STAGE 0: MOCK SELECTION -> Glide to Retake Button
      // ==========================================
      setIsRetakeHovered(true);
      await glideTo("btn-retake", 0.75);
      if (!isMounted) return;

      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;

      await triggerClick();
      if (!isMounted) return;

      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setPhase(1); // Go to Instructions
      await new Promise((r) => setTimeout(r, 700));
      if (!isMounted) return;

      // ==========================================
      // STAGE 1: INSTRUCTIONS -> Glide to Checkbox
      // ==========================================
      await glideTo("checkbox-agree", 0.65);
      if (!isMounted) return;

      await new Promise((r) => setTimeout(r, 200));
      if (!isMounted) return;

      await triggerClick();
      setInstructionsChecked(true);
      await new Promise((r) => setTimeout(r, 450));
      if (!isMounted) return;

      // Glide to 'Start Test' button
      setStartHovered(true);
      await glideTo("btn-start-test", 0.65);
      if (!isMounted) return;

      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;

      await triggerClick();
      if (!isMounted) return;

      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setPhase(2); // Go to Loading Screen

      // ==========================================
      // STAGE 2: LOADING / PREPARING QUESTIONS
      // ==========================================
      for (let p = 0; p <= 100; p += 10) {
        if (!isMounted) return;
        setLoadProgress(p);
        await new Promise((r) => setTimeout(r, 70));
      }
      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;

      setPhase(3); // Go to Live Questions (Q1)
      await new Promise((r) => setTimeout(r, 700));
      if (!isMounted) return;

      // ==========================================
      // STAGE 3: QUESTION 1 -> Glide to Option B row
      // ==========================================
      setHoveredOpt("B");
      await glideTo("opt-B", 0.7);
      if (!isMounted) return;

      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;

      await triggerClick();
      setUserAnswers((prev) => ({ ...prev, 0: "B" }));
      setHoveredOpt(null);
      await new Promise((r) => setTimeout(r, 550));
      if (!isMounted) return;

      // Glide to 'Next →' button
      setIsNextHovered(true);
      await glideTo("btn-next", 0.65);
      if (!isMounted) return;

      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;

      await triggerClick();
      setIsNextHovered(false);
      if (!isMounted) return;

      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setQuestionIndex(1); // Move to Q2
      await new Promise((r) => setTimeout(r, 800));
      if (!isMounted) return;

      // ==========================================
      // STAGE 3: QUESTION 2 -> Glide to Option B row
      // ==========================================
      setHoveredOpt("B");
      await glideTo("opt-B", 0.7);
      if (!isMounted) return;

      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;

      await triggerClick();
      setUserAnswers((prev) => ({ ...prev, 1: "B" }));
      setHoveredOpt(null);
      await new Promise((r) => setTimeout(r, 550));
      if (!isMounted) return;

      // Glide to 'Submit Test' header button
      setIsSubmitHovered(true);
      await glideTo("btn-submit-header", 0.7);
      if (!isMounted) return;

      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;

      await triggerClick();
      setIsSubmitHovered(false);
      if (!isMounted) return;

      // ==========================================
      // STAGE 4: SUBMIT CONFIRMATION POPUP OVERLAY
      // ==========================================
      setShowSubmitModal(true);
      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      await new Promise((r) => setTimeout(r, 650));
      if (!isMounted) return;

      // Glide cursor directly to 'Confirm & Submit' button inside modal
      setIsConfirmHovered(true);
      await glideTo("btn-confirm-submit", 0.65);
      if (!isMounted) return;

      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;

      await triggerClick();
      setIsConfirmHovered(false);
      if (!isMounted) return;

      setShowSubmitModal(false);
      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setPhase(5); // Go to Results Page
      await new Promise((r) => setTimeout(r, 650));
      if (!isMounted) return;

      // ==========================================
      // STAGE 5: RESULTS SCREEN -> Animate Score
      // ==========================================
      for (let i = 0; i <= 88; i += 4) {
        if (!isMounted) return;
        setScoreCounter(i);
        await new Promise((r) => setTimeout(r, 25));
      }
      setScoreCounter(88);

      await glideTo("btn-back-to-prep", 0.7);
      if (!isMounted) return;

      await new Promise((r) => setTimeout(r, 3500));
      if (!isMounted) return;

      runAnimation();
    };

    const timeout = setTimeout(runAnimation, 600);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [animate]);

  const currentQ = questions[questionIndex];
  const selectedOpt = userAnswers[questionIndex] || null;
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const strokeDash = ((progressPct / 100) * circ).toFixed(1);

  return (
    <motion.div
      ref={scope}
      variants={cardVariants}
      className="w-full relative bg-white dark:bg-[#1B212C] rounded-3xl overflow-hidden cursor-pointer border border-slate-200 dark:border-[rgba(255,255,255,0.07)] shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:border-slate-300 dark:hover:border-[rgba(90,200,176,0.25)] active:scale-[0.99] transition-all duration-300 h-[500px] flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        {/* STAGE 0: EXAM PREP MOCK SELECTION */}
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
              <div
                id="card-mock-1"
                onClick={() => setPhase(1)}
                className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  isRetakeHovered
                    ? "border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/10 shadow-lg shadow-teal-500/10 -translate-y-1"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                }`}
              >
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
                  <button
                    id="btn-retake"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhase(1);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      isRetakeHovered ? "bg-teal-500 text-white shadow-md shadow-teal-500/20 scale-105" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Retake
                  </button>
                </div>
              </div>

              {/* Card 2 */}
              <div
                onClick={() => setPhase(1)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-amber-400/60 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">IN PROGRESS</span>
                  <span className="text-[10px] text-slate-400">32%</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">RACGP KFP Mini Mock</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">26 Cases • 1.5 Hours</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400">Last saved 1h ago</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhase(1);
                    }}
                    className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                  >
                    Resume
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STAGE 1: TEST INSTRUCTIONS PAGE */}
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
              <div
                id="checkbox-agree"
                onClick={() => setInstructionsChecked(!instructionsChecked)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  instructionsChecked ? "bg-teal-50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800/50" : "bg-slate-50 dark:bg-slate-800/50 border-transparent"
                }`}
              >
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
                <button
                  onClick={() => setPhase(0)}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  id="btn-start-test"
                  onClick={() => {
                    if (instructionsChecked) setPhase(2);
                  }}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                    instructionsChecked 
                      ? startHovered ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20 scale-105" : "bg-teal-500 text-white shadow-md shadow-teal-500/20 cursor-pointer"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 opacity-70 cursor-not-allowed"
                  }`}
                >
                  Start Test
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STAGE 2: PREPARING YOUR QUESTIONS / LOADING PAGE */}
        {phase === 2 && (
          <motion.div
            key="phase2"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/60"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-md">
                <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 01-1.183-1.875V5.016A2 2 0 015.6 3.141l2.387.477a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.477A2 2 0 0120 4.777v8.776a2 2 0 01-.572 1.875z" />
                </svg>
              </div>
            </div>

            <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Preparing Your Questions</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mb-6">Fetching question bank &amp; configuring exam conditions...</p>

            <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
              <motion.div
                className="bg-teal-500 h-full rounded-full"
                animate={{ width: `${loadProgress}%` }}
                transition={{ ease: "easeInOut" }}
              />
            </div>
            <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">{loadProgress}% Complete</span>
          </motion.div>
        )}

        {/* STAGE 3: ACTUAL EXAM / QUESTION GIVING INTERFACE */}
        {phase === 3 && (
          <motion.div
            key="phase3"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex relative"
          >
            {/* LEFT — Question Interface */}
            <div className="flex-1 flex flex-col p-5 border-r border-slate-100 dark:border-slate-800 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{currentQ.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">03:59:54</span>
                  <button
                    id="btn-submit-header"
                    onClick={() => setShowSubmitModal(true)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      isSubmitHovered ? "bg-red-600 text-white shadow-md shadow-red-500/20 scale-105" : "bg-teal-500 text-white hover:bg-teal-600"
                    }`}
                  >
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
                      const isSelected = selectedOpt === opt.id;
                      const isHovered = hoveredOpt === opt.id;
                      let rowCls = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-teal-300 dark:hover:border-teal-700";
                      let circleCls = "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400";

                      if (isSelected) {
                        rowCls = "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.12)]";
                        circleCls = "border-teal-500 bg-teal-500 text-white";
                      } else if (isHovered) {
                        rowCls = "border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-900/10 text-teal-800 dark:text-teal-200";
                      }

                      return (
                        <div
                          key={opt.id}
                          id={`opt-${opt.id}`}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[11px] font-medium transition-all duration-200 cursor-pointer ${rowCls}`}
                        >
                          <span className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${circleCls}`}>{opt.id}</span>
                          <span className="leading-snug">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={handleClearResponse}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  ☐ Clear Response
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevQuestion}
                    disabled={questionIndex === 0}
                    className={`text-[10px] transition-colors ${questionIndex === 0 ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"}`}
                  >
                    ← Previous
                  </button>
                  <button
                    id="btn-next"
                    onClick={handleNextQuestion}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg text-white transition-all cursor-pointer ${
                      isNextHovered ? "bg-teal-600 shadow-md shadow-teal-500/20 scale-105" : "bg-teal-500 hover:bg-teal-600"
                    }`}
                  >
                    {questionIndex === questions.length - 1 ? "Submit →" : "Next →"}
                  </button>
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
                  { label: "Not Answered", color: "bg-rose-400", count: questions.length - answeredCount },
                ].map(({ label, color, count }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 flex-1">{label}</span>
                    <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">{count}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap justify-center">
                {questions.map((q, i) => {
                  const isActive = i === questionIndex;
                  const isAns = !!userAnswers[i];
                  return (
                    <motion.div
                      key={i}
                      onClick={() => setQuestionIndex(i)}
                      animate={{ scale: isActive ? 1.1 : 1 }}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold border transition-all duration-200 cursor-pointer ${
                        isAns ? "bg-teal-500 border-teal-500 text-white" : isActive ? "bg-white border-teal-400 text-teal-600" : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      {i + 1}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* STAGE 4: SUBMIT TEST CONFIRMATION POPUP OVERLAY */}
            {showSubmitModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-200 dark:border-slate-700 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-sans text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Submit Examination?</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                    You have answered {answeredCount} of {questions.length} questions. Are you sure you want to finish and submit your exam now?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSubmitModal(false)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-submit"
                      onClick={() => {
                        setShowSubmitModal(false);
                        setPhase(5);
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                        isConfirmHovered ? "bg-teal-600 shadow-md shadow-teal-500/20 scale-105" : "bg-teal-500 hover:bg-teal-600"
                      }`}
                    >
                      Confirm &amp; Submit
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STAGE 5: TEST RESULT / SUBMITTED SUCCESSFULLY PAGE */}
        {phase === 5 && (
          <motion.div
            key="phase5"
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
                <button
                  onClick={() => setPhase(0)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Download Report
                </button>
                <button
                  id="btn-back-to-prep"
                  onClick={() => setPhase(0)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-500 shadow-md shadow-teal-500/20 hover:bg-teal-600 transition-colors cursor-pointer"
                >
                  Back to Exam Prep
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Mac-style Mouse Cursor with Click Ripple Ring */}
      <motion.div
        id="prep-cursor"
        className="absolute pointer-events-none z-50 flex items-center justify-center"
        style={{ left: "50%", top: "50%" }}
      >
        {/* Click ripple circle */}
        <motion.div
          id="prep-cursor-ripple"
          className="absolute w-8 h-8 rounded-full border-2 border-teal-500 bg-teal-400/30 opacity-0 pointer-events-none"
        />

        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="relative z-10 drop-shadow-md">
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

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useAnimate } from "framer-motion";
import {
  LibraryBig,
  ClipboardList,
  FilePenLine,
  BookCheck,
  ArrowRight,
  Info,
  CheckCircle2,
  Clock,
  Bookmark,
  FileText,
  RotateCcw,
  Download,
} from "lucide-react";

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

const BARS = [
  { color: "bg-slate-200 dark:bg-slate-700", minH: 6, maxH: 14, delay: 0.1 },
  { color: "bg-slate-200 dark:bg-slate-700", minH: 10, maxH: 22, delay: 0.2 },
  { color: "bg-slate-300 dark:bg-slate-600", minH: 14, maxH: 28, delay: 0.3 },
  { color: "bg-[#1B895C] dark:bg-teal-400", minH: 18, maxH: 36, delay: 0.0 },
  { color: "bg-slate-300 dark:bg-slate-600", minH: 14, maxH: 28, delay: 0.3 },
  { color: "bg-slate-200 dark:bg-slate-700", minH: 10, maxH: 22, delay: 0.2 },
  { color: "bg-slate-200 dark:bg-slate-700", minH: 6, maxH: 14, delay: 0.1 },
];

const STAGES = [
  { key: "connecting", label: "Connecting" },
  { key: "fetching", label: "Fetching Questions" },
  { key: "preparing", label: "Preparing Test" },
  { key: "ready", label: "Almost Ready" },
];

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
    label: "Question 1 of 5",
    category: "GENERAL",
    text: "Grade: Medium Vanessa Crowe, aged 44 years, has a history of biopsy-confirmed adenocarcinoma in situ (AIS) and undergoes a total hysterectomy. The hysterectomy specimen itself is clear of disease. What is the MOST appropriate follow-up?",
    options: [
      { id: "A", text: "A single exit co-test" },
      { id: "B", text: "Annual co-tests until two consecutive tests are both negative" },
      { id: "C", text: "Annual HPV testing until two consecutive negative results" },
    ],
    correctId: "B",
  },
  {
    index: 1,
    label: "Question 2 of 5",
    category: "CARDIOLOGY",
    text: "A 68-year-old man presents with progressive exertional dyspnoea and ankle oedema. Echo reveals an LVEF of 35%. Which medication reduces long-term mortality in this patient?",
    options: [
      { id: "A", text: "Furosemide 40mg daily" },
      { id: "B", text: "Ramipril 2.5mg daily" },
      { id: "C", text: "Spironolactone 25mg daily" },
    ],
    correctId: "B",
  },
];

export default function ExamPrepSimulation() {
  const [scope, animate] = useAnimate();

  // Lifecycle Stages:
  // 0: Exam Prep Hub Page (Image 1)
  // 1: Test Instructions Screen
  // 2: Exam Loading Screen (Image 2)
  // 3: Live Question Interface
  // 4: Submit Confirmation Modal
  // 5: Test Submitted Successfully Page
  const [phase, setPhase] = useState<number>(0);

  // States
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [instructionsChecked, setInstructionsChecked] = useState(false);
  const [startHovered, setStartHovered] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [hoveredOpt, setHoveredOpt] = useState<string | null>(null);
  const [isNextHovered, setIsNextHovered] = useState(false);
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
  const [isConfirmHovered, setIsConfirmHovered] = useState(false);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [scoreCounter, setScoreCounter] = useState(0);

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

  const toggleFlagged = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionIndex)) next.delete(questionIndex);
      else next.add(questionIndex);
      return next;
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

  const answeredCount = Object.keys(userAnswers).length;
  const totalCount = 5;
  const progressPct = Math.round((answeredCount / totalCount) * 100);

  // Helper to dynamically calculate target element coordinates
  const getTargetCoords = (elementId: string) => {
    if (!scope.current) return null;
    const container = scope.current.getBoundingClientRect();
    const target = scope.current.querySelector(`#${elementId}`);
    if (!target) return null;
    const targetRect = target.getBoundingClientRect();

    const x = targetRect.left + targetRect.width / 2 - (container.left + container.width / 2);
    const y = targetRect.top + targetRect.height / 2 - (container.top + container.height / 2);
    return { x, y };
  };

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
      safeAnimate("#prep-cursor-ripple", { opacity: [0, 0.7, 0], scale: [0.4, 1.8, 2.2] }, { duration: 0.35 });
      await safeAnimate("#prep-cursor", { scale: [1, 0.8, 1] }, { duration: 0.15, ease: "easeInOut" });
    };

    const runAnimation = async () => {
      if (!isMounted || !scope.current) return;

      // Reset to Image 1 Hub starting state
      setPhase(0);
      setIsCardHovered(false);
      setInstructionsChecked(false);
      setStartHovered(false);
      setLoadingStage(0);
      setQuestionIndex(0);
      setUserAnswers({});
      setFlagged(new Set());
      setHoveredOpt(null);
      setIsNextHovered(false);
      setIsSubmitHovered(false);
      setIsConfirmHovered(false);
      setShowSubmitModal(false);
      setScoreCounter(0);

      safeAnimate("#prep-cursor", { x: 180, y: 160, opacity: 0, scale: 1 }, { duration: 0 });
      await new Promise((r) => setTimeout(r, 700));
      if (!isMounted) return;

      // STAGE 0: Image 1 -> Cursor glides to Card 2 ("Do a Mock Test") & clicks it
      setIsCardHovered(true);
      await glideTo("hub-card-mock", 0.75);
      if (!isMounted) return;
      await new Promise((r) => setTimeout(r, 300));
      if (!isMounted) return;
      await triggerClick();
      if (!isMounted) return;
      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setPhase(1); // Instructions
      await new Promise((r) => setTimeout(r, 700));
      if (!isMounted) return;

      // STAGE 1: Instructions -> Check checkbox & click Start Test
      await glideTo("checkbox-agree", 0.65);
      if (!isMounted) return;
      await new Promise((r) => setTimeout(r, 200));
      if (!isMounted) return;
      await triggerClick();
      setInstructionsChecked(true);
      await new Promise((r) => setTimeout(r, 400));
      if (!isMounted) return;

      setStartHovered(true);
      await glideTo("btn-start-test", 0.65);
      if (!isMounted) return;
      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;
      await triggerClick();
      if (!isMounted) return;
      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setPhase(2); // Loading (Image 2)

      // STAGE 2: Image 2 Loading Stepper Animation
      setLoadingStage(0);
      await new Promise((r) => setTimeout(r, 450));
      if (!isMounted) return;
      setLoadingStage(1);
      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;
      setLoadingStage(2);
      await new Promise((r) => setTimeout(r, 550));
      if (!isMounted) return;
      setLoadingStage(3);
      await new Promise((r) => setTimeout(r, 400));
      if (!isMounted) return;

      setPhase(3); // Live Question
      await new Promise((r) => setTimeout(r, 700));
      if (!isMounted) return;

      // STAGE 3 Q1: Select Option B -> Click Next
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

      setIsNextHovered(true);
      await glideTo("btn-next", 0.65);
      if (!isMounted) return;
      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;
      await triggerClick();
      setIsNextHovered(false);
      if (!isMounted) return;

      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      setQuestionIndex(1);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMounted) return;

      // STAGE 3 Q2: Select Option B -> Click Submit Test
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

      setIsSubmitHovered(true);
      await glideTo("btn-submit-header", 0.7);
      if (!isMounted) return;
      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;
      await triggerClick();
      setIsSubmitHovered(false);
      if (!isMounted) return;

      // STAGE 4: Modal popup -> Click Confirm & Submit
      setShowSubmitModal(true);
      safeAnimate("#prep-cursor", { opacity: 0 }, { duration: 0.2 });
      await new Promise((r) => setTimeout(r, 650));
      if (!isMounted) return;

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
      setPhase(5);
      await new Promise((r) => setTimeout(r, 650));
      if (!isMounted) return;

      // STAGE 5: Results screen score animation
      for (let i = 0; i <= 40; i += 4) {
        if (!isMounted) return;
        setScoreCounter(i);
        await new Promise((r) => setTimeout(r, 30));
      }
      setScoreCounter(40);

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

  const currentQ = questions[questionIndex] || questions[0];
  const selectedOpt = userAnswers[questionIndex] || null;

  return (
    <motion.div
      ref={scope}
      variants={cardVariants}
      className="w-full relative bg-white dark:bg-[#151b23] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[370px] max-h-[400px] flex flex-col justify-between select-none"
    >
      <AnimatePresence mode="wait">
        {/* STAGE 0: EXAM PREP HUB PAGE */}
        {phase === 0 && (
          <motion.div
            key="phase0"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex flex-col p-5 sm:p-6 bg-white dark:bg-[#151b23] justify-center items-center my-auto"
          >
            {/* Header Section */}
            <div className="text-center mb-5">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                What's your <span className="text-[#1B895C] dark:text-[#34d399]">study plan</span> today?
              </h2>
              <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 mt-2.5 text-xs font-semibold">
                <span className="px-4 py-1 rounded-lg bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs">AKT</span>
                <span className="px-4 py-1 rounded-lg text-slate-500 dark:text-slate-400">KFP</span>
              </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {/* Card 1: Study by Topic */}
              <div className="flex flex-col text-left rounded-2xl p-4 sm:p-4.5 bg-white dark:bg-[#151b23] border border-slate-100 dark:border-slate-800 shadow-xs border-b-4 border-b-[#1B895C]">
                <div className="flex items-start justify-between mb-3">
                  <LibraryBig className="w-6 h-6 text-slate-900 dark:text-slate-100" strokeWidth={1.75} />
                  <span className="font-serif text-base font-medium text-[#1B895C] opacity-80">01</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <h3 className="font-sans text-xs sm:text-sm font-bold text-[#1B895C] dark:text-[#34d399]">Study by Topic</h3>
                  <Info className="w-3 h-3 text-slate-400" />
                </div>
                <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Browse subjects and subtopics, then take a focused quiz.
                </p>
                <div className="flex justify-end mt-auto">
                  <ArrowRight className="w-3.5 h-3.5 text-[#1B895C]" strokeWidth={2} />
                </div>
              </div>

              {/* Card 2: Do a Mock Test (Targeted by Cursor) */}
              <div
                id="hub-card-mock"
                onClick={() => setPhase(1)}
                className={`flex flex-col text-left rounded-2xl p-4 sm:p-4.5 bg-white dark:bg-[#151b23] border shadow-xs border-b-4 border-b-[#1B895C] cursor-pointer transition-all duration-300 ${
                  isCardHovered
                    ? "border-[#1B895C] dark:border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 -translate-y-0.5 shadow-md"
                    : "border-slate-100 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <ClipboardList className="w-6 h-6 text-slate-900 dark:text-slate-100" strokeWidth={1.75} />
                  <span className="font-serif text-base font-medium text-[#1B895C] opacity-80">02</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <h3 className="font-sans text-xs sm:text-sm font-bold text-[#1B895C] dark:text-[#34d399]">Do a Mock Test</h3>
                  <Info className="w-3 h-3 text-slate-400" />
                </div>
                <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Sit a full exam-condition simulation from start to finish.
                </p>
                <div className="flex justify-end mt-auto">
                  <ArrowRight className="w-3.5 h-3.5 text-[#1B895C]" strokeWidth={2} />
                </div>
              </div>

              {/* Card 3: Create Your Own Quiz */}
              <div className="flex flex-col text-left rounded-2xl p-4 sm:p-4.5 bg-white dark:bg-[#151b23] border border-slate-100 dark:border-slate-800 shadow-xs border-b-4 border-b-[#1B895C]">
                <div className="flex items-start justify-between mb-3">
                  <FilePenLine className="w-6 h-6 text-slate-900 dark:text-slate-100" strokeWidth={1.75} />
                  <span className="font-serif text-base font-medium text-[#1B895C] opacity-80">03</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <h3 className="font-sans text-xs sm:text-sm font-bold text-[#1B895C] dark:text-[#34d399]">Create Your Own Quiz</h3>
                  <Info className="w-3 h-3 text-slate-400" />
                </div>
                <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Pick your topics and rules to build a custom quiz.
                </p>
                <div className="flex justify-end mt-auto">
                  <ArrowRight className="w-3.5 h-3.5 text-[#1B895C]" strokeWidth={2} />
                </div>
              </div>

              {/* Card 4: Created for You */}
              <div className="flex flex-col text-left rounded-2xl p-4 sm:p-4.5 bg-white dark:bg-[#151b23] border border-slate-100 dark:border-slate-800 shadow-xs border-b-4 border-b-[#1B895C]">
                <div className="flex items-start justify-between mb-3">
                  <BookCheck className="w-6 h-6 text-slate-900 dark:text-slate-100" strokeWidth={1.75} />
                  <span className="font-serif text-base font-medium text-[#1B895C] opacity-80">04</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <h3 className="font-sans text-xs sm:text-sm font-bold text-[#1B895C] dark:text-[#34d399]">Created for You</h3>
                  <Info className="w-3 h-3 text-slate-400" />
                </div>
                <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Jump into a ready-made mixed quiz across every topic.
                </p>
                <div className="flex justify-end mt-auto">
                  <ArrowRight className="w-3.5 h-3.5 text-[#1B895C]" strokeWidth={2} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STAGE 1: TEST INSTRUCTIONS */}
        {phase === 1 && (
          <motion.div
            key="phase1"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex flex-col p-4 sm:p-5 bg-white dark:bg-[#151b23] border-t-4 border-[#1B895C] justify-between min-h-[370px]"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div>
                  <h2 className="font-serif text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">TEST INSTRUCTIONS</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TEST: Akt</p>
                </div>
                <div className="flex items-center gap-3 text-center">
                  <div>
                    <span className="block text-sm font-extrabold text-slate-900 dark:text-slate-100">5</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">QUESTIONS</span>
                  </div>
                  <div>
                    <span className="block text-sm font-extrabold text-slate-900 dark:text-slate-100">60 min</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">DURATION</span>
                  </div>
                  <div>
                    <span className="block text-sm font-extrabold text-slate-900 dark:text-slate-100">5</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">MARKS</span>
                  </div>
                </div>
              </div>

              <p className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase mb-1.5">READ CAREFULLY BEFORE YOU BEGIN</p>
              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 mb-3">
                <p><strong className="text-slate-800 dark:text-slate-200">01</strong> The timer starts when you click <strong>"Start Test"</strong> and counts down in the top bar.</p>
                <p><strong className="text-slate-800 dark:text-slate-200">02</strong> Each question has <strong>one correct answer</strong>. Select an option to answer a question.</p>
                <p><strong className="text-slate-800 dark:text-slate-200">03</strong> Use <strong>"Next"</strong> or select a question number from the palette to navigate.</p>
              </div>

              <p className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase mb-1.5">QUESTION PALETTE COLOURS</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-2">
                  <span className="w-4.5 h-4.5 rounded bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Answered</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 flex items-center gap-2">
                  <span className="w-4.5 h-4.5 rounded bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <div>
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Not Answered</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2">
                  <span className="w-4.5 h-4.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">1</span>
                  <div>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Not Visited</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div
                id="checkbox-agree"
                onClick={() => setInstructionsChecked(!instructionsChecked)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  instructionsChecked ? "bg-[#1B895C] border-[#1B895C] text-white" : "border-slate-300 bg-white"
                }`}>
                  {instructionsChecked && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  I have read and understood the instructions.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setPhase(0)} className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50">
                  ← Go Back
                </button>
                <button
                  id="btn-start-test"
                  onClick={() => instructionsChecked && setPhase(2)}
                  className={`px-4 py-1 text-xs font-bold rounded-xl text-white transition-all ${
                    instructionsChecked
                      ? "bg-[#1B895C] hover:bg-[#156e49] shadow-md shadow-emerald-600/20 cursor-pointer"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Start Test →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STAGE 2: LOADING SCREEN */}
        {phase === 2 && (
          <motion.div
            key="phase2"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-[#151b23] text-center select-none min-h-[370px]"
          >
            {/* 1. Centered GP Edge Logo */}
            <div className="mb-4">
              <Image
                src="/assets/logo.png"
                alt="GP Edge"
                width={52}
                height={52}
                priority
                className="w-13 h-13 object-contain"
              />
            </div>

            {/* 2. Waveform Equalizer Bars */}
            <div className="flex items-center justify-center gap-1.5 h-8 mb-4">
              {BARS.map((bar, i) => (
                <motion.div
                  key={i}
                  className={`w-1 rounded-full ${bar.color}`}
                  initial={{ height: bar.minH }}
                  animate={{ height: [bar.minH, bar.maxH, bar.minH] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: bar.delay,
                  }}
                />
              ))}
            </div>

            {/* 3. Title */}
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
              Preparing your questions
            </h2>

            {/* 4. Subtle Line - Dot - Line Divider */}
            <div className="flex items-center gap-2 my-2">
              <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#1B895C]" />
              <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* 5. Subtitle */}
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">
              Please wait while we load your test.
            </p>

            {/* 6. 4-Stage Progress Indicator */}
            <div className="w-full max-w-sm">
              <div className="relative flex items-center justify-between mb-2">
                <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200 dark:bg-slate-800 z-0" />
                <motion.div
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-[2px] bg-[#1B895C] z-0"
                  animate={{
                    width: `${(loadingStage / (STAGES.length - 1)) * 94}%`,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />

                {STAGES.map((st, idx) => {
                  const isCompleted = idx < loadingStage;
                  const isCurrent = idx === loadingStage;

                  return (
                    <div key={st.key} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCurrent
                            ? "border-2 border-[#1B895C] bg-white dark:bg-slate-900 ring-4 ring-emerald-500/15"
                            : isCompleted
                            ? "border-2 border-[#1B895C] bg-[#1B895C] text-white"
                            : "border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {isCurrent && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1B895C]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between w-full text-[10px] sm:text-[11px]">
                {STAGES.map((st, idx) => {
                  const isActive = idx <= loadingStage;
                  return (
                    <span
                      key={st.key}
                      className={`font-medium transition-colors duration-200 ${
                        idx === 0
                          ? "text-left"
                          : idx === STAGES.length - 1
                          ? "text-right"
                          : "text-center"
                      } ${
                        isActive
                          ? "text-[#1B895C] dark:text-teal-400 font-semibold"
                          : "text-slate-400"
                      }`}
                      style={{ width: "25%" }}
                    >
                      {st.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* STAGE 3: LIVE QUESTION INTERFACE */}
        {phase === 3 && (
          <motion.div
            key="phase3"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex p-4 sm:p-5 bg-white dark:bg-[#151b23] gap-4 min-h-[370px]"
          >
            <div className="flex-1 flex flex-col justify-between min-w-0 h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sans text-sm font-bold text-slate-900 dark:text-slate-100">{currentQ.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>59:43</span>
                    </div>
                    <button
                      id="btn-submit-header"
                      onClick={() => setShowSubmitModal(true)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                        isSubmitHovered ? "bg-teal-700 scale-105" : "bg-[#1B895C]"
                      }`}
                    >
                      Submit Test
                    </button>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-[#1B895C] h-full rounded-full w-1/5" />
                </div>

                <div className="flex justify-end mb-1.5">
                  <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md">
                    {currentQ.category}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 mb-2.5 text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                  {currentQ.text}
                </div>

                <div className="space-y-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedOpt === opt.id;
                    const isHovered = hoveredOpt === opt.id;

                    return (
                      <div
                        key={opt.id}
                        id={`opt-${opt.id}`}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#1B895C] bg-teal-50/60 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 shadow-xs"
                            : isHovered
                            ? "border-teal-300 dark:border-teal-800 bg-teal-50/20"
                            : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[#1B895C] border-[#1B895C] text-white"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50 dark:bg-slate-800"
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button onClick={handleClearResponse} className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer">
                    <RotateCcw className="w-3.5 h-3.5" /> Clear Response
                  </button>
                  <button onClick={toggleFlagged} className="text-slate-400 hover:text-amber-600 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer">
                    <Bookmark className={`w-3.5 h-3.5 ${flagged.has(questionIndex) ? "fill-amber-500 text-amber-500" : ""}`} /> Mark for Review
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevQuestion}
                    disabled={questionIndex === 0}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                      questionIndex === 0
                        ? "border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700 cursor-not-allowed"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    ← Previous
                  </button>
                  <button
                    id="btn-next"
                    onClick={handleNextQuestion}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                      isNextHovered ? "bg-teal-700 scale-105" : "bg-[#1B895C] hover:bg-[#156e49]"
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-32 shrink-0 border-l border-slate-100 dark:border-slate-800 pl-3 flex flex-col items-center justify-between py-1 h-full">
              <div className="flex flex-col items-center w-full">
                <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase mb-2">YOUR PROGRESS</span>

                <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="6" fill="none" />
                    <circle cx="40" cy="40" r="32" className="stroke-[#1B895C]" strokeWidth="6" strokeLinecap="round" fill="none" strokeDasharray="201" strokeDashoffset={201 - (progressPct / 100) * 201} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">{progressPct}%</span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase">ANSWERED</span>
                  </div>
                </div>

                <div className="space-y-1 w-full text-[9px] font-medium text-slate-500 dark:text-slate-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    <span>Marked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span>Not Visited</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 w-full">
                {[1, 2, 3, 4, 5].map((num, i) => {
                  const isCurrent = i === questionIndex;
                  const isAns = !!userAnswers[i];
                  const isMk = flagged.has(i);

                  let bgCls = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
                  if (isMk) bgCls = "bg-purple-600 text-white border-purple-600";
                  else if (isAns) bgCls = "bg-emerald-500 text-white border-emerald-500";

                  return (
                    <button
                      key={num}
                      onClick={() => setQuestionIndex(i)}
                      className={`w-5 h-5 rounded-lg border text-[9px] font-bold flex items-center justify-center transition-all ${bgCls} ${
                        isCurrent ? "ring-2 ring-[#1B895C] ring-offset-1" : ""
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STAGE 4: SUBMIT CONFIRMATION MODAL OVERLAY */}
            {showSubmitModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
                >
                  <h4 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Submit Test?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    You have answered {answeredCount} of {totalCount} questions. Are you sure you want to finish and submit?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSubmitModal(false)}
                      className="flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-submit"
                      onClick={() => {
                        setShowSubmitModal(false);
                        setPhase(5);
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold text-white transition-all ${
                        isConfirmHovered ? "bg-teal-700 scale-105" : "bg-[#1B895C] hover:bg-[#156e49]"
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

        {/* STAGE 5: TEST SUBMITTED SUCCESSFULLY PAGE (FULL WIDTH UTILIZATION) */}
        {phase === 5 && (
          <motion.div
            key="phase5"
            variants={phaseVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex flex-col items-center justify-between p-5 sm:p-6 bg-white dark:bg-[#151b23] text-center min-h-[370px]"
          >
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs my-auto">
              <div className="flex items-center justify-center gap-2 text-[#1B895C] dark:text-teal-400 mb-4">
                <CheckCircle2 className="w-5.5 h-5.5" />
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Test Submitted Successfully</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex flex-col items-center border-r-0 sm:border-r border-slate-100 dark:border-slate-800 sm:pr-4">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase mb-1 tracking-wider">YOUR SCORE</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="6" fill="none" />
                      <circle cx="40" cy="40" r="32" className="stroke-[#1B895C]" strokeWidth="6" strokeLinecap="round" fill="none" strokeDasharray="201" strokeDashoffset={201 - (scoreCounter / 100) * 201} />
                    </svg>
                    <span className="absolute text-lg font-extrabold text-slate-900 dark:text-white">{scoreCounter}%</span>
                  </div>
                </div>

                <div className="space-y-2 text-left sm:pl-2">
                  <div className="flex items-center gap-2.5 text-xs">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Correct</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">0 / 5</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Attempted</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">2 / 5</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Time Taken</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">00:34</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button className="flex-1 py-2 rounded-xl text-xs font-bold text-[#1B895C] border border-[#1B895C] hover:bg-teal-50 dark:hover:bg-teal-950/30 flex items-center justify-center gap-1.5 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download Report
                </button>
                <button
                  id="btn-back-to-prep"
                  onClick={() => setPhase(0)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-[#1B895C] hover:bg-[#156e49] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  Back to Exam Prep →
                </button>
              </div>
            </div>

            <div className="w-full max-w-xl p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Your detailed report has been generated and is ready for download.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mac-style Cursor */}
      <motion.div
        id="prep-cursor"
        className="absolute pointer-events-none z-50 flex items-center justify-center"
        style={{ left: "50%", top: "50%" }}
      >
        <motion.div
          id="prep-cursor-ripple"
          className="absolute w-8 h-8 rounded-full border-2 border-[#1B895C] bg-teal-400/30 opacity-0 pointer-events-none"
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

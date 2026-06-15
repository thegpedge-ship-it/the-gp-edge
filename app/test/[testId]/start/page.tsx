"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { consumeTestAuthorization, fetchTestQuestions, resolveTestConfig } from "@/lib/testSession";
import type { TestConfig } from "@/lib/testSession";
import type { Question } from "@/lib/quizData";
import TestNotFound from "@/components/test/TestNotFound";

type QuestionStatus = "answered" | "not-answered" | "not-visited";

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function paletteClasses(status: QuestionStatus, isCurrent: boolean): string {
  const base =
    "w-9 h-9 rounded-full border text-[12px] font-bold flex items-center justify-center transition-all duration-150 hover:scale-110";
  const ring = isCurrent ? " ring-2 ring-emerald-600 ring-offset-2 dark:ring-offset-slate-900" : "";
  switch (status) {
    case "answered":
      return `${base} bg-emerald-500 border-emerald-500 text-white${ring}`;
    case "not-answered":
      return `${base} bg-red-400 border-red-400 text-white${ring}`;
    default:
      return `${base} bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400${ring}`;
  }
}

/* Full-screen zoomable image viewer. Opens at the image's natural size
   (capped to the viewport), supports wheel / button zoom and drag-to-pan. */
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const MIN = 1;
  const MAX = 6;
  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => {
      const next = clamp(s + delta);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomBy(0.5);
      else if (e.key === "-") zoomBy(-0.5);
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, zoomBy, reset]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.4 : -0.4);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.baseX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.baseY + (e.clientY - dragRef.current.startY),
    });
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => zoomBy(-0.5)}
          title="Zoom out (-)"
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <span className="min-w-[3.5rem] text-center text-[12px] font-semibold text-white tabular-nums">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => zoomBy(0.5)}
          title="Zoom in (+)"
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <button
          onClick={reset}
          title="Reset (0)"
          className="px-3 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onClose}
          title="Close (Esc)"
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-[92vw] max-h-[88vh] overflow-hidden rounded-xl"
        onWheel={onWheel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Question illustration enlarged"
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={() => (scale > 1 ? reset() : zoomBy(1))}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
            transition: dragging ? "none" : "transform 0.12s ease-out",
          }}
          className="block max-w-[92vw] max-h-[88vh] object-contain select-none touch-none"
        />
      </motion.div>
    </motion.div>
  );
}

export default function TestPage() {
  const router = useRouter();
  const { testId } = useParams<{ testId: string }>();
  // undefined = resolving, null = unknown/locked test
  const [config, setConfig] = useState<TestConfig | null | undefined>(undefined);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);

  /* Resolve the test from its ID — URL params are never trusted.
     Opening this page directly (without coming through the instructions
     page) has no start authorization and bounces back to instructions.
     The ref guard keeps StrictMode's double effect run from consuming
     the one-time pass twice and bouncing a legitimate entry. */
  const authCheckedRef = useRef(false);
  useEffect(() => {
    if (authCheckedRef.current) return;
    authCheckedRef.current = true;
    if (!consumeTestAuthorization(testId)) {
      router.replace(`/test/${testId}/instructions`);
      return;
    }
    setConfig(resolveTestConfig(testId));
  }, [testId, router]);

  /* Close the image lightbox whenever the question changes */
  useEffect(() => {
    setLightboxOpen(false);
  }, [current]);

  /* Fetch questions once the test is resolved */
  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    setTimeLeft(config.durationMinutes * 60);
    fetchTestQuestions(config.questionCount).then((qs) => {
      if (!cancelled) {
        setQuestions(qs);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [config]);

  const handleSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setShowConfirm(false);
    setSubmitted(true);
  }, []);

  /* Countdown timer — auto-submit at zero */
  useEffect(() => {
    if (loading || submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, submitted, handleSubmit]);

  const goTo = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    setCurrent(index);
    setVisited((prev) => new Set(prev).add(index));
  };

  const selectOption = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [current]: optionIndex }));
  };

  const clearResponse = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[current];
      return next;
    });
  };

  const getStatus = (index: number): QuestionStatus => {
    if (answers[index] !== undefined) return "answered";
    if (visited.has(index)) return "not-answered";
    return "not-visited";
  };

  const answeredCount = Object.keys(answers).length;
  const notAnsweredCount = Array.from(visited).filter((i) => answers[i] === undefined).length;
  const notVisitedCount = questions.length - visited.size;

  /* ─── Resolving / unknown test ───────────────────────────────────── */
  if (config === undefined) return null;
  if (config === null) return <TestNotFound />;

  /* ─── Loading state ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 dark:border-emerald-900/40 border-t-emerald-500 animate-spin" />
        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Fetching your questions&hellip;</p>
      </div>
    );
  }

  /* ─── Result screen after submission ─────────────────────────────── */
  if (submitted) {
    const correct = questions.reduce(
      (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
      0
    );
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center"
        >
          <div className="px-8 pt-8 pb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Test Submitted</h1>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{config.name}</p>
            <p className="text-5xl font-bold text-emerald-600 dark:text-emerald-400 mt-6">{score}%</p>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">Your Score</p>
          </div>
          <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2">
            <div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none">{correct}</p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Correct</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">{answeredCount}</p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Attempted</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">{formatTime(config.durationMinutes * 60 - timeLeft)}</p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Time Used</p>
            </div>
          </div>
          <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={() => router.push("/exam-prep")}
              className="w-full px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[14px] font-bold shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              Back to Exam Prep
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const question = questions[current];
  const selectedOption = answers[current];

  /* ─── Test screen ────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* ── Top bar: test name · timer · submit ───────────────────── */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between gap-4">
        <h1 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate">{config.name}</h1>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-[14px] font-bold tabular-nums ${
              timeLeft <= 60
                ? "border-red-200 bg-red-50 text-red-500 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-bold shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* ── Body: 60-40 split ─────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left 60% — question + options + navigation */}
        <div className="w-[60%] flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Question {current + 1} of {questions.length}
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {question.topic}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-100 font-medium">
                  {question.text}
                </p>

                {question.image && (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    title="Click to enlarge and zoom"
                    className="group relative mt-4 block w-fit rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={question.image}
                      alt="Question illustration"
                      className="max-h-64 object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                    />
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                      Click to zoom
                    </span>
                  </button>
                )}

                <div className="mt-6 space-y-3">
                  {question.options.map((option, i) => {
                    const isSelected = selectedOption === i;
                    return (
                      <button
                        key={i}
                        onClick={() => selectOption(i)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[14px] transition-all duration-150 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 font-semibold shadow-sm shadow-emerald-500/10"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10"
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 w-7 h-7 rounded-full border text-[12px] font-bold flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom navigation */}
          <div className="flex-shrink-0 px-8 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between">
            <button
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              className={`px-5 py-2 rounded-lg border text-[13px] font-semibold transition-all duration-200 ${
                current === 0
                  ? "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              }`}
            >
              &larr; Previous
            </button>

            <button
              onClick={clearResponse}
              disabled={selectedOption === undefined}
              className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors duration-200 ${
                selectedOption === undefined
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400"
              }`}
            >
              Clear Response
            </button>

            <button
              onClick={() => goTo(current + 1)}
              disabled={current === questions.length - 1}
              className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                current === questions.length - 1
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 hover:-translate-y-0.5"
              }`}
            >
              Next &rarr;
            </button>
          </div>
        </div>

        {/* Right 40% — question palette */}
        <div className="w-[40%] flex flex-col bg-slate-50 dark:bg-slate-950">
          <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-3">Question Palette</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Answered ({answeredCount})
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full bg-red-400" /> Not Answered ({notAnsweredCount})
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" /> Not Visited ({notVisitedCount})
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-2.5">
              {questions.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} className={paletteClasses(getStatus(i), i === current)}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit confirmation modal ─────────────────────────────── */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="px-6 pt-6 pb-4 text-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Submit Test?</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                  You still have <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatTime(timeLeft)}</span> remaining. This action cannot be undone.
                </p>
              </div>
              <div className="px-6 pb-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 py-2.5">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none">{answeredCount}</p>
                  <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Answered</p>
                </div>
                <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 py-2.5">
                  <p className="text-lg font-bold text-red-400 leading-none">{notAnsweredCount}</p>
                  <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Unanswered</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/40 py-2.5">
                  <p className="text-lg font-bold text-slate-500 dark:text-slate-400 leading-none">{notVisitedCount}</p>
                  <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Not Visited</p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                  Keep Working
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-bold shadow-md shadow-emerald-600/20 transition-all duration-200"
                >
                  Yes, Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Question image lightbox ────────────────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && question.image && (
          <ImageLightbox src={question.image} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}


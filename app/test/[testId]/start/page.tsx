"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { consumeTestAuthorization, loadTestPlan, planToConfig } from "@/lib/testSession";
import { CheckCircle2, FileText, Clock, Download, ClipboardList, ArrowRight, Hourglass, AlertCircle, AlertTriangle, HelpCircle, X, Bookmark } from "lucide-react";
import type { TestConfig, TestPlan } from "@/lib/testSession";

function AnimatedScoreCircle({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1300; // 1.3s ease-out animation

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easedProgress * score));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [score]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0">
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 150 150">
          <circle
            cx="75"
            cy="75"
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="11"
            fill="transparent"
          />
          <circle
            cx="75"
            cy="75"
            r={radius}
            className="stroke-emerald-600 dark:stroke-emerald-400 transition-all duration-75 ease-out"
            strokeWidth="11"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            {animatedScore}%
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
            Your Score
          </span>
        </div>
      </div>
    </div>
  );
}
import { getQuestionsByIds, saveQuizAttempt, saveQuestionFeedback } from "@/app/exam-prep/actions";
import type { QuizQuestion, SaveAttemptInput } from "@/app/exam-prep/actions";
import { clearMockTestsCache } from "@/lib/examCache";
import { buildReportData, reportFileName } from "@/lib/report/buildReportData";
import { generateReportBlob } from "@/lib/report/generateReport";
import { saveReport } from "@/lib/report/reportStore";
import TestNotFound from "@/components/test/TestNotFound";
import ExamLoadingScreen from "@/components/exam-prep/ExamLoadingScreen";
import ClockLoader from "@/components/exam-prep/ClockLoader";

type QuestionStatus = "marked" | "answered" | "not-answered" | "not-visited";

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
    "w-8 h-8 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all duration-150 hover:scale-105 cursor-pointer";
  const ring = isCurrent ? " ring-2 ring-teal-600 dark:ring-teal-400 ring-offset-2 dark:ring-offset-slate-900 font-bold" : "";
  switch (status) {
    case "marked":
      return `${base} bg-purple-600 border-purple-600 text-white shadow-xs${ring}`;
    case "answered":
      return `${base} bg-emerald-500 border-emerald-500 text-white shadow-xs${ring}`;
    case "not-answered":
      return `${base} bg-amber-500 border-amber-500 text-white shadow-xs${ring}`;
    default:
      return `${base} bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400${ring}`;
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
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({
      x: dragRef.current.baseX + dx,
      y: dragRef.current.baseY + dy,
    });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragging) return;
    dragRef.current = null;
    setDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => zoomBy(0.5)}
          title="Zoom In (+)"
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold transition-colors"
        >
          +
        </button>
        <button
          onClick={() => zoomBy(-0.5)}
          title="Zoom Out (-)"
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold transition-colors"
        >
          −
        </button>
        <button
          onClick={reset}
          title="Reset zoom (0)"
          className="px-2.5 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-semibold transition-colors"
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

/* Palette contents — progress donut, legend, and the question grid.
   Shared between the desktop sidebar and the mobile slide-in drawer. */
function QuestionPalette({
  progressPercent,
  questions,
  current,
  getStatus,
  onGoTo,
}: {
  progressPercent: number;
  questions: QuizQuestion[];
  current: number;
  getStatus: (index: number) => QuestionStatus;
  onGoTo: (index: number) => void;
}) {
  return (
    <>
      {/* Progress & Legend */}
      <div className="flex-shrink-0 p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col items-center">
        <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-5">Your Progress</h3>

        {/* Circular Progress */}
        <div className="relative w-20 h-20 mb-5">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-teal-500 transition-all duration-500 ease-out"
              strokeDasharray={`${progressPercent}, 100`}
              strokeWidth="2.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-0.5">
            <span className="text-[16px] font-bold text-slate-900 dark:text-slate-100 leading-none">{progressPercent}%</span>
            <span className="text-[8.5px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">Answered</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Answered
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Not Answered
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Marked for Review
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" /> Not Visited
          </div>
        </div>
      </div>

      {/* Scrollable Palette Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((_, i) => (
            <button key={i} onClick={() => onGoTo(i)} className={paletteClasses(getStatus(i), i === current)}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function TestPage() {
  const router = useRouter();
  const { testId } = useParams<{ testId: string }>();
  // undefined = resolving, null = unknown/locked test
  const [config, setConfig] = useState<TestConfig | null | undefined>(undefined);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false); // mobile palette drawer
  const [submitted, setSubmitted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackQuestionIdx, setFeedbackQuestionIdx] = useState(0);
  const [fbWhere, setFbWhere] = useState("");
  const [fbIssue, setFbIssue] = useState("");
  const [fbSuggestedAnswer, setFbSuggestedAnswer] = useState("");
  const [fbDisputedAnswer, setFbDisputedAnswer] = useState("");
  const [timerPaused, setTimerPaused] = useState(false);

  const [reportState, setReportState] = useState<"generating" | "ready" | "error">("generating");
  const reportBlobRef = useRef<Blob | null>(null);
  const reportNameRef = useRef<string>("");
  const reportGenRef = useRef(false);
  const submittedRef = useRef(false);
  const planRef = useRef<TestPlan | null>(null);
  const startedAtRef = useRef<string>("");
  const savedRef = useRef(false);

  /* Latest answers/elapsed/questions, mirrored into a ref so the close/hide
     handlers (registered once, not on every keystroke) always beacon the
     current state rather than a stale snapshot. */
  const liveRef = useRef({ answers, elapsed, questions });
  useEffect(() => {
    liveRef.current = { answers, elapsed, questions };
  });

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
    const plan = loadTestPlan(testId);
    if (!plan) {
      setConfig(null);
      return;
    }
    planRef.current = plan;
    setConfig(planToConfig(plan));
  }, [testId, router]);

  /* Close the image lightbox whenever the question changes */
  useEffect(() => {
    setLightboxOpen(false);
  }, [current]);

  /* Fetch questions once the test is resolved */
  useEffect(() => {
    if (!config) return;
    const plan = planRef.current;
    if (!plan) return;
    let cancelled = false;
    setTimeLeft(config.durationMinutes * 60);
    getQuestionsByIds(plan.questionIds).then((qs) => {
      if (!cancelled) {
        setQuestions(qs);
        startedAtRef.current = new Date().toISOString();
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [config]);

  /* Persist the attempt (summary + stats) once, when the test is submitted. */
  useEffect(() => {
    if (!submitted || savedRef.current) return;
    const plan = planRef.current;
    if (!plan || questions.length === 0) return;
    savedRef.current = true;
    void saveQuizAttempt({
      source: plan.source,
      quizId: plan.quizId,
      subtopicId: plan.subtopicId,
      mockTestId: plan.mockTestId,
      title: plan.name,
      questionIds: questions.map((q) => q.id),
      answers: questions.map((q, i) => ({ questionId: q.id, selectedIndices: answers[i] ?? [] })),
      startedAt: startedAtRef.current || undefined,
      durationSeconds: elapsed,
    })
      .then(() => {
        if (plan.source === "mock_test") clearMockTestsCache();
      })
      .catch(() => {
        /* best-effort — the result screen still shows the client-side score */
      });
  }, [submitted, questions, answers, elapsed]);

  const handleSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setShowConfirm(false);
    setSubmitted(true);
  }, []);

  /* Guaranteed save-on-leave. When the tab is closing/hidden a normal server
     action is torn down with the page before its request lands, so the attempt
     is posted with navigator.sendBeacon — the browser delivers it after the
     page is gone. Marks savedRef so the on-submit save effect below does not
     also run (which would create a duplicate attempt). Idempotent. */
  const sendAttemptBeacon = useCallback(() => {
    if (savedRef.current) return;
    const plan = planRef.current;
    const { answers, elapsed, questions } = liveRef.current;
    if (!plan || questions.length === 0) return;
    savedRef.current = true;

    const payload: SaveAttemptInput = {
      source: plan.source,
      quizId: plan.quizId,
      subtopicId: plan.subtopicId,
      mockTestId: plan.mockTestId,
      title: plan.name,
      questionIds: questions.map((q) => q.id),
      answers: questions.map((q, i) => ({ questionId: q.id, selectedIndices: answers[i] ?? [] })),
      startedAt: startedAtRef.current || undefined,
      durationSeconds: elapsed,
    };

    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon("/api/attempt", blob);

    // Mock-test cards show per-user attempt stats — refresh them next read
    // (the on-submit effect that normally does this is skipped once saved).
    if (plan.source === "mock_test") clearMockTestsCache();
  }, []);

  /* Build the PDF report entirely in the browser and persist it locally
     (IndexedDB, keyed by testId so re-takes overwrite). Nothing is sent to the
     server, the database, or R2. Returns the generated Blob so the caller can
     also offer a download. Reuses an already-generated report if present. */
  const generateAndStore = useCallback(async (): Promise<Blob> => {
    if (reportBlobRef.current) return reportBlobRef.current;
    const plan = planRef.current;
    const report = buildReportData({
      testName: config?.name ?? plan?.name ?? "Test",
      questions,
      answers,
      timeUsedSeconds: elapsed,
    });
    const blob = await generateReportBlob(report);
    reportBlobRef.current = blob;
    reportNameRef.current = reportFileName(report.testName);
    await saveReport({
      testId,
      testName: report.testName,
      scorePercent: report.scorePercent,
      createdAt: new Date().toISOString(),
      blob,
    });
    return blob;
  }, [config, questions, answers, elapsed, testId]);

  /* Compulsory: as soon as the test is submitted, generate the report and save
     it to IndexedDB in the background — regardless of whether the user ever
     downloads it. This is what makes "View Report" available afterwards. */
  useEffect(() => {
    if (!submitted || reportGenRef.current) return;
    const plan = planRef.current;
    if (!plan || questions.length === 0) return;
    reportGenRef.current = true;
    setReportState("generating");
    generateAndStore()
      .then(() => setReportState("ready"))
      .catch(() => setReportState("error"));
  }, [submitted, questions, generateAndStore]);

  /* Downloading is entirely the user's choice — the file is already saved
     locally by the effect above; this just hands them a copy. */
  const handleDownloadReport = useCallback(async () => {
    try {
      const blob = reportBlobRef.current ?? (await generateAndStore());
      setReportState("ready");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = reportNameRef.current || "report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setReportState("error");
    }
  }, [generateAndStore]);

  /* Countdown timer — auto-submit at zero. Mock tests only. Pauses when
     the feedback modal is open (timerPaused). */
  useEffect(() => {
    if (loading || submitted || !config?.timed || timerPaused) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimedOut(true);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, submitted, handleSubmit, config, timerPaused]);

  /* Elapsed count-up — tracks time used for the result screen on every test.
     Also pauses when feedback modal is open on timed tests. */
  useEffect(() => {
    if (loading || submitted || (timerPaused && config?.timed)) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [loading, submitted, timerPaused, config]);

  /* ─── Exam lockdown: no leaving mid-test ──────────────────────────────
     Active only while a test is in progress (cleans up the moment it is
     submitted, so the result screen and its "Back to Exam Prep" button
     navigate normally):
       • Browser Back is trapped — a Back press keeps the user in the exam
         rather than navigating away (there is no in-app back button here).
       • Closing/reloading the tab, or switching away from it, auto-submits the
         exam so the attempt is recorded and the end screen is shown. Closing
         also raises the browser's native "leave?" prompt so an accidental
         close can still be cancelled. */
  useEffect(() => {
    if (loading || submitted || config == null) return;

    // Trap Back: seed a history entry, then re-push on every popstate so a Back
    // press can never pop the user out of the running exam.
    window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    // Native close/reload warning: tells the user leaving will submit the exam,
    // and lets an accidental close be cancelled. Modern browsers show their own
    // generic wording and ignore this text, but the API still requires
    // returnValue to be set for the prompt to appear at all.
    const LEAVE_MESSAGE =
      "If you leave now your exam will be submitted automatically. Are you sure?";
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = LEAVE_MESSAGE;
      return LEAVE_MESSAGE;
    };

    // Leaving the tab (closing, minimising, or switching away) is treated as
    // leaving the exam: beacon the attempt so it is saved even if the page is
    // being destroyed, then flip to the end screen. Both are idempotent.
    const leave = () => {
      sendAttemptBeacon();
      handleSubmit();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") leave();
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", leave);
    };
  }, [loading, submitted, config, handleSubmit, sendAttemptBeacon]);

  const goTo = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    setCurrent(index);
    setVisited((prev) => new Set(prev).add(index));
  };

  const selectOption = (optionIndex: number) => {
    const q = questions[current];
    if (!q) return;
    const isKft = (q.examType || "").toUpperCase() === "KFT" || (q.examType || "").toUpperCase() === "KFP";
    const maxSelectable = isKft
      ? (q.kftCorrectCount || q.kfpCorrectCount || q.correctIndices?.length || 3)
      : 1;

    if (maxSelectable <= 1) {
      setAnswers((prev) => ({ ...prev, [current]: [optionIndex] }));
      return;
    }

    setAnswers((prev) => {
      const existing = prev[current] ?? [];
      if (existing.includes(optionIndex)) {
        const next = existing.filter((i) => i !== optionIndex);
        if (next.length === 0) {
          const copy = { ...prev };
          delete copy[current];
          return copy;
        }
        return { ...prev, [current]: next };
      }
      if (existing.length >= maxSelectable) return prev;
      return { ...prev, [current]: [...existing, optionIndex].sort((a, b) => a - b) };
    });
  };

  const clearResponse = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[current];
      return next;
    });
  };

  const openFeedback = () => {
    setFeedbackQuestionIdx(current);
    setFeedbackText("");
    setFbWhere("");
    setFbIssue("");
    setFbSuggestedAnswer("");
    setFbDisputedAnswer("");
    setFeedbackOpen(true);
    if (config?.timed) setTimerPaused(true);
  };

  const closeFeedback = () => {
    setFeedbackOpen(false);
    if (config?.timed) setTimerPaused(false);
  };

  const feedbackExamType: "AKT" | "KFP" = (() => {
    if (config?.examMode === "KFP") return "KFP";
    const q = questions[feedbackQuestionIdx];
    const et = (q?.examType || "").toUpperCase();
    return (et === "KFP" || et === "KFT") ? "KFP" : "AKT";
  })();

  const fbQuestion = questions[feedbackQuestionIdx];
  const fbOptionCount = fbQuestion?.options?.length ?? 0;

  const fbWhereOptions = [
    { value: "stem", label: "Stem" },
    { value: "lead_in", label: "Lead-in" },
    ...Array.from({ length: fbOptionCount }, (_, i) => ({
      value: `option_${String.fromCharCode(97 + i)}`,
      label: `Option ${String.fromCharCode(65 + i)}`,
    })),
    { value: "answer_key", label: "Answer key" },
    { value: "explanation", label: "Explanation" },
    { value: "reference", label: "Reference" },
    { value: "image_table", label: "Image / table" },
  ];

  const fbIssueOptions = feedbackExamType === "AKT"
    ? [
        { value: "keyed_answer_wrong", label: "Keyed answer wrong" },
        { value: "more_than_one_defensible", label: "More than one defensible answer" },
        { value: "no_correct_option", label: "No correct option" },
        { value: "out_of_date", label: "Out of date" },
        { value: "drug_error", label: "Drug error" },
        { value: "stem_ambiguous", label: "Stem ambiguous" },
        { value: "explanation_contradicts_key", label: "Explanation contradicts key" },
        { value: "poor_distractor", label: "Poor distractor" },
        { value: "typo", label: "Typo" },
      ]
    : [
        { value: "schedule_wrong", label: "Schedule of answers wrong / incorrect" },
        { value: "more_than_one_defensible", label: "More than one defensible answer" },
        { value: "no_correct_option", label: "No correct option" },
        { value: "out_of_date", label: "Out of date" },
        { value: "drug_error", label: "Drug error" },
        { value: "stem_ambiguous_or_inconsistent", label: "Stem ambiguous or case data inconsistent" },
        { value: "explanation_contradicts_key", label: "Explanation contradicts key" },
        { value: "typo", label: "Typo" },
      ];

  const fbCanSubmit =
    fbWhere !== "" &&
    fbIssue !== "" &&
    (feedbackExamType !== "AKT" || fbIssue !== "keyed_answer_wrong" || fbSuggestedAnswer !== "") &&
    (feedbackExamType !== "KFP" || fbIssue !== "schedule_wrong" || fbDisputedAnswer.trim() !== "");

  const submitFeedback = async () => {
    const q = questions[feedbackQuestionIdx];
    if (!q || !fbCanSubmit) return;
    setFeedbackSubmitting(true);
    await saveQuestionFeedback({
      questionId: q.id,
      examType: feedbackExamType,
      issueWhere: fbWhere,
      issueType: fbIssue,
      suggestedAnswer: feedbackExamType === "AKT" && fbIssue === "keyed_answer_wrong" ? fbSuggestedAnswer : undefined,
      disputedAnswer: feedbackExamType === "KFP" && fbIssue === "schedule_wrong" ? fbDisputedAnswer.trim() : undefined,
      comment: feedbackText.trim() || undefined,
    });
    setFeedbackSubmitting(false);
    closeFeedback();
  };

  const toggleFlagged = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(current)) next.delete(current);
      else next.add(current);
      return next;
    });
  };

  const getStatus = (index: number): QuestionStatus => {
    if (flagged.has(index)) return "marked";
    if (answers[index] !== undefined && answers[index].length > 0) return "answered";
    if (visited.has(index)) return "not-answered";
    return "not-visited";
  };

  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length;
  const notAnsweredCount = Array.from(visited).filter((i) => !answers[i] || answers[i].length === 0).length;
  const notVisitedCount = questions.length - visited.size;

  /* ─── Resolving / unknown test ───────────────────────────────────── */
  // Resolving and fetching are one continuous wait to the user, so both show
  // the same screen — previously this returned null and flashed blank first.
  if (config === undefined) return <ExamLoadingScreen title="Preparing your test" />;
  if (config === null) return <TestNotFound />;

  /* ─── Loading state ──────────────────────────────────────────────── */
  if (loading) return <ExamLoadingScreen title="Preparing your questions" subtitle="Please wait while we load your test." />;

  /* ─── Result screen after submission ─────────────────────────────── */
  if (submitted) {
    let totalEarnedMarks = 0;
    let totalPossibleMarks = 0;

    questions.forEach((q, i) => {
      const ans = answers[i];
      const isKft = (q.examType || "").toUpperCase() === "KFT" || (q.examType || "").toUpperCase() === "KFP";
      if (isKft) {
        const correctSet = new Set(q.correctIndices && q.correctIndices.length > 0 ? q.correctIndices : [q.correctIndex]);
        const maxMarks = q.kftCorrectCount || q.kfpCorrectCount || q.correctIndices?.length || 1;
        totalPossibleMarks += maxMarks;
        const sel = ans ?? [];
        const earned = sel.filter((idx) => correctSet.has(idx)).length;
        totalEarnedMarks += earned;
      } else {
        totalPossibleMarks += 1;
        const sel = ans ?? [];
        if (sel.includes(q.correctIndex)) {
          totalEarnedMarks += 1;
        }
      }
    });

    const correct = totalEarnedMarks;
    const score = totalPossibleMarks > 0 ? Math.round((totalEarnedMarks / totalPossibleMarks) * 100) : 0;
    return (
      <div className="fixed inset-0 z-50 bg-slate-100/70 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[780px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-9 md:p-10 my-auto flex flex-col gap-6 sm:gap-7"
        >
          {/* 1. Header with Big Dark Standalone Tick Icon (Centered) */}
          <div className="flex items-center justify-center gap-3 sm:gap-3.5 pb-6 border-b border-slate-200 dark:border-slate-700/90 text-center">
            <motion.svg
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-6 h-6 sm:w-7 sm:h-7 text-slate-900 dark:text-slate-100 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
                d="M20 6L9 17L4 12"
              />
            </motion.svg>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              Test Submitted Successfully
            </h1>
          </div>

          {/* 2. Score + Performance Section (Horizontal Layout with Visible Dividers) */}
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_2fr] gap-6 sm:gap-8 items-center py-1">
            
            {/* Left: YOUR SCORE with Centered, Bigger Semi-Circle Gauge */}
            <div className="flex flex-col items-center justify-center text-center md:border-r md:border-slate-200 md:dark:border-slate-700/90 md:pr-8 py-2">
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">
                YOUR SCORE
              </span>

              {/* Enlarged Semi-Circle Progress Gauge */}
              <div className="relative w-52 sm:w-56 h-28 sm:h-30 my-1 flex items-end justify-center">
                <svg className="w-full h-full" viewBox="0 0 140 80">
                  {/* Background Track Arc */}
                  <path
                    d="M 16 72 A 54 54 0 0 1 124 72"
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Dynamic Gradient Green/Teal Filled Arc */}
                  <motion.path
                    d="M 16 72 A 54 54 0 0 1 124 72"
                    fill="none"
                    stroke="url(#score-gauge-gradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="169.65"
                    initial={{ strokeDashoffset: 169.65 }}
                    animate={{
                      strokeDashoffset: 169.65 - (169.65 * (Math.min(100, Math.max(0, score)) / 100)),
                    }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <defs>
                    <linearGradient id="score-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0d9488" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Score Number in balanced size inside the semi-circle */}
                <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl sm:text-[44px] font-black text-slate-950 dark:text-white tracking-tight leading-none">
                    {score}%
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-[220px]">
                Keep practicing to improve your score.
              </p>
            </div>

            {/* Right: 3 Performance Metrics with Clear Partitions */}
            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700/90 text-center">
              
              {/* Correct */}
              <div className="flex flex-col items-center justify-center px-2 sm:px-4">
                <FileText className="w-6 h-6 text-slate-700 dark:text-slate-300" strokeWidth={1.8} />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 mb-2">
                  Correct
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white leading-none">
                  {correct}
                </span>
              </div>

              {/* Attempted */}
              <div className="flex flex-col items-center justify-center px-2 sm:px-4">
                <ClipboardList className="w-6 h-6 text-slate-700 dark:text-slate-300" strokeWidth={1.8} />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 mb-2">
                  Attempted
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white leading-none">
                  {answeredCount}
                </span>
              </div>

              {/* Time Taken */}
              <div className="flex flex-col items-center justify-center px-2 sm:px-4">
                <Clock className="w-6 h-6 text-slate-700 dark:text-slate-300" strokeWidth={1.8} />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 mb-2">
                  Time Taken
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white leading-none tabular-nums">
                  {formatTime(elapsed)}
                </span>
              </div>

            </div>

          </div>

          {/* 3. Action Buttons Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/90">
            <button
              onClick={handleDownloadReport}
              disabled={reportState === "generating"}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-teal-600 dark:border-teal-500 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900 text-sm font-bold hover:bg-teal-50/60 dark:hover:bg-teal-950/30 transition-all duration-150 disabled:opacity-70 disabled:cursor-wait shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" strokeWidth={2} />
              {reportState === "generating" ? "Saving report…" : "Download Report"}
            </button>
            
            <button
              onClick={() => router.push("/exam-prep")}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
            >
              <span>Back to Exam Prep</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* 4. Report Information Strip */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-3.5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400 shrink-0" strokeWidth={1.8} />
            <span>
              {reportState === "error" 
                ? "Couldn't save the report. Click download to try again." 
                : "Your detailed report has been generated and is ready for download."}
            </span>
          </div>

        </motion.div>
      </div>
    );
  }

  const question = questions[current];
  const selectedOptions = answers[current] ?? [];

  /* ─── Test screen ────────────────────────────────────────────────── */
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const isLastQuestion = current === questions.length - 1;
  const isFlagged = flagged.has(current);
  const questionProgressPercent = questions.length > 0 ? Math.min(100, Math.max(0, ((current + 1) / questions.length) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-row-reverse p-3 sm:p-4 lg:p-6 gap-4 overflow-hidden">

      {/* ── Desktop Sidebar (Question Palette) — hidden on mobile ──── */}
      <div className="hidden lg:flex w-[280px] flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
        <QuestionPalette
          progressPercent={progressPercent}
          questions={questions}
          current={current}
          getStatus={getStatus}
          onGoTo={goTo}
        />
      </div>

      {/* ── Mobile Palette Drawer (slides in from the right) ───────── */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-[65] flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setPaletteOpen(false)} />
            <motion.div
              className="relative w-[280px] max-w-[85vw] h-full flex flex-col bg-white dark:bg-slate-900 shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Palette</span>
                <button
                  onClick={() => setPaletteOpen(false)}
                  aria-label="Close palette"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <QuestionPalette
                progressPercent={progressPercent}
                questions={questions}
                current={current}
                getStatus={getStatus}
                onGoTo={(i) => { goTo(i); setPaletteOpen(false); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right Main Area (Question Card) ───────────────────────── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 min-w-0 overflow-hidden">
        
        {/* Header & Progress Bar */}
        <div className="flex-shrink-0 px-5 sm:px-8 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
              Question {current + 1} of {questions.length}
            </h2>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Mobile-only: open the question palette drawer */}
              <button
                onClick={() => setPaletteOpen(true)}
                aria-label="Open question palette"
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </button>

              {config.timed && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold tabular-nums transition-colors shadow-2xs ${
                    timeLeft <= 60
                      ? "border-rose-200 dark:border-rose-900/40 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-bold"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <Clock size={14} strokeWidth={1.8} className={timeLeft <= 60 ? "text-rose-500" : "text-slate-400 dark:text-slate-500"} />
                  {formatTime(timeLeft)}
                </div>
              )}

              {!isLastQuestion && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="px-4 sm:px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  Submit<span className="hidden sm:inline"> Test</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${questionProgressPercent}%` }}
            />
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-2 mt-2.5">
            {question?.topic && (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 uppercase tracking-wider">
                {question.topic}
              </span>
            )}
            {question?.difficulty && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold border tracking-wider uppercase ${
                String(question.difficulty).toLowerCase() === 'easy'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50'
                  : String(question.difficulty).toLowerCase() === 'hard' || String(question.difficulty) === '3' || String(question.difficulty) === '4' || String(question.difficulty) === '3/4'
                  ? 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50'
                  : 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  String(question.difficulty).toLowerCase() === 'easy'
                    ? 'bg-emerald-500'
                    : (String(question.difficulty).toLowerCase() === 'hard' || String(question.difficulty) === '3' || String(question.difficulty) === '4' || String(question.difficulty) === '3/4')
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`} />
                {(() => {
                  const d = question.difficulty as any;
                  return d === 3 || d === 4 || d === '3' || d === '4' || d === '3/4' ? 'Level 3/4' : `${d}`;
                })()}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Question Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* Question Text Box */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 mb-6 max-w-4xl shadow-2xs">
                <p className="text-[15.5px] sm:text-[17px] leading-[1.65] text-slate-950 dark:text-slate-50 font-medium">
                  {question.text}
                  {/* Report Issue — inline at end of question text */}
                  <button
                    onClick={openFeedback}
                    title="Report an issue with this question — timer will be paused"
                    className="group relative inline-flex items-center justify-center w-3.5 h-3.5 ml-1.5 align-middle cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-500 transition-transform duration-150 group-hover:scale-125" strokeWidth={2.4} fill="rgba(244,63,94,0.15)" />
                    <span className="pointer-events-none absolute -bottom-7 right-0 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-white dark:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                      Report issue — we&apos;ll pause the timer
                    </span>
                  </button>
                </p>
              </div>

              {question.image && (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  title="Click to enlarge and zoom"
                  className="group relative mb-6 block w-fit rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={question.image}
                    alt="Question illustration"
                    className="max-h-48 sm:max-h-72 object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                  />
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Click to zoom
                  </span>
                </button>
              )}

              {/* Options List */}
              {(() => {
                const isKft = (question.examType || "").toUpperCase() === "KFT" || (question.examType || "").toUpperCase() === "KFP";
                const kfpLimit = isKft
                  ? (question.kftCorrectCount || question.kfpCorrectCount || question.correctIndices?.length || 3)
                  : 1;
                const sel = answers[current] ?? [];
                const selCount = sel.length;
                const atCap = kfpLimit > 1 && selCount >= kfpLimit;

                return (
                  <div className="space-y-3 max-w-4xl">
                    {isKft && (
                      <div className="flex items-center gap-2 p-3 bg-teal-50/80 dark:bg-teal-950/40 rounded-xl border border-teal-200/70 dark:border-teal-900/50 text-xs font-bold text-teal-900 dark:text-teal-200">
                        <svg className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>
                          Key Feature Problem (KFP): Select <strong>{kfpLimit}</strong> options ({selCount}/{kfpLimit} selected) · {kfpLimit} marks
                        </span>
                      </div>
                    )}
                    {question.options.map((option, i) => {
                      const isSelected = sel.includes(i);
                      const isDisabled = atCap && !isSelected;
                      return (
                        <button
                          key={i}
                          onClick={() => !isDisabled && selectOption(i)}
                          disabled={isDisabled}
                          className={`group relative w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl text-left transition-all duration-200 ease-out ${
                            isDisabled
                              ? "border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 opacity-50 cursor-not-allowed"
                              : isSelected
                              ? "border-2 border-teal-600 dark:border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 shadow-sm cursor-pointer"
                              : "border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-400 dark:hover:border-teal-500/70 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                              isSelected
                                ? "bg-teal-600 border-teal-600 text-white shadow-xs scale-105"
                                : "border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:border-teal-300 dark:group-hover:border-teal-700 group-hover:text-teal-700 dark:group-hover:text-teal-300"
                            }`}
                          >
                            {isKft && isSelected ? (
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              String.fromCharCode(65 + i)
                            )}
                          </span>
                          <span
                            className={`text-sm sm:text-[15.5px] leading-relaxed transition-colors duration-150 ${
                              isSelected
                                ? "text-slate-950 dark:text-slate-50 font-semibold"
                                : "text-slate-900 dark:text-slate-100 font-medium group-hover:text-slate-950 dark:group-hover:text-white"
                            }`}
                          >
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="flex-shrink-0 px-5 sm:px-8 py-3.5 sm:py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={clearResponse}
              disabled={selectedOptions.length === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                selectedOptions.length === 0
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Clear Response</span>
              <span className="sm:hidden">Clear</span>
            </button>

            <button
              onClick={toggleFlagged}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isFlagged
                  ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300/80 dark:border-purple-700/60 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFlagged ? "fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" : ""}`} strokeWidth={1.8} />
              <span className="hidden sm:inline">{isFlagged ? "Marked for Review" : "Mark for Review"}</span>
              <span className="sm:hidden">{isFlagged ? "Marked" : "Review"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl border text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                current === 0
                  ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs cursor-pointer"
              }`}
            >
              &larr;<span className="hidden sm:inline"> Previous</span>
            </button>
            {isLastQuestion ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 bg-teal-600 hover:bg-teal-500 text-white shadow-sm hover:shadow cursor-pointer"
              >
                Submit Test
              </button>
            ) : (
              <button
                onClick={() => goTo(current + 1)}
                className="flex items-center gap-2 px-5 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 bg-teal-600 hover:bg-teal-500 text-white shadow-sm hover:shadow cursor-pointer"
              >
                Next &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Question Feedback / Report Issue Modal ─────────────────── */}
      <AnimatePresence>
        {feedbackOpen && (() => {
          const fq = questions[feedbackQuestionIdx];
          if (!fq) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[62] flex items-center justify-center p-4"
            >
              {/* Blurred backdrop */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={closeFeedback} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-[520px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100/60 dark:border-rose-900/30 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0">
                      <AlertTriangle className="w-5.5 h-5.5" strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        Report an Issue
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {config?.timed ? "Timer paused while you write your feedback." : "Share your feedback about this question."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeFeedback}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-5" />

                {/* Question Details */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-24 shrink-0">Question ID</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono text-xs break-all">{fq.id.slice(0, 8)}…</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-24 shrink-0">Exam type</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{feedbackExamType}</span>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-5" />

                {/* Where dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Where is the issue?
                  </label>
                  <select
                    value={fbWhere}
                    onChange={(e) => setFbWhere(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-400 dark:focus:border-rose-500 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">Select location…</option>
                    {fbWhereOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Issue type dropdown */}
                <div className="mt-4">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Issue type
                  </label>
                  <select
                    value={fbIssue}
                    onChange={(e) => {
                      setFbIssue(e.target.value);
                      setFbSuggestedAnswer("");
                      setFbDisputedAnswer("");
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-400 dark:focus:border-rose-500 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">Select issue…</option>
                    {fbIssueOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional: AKT keyed_answer_wrong → suggested answer dropdown */}
                {feedbackExamType === "AKT" && fbIssue === "keyed_answer_wrong" && (
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Which option do you believe is correct?
                    </label>
                    <select
                      value={fbSuggestedAnswer}
                      onChange={(e) => setFbSuggestedAnswer(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-400 dark:focus:border-rose-500 transition-colors cursor-pointer appearance-none"
                    >
                      <option value="">Select option…</option>
                      {Array.from({ length: fbOptionCount }, (_, i) => String.fromCharCode(65 + i)).map((l) => (
                        <option key={l} value={l}>Option {l}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Conditional: KFP schedule_wrong → disputed answer text */}
                {feedbackExamType === "KFP" && fbIssue === "schedule_wrong" && (
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      What did you answer that should be accepted?
                    </label>
                    <input
                      type="text"
                      value={fbDisputedAnswer}
                      onChange={(e) => setFbDisputedAnswer(e.target.value)}
                      placeholder="Your answer…"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-400 dark:focus:border-rose-500 transition-colors"
                    />
                  </div>
                )}

                {/* Optional comment */}
                <div className="mt-4">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Additional comment <span className="font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value.slice(0, 500))}
                    placeholder="Any extra context…"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-400 dark:focus:border-rose-500 resize-none transition-colors"
                  />
                  <div className="flex justify-end mt-1.5">
                    <span className={`text-[11px] font-semibold tabular-nums ${feedbackText.length >= 480 ? "text-rose-500" : "text-slate-400 dark:text-slate-500"}`}>
                      {feedbackText.length}/500
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={closeFeedback}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitFeedback}
                    disabled={!fbCanSubmit || feedbackSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {feedbackSubmitting ? "Submitting…" : "Submit Feedback"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

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
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 flex flex-col"
            >
              {/* Header Row: Clock Loader + Title/Subtitle + Close Button */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Standalone Clock Loader positioned slightly lower */}
                  <ClockLoader className="shrink-0 mt-2.5 ml-1" />

                  {/* Title & Subtitle */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      Submit your test?
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      Review your answers before submitting.<br />
                      Your test cannot be reopened after submission.
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Divider 1 */}
              <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-5" />

              {/* Time Summary Section */}
              <div className="flex items-center justify-between py-1">
                {/* Time Elapsed */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> TIME ELAPSED
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatTime(elapsed)}
                  </span>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-10 bg-slate-200/80 dark:bg-slate-800" />

                {/* Time Remaining */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
                    <Clock className={`w-3.5 h-3.5 ${
                      !config?.timed ? "text-slate-400" : timeLeft <= 300 ? "text-rose-500" : timeLeft <= 600 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                    }`} /> TIME REMAINING
                  </span>
                  <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${
                    !config?.timed
                      ? "text-slate-900 dark:text-slate-100"
                      : timeLeft <= 300
                        ? "text-rose-600 dark:text-rose-400"
                        : timeLeft <= 600
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {config?.timed ? formatTime(timeLeft) : "Untimed"}
                  </span>
                </div>
              </div>

              {/* Divider 2 */}
              <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-5" />

              {/* Exam Status Summary (Answered, Unanswered, Not Visited) */}
              <div className="flex items-center justify-between py-1">
                {/* Answered */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 leading-none mb-1">
                    {answeredCount}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    ANSWERED
                  </span>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-10 bg-slate-200/80 dark:bg-slate-800" />

                {/* Unanswered */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <span className="text-2xl sm:text-3xl font-bold text-rose-500 dark:text-rose-400 leading-none mb-1">
                    {notAnsweredCount}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    UNANSWERED
                  </span>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-10 bg-slate-200/80 dark:bg-slate-800" />

                {/* Not Visited */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 leading-none mb-1">
                    {notVisitedCount}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    NOT VISITED
                  </span>
                </div>
              </div>

              {/* Divider 3 */}
              <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-5" />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-emerald-600/70 dark:border-emerald-500/60 text-emerald-700 dark:text-emerald-400 font-bold text-sm bg-transparent hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center"
                >
                  Keep Working
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center"
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


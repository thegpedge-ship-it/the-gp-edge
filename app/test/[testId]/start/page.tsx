"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { consumeTestAuthorization, loadTestPlan, planToConfig } from "@/lib/testSession";
import type { TestConfig, TestPlan } from "@/lib/testSession";
import { getQuestionsByIds, saveQuizAttempt } from "@/app/exam-prep/actions";
import type { QuizQuestion, SaveAttemptInput } from "@/app/exam-prep/actions";
import { clearMockTestsCache } from "@/lib/examCache";
import { buildReportData, reportFileName } from "@/lib/report/buildReportData";
import { generateReportBlob } from "@/lib/report/generateReport";
import { saveReport } from "@/lib/report/reportStore";
import TestNotFound from "@/components/test/TestNotFound";
import { FullScreenLoader } from "@/components/ui/BrandedLoader";

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
    "w-8 h-8 rounded-full border text-[13px] font-bold flex items-center justify-center transition-all duration-150 hover:scale-110";
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
      <div className="flex-shrink-0 p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center">
        <h3 className="text-[12px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6">Your Progress</h3>

        {/* Circular Progress */}
        <div className="relative w-20 h-20 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-emerald-500 transition-all duration-500 ease-out"
              strokeDasharray={`${progressPercent}, 100`}
              strokeWidth="2"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-0.5">
            <span className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-none">{progressPercent}%</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">Answered</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2.5 text-[13px] text-slate-600 dark:text-slate-300 font-medium">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" /> Answered
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-slate-600 dark:text-slate-300 font-medium">
            <span className="w-3 h-3 rounded-full bg-red-400 shadow-sm" /> Not Answered
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-slate-600 dark:text-slate-300 font-medium">
            <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 shadow-sm" /> Not Visited
          </div>
        </div>
      </div>

      {/* Scrollable Palette Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        <div className="grid grid-cols-5 gap-2.5">
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
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false); // mobile palette drawer
  const [submitted, setSubmitted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
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
      answers: questions.map((q, i) => ({ questionId: q.id, selectedIndex: answers[i] ?? null })),
      startedAt: startedAtRef.current || undefined,
      durationSeconds: elapsed,
    })
      .then(() => {
        // Mock-test cards show per-user attempt stats — refresh them next read.
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
      answers: questions.map((q, i) => ({ questionId: q.id, selectedIndex: answers[i] ?? null })),
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

  /* Countdown timer — auto-submit at zero. Mock tests only. */
  useEffect(() => {
    if (loading || submitted || !config?.timed) return;
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
  }, [loading, submitted, handleSubmit, config]);

  /* Elapsed count-up — tracks time used for the result screen on every test. */
  useEffect(() => {
    if (loading || submitted) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [loading, submitted]);

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
  // Resolving and fetching are one continuous wait to the user, so both show
  // the same screen — previously this returned null and flashed blank first.
  if (config === undefined) return <FullScreenLoader message="Preparing your test" />;
  if (config === null) return <TestNotFound />;

  /* ─── Loading state ──────────────────────────────────────────────── */
  if (loading) return <FullScreenLoader message="Fetching your questions" />;

  /* ─── Result screen after submission ─────────────────────────────── */
  if (submitted) {
    const correct = questions.reduce(
      (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
      0
    );
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col items-center overflow-y-auto px-4 py-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[650px] flex flex-col items-center my-auto bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 pb-6"
        >
          {/* Banner Container */}
          <div className="relative w-full h-[160px] sm:h-[180px] rounded-t-[24px] overflow-hidden flex flex-col items-center justify-center bg-emerald-600">
            
            {/* Success Content Overlay */}
            <div className="relative z-10 text-center px-4 flex flex-col items-center pb-4">
              <h1 className="text-[24px] sm:text-[28px] font-bold text-white tracking-tight leading-tight mb-1.5 drop-shadow-sm">
                {timedOut ? "Time's Up!" : "Test Submitted Successfully!"}
              </h1>
              <p className="text-[13px] sm:text-[15px] text-white/90 font-medium drop-shadow-sm">
                {timedOut 
                  ? `Your time ran out, so ${config.name} was submitted automatically.` 
                  : "Thanks for completing the test."}
              </p>
            </div>
          </div>

          {/* Floating Statistics Card */}
          <div className="relative z-20 -mt-6 w-[92%] sm:w-[85%] bg-white dark:bg-slate-900 rounded-[20px] shadow-[0_12px_30px_rgba(15,23,42,0.10)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.30)] border border-slate-100 dark:border-slate-800 p-5 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
              
              {/* Score */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-[28px] sm:text-[34px] font-bold text-emerald-600 dark:text-emerald-500 leading-none mb-1.5">{score}%</span>
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Your Score</span>
              </div>
              
              {/* Correct */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-[28px] sm:text-[34px] font-bold text-emerald-500 dark:text-emerald-400 leading-none mb-1.5">{correct}</span>
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Correct</span>
              </div>
              
              {/* Attempted */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-[28px] sm:text-[34px] font-bold text-slate-800 dark:text-slate-200 leading-none mb-1.5">{answeredCount}</span>
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Attempted</span>
              </div>
              
              {/* Time Taken */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-[28px] sm:text-[34px] font-bold text-slate-500 dark:text-slate-300 leading-none mb-1.5">{formatTime(elapsed)}</span>
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Time Taken</span>
              </div>
              
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-[92%] sm:w-[85%] mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDownloadReport}
              disabled={reportState === "generating"}
              className="flex-1 w-full flex items-center justify-center gap-2 px-6 py-[11px] rounded-[10px] border border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 text-[13px] sm:text-[14px] font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-wait"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {reportState === "generating" ? "Saving report…" : "Download Report"}
            </button>
            
            <button
              onClick={() => router.push("/exam-prep")}
              className="flex-1 w-full px-6 py-[11px] rounded-[10px] bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] sm:text-[14px] font-semibold shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] transition-all duration-200 hover:-translate-y-0.5"
            >
              Back to Exam Prep
            </button>
          </div>

          {/* Supporting Information */}
          <div className="mt-4 text-center px-4 h-[30px]">
             {reportState === "error" && (
                <p className="text-[12px] text-red-500 dark:text-red-400">
                  Couldn't save the report. Tap the download button to try again.
                </p>
              )}
              {reportState === "ready" && (
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Your detailed report has been generated and is ready for download.
                </p>
              )}
          </div>
          
        </motion.div>
      </div>
    );
  }

  const question = questions[current];
  const selectedOption = answers[current];

  /* ─── Test screen ────────────────────────────────────────────────── */
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

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
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 min-w-0 overflow-hidden">
        
        {/* Header & Progress Bar */}
        <div className="flex-shrink-0 px-4 sm:px-8 pt-4 sm:pt-5 pb-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-[15px] sm:text-[20px] font-bold text-emerald-700 dark:text-emerald-400 truncate">
              Question {current + 1} of {questions.length}
            </h2>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Mobile-only: open the question palette drawer */}
              <button
                onClick={() => setPaletteOpen(true)}
                aria-label="Open question palette"
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </button>
              {config.timed && (
                <div
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[12px] sm:text-[13px] font-bold tabular-nums transition-colors ${
                    timeLeft <= 60
                      ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  }`}
                >
                  <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(timeLeft)}
                </div>
              )}
              <button
                onClick={() => setShowConfirm(true)}
                className="px-3 sm:px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] sm:text-[13px] font-bold shadow-sm shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
              >
                Submit<span className="hidden sm:inline"> Test</span>
              </button>
            </div>
          </div>
          
          <div className="w-full h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300 ease-out" 
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-end mt-3">
             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
               {question.topic}
             </span>
          </div>
        </div>

        {/* Scrollable Question Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-[14px] sm:text-[17px] leading-[1.55] sm:leading-[1.6] text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 max-w-4xl font-medium">
                {question.text}
              </p>

              {question.image && (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  title="Click to enlarge and zoom"
                  className="group relative mb-6 block w-fit rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={question.image}
                    alt="Question illustration"
                    className="max-h-48 sm:max-h-72 object-contain transition-transform duration-200 group-hover:scale-[1.01]"
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

              <div className="space-y-2.5 sm:space-y-3 max-w-4xl">
                {question.options.map((option, i) => {
                  const isSelected = selectedOption === i;
                  return (
                    <button
                      key={i}
                      onClick={() => selectOption(i)}
                      className={`w-full flex items-center gap-3 sm:gap-3.5 p-3 sm:p-4 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/20 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center text-[12px] sm:text-[13px] font-bold transition-colors ${
                          isSelected
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300 dark:border-slate-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/20"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={`text-[13px] sm:text-[16px] leading-snug sm:leading-relaxed ${isSelected ? "text-emerald-900 dark:text-emerald-100 font-medium" : "text-slate-700 dark:text-slate-300"}`}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="flex-shrink-0 px-4 sm:px-8 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900">
          <button
            onClick={clearResponse}
            disabled={selectedOption === undefined}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-200 ${
              selectedOption === undefined
                ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                : "text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
            }`}
          >
            <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Clear Response</span>
            <span className="sm:hidden">Clear</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              className={`flex items-center gap-2 px-3.5 sm:px-6 py-2 rounded-lg border text-[13px] sm:text-[14px] font-semibold whitespace-nowrap transition-all duration-200 ${
                current === 0
                  ? "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
              }`}
            >
              &larr;<span className="hidden sm:inline"> Previous</span>
            </button>
            <button
              onClick={() => goTo(current + 1)}
              disabled={current === questions.length - 1}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[13px] sm:text-[14px] font-bold whitespace-nowrap transition-all duration-200 ${
                current === questions.length - 1
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 hover:-translate-y-0.5"
              }`}
            >
              Next &rarr;
            </button>
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
              className="relative w-[calc(100vw-2rem)] max-w-[400px] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.28)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 pt-7 pb-5 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/25 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
                  </svg>
                </div>
                <h2 className="text-[21px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">Submit your test?</h2>
                <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400 mt-1.5">
                  {config.timed ? (
                    <>You still have <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatTime(timeLeft)}</span> left. This can&rsquo;t be undone.</>
                  ) : (
                    <>This action cannot be undone.</>
                  )}
                </p>
              </div>

              {/* Stats — three compact tiles */}
              <div className="px-5 grid grid-cols-3 gap-2.5">
                <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-900/30 py-3.5 px-1">
                  <span className="text-[24px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">{answeredCount}</span>
                  <span className="text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-400/70 uppercase tracking-wide text-center leading-tight">Answered</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-900/30 py-3.5 px-1">
                  <span className="text-[24px] font-bold text-red-500 dark:text-red-400 leading-none">{notAnsweredCount}</span>
                  <span className="text-[10px] font-semibold text-red-600/80 dark:text-red-400/70 uppercase tracking-wide text-center leading-tight">Unanswered</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 py-3.5 px-1">
                  <span className="text-[24px] font-bold text-slate-700 dark:text-slate-200 leading-none">{notVisitedCount}</span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center leading-tight">Not Visited</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="p-5 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[14px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                  Keep Working
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[14px] font-bold shadow-md shadow-emerald-600/25 transition-all duration-200 hover:-translate-y-0.5"
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


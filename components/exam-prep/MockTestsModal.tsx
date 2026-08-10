"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Clock, Lock, Unlock, Trophy, ArrowRight, X } from "lucide-react";
import type { UiMockTest } from "@/app/exam-prep/actions";
import { cachedMockTestQuestionIds } from "@/lib/examCache";
import { buildInstructionsUrl, saveTestPlan } from "@/lib/testSession";
import ViewReportButton from "@/components/report/ViewReportButton";
import ExamLoadingScreen from "@/components/exam-prep/ExamLoadingScreen";
import { useUserAccess } from "@/hooks/useUserAccess";
import UpgradeModal from "@/components/UpgradeModal";

/* ─── Single mock-test card (roomy grid tile, minimal meta) ───────────────── */
function TestCard({
  test,
  starting,
  isRegistrarActive,
  onStart,
  onLockedClick,
}: {
  test: UiMockTest;
  starting: boolean;
  isRegistrarActive: boolean;
  onStart: (test: UiMockTest) => void;
  onLockedClick: (name: string) => void;
}) {
  const isFree = test.isFree === true;
  const isTierLocked = !isFree && !isRegistrarActive;
  const isLocked = test.availability === "locked" || isTierLocked;
  const statusLabel = isTierLocked
    ? "Registrar Only"
    : test.availability === "locked"
      ? "Locked"
      : test.completed
        ? "Completed"
        : "Available";
  const action = test.completed ? "Retake" : "Start";

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border p-4 sm:p-5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isLocked
          ? "border-slate-200 dark:border-slate-700/40 bg-slate-50/60 dark:bg-slate-800/20"
          : "border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-600/60 hover:shadow-xl hover:shadow-emerald-500/10"
        }`}
    >
      {/* Top — icon + name + status pill */}
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${isLocked
              ? "bg-slate-100 text-slate-400 dark:bg-slate-700/40 dark:text-slate-500"
              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400"
            }`}
        >
          {isLocked ? <Lock size={16} strokeWidth={2.2} className="sm:w-[18px] sm:h-[18px]" /> : <FileText size={16} strokeWidth={2.2} className="sm:w-[18px] sm:h-[18px]" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
              {test.name}
            </h4>
          </div>
          {test.subtitle && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{test.subtitle}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {isFree ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
              <Unlock className="w-2.5 h-2.5" /> FREE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 border border-amber-200/50">
              <Lock className="w-2.5 h-2.5" /> Registrar
            </span>
          )}

          <span
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${isLocked
                ? "bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400"
                : test.completed
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-teal-50 text-teal-700 dark:bg-teal-900/25 dark:text-teal-300"
              }`}
          >
            {test.completed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Meta — kept intentionally minimal */}
      <div className="flex items-center gap-4 mt-3 sm:mt-4 text-[12px] font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <FileText size={13} className="text-slate-400 dark:text-slate-500" />
          {test.questionCount} Qs
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} className="text-slate-400 dark:text-slate-500" />
          {test.durationMin} min
        </span>
      </div>

      {/* Footer — best score + action */}
      <div className="flex items-center justify-between mt-3 pt-3 sm:mt-5 sm:pt-4 border-t border-slate-100 dark:border-slate-700/40">
        {test.completed && test.bestScore != null ? (
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
            <Trophy size={13} strokeWidth={2.2} />
            Best {test.bestScore}%
          </span>
        ) : (
          <span className="text-[12px] text-slate-400 dark:text-slate-500">
            {isLocked ? "Registrar Plan Required" : "Not attempted"}
          </span>
        )}

        <div className="flex items-center gap-2.5">
          {!isLocked && <ViewReportButton testId={test.id} variant="link" />}
          {isLocked ? (
            <button
              onClick={() => onLockedClick(test.name)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
            >
              <Lock size={13} strokeWidth={2.2} />
              Unlock
            </button>
          ) : (
            <button
              onClick={() => onStart(test)}
              disabled={starting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-wait text-white shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              {starting ? "Loading…" : action}
              {!starting && <ArrowRight size={13} strokeWidth={2.4} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Modal ───────────────────────────────────────────────────────────── */
export default function MockTestsModal({
  open,
  onClose,
  tests,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  tests: UiMockTest[];
  loading?: boolean;
}) {
  const router = useRouter();
  const { isRegistrarActive } = useUserAccess();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeMockName, setUpgradeMockName] = useState<string | undefined>();

  // Free items sorted first, then available, then completed, then locked.
  const rank = (t: UiMockTest) => {
    const isFree = t.isFree === true;
    if (isFree) return 0;
    if (!isRegistrarActive) return 3;
    if (t.availability === "locked") return 2;
    if (t.completed) return 1;
    return 0;
  };
  const orderedTests = [...tests].sort((a, b) => rank(a) - rank(b));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleStart = async (test: UiMockTest) => {
    if (startingId) return;
    setStartingId(test.id);
    const detail = await cachedMockTestQuestionIds(test.id);
    setStartingId(null);
    if (!detail || detail.questionIds.length === 0) return;
    saveTestPlan({
      testId: test.id,
      source: "mock_test",
      mockTestId: test.id,
      name: test.name,
      questionIds: detail.questionIds,
      durationMinutes: detail.timeLimitMin ?? test.durationMin,
      timed: true,
    });
    onClose();
    router.push(buildInstructionsUrl(test.id));
  };

  const handleLockedClick = (name: string) => {
    setUpgradeMockName(name);
    setUpgradeModalOpen(true);
  };

  return (
    <>
      {startingId && <ExamLoadingScreen title="Preparing your test" />}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            {/* Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Mock Tests"
              className="relative w-[95vw] lg:w-[76vw] max-w-[1240px] h-[88vh] flex flex-col glass-strong rounded-3xl border border-slate-200/60 dark:border-slate-700/40 shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header */}
              <div className="relative flex items-center justify-between px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-200/70 dark:border-slate-700/40 flex-shrink-0">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-xl sm:text-2xl md:text-[1.75rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Mock Tests
                  </h3>
                  {tests.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400">
                      {tests.length}
                    </span>
                  )}
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              {/* Subheading strip */}
              <div className="px-5 pt-3 sm:px-7 sm:pt-4 flex-shrink-0">
                <p className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400 leading-snug">
                  Full AKT simulations under real exam conditions. Free sample tests are available to all users.
                </p>
              </div>

              {/* Cards grid */}
              <div
                className="flex-1 min-h-0 overflow-y-auto scrollbar-hide scroll-smooth will-change-scroll px-4 py-4 sm:px-7 sm:py-5"
                style={{ WebkitOverflowScrolling: "touch", transform: "translateZ(0)" }}
              >
                {tests.length === 0 && loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-10 h-10 rounded-full border-[3px] border-emerald-500/25 border-t-emerald-500 animate-spin" />
                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Loading mock tests…</p>
                  </div>
                ) : tests.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <FileText size={24} strokeWidth={2} />
                    </div>
                    <p className="text-[15px] font-bold text-slate-600 dark:text-slate-300">No mock tests yet</p>
                    <p className="text-[12px] text-slate-400 dark:text-slate-500 max-w-[320px]">
                      Full AKT simulations will appear here once they&rsquo;re published.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-[1100px] mx-auto">
                    {orderedTests.map((test) => (
                      <TestCard
                        key={test.id}
                        test={test}
                        starting={startingId === test.id}
                        isRegistrarActive={isRegistrarActive}
                        onStart={handleStart}
                        onLockedClick={handleLockedClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName={upgradeMockName}
        requiredTier="registrar"
      />
    </>
  );
}


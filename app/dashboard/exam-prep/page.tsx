"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Lock,
  Unlock,
  Clock,
  Award,
  HelpCircle,
  Play,
  Search,
  Filter,
  ShieldAlert,
} from "lucide-react";
import { fetchQuizzesFromDbAction, fetchQuizByDbIdAction } from "@/actions/quiz.actions";
import { useUserAccess } from "@/hooks/useUserAccess";
import dynamic from "next/dynamic";
import { saveTestPlan } from "@/lib/testSession";

const UpgradeModal = dynamic(() => import("@/components/UpgradeModal"), { ssr: false });

interface QuizItem {
  id?: string | number;
  dbId?: string;
  name: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  randomize?: boolean;
  isFree?: boolean;
  status?: string;
  examType?: string;
  questionsCount?: number;
  questionDbIds?: string[];
}

export default function ExamPrepDashboard() {
  const router = useRouter();
  const { isRegistrarActive, hasPaidAccess, loading: accessLoading } = useUserAccess();

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedExamType, setSelectedExamType] = useState<string>("ALL");
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeQuizName, setUpgradeQuizName] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    fetchQuizzesFromDbAction()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setQuizzes(data as unknown as QuizItem[]);
        }
      })
      .catch((err) => console.error("Failed to load quizzes:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter quizzes
  const filteredQuizzes = useMemo(() => {
    return quizzes
      .filter((q) => {
        const matchesSearch =
          q.name.toLowerCase().includes(search.toLowerCase()) ||
          q.description.toLowerCase().includes(search.toLowerCase());
        const matchesType =
          selectedExamType === "ALL" ||
          (q.examType ?? "AKT").toUpperCase() === selectedExamType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        // Free items first, then by name
        const aFree = a.isFree === true ? 1 : 0;
        const bFree = b.isFree === true ? 1 : 0;
        if (bFree !== aFree) return bFree - aFree;
        return a.name.localeCompare(b.name);
      });
  }, [quizzes, search, selectedExamType]);

  const handleStartQuiz = async (quiz: QuizItem) => {
    const isLocked = quiz.isFree !== true && !isRegistrarActive;

    if (isLocked) {
      setUpgradeQuizName(quiz.name);
      setUpgradeModalOpen(true);
      return;
    }

    const quizId = quiz.dbId || (quiz.id ? String(quiz.id) : "");
    if (!quizId) return;

    setStartingQuizId(quizId);
    try {
      // Fetch full question IDs for this quiz
      const fullQuiz = await fetchQuizByDbIdAction(quizId);
      const questionIds = fullQuiz?.questionDbIds || [];

      if (questionIds.length === 0) {
        alert("This quiz currently has no questions assigned.");
        setStartingQuizId(null);
        return;
      }

      // Save test plan to session storage and navigate to instructions
      saveTestPlan({
        testId: quizId,
        source: "quiz",
        quizId: quizId,
        name: quiz.name,
        questionIds: questionIds,
        durationMinutes: quiz.timeLimit || 60,
        timed: false,
      });

      router.push(`/test/${quizId}/instructions`);
    } catch (err) {
      console.error("Error launching quiz:", err);
      alert("Could not load quiz questions.");
      setStartingQuizId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* ── Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-800 to-indigo-900 text-white p-8 sm:p-10 shadow-xl border border-teal-700/40">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            RACGP & ACRRM Exam Preparation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Exam Prep & Quizzes
          </h1>
          <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed mb-6">
            Practice with clinical AKT & KFP questions. Free sample quizzes are available to all users. Full exam suites require an active Registrar plan.
          </p>

          {!isRegistrarActive && !accessLoading && (
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                You are currently on the {hasPaidAccess ? "Subscription" : "Free"} tier. Full Registrar exams are locked.
              </span>
            </div>
          )}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
      </div>

      {/* ── Search & Filters ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Exam Type:
          </span>
          {["ALL", "AKT", "KFP"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedExamType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedExamType === type
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {type === "ALL" ? "All Quizzes" : type}
            </button>
          ))}
        </div>
      </div>

      {/* ── Quiz Grid ───────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 animate-pulse"
            />
          ))}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
            No Quizzes Found
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Try adjusting your search query or filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => {
            const isFree = quiz.isFree === true;
            const isLocked = !isFree && !isRegistrarActive;
            const quizId = quiz.dbId || quiz.id || "";
            const isStarting = startingQuizId === quizId;

            return (
              <motion.div
                key={quizId || quiz.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: isLocked ? 0 : -4 }}
                transition={{ duration: 0.2 }}
                className={`relative rounded-3xl bg-white dark:bg-slate-900 border p-6 flex flex-col justify-between transition-all duration-200 ${
                  isLocked
                    ? "border-slate-200/80 dark:border-slate-800/80 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-md hover:shadow-xl"
                }`}
              >
                {/* Locked Banner Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 rounded-3xl bg-white/60 dark:bg-slate-900/75 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-955/40 flex items-center justify-center mb-3 text-amber-600 dark:text-amber-400">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Registrar Plan Required
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                      Unlock this exam suite with a Registrar subscription.
                    </p>
                    <button
                      onClick={() => {
                        setUpgradeQuizName(quiz.name);
                        setUpgradeModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                    >
                      Unlock Quiz
                    </button>
                  </div>
                )}

                <div className={isLocked ? "opacity-35 select-none" : ""}>
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 dark:bg-teal-955/30 text-teal-700 dark:text-teal-400 border border-teal-200/50">
                      {quiz.examType || "AKT"}
                    </span>

                    {isFree ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                        <Unlock className="w-2.5 h-2.5" />
                        FREE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 border border-amber-200/50">
                        <Lock className="w-2.5 h-2.5" />
                        Registrar
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug mb-2">
                    {quiz.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-6">
                    {quiz.description || "Comprehensive clinical practice exam."}
                  </p>

                  {/* Meta stats */}
                  <div className="grid grid-cols-2 gap-2 py-3 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 mb-6 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>{quiz.timeLimit ? `${quiz.timeLimit} mins` : "Untimed"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Pass: {quiz.passingScore || 65}%</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleStartQuiz(quiz)}
                  disabled={isStarting}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                    isLocked
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:shadow-md cursor-pointer"
                  }`}
                >
                  {isStarting ? (
                    "Loading Quiz..."
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isLocked ? "Unlock Access" : "Start Quiz"}
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Upgrade Modal for locked quizzes */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName={upgradeQuizName}
        requiredTier="registrar"
      />
    </div>
  );
}

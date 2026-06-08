"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import CustomSelect from "@/components/admin/CustomSelect";
import {
  AVAILABLE_TOPICS,
  QUESTION_BANK,
  Quiz,
  QuizStatus,
  deleteQuiz,
  duplicateQuiz,
  getQuizById,
  updateQuiz,
} from "@/lib/quizData";
import {
  themeBadge,
  themeBadgeSm,
  themeBorder,
  themeBtnGhost,
  themeBtnPrimary,
  themeDot,
  themeIconBtn,
  themeInput,
  themeLabel,
  themeMuted,
  themePanel,
  themeSelected,
  themeSurface,
  themeText,
} from "@/lib/adminTheme";
import { addUserNotification } from "@/utils/notifications";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

type Tab = "settings" | "questions";

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = Number(params.id);

  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [timeLimit, setTimeLimit] = useState(60);
  const [passingScore, setPassingScore] = useState(65);
  const [status, setStatus] = useState<QuizStatus>("draft");
  const [examType, setExamType] = useState<Quiz["examType"]>("AKT");
  const [randomize, setRandomize] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const quiz = getQuizById(quizId);
    if (!quiz) {
      setNotFound(true);
      setLoaded(true);
      return;
    }
    setName(quiz.name);
    setDescription(quiz.description);
    setTopics(quiz.topics);
    setQuestionIds(quiz.questionIds);
    setTimeLimit(quiz.timeLimit);
    setPassingScore(quiz.passingScore);
    setStatus(quiz.status);
    setExamType(quiz.examType);
    setRandomize(quiz.randomize);
    setAttempts(quiz.attempts);
    setAvgScore(quiz.avgScore);
    setNotFound(false);
    setLoaded(true);
  }, [quizId]);

  const assignedQuestions = useMemo(
    () => questionIds.map((id) => QUESTION_BANK.find((q) => q.id === id)).filter(Boolean) as typeof QUESTION_BANK,
    [questionIds]
  );

  const availableQuestions = useMemo(() => {
    return QUESTION_BANK.filter((q) => {
      if (questionIds.includes(q.id)) return false;
      const matchSearch =
        questionSearch === "" ||
        q.text.toLowerCase().includes(questionSearch.toLowerCase()) ||
        q.id.toString().includes(questionSearch);
      const matchTopic = topicFilter === "all" || q.topic.split(",").map(t => t.trim().toLowerCase()).includes(topicFilter.toLowerCase());
      return matchSearch && matchTopic;
    });
  }, [questionIds, questionSearch, topicFilter]);

  const toggleTopic = (topic: string) => {
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const addQuestion = (id: number) => {
    setQuestionIds((prev) => [...prev, id]);
  };

  const removeQuestion = (id: number) => {
    setQuestionIds((prev) => prev.filter((qid) => qid !== id));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    setQuestionIds((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = (redirect = false) => {
    if (!name.trim()) {
      alert("Please enter a quiz name.");
      return;
    }
    if (questionIds.length === 0) {
      alert("Add at least one question to this quiz.");
      return;
    }

    const updated = updateQuiz(quizId, {
      name: name.trim(),
      description: description.trim(),
      topics,
      questionIds,
      timeLimit,
      passingScore,
      status,
      examType,
      randomize,
    });

    if (!updated) {
      alert("Quiz not found.");
      router.push("/admin/quizzes");
      return;
    }

    setSaveMessage("Changes saved successfully.");
    setTimeout(() => setSaveMessage(null), 3000);

    if (redirect) {
      router.push("/admin/quizzes");
    }
  };

  const handlePublish = () => {
    if (!name.trim() || questionIds.length === 0) {
      alert("Add a name and at least one question before publishing.");
      return;
    }
    setStatus("active");
    updateQuiz(quizId, {
      name: name.trim(),
      description: description.trim(),
      topics,
      questionIds,
      timeLimit,
      passingScore,
      status: "active",
      examType,
      randomize,
    });
    addUserNotification(
      `Quiz Updated: ${name}`,
      `The mock exam "${name}" is now active with ${questionIds.length} questions.`,
      questionIds.length,
      "quiz"
    );
    setSaveMessage("Quiz published and users notified.");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSuspend = () => {
    setStatus("suspended");
    updateQuiz(quizId, {
      name: name.trim(),
      description: description.trim(),
      topics,
      questionIds,
      timeLimit,
      passingScore,
      status: "suspended",
      examType,
      randomize,
    });
    setSaveMessage("Quiz suspended.");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleDuplicate = () => {
    const copy = duplicateQuiz(quizId);
    if (copy) {
      router.push(`/admin/quizzes/${copy.id}/edit`);
    }
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteQuiz(quizId);
    router.push("/admin/quizzes");
  };

  if (!loaded) {
    return (
      <div className="text-center py-20">
        <p className={`text-sm ${themeMuted}`}>Loading quiz...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <p className={`text-sm mb-4 ${themeMuted}`}>Quiz not found.</p>
        <Link href="/admin/quizzes" className={`inline-flex px-4 py-2.5 rounded-xl text-sm font-semibold ${themeBtnPrimary}`}>
          Back to Quizzes
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Edit"
        highlightedText="Quiz"
        subtitle={name || "Loading..."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/quizzes" className={themeBtnGhost}>
              ← Back
            </Link>
            <button type="button" onClick={handleDuplicate} className={themeBtnGhost}>
              Duplicate
            </button>
            {status !== "active" && (
              <button type="button" onClick={handlePublish} className={`px-4 py-2.5 text-sm font-semibold rounded-xl ${themeBtnPrimary}`}>
                Publish
              </button>
            )}
            {status === "active" && (
              <button type="button" onClick={handleSuspend} className={themeBtnGhost}>
                Suspend
              </button>
            )}
            <button type="button" onClick={() => handleSave(true)} className={`px-4 py-2.5 text-sm font-semibold rounded-xl ${themeBtnPrimary}`}>
              Save & Close
            </button>
          </div>
        }
        variants={itemVariants}
      />

      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl text-sm font-medium border ${themeBadge}`}
        >
          {saveMessage}
        </motion.div>
      )}

      {/* Quick stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Questions"
          percentage={`${questionIds.length} assigned`}
          data={String(questionIds.length)}
          progress={Math.min(100, questionIds.length * 4)}
        />
        <AnalyticsCard
          title="Time Limit"
          percentage={`${timeLimit} min`}
          data={`${timeLimit} min`}
          progress={Math.min(100, Math.round((timeLimit / 210) * 100))}
        />
        <AnalyticsCard
          title="Pass Score"
          percentage={`Target ${passingScore}%`}
          data={`${passingScore}%`}
          progress={passingScore}
        />
        <AnalyticsCard
          title="Attempts"
          percentage={avgScore > 0 ? `Avg ${avgScore}%` : "No data"}
          data={attempts.toLocaleString()}
          progress={Math.min(100, Math.round(attempts / 30))}
        />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-1 p-1 rounded-xl border bg-teal-50/40 dark:bg-teal-950/15 w-fit border-teal-200/70 dark:border-teal-900/40">
        {(["settings", "questions"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? `${themeSelected} shadow-sm` : themeIconBtn
            }`}
          >
            {tab}
            {tab === "questions" && (
              <span className="ml-1.5 text-[10px] opacity-70">({questionIds.length})</span>
            )}
          </button>
        ))}
      </motion.div>

      {activeTab === "settings" && (
        <motion.div variants={itemVariants} className={`${themePanel} p-6 space-y-5`}>
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Quiz Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2.5 text-sm rounded-xl ${themeInput}`}
              placeholder="e.g. AKT Full Mock Exam 2026"
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-3 text-sm rounded-xl resize-none ${themeInput}`}
              placeholder="Brief description for admins and learners..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Time Limit (mins)</label>
              <input
                type="number"
                min={5}
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className={`w-full px-4 py-2.5 text-sm rounded-xl ${themeInput}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Passing Score (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className={`w-full px-4 py-2.5 text-sm rounded-xl ${themeInput}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Exam Type</label>
              <CustomSelect
                value={examType}
                onChange={(v) => setExamType(v as Quiz["examType"])}
                options={[
                  { value: "AKT", label: "AKT" },
                  { value: "KFP", label: "KFP" },
                  { value: "Mixed", label: "Mixed" },
                ]}
                className="w-full"
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Status</label>
              <CustomSelect
                value={status}
                onChange={(v) => setStatus(v as QuizStatus)}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Suspended" },
                ]}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-2 ${themeLabel}`}>Topics</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    topics.includes(topic) ? themeSelected : themeSurface + " border-teal-200/70 text-teal-700 dark:text-teal-300"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={randomize}
              onChange={(e) => setRandomize(e.target.checked)}
              className="w-4 h-4 rounded border-teal-300 dark:border-teal-700 text-teal-700 focus:ring-teal-700/20"
            />
            <span className={`text-sm ${themeLabel}`}>Randomize question order for each attempt</span>
          </label>

          <div className="flex justify-between items-center pt-4 border-t border-teal-100/80 dark:border-teal-900/30">
            <button type="button" onClick={handleDelete} className="text-sm font-semibold text-teal-800/70 hover:text-teal-900 dark:text-teal-400">
              Delete Quiz
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => handleSave(false)} className={themeBtnGhost}>
                Save Draft
              </button>
              <button type="button" onClick={() => handleSave(true)} className={`px-4 py-2.5 text-sm font-semibold rounded-xl ${themeBtnPrimary}`}>
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "questions" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned questions */}
          <motion.div variants={itemVariants} className={`${themePanel} overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${themeBorder}`}>
              <h3 className={`text-sm font-bold ${themeText}`}>Assigned Questions ({questionIds.length})</h3>
              <p className={`text-xs mt-0.5 ${themeMuted}`}>Drag order using arrows. First question appears first in the exam.</p>
            </div>
            <div className="divide-y divide-teal-50 dark:divide-teal-900/20 max-h-[480px] overflow-y-auto">
              {assignedQuestions.length === 0 ? (
                <p className={`p-6 text-sm text-center ${themeMuted}`}>No questions assigned yet. Add from the question bank →</p>
              ) : (
                assignedQuestions.map((q, index) => (
                  <div key={q.id} className="px-5 py-3 flex items-start gap-3 group hover:bg-teal-50/30 dark:hover:bg-teal-950/10">
                    <span className={`text-xs font-bold mt-1 shrink-0 ${themeMuted}`}>#{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${themeText}`}>{q.text}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {q.topic.split(",").map((t) => (
                          <span key={t.trim()} className={`${themeBadgeSm} bg-teal-50 text-teal-800 border border-teal-200/40 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/40 font-semibold`}>{t.trim()}</span>
                        ))}
                        {q.tags && q.tags.map((tag) => (
                          <span key={tag} className={`${themeBadgeSm} bg-slate-50 text-slate-600 border border-slate-200/40 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800/40`}>{tag}</span>
                        ))}
                        <span className={themeBadgeSm}>{q.difficulty}</span>
                        <span className={themeBadgeSm}>{q.examType}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button type="button" onClick={() => moveQuestion(index, "up")} disabled={index === 0} className={`p-1 rounded disabled:opacity-30 ${themeIconBtn}`} title="Move up">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button type="button" onClick={() => moveQuestion(index, "down")} disabled={index === assignedQuestions.length - 1} className={`p-1 rounded disabled:opacity-30 ${themeIconBtn}`} title="Move down">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <button type="button" onClick={() => removeQuestion(q.id)} className={`p-1 rounded ${themeIconBtn}`} title="Remove">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Question bank */}
          <motion.div variants={itemVariants} className={`${themePanel} overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${themeBorder} space-y-3`}>
              <h3 className={`text-sm font-bold ${themeText}`}>Question Bank</h3>
              <input
                type="text"
                placeholder="Search questions..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className={`w-full px-4 py-2 text-sm rounded-xl ${themeInput}`}
              />
              <CustomSelect
                value={topicFilter}
                onChange={setTopicFilter}
                options={[{ value: "all", label: "All Topics" }, ...AVAILABLE_TOPICS.map((t) => ({ value: t, label: t }))]}
                className="w-full"
              />
            </div>
            <div className="divide-y divide-teal-50 dark:divide-teal-900/20 max-h-[400px] overflow-y-auto">
              {availableQuestions.length === 0 ? (
                <p className={`p-6 text-sm text-center ${themeMuted}`}>No matching questions available.</p>
              ) : (
                availableQuestions.map((q) => (
                  <div key={q.id} className="px-5 py-3 flex items-start gap-3 hover:bg-teal-50/30 dark:hover:bg-teal-950/10">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold mb-0.5 ${themeMuted}`}>#{q.id}</p>
                      <p className={`text-sm leading-snug ${themeText}`}>{q.text}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {q.topic.split(",").map((t) => (
                          <span key={t.trim()} className={`${themeBadgeSm} bg-teal-50 text-teal-800 border border-teal-200/40 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/40 font-semibold`}>{t.trim()}</span>
                        ))}
                        {q.tags && q.tags.map((tag) => (
                          <span key={tag} className={`${themeBadgeSm} bg-slate-50 text-slate-600 border border-slate-200/40 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800/40`}>{tag}</span>
                        ))}
                        <span className={themeBadgeSm}>{q.difficulty}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addQuestion(q.id)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg ${themeBtnPrimary}`}
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Status footer */}
      <motion.div variants={itemVariants} className={`${themePanel} px-5 py-3 flex items-center justify-between`}>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${themeBadge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${themeDot}`} />
          Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          {avgScore > 0 && <span className="ml-2 opacity-70">· Avg score {avgScore}%</span>}
        </span>
        <button type="button" onClick={() => handleSave(false)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${themeBtnPrimary}`}>
          Quick Save
        </button>
      </motion.div>
    </motion.div>
  );
}

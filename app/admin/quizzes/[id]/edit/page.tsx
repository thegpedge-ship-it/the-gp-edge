"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import CustomSelect from "@/components/admin/CustomSelect";
import {
  AVAILABLE_TOPICS,
  QUESTION_BANK,
  Quiz,
  QuizStatus,
  Question,
  deleteQuiz,
  duplicateQuiz,
  getQuizById,
  updateQuiz,
  saveQuestions,
  getQuestions,
  getTopics,
  getCustomTags,
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
  themeOptionIdle,
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
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  // Question creation modal state
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptionA, setNewOptionA] = useState("");
  const [newOptionB, setNewOptionB] = useState("");
  const [newOptionC, setNewOptionC] = useState("");
  const [newOptionD, setNewOptionD] = useState("");
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("A");
  const [newQuestionTopics, setNewQuestionTopics] = useState<string[]>(["Cardiology"]);
  const [newDifficulty, setNewDifficulty] = useState("Medium");
  const [newExamType, setNewExamType] = useState("AKT");
  const [newRationale, setNewRationale] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newQuestionTags, setNewQuestionTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const topicsList = useMemo(() => {
    const stored = typeof window !== "undefined" ? getTopics().map(t => t.name) : [];
    const derived = allQuestions.flatMap((q) => q.topic.split(",").map((t) => t.trim()));
    return Array.from(new Set([...stored, ...derived])).filter(Boolean);
  }, [allQuestions]);

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
    setAllQuestions(getQuestions());
  }, [quizId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showAddQuestionModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAddQuestionModal]);

  const resetAddQuestionForm = () => {
    setNewQuestionText("");
    setNewOptionA("");
    setNewOptionB("");
    setNewOptionC("");
    setNewOptionD("");
    setNewRationale("");
    setNewCorrectAnswer("A");
    setNewQuestionTopics(["Cardiology"]);
    setNewDifficulty("Medium");
    setNewExamType("AKT");
    setNewImage("");
    setNewQuestionTags([]);
    setTagSearch("");
  };

  const handleCreateAndAddQuestion = () => {
    if (!newQuestionText.trim()) {
      alert("Please enter the question text.");
      return;
    }
    const nextId = allQuestions.length > 0 ? Math.max(...allQuestions.map(q => q.id)) + 1 : 2855;
    const correctIndex = newCorrectAnswer === "A" ? 0 : newCorrectAnswer === "B" ? 1 : newCorrectAnswer === "C" ? 2 : 3;
    const newQuestion: Question = {
      id: nextId,
      text: newQuestionText,
      options: [newOptionA || "Option A", newOptionB || "Option B", newOptionC || "Option C", newOptionD || "Option D"],
      correctIndex,
      rationale: newRationale || "No explanation provided.",
      topic: newQuestionTopics.join(", "),
      difficulty: newDifficulty as "Easy" | "Medium" | "Hard",
      examType: newExamType as "AKT" | "KFP",
      status: "draft",
      tags: newQuestionTags.length > 0 ? newQuestionTags : ["General"],
      image: newImage || undefined,
    };
    const updated = [newQuestion, ...allQuestions];
    setAllQuestions(updated);
    saveQuestions(updated);

    // Add the new question to the current quiz
    setQuestionIds([...questionIds, nextId]);

    setShowAddQuestionModal(false);
    resetAddQuestionForm();
    setSaveMessage("New question created and added to quiz.");
    setTimeout(() => setSaveMessage(null), 3000);
  };

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
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${themeText}`}>Question Bank</h3>
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(true)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 ${themeBtnPrimary}`}
                  title="Create and add a new question"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create & Add
                </button>
              </div>
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

      {/* Create & Add Question Modal */}
      <AnimatePresence>
        {showAddQuestionModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] cursor-pointer"
              onClick={() => setShowAddQuestionModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }}
              className={`fixed inset-x-4 top-[5%] mx-auto max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border rounded-2xl z-[70] shadow-2xl overflow-y-auto max-h-[90vh] ${themeBorder}`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`font-serif text-xl font-normal tracking-tight leading-none ${themeText}`}>Create & Add Question</h2>
                  <button
                    onClick={() => setShowAddQuestionModal(false)}
                    className={`p-2 rounded-xl transition-all ${themeIconBtn}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Question Text</label>
                    <textarea
                      rows={3}
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className={`w-full px-4 py-3 text-sm rounded-xl transition-all resize-none dark:text-slate-100 ${themeInput}`}
                      placeholder="Enter the question..."
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Option A</label>
                    <input
                      type="text"
                      value={newOptionA}
                      onChange={(e) => setNewOptionA(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`}
                      placeholder="Option A..."
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Option B</label>
                    <input
                      type="text"
                      value={newOptionB}
                      onChange={(e) => setNewOptionB(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`}
                      placeholder="Option B..."
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Option C</label>
                    <input
                      type="text"
                      value={newOptionC}
                      onChange={(e) => setNewOptionC(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`}
                      placeholder="Option C..."
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Option D</label>
                    <input
                      type="text"
                      value={newOptionD}
                      onChange={(e) => setNewOptionD(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`}
                      placeholder="Option D..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Correct Answer</label>
                      <CustomSelect
                        value={newCorrectAnswer}
                        onChange={setNewCorrectAnswer}
                        options={[
                          { value: "A", label: "A" },
                          { value: "B", label: "B" },
                          { value: "C", label: "C" },
                          { value: "D", label: "D" },
                        ]}
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Topic(s) (select multiple or add custom)</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <CustomSelect
                          value=""
                          onChange={(val) => {
                            if (val && !newQuestionTopics.includes(val)) {
                              setNewQuestionTopics([...newQuestionTopics, val]);
                            }
                          }}
                          options={[
                            { value: "", label: "Select existing topic..." },
                            ...topicsList
                              .filter((t) => !newQuestionTopics.includes(t))
                              .map((t) => ({ value: t, label: t }))
                          ]}
                          className="flex-1"
                        />
                        <div className="flex gap-1 flex-1">
                          <input
                            type="text"
                            id="custom-topic-input"
                            placeholder="Or type custom topic..."
                            className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val && !newQuestionTopics.includes(val)) {
                                  setNewQuestionTopics([...newQuestionTopics, val]);
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById("custom-topic-input") as HTMLInputElement;
                              const val = input?.value.trim();
                              if (val && !newQuestionTopics.includes(val)) {
                                  setNewQuestionTopics([...newQuestionTopics, val]);
                                  input.value = "";
                              }
                            }}
                            className={`px-4 py-2.5 text-xs font-semibold rounded-xl shrink-0 transition-all ${themeBtnPrimary}`}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      
                      {/* Selected topics pills */}
                      {newQuestionTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/60 dark:border-slate-800/40">
                          {newQuestionTopics.map((topic) => (
                            <span key={topic} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/40">
                              {topic}
                              <button
                                type="button"
                                onClick={() => setNewQuestionTopics(newQuestionTopics.filter((t) => t !== topic))}
                                className="text-teal-500 hover:text-red-500 font-bold ml-1 text-base focus:outline-none"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Difficulty</label>
                      <CustomSelect
                        value={newDifficulty}
                        onChange={setNewDifficulty}
                        options={[
                          { value: "Easy", label: "Easy" },
                          { value: "Medium", label: "Medium" },
                          { value: "Hard", label: "Hard" },
                        ]}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Exam Type</label>
                      <CustomSelect
                        value={newExamType}
                        onChange={setNewExamType}
                        options={[
                          { value: "AKT", label: "AKT" },
                          { value: "KFP", label: "KFP" },
                        ]}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Attach Image Section */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Attach Clinical Image</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { name: "None", value: "" },
                        { name: "STEMI ECG", value: "/assets/ecg_inferior_stemi.png" },
                        { name: "Melanoma Dermoscopy", value: "/assets/melanoma_dermoscopy.png" },
                      ].map((imgOpt) => (
                        <button
                          type="button"
                          key={imgOpt.name}
                          onClick={() => setNewImage(imgOpt.value)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                            newImage === imgOpt.value
                              ? themeSelected
                              : themeOptionIdle
                          }`}
                        >
                          {imgOpt.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                          newImage && !newImage.startsWith("/assets/")
                            ? themeSelected
                            : themeOptionIdle
                        }`}
                      >
                        <svg className="w-4 h-4 text-teal-800 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {newImage && !newImage.startsWith("/assets/") ? "Uploaded" : "Upload File"}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                    {newImage && (
                      <div className={`mt-3 relative rounded-xl overflow-hidden border p-2 h-24 flex items-center justify-center shrink-0 ${themeSurface} ${themeBorder}`}>
                        <img src={newImage} alt="Preview" className="h-20 object-contain rounded-lg" />
                        <button 
                          type="button" 
                          onClick={() => {
                            setNewImage("");
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }} 
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-white hover:bg-slate-950 transition-all shadow"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Rationale / Explanation</label>
                    <textarea
                      rows={2}
                      value={newRationale}
                      onChange={(e) => setNewRationale(e.target.value)}
                      className={`w-full px-4 py-3 text-sm rounded-xl transition-all resize-none dark:text-slate-100 ${themeInput}`}
                      placeholder="Explain the correct answer..."
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Tags / Subtopics (Click to select/toggle)</label>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/60 dark:border-slate-800/40 mb-3">
                      {(() => {
                        const selectedTopics = newQuestionTopics;
                        if (selectedTopics.length === 0) {
                          return (
                            <span className="text-xs text-slate-400">Please select a topic above first to view related subtopics.</span>
                          );
                        }

                        const relatedTags = new Set<string>();

                        // 1. Check custom topics
                        const storedTopics = typeof window !== "undefined" ? getTopics() : [];
                        storedTopics.forEach((t) => {
                          if (selectedTopics.includes(t.name) && t.subtopicTags) {
                            t.subtopicTags.forEach((tag) => relatedTags.add(tag));
                          }
                        });

                        // 2. Check existing questions under these topics
                        allQuestions.forEach((q) => {
                          const qTopics = q.topic.split(",").map((tp) => tp.trim());
                          const hasOverlap = qTopics.some((tp) => selectedTopics.includes(tp));
                          if (hasOverlap && q.tags) {
                            q.tags.forEach((tag) => relatedTags.add(tag));
                          }
                        });

                        const filteredTags = Array.from(relatedTags).filter(Boolean);

                        if (filteredTags.length === 0) {
                          return (
                            <span className="text-xs text-slate-400">No related subtopics found for the selected topic(s). Add custom tags below.</span>
                          );
                        }

                        return filteredTags.map((tag) => {
                          const isSelected = newQuestionTags.includes(tag);
                          return (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => {
                                if (isSelected) {
                                  setNewQuestionTags(newQuestionTags.filter((t) => t !== tag));
                                } else {
                                  setNewQuestionTags([...newQuestionTags, tag]);
                                }
                              }}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? "bg-teal-700 border-teal-700 text-white shadow-sm shadow-teal-900/20"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add custom tag if not listed above..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = tagSearch.trim();
                            if (val && !newQuestionTags.includes(val)) {
                              setNewQuestionTags([...newQuestionTags, val]);
                              setTagSearch("");
                            }
                          }
                        }}
                        className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = tagSearch.trim();
                          if (val && !newQuestionTags.includes(val)) {
                            setNewQuestionTags([...newQuestionTags, val]);
                            setTagSearch("");
                          }
                        }}
                        className={`px-4 py-2.5 text-xs font-semibold rounded-xl shrink-0 transition-all ${themeBtnPrimary}`}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddQuestionModal(false)}
                      className={themeBtnGhost}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAndAddQuestion}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2 ${themeBtnPrimary}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create & Add
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

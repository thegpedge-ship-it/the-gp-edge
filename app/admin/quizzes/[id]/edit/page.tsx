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
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("A");
  const [newQuestionTopics, setNewQuestionTopics] = useState<string[]>(["Cardiology"]);
  const [newDifficulty, setNewDifficulty] = useState("Medium");
  const [newRationale, setNewRationale] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newQuestionTags, setNewQuestionTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");
  const [extractionState, setExtractionState] = useState<"idle" | "extracting" | "success">("idle");
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionLog, setExtractionLog] = useState("");
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const [batchFiles, setBatchFiles] = useState<{ id: string; name: string; size: string; progress: number; status: "idle" | "uploading" | "extracting" | "success" | "error"; error?: string }[]>([]);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

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
    if (showAddQuestionModal || showUploadModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAddQuestionModal, showUploadModal]);

  const resetAddQuestionForm = () => {
    setNewQuestionText("");
    setNewQuestionOptions(["", "", "", ""]);
    setNewRationale("");
    setNewCorrectAnswer("A");
    setNewQuestionTopics(["Cardiology"]);
    setNewDifficulty("Medium");
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
    const correctIndex = Math.min(newCorrectAnswer.charCodeAt(0) - 65, newQuestionOptions.length - 1);
    const newQuestion: Question = {
      id: nextId,
      text: newQuestionText,
      options: newQuestionOptions.map((opt, idx) => opt.trim() || `Option ${String.fromCharCode(65 + idx)}`),
      correctIndex,
      rationale: newRationale || "No explanation provided.",
      topic: newQuestionTopics.join(", "),
      difficulty: newDifficulty as "Easy" | "Medium" | "Hard",
      examType: "AKT" as const,
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

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setExtractionState("idle");
    setExtractedQuestions([]);

    // Initialize batch tracking for all files
    const initialBatch: {
      id: string;
      name: string;
      size: string;
      progress: number;
      status: "idle" | "uploading" | "extracting" | "success" | "error";
      error?: string;
    }[] = fileList.map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
      progress: 0,
      status: "idle",
    }));
    setBatchFiles(initialBatch);
    setUploadState("uploading");
    setUploadProgress(0);
    setUploadedFileName(fileList.length === 1 ? fileList[0].name : `${fileList.length} files`);
    setUploadedFileSize(
      (fileList.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2) + " MB"
    );

    // Process all files concurrently
    const allExtracted: any[] = [];
    let completedCount = 0;

    const updateBatchFile = (idx: number, updates: Partial<typeof initialBatch[0]>) => {
      setBatchFiles(prev => prev.map((bf, i) => i === idx ? { ...bf, ...updates } : bf));
    };

    await Promise.allSettled(
      fileList.map(async (file, idx) => {
        updateBatchFile(idx, { status: "uploading", progress: 10 });

        // Simulate incremental progress
        const progressTimer = setInterval(() => {
          updateBatchFile(idx, { progress: Math.min(90, 10 + Math.random() * 50) });
        }, 200);

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "question");

          updateBatchFile(idx, { status: "extracting", progress: 40 });

          const res = await fetch("/api/extract", {
            method: "POST",
            body: formData,
          });

          clearInterval(progressTimer);

          const result = await res.json();
          if (result.success && result.type === "question") {
            const qs = result.questions || [];
            allExtracted.push(...qs);
            updateBatchFile(idx, { status: "success", progress: 100 });
          } else {
            updateBatchFile(idx, {
              status: "error",
              progress: 100,
              error: result.error || "Failed to extract questions from this file.",
            });
          }
        } catch (err: any) {
          clearInterval(progressTimer);
          updateBatchFile(idx, { status: "error", progress: 100, error: err.message });
        }

        completedCount++;
        setUploadProgress(Math.round((completedCount / fileList.length) * 100));
      })
    );

    // All files processed — merge results
    setUploadProgress(100);
    setExtractedQuestions(allExtracted);
    setUploadState("success");
    runExtractionAnim(allExtracted);

    // Reset file input so re-selecting the same files works
    if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
  };

  const runExtractionAnim = (parsedQs: any[]) => {
    setExtractionState("extracting");
    setExtractionProgress(0);
    setExtractionLog("Opening document stream...");
    
    setTimeout(() => {
      setExtractionProgress(30);
      setExtractionLog("Parsing structured question blocks...");
    }, 300);

    setTimeout(() => {
      setExtractionProgress(65);
      setExtractionLog("Decoding images and option lists...");
    }, 600);

    setTimeout(() => {
      setExtractionProgress(90);
      setExtractionLog("Validating answers and topics...");
    }, 900);

    setTimeout(() => {
      setExtractionProgress(100);
      setExtractionState("success");
      setExtractionLog("Extraction complete!");
    }, 1200);
  };

  const handleSaveImportedQuestions = () => {
    if (!extractedQuestions || extractedQuestions.length === 0) return;
    
    let nextId = allQuestions.length > 0 ? Math.max(...allQuestions.map(q => q.id)) + 1 : 2855;
    const newQIds: number[] = [];
    const newQs = extractedQuestions.map((q: any) => {
      const cleanedTags = q.tags
        ? q.tags.map((t: string) => t.trim()).filter(Boolean)
        : ["General"];
      const questionId = nextId++;
      newQIds.push(questionId);
      const newQ = {
        ...q,
        id: questionId,
        topic: q.topic ? q.topic.trim() : "General",
        difficulty: q.difficulty || "Medium",
        examType: "AKT" as const,
        tags: cleanedTags.length > 0 ? cleanedTags : ["General"],
        status: "draft" as const
      };
      return newQ;
    });

    const updated = [...newQs, ...allQuestions];
    setAllQuestions(updated);
    saveQuestions(updated);
    
    // Assign imported questions to this quiz
    setQuestionIds((prev) => [...prev, ...newQIds]);

    addUserNotification(
      `${newQs.length} Questions Imported`,
      `Successfully imported ${newQs.length} questions from document template and added them to this quiz.`,
      newQs.length,
      "new-questions"
    );

    setShowUploadModal(false);
    setUploadState("idle");
    setExtractionState("idle");
    setExtractedQuestions([]);
    
    alert(`Successfully imported ${newQs.length} questions as drafts and added them to this quiz!`);
  };

  const handleUpdateExtractedQuestion = (idx: number, field: string, value: any) => {
    setExtractedQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className={`text-sm font-bold ${themeText}`}>Question Bank</h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(true);
                      setUploadState("idle");
                      setExtractionState("idle");
                      setExtractedQuestions([]);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 ${themeBtnGhost} border ${themeBorder}`}
                    title="Upload questions document"
                  >
                    <svg className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetAddQuestionForm();
                      setShowAddQuestionModal(true);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 ${themeBtnPrimary}`}
                    title="Create and add a new question"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Create & Add
                  </button>
                </div>
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
                      rows={6}
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className={`w-full px-4 py-3 text-sm rounded-xl transition-all resize-y dark:text-slate-100 ${themeInput} min-h-[150px]`}
                      placeholder="Enter the question..."
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className={`block text-xs font-semibold ${themeLabel}`}>Options & Correct Answer</label>
                      <button
                        type="button"
                        onClick={() => setNewQuestionOptions([...newQuestionOptions, ""])}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-350 transition flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Option
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {newQuestionOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const letter = String.fromCharCode(65 + idx);
                              setNewCorrectAnswer(letter);
                            }}
                            className="flex items-center justify-center shrink-0 focus:outline-none"
                            title="Mark as Correct Answer"
                          >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              newCorrectAnswer === String.fromCharCode(65 + idx)
                                ? "border-teal-600 dark:border-teal-400 bg-teal-600 dark:bg-teal-400 shadow-sm shadow-teal-900/30"
                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-500"
                            }`}>
                              {newCorrectAnswer === String.fromCharCode(65 + idx) && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                          </button>
                          <span className="text-xs font-bold text-slate-400">{String.fromCharCode(65 + idx)}:</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const nextOpts = [...newQuestionOptions];
                              nextOpts[idx] = e.target.value;
                              setNewQuestionOptions(nextOpts);
                            }}
                            className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border ${themeInput}`}
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          />
                          {newQuestionOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextOpts = newQuestionOptions.filter((_, oidx) => oidx !== idx);
                                setNewQuestionOptions(nextOpts);
                                if (newCorrectAnswer === String.fromCharCode(65 + idx)) {
                                  setNewCorrectAnswer("A");
                                } else if (newCorrectAnswer.charCodeAt(0) - 65 > idx) {
                                  setNewCorrectAnswer(String.fromCharCode(newCorrectAnswer.charCodeAt(0) - 1));
                                }
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                              title="Delete Option"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Correct Answer</label>
                      <CustomSelect
                        value={newCorrectAnswer}
                        onChange={setNewCorrectAnswer}
                        options={newQuestionOptions.map((_, idx) => {
                          const letter = String.fromCharCode(65 + idx);
                          return { value: letter, label: letter };
                        })}
                        className="w-full"
                      />
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
                  </div>

                  {/* Attach Image Section */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Attach Clinical Image</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                          newImage
                            ? themeSelected
                            : themeOptionIdle
                        }`}
                      >
                        <svg className="w-4 h-4 text-teal-800 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {newImage ? "Image Uploaded" : "Upload File"}
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
                      <div className={`mt-3 relative rounded-xl overflow-hidden border p-3 w-full max-h-96 flex items-center justify-center ${themeSurface} ${themeBorder}`}>
                        <img src={newImage} alt="Preview" className="max-h-80 w-auto object-contain rounded-lg shadow-sm" />
                        <button 
                          type="button" 
                          onClick={() => {
                            setNewImage("");
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }} 
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-950 transition-all shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Rationale / Explanation</label>
                    <textarea
                      rows={6}
                      value={newRationale}
                      onChange={(e) => setNewRationale(e.target.value)}
                      className={`w-full px-4 py-3 text-sm rounded-xl transition-all resize-y dark:text-slate-100 ${themeInput} min-h-[150px]`}
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

      {/* Upload Questions Document Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] cursor-pointer"
              onClick={() => setShowUploadModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }}
              className={`fixed inset-x-4 top-[5%] mx-auto w-full ${
                uploadState === "success" && extractionState === "success" ? "max-w-6xl" : "max-w-2xl"
              } bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border rounded-2xl z-[70] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${themeBorder}`}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#090d16] text-white rounded-t-2xl">
                <div>
                  <h3 className="font-serif text-lg font-bold">Import Questions from Document</h3>
                  <p className="text-xs text-slate-400">Upload a DOCX or PDF template to import multiple questions instantly</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[calc(90vh-160px)]">
                {uploadState === "idle" && (
                  <div className="space-y-5">
                    {/* Instructions Card */}
                    <div className="bg-teal-50/40 dark:bg-teal-950/10 border border-teal-100/50 dark:border-teal-900/30 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-teal-800 dark:text-teal-400">
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold uppercase tracking-wider">Instructions</span>
                      </div>
                      <p className="text-xs text-teal-950/70 dark:text-teal-300/80 leading-relaxed font-semibold">
                        Note: Please use the questions import template available in the Questions section to format your document before uploading.
                      </p>
                    </div>

                    {/* File Upload Zone */}
                    <div
                      onClick={() => uploadFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50/10 transition-all flex flex-col items-center justify-center min-h-[160px]"
                    >
                      <input
                        type="file"
                        ref={uploadFileInputRef}
                        onChange={handleUploadFile}
                        accept=".docx,.pdf"
                        multiple
                        className="hidden"
                      />
                      <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Drag & Drop Question DOCX or PDF here</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">or click to choose files from your system (Max 10MB)</p>
                    </div>
                  </div>
                )}

                {uploadState === "uploading" && (
                  <div className="space-y-3">
                    {/* Overall progress header */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/20 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-bold px-1 mb-2">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[240px]">Processing {uploadedFileName}</span>
                        <span className="text-teal-600 dark:text-teal-400 font-mono">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 dark:bg-teal-400 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 pt-1.5">Total size: {uploadedFileSize} · Extracting questions from documents...</p>
                    </div>

                    {/* Per-file status list */}
                    {batchFiles.length > 1 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {batchFiles.map((bf) => (
                          <div key={bf.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs ${
                            bf.status === "success" ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/10" :
                            bf.status === "error" ? "border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/10" :
                            "border-slate-200 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-800/20"
                          }`}>
                            {/* Status icon */}
                            {bf.status === "success" ? (
                              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            ) : bf.status === "error" ? (
                              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            ) : (
                              <svg className="w-4 h-4 text-teal-600 animate-spin shrink-0" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-slate-700 dark:text-slate-350 truncate block">{bf.name}</span>
                              {bf.error && <span className="text-red-500 text-[10px] truncate block">{bf.error}</span>}
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">{bf.size}</span>
                            {/* Mini progress bar */}
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
                              <div className={`h-full transition-all duration-300 rounded-full ${
                                bf.status === "success" ? "bg-emerald-500" : bf.status === "error" ? "bg-red-400" : "bg-teal-500"
                              }`} style={{ width: `${bf.progress}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {uploadState === "success" && (
                  <div className="space-y-4">
                    {/* Extraction Progress Loading state */}
                    {extractionState === "extracting" && (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/20 space-y-5 shadow-sm text-center">
                        <div className="flex items-center justify-between text-xs font-bold px-1 text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-teal-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>{extractionLog}</span>
                          </span>
                          <span className="font-mono text-teal-600 dark:text-teal-400">{extractionProgress}%</span>
                        </div>

                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-600 dark:bg-teal-400 transition-all duration-300"
                            style={{ width: `${extractionProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Extraction success - show preview */}
                    {extractionState === "success" && (
                      <div className="space-y-4 flex flex-col h-full">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Extracted Questions ({extractedQuestions.length})
                          </h4>
                          <button
                            onClick={() => {
                              setUploadState("idle");
                              setExtractionState("idle");
                              setExtractedQuestions([]);
                            }}
                            className="text-[10px] font-bold text-slate-505 hover:text-red-500 transition-colors"
                          >
                            Upload Another File
                          </button>
                        </div>

                        {extractedQuestions.length === 0 ? (
                          <div className="border border-red-200 bg-red-50/50 rounded-2xl p-6 text-center text-xs text-red-700">
                            No questions could be parsed from the document. Please verify the template layout and tags are correct.
                          </div>
                        ) : (
                          <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
                            {extractedQuestions.map((q, qidx) => (
                              <div
                                key={qidx}
                                className={`p-5 rounded-2xl border ${themeBorder} ${themeSurface} space-y-4 shadow-sm relative text-slate-950 dark:text-slate-50`}
                              >
                                {/* Header */}
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                  <span className="text-sm font-bold text-teal-800 dark:text-teal-400">
                                    Question {qidx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExtractedQuestions((prev) => prev.filter((_, i) => i !== qidx));
                                    }}
                                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                    title="Discard Question"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>

                                {/* Question Text */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Question Text</label>
                                  <textarea
                                    rows={6}
                                    value={q.text}
                                    onChange={(e) => handleUpdateExtractedQuestion(qidx, "text", e.target.value)}
                                    className={`w-full px-3 py-2 text-xs rounded-xl transition-all resize-y dark:text-slate-100 ${themeInput} min-h-[150px]`}
                                    placeholder="Question text..."
                                  />
                                </div>

                                {/* Options grid */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-semibold text-slate-500">Options & Correct Answer</label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextOpts = [...q.options, ""];
                                        handleUpdateExtractedQuestion(qidx, "options", nextOpts);
                                      }}
                                      className="text-[11px] font-bold text-teal-700 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-350 transition flex items-center gap-1"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                      </svg>
                                      Add Option
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {q.options.map((opt: string, oidx: number) => (
                                      <div key={oidx} className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateExtractedQuestion(qidx, "correctIndex", oidx)}
                                          className="flex items-center justify-center shrink-0 focus:outline-none"
                                          title="Mark as Correct Answer"
                                        >
                                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                            q.correctIndex === oidx
                                              ? "border-teal-600 dark:border-teal-400 bg-teal-600 dark:bg-teal-400 shadow-sm shadow-teal-900/30"
                                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-500"
                                          }`}>
                                            {q.correctIndex === oidx && (
                                              <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                          </div>
                                        </button>
                                        <span className="text-xs font-bold text-slate-400">{String.fromCharCode(65 + oidx)}:</span>
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => {
                                            const nextOpts = [...q.options];
                                            nextOpts[oidx] = e.target.value;
                                            handleUpdateExtractedQuestion(qidx, "options", nextOpts);
                                          }}
                                          className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border ${themeInput}`}
                                          placeholder={`Option ${String.fromCharCode(65 + oidx)}`}
                                        />
                                        {q.options.length > 2 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextOpts = q.options.filter((_: string, idx: number) => idx !== oidx);
                                              let nextCorrectIndex = q.correctIndex;
                                              if (nextCorrectIndex === oidx) {
                                                nextCorrectIndex = 0;
                                              } else if (nextCorrectIndex > oidx) {
                                                nextCorrectIndex -= 1;
                                              }
                                              handleUpdateExtractedQuestion(qidx, "options", nextOpts);
                                              handleUpdateExtractedQuestion(qidx, "correctIndex", nextCorrectIndex);
                                            }}
                                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                                            title="Delete Option"
                                          >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Metadata row */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Topic</label>
                                    <input
                                      type="text"
                                      value={q.topic}
                                      onChange={(e) => handleUpdateExtractedQuestion(qidx, "topic", e.target.value)}
                                      className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${themeInput}`}
                                      placeholder="Topic..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-505 mb-1">Subtopic</label>
                                    <input
                                      type="text"
                                      value={q.subtopic}
                                      onChange={(e) => handleUpdateExtractedQuestion(qidx, "subtopic", e.target.value)}
                                      className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${themeInput}`}
                                      placeholder="Subtopic..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Difficulty</label>
                                    <CustomSelect
                                      value={q.difficulty || "Medium"}
                                      onChange={(val) => handleUpdateExtractedQuestion(qidx, "difficulty", val)}
                                      options={[
                                        { value: "Easy", label: "Easy" },
                                        { value: "Medium", label: "Medium" },
                                        { value: "Hard", label: "Hard" },
                                      ]}
                                      className="w-full text-xs"
                                    />
                                  </div>
                                </div>

                                {/* Tags input */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tags (comma-separated)</label>
                                  <input
                                    type="text"
                                    value={q.tags ? q.tags.join(", ") : ""}
                                    onChange={(e) => {
                                      const arr = e.target.value.split(",").map(t => t.trimStart());
                                      handleUpdateExtractedQuestion(qidx, "tags", arr);
                                    }}
                                    className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${themeInput}`}
                                    placeholder="Enter tags..."
                                  />
                                </div>

                                {/* Rationale */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Rationale / Explanation</label>
                                  <textarea
                                    rows={6}
                                    value={q.rationale}
                                    onChange={(e) => handleUpdateExtractedQuestion(qidx, "rationale", e.target.value)}
                                    className={`w-full px-3 py-2 text-xs rounded-xl transition-all resize-y dark:text-slate-100 ${themeInput} min-h-[150px]`}
                                    placeholder="Rationale explanation..."
                                  />
                                </div>

                                {/* Image Section */}
                                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/30">
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-2">Clinical Diagnostic Image</label>
                                  <div className="flex flex-wrap items-center gap-3">
                                    {q.image ? (
                                      <div className="relative rounded-xl overflow-hidden border p-3 bg-white dark:bg-slate-950/30 flex items-center justify-center max-w-md max-h-72 shrink-0">
                                        <img src={q.image} alt="Extracted clinical file" className="max-h-64 w-auto object-contain rounded-lg shadow-sm" />
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateExtractedQuestion(qidx, "image", undefined)}
                                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition shadow"
                                          title="Remove Image"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400">No image attached.</span>
                                    )}
                                    
                                    <label className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${themeBadge}`}>
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                      </svg>
                                      {q.image ? "Replace Image" : "Upload Image"}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              handleUpdateExtractedQuestion(qidx, "image", reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 rounded-b-2xl">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className={themeBtnGhost}
                    >
                      Cancel
                    </button>
                    {uploadState === "success" && extractionState === "success" && extractedQuestions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSaveImportedQuestions}
                        className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${themeBtnPrimary}`}
                      >
                        Import & Add to Quiz
                      </button>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
    </motion.div>
  );
}

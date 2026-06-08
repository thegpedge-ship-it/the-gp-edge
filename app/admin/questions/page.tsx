"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import {
  themeBadge,
  themeBadgeMd,
  themeBadgePill,
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
  themeSelected,
  themeSurface,
  themeText,
} from "@/lib/adminTheme";
import { addUserNotification } from "@/utils/notifications";
import { Question, getQuestions, saveQuestions, getTopics, getCustomTags } from "@/lib/quizData";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

type StatusFilter = "all" | "draft" | "review" | "published";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("A");
  const [newQuestionTopics, setNewQuestionTopics] = useState<string[]>(["Cardiology"]);
  const [newDifficulty, setNewDifficulty] = useState("Medium");
  const [newExamType, setNewExamType] = useState("AKT");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptionA, setNewOptionA] = useState("");
  const [newOptionB, setNewOptionB] = useState("");
  const [newOptionC, setNewOptionC] = useState("");
  const [newOptionD, setNewOptionD] = useState("");
  const [newRationale, setNewRationale] = useState("");
  const [newQuestionTags, setNewQuestionTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [newImage, setNewImage] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize questions from localStorage
  useEffect(() => {
    setQuestions(getQuestions());
  }, []);

  // Handle optional question pre-viewing via query parameter (e.g. from Search page)
  useEffect(() => {
    if (typeof window !== "undefined" && questions.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const qid = params.get("id");
      if (qid) {
        const found = questions.find((q) => q.id === parseInt(qid, 10));
        if (found) {
          setPreviewQuestion(found);
          // Clear query parameter from browser address bar
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    }
  }, [questions]);

  // Lock body scroll when any modal is open to prevent background scrolling lag
  useEffect(() => {
    if (showAddModal || previewQuestion || zoomImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAddModal, previewQuestion, zoomImage]);

  const resetAddForm = () => {
    setNewQuestionText("");
    setNewOptionA("");
    setNewOptionB("");
    setNewOptionC("");
    setNewOptionD("");
    setNewRationale("");
    setNewQuestionTags([]);
    setTagSearch("");
    setShowTagSuggestions(false);
    setNewImage("");
    setNewCorrectAnswer("A");
    setNewQuestionTopics(["Cardiology"]);
    setNewDifficulty("Medium");
    setNewExamType("AKT");
  };

  const topics = (() => {
    const stored = typeof window !== "undefined" ? getTopics().map(t => t.name) : [];
    const derived = questions.flatMap((q) => q.topic.split(",").map((t) => t.trim()));
    return Array.from(new Set([...stored, ...derived])).filter(Boolean);
  })();

  const filtered = questions.filter((q) => {
    const matchSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) || q.id.toString().includes(searchQuery);
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    const matchTopic = topicFilter === "all" || q.topic.split(",").map((t) => t.trim()).includes(topicFilter);
    const matchDifficulty = difficultyFilter === "all" || q.difficulty === difficultyFilter;
    return matchSearch && matchStatus && matchTopic && matchDifficulty;
  });

  const updateStatus = (id: number, newStatus: Question["status"]) => {
    const updated = questions.map((q) => (q.id === id ? { ...q, status: newStatus } : q));
    setQuestions(updated);
    saveQuestions(updated);
  };

  const deleteQuestion = (id: number) => {
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    saveQuestions(updated);
  };

  const handleCreateQuestion = () => {
    if (!newQuestionText.trim()) {
      alert("Please enter the question text.");
      return;
    }
    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 2855;
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
    const updated = [newQuestion, ...questions];
    setQuestions(updated);
    saveQuestions(updated);
    setShowAddModal(false);
    resetAddForm();

    // Reset filters to ensure the user immediately sees their new question at the top of the list
    setSearchQuery("");
    setStatusFilter("all");
    setTopicFilter("all");
    setDifficultyFilter("all");

    addUserNotification(
      "New Question Added",
      `Admin added a new practice question to the ${newQuestionTopics.join(", ")} category.`,
      1,
      "new-questions"
    );
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Question"
        highlightedText="Management"
        subtitle={`${questions.length} questions in bank`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const count = 100;
                addUserNotification(
                  `${count} New Questions Added`,
                  `Admin has successfully added a batch of ${count} new practice questions to the Cardiology & Mental Health categories.`,
                  count,
                  "new-questions"
                );
                alert(`${count} new questions successfully published to user dashboard notifications!`);
              }}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 ${themeBtnPrimary}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Simulate Question Set (+100 Qs)
            </button>
            <button className={`${themeBtnGhost} flex items-center gap-2`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              CSV Upload
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 ${themeBtnPrimary}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Question
            </button>
          </div>
        }
        variants={itemVariants}
      />

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center relative z-20">
        <div className="relative flex-1 max-w-sm">
          <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search questions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl transition-all ${themeInput}`} />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as StatusFilter)}
          options={[
            { value: "all", label: "All Status" },
            { value: "draft", label: "Draft" },
            { value: "review", label: "Review" },
            { value: "published", label: "Published" },
          ]}
          className="w-48"
        />
        <CustomSelect
          value={topicFilter}
          onChange={setTopicFilter}
          options={[
            { value: "all", label: "All Topics" },
            ...topics.map((t) => ({ value: t, label: t })),
          ]}
          className="w-48"
        />
        <CustomSelect
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={[
            { value: "all", label: "All Difficulty" },
            { value: "Easy", label: "Easy" },
            { value: "Medium", label: "Medium" },
            { value: "Hard", label: "Hard" },
          ]}
          className="w-48"
        />
      </motion.div>

      {/* Questions table */}
      <motion.div variants={itemVariants} className={`bg-white/60 backdrop-blur-xl rounded-2xl shadow-md shadow-teal-900/5 overflow-hidden relative ${themeBorder} border`}>
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${themeBorder}`}>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-3 ${themeLabel}`}>ID</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 ${themeLabel}`}>Question</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 ${themeLabel}`}>Topic</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 ${themeLabel}`}>Difficulty</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 ${themeLabel}`}>Exam</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 ${themeLabel}`}>Status</th>
                <th className={`text-right text-xs font-semibold uppercase tracking-wider px-6 py-3 ${themeLabel}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-50 dark:divide-teal-900/20">
              {filtered.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => setPreviewQuestion(q)}
                  className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${themeMuted}`}>#{q.id}</span>
                  </td>
                  <td className="px-4 py-4 max-w-md">
                    <p className={`text-sm truncate font-semibold ${themeText}`}>{q.text}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {q.image && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${themeBadge}`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Clinical Image
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${themeMuted}`}>Subtopics:</span>
                      {q.tags.map((tag) => (
                        <span key={tag} className={themeBadgeSm}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {q.topic.split(",").map((t) => (
                        <span key={t.trim()} className={themeBadgePill}>{t.trim()}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={themeBadgeMd}>{q.difficulty}</span>
                  </td>
                  <td className="px-4 py-4"><span className={themeBadgeMd}>{q.examType}</span></td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${themeBadge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${themeDot}`} />
                      {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <button onClick={() => setPreviewQuestion(q)} className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`} title="Preview">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {q.status === "draft" && (
                        <button onClick={() => updateStatus(q.id, "review")} className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`} title="Send to Review">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      )}
                      {q.status === "review" && (
                        <button onClick={() => updateStatus(q.id, "published")} className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`} title="Publish">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      )}
                      <button onClick={() => deleteQuestion(q.id)} className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`} title="Delete">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Question Preview Modal */}
      <AnimatePresence>
        {previewQuestion && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[60] cursor-pointer"
              onClick={() => setPreviewQuestion(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }}
              className={`fixed inset-x-4 top-[10%] mx-auto max-w-2xl bg-white dark:bg-slate-900 border rounded-3xl z-[70] shadow-2xl overflow-y-auto max-h-[80vh] text-teal-950 dark:text-teal-50/90 ${themeBorder}`}
            >
              <div className="p-6 relative">
                {/* Header */}
                <div className={`flex items-center justify-between pb-4 mb-4 border-b ${themeBorder}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full inline-block shadow-[0_0_6px_rgba(15,118,110,0.35)] ${themeDot}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${themeLabel}`}>
                      {previewQuestion.examType} Practice Case
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${themeBadge}`}>
                      {previewQuestion.difficulty}
                    </span>

                    {/* Topics and Tags in Header */}
                    {previewQuestion.topic.split(",").map((t) => (
                      <span key={t.trim()} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/40">
                        {t.trim()}
                      </span>
                    ))}
                    {previewQuestion.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-800/40">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${themeBadge}`}>
                      #{previewQuestion.id}
                    </span>
                    <button
                      onClick={() => setPreviewQuestion(null)}
                      className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Question */}
                <p className={`text-base font-medium leading-relaxed mb-6 font-sans ${themeText}`}>
                  {previewQuestion.text}
                </p>

                {/* Question Image (High Resolution Container) */}
                {previewQuestion.image && (
                  <div 
                    onClick={() => setZoomImage(previewQuestion.image!)}
                    className={`relative rounded-2xl overflow-hidden border p-2.5 mb-6 group cursor-zoom-in transition-all ${themeSurface} ${themeBorder} hover:border-teal-300 dark:hover:border-teal-700`}
                  >
                    <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity font-semibold flex items-center gap-1 shadow-lg">
                      <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Click to zoom
                    </div>
                    <img 
                      src={previewQuestion.image} 
                      alt="Clinical diagnostic image" 
                      className="max-h-64 mx-auto rounded-xl object-contain transition-transform duration-300 group-hover:scale-[1.01]" 
                    />
                  </div>
                )}

                {/* Options list */}
                <div className="space-y-3 mb-6">
                  {previewQuestion.options.map((opt, i) => {
                    const isCorrect = i === previewQuestion.correctIndex;
                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${
                          isCorrect
                            ? `border-teal-700 ${themeSurface} ${themeText} shadow-sm`
                            : `border-teal-100 dark:border-teal-900/30 ${themeSurface} text-teal-700/80 dark:text-teal-400/80`
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                            isCorrect
                              ? "bg-teal-800 border-teal-700 text-white shadow-sm shadow-teal-900/25"
                              : `${themeSurface} border-teal-200/70 dark:border-teal-900/40 text-teal-800 dark:text-teal-400`
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-sm font-semibold">{opt}</span>
                        {isCorrect && (
                          <svg className="w-5 h-5 text-teal-800 dark:text-teal-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Rationale */}
                <div className="bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl p-4 text-xs leading-relaxed text-teal-950 dark:text-teal-300">
                  <div className="font-bold mb-1.5 flex items-center gap-1.5 text-teal-800 dark:text-teal-400 text-[13px]">
                    <svg className="w-4 h-4 text-teal-800 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Correct Answer Rationale
                  </div>
                  <p className="font-normal leading-relaxed text-teal-900/70 dark:text-teal-300/80">{previewQuestion.rationale}</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] cursor-pointer" onClick={() => setShowAddModal(false)} />
             <motion.div initial={{ opacity: 0, scale: 0.96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 15 }} transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }} className={`fixed inset-x-4 top-[5%] mx-auto max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border rounded-2xl z-[70] shadow-2xl overflow-y-auto max-h-[90vh] ${themeBorder}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`font-serif text-xl font-normal tracking-tight leading-none ${themeText}`}>Add New Question</h2>
                  <button onClick={() => setShowAddModal(false)} className={`p-2 rounded-xl transition-all ${themeIconBtn}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Question Text</label>
                    <textarea rows={3} value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} className={`w-full px-4 py-3 text-sm rounded-xl transition-all resize-none dark:text-slate-100 ${themeInput}`} placeholder="Enter the question..." />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Option A</label>
                    <input type="text" value={newOptionA} onChange={(e) => setNewOptionA(e.target.value)} className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`} placeholder="Option A..." />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Option B</label>
                    <input type="text" value={newOptionB} onChange={(e) => setNewOptionB(e.target.value)} className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`} placeholder="Option B..." />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Option C</label>
                    <input type="text" value={newOptionC} onChange={(e) => setNewOptionC(e.target.value)} className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`} placeholder="Option C..." />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Option D</label>
                    <input type="text" value={newOptionD} onChange={(e) => setNewOptionD(e.target.value)} className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`} placeholder="Option D..." />
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
                            ...topics
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
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Rationale</label>
                    <textarea rows={3} value={newRationale} onChange={(e) => setNewRationale(e.target.value)} className={`w-full px-4 py-3 text-sm rounded-xl transition-all resize-none dark:text-slate-100 ${themeInput}`} placeholder="Explain the correct answer..." />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Tags / Subtopics (Click to select/toggle)</label>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/60 dark:border-slate-800/40 mb-3">
                      {(() => {
                        const allExistingTags = Array.from(
                          new Set([
                            ...getCustomTags(),
                            ...questions.flatMap((q) => q.tags || [])
                          ])
                        ).filter(Boolean);

                        if (allExistingTags.length === 0) {
                          return (
                            <span className="text-xs text-slate-400">No tags available. Type below to add a new custom tag.</span>
                          );
                        }

                        return allExistingTags.map((tag) => {
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
                    <button onClick={() => setShowAddModal(false)} className={themeBtnGhost}>Cancel</button>
                    <button
                      onClick={handleCreateQuestion}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${themeBtnPrimary}`}
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* High Resolution Lightbox Modal */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 cursor-zoom-out"
            onClick={() => setZoomImage(null)}
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:scale-105 transition-all shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800/60 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomImage}
                alt="High Resolution Clinical Image Detail"
                className="rounded-xl max-h-[75vh] w-auto object-contain shadow-2xl"
              />
              <div className={`mt-3 text-xs font-semibold tracking-wide flex items-center gap-1.5 ${themeMuted}`}>
                <svg className="w-3.5 h-3.5 text-teal-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                High Resolution Diagnostic View · Click outside to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

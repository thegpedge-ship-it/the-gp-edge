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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [visibleCount, setVisibleCount] = useState(9);

  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [newRationale, setNewRationale] = useState("");
  const [newQuestionTags, setNewQuestionTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [newImage, setNewImage] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
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

  // Reset visibleCount when search query or filters change
  useEffect(() => {
    setVisibleCount(9);
  }, [searchQuery, statusFilter, topicFilter, difficultyFilter]);

  // Lock body scroll when any modal is open to prevent background scrolling lag
  useEffect(() => {
    if (showAddModal || showUploadModal || previewQuestion || zoomImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAddModal, showUploadModal, previewQuestion, zoomImage]);

  const resetAddForm = () => {
    setNewQuestionText("");
    setNewQuestionOptions(["", "", "", ""]);
    setNewRationale("");
    setNewQuestionTags([]);
    setTagSearch("");
    setShowTagSuggestions(false);
    setNewImage("");
    setNewCorrectAnswer("A");
    setNewQuestionTopics(["Cardiology"]);
    setNewDifficulty("Medium");
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
    const correctIndex = Math.min(newCorrectAnswer.charCodeAt(0) - 65, newQuestionOptions.length - 1);

    if (editingQuestion) {
      const updated = questions.map((q) => {
        if (q.id === editingQuestion.id) {
          return {
            ...q,
            text: newQuestionText,
            options: newQuestionOptions.map((opt, idx) => opt.trim() || `Option ${String.fromCharCode(65 + idx)}`),
            correctIndex,
            rationale: newRationale || "No explanation provided.",
            topic: newQuestionTopics.join(", "),
            difficulty: newDifficulty as "Easy" | "Medium" | "Hard",
            examType: "AKT" as const,
            tags: newQuestionTags.length > 0 ? newQuestionTags : ["General"],
            image: newImage || undefined,
          };
        }
        return q;
      });
      setQuestions(updated);
      saveQuestions(updated);
      setShowAddModal(false);
      setEditingQuestion(null);
      resetAddForm();
      return;
    }

    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 2855;
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
    
    let nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 2855;
    const newQs = extractedQuestions.map((q: any) => {
      const cleanedTags = q.tags
        ? q.tags.map((t: string) => t.trim()).filter(Boolean)
        : ["General"];
      const newQ = {
        ...q,
        id: nextId++,
        topic: q.topic ? q.topic.trim() : "General",
        difficulty: q.difficulty || "Medium",
        examType: q.examType || "AKT",
        tags: cleanedTags.length > 0 ? cleanedTags : ["General"],
        status: "draft" as const
      };
      return newQ;
    });

    const updated = [...newQs, ...questions];
    setQuestions(updated);
    saveQuestions(updated);
    
    addUserNotification(
      `${newQs.length} Questions Imported`,
      `Successfully imported ${newQs.length} questions from document template.`,
      newQs.length,
      "new-questions"
    );

    setShowUploadModal(false);
    setUploadState("idle");
    setExtractionState("idle");
    setExtractedQuestions([]);
    
    alert(`Successfully imported ${newQs.length} questions as drafts!`);
  };

  const handleUpdateExtractedQuestion = (idx: number, field: string, value: any) => {
    setExtractedQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Question"
        highlightedText="Management"
        subtitle={`${questions.length} questions in bank`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/templates/question_template.docx"
              download
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${themeBtnGhost} border ${themeBorder}`}
            >
              <svg className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-3-3m3 3l3-3" />
              </svg>
              Download Template
            </a>
            <button
              onClick={() => {
                setShowUploadModal(true);
                setUploadState("idle");
                setExtractionState("idle");
                setExtractedQuestions([]);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${themeBtnGhost} border ${themeBorder}`}
            >
              <svg className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              Upload Document
            </button>
            <button
              onClick={() => {
                resetAddForm();
                setShowAddModal(true);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${themeBtnPrimary}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
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
      <motion.div variants={itemVariants} className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-md shadow-teal-900/5 overflow-hidden relative ${themeBorder} border`}>
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${themeBorder}`}>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-3 ${themeLabel}`}>ID</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 ${themeLabel}`}>Question</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 ${themeLabel}`}>Topic</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 ${themeLabel}`}>Difficulty</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 ${themeLabel}`}>Status</th>
                <th className={`text-right text-xs font-semibold uppercase tracking-wider px-6 py-3 ${themeLabel}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-50 dark:divide-teal-900/20">
              {filtered.slice(0, visibleCount).map((q) => (
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewQuestionText(q.text);
                          setNewQuestionOptions([...q.options]);
                          setNewRationale(q.rationale);
                          setNewQuestionTags([...q.tags]);
                          setNewImage(q.image || "");
                          setNewCorrectAnswer(String.fromCharCode(65 + q.correctIndex));
                          setNewQuestionTopics(q.topic.split(",").map(t => t.trim()));
                          setNewDifficulty(q.difficulty);
                          setEditingQuestion(q);
                          setShowAddModal(true);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`}
                        title="Edit Question"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
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

      {/* Pagination "See More" Button */}
      {filtered.length > visibleCount && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setVisibleCount((prev) => prev + 9)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${themeBtnGhost} border ${themeBorder}`}
          >
            <span>See More Questions</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

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
                      Practice Case
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
                      onClick={() => {
                        const q = previewQuestion;
                        setPreviewQuestion(null);
                        setNewQuestionText(q.text);
                        setNewQuestionOptions([...q.options]);
                        setNewRationale(q.rationale);
                        setNewQuestionTags([...q.tags]);
                        setNewImage(q.image || "");
                        setNewCorrectAnswer(String.fromCharCode(65 + q.correctIndex));
                        setNewQuestionTopics(q.topic.split(",").map(t => t.trim()));
                        setNewDifficulty(q.difficulty);
                        setEditingQuestion(q);
                        setShowAddModal(true);
                      }}
                      className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`}
                      title="Edit Question"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
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
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] cursor-pointer" onClick={() => {
                setShowAddModal(false);
                setEditingQuestion(null);
                resetAddForm();
              }} />
             <motion.div initial={{ opacity: 0, scale: 0.96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 15 }} transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }} className={`fixed inset-x-4 top-[5%] mx-auto max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border rounded-2xl z-[70] shadow-2xl overflow-y-auto max-h-[90vh] ${themeBorder}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`font-serif text-xl font-normal tracking-tight leading-none ${themeText}`}>{editingQuestion ? "Edit Question" : "Add New Question"}</h2>
                  <button onClick={() => {
                     setShowAddModal(false);
                     setEditingQuestion(null);
                     resetAddForm();
                   }} className={`p-2 rounded-xl transition-all ${themeIconBtn}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Question Text</label>
                    <textarea rows={6} value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} className={`w-full px-4 py-3 text-sm rounded-xl transition-all resize-y dark:text-slate-100 ${themeInput} min-h-[150px]`} placeholder="Enter the question..." />
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
                    <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Rationale</label>
                    <textarea rows={6} value={newRationale} onChange={(e) => setNewRationale(e.target.value)} className={`w-full px-4 py-3 text-sm rounded-xl transition-all resize-y dark:text-slate-100 ${themeInput} min-h-[150px]`} placeholder="Explain the correct answer..." />
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
                        questions.forEach((q) => {
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
                    <button onClick={() => {
                      setShowAddModal(false);
                      setEditingQuestion(null);
                      resetAddForm();
                    }} className={themeBtnGhost}>Cancel</button>
                    <button
                      onClick={handleCreateQuestion}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${themeBtnPrimary}`}
                    >
                      {editingQuestion ? "Save Changes" : "Save as Draft"}
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
                    <div className="bg-teal-50/40 dark:bg-teal-950/10 border border-teal-100/50 dark:border-teal-900/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-teal-800 dark:text-teal-400">
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold uppercase tracking-wider">Instructions & Guidelines</span>
                      </div>
                      <p className="text-xs text-teal-950/70 dark:text-teal-300/80 leading-relaxed">
                        To successfully import practice questions, please use our beautifully styled document template. 
                        Simply fill in your question text, options (A to D), correct answer letter, rationales, difficulty level, 
                        and topics, then save and upload the file below. Any embedded images will also be imported!
                      </p>
                      <a
                        href="/templates/question_template.docx"
                        download
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/50 rounded-xl hover:bg-teal-100/70 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/60 transition-all cursor-pointer shadow-sm`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-3-3m3 3l3-3" />
                        </svg>
                        Download Word Template
                      </a>
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
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & Drop Question DOCX or PDF files here</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">or click to choose one or more files from your system (Max 10MB each)</p>
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
                              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">{bf.name}</span>
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
                            className="text-[10px] font-bold text-slate-500 hover:text-red-500 transition-colors"
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
                                className={`p-5 rounded-2xl border ${themeBorder} ${themeSurface} space-y-4 shadow-sm relative`}
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

                                {/* Text */}
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
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subtopic</label>
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
                  onClick={() => setShowUploadModal(false)}
                  className={themeBtnGhost}
                >
                  Cancel
                </button>
                {uploadState === "success" && extractionState === "success" && extractedQuestions.length > 0 && (
                  <button
                    onClick={handleSaveImportedQuestions}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${themeBtnPrimary}`}
                  >
                    Import & Save as Draft
                  </button>
                )}
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

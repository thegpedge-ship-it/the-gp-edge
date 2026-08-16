"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import { AlertCircle } from "lucide-react";
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
import { Question, fetchQuestions, getTopics, getCustomTags } from "@/lib/quizData";
import { MASTER_UNITS, MASTER_TOPICS } from "@/lib/taxonomyData";
import { uploadBase64ImageToR2 } from "@/lib/r2Client";
import { importQuestionsAction, deleteQuestionAction, restoreQuestionAction, permanentlyDeleteQuestionAction } from "@/actions/question.actions";

import { useAdminRole } from "@/hooks/useAdminRole";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

type StatusFilter = "all" | "published" | "review" | "draft" | "archived";

function compressBase64Image(base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith("data:image/")) {
      resolve(base64Str);
      return;
    }
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

export default function QuestionsPage() {
  const { isReadOnly, isSuperAdmin, canRestoreItem, canArchiveItem, currentAdmin } = useAdminRole();
  const [questions, setQuestions] = useState<Question[]>([]);

  const handleRestoreQuestion = async (q: Question) => {
    if (!canRestoreItem) {
      showAlert("Restoration of archived items is strictly SA-only (Super Admin).", "Permission Denied", "error");
      return;
    }
    const targetId = q.dbId || String(q.id);
    const res = await restoreQuestionAction(targetId, currentAdmin);
    if (res.success) {
      showAlert("Question successfully restored from archive.", "Restored", "success");
      const data = await fetchQuestions(canRestoreItem);
      setQuestions(data);
    } else {
      showAlert(res.error || "Failed to restore question.", "Error", "error");
    }
  };

  // Load questions from Neon (no localStorage — Neon is source of truth)
  useEffect(() => {
    let isMounted = true;
    // Clear old oversized localStorage key that caused quota errors
    try { localStorage.removeItem("gpedge_admin_questions"); } catch {}
    fetchQuestions(canRestoreItem).then((list) => {
      if (isMounted) {
        setQuestions(list);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [canRestoreItem]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("A");
  const [newCorrectIndices, setNewCorrectIndices] = useState<number[]>([0]); // KFT multi-select
  const [newExamType, setNewExamType] = useState<"AKT" | "KFT">("AKT");
  const [newKfpCorrectCount, setNewKfpCorrectCount] = useState(3); // how many marks / allowed selections
  const [newQuestionTopics, setNewQuestionTopics] = useState<string[]>(["Cardiology"]);
  const [newDifficulty, setNewDifficulty] = useState("Medium");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [examTypeFilter, setExamTypeFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [visibleCount, setVisibleCount] = useState(9);

  const [newQuestionText, setNewQuestionText] = useState("");
  const [newStem, setNewStem] = useState("");                    // Zone 1
  const [newLeadIn, setNewLeadIn] = useState("");                // Zone 1
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [newWhyCorrect, setNewWhyCorrect] = useState("");         // Zone 2
  const [newDistractorRationales, setNewDistractorRationales] = useState<string[]>([]); // Zone 3
  const [newKnowledgeBank, setNewKnowledgeBank] = useState("");   // Zone 3
  const [newPearl, setNewPearl] = useState("");                   // Zone 3
  const [newRationale, setNewRationale] = useState("");
  const [activeZone, setActiveZone] = useState<1 | 2 | 3>(1);    // active tab
  const [newQuestionTags, setNewQuestionTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [newImage, setNewImage] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<{ count: number; onConfirm: (overwrite: boolean) => void } | null>(null);
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState<Question | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (message: string, title = "Notification", type: "success" | "error" | "warning" | "info" = "info") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  // Document Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadExamType, setUploadExamType] = useState<"AKT" | "KFT">("AKT");
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
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);



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
  }, [searchQuery, statusFilter, examTypeFilter, topicFilter, difficultyFilter]);

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

  // Click outside to close download template dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setShowDownloadDropdown(false);
      }
    };
    if (showDownloadDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDownloadDropdown]);

  const resetAddForm = () => {
    setNewQuestionText("");
    setNewStem("");
    setNewLeadIn("");
    setNewQuestionOptions(["", "", "", ""]);
    setNewWhyCorrect("");
    setNewDistractorRationales([]);
    setNewKnowledgeBank("");
    setNewPearl("");
    setNewRationale("");
    setActiveZone(1);
    setNewQuestionTags([]);
    setTagSearch("");
    setShowTagSuggestions(false);
    setNewImage("");
    setNewCorrectAnswer("A");
    setNewCorrectIndices([0]);
    setNewExamType("AKT");
    setNewKfpCorrectCount(3);
    setNewQuestionTopics(["Cardiology"]);
    setNewDifficulty("Medium");
  };

  const topics = (() => {
    const unitNames = MASTER_UNITS.map((u) => `${u.code}: ${u.name}`);
    const masterTopicLabels = MASTER_TOPICS.map((t) => `${t.code}: ${t.label}`);
    const stored = typeof window !== "undefined" ? getTopics().map(t => t.name) : [];
    const derived = questions.flatMap((q) => q.topic.split(",").map((t) => t.trim()));
    return Array.from(new Set([...unitNames, ...masterTopicLabels, ...stored, ...derived])).filter(Boolean);
  })();

  const filtered = questions.filter((q) => {
    const searchLower = searchQuery.trim().toLowerCase();
    const matchStatus = statusFilter === "all" ? q.status !== "archived" : q.status === statusFilter;
    const qType = (q.examType === "KFP" ? "KFT" : (q.examType || "AKT")).toUpperCase();
    const matchExamType = examTypeFilter === "all" || qType === examTypeFilter;
    const matchTopic = topicFilter === "all" || q.topic.split(",").map((t) => t.trim()).includes(topicFilter);
    const matchDifficulty = difficultyFilter === "all" || q.difficulty === difficultyFilter;

    if (!searchLower) {
      return matchStatus && matchExamType && matchTopic && matchDifficulty;
    }

    const matchSearch =
      (q.text && q.text.toLowerCase().includes(searchLower)) ||
      q.id.toString().includes(searchLower) ||
      (q.dbId && q.dbId.toLowerCase().includes(searchLower)) ||
      (q.uqid && q.uqid.toLowerCase().includes(searchLower)) ||
      (q.stem && q.stem.toLowerCase().includes(searchLower)) ||
      (q.leadIn && q.leadIn.toLowerCase().includes(searchLower)) ||
      (q.topic && q.topic.toLowerCase().includes(searchLower)) ||
      (Array.isArray(q.tags) && q.tags.some((t) => t.toLowerCase().includes(searchLower))) ||
      (Array.isArray(q.options) && q.options.some((opt) => opt.toLowerCase().includes(searchLower))) ||
      (q.whyCorrect && q.whyCorrect.toLowerCase().includes(searchLower)) ||
      (q.rationale && q.rationale.toLowerCase().includes(searchLower)) ||
      (Array.isArray(q.distractorRationales) && q.distractorRationales.some((dr) => dr.toLowerCase().includes(searchLower))) ||
      (q.pearl && q.pearl.toLowerCase().includes(searchLower)) ||
      (q.knowledgeBank && q.knowledgeBank.toLowerCase().includes(searchLower)) ||
      (q.examType && q.examType.toLowerCase().includes(searchLower)) ||
      (q.difficulty && q.difficulty.toLowerCase().includes(searchLower));

    return matchSearch && matchStatus && matchExamType && matchTopic && matchDifficulty;
  });

  const updateStatus = async (id: number, newStatus: Question["status"]) => {
    if (isReadOnly) return;
    const targetQ = questions.find((q) => q.id === id);
    const updated = questions.map((q) => (q.id === id ? { ...q, status: newStatus } : q));
    setQuestions(updated);
    if (targetQ) {
      await importQuestionsAction([{ ...targetQ, status: newStatus }]);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (isReadOnly || !canArchiveItem) return;
    const targetQ = questions.find((q) => q.id === id);
    if (!targetQ) return;
    const updated = questions.map((q) => (q.id === id ? { ...q, status: "archived" as const } : q));
    setQuestions(updated);
    await deleteQuestionAction(targetQ.dbId || targetQ.text, currentAdmin);
    showAlert(`Question #${id} has been moved to Archive.`, "Question Archived", "info");
  };

  const handlePermanentlyDeleteQuestion = (q: Question) => {
    if (!canRestoreItem) {
      showAlert("Permanent deletion of questions is strictly SA-only (Super Admin).", "Permission Denied", "error");
      return;
    }
    setDeleteConfirmQuestion(q);
  };

  const executePermanentDelete = async (q: Question) => {
    setDeleteConfirmQuestion(null);
    const targetId = q.dbId || String(q.id);
    const res = await permanentlyDeleteQuestionAction(targetId, currentAdmin);
    if (res.success) {
      setQuestions((prev) => prev.filter((item) => item.id !== q.id));
      showAlert(`Question #${q.id} has been permanently deleted.`, "Permanently Deleted", "success");
    } else {
      showAlert(res.error || "Failed to permanently delete question.", "Error", "error");
    }
  };

  const handleCreateQuestion = async () => {
    if (isReadOnly) return;
    // Validate: need at minimum a stem OR leadIn
    const stemText = newStem.trim() || newQuestionText.trim();
    if (!stemText) {
      showAlert("Please enter the question stem.", "Validation Error", "error");
      setActiveZone(1);
      return;
    }
    // KFT validation
    if (newExamType === "KFT") {
      if (newCorrectIndices.length === 0) {
        showAlert("Please mark at least one correct answer for KFT.", "Validation Error", "error");
        setActiveZone(2);
        return;
      }
      if (newCorrectIndices.length !== newKfpCorrectCount) {
        showAlert(`Please mark exactly ${newKfpCorrectCount} correct answer(s) for KFT (currently ${newCorrectIndices.length} selected).`, "Validation Error", "error");
        setActiveZone(2);
        return;
      }
    }
    // Duplicate check
    if (!editingQuestion) {
      const cleanedText = stemText.toLowerCase();
      const existingQuestion = questions.find((q) => q.text.trim().toLowerCase() === cleanedText || (q.stem?.trim().toLowerCase() === cleanedText));
      if (existingQuestion) {
        setShowAddModal(false);
        resetAddForm();
        setSearchQuery(existingQuestion.id.toString());
        showAlert(`This question already exists in the Question Bank (ID: #${existingQuestion.id}). We have filtered the view to show it.`, "Question Already Exists", "info");
        return;
      }
    }
    const correctIndex = newExamType === "AKT"
      ? Math.min(newCorrectAnswer.charCodeAt(0) - 65, newQuestionOptions.length - 1)
      : (newCorrectIndices[0] ?? 0);
    // Combine stem + leadIn into text for backward compat
    const combinedText = newLeadIn.trim()
      ? `${stemText}\n\n${newLeadIn.trim()}`
      : stemText;

    const baseQuestion = {
      text: combinedText,
      stem: stemText,
      leadIn: newLeadIn.trim() || undefined,
      options: newQuestionOptions.map((opt, idx) => opt.trim() || `Option ${String.fromCharCode(65 + idx)}`),
      correctIndex,
      correctIndices: newExamType === "KFT" ? newCorrectIndices : undefined,
      kftCorrectCount: newExamType === "KFT" ? newKfpCorrectCount : undefined,
      kfpCorrectCount: newExamType === "KFT" ? newKfpCorrectCount : undefined,
      rationale: newWhyCorrect || newRationale || "No explanation provided.",
      whyCorrect: newWhyCorrect || undefined,
      distractorRationales: newDistractorRationales.some(d => d.trim()) ? newDistractorRationales : undefined,
      knowledgeBank: newKnowledgeBank.trim() || undefined,
      pearl: newPearl.trim() || undefined,
      topic: newQuestionTopics.join(", "),
      difficulty: newDifficulty as "Easy" | "Medium" | "Hard",
      examType: newExamType,
      status: "published" as const,
      tags: newQuestionTags.length > 0 ? newQuestionTags : ["General"],
      image: newImage || undefined,
    };

    if (editingQuestion) {
      let updatedQ: any = null;
      const updated = questions.map((q) => {
        if (q.id === editingQuestion.id) {
          updatedQ = { ...q, ...baseQuestion };
          return updatedQ;
        }
        return q;
      });
      setQuestions(updated);
      if (updatedQ) {
        importQuestionsAction([updatedQ]).then((res) => {
          if (res?.success && res.results && res.results[0]) {
            const { dbId, uqid } = res.results[0] as any;
            setQuestions((prev) =>
              prev.map((q) => (q.id === updatedQ.id ? { ...q, dbId, ...(uqid ? { uqid } : {}) } : q))
            );
          }
        });
      }
      setShowAddModal(false);
      setEditingQuestion(null);
      resetAddForm();
      return;
    }

    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 2855;
    const newQuestion: Question = { id: nextId, ...baseQuestion } as Question;
    const updated = [newQuestion, ...questions];
    setQuestions(updated);
    importQuestionsAction([newQuestion]).then((res) => {
      if (res?.success && res.results && res.results[0]) {
        const { dbId, uqid } = res.results[0] as any;
        setQuestions((prev) =>
          prev.map((q) => (q.id === newQuestion.id ? { ...q, dbId, uqid } : q))
        );
      }
    });
    setShowAddModal(false);
    resetAddForm();

    setSearchQuery("");
    setStatusFilter("all");
    setTopicFilter("all");
    setDifficultyFilter("all");

    addUserNotification(
      "New Question Added",
      `Admin added a new ${newExamType} question to the ${newQuestionTopics.join(", ")} category.`,
      1,
      "new-questions"
    );
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let fileList = Array.from(files);
    if (fileList.length > 10) {
      showAlert("Batch upload is supported for up to 10 files at a time. Processing the first 10 files.", "Batch File Limit", "info");
      fileList = fileList.slice(0, 10);
    }
    setExtractionState("idle");

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

    const updateBatchFile = (idx: number, updates: Partial<typeof initialBatch[0]>) => {
      setBatchFiles(prev => {
        const next = prev.map((bf, i) => i === idx ? { ...bf, ...updates } : bf);
        const totalProgress = next.reduce((sum, f) => sum + f.progress, 0);
        const avgProgress = Math.round(totalProgress / next.length);
        setUploadProgress(avgProgress);
        return next;
      });
    };

    await Promise.allSettled(
      fileList.map(async (file, idx) => {
        updateBatchFile(idx, { status: "uploading", progress: 10 });

        // Simulate incremental progress smoothly
        let currentProgress = 10;
        const progressTimer = setInterval(() => {
          currentProgress += Math.random() * 8 + 2;
          if (currentProgress > 90) currentProgress = 90;
          updateBatchFile(idx, { progress: Math.round(currentProgress) });
        }, 250);

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "question");

          // Keep current progress but update status to extracting
          updateBatchFile(idx, { status: "extracting" });

          const res = await fetch("/api/extract", {
            method: "POST",
            body: formData,
          });

          clearInterval(progressTimer);

          const result = await res.json();
          if (result.success && result.type === "question") {
            const qs = result.questions || [];
            const compressedQs = await Promise.all(
              qs.map(async (q: any) => {
                const finalQ = { ...q, examType: uploadExamType };
                if (finalQ.image) {
                  const comp = await compressBase64Image(finalQ.image);
                  return { ...finalQ, image: comp };
                }
                return finalQ;
              })
            );
            allExtracted.push(...compressedQs);
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
      })
    );

    // All files processed — merge results
    setUploadProgress(100);
    setExtractedQuestions((prev) => [...prev, ...allExtracted]);
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

  const handleSaveImportedQuestions = async () => {
    if (!extractedQuestions || extractedQuestions.length === 0) return;
    
    // Deduplicate the extracted list itself by question text (case-insensitive)
    const uniqueQuestionsToImport: any[] = [];
    extractedQuestions.forEach((eq) => {
      if (!uniqueQuestionsToImport.some((u) => u.text.trim().toLowerCase() === eq.text.trim().toLowerCase())) {
        uniqueQuestionsToImport.push(eq);
      }
    });

    const duplicates = uniqueQuestionsToImport.filter((eq) =>
      questions.some((aq) => aq.text.trim().toLowerCase() === eq.text.trim().toLowerCase())
    );

    const proceedWithImport = async (overwrite: boolean) => {
      let finalImportList = uniqueQuestionsToImport;
      if (!overwrite) {
        finalImportList = uniqueQuestionsToImport.filter(
          (u) => !questions.some((aq) => aq.text.trim().toLowerCase() === u.text.trim().toLowerCase())
        );
      }
      
      let nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 2855;
      const newQs = finalImportList.map((q: any) => {
        const cleanedTags = q.tags
          ? q.tags.map((t: string) => t.trim()).filter(Boolean)
          : ["General"];
        const resolvedExamType = q.examType || (q.correctIndices && q.correctIndices.length > 1 ? "KFT" : "AKT");
        const correctCount = q.kftCorrectCount || q.kfpCorrectCount || (q.correctIndices && q.correctIndices.length > 1 ? q.correctIndices.length : 1);
        const newQ = {
          ...q,
          id: nextId++,
          topic: q.topic ? q.topic.trim() : "General",
          difficulty: q.difficulty || "Medium",
          examType: resolvedExamType,
          kftCorrectCount: correctCount,
          kfpCorrectCount: correctCount,
          correctIndices: q.correctIndices || [q.correctIndex || 0],
          tags: cleanedTags.length > 0 ? cleanedTags : ["General"],
          status: "published" as const
        };
        return newQ;
      });

      const hasImages = newQs.some((q: any) => q.image && q.image.startsWith("data:image/"));

      setUploadProgress(0);
      setUploadedFileName("Publishing to database...");
      setUploadState("uploading");

      let completedCount = 0;
      const totalCount = newQs.length;

      const uploadedNewQs = await Promise.all(
        newQs.map(async (q) => {
          let updatedQ = q;
          if (q.image && q.image.startsWith("data:image/")) {
            try {
              const fileUrl = await uploadBase64ImageToR2(q.image, "extracted_question_image.jpg");
              updatedQ = { ...q, image: fileUrl };
            } catch (err) {
              console.error("Client image upload failed:", err);
            }
          }
          completedCount++;
          if (hasImages) {
            const progressVal = Math.round((completedCount / totalCount) * 50);
            setUploadProgress(progressVal);
          }
          return updatedQ;
        })
      );

      const filteredExisting = questions.filter(
        (aq) => !uploadedNewQs.some((nq) => nq.text.trim().toLowerCase() === aq.text.trim().toLowerCase())
      );
      const updated = [...uploadedNewQs, ...filteredExisting];
      setQuestions(updated);

      const startProgress = hasImages ? 50 : 0;
      setUploadProgress(startProgress);
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressTimer);
            return 95;
          }
          return prev + 1;
        });
      }, 150);

      let res;
      try {
        res = await importQuestionsAction(uploadedNewQs);
      } finally {
        clearInterval(progressTimer);
        setUploadProgress(100);
      }

      if (res?.success && res.results) {
        const resultsMap = new Map(res.results.map((r) => [r.text.trim().toLowerCase(), r.dbId]));
        setQuestions((prev) =>
          prev.map((q) => {
            const dbId = resultsMap.get(q.text.trim().toLowerCase());
            return dbId ? { ...q, dbId } : q;
          })
        );
      }
      
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
      setDuplicatePrompt(null);
      
      showAlert(`Successfully imported ${newQs.length} questions as published!`, "Import Successful", "success");
    };

    if (duplicates.length > 0) {
      setDuplicatePrompt({
        count: duplicates.length,
        onConfirm: (overwrite) => {
          proceedWithImport(overwrite);
        }
      });
    } else {
      proceedWithImport(true);
    }
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
            {/* Unified Download Template Dropdown */}
            <div className="relative" ref={downloadDropdownRef}>
              <button
                type="button"
                onClick={() => setShowDownloadDropdown((prev) => !prev)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${themeBtnGhost} border ${themeBorder}`}
              >
                <svg className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-3-3m3 3l3-3" />
                </svg>
                Download Template
                <svg className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showDownloadDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {showDownloadDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 backdrop-blur-xl"
                  >
                    <a
                      href="/templates/question_template.docx?v=2"
                      download
                      onClick={() => setShowDownloadDropdown(false)}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-800 dark:text-slate-200 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0 mt-0.5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">AKT Template</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-teal-100/80 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">100 Qs</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Single-Answer MCQ format</p>
                      </div>
                    </a>

                    <a
                      href="/templates/kft_template.docx?v=1"
                      download
                      onClick={() => setShowDownloadDropdown(false)}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">KFT Template</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">100 Qs</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Key Feature Multi-Select format</p>
                      </div>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => {
                if (isReadOnly) return;
                setShowUploadModal(true);
                setUploadState("idle");
                setExtractionState("idle");
                setExtractedQuestions([]);
              }}
              disabled={isReadOnly}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${themeBtnGhost} border ${themeBorder} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              Upload Document
            </button>
            <button
              onClick={() => {
                if (isReadOnly) return;
                resetAddForm();
                setShowAddModal(true);
              }}
              disabled={isReadOnly}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${themeBtnPrimary} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Question
            </button>
          </div>
        }
        variants={itemVariants}
      />

      {isReadOnly && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 rounded-2xl flex gap-3 text-xs text-blue-850 dark:text-blue-300 leading-relaxed items-center shadow-sm"
        >
          <svg className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-450" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">View-Only Mode Enabled</p>
            <p className="mt-0.5 opacity-90">
              You are signed in under the <strong>Viewer</strong> role. You have full read-only access to all sections and data, but editing, adding, or deleting content is restricted.
            </p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center relative z-20">
        <div className="relative flex-1 max-w-sm">
          <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search by ID, UQID, topic, subtopic/tag, question..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl transition-all ${themeInput}`} />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as any)}
          options={[
            { value: "all", label: "Active Statuses" },
            { value: "published", label: "Published" },
            { value: "review", label: "In Review" },
            { value: "draft", label: "Draft" },
            ...(canRestoreItem ? [{ value: "archived", label: "Archived (SA Only)" }] : []),
          ]}
          className="w-48"
        />
        <CustomSelect
          value={examTypeFilter}
          onChange={setExamTypeFilter}
          options={[
            { value: "all", label: "All Formats (AKT & KFT)" },
            { value: "AKT", label: "AKT Questions" },
            { value: "KFT", label: "KFT Questions" },
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
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200/50 dark:border-teal-900/40">
                        {q.uqid || `${q.examType === "KFP" ? "KFT" : (q.examType || "AKT")}-${String(q.id).padStart(6, "0")}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${q.examType === "KFT" || q.examType === "KFP" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" : "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"}`}>
                          {q.examType === "KFP" ? "KFT" : (q.examType || "AKT")}
                        </span>
                        {q.version && q.version > 1 && (
                          <span className="text-[9px] font-semibold text-slate-400">
                            v{q.version}
                          </span>
                        )}
                      </div>
                    </div>
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
                          setNewStem(q.stem || q.text || "");
                          setNewLeadIn(q.leadIn || "");
                          setNewQuestionText(q.text);
                          setNewQuestionOptions([...q.options]);
                          setNewWhyCorrect(q.whyCorrect || q.rationale || "");
                          setNewDistractorRationales(q.distractorRationales ? [...q.distractorRationales] : q.options.map(() => ""));
                          setNewKnowledgeBank(q.knowledgeBank || "");
                          setNewPearl(q.pearl || "");
                          setNewRationale(q.rationale || "");
                          setNewQuestionTags([...q.tags]);
                          setNewImage(q.image || "");
                          setNewExamType(q.examType === "KFP" ? "KFT" : (q.examType as any) || "AKT");
                          setNewKfpCorrectCount(q.kftCorrectCount || q.kfpCorrectCount || q.correctIndices?.length || 3);
                          setNewCorrectIndices(q.correctIndices && q.correctIndices.length > 0 ? [...q.correctIndices] : [q.correctIndex ?? 0]);
                          setNewCorrectAnswer(String.fromCharCode(65 + (q.correctIndex ?? 0)));
                          setNewQuestionTopics(q.topic.split(",").map(t => t.trim()));
                          setNewDifficulty(q.difficulty);
                          setActiveZone(1);
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

                      {q.status === "archived" ? (
                        <div className="flex items-center gap-1">
                          {canRestoreItem && (
                            <button
                              onClick={() => handleRestoreQuestion(q)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer border-none bg-transparent"
                              title="Restore Question (SA Only)"
                            >
                              <Lucide.RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          {canRestoreItem && (
                            <button
                              onClick={() => handlePermanentlyDeleteQuestion(q)}
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer border-none bg-transparent"
                              title="Delete Permanently (SA Only)"
                            >
                              <Lucide.Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        canArchiveItem && (
                          <button onClick={() => deleteQuestion(q.id)} className={`p-1.5 rounded-lg transition-all ${themeIconBtn}`} title="Archive Question">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )
                      )}
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
                    <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-lg border border-teal-200/60 dark:border-teal-900/40">
                      {previewQuestion.uqid || `${previewQuestion.examType === "KFP" ? "KFT" : (previewQuestion.examType || "AKT")}-${String(previewQuestion.id).padStart(6, "0")}`}
                    </span>
                    {previewQuestion.version && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        v{previewQuestion.version}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        const q = previewQuestion;
                        setPreviewQuestion(null);
                        setNewStem(q.stem || q.text || "");
                        setNewLeadIn(q.leadIn || "");
                        setNewQuestionText(q.text);
                        setNewQuestionOptions([...q.options]);
                        setNewWhyCorrect(q.whyCorrect || q.rationale || "");
                        setNewDistractorRationales(q.distractorRationales ? [...q.distractorRationales] : q.options.map(() => ""));
                        setNewKnowledgeBank(q.knowledgeBank || "");
                        setNewPearl(q.pearl || "");
                        setNewRationale(q.rationale || "");
                        setNewQuestionTags([...q.tags]);
                        setNewImage(q.image || "");
                        setNewExamType(q.examType === "KFP" ? "KFT" : (q.examType as any) || "AKT");
                        setNewKfpCorrectCount(q.kftCorrectCount || q.kfpCorrectCount || q.correctIndices?.length || 3);
                        setNewCorrectIndices(q.correctIndices && q.correctIndices.length > 0 ? [...q.correctIndices] : [q.correctIndex ?? 0]);
                        setNewCorrectAnswer(String.fromCharCode(65 + (q.correctIndex ?? 0)));
                        setNewQuestionTopics(q.topic.split(",").map(t => t.trim()));
                        setNewDifficulty(q.difficulty);
                        setActiveZone(1);
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

                {/* Question Stem / Narrative */}
                <div className="mb-5 space-y-3">
                  <div className="text-base font-medium leading-relaxed font-sans text-slate-800 dark:text-slate-100 whitespace-pre-line">
                    {previewQuestion.stem || previewQuestion.text}
                  </div>
                  {previewQuestion.leadIn && (
                    <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border-l-4 border-teal-600 rounded-r-xl text-sm font-semibold text-teal-950 dark:text-teal-200">
                      {previewQuestion.leadIn}
                    </div>
                  )}
                </div>

                {/* Question Image */}
                {previewQuestion.image && (
                  <div 
                    onClick={() => setZoomImage(previewQuestion.image!)}
                    className={`relative h-64 w-full rounded-2xl overflow-hidden border p-2.5 mb-6 group cursor-zoom-in transition-all ${themeSurface} ${themeBorder} hover:border-teal-300 dark:hover:border-teal-700`}
                  >
                    <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity font-semibold flex items-center gap-1 shadow-lg">
                      <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Click to zoom
                    </div>
                    <Image 
                      src={previewQuestion.image} 
                      alt="Clinical diagnostic image" 
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-[1.01]" 
                    />
                  </div>
                )}

                {/* Options list */}
                {(previewQuestion.examType === "KFT" || previewQuestion.examType === "KFP") && (previewQuestion.kftCorrectCount || previewQuestion.kfpCorrectCount) && (
                  <div className="mb-4 flex items-center gap-2 p-2.5 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200/50 dark:border-teal-900/40">
                    <svg className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                      KFT — Select <strong>{previewQuestion.kftCorrectCount || previewQuestion.kfpCorrectCount}</strong> correct answer{(previewQuestion.kftCorrectCount || previewQuestion.kfpCorrectCount || 1) > 1 ? "s" : ""} · {previewQuestion.kftCorrectCount || previewQuestion.kfpCorrectCount} mark{(previewQuestion.kftCorrectCount || previewQuestion.kfpCorrectCount || 1) > 1 ? "s" : ""} available
                    </span>
                  </div>
                )}
                <div className="space-y-3 mb-6">
                  {previewQuestion.options.map((opt, i) => {
                    const isKftMode = previewQuestion.examType === "KFT" || previewQuestion.examType === "KFP";
                    const correctSet = isKftMode && previewQuestion.correctIndices?.length
                      ? new Set(previewQuestion.correctIndices)
                      : new Set([previewQuestion.correctIndex]);
                    const isCorrect = correctSet.has(i);
                    const distractor = previewQuestion.distractorRationales?.[i];

                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border transition-all duration-300 ${
                          isCorrect
                            ? `border-teal-700 ${themeSurface} ${themeText} shadow-sm`
                            : `border-teal-100 dark:border-teal-900/30 ${themeSurface} text-teal-700/80 dark:text-teal-400/80`
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-7 h-7 ${isKftMode ? "rounded" : "rounded-full"} border flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                              isCorrect
                                ? "bg-teal-800 border-teal-700 text-white shadow-sm shadow-teal-900/25"
                                : `${themeSurface} border-teal-200/70 dark:border-teal-900/40 text-teal-800 dark:text-teal-400`
                            }`}
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="text-sm font-semibold flex-1">{opt}</span>
                          {isCorrect && (
                            <div className="flex items-center gap-1.5 ml-auto shrink-0">
                              {isKftMode && (
                                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-1.5 py-0.5 rounded">+1</span>
                              )}
                              <svg className="w-5 h-5 text-teal-800 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {distractor && !isCorrect && (
                          <div className="mt-2.5 pl-11 text-xs text-slate-500 dark:text-slate-400 italic">
                            &rarr; {distractor}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Core Rationale (Why Correct) */}
                {(previewQuestion.whyCorrect || previewQuestion.rationale) && (
                  <div className="mb-4 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl p-4 text-xs leading-relaxed text-teal-950 dark:text-teal-300">
                    <div className="font-bold mb-1.5 flex items-center gap-1.5 text-teal-800 dark:text-teal-400 text-[13px]">
                      <svg className="w-4 h-4 text-teal-800 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Why Correct (Core Rationale)
                    </div>
                    <p className="font-normal leading-relaxed text-teal-900/80 dark:text-teal-300/80 whitespace-pre-line">
                      {previewQuestion.whyCorrect || previewQuestion.rationale}
                    </p>
                  </div>
                )}

                {/* Knowledge Bank */}
                {previewQuestion.knowledgeBank && (
                  <div className="mb-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 text-xs leading-relaxed text-blue-950 dark:text-blue-200">
                    <div className="font-bold mb-1.5 flex items-center gap-1.5 text-blue-800 dark:text-blue-400 text-[13px]">
                      <svg className="w-4 h-4 text-blue-700 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Knowledge Bank & Guidelines
                    </div>
                    <p className="font-normal leading-relaxed text-blue-900/80 dark:text-blue-300/80 whitespace-pre-line">
                      {previewQuestion.knowledgeBank}
                    </p>
                  </div>
                )}

                {/* Clinical Pearl */}
                {previewQuestion.pearl && (
                  <div className="bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300/70 dark:border-amber-900/60 rounded-2xl p-4 text-xs leading-relaxed text-amber-950 dark:text-amber-200 shadow-sm">
                    <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-800 dark:text-amber-400 text-[13px]">
                      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Clinical Pearl
                    </div>
                    <p className="font-medium leading-relaxed text-amber-900 dark:text-amber-100">
                      {previewQuestion.pearl}
                    </p>
                  </div>
                )}
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
                {/* Modal Header with UQID and Version */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b dark:border-slate-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className={`font-serif text-xl font-normal tracking-tight leading-none ${themeText}`}>
                      {editingQuestion ? "Edit Question" : "Add New Question"}
                    </h2>
                    {editingQuestion?.uqid && (
                      <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-lg border border-teal-200/60 dark:border-teal-900/40">
                        {editingQuestion.uqid}
                      </span>
                    )}
                    {editingQuestion?.version && (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        Version {editingQuestion.version}
                      </span>
                    )}
                  </div>
                  <button onClick={() => {
                     setShowAddModal(false);
                     setEditingQuestion(null);
                     resetAddForm();
                   }} className={`p-2 rounded-xl transition-all self-end sm:self-auto ${themeIconBtn}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* 3-Zone Tab Navigation */}
                <div className="grid grid-cols-3 gap-2 mb-6 p-1.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setActiveZone(1)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeZone === 1
                        ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-100 dark:bg-teal-950 text-[10px] flex items-center justify-center font-black">1</span>
                    <span>Zone 1: Stem</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveZone(2)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeZone === 2
                        ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-100 dark:bg-teal-950 text-[10px] flex items-center justify-center font-black">2</span>
                    <span>Zone 2: Options</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveZone(3)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeZone === 3
                        ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-100 dark:bg-teal-950 text-[10px] flex items-center justify-center font-black">3</span>
                    <span>Zone 3: Explanations</span>
                  </button>
                </div>

                <div className="space-y-5">
                  {/* ZONE 1: STEM & LEAD-IN */}
                  {activeZone === 1 && (
                    <div className="space-y-4">
                      {/* Exam Type Toggle */}
                      <div>
                        <label className={`block text-xs font-semibold mb-2 ${themeLabel}`}>Exam Pattern / Format</label>
                        <div className="flex rounded-xl overflow-hidden border divide-x divide-slate-200 dark:divide-slate-700 border-slate-200 dark:border-slate-700">
                          {(["AKT", "KFT"] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setNewExamType(type);
                                setNewCorrectIndices([0]);
                                setNewCorrectAnswer("A");
                              }}
                              className={`flex-1 py-2.5 text-xs font-bold transition-all ${
                                newExamType === type
                                  ? "bg-teal-800 text-white shadow-sm"
                                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                              }`}
                            >
                              {type === "AKT" ? "AKT — Single Best Answer" : "KFT — Key Feature Test (Multi-Correct)"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* KFT Settings Banner */}
                      {newExamType === "KFT" && (
                        <div className="flex items-center gap-3 p-3.5 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 rounded-xl">
                          <svg className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <div className="flex-1">
                            <span className={`text-xs font-bold ${themeLabel}`}>KFT Correct Option Limit & Marks</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              How many options the registrar must select. Question total marks = this limit (1 mark per correct answer).
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={newKfpCorrectCount}
                              onChange={(e) => {
                                const v = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                                setNewKfpCorrectCount(v);
                                setNewCorrectIndices(prev => prev.slice(0, v));
                              }}
                              className={`w-16 text-center text-sm font-bold px-2 py-1.5 rounded-lg border ${themeInput}`}
                            />
                            <span className="text-xs font-bold text-slate-400">marks</span>
                          </div>
                        </div>
                      )}

                      {/* Stem (Case Vignette) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={`block text-xs font-semibold ${themeLabel}`}>
                            Clinical Case Stem (Vignette)
                          </label>
                          <span className="text-[11px] text-slate-400">Large case narrative</span>
                        </div>
                        <textarea
                          rows={newExamType === "KFT" ? 8 : 6}
                          value={newStem}
                          onChange={(e) => {
                            setNewStem(e.target.value);
                            setNewQuestionText(newLeadIn ? `${e.target.value}\n\n${newLeadIn}` : e.target.value);
                          }}
                          className={`w-full px-4 py-3 text-sm rounded-xl transition-all resize-y dark:text-slate-100 ${themeInput} min-h-[140px]`}
                          placeholder={newExamType === "KFT" ? "Enter the detailed patient scenario, background, history, lab findings..." : "Enter the clinical vignette or patient presentation..."}
                        />
                      </div>

                      {/* Lead-in (The actual question sentence) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={`block text-xs font-semibold ${themeLabel}`}>
                            Lead-In (Question Sentence)
                          </label>
                          <span className="text-[11px] text-slate-400">The specific question asked</span>
                        </div>
                        <input
                          type="text"
                          value={newLeadIn}
                          onChange={(e) => {
                            setNewLeadIn(e.target.value);
                            setNewQuestionText(e.target.value ? `${newStem}\n\n${e.target.value}` : newStem);
                          }}
                          className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all dark:text-slate-100 ${themeInput}`}
                          placeholder="e.g. Which of the following is the most appropriate initial investigation?"
                        />
                      </div>

                      {/* Difficulty & Topics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Difficulty Level</label>
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
                          <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Primary Topic</label>
                          <CustomSelect
                            value={newQuestionTopics[0] || ""}
                            onChange={(val) => {
                              if (val) {
                                setNewQuestionTopics([val, ...newQuestionTopics.filter(t => t !== val)]);
                              }
                            }}
                            options={topics.map((t) => ({ value: t, label: t }))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Clinical Image */}
                      <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Clinical Image / Diagnostic Attachment (Optional)</label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                              newImage ? themeSelected : themeOptionIdle
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
                                reader.onloadend = async () => {
                                  try {
                                    const compressed = await compressBase64Image(reader.result as string);
                                    const fileUrl = await uploadBase64ImageToR2(compressed, file.name);
                                    setNewImage(fileUrl);
                                  } catch (err: any) {
                                    console.error("Upload to R2 failed:", err);
                                    showAlert("Failed to upload image to Cloudflare R2.", "Upload Error", "error");
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                        {newImage && (
                          <div className={`mt-3 relative rounded-xl overflow-hidden border p-3 w-full max-h-80 flex items-center justify-center ${themeSurface} ${themeBorder}`}>
                            <img src={newImage} alt="Preview" className="max-h-72 w-auto object-contain rounded-lg shadow-sm" />
                            <button 
                              type="button" 
                              onClick={() => {
                                setNewImage("");
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }} 
                              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-950 transition-all shadow-md"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Subtopics / Tags */}
                      <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Subtopics & Curriculum Tags</label>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/60 dark:border-slate-800/40 mb-2.5">
                          {newQuestionTags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-400">
                              {tag}
                              <button
                                type="button"
                                onClick={() => setNewQuestionTags(newQuestionTags.filter((t) => t !== tag))}
                                className="text-teal-500 hover:text-red-500 font-bold ml-1"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add tag (e.g. ECG, STEMI, MBS-721)..."
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
                            className={`w-full px-3.5 py-2 text-xs rounded-xl transition-all dark:text-slate-100 ${themeInput}`}
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
                            className={`px-3 py-2 text-xs font-semibold rounded-xl shrink-0 ${themeBtnPrimary}`}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ZONE 2: OPTIONS & ANSWER */}
                  {activeZone === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className={`block text-xs font-semibold ${themeLabel}`}>
                            Options {newExamType === "KFT" ? `— Select ${newKfpCorrectCount} correct options (${newCorrectIndices.length}/${newKfpCorrectCount} marked)` : "& Single Correct Answer"}
                          </label>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {newExamType === "KFT"
                              ? "Tick the checkbox next to each correct option. Each is worth 1 mark."
                              : "Click the radio button to select the single best answer."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewQuestionOptions([...newQuestionOptions, ""]);
                            setNewDistractorRationales([...newDistractorRationales, ""]);
                          }}
                          className="text-xs font-bold text-teal-700 hover:text-teal-600 dark:text-teal-400 flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Option
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {newQuestionOptions.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800">
                            {newExamType === "AKT" ? (
                              <button
                                type="button"
                                onClick={() => setNewCorrectAnswer(String.fromCharCode(65 + idx))}
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
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const isSelected = newCorrectIndices.includes(idx);
                                  if (isSelected) {
                                    setNewCorrectIndices(prev => prev.filter(i => i !== idx));
                                  } else if (newCorrectIndices.length < newKfpCorrectCount) {
                                    setNewCorrectIndices(prev => [...prev, idx].sort((a, b) => a - b));
                                  }
                                }}
                                className="flex items-center justify-center shrink-0 focus:outline-none"
                                title={newCorrectIndices.includes(idx) ? "Unmark correct" : newCorrectIndices.length >= newKfpCorrectCount ? `Limit of ${newKfpCorrectCount} reached` : "Mark correct (+1 mark)"}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  newCorrectIndices.includes(idx)
                                    ? "border-teal-600 dark:border-teal-400 bg-teal-600 dark:bg-teal-400 text-white"
                                    : newCorrectIndices.length >= newKfpCorrectCount
                                    ? "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 opacity-50"
                                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-500"
                                }`}>
                                  {newCorrectIndices.includes(idx) && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            )}
                            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 w-5 text-center">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const nextOpts = [...newQuestionOptions];
                                nextOpts[idx] = e.target.value;
                                setNewQuestionOptions(nextOpts);
                              }}
                              className={`flex-1 text-xs px-3 py-2 rounded-lg border ${themeInput}`}
                              placeholder={`Option ${String.fromCharCode(65 + idx)}...`}
                            />
                            {newQuestionOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextOpts = newQuestionOptions.filter((_, oidx) => oidx !== idx);
                                  setNewQuestionOptions(nextOpts);
                                  setNewDistractorRationales(newDistractorRationales.filter((_, oidx) => oidx !== idx));
                                  if (newExamType === "AKT") {
                                    if (newCorrectAnswer === String.fromCharCode(65 + idx)) {
                                      setNewCorrectAnswer("A");
                                    } else if (newCorrectAnswer.charCodeAt(0) - 65 > idx) {
                                      setNewCorrectAnswer(String.fromCharCode(newCorrectAnswer.charCodeAt(0) - 1));
                                    }
                                  } else {
                                    setNewCorrectIndices(prev =>
                                      prev.filter(i => i !== idx).map(i => (i > idx ? i - 1 : i))
                                    );
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
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

                      {/* whyCorrect Explanation */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={`block text-xs font-semibold ${themeLabel}`}>
                            Why Correct Explanation (Core Rationale)
                          </label>
                          <span className="text-[11px] text-slate-400">Explains the keyed answer(s)</span>
                        </div>
                        <textarea
                          rows={4}
                          value={newWhyCorrect}
                          onChange={(e) => {
                            setNewWhyCorrect(e.target.value);
                            setNewRationale(e.target.value);
                          }}
                          className={`w-full px-4 py-3 text-sm rounded-xl transition-all resize-y dark:text-slate-100 ${themeInput}`}
                          placeholder="Explain clearly why the correct option(s) are indicated according to RACGP / ACRRM guidelines..."
                        />
                      </div>
                    </div>
                  )}

                  {/* ZONE 3: EXPLANATIONS (Distractor Rationales, Knowledge Bank, Pearl) */}
                  {activeZone === 3 && (
                    <div className="space-y-4">
                      {/* Per-option Distractor Rationales */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={`block text-xs font-semibold ${themeLabel}`}>
                            Per-Option Distractor Rationales (Optional)
                          </label>
                          <span className="text-[11px] text-slate-400">Why each specific option is incorrect</span>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {newQuestionOptions.map((opt, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50/60 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                                  Option {String.fromCharCode(65 + idx)}:
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                                  {opt || `(Option ${String.fromCharCode(65 + idx)})`}
                                </span>
                              </div>
                              <input
                                type="text"
                                value={newDistractorRationales[idx] || ""}
                                onChange={(e) => {
                                  const next = [...newDistractorRationales];
                                  next[idx] = e.target.value;
                                  setNewDistractorRationales(next);
                                }}
                                className={`w-full px-3 py-1.5 text-xs rounded-lg border ${themeInput}`}
                                placeholder={`Why is ${String.fromCharCode(65 + idx)} incorrect / not first-line?`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Knowledge Bank */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={`block text-xs font-semibold ${themeLabel}`}>
                            Knowledge Bank (Clinical Background & Guidelines)
                          </label>
                          <span className="text-[11px] text-slate-400">Other relevant information about the testable point</span>
                        </div>
                        <textarea
                          rows={3}
                          value={newKnowledgeBank}
                          onChange={(e) => setNewKnowledgeBank(e.target.value)}
                          className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all resize-y dark:text-slate-100 ${themeInput}`}
                          placeholder="Relevant guidelines, clinical thresholds (e.g. CHA2DS2-VASc, eGFR cutoffs), pharmacology pearls..."
                        />
                      </div>

                      {/* Pearl */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={`block text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5`}>
                            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Clinical Pearl (Take-Home Line)
                          </label>
                          <span className="text-[11px] text-slate-400">The 1-sentence high-yield takeaway</span>
                        </div>
                        <input
                          type="text"
                          value={newPearl}
                          onChange={(e) => setNewPearl(e.target.value)}
                          className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all border-amber-300/80 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 focus:ring-2 focus:ring-amber-500/20`}
                          placeholder="e.g. In inferior STEMI (II, III, aVF), always check right-sided leads (V4R) before giving nitrates."
                        />
                      </div>
                    </div>
                  )}

                  {/* Modal Footer Controls */}
                  <div className="flex items-center justify-between pt-4 border-t dark:border-slate-800">
                    <div className="flex gap-2">
                      {activeZone > 1 && (
                        <button
                          type="button"
                          onClick={() => setActiveZone((prev) => Math.max(1, prev - 1) as any)}
                          className={themeBtnGhost}
                        >
                          &larr; Back
                        </button>
                      )}
                      {activeZone < 3 && (
                        <button
                          type="button"
                          onClick={() => setActiveZone((prev) => Math.min(3, prev + 1) as any)}
                          className={`px-3.5 py-2 text-xs font-semibold rounded-xl border ${themeBorder} ${themeSurface} hover:border-teal-500 transition-all`}
                        >
                          Next Zone &rarr;
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => {
                        setShowAddModal(false);
                        setEditingQuestion(null);
                        resetAddForm();
                      }} className={themeBtnGhost}>Cancel</button>
                      <button
                        onClick={handleCreateQuestion}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${themeBtnPrimary}`}
                      >
                        {editingQuestion ? "Save Changes" : "Save & Publish"}
                      </button>
                    </div>
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
                    {/* Exam Type Selector Pill */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Question Exam Format</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setUploadExamType("AKT")}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                            uploadExamType === "AKT"
                              ? "bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20 shadow-sm"
                              : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            uploadExamType === "AKT" ? "bg-teal-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}>
                            AKT
                          </div>
                          <div>
                            <p className="text-xs font-bold">AKT (Single MCQ)</p>
                            <p className="text-[10px] opacity-75">Applied Knowledge Test single-answer format</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUploadExamType("KFT")}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                            uploadExamType === "KFT"
                              ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-sm"
                              : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            uploadExamType === "KFT" ? "bg-purple-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}>
                            KFT
                          </div>
                          <div>
                            <p className="text-xs font-bold">KFT (Multi-Select)</p>
                            <p className="text-[10px] opacity-75">Key Feature Test multi-select clinical cases</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Instructions Card */}
                    <div className={`border rounded-2xl p-4 space-y-3 ${
                      uploadExamType === "KFT" ? "bg-purple-50/40 dark:bg-purple-950/10 border-purple-100/50 dark:border-purple-900/30" : "bg-teal-50/40 dark:bg-teal-950/10 border-teal-100/50 dark:border-teal-900/30"
                    }`}>
                      <div className={`flex items-center gap-2 ${uploadExamType === "KFT" ? "text-purple-800 dark:text-purple-300" : "text-teal-800 dark:text-teal-400"}`}>
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold uppercase tracking-wider">{uploadExamType} Template & Upload Guidelines</span>
                      </div>
                      <p className={`text-xs leading-relaxed ${uploadExamType === "KFT" ? "text-purple-950/70 dark:text-purple-300/80" : "text-teal-950/70 dark:text-teal-300/80"}`}>
                        {uploadExamType === "KFT"
                          ? "Uploading KFT Questions: Please use the specialized KFT DOCX template. Extracted questions will feature multi-select answer keys, subtopic tags, and 3-zone clinical explanation fields."
                          : "Uploading AKT Questions: Please use the standardized AKT DOCX template. Extracted questions will feature single-answer MCQs, clinical stem/lead-in, and core rationale."}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        {uploadExamType === "AKT" ? (
                          <a
                            href="/templates/question_template.docx?v=2"
                            download
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 hover:bg-teal-200 transition-colors inline-flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-3-3m3 3l3-3" /></svg>
                            Download AKT Template (.docx)
                          </a>
                        ) : (
                          <a
                            href="/templates/kft_template.docx?v=1"
                            download
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 hover:bg-purple-200 transition-colors inline-flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-3-3m3 3l3-3" /></svg>
                            Download KFT Template (.docx)
                          </a>
                        )}
                      </div>
                    </div>

                    {/* File Upload Zone */}
                    <div
                      onClick={() => uploadFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                        uploadExamType === "KFT"
                          ? "border-purple-200 dark:border-purple-800 hover:border-purple-500 bg-purple-50/20 dark:bg-purple-950/10"
                          : "border-slate-200 dark:border-slate-700 hover:border-teal-500 bg-slate-50/50 dark:bg-slate-800/30"
                      }`}
                    >
                      <input
                        type="file"
                        ref={uploadFileInputRef}
                        onChange={handleUploadFile}
                        accept=".docx,.pdf"
                        multiple
                        className="hidden"
                      />
                      <svg className={`w-10 h-10 mb-2 ${uploadExamType === "KFT" ? "text-purple-400" : "text-teal-600 dark:text-teal-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Drag & Drop <strong>{uploadExamType}</strong> Question DOCX or PDF files here
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">or click to choose files from your system (Max 10MB each)</p>
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
                            <span className={`text-[10px] font-mono w-8 text-right shrink-0 ${
                              bf.status === "success" ? "text-emerald-600 dark:text-emerald-400" :
                              bf.status === "error" ? "text-red-500" :
                              "text-teal-600 dark:text-teal-400"
                            }`}>
                              {bf.progress}%
                            </span>
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
                                {/* Zone 1: Clinical Presentation & Prompt */}
                                <div className="p-3 bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100/70 dark:border-teal-900/30 rounded-xl space-y-3">
                                  <span className="text-[11px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wide">Zone 1 — Clinical Presentation & Prompt</span>
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Clinical Vignette (Stem)</label>
                                    <textarea
                                      rows={3}
                                      value={q.stem || q.text || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        handleUpdateExtractedQuestion(qidx, "stem", val);
                                        handleUpdateExtractedQuestion(qidx, "text", q.leadIn ? `${val}\n\n${q.leadIn}` : val);
                                      }}
                                      className={`w-full px-3 py-1.5 text-xs rounded-lg transition-all resize-y dark:text-slate-100 ${themeInput}`}
                                      placeholder="Clinical scenario / patient history..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Lead-In Prompt</label>
                                    <input
                                      type="text"
                                      value={q.leadIn || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        handleUpdateExtractedQuestion(qidx, "leadIn", val);
                                        const stemText = q.stem || q.text || "";
                                        handleUpdateExtractedQuestion(qidx, "text", val ? `${stemText}\n\n${val}` : stemText);
                                      }}
                                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${themeInput}`}
                                      placeholder="Lead-in question directive (e.g., Which initial investigation is most appropriate?)..."
                                    />
                                  </div>
                                </div>

                                {/* Options grid */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <label className="block text-[11px] font-semibold text-slate-500">Zone 2 — Options & Correct Answer</label>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        q.examType === "KFT"
                                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                                          : "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300"
                                      }`}>
                                        {q.examType === "KFT" ? "Multi-Select (KFT)" : "Single-Choice (AKT)"}
                                      </span>
                                    </div>
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
                                    {q.options.map((opt: string, oidx: number) => {
                                      const isCorrectSelected = (q.correctIndices || [q.correctIndex || 0]).includes(oidx);
                                      return (
                                        <div key={oidx} className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (q.examType === "KFT") {
                                                let currentIndices: number[] = q.correctIndices ? [...q.correctIndices] : [q.correctIndex || 0];
                                                if (currentIndices.includes(oidx)) {
                                                  currentIndices = currentIndices.filter((idx) => idx !== oidx);
                                                } else {
                                                  currentIndices.push(oidx);
                                                }
                                                if (currentIndices.length === 0) currentIndices = [oidx];
                                                handleUpdateExtractedQuestion(qidx, "correctIndices", currentIndices);
                                                handleUpdateExtractedQuestion(qidx, "correctIndex", currentIndices[0]);
                                              } else {
                                                handleUpdateExtractedQuestion(qidx, "correctIndex", oidx);
                                                handleUpdateExtractedQuestion(qidx, "correctIndices", [oidx]);
                                              }
                                            }}
                                            className="flex items-center justify-center shrink-0 focus:outline-none"
                                            title={q.examType === "KFT" ? "Toggle Correct Answer" : "Mark as Correct Answer"}
                                          >
                                            <div className={`w-5 h-5 ${q.examType === "KFT" ? "rounded-md" : "rounded-full"} border flex items-center justify-center transition-all ${
                                              isCorrectSelected
                                                ? "border-teal-600 dark:border-teal-400 bg-teal-600 dark:bg-teal-400 shadow-sm shadow-teal-900/30 text-white"
                                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-500"
                                            }`}>
                                              {isCorrectSelected && (
                                                q.examType === "KFT" ? (
                                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                ) : (
                                                  <div className="w-2 h-2 rounded-full bg-white" />
                                                )
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
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Metadata row */}
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Exam Type</label>
                                    <CustomSelect
                                      value={q.examType || "AKT"}
                                      onChange={(val) => handleUpdateExtractedQuestion(qidx, "examType", val)}
                                      options={[
                                        { value: "AKT", label: "AKT (Single MCQ)" },
                                        { value: "KFT", label: "KFT (Multi-Select)" },
                                      ]}
                                      className="w-full text-xs"
                                    />
                                  </div>
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

                                {/* Zone 3: Educational Rationales & Key Takeaways */}
                                <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100/70 dark:border-purple-900/30 rounded-xl space-y-3">
                                  <span className="text-[11px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wide">Zone 3 — Educational Rationales & Takeaways</span>
                                  
                                  {/* Why Correct / Master Rationale */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Why Correct (Master Rationale)</label>
                                    <textarea
                                      rows={3}
                                      value={q.whyCorrect || q.rationale || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        handleUpdateExtractedQuestion(qidx, "whyCorrect", val);
                                        handleUpdateExtractedQuestion(qidx, "rationale", val);
                                      }}
                                      className={`w-full px-3 py-1.5 text-xs rounded-lg transition-all resize-y dark:text-slate-100 ${themeInput}`}
                                      placeholder="Detailed explanation of why correct option(s) are right..."
                                    />
                                  </div>

                                  {/* Distractor Rationales */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Distractor Rationales (Why Incorrect)</label>
                                    <textarea
                                      rows={3}
                                      value={Array.isArray(q.distractorRationales) ? q.distractorRationales.join("\n") : (q.distractorRationales || "")}
                                      onChange={(e) => {
                                        const arr = e.target.value.split("\n");
                                        handleUpdateExtractedQuestion(qidx, "distractorRationales", arr);
                                      }}
                                      className={`w-full px-3 py-1.5 text-xs rounded-lg transition-all resize-y dark:text-slate-100 ${themeInput}`}
                                      placeholder="One per line explaining why incorrect options are wrong..."
                                    />
                                  </div>

                                  {/* Knowledge Bank */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Knowledge Bank (Deep Dive & Guidelines)</label>
                                    <textarea
                                      rows={2}
                                      value={q.knowledgeBank || ""}
                                      onChange={(e) => handleUpdateExtractedQuestion(qidx, "knowledgeBank", e.target.value)}
                                      className={`w-full px-3 py-1.5 text-xs rounded-lg transition-all resize-y dark:text-slate-100 ${themeInput}`}
                                      placeholder="Guidelines, references, therapeutic guidelines notes..."
                                    />
                                  </div>

                                  {/* Clinical Pearl */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Clinical Pearl (Key Takeaway)</label>
                                    <input
                                      type="text"
                                      value={q.pearl || ""}
                                      onChange={(e) => handleUpdateExtractedQuestion(qidx, "pearl", e.target.value)}
                                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${themeInput}`}
                                      placeholder="High-yield exam takeaway..."
                                    />
                                  </div>
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
                                            reader.onloadend = async () => {
                                              try {
                                                const compressed = await compressBase64Image(reader.result as string);
                                                const fileUrl = await uploadBase64ImageToR2(compressed, file.name);
                                                handleUpdateExtractedQuestion(qidx, "image", fileUrl);
                                              } catch (err: any) {
                                                console.error("Upload to R2 failed:", err);
                                                showAlert("Failed to upload image to Cloudflare R2.", "Upload Error", "error");
                                              }
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
                    Import & Publish
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
      {/* Custom Alert Modal */}
      <AnimatePresence>
        {alertConfig.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9998]"
              onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`fixed inset-x-4 top-[20%] mx-auto w-full max-w-md bg-white dark:bg-slate-900 border rounded-2xl z-[9999] shadow-2xl p-6 overflow-hidden ${themeBorder}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${
                  alertConfig.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450" :
                  alertConfig.type === "error" ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450" :
                  alertConfig.type === "warning" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450" :
                  "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-450"
                }`}>
                  {alertConfig.type === "success" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {alertConfig.type === "error" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {alertConfig.type === "warning" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {alertConfig.type === "info" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-serif text-lg font-semibold ${themeText}`}>{alertConfig.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${themeMuted}`}>{alertConfig.message}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                  className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition-all shadow-sm ${themeBtnPrimary}`}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </>
        )}

        {duplicatePrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
              onClick={() => setDuplicatePrompt(null)}
            />
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center mb-4 text-amber-500 dark:text-amber-400">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Duplicate Questions Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  <strong>{duplicatePrompt.count} question(s)</strong> in this file already exist in the Question Bank.
                </p>
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-left text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 border border-slate-100 dark:border-slate-800/30">
                  <p>• <span className="font-semibold text-slate-800 dark:text-slate-250">Overwrite & Replace</span>: Updates existing records with the new document version (text, options, rationale).</p>
                  <p>• <span className="font-semibold text-slate-800 dark:text-slate-250">Skip Duplicates</span>: Leaves existing bank records untouched and only imports brand new questions.</p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      duplicatePrompt.onConfirm(false);
                      setDuplicatePrompt(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    Skip Duplicates
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      duplicatePrompt.onConfirm(true);
                      setDuplicatePrompt(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-xs font-bold text-white shadow-md shadow-teal-800/20 transition-all cursor-pointer"
                  >
                    Overwrite & Replace
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
        {deleteConfirmQuestion && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirmQuestion(null)}
            />
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-100 dark:border-rose-900/30 overflow-hidden p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
                  <Lucide.Trash2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Permanently Delete Question?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Are you sure you want to permanently delete <strong>Question #{deleteConfirmQuestion.id}</strong> ({deleteConfirmQuestion.uqid || `ID: ${deleteConfirmQuestion.id}`})?
                </p>
                <div className="mt-3 p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl text-left text-[11px] text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30">
                  <p className="font-semibold">⚠️ Danger Zone</p>
                  <p className="mt-0.5 opacity-90">This action is irreversible and will permanently purge options, subtopic tags, and attempt references from the database.</p>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmQuestion(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => executePermanentDelete(deleteConfirmQuestion)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                  >
                    Permanently Delete
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

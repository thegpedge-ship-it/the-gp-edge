"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import CustomSelect from "@/components/admin/CustomSelect";
import {
  AVAILABLE_TOPICS,
  Quiz,
  QuizStatus,
  Question,
  fetchQuestions,
  getTopics,
  getCustomTags,
} from "@/lib/quizData";
import { uploadBase64ImageToR2 } from "@/lib/r2Client";
import { importQuestionsAction } from "@/actions/question.actions";
import { syncQuizToDbAction, deleteQuizFromDbAction, fetchQuizByDbIdAction } from "@/actions/quiz.actions";
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
import { useAdminRole } from "@/hooks/useAdminRole";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

type Tab = "settings" | "questions";

function compressBase64Image(base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith("data:image/")) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
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

export default function EditQuizPage() {
  const { currentAdmin, isReadOnly } = useAdminRole();
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string; // DB UUID

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
  const [questionLimit, setQuestionLimit] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<{ count: number; onConfirm: (overwrite: boolean) => void } | null>(null);

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
  const [status, setStatus] = useState<QuizStatus>("active");
  const [examType, setExamType] = useState<Quiz["examType"]>("AKT");
  const [randomize, setRandomize] = useState(true);
  const [isFree, setIsFree] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Load quiz from Neon DB by UUID
    fetchQuizByDbIdAction(quizId).then(async (dbQuiz) => {
      if (!dbQuiz) {
        setNotFound(true);
        setLoaded(true);
        return;
      }
      setName(dbQuiz.name);
      setDescription(dbQuiz.description);
      setTopics([]);
      setQuestionLimit(dbQuiz.questionLimit);
      setTimeLimit(dbQuiz.timeLimit);
      setPassingScore(dbQuiz.passingScore);
      setStatus("active");
      setExamType(dbQuiz.examType as any);
      setRandomize(dbQuiz.randomize);
      setIsFree(dbQuiz.isFree ?? false);
      setAttempts(0);
      setAvgScore(0);
      setNotFound(false);

      // Load all questions from DB, then map quiz question DB UUIDs → numeric ids
      const allQs = await fetchQuestions();
      setAllQuestions(allQs);

      const dbIdToNumeric = new Map(allQs.map((q) => [q.dbId, q.id]));
      const numericIds = dbQuiz.questionDbIds
        .map((dbId) => dbIdToNumeric.get(dbId))
        .filter((id): id is number => id !== undefined);
      setQuestionIds(Array.from(new Set(numericIds)));

      setLoaded(true);
    });
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
    if (questionIds.length >= questionLimit) {
      showAlert(`Cannot add question. This mock test is limited to a maximum of ${questionLimit} questions. You can increase the limit in Settings if you want to add more.`, "Question Limit Reached", "warning");
      return;
    }
    if (!newQuestionText.trim()) {
      showAlert("Please enter the question text.", "Validation Error", "error");
      return;
    }
    const cleanedText = newQuestionText.trim().toLowerCase();
    const existingQuestion = allQuestions.find((q) => q.text.trim().toLowerCase() === cleanedText);
    if (existingQuestion) {
      if (questionIds.includes(existingQuestion.id)) {
        showAlert("This question is already assigned to this quiz.", "Already Assigned", "info");
        setShowAddQuestionModal(false);
        resetAddQuestionForm();
        return;
      }
      setQuestionIds([...questionIds, existingQuestion.id]);
      setShowAddQuestionModal(false);
      resetAddQuestionForm();
      setSaveMessage("Question already exists. Fetched and assigned from Question Bank.");
      setTimeout(() => setSaveMessage(null), 3000);
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
      status: "published",
      tags: newQuestionTags.length > 0 ? newQuestionTags : ["General"],
      image: newImage || undefined,
    };

    // Save to Neon DB, then refresh the question bank to get the DB-assigned dbId
    importQuestionsAction([newQuestion]).then(() => {
      fetchQuestions().then((list) => {
        setAllQuestions(list);
        const dbQuestion = list.find(q => q.text.trim() === newQuestion.text.trim());
        if (dbQuestion) {
          setQuestionIds(prev => [...prev, dbQuestion.id]);
        } else {
          setQuestionIds(prev => [...prev, nextId]);
        }
      });
    });

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
                if (q.image) {
                  const comp = await compressBase64Image(q.image);
                  return { ...q, image: comp };
                }
                return q;
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
      allQuestions.some((aq) => aq.text.trim().toLowerCase() === eq.text.trim().toLowerCase())
    );

    const proceedWithImport = async (overwrite: boolean) => {
      const toAssignIds: number[] = [];
      const newQsToInsert: any[] = [];

      let nextId = allQuestions.length > 0 ? Math.max(...allQuestions.map(q => q.id)) + 1 : 2855;

      for (const eq of uniqueQuestionsToImport) {
        const cleanedText = eq.text.trim().toLowerCase();
        const existingQuestion = allQuestions.find((aq) => aq.text.trim().toLowerCase() === cleanedText);
        
        const questionId = existingQuestion ? existingQuestion.id : nextId++;
        
        if (existingQuestion) {
          // If it exists in the question bank, and we want to OVERWRITE
          if (overwrite) {
            const cleanedTags = eq.tags
              ? eq.tags.map((t: string) => t.trim()).filter(Boolean)
              : existingQuestion.tags;
            const updatedQ = {
              ...existingQuestion,
              text: eq.text,
              options: eq.options,
              correctIndex: eq.correctIndex,
              rationale: eq.rationale || existingQuestion.rationale,
              topic: eq.topic ? eq.topic.trim() : existingQuestion.topic,
              difficulty: eq.difficulty || existingQuestion.difficulty,
              tags: cleanedTags.length > 0 ? cleanedTags : ["General"],
              image: eq.image || existingQuestion.image,
              status: "published" as const
            };
            newQsToInsert.push(updatedQ);
          }
          
          if (!toAssignIds.includes(questionId) && !questionIds.includes(questionId)) {
            toAssignIds.push(questionId);
          }
        } else {
          // If it's a new question, insert it into the question bank
          const cleanedTags = eq.tags
            ? eq.tags.map((t: string) => t.trim()).filter(Boolean)
            : ["General"];
          const newQ = {
            ...eq,
            id: questionId,
            topic: eq.topic ? eq.topic.trim() : "General",
            difficulty: eq.difficulty || "Medium",
            examType: "AKT" as const,
            tags: cleanedTags.length > 0 ? cleanedTags : ["General"],
            status: "published" as const
          };
          newQsToInsert.push(newQ);
          
          if (!toAssignIds.includes(questionId) && !questionIds.includes(questionId)) {
            toAssignIds.push(questionId);
          }
        }
      }

      const totalToAssignCount = toAssignIds.length;
      const spaceLeft = Math.max(0, questionLimit - questionIds.length);
      
      if (spaceLeft === 0) {
        showAlert(`Cannot import questions. This mock test is already at its limit of ${questionLimit} questions.`, "Import Blocked", "warning");
        return;
      }

      let finalAssignIds = toAssignIds;
      let finalNewQsToInsert = newQsToInsert;

      if (totalToAssignCount > spaceLeft) {
        showAlert(`The uploaded file contains ${totalToAssignCount} questions to add, but this mock test only has space for ${spaceLeft} more questions (limit: ${questionLimit}). Only the first ${spaceLeft} questions will be added/imported.`, "Import Partially Limited", "warning");
        finalAssignIds = toAssignIds.slice(0, spaceLeft);
        // Only insert new questions that are in finalAssignIds
        finalNewQsToInsert = newQsToInsert.filter(q => finalAssignIds.includes(q.id));
      }
      
      let latestAllQuestions: any[] = allQuestions;

      if (finalNewQsToInsert.length > 0) {
        setUploadState("uploading");
        const uploadedNewQs = await Promise.all(
          finalNewQsToInsert.map(async (q) => {
            if (q.image && q.image.startsWith("data:image/")) {
              try {
                const fileUrl = await uploadBase64ImageToR2(q.image, "extracted_question_image.jpg");
                return { ...q, image: fileUrl };
              } catch (err) {
                console.error("Client image upload failed:", err);
              }
            }
            return q;
          })
        );

        // Update local state without introducing duplicate elements
        const filteredAllQuestions = allQuestions.filter(
          (aq) => !uploadedNewQs.some((nq) => nq.text.trim().toLowerCase() === aq.text.trim().toLowerCase())
        );
        let updated = [...uploadedNewQs, ...filteredAllQuestions];
        setAllQuestions(updated);
        
        const res = await importQuestionsAction(uploadedNewQs);
        if (res?.success && res.results) {
          const resultsMap = new Map(res.results.map((r) => [r.text.trim().toLowerCase(), r.dbId]));
          updated = updated.map((q) => {
            const dbId = resultsMap.get(q.text.trim().toLowerCase());
            return dbId ? { ...q, dbId } : q;
          });
          setAllQuestions(updated);
        }
        latestAllQuestions = updated;
        
        addUserNotification(
          `${finalNewQsToInsert.length} Questions Imported/Updated`,
          `Successfully processed ${finalNewQsToInsert.length} questions from document template.`,
          finalNewQsToInsert.length,
          "new-questions"
        );
      }

      setQuestionIds((prev) => [...prev, ...finalAssignIds]);

      // Save the quiz to DB so the question assignments persist
      const topicCounts: Record<string, number> = {};
      const topicQuestionDbIds: Record<string, string[]> = {};
      
      for (const qId of [...questionIds, ...finalAssignIds]) {
        const fullQ = latestAllQuestions.find((q: any) => q.id === qId);
        if (fullQ) {
          const t = fullQ.topic || "General";
          topicCounts[t] = (topicCounts[t] || 0) + 1;
          if (fullQ.dbId) {
            if (!topicQuestionDbIds[t]) topicQuestionDbIds[t] = [];
            topicQuestionDbIds[t].push(fullQ.dbId);
          }
        }
      }

      const activeTopics = Object.keys(topicCounts).filter((t) => topicCounts[t] > 0);
      
      await syncQuizToDbAction({
        name: name.trim(),
        description: description.trim(),
        timeLimit,
        passingScore,
        randomize,
        status: status as any,
        examType: examType as any,
        questionLimit,
      }, [...questionIds, ...finalAssignIds].map(id => latestAllQuestions.find((q: any) => q.id === id)).filter(Boolean) as any[], currentAdmin?.id);

      setShowUploadModal(false);
      setUploadState("idle");
      setExtractionState("idle");
      setExtractedQuestions([]);
      setDuplicatePrompt(null);

      const duplicateCount = finalAssignIds.length - finalNewQsToInsert.length;
      let successMsg = `Successfully added ${finalAssignIds.length} question(s) to this quiz!`;
      if (duplicateCount > 0 && !overwrite) {
        successMsg += ` (${duplicateCount} question(s) already existed in your question bank and were linked without duplicating database entries.)`;
      } else if (duplicateCount > 0 && overwrite) {
        successMsg += ` (${duplicateCount} question(s) already existed in your question bank and were updated and linked.)`;
      }
      showAlert(successMsg, "Import Successful", "success");
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

  const assignedQuestions = useMemo(
    () => questionIds.map((id) => allQuestions.find((q) => q.id === id)).filter(Boolean) as Question[],
    [questionIds, allQuestions]
  );

  const availableQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (q.status !== "published") return false;
      if (questionIds.includes(q.id)) return false;
      
      // Hide static mock question if its database version exists
      if (q.id >= 2847 && q.id <= 2854) {
        const hasDbVersion = allQuestions.some((other) => other.id >= 2855 && other.text === q.text);
        if (hasDbVersion) return false;
      }
      
      const matchSearch =
        questionSearch === "" ||
        q.text.toLowerCase().includes(questionSearch.toLowerCase()) ||
        q.id.toString().includes(questionSearch);
      const matchTopic = topicFilter === "all" || q.topic.split(",").map(t => t.trim().toLowerCase()).includes(topicFilter.toLowerCase());
      return matchSearch && matchTopic;
    });
  }, [allQuestions, questionIds, questionSearch, topicFilter]);

  const toggleTopic = (topic: string) => {
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const addQuestion = (id: number) => {
    if (questionIds.length >= questionLimit) {
      showAlert(`Cannot add question. This mock test is limited to a maximum of ${questionLimit} questions. You can increase the limit in Settings if you want to add more.`, "Question Limit Reached", "warning");
      return;
    }
    setQuestionIds((prev) => prev.includes(id) ? prev : [...prev, id]);
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
    if (isReadOnly) return;
    if (!name.trim()) {
      showAlert("Please enter a quiz name.", "Validation Error", "error");
      return;
    }
    if (questionIds.length === 0) {
      showAlert("Add at least one question to this quiz.", "Validation Error", "error");
      return;
    }

    const questionsOfQuiz = questionIds.map(id => allQuestions.find(q => q.id === id)).filter(Boolean) as any[];
    syncQuizToDbAction({
      name: name.trim(),
      description: description.trim(),
      timeLimit,
      passingScore,
      randomize,
      isFree,
      status: status as any,
      examType: examType as any,
      questionLimit,
    }, questionsOfQuiz, currentAdmin?.id);

    setSaveMessage("Changes saved successfully.");
    setTimeout(() => setSaveMessage(null), 3000);

    if (redirect) {
      router.push("/admin/quizzes");
    }
  };

  const handlePublish = () => {
    if (isReadOnly) return;
    if (!name.trim() || questionIds.length === 0) {
      showAlert("Add a name and at least one question before publishing.", "Publish Error", "error");
      return;
    }
    setStatus("active");
    const questionsOfQuiz = questionIds.map(id => allQuestions.find(q => q.id === id)).filter(Boolean) as any[];
    syncQuizToDbAction({
      name: name.trim(),
      description: description.trim(),
      timeLimit,
      passingScore,
      randomize,
      isFree,
      status: "active",
      examType: examType as any,
    }, questionsOfQuiz, currentAdmin?.id);

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
    if (isReadOnly) return;
    setStatus("suspended");
    const questionsOfQuiz = questionIds.map(id => allQuestions.find(q => q.id === id)).filter(Boolean) as any[];
    syncQuizToDbAction({
      name: name.trim(),
      description: description.trim(),
      timeLimit,
      passingScore,
      randomize,
      status: "suspended" as any,
      examType: examType as any,
    }, questionsOfQuiz, currentAdmin?.id);

    setSaveMessage("Quiz suspended.");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleDuplicate = async () => {
    if (isReadOnly) return;
    const copyName = `${name} (Copy)`;
    const questionsOfQuiz = questionIds.map(id => allQuestions.find(q => q.id === id)).filter(Boolean) as any[];
    const result = await syncQuizToDbAction({
      name: copyName,
      description,
      timeLimit,
      passingScore,
      randomize,
      status: "active",
      examType: examType as any,
    }, questionsOfQuiz, currentAdmin?.id);
    if (result.success && result.dbId) {
      router.push(`/admin/quizzes/${result.dbId}/edit`);
    }
  };

  const handleDelete = async () => {
    if (isReadOnly) return;
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteQuizFromDbAction(name);
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
            <button type="button" onClick={handleDuplicate} disabled={isReadOnly} className={`${themeBtnGhost} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}>
              Duplicate
            </button>

            <button type="button" onClick={() => handleSave(true)} disabled={isReadOnly} className={`px-4 py-2.5 text-sm font-semibold rounded-xl ${themeBtnPrimary} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}>
              Save & Close
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
              <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Question Limit</label>
              <input
                type="number"
                min={1}
                value={questionLimit}
                onChange={(e) => setQuestionLimit(Number(e.target.value))}
                className={`w-full px-4 py-2.5 text-sm rounded-xl ${themeInput}`}
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

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={randomize}
                onChange={(e) => setRandomize(e.target.checked)}
                className="w-4 h-4 rounded border-teal-300 dark:border-teal-700 text-teal-700 focus:ring-teal-700/20"
              />
              <span className={`text-sm ${themeLabel}`}>Randomize question order for each attempt</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="w-4 h-4 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500/20"
              />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Free Access (Allow non-paying & subscription users to attempt this quiz)
              </span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-teal-100/80 dark:border-teal-900/30">
            <button type="button" onClick={handleDelete} className="text-sm font-semibold text-teal-800/70 hover:text-teal-900 dark:text-teal-400">
              Delete Quiz
            </button>
            <div className="flex gap-3">

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
            <div className={`px-5 py-4 border-b ${themeBorder} space-y-3`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className={`text-sm font-bold ${themeText}`}>Assigned Questions ({questionIds.length})</h3>
                  <p className={`text-xs mt-0.5 ${themeMuted}`}>Drag order using arrows. First question appears first in the exam.</p>
                </div>
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
            </div>
            <div className="divide-y divide-teal-50 dark:divide-teal-900/20 max-h-[480px] overflow-y-auto">
              {assignedQuestions.length === 0 ? (
                <p className={`p-6 text-sm text-center ${themeMuted}`}>No questions assigned yet. Add from the question bank →</p>
              ) : (
                assignedQuestions.map((q, index) => (
                  <div key={`${q.id}-${index}`} className="px-5 py-3 flex items-start gap-3 group hover:bg-teal-50/30 dark:hover:bg-teal-950/10">
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
                            reader.onloadend = async () => {
                              try {
                                const compressed = await compressBase64Image(reader.result as string);
                                const fileUrl = await uploadBase64ImageToR2(compressed, file.name);
                                setNewImage(fileUrl);
                              } catch (err: any) {
                                console.error("Upload to R2 failed:", err);
                                alert("Failed to upload image to Cloudflare R2.");
                              }
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
                            className="text-[10px] font-bold text-slate-555 hover:text-red-500 transition-colors"
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
                  alertConfig.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" :
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
                  <p>• <span className="font-semibold text-slate-800 dark:text-slate-250">Skip Updating</span>: Leaves existing bank records untouched (questions will still be linked to this quiz).</p>
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
                    Skip Updating
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
      </AnimatePresence>
    </motion.div>
  );
}

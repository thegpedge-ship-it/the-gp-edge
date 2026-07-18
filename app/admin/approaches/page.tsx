"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import * as Lucide from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import CustomSelect from "@/components/admin/CustomSelect";
import { getApproachCards, saveApproachCards, ApproachCard, ApproachStep } from "@/lib/quizData";
import { addUserNotification } from "@/utils/notifications";
import { useAdminRole } from "@/hooks/useAdminRole";
import { uploadToR2 } from "@/lib/r2Client";
import {
  getApproachCardsFromDbAction,
  saveApproachCardToDbAction,
  deleteApproachCardFromDbAction,
  syncApproachCardsToDbAction,
  getTagsFromDbAction,
  addTagToDbAction
} from "@/actions/approach.actions";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } } };

const SYSTEMS = ["Cardiology","Respiratory","Endocrine","Gastrointestinal","Psychiatry","Dermatology","Women's Health","Paediatrics","Neurology","Musculoskeletal","MBS"];
const STEP_TYPES = [
  { value: "action", label: "Action", color: "text-teal-700 bg-teal-50 border-teal-200", icon: "" },
  { value: "decision", label: "Decision", color: "text-amber-700 bg-amber-50 border-amber-200", icon: "" },
  { value: "checklist", label: "Checklist", color: "text-blue-700 bg-blue-50 border-blue-200", icon: "" },
  { value: "info", label: "Info", color: "text-slate-700 bg-slate-50 border-slate-200", icon: "" },
  { value: "warning", label: "Warning", color: "text-red-700 bg-red-50 border-red-200", icon: "" },
];

function getStepStyle(type: string) {
  return STEP_TYPES.find(t => t.value === type) || STEP_TYPES[0];
}

const systemColors: Record<string, string> = {
  Cardiology: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Respiratory: "bg-teal-50 text-teal-700 border-teal-200",
  Endocrine: "bg-green-50 text-green-700 border-green-200",
  Gastrointestinal: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Psychiatry: "bg-teal-50 text-teal-800 border-teal-200",
  Dermatology: "bg-green-50 text-green-800 border-green-200",
  "Women's Health": "bg-slate-50 text-slate-700 border-slate-200",
  Paediatrics: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Neurology: "bg-blue-50 text-blue-700 border-blue-200",
  Musculoskeletal: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MBS: "bg-amber-50 text-amber-700 border-amber-200",
};

function emptyCard(): Omit<ApproachCard, "id"> {
  return {
    title: "",
    subtitle: "",
    system: "Cardiology",
    category: "",
    status: "draft",
    lastUpdated: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
    author: "GP Edge Admin",
    isPremium: false,
    tags: [],
    overview: "",
    steps: [],
    keyPoints: [],
    redFlags: [],
    references: [],
  };
}

function emptyStep(): ApproachStep {
  return { id: crypto.randomUUID(), title: "", description: "", type: "action", checklistItems: [] };
}

export default function ApproachesPage() {
  const { isReadOnly } = useAdminRole();
  const [cards, setCards] = useState<ApproachCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<ApproachCard | null>(null);
  const [form, setForm] = useState<Omit<ApproachCard, "id">>(emptyCard());

  // Form sub-states
  const [tagInput, setTagInput] = useState("");
  const [keyPointInput, setKeyPointInput] = useState("");
  const [redFlagInput, setRedFlagInput] = useState("");
  const [refInput, setRefInput] = useState({ text: "", url: "" });
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [stepItemInput, setStepItemInput] = useState<Record<string, string>>({});
  const [dbTags, setDbTags] = useState<string[]>([]);

  // Document Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");
  const [extractionState, setExtractionState] = useState<"idle" | "extracting" | "success">("idle");
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionLog, setExtractionLog] = useState("");
  const [extractedCards, setExtractedCards] = useState<any[]>([]);
  const [batchFiles, setBatchFiles] = useState<{ id: string; name: string; size: string; progress: number; status: "idle" | "uploading" | "extracting" | "success" | "error"; error?: string }[]>([]);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  // New Queue States
  const [uploadQueue, setUploadQueue] = useState<{ file: File; id: string }[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [currentPreviewCard, setCurrentPreviewCard] = useState<any | null>(null);

  const processQueueItem = async (fileList: File[], idx: number) => {
    if (idx >= fileList.length) {
      // All done
      setUploadState("idle");
      setCurrentPreviewCard(null);
      setShowUploadModal(false);
      return;
    }
    const file = fileList[idx];
    setUploadedFileName(file.name);
    setUploadedFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
    setUploadProgress(0);
    setUploadState("uploading");
    setCurrentPreviewCard(null);
    setExtractionState("idle");

    // Progress animation
    const progressTimer = setInterval(() => {
      setUploadProgress(prev => Math.min(85, prev + Math.random() * 15));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "approach");
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      clearInterval(progressTimer);
      setUploadProgress(100);
      const result = await res.json();
      if (result.success && result.type === "approach" && result.card) {
        let r2Url = "";
        try {
          r2Url = await uploadToR2(file, file.name, file.type);
        } catch {}
        runExtractionAnim({ ...result.card, sourceFileUrl: r2Url });
      } else {
        alert(`Failed to extract "${file.name}": ${result.error || "Unknown error"}`);
        // Skip failed file, move to next
        const nextIdx = idx + 1;
        setQueueIdx(nextIdx);
        processQueueItem(fileList, nextIdx);
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      alert(`Error extracting "${file.name}": ${err.message}`);
      const nextIdx = idx + 1;
      setQueueIdx(nextIdx);
      processQueueItem(fileList, nextIdx);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setUploadQueue(fileList.map((f, i) => ({ file: f, id: `q-${Date.now()}-${i}` })));
    setQueueIdx(0);
    setCurrentPreviewCard(null);
    if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
    processQueueItem(fileList, 0);
  };

  const runExtractionAnim = (card: any) => {
    setExtractionState("extracting");
    setExtractionProgress(0);
    setExtractionLog("Opening document stream...");
    
    setTimeout(() => {
      setExtractionProgress(35);
      setExtractionLog("Parsing structured sections...");
    }, 300);

    setTimeout(() => {
      setExtractionProgress(70);
      setExtractionLog("Formatting clinical steps and flowchart...");
    }, 600);

    setTimeout(() => {
      setExtractionProgress(100);
      setExtractionState("success");
      setExtractionLog("Extraction complete!");
      setCurrentPreviewCard(card);
      setUploadState("success");
    }, 900);
  };

  const handlePublishCurrent = async () => {
    if (!currentPreviewCard) return;
    const newId = crypto.randomUUID();
    const targetCard = {
      ...currentPreviewCard,
      id: newId,
      lastUpdated: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
      status: "draft" as const
    };
    
    const updatedCards = [targetCard, ...cards];
    setCards(updatedCards);
    saveApproachCards(updatedCards);
    await saveApproachCardToDbAction(targetCard);
    
    addUserNotification(
      "Approach Imported",
      `Successfully imported "${targetCard.title}" from document template.`,
      1,
      "custom"
    );

    // Go to next
    const nextIdx = queueIdx + 1;
    setQueueIdx(nextIdx);
    setCurrentPreviewCard(null);
    processQueueItem(uploadQueue.map(q => q.file), nextIdx);
  };

  const handleCancelCurrent = () => {
    // Skip / discard
    const nextIdx = queueIdx + 1;
    setQueueIdx(nextIdx);
    setCurrentPreviewCard(null);
    processQueueItem(uploadQueue.map(q => q.file), nextIdx);
  };

  const handleSaveImportedCards = handlePublishCurrent;

  // Preview mode
  const [previewCard, setPreviewCard] = useState<ApproachCard | null>(null);
  const [activeStepPreview, setActiveStepPreview] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Helper to normalize card properties to prevent crash on undefined arrays
    const sanitize = (c: ApproachCard) => ({
      ...c,
      tags: c.tags || [],
      steps: c.steps || [],
      keyPoints: c.keyPoints || [],
      redFlags: c.redFlags || [],
      references: c.references || [],
    });

    // 1. Load from local cache for instant UI load
    const localCards = getApproachCards();
    const sanitizedLocal = localCards.map(sanitize);
    setCards(sanitizedLocal);

    // 2. Fetch fresh data from Neon Database in background
    getApproachCardsFromDbAction().then(dbCards => {
      if (dbCards && dbCards.length > 0) {
        const sanitizedDb = dbCards.map(sanitize);
        setCards(sanitizedDb);
        saveApproachCards(sanitizedDb);
      } else if (sanitizedLocal.length > 0) {
        // Auto-migrate local storage data to database if DB is empty
        syncApproachCardsToDbAction(sanitizedLocal);
      }
    });

    getTagsFromDbAction().then(tags => {
      setDbTags(tags);
    });
  }, []);

  const filtered = useMemo(() => {
    return cards.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.system.toLowerCase().includes(q);
      const matchSystem = systemFilter === "all" || c.system === systemFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchSystem && matchStatus;
    });
  }, [cards, searchQuery, systemFilter, statusFilter]);

  const { published, drafts, reviews } = useMemo(() => {
    let p = 0, d = 0, r = 0;
    for (const c of cards) {
      if (c.status === "published") p++;
      else if (c.status === "draft") d++;
      else if (c.status === "review") r++;
    }
    return { published: p, drafts: d, reviews: r };
  }, [cards]);

  const handleAddTag = async (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    
    // Add to the local card form state
    if (!form.tags.includes(trimmed)) {
      setForm(f => ({ ...f, tags: [...f.tags, trimmed] }));
    }
    setTagInput("");
    
    // Store in DB tags table if not already there
    try {
      await addTagToDbAction(trimmed);
      const freshTags = await getTagsFromDbAction();
      setDbTags(freshTags);
    } catch (err) {
      console.error("Failed to add tag to DB:", err);
    }
  };

  function openCreate() {
    setEditingCard(null);
    setForm(emptyCard());
    setTagInput(""); setKeyPointInput(""); setRedFlagInput("");
    setRefInput({ text: "", url: "" }); setActiveStep(null);
    setShowModal(true);
  }

  function openEdit(card: ApproachCard) {
    setEditingCard(card);
    setForm({
      ...card,
      tags: card.tags || [],
      steps: card.steps || [],
      keyPoints: card.keyPoints || [],
      redFlags: card.redFlags || [],
      references: card.references || [],
    });
    setTagInput(""); setKeyPointInput(""); setRedFlagInput("");
    setRefInput({ text: "", url: "" }); setActiveStep(null);
    setShowModal(true);
  }

  async function saveForm() {
    if (isReadOnly) return;
    if (!form.title.trim()) { alert("Please enter a title."); return; }
    const now = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
    let updated: ApproachCard[];
    let targetCard: ApproachCard;
    if (editingCard) {
      targetCard = { ...form, id: editingCard.id, lastUpdated: now };
      updated = cards.map(c => c.id === editingCard.id ? targetCard : c);
      addUserNotification("Approach Updated", `"${form.title}" has been saved.`, 1, "custom");
    } else {
      // Ensure we use a valid UUID format for DB compatibility
      const newId = crypto.randomUUID();
      targetCard = { ...form, id: newId, lastUpdated: now };
      updated = [targetCard, ...cards];
      addUserNotification("Approach Created", `"${form.title}" has been created as ${form.status}.`, 1, "custom");
    }
    setCards(updated);
    saveApproachCards(updated);
    
    // Save to Neon Postgres DB
    await saveApproachCardToDbAction(targetCard);
    
    setShowModal(false);
  }

  async function deleteCard(id: string) {
    if (isReadOnly) return;
    if (!confirm("Delete this approach card?")) return;
    const updated = cards.filter(c => c.id !== id);
    setCards(updated);
    saveApproachCards(updated);
    addUserNotification("Approach Deleted", "The approach card has been removed.", 1, "custom");
    
    // Delete from Neon Postgres DB
    await deleteApproachCardFromDbAction(id);
  }

  async function updateStatus(id: string, status: "draft" | "review" | "published") {
    if (isReadOnly) return;
    const now = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
    const target = cards.find(c => c.id === id);
    if (!target) return;
    const updatedCard = { ...target, status, lastUpdated: now };
    const updated = cards.map(c => c.id === id ? updatedCard : c);
    setCards(updated);
    saveApproachCards(updated);
    const label = status === "published" ? "published" : status === "review" ? "sent to review" : "set to draft";
    addUserNotification("Status Updated", `Approach ${label} successfully.`, 1, "custom");
    
    // Save state to Neon Postgres DB
    await saveApproachCardToDbAction(updatedCard);
  }

  // Step management
  function addStep() {
    const s = emptyStep();
    setForm(f => ({ ...f, steps: [...f.steps, s] }));
    setActiveStep(s.id);
  }

  function updateStep(id: string, updates: Partial<ApproachStep>) {
    setForm(f => ({ ...f, steps: f.steps.map(s => s.id === id ? { ...s, ...updates } : s) }));
  }

  function removeStep(id: string) {
    setForm(f => ({ ...f, steps: f.steps.filter(s => s.id !== id) }));
    if (activeStep === id) setActiveStep(null);
  }

  function addChecklistItem(stepId: string) {
    const val = stepItemInput[stepId]?.trim();
    if (!val) return;
    updateStep(stepId, { checklistItems: [...(form.steps.find(s => s.id === stepId)?.checklistItems || []), val] });
    setStepItemInput(p => ({ ...p, [stepId]: "" }));
  }

  function removeChecklistItem(stepId: string, idx: number) {
    const step = form.steps.find(s => s.id === stepId);
    if (!step) return;
    updateStep(stepId, { checklistItems: step.checklistItems?.filter((_, i) => i !== idx) });
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Clinical Approaches"
        subtitle="Create and manage structured clinical approach cards displayed in the medical library."
        actions={
          !isReadOnly && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setShowUploadModal(true);
                  setUploadState("idle");
                  setExtractionState("idle");
                  setExtractedCards([]);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all cursor-pointer"
              >
                <Lucide.Upload className="w-4 h-4 text-teal-800 dark:text-teal-400" />
                Upload Card
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl shadow transition-all cursor-pointer border-none"
              >
                <Lucide.Plus className="w-4 h-4" />
                New Approach Card
              </button>
            </div>
          )
        }
      />

      {/* Stats */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Cards", value: cards.length, icon: <Lucide.Layers className="w-4 h-4" />, color: "text-teal-600" },
          { label: "Published", value: published, icon: <Lucide.CheckCircle className="w-4 h-4" />, color: "text-emerald-600" },
          { label: "In Review", value: reviews, icon: <Lucide.Clock className="w-4 h-4" />, color: "text-amber-600" },
          { label: "Drafts", value: drafts, icon: <Lucide.FileEdit className="w-4 h-4" />, color: "text-slate-500" },
        ].map(stat => (
          <motion.div key={stat.label} variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className={`${stat.color} bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl`}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search approach cards..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200"
          />
        </div>
        <CustomSelect
          value={systemFilter}
          onChange={setSystemFilter}
          options={[{ value: "all", label: "All Systems" }, ...SYSTEMS.map(s => ({ value: s, label: s }))]}
          className="min-w-[160px]"
        />
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: "all", label: "All Statuses" }, { value: "published", label: "Published" }, { value: "review", label: "In Review" }, { value: "draft", label: "Draft" }]}
          className="min-w-[140px]"
        />
      </div>

      {/* Cards Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(card => (
          <motion.div key={card.id} variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-3 group hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-200 relative overflow-hidden">
            {/* Top accent bar by system */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.system === "Cardiology" ? "from-emerald-400 to-emerald-600" : card.system === "Respiratory" ? "from-teal-400 to-teal-600" : card.system === "Neurology" ? "from-blue-400 to-blue-600" : "from-teal-500 to-emerald-500"}`} />

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${systemColors[card.system] || "bg-slate-50 text-slate-600 border-slate-200"}`}>{card.system}</span>
                  <StatusBadge variant={card.status} />
                  {card.isPremium && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Premium</span>}
                </div>
                <h3 className="font-serif text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">{card.title}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2">{card.subtitle}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{card.overview}</p>

            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <Lucide.ListChecks className="w-3.5 h-3.5" />
              <span>{(card.steps || []).length} steps</span>
              <span>·</span>
              <Lucide.Tag className="w-3.5 h-3.5" />
              <span>{(card.tags || []).slice(0, 2).join(", ")}{(card.tags || []).length > 2 ? ` +${(card.tags || []).length - 2}` : ""}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">{card.lastUpdated}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                <button onClick={() => setPreviewCard(card)} title="Preview" className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-all cursor-pointer border-none bg-transparent">
                  <Lucide.Eye className="w-3.5 h-3.5" />
                </button>
                {!isReadOnly && (
                  <>
                    <button onClick={() => openEdit(card)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent">
                      <Lucide.Edit className="w-3.5 h-3.5" />
                    </button>
                    {card.status === "draft" && (
                      <button onClick={() => updateStatus(card.id, "review")} title="Send to Review" className="p-1.5 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all cursor-pointer border-none bg-transparent">
                        <Lucide.ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {card.status === "review" && (
                      <button onClick={() => updateStatus(card.id, "published")} title="Publish" className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer border-none bg-transparent">
                        <Lucide.Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {card.status === "published" && (
                      <button onClick={() => updateStatus(card.id, "draft")} title="Revert to Draft" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent">
                        <Lucide.RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteCard(card.id)} title="Delete" className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer border-none bg-transparent">
                      <Lucide.Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <motion.div variants={itemVariants} className="col-span-full text-center py-16 text-slate-400 dark:text-slate-500 space-y-2">
            <Lucide.Layers className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-medium">No approach cards found.</p>
            {!isReadOnly && (
              <button onClick={openCreate} className="text-teal-600 text-xs font-semibold hover:underline cursor-pointer border-none bg-transparent">Create your first approach card →</button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ─── Create/Edit Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[70] flex items-start justify-center pt-6 px-4 pb-10 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm cursor-pointer"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-[#090d16] text-white flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold">{editingCard ? "Edit Approach Card" : "Create New Approach Card"}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Build a structured clinical approach with steps, key points, and red flags</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer border-none bg-transparent">
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Card Title *</label>
                      <input
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Approach to Chest Pain"
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Subtitle</label>
                      <input
                        value={form.subtitle}
                        onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                        placeholder="One-line description of this approach..."
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Body System</label>
                      <CustomSelect value={form.system} onChange={v => setForm(f => ({ ...f, system: v }))} options={SYSTEMS.map(s => ({ value: s, label: s }))} className="w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                      <input
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        placeholder="e.g. Acute Assessment, Chronic Management"
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Status</label>
                      <CustomSelect
                        value={form.status}
                        onChange={v => setForm(f => ({ ...f, status: v as any }))}
                        options={[{ value: "draft", label: "Draft" }, { value: "review", label: "In Review" }, { value: "published", label: "Published" }]}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Author</label>
                      <input
                        value={form.author}
                        onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Overview / Summary</label>
                    <textarea
                      rows={3}
                      value={form.overview}
                      onChange={e => setForm(f => ({ ...f, overview: e.target.value }))}
                      placeholder="Brief clinical overview of this approach..."
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200 resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.tags.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No tags selected yet.</span>
                      ) : (
                        form.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 dark:bg-teal-950/20 dark:text-teal-350 dark:border-teal-900/50 px-2.5 py-0.5 rounded-full shadow-sm">
                            {tag}
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}
                              className="text-teal-500 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-200 cursor-pointer border-none bg-transparent font-bold text-xs"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2 mb-2.5">
                      <input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (tagInput.trim()) {
                              handleAddTag(tagInput);
                            }
                          }
                        }}
                        placeholder="Type to search or add new tag..."
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tagInput.trim()) {
                            handleAddTag(tagInput);
                          }
                        }}
                        className="px-3 py-1.5 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition cursor-pointer border-none shadow-sm"
                      >Add</button>
                    </div>
                    
                    {/* Available tags list */}
                    <div className="mt-2">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                        {tagInput.trim() ? "Matching Database Tags" : "Database Tags (click to add)"}
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 medical-scroll">
                        {dbTags.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">No tags in database. Type above to add!</span>
                        ) : (
                          (() => {
                            const query = tagInput.trim().toLowerCase();
                            const filteredTags = query 
                              ? dbTags.filter(tag => tag.toLowerCase().includes(query))
                              : dbTags;
                              
                            if (filteredTags.length === 0) {
                              return (
                                <div className="w-full flex items-center justify-between py-0.5">
                                  <span className="text-[11px] text-slate-400 italic">No matching tags found.</span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddTag(tagInput)}
                                    className="px-2 py-0.5 text-[10px] font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800/60 transition cursor-pointer"
                                  >
                                    Create tag "{tagInput.trim()}"
                                  </button>
                                </div>
                              );
                            }
                            
                            return filteredTags.map(tag => {
                              const isAdded = form.tags.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  disabled={isAdded}
                                  onClick={() => {
                                    setForm(f => ({ ...f, tags: [...f.tags, tag] }));
                                  }}
                                  className={`px-2 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer select-none ${
                                    isAdded
                                      ? "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/50 cursor-not-allowed"
                                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/10 shadow-sm"
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            });
                          })()
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Premium toggle */}
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => setForm(f => ({ ...f, isPremium: !f.isPremium }))}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.isPremium ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.isPremium ? "translate-x-5" : ""}`} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Premium / Paid Only</span>
                  </label>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical Steps</h4>
                    <button
                      onClick={addStep}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 text-white text-xs font-bold rounded-lg hover:bg-teal-800 transition cursor-pointer border-none"
                    >
                      <Lucide.Plus className="w-3 h-3" /> Add Step
                    </button>
                  </div>

                  {form.steps.length === 0 && (
                    <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-xs">
                      No steps yet. Click "Add Step" to begin building the clinical approach.
                    </div>
                  )}

                  <Reorder.Group
                    axis="y"
                    values={form.steps}
                    onReorder={(newSteps) => setForm(f => ({ ...f, steps: newSteps }))}
                    className="space-y-3"
                  >
                    {form.steps.map((step, idx) => {
                      const style = getStepStyle(step.type);
                      const isOpen = activeStep === step.id;
                      return (
                        <Reorder.Item
                          key={step.id}
                          value={step}
                          className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 list-none select-none"
                        >
                          {/* Step header */}
                          <div
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                            onClick={() => setActiveStep(isOpen ? null : step.id)}
                          >
                            {/* Grip drag handle icon */}
                            <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing p-1 shrink-0">
                              <Lucide.GripVertical className="w-4 h-4" />
                            </div>
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{step.title || "Untitled Step"}</p>
                              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${style.color}`}>{style.icon} {style.label}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={e => { e.stopPropagation(); removeStep(step.id); }} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer border-none bg-transparent">
                                <Lucide.Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <Lucide.ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </div>
                          </div>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                                className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
                              >
                                <div className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2">
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Step Title</label>
                                      <input
                                        value={step.title}
                                        onChange={e => updateStep(step.id, { title: e.target.value })}
                                        placeholder="Step name..."
                                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Description</label>
                                      <textarea
                                        rows={2}
                                        value={step.description}
                                        onChange={e => updateStep(step.id, { description: e.target.value })}
                                        placeholder="Clinical description..."
                                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200 resize-none"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Step Type</label>
                                      <div className="flex flex-wrap gap-1.5">
                                        {STEP_TYPES.map(t => (
                                          <button
                                            key={t.value}
                                            onClick={() => updateStep(step.id, { type: t.value as any })}
                                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition cursor-pointer ${step.type === t.value ? t.color : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}
                                          >{t.icon} {t.label}</button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Checklist items */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Checklist Items</label>
                                    <div className="space-y-1 mb-2">
                                      {(step.checklistItems || []).map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 group">
                                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                          <span className="text-xs text-slate-700 dark:text-slate-300 flex-1">{item}</span>
                                          <button onClick={() => removeChecklistItem(step.id, i)} className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600 transition cursor-pointer border-none bg-transparent">
                                            <Lucide.X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <input
                                        value={stepItemInput[step.id] || ""}
                                        onChange={e => setStepItemInput(p => ({ ...p, [step.id]: e.target.value }))}
                                        onKeyDown={e => { if (e.key === "Enter") addChecklistItem(step.id); }}
                                        placeholder="Add checklist item... (Enter)"
                                        className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200"
                                      />
                                      <button onClick={() => addChecklistItem(step.id)} className="px-2.5 py-1.5 bg-teal-700 text-white text-xs rounded-lg hover:bg-teal-800 cursor-pointer border-none">+</button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                </div>

                {/* Key Points */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Key Clinical Points</h4>
                  <div className="space-y-1.5">
                    {form.keyPoints.map((kp, i) => (
                      <div key={i} className="flex items-start gap-2 group">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                        <span className="text-xs text-slate-700 dark:text-slate-300 flex-1">{kp}</span>
                        <button onClick={() => setForm(f => ({ ...f, keyPoints: f.keyPoints.filter((_, j) => j !== i) }))} className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600 transition cursor-pointer border-none bg-transparent">
                          <Lucide.X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={keyPointInput}
                      onChange={e => setKeyPointInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && keyPointInput.trim()) { setForm(f => ({ ...f, keyPoints: [...f.keyPoints, keyPointInput.trim()] })); setKeyPointInput(""); }}}
                      placeholder="Add key clinical point... (Enter)"
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200"
                    />
                    <button
                      onClick={() => { if (keyPointInput.trim()) { setForm(f => ({ ...f, keyPoints: [...f.keyPoints, keyPointInput.trim()] })); setKeyPointInput(""); }}}
                      className="px-3 py-1.5 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition cursor-pointer border-none"
                    >Add</button>
                  </div>
                </div>

                {/* Red Flags */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">Red Flags</h4>
                  <div className="space-y-1.5">
                    {form.redFlags.map((rf, i) => (
                      <div key={i} className="flex items-start gap-2 group">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-xs text-red-700 dark:text-red-400 flex-1">{rf}</span>
                        <button onClick={() => setForm(f => ({ ...f, redFlags: f.redFlags.filter((_, j) => j !== i) }))} className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600 transition cursor-pointer border-none bg-transparent">
                          <Lucide.X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={redFlagInput}
                      onChange={e => setRedFlagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && redFlagInput.trim()) { setForm(f => ({ ...f, redFlags: [...f.redFlags, redFlagInput.trim()] })); setRedFlagInput(""); }}}
                      placeholder="Add red flag warning... (Enter)"
                      className="flex-1 px-3 py-1.5 text-xs bg-red-50/50 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-800 dark:text-slate-200"
                    />
                    <button
                      onClick={() => { if (redFlagInput.trim()) { setForm(f => ({ ...f, redFlags: [...f.redFlags, redFlagInput.trim()] })); setRedFlagInput(""); }}}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition cursor-pointer border-none"
                    >Add</button>
                  </div>
                </div>

                {/* References */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">References</h4>
                  <div className="space-y-2">
                    {form.references.map((ref, i) => (
                      <div key={ref.id} className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 group">
                        <span className="text-[9px] font-bold text-teal-700 bg-teal-100 dark:bg-teal-950/30 w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-600 dark:text-slate-400">{ref.text}</p>
                          {ref.url && <p className="text-[10px] text-teal-600 truncate mt-0.5">{ref.url}</p>}
                        </div>
                        <button onClick={() => setForm(f => ({ ...f, references: f.references.filter(r => r.id !== ref.id) }))} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition cursor-pointer border-none bg-transparent">
                          <Lucide.Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={refInput.text}
                      onChange={e => setRefInput(p => ({ ...p, text: e.target.value }))}
                      placeholder="Reference citation text..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200 resize-none"
                    />
                    <div className="flex gap-2">
                      <input
                        value={refInput.url}
                        onChange={e => setRefInput(p => ({ ...p, url: e.target.value }))}
                        placeholder="URL (optional)"
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200"
                      />
                      <button
                        onClick={() => {
                          if (!refInput.text.trim()) return;
                          const nextId = form.references.length > 0 ? Math.max(...form.references.map(r => r.id)) + 1 : 1;
                          setForm(f => ({ ...f, references: [...f.references, { id: nextId, text: refInput.text.trim(), url: refInput.url.trim() || undefined }] }));
                          setRefInput({ text: "", url: "" });
                        }}
                        className="px-3 py-1.5 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition cursor-pointer border-none"
                      >Add</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer bg-transparent">
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setForm(f => ({ ...f, status: "draft" })); setTimeout(saveForm, 0); }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer bg-transparent"
                  >Save as Draft</button>
                  <button
                    onClick={saveForm}
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl shadow transition cursor-pointer border-none"
                  >{editingCard ? "Save Changes" : "Create Card"}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Preview Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {previewCard && (
          <div className="fixed inset-0 z-[70] flex items-start justify-center pt-8 px-4 pb-10 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
              onClick={() => setPreviewCard(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${systemColors[previewCard.system] || "bg-slate-700 text-slate-200 border-slate-600"}`}>{previewCard.system}</span>
                    <span className="text-[9px] font-bold text-slate-300 bg-slate-700/50 px-2 py-0.5 rounded-full border border-slate-600">{previewCard.category}</span>
                    <StatusBadge variant={previewCard.status} />
                  </div>
                  <h2 className="font-serif text-xl font-bold text-white">{previewCard.title}</h2>
                  <p className="text-sm text-slate-300 mt-1">{previewCard.subtitle}</p>
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400">
                    <span>{previewCard.author}</span>
                    <span>·</span>
                    <span>{previewCard.lastUpdated}</span>
                    <span>·</span>
                    <span>{(previewCard.steps || []).length} steps</span>
                  </div>
                </div>
                <button onClick={() => setPreviewCard(null)} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer border-none bg-transparent">
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
                {/* Overview */}
                <div className="p-4 bg-teal-50 dark:bg-teal-950/20 rounded-2xl border border-teal-100 dark:border-teal-900/30">
                  <p className="text-sm text-teal-800 dark:text-teal-300 leading-relaxed">{previewCard.overview}</p>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical Steps</h3>
                  {previewCard.steps.map((step, idx) => {
                    const style = getStepStyle(step.type);
                    return (
                      <div key={step.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold shrink-0">{idx + 1}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{step.title}</h4>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${style.color}`}>{style.icon}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
                          </div>
                        </div>
                        {(step.checklistItems || []).length > 0 && (
                          <div className="px-4 pb-4 pt-1 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                            {(step.checklistItems || []).map((item, i) => {
                              const ck = `${previewCard.id}-${step.id}-${i}`;
                              return (
                                <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
                                  <div
                                    onClick={() => setCheckedItems(p => ({ ...p, [ck]: !p[ck] }))}
                                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checkedItems[ck] ? "bg-teal-500 border-teal-500" : "border-slate-300 dark:border-slate-600 hover:border-teal-400"}`}
                                  >
                                    {checkedItems[ck] && <Lucide.Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className={`text-xs leading-relaxed transition-colors ${checkedItems[ck] ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-300"}`}>{item}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Key Points */}
                {(previewCard.keyPoints || []).length > 0 && (
                  <div className="p-4 bg-teal-50 dark:bg-teal-955/20 rounded-2xl border border-teal-100 dark:border-teal-900/30">
                    <h3 className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider mb-3">Key Points</h3>
                    <ul className="space-y-1.5">
                      {(previewCard.keyPoints || []).map((kp, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-teal-800 dark:text-teal-300">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                          {kp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Red Flags */}
                {(previewCard.redFlags || []).length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-955/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <h3 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3">Red Flags</h3>
                    <ul className="space-y-1.5">
                      {(previewCard.redFlags || []).map((rf, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          {rf}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {(previewCard.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(previewCard.tags || []).map(tag => (
                      <span key={tag} className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-xs text-slate-400">Preview · Read-only view</span>
                <button
                  onClick={() => { setPreviewCard(null); openEdit(previewCard); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white text-xs font-bold rounded-xl hover:bg-teal-800 transition cursor-pointer border-none"
                >
                  <Lucide.Edit className="w-3.5 h-3.5" /> Edit Card
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Approaches Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[80] flex items-start justify-center pt-8 px-4 pb-10 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm cursor-pointer"
              onClick={() => setShowUploadModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }}
              className={`relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col`}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#090d16] text-white">
                <div>
                  <h3 className="font-serif text-lg font-bold">Import Clinical Approaches</h3>
                  <p className="text-xs text-slate-400">Upload guidelines to extract structured clinical approach flows</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800 border-none bg-transparent cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Queue progress strip */}
                {uploadQueue.length > 1 && (uploadState === "uploading" || uploadState === "success") && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Lucide.Layers className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Document {Math.min(queueIdx + 1, uploadQueue.length)} of {uploadQueue.length}
                    </span>
                    <div className="flex gap-1 ml-auto">
                      {uploadQueue.map((_, i) => (
                        <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i < queueIdx ? "bg-teal-500" : i === queueIdx ? "bg-teal-400 animate-pulse" : "bg-slate-200 dark:bg-slate-700"}`} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Idle: file picker */}
                {uploadState === "idle" && (
                  <>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <span className="text-[11px] text-slate-450 dark:text-slate-400">Download clinical approach Word template:</span>
                      <a href="/templates/clinical_approach_template.docx" download className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-900 shadow transition flex items-center gap-1 shrink-0">
                        <Lucide.Download className="w-3 h-3 text-teal-400" />
                        Download Template
                      </a>
                    </div>

                    <div
                      onClick={() => uploadFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-400 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-50/10 transition-all flex flex-col items-center justify-center min-h-[160px]"
                    >
                      <input
                        type="file"
                        ref={uploadFileInputRef}
                        onChange={handleUploadFile}
                        accept=".docx,.pdf,.png,.jpg,.jpeg,.webp"
                        multiple
                        className="hidden"
                      />
                      <Lucide.Upload className="w-10 h-10 text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-355">Drag &amp; Drop DOCX, PDF, or Image here</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Click to choose files · Each will be previewed before saving</p>
                    </div>
                  </>
                )}

                {/* Uploading */}
                {uploadState === "uploading" && (
                  <div className="space-y-3">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50 dark:bg-slate-850/20 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <Lucide.Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{uploadedFileName}</span>
                        <span className="ml-auto text-teal-600 dark:text-teal-400 font-mono text-xs">{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 dark:bg-teal-400 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400">{uploadedFileSize} · Extracting clinical approach...</p>
                    </div>
                  </div>
                )}

                {/* Success: show extraction animation then card preview */}
                {uploadState === "success" && (
                  <div className="space-y-4">
                    {extractionState === "extracting" && (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50 dark:bg-slate-850/20 shadow-sm space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                          <span className="flex items-center gap-2">
                            <Lucide.Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                            {extractionLog}
                          </span>
                          <span className="font-mono text-teal-600 dark:text-teal-400">{extractionProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-600 dark:bg-teal-400 transition-all duration-300" style={{ width: `${extractionProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {extractionState === "success" && currentPreviewCard && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        {/* Card Preview */}
                        <div className="border border-teal-200 dark:border-teal-800/60 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                          {/* Preview Header */}
                          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-700/60 text-teal-200 border border-teal-600/40">{currentPreviewCard.system}</span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">{currentPreviewCard.category}</span>
                            </div>
                            <h4 className="font-serif text-base font-bold text-white">{currentPreviewCard.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{currentPreviewCard.subtitle}</p>
                          </div>

                          {/* Overview */}
                          <div className="px-5 pt-4 pb-2">
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">{currentPreviewCard.overview}</p>
                          </div>

                          {/* Steps preview (first 3) */}
                          {(currentPreviewCard.steps || []).length > 0 && (
                            <div className="px-5 pb-4 space-y-1.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                {(currentPreviewCard.steps || []).length} Clinical Steps
                              </p>
                              {(currentPreviewCard.steps || []).slice(0, 3).map((step: any, i: number) => (
                                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{step.title}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{step.description}</p>
                                  </div>
                                </div>
                              ))}
                              {(currentPreviewCard.steps || []).length > 3 && (
                                <p className="text-[10px] text-slate-400 text-center pt-1">+{(currentPreviewCard.steps || []).length - 3} more steps</p>
                              )}
                            </div>
                          )}

                          {/* Tags */}
                          {(currentPreviewCard.tags || []).length > 0 && (
                            <div className="px-5 pb-4 flex flex-wrap gap-1">
                              {(currentPreviewCard.tags || []).slice(0, 5).map((tag: string) => (
                                <span key={tag} className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Publish / Cancel / Skip */}
                        <div className="flex items-center justify-between gap-3 pt-1">
                          <button
                            onClick={handleCancelCurrent}
                            className="flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer bg-transparent"
                          >
                            <Lucide.X className="w-3.5 h-3.5" />
                            {queueIdx + 1 < uploadQueue.length ? "Skip to Next" : "Discard"}
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 hidden sm:block">Will be saved as draft</span>
                            <button
                              onClick={handlePublishCurrent}
                              className="flex items-center gap-1.5 px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer border-none"
                            >
                              <Lucide.Check className="w-3.5 h-3.5" />
                              {queueIdx + 1 < uploadQueue.length ? "Save & Next →" : "Save & Finish"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  restoreApproachCardFromDbAction,
  permanentlyDeleteApproachCardAction,
  syncApproachCardsToDbAction,
  getTagsFromDbAction,
  addTagToDbAction,
  toggleLibraryItemFreeStatus,
} from "@/actions/approach.actions";
import { useTaxonomy } from "@/lib/hooks/useTaxonomy";
import DuplicateConflictModal, { DuplicateConflictItem } from "@/components/admin/DuplicateConflictModal";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } } };

const STATIC_SYSTEMS = [
  "Cardiology",
  "Respiratory",
  "Endocrine",
  "Gastrointestinal",
  "Psychiatry",
  "Dermatology",
  "Women's Health",
  "Paediatrics",
  "Neurology",
  "Musculoskeletal",
  "MBS",
];
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
  Neurology: "bg-teal-50 text-teal-700 border-teal-200",
  Musculoskeletal: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
  const {
    isReadOnly,
    canCreateItem,
    canEditDraft,
    canArchiveItem,
    canRestoreItem,
    canToggleBilling,
    canViewUnpublished,
    canMoveToReview,
    canPublishItem,
    isOperationsManager,
    isDrafter,
    isPeerReviewer,
    isSubscriber,
    isSuperAdmin,
    currentAdmin,
  } = useAdminRole();
  const { units: taxonomyUnits } = useTaxonomy();
  const router = useRouter();
  const [cards, setCards] = useState<ApproachCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!canViewUnpublished && statusFilter !== "published") {
      setStatusFilter("published");
    }
  }, [canViewUnpublished, statusFilter]);

  // Union real home units from the DB (subjects table, via useTaxonomy) with whatever systems are
  // already used on existing cards and the static fallback list, so a newly created/imported home
  // unit shows up as a filter option immediately without needing a hardcoded entry.
  const SYSTEMS = Array.from(
    new Set([
      ...taxonomyUnits.map((u) => u.name),
      ...cards.map((c) => c.system).filter(Boolean),
      ...STATIC_SYSTEMS,
    ])
  ).sort((a, b) => a.localeCompare(b));
  // Modal states


  // Document Upload States
  interface ApproachUploadQueueItem {
    id: string;
    name: string;
    size: string;
    progress: number;
    status: "idle" | "uploading" | "extracting" | "success" | "error";
    error?: string;
    sourceFileUrl?: string;
    extractedCard?: any;
  }

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");
  const [approachUploadQueue, setApproachUploadQueue] = useState<ApproachUploadQueueItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  // New Creation Wizard States
  const [modalStep, setModalStep] = useState<"select" | "create" | "document">("select");
  const [newTitle, setNewTitle] = useState("");
  const [newSystem, setNewSystem] = useState("Cardiology");
  const [newCategory, setNewCategory] = useState("");
  const [newIsFree, setNewIsFree] = useState(false);

  const resetForm = () => {
    setNewTitle("");
    setNewSystem("Cardiology");
    setNewCategory("");
    setNewIsFree(false);
    setApproachUploadQueue([]);
    setModalStep("select");
  };

  const handleToggleFreeStatus = async (card: ApproachCard, isFree: boolean) => {
    if (!canToggleBilling) return;
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, isFree } : c))
    );
    const res = await toggleLibraryItemFreeStatus(card.id, isFree);
    if (!res.success) {
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, isFree: !isFree } : c))
      );
      alert(res.error || "Failed to update free status.");
    } else {
      addUserNotification(
        "Approach Status Updated",
        `"${card.title}" is now ${isFree ? "Free Access" : "Paid Only"}.`,
        1,
        "custom"
      );
    }
  };

  const handleCreateApproach = async () => {
    if (!canCreateItem) return;
    if (!newTitle.trim()) {
      alert("Please enter a title.");
      return;
    }
    setIsSaving(true);
    try {
      const newId = crypto.randomUUID();
      const targetCard: ApproachCard = {
        id: newId,
        title: newTitle.trim(),
        subtitle: "",
        system: newSystem,
        category: newCategory.trim() || "Clinical Reference",
        status: "published" as const,
        lastUpdated: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
        author: "GP Edge Admin",
        isPremium: false,
        isFree: newIsFree,
        tags: [newSystem, newCategory.trim() || "Clinical Reference"].filter(Boolean),
        overview: "",
        steps: [],
        keyPoints: [],
        redFlags: [],
        references: [],
        fullHtml: `<h2>Overview</h2><p>[Enter overview here]</p>`,
      };

      await saveApproachCardToDbAction(targetCard);

      const updated = [targetCard, ...cards];
      setCards(updated);
      saveApproachCards(updated);

      addUserNotification(
        "Approach Created",
        `Created approach "${newTitle}".`,
        1,
        "custom"
      );

      setShowUploadModal(false);
      resetForm();
      router.push(`/admin/content/editor?id=${newId}`);
    } catch (err: any) {
      alert(`Error creating approach: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canCreateItem) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newItems: ApproachUploadQueueItem[] = fileList.map((file, idx) => ({
      id: `approach-upload-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      progress: 5,
      status: "uploading",
    }));

    setApproachUploadQueue((prev) => [...prev, ...newItems]);
    setUploadState("uploading");

    // Process each file in parallel
    newItems.forEach((item, index) => {
      const originalFile = fileList[index];
      runApproachExtraction(item.id, originalFile);
    });

    if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
  };

  const runApproachExtraction = async (id: string, file: File) => {
    let currentProgress = 5;
    const progressTimer = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress >= 90) {
        clearInterval(progressTimer);
        currentProgress = 90;
      }
      setApproachUploadQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, progress: Math.min(95, Math.round(currentProgress)) } : item
        )
      );
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "approach");

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);
      const result = await res.json();

      if (result.success && result.type === "approach" && result.card) {
        let r2Url = "";
        try {
          r2Url = await uploadToR2(file, file.name, file.type);
        } catch (uploadErr) {
          console.error("Failed to upload copy to Cloudflare R2:", uploadErr);
        }

        setApproachUploadQueue((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "success",
                  progress: 100,
                  sourceFileUrl: r2Url,
                  extractedCard: {
                    ...result.card,
                    sourceFileUrl: r2Url,
                    title: result.card.title || file.name.replace(/\.[^/.]+$/, ""),
                    system: result.card.system || "Cardiology",
                    category: result.card.category || "Clinical Reference",
                  },
                }
              : item
          )
        );
      } else {
        setApproachUploadQueue((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "error",
                  progress: 100,
                  error: result.error || "Failed to extract clinical approach.",
                }
              : item
          )
        );
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setApproachUploadQueue((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "error",
                progress: 100,
                error: err.message || "Network error occurred.",
              }
            : item
        )
      );
    }
  };

  const updateQueueItemMetadata = (id: string, field: "title" | "system" | "category", value: string) => {
    setApproachUploadQueue((prev) =>
      prev.map((item) =>
        item.id === id && item.extractedCard
          ? {
              ...item,
              extractedCard: {
                ...item.extractedCard,
                [field]: value,
              },
            }
          : item
      )
    );
  };

  const removeQueueItem = (id: string) => {
    setApproachUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Duplicate Conflict States
  const [duplicateConflicts, setDuplicateConflicts] = useState<DuplicateConflictItem[]>([]);
  const [currentConflictIdx, setCurrentConflictIdx] = useState(0);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [resolvedChoices, setResolvedChoices] = useState<Record<string, "replace" | "keep_both" | "skip">>({});

  const handleConflictResolve = (
    action: "replace" | "keep_both" | "skip",
    conflict: DuplicateConflictItem
  ) => {
    const updatedChoices = { ...resolvedChoices, [conflict.queueItemId]: action };
    setResolvedChoices(updatedChoices);

    if (currentConflictIdx + 1 < duplicateConflicts.length) {
      setCurrentConflictIdx((prev) => prev + 1);
    } else {
      setShowConflictModal(false);
      executeSaveDocuments(updatedChoices);
    }
  };

  const handleConflictResolveAll = (action: "replace_all" | "keep_both_all") => {
    const act = action === "replace_all" ? "replace" : "keep_both";
    const updatedChoices = { ...resolvedChoices };
    for (const c of duplicateConflicts) {
      updatedChoices[c.queueItemId] = act;
    }
    setResolvedChoices(updatedChoices);
    setShowConflictModal(false);
    executeSaveDocuments(updatedChoices);
  };

  const handleSaveAllDocuments = async () => {
    if (!canCreateItem) return;
    const successItems = approachUploadQueue.filter((item) => item.status === "success" && item.extractedCard);
    if (successItems.length === 0) {
      alert("No successfully extracted documents to import.");
      return;
    }

    // Scan for duplicate conflicts by Title or Filename
    const conflicts: DuplicateConflictItem[] = [];
    for (const item of successItems) {
      const card = item.extractedCard!;
      const incomingTitle = (card.title || item.name || "").trim().toLowerCase();
      const cleanIncomingTitle = incomingTitle.replace(/\.(docx?|pdf|png|jpe?g)$/i, "").trim();

      const existing = cards.find((c) => {
        const existingTitle = (c.title || "").trim().toLowerCase();
        const cleanExistingTitle = existingTitle.replace(/\.(docx?|pdf|png|jpe?g)$/i, "").trim();
        return (
          existingTitle === incomingTitle ||
          cleanExistingTitle === cleanIncomingTitle ||
          (cleanIncomingTitle.length > 5 && cleanExistingTitle.startsWith(cleanIncomingTitle)) ||
          (cleanExistingTitle.length > 5 && cleanIncomingTitle.startsWith(cleanExistingTitle)) ||
          (cleanIncomingTitle.length > 6 && cleanExistingTitle.includes(cleanIncomingTitle))
        );
      });

      if (existing) {
        conflicts.push({
          queueItemId: item.id,
          incomingTitle: card.title || item.name,
          incomingSystem: card.system,
          incomingCategory: card.category,
          existingId: existing.id,
          existingTitle: existing.title,
          existingSystem: existing.system,
          existingCategory: existing.category,
          existingLastUpdated: existing.lastUpdated,
        });
      }
    }

    if (conflicts.length > 0) {
      setDuplicateConflicts(conflicts);
      setCurrentConflictIdx(0);
      setShowConflictModal(true);
      return;
    }

    // No conflicts, proceed directly
    executeSaveDocuments({});
  };

  const executeSaveDocuments = async (choices: Record<string, "replace" | "keep_both" | "skip">) => {
    const successItems = approachUploadQueue.filter((item) => item.status === "success" && item.extractedCard);
    if (successItems.length === 0) return;

    setIsSaving(true);
    let newCards = [...cards];

    try {
      for (const item of successItems) {
        const choice = choices[item.id] || "keep_both";
        if (choice === "skip") continue;

        const card = item.extractedCard!;
        const incomingTitle = (card.title || "").trim();
        const existing = newCards.find(
          (c) => c.title.trim().toLowerCase() === incomingTitle.toLowerCase()
        );

        if (choice === "replace" && existing) {
          // Replace existing in place
          const updatedCard = {
            ...existing,
            ...card,
            id: existing.id, // Preserve existing ID
            title: card.title || existing.title,
            lastUpdated: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
            status: "draft" as const,
          };

          newCards = [updatedCard, ...newCards.filter((c) => c.id !== existing.id)];
          await saveApproachCardToDbAction(updatedCard);

          addUserNotification(
            "Approach Updated",
            `Successfully updated and replaced "${updatedCard.title}" from template.`,
            1,
            "custom"
          );
        } else {
          // Keep both (Save as New)
          const isDuplicateTitle = !!existing;
          const finalTitle = isDuplicateTitle ? `${card.title || "Clinical Approach"} (Copy)` : (card.title || "Clinical Approach");
          const newId = crypto.randomUUID();

          const targetCard = {
            ...card,
            id: newId,
            title: finalTitle,
            lastUpdated: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
            status: "draft" as const,
          };

          newCards.unshift(targetCard);
          await saveApproachCardToDbAction(targetCard);

          addUserNotification(
            "Approach Imported",
            `Successfully imported "${targetCard.title}" from document template.`,
            1,
            "custom"
          );
        }
      }

      setCards(newCards);
      saveApproachCards(newCards);
      setShowUploadModal(false);
      setApproachUploadQueue([]);
      setUploadState("idle");
      setResolvedChoices({});
      setDuplicateConflicts([]);
    } catch (err: any) {
      alert(`Error importing clinical approaches: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // State variables for filter/search
  // (No previewCard/checkedItems states required)

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
    getApproachCardsFromDbAction(canRestoreItem).then(dbCards => {
      if (dbCards && dbCards.length > 0) {
        const sanitizedDb = dbCards.map(sanitize);
        setCards(sanitizedDb);
        saveApproachCards(sanitizedDb);
      } else if (sanitizedLocal.length > 0) {
        // Auto-migrate local storage data to database if DB is empty
      }
    });
  }, [canRestoreItem]);

  const filtered = useMemo(() => {
    return cards.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.system.toLowerCase().includes(q);
      const matchSystem = systemFilter === "all" || c.system === systemFilter;
      const matchStatus = statusFilter === "all" ? (c.status !== "archived") : (c.status === statusFilter);
      // R12: view unpublished item content is denied to SUB and read-only viewer roles.
      const matchVisibility = canViewUnpublished || c.status === "published";
      return matchSearch && matchSystem && matchStatus && matchVisibility;
    });
  }, [cards, searchQuery, systemFilter, statusFilter, canViewUnpublished]);

  // Multi-select bulk selection state for Archive view
  const [selectedApproachIds, setSelectedApproachIds] = useState<string[]>([]);
  const [bulkActionConfirm, setBulkActionConfirm] = useState<{ type: "restore" | "permanent_delete" | "archive"; ids: string[] } | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    setSelectedApproachIds([]);
  }, [searchQuery, systemFilter, statusFilter]);

  const toggleSelectApproach = (id: string) => {
    setSelectedApproachIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAllFiltered = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedApproachIds(e.target.checked ? filtered.map((c) => c.id) : []);
  };

  const handleBulkRestoreApproaches = async () => {
    if (!canRestoreItem || selectedApproachIds.length === 0) return;
    const targets = cards.filter((c) => selectedApproachIds.includes(c.id));
    setBulkProgress({ done: 0, total: targets.length });

    let successCount = 0;
    for (let i = 0; i < targets.length; i++) {
      const res = await restoreApproachCardFromDbAction(targets[i].id, currentAdmin);
      if (res.success) successCount++;
      setBulkProgress({ done: i + 1, total: targets.length });
    }
    const updated = cards.map((c) => (selectedApproachIds.includes(c.id) ? { ...c, status: "published" as const } : c));
    setCards(updated);
    saveApproachCards(updated);
    setSelectedApproachIds([]);
    setBulkProgress(null);
    setBulkActionConfirm(null);
    addUserNotification("Approaches Restored", `Successfully restored ${successCount} approach card(s).`, 1, "custom");
  };

  const handleBulkPermanentDeleteApproaches = async () => {
    if (!canRestoreItem || selectedApproachIds.length === 0) return;
    const targets = cards.filter((c) => selectedApproachIds.includes(c.id));
    setBulkProgress({ done: 0, total: targets.length });

    let successCount = 0;
    for (let i = 0; i < targets.length; i++) {
      const res = await permanentlyDeleteApproachCardAction(targets[i].id, currentAdmin);
      if (res.success) successCount++;
      setBulkProgress({ done: i + 1, total: targets.length });
    }
    const updated = cards.filter((c) => !selectedApproachIds.includes(c.id));
    setCards(updated);
    saveApproachCards(updated);
    setSelectedApproachIds([]);
    setBulkProgress(null);
    setBulkActionConfirm(null);
    addUserNotification("Approaches Permanently Deleted", `${successCount} approach card(s) purged from database.`, 1, "custom");
  };

  const handleBulkArchiveApproaches = async () => {
    if (!canArchiveItem || selectedApproachIds.length === 0) return;
    const targets = cards.filter((c) => selectedApproachIds.includes(c.id));
    setBulkProgress({ done: 0, total: targets.length });

    for (let i = 0; i < targets.length; i++) {
      await deleteApproachCardFromDbAction(targets[i].id, currentAdmin);
      setBulkProgress({ done: i + 1, total: targets.length });
    }
    const updated = cards.map((c) => (selectedApproachIds.includes(c.id) ? { ...c, status: "archived" as const } : c));
    setCards(updated);
    saveApproachCards(updated);
    const count = targets.length;
    setSelectedApproachIds([]);
    setBulkProgress(null);
    setBulkActionConfirm(null);
    addUserNotification("Approaches Archived", `Successfully archived ${count} approach card(s). Switch to "Archived" status filter to view or restore them.`, 1, "custom");
  };

  async function handlePublishApproach(card: ApproachCard) {
    if (!canPublishItem) return;
    if (isSuperAdmin ? (card.status !== "draft" && card.status !== "review") : card.status !== "review") return;
    const res = await saveApproachCardToDbAction({ ...card, status: "published" });
    if (!res.success) {
      alert(res.error || "Failed to publish approach card.");
      return;
    }
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: "published" as const } : c));
    setCards(updated);
    saveApproachCards(updated);
    addUserNotification("Approach Published", `"${card.title}" is now live.`, 1, "custom");
  }

  async function handleMoveApproachToReview(card: ApproachCard) {
    if (!canMoveToReview || card.status !== "draft") return;
    const res = await saveApproachCardToDbAction({ ...card, status: "review" });
    if (!res.success) {
      alert(res.error || "Failed to move approach card to review.");
      return;
    }
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: "review" as const } : c));
    setCards(updated);
    saveApproachCards(updated);
    addUserNotification("Approach Moved to Review", `"${card.title}" is now in review.`, 1, "custom");
  }

  async function handleRestoreApproach(card: ApproachCard) {
    if (!canRestoreItem) return;
    const res = await restoreApproachCardFromDbAction(card.id, currentAdmin);
    if (!res.success) {
      alert(res.error || "Failed to restore approach card.");
      return;
    }
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: "published" as const } : c));
    setCards(updated);
    saveApproachCards(updated);
    addUserNotification("Approach Restored", `Successfully restored "${card.title}" (SA-Only action).`, 1, "custom");
  }

  async function handlePermanentDeleteApproach(card: ApproachCard) {
    if (!canRestoreItem) return;
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${card.title}"? This action CANNOT be undone.`)) return;
    const res = await permanentlyDeleteApproachCardAction(card.id, currentAdmin);
    if (!res.success) {
      alert(res.error || "Failed to permanently delete approach card.");
      return;
    }
    const updated = cards.filter((c) => c.id !== card.id);
    setCards(updated);
    saveApproachCards(updated);
    addUserNotification("Approach Permanently Deleted", `"${card.title}" has been permanently purged from database.`, 1, "custom");
  }

  async function deleteCard(id: string) {
    if (!canArchiveItem) return;
    if (!confirm("Archive this approach card? Item will be hidden from production and retained in audit log.")) return;
    const updated = cards.map(c => c.id === id ? { ...c, status: "archived" as const } : c);
    setCards(updated);
    const targetCard = cards.find(c => c.id === id);
    addUserNotification("Approach Archived", `"${targetCard?.title || "Card"}" has been moved to Archived. Switch to "Archived" status filter to view or restore it.`, 1, "custom");
    
    // Soft-delete from Neon Postgres DB
    await deleteApproachCardFromDbAction(id, currentAdmin);
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Clinical Approaches"
        subtitle={`Create and manage structured clinical approach cards displayed in the medical library · ${cards.length} items`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => { if (!canCreateItem) return; resetForm(); setShowUploadModal(true); }}
              disabled={!canCreateItem}
              title={!canCreateItem ? "Item creation is a clinical act restricted to SA and CE roles only (3A matrix)" : "Add Approach"}
              className={`px-4 py-2.5 bg-teal-800 text-sm font-semibold text-white rounded-xl hover:bg-teal-900 transition-all shadow-sm flex items-center gap-2 shrink-0 ${!canCreateItem ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Lucide.Plus className="w-4 h-4" />
              Add Approach
            </button>
          </div>
        }
      />

      {!canCreateItem && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30 rounded-2xl flex gap-3 text-xs text-amber-850 dark:text-amber-300 leading-relaxed items-center shadow-sm"
        >
          <Lucide.ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-450" />
          <div>
            <p className="font-bold">Section 3A Relational Governance Mode</p>
            <p className="mt-0.5 opacity-90">
              {isOperationsManager
                ? "Operations Manager Mode — Item creation, direct content alteration, and attaching source references are restricted to SA/CE clinicians. You can assign, track, and move work through the pipeline."
                : isDrafter
                ? "Drafter Mode — Write/edit permissions are scoped to your assigned items. Item creation and post-review edits rest with SA/CE."
                : isPeerReviewer
                ? "Peer Reviewer Mode — Source reference attachment and review task completion enabled. Direct content creation is restricted."
                : "Subscriber Mode — Read-only access to published clinical content."}
            </p>
          </div>
        </motion.div>
      )}

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
          options={
            canViewUnpublished
              ? [
                  { value: "all", label: "Active Items" },
                  { value: "published", label: "Published" },
                  { value: "draft", label: "Draft" },
                  { value: "review", label: "In Review" },
                  ...(canRestoreItem ? [{ value: "archived", label: `Archived (${cards.filter((c) => c.status === "archived").length})` }] : []),
                ]
              : [{ value: "published", label: "Published" }]
          }
          className="min-w-[160px]"
        />
      </div>

      {/* Bulk Action Floating Toolbar — archived view offers Restore/Delete (amber, danger-toned);
          active views offer bulk Archive (teal, matching the project's primary brand theme) */}
      {statusFilter === "archived" && canRestoreItem && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-amber-900 dark:text-amber-200">
              <input
                type="checkbox"
                checked={filtered.length > 0 && selectedApproachIds.length === filtered.length}
                onChange={handleSelectAllFiltered}
                className="w-4 h-4 rounded border-amber-300 dark:border-amber-700 accent-teal-600 dark:accent-teal-500 cursor-pointer"
              />
              <span>Select All Archived Approaches ({selectedApproachIds.length} of {filtered.length} selected)</span>
            </label>
          </div>
          {selectedApproachIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkActionConfirm({ type: "restore", ids: selectedApproachIds })}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Lucide.RotateCcw className="w-3.5 h-3.5" />
                Restore Selected ({selectedApproachIds.length})
              </button>
              <button
                type="button"
                onClick={() => setBulkActionConfirm({ type: "permanent_delete", ids: selectedApproachIds })}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Lucide.Trash2 className="w-3.5 h-3.5" />
                Delete Selected Permanently ({selectedApproachIds.length})
              </button>
            </div>
          )}
        </motion.div>
      )}

      {statusFilter !== "archived" && canArchiveItem && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/40 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-teal-900 dark:text-teal-200">
              <input
                type="checkbox"
                checked={filtered.length > 0 && selectedApproachIds.length === filtered.length}
                onChange={handleSelectAllFiltered}
                className="w-4 h-4 rounded border-teal-300 dark:border-teal-700 accent-teal-600 dark:accent-teal-500 cursor-pointer"
              />
              <span>Select All ({selectedApproachIds.length} of {filtered.length} selected)</span>
            </label>
          </div>
          {selectedApproachIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkActionConfirm({ type: "archive", ids: selectedApproachIds })}
                className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Lucide.Archive className="w-3.5 h-3.5" />
                Archive Selected ({selectedApproachIds.length})
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Cards Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(card => (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border shadow-md shadow-slate-200/30 overflow-hidden relative group hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-300 cursor-pointer flex flex-col gap-3 p-5 ${selectedApproachIds.includes(card.id) ? "border-amber-300 dark:border-amber-700 ring-2 ring-amber-200/60 dark:ring-amber-900/40" : "border-teal-200/70 dark:border-teal-900/40"}`}
            onClick={() => router.push(`/admin/approaches/${card.id}`)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-slate-900/60 via-transparent to-slate-50/5 dark:to-teal-955/5 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-3 flex-1 justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {((card.status === "archived" && canRestoreItem) || (card.status !== "archived" && canArchiveItem)) && (
                      <input
                        type="checkbox"
                        checked={selectedApproachIds.includes(card.id)}
                        onChange={() => toggleSelectApproach(card.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-teal-600 dark:accent-teal-500 cursor-pointer"
                      />
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${systemColors[card.system] || "bg-slate-50 text-slate-600 border-slate-200"}`}>{card.system}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFreeStatus(card, !card.isFree);
                      }}
                      disabled={!canToggleBilling}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                        card.isFree
                          ? "bg-emerald-50 dark:bg-emerald-955/30 text-emerald-700 dark:text-emerald-400 border-emerald-200"
                          : "bg-amber-50 dark:bg-amber-955/30 text-amber-700 dark:text-amber-400 border-amber-200"
                      } ${!canToggleBilling ? "opacity-50 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}`}
                      title={!canToggleBilling ? "Billing status toggle is restricted to SA and OM roles" : (card.isFree ? "Free Access (Click to make Paid)" : "Paid Only (Click to make Free)")}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${card.isFree ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {card.isFree ? "Free" : "Paid"}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{card.lastUpdated}</span>
                </div>
                <h3 className="font-serif text-base text-slate-900 dark:text-slate-100 mb-1 leading-tight group-hover:text-slate-800 dark:group-hover:text-slate-350 transition-colors">{card.title}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{card.system} · {card.category}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Lucide.Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span className="truncate max-w-[120px]">
                        {(card.tags || []).slice(0, 2).join(", ")}{(card.tags || []).length > 2 ? ` +${(card.tags || []).length - 2}` : ""}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    {canEditDraft && card.status !== "archived" && (
                      <Link
                        href={`/admin/content/editor?id=${card.id}`}
                        onClick={(e) => e.stopPropagation()}
                        title="Edit Card"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                      >
                        <Lucide.Edit className="w-4 h-4" />
                      </Link>
                    )}
                    {canMoveToReview && card.status === "draft" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveApproachToReview(card); }}
                        title="Move to Review (SA/CE Only)"
                        className="px-2 py-1 rounded-lg text-amber-700 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 transition-all cursor-pointer border-none flex items-center justify-center gap-1 text-xs font-bold"
                      >
                        <Lucide.FileSearch className="w-3.5 h-3.5" />
                        Move to Review
                      </button>
                    )}
                    {canPublishItem && (isSuperAdmin ? (card.status === "draft" || card.status === "review") : card.status === "review") && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePublishApproach(card); }}
                        title={isSuperAdmin ? "Publish" : "Publish (only once card is In Review)"}
                        className="px-2 py-1 rounded-lg text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 transition-all cursor-pointer border-none flex items-center justify-center gap-1 text-xs font-bold"
                      >
                        <Lucide.CheckCircle2 className="w-3.5 h-3.5" />
                        Publish
                      </button>
                    )}
                    {card.status === "archived" && canRestoreItem && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestoreApproach(card); }}
                          title="Restore Archived Approach Card (SA Only)"
                          className="px-2 py-1 rounded-lg text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 transition-all cursor-pointer border-none flex items-center justify-center gap-1 text-xs font-bold"
                        >
                          <Lucide.RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePermanentDeleteApproach(card); }}
                          title="Permanently Delete (IRREVERSIBLE)"
                          className="px-2 py-1 rounded-lg text-red-700 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 transition-all cursor-pointer border-none flex items-center justify-center gap-1 text-xs font-bold"
                        >
                          <Lucide.Trash2 className="w-3.5 h-3.5" />
                          Delete Permanently
                        </button>
                      </div>
                    )}
                    {canArchiveItem && card.status !== "archived" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                        title="Archive Card"
                        className="p-1 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                      >
                        <Lucide.Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <motion.div variants={itemVariants} className="col-span-full text-center py-16 text-slate-400 dark:text-slate-500 space-y-2">
            <Lucide.Layers className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-medium">No approach cards found.</p>
            {canCreateItem && (
              <button onClick={() => { if (!canCreateItem) return; resetForm(); setShowUploadModal(true); }} className="text-teal-600 text-xs font-semibold hover:underline cursor-pointer border-none bg-transparent">Create your first approach card →</button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Upload/Create Approaches Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div key="approach-add-modal-container" className="fixed inset-0 z-[60] pointer-events-none">
            <motion.div
              key="approach-add-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto cursor-pointer"
              onClick={() => setShowUploadModal(false)}
            />
            <motion.div
              key="approach-add-modal-content"
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }}
              className={`fixed inset-x-4 top-[8%] mx-auto w-full ${
                modalStep === "create" ? "max-w-2xl" : "max-w-lg"
              } max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-y-auto flex flex-col pointer-events-auto`}
            >
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#090d16] text-white">
                <div>
                  <h3 className="font-serif text-lg font-bold">
                    {modalStep === "select" && "Add Clinical Approach"}
                    {modalStep === "create" && "Create Blank Approach"}
                    {modalStep === "document" && "Import Clinical Approaches"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalStep === "select" && "Create new directory elements, PDFs, or summaries"}
                    {modalStep === "create" && "Start with a blank document and write clinical approach flows in the full editor"}
                    {modalStep === "document" && "Upload guidelines to extract structured clinical approach flows"}
                  </p>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white transition bg-transparent border-none cursor-pointer">
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 flex-1">
                
                {/* STEP 1: Select Type */}
                {modalStep === "select" && (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Choose how to add approach</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* Option 1: Upload PDF / Word */}
                      <button
                        onClick={() => { setModalStep("document"); }}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all text-left flex items-start gap-4 group cursor-pointer bg-transparent"
                      >
                        <span className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl group-hover:scale-105 transition">
                          <Lucide.FileUp className="w-6 h-6 text-slate-600" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition">Upload PDF or Word Document</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Upload a clinical guideline or reference document (PDF or DOCX).</p>
                        </div>
                      </button>

                      {/* Option 2: Create New Content */}
                      <button
                        onClick={() => { setModalStep("create"); }}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all text-left flex items-start gap-4 group cursor-pointer bg-transparent"
                      >
                        <span className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl group-hover:scale-105 transition">
                          <Lucide.FilePlus2 className="w-6 h-6 text-slate-600" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition">Create Blank Approach</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Start with a blank document and write clinical approach flows in the full editor.</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2A: Create blank */}
                {modalStep === "create" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Approach Title</label>
                        <input type="text" placeholder="e.g. Approach to Chest Pain" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Body System</label>
                        <CustomSelect
                          value={newSystem}
                          onChange={setNewSystem}
                          options={SYSTEMS.map(sys => ({ value: sys, label: sys }))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Category / Area</label>
                      <input type="text" placeholder="e.g. Acute Assessment, Reference Care" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none pt-1">
                      <input
                        type="checkbox"
                        checked={newIsFree}
                        onChange={(e) => setNewIsFree(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      Mark as Free Access (visible to non-subscribers)
                    </label>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setModalStep("select")} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer bg-transparent font-sans">Back</button>
                      <button
                        onClick={handleCreateApproach}
                        disabled={isSaving}
                        className="px-5 py-2 bg-teal-800 text-white rounded-xl text-xs font-semibold hover:bg-teal-900 shadow transition-all flex items-center gap-1.5 cursor-pointer border-none font-sans"
                      >
                        {isSaving ? (
                          <>
                            <Lucide.Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Lucide.ArrowRight className="w-3.5 h-3.5" />
                            Open in Editor
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2B: Document Upload */}
                {modalStep === "document" && (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <span className="text-[11px] text-slate-455 dark:text-slate-400 font-sans">Download clinical approach Word template:</span>
                      <a href="/templates/clinical_approach_template.docx" download className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-900 shadow transition flex items-center gap-1 shrink-0">
                        <Lucide.Download className="w-3 h-3 text-teal-400" />
                        Download Template
                      </a>
                    </div>

                    <div
                      onClick={() => { if (isReadOnly) return; uploadFileInputRef.current?.click(); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (isReadOnly) return;
                        const files = e.dataTransfer.files;
                        if (files && files.length > 0 && uploadFileInputRef.current) {
                          const dt = new DataTransfer();
                          Array.from(files).forEach((f) => dt.items.add(f));
                          uploadFileInputRef.current.files = dt.files;
                          uploadFileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                      }}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-50/10 transition-all flex flex-col items-center justify-center gap-1.5 group"
                    >
                      <input
                        type="file"
                        ref={uploadFileInputRef}
                        onChange={handleUploadFile}
                        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.tiff,.webp"
                        multiple
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-2xl bg-teal-55 dark:bg-teal-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lucide.Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-355 font-sans">Drag &amp; Drop PDF, DOCX or Image files here</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Supports PDF, DOCX, DOC, PNG, JPG, TIFF, WebP · Multiple files supported</p>
                      </div>
                    </div>

                    {approachUploadQueue.length > 0 && (
                      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-sans">Upload Queue ({approachUploadQueue.length} files)</p>
                        {approachUploadQueue.map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-3 relative group">
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-sans">{item.name}</h5>
                                <p className="text-[10px] text-slate-400 font-semibold font-sans">{item.size}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {item.status === "uploading" && (
                                  <span className="text-[10px] font-bold text-teal-850 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                                    <Lucide.Loader2 className="w-3 h-3 animate-spin" /> Uploading
                                  </span>
                                )}
                                {item.status === "success" && (
                                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full font-sans">
                                    Extracted
                                  </span>
                                )}
                                {item.status === "error" && (
                                  <span className="text-[10px] font-bold text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full font-sans">
                                    Error
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeQueueItem(item.id)}
                                  className="p-1 rounded-lg text-slate-455 hover:text-red-500 hover:bg-red-55 dark:hover:bg-red-950/20 transition-all border-none bg-transparent cursor-pointer"
                                >
                                  <Lucide.Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {item.status === "uploading" && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-slate-405 dark:text-slate-400">
                                  <span className="font-sans">Extracting clinical approach...</span>
                                  <span className="font-mono text-teal-600 dark:text-teal-400">{item.progress}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${item.progress}%` }} />
                                </div>
                              </div>
                            )}

                            {item.status === "error" && (
                              <p className="text-[10px] font-semibold text-red-500 font-sans">{item.error || "Failed to extract clinical approach flow."}</p>
                            )}

                            {item.status === "success" && item.extractedCard && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/40">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 font-sans">Title</label>
                                  <input
                                    type="text"
                                    value={item.extractedCard.title || ""}
                                    onChange={(e) => updateQueueItemMetadata(item.id, "title", e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-700 font-sans"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 font-sans">Body System</label>
                                  <CustomSelect
                                    value={item.extractedCard.system || "Cardiology"}
                                    onChange={(val) => updateQueueItemMetadata(item.id, "system", val)}
                                    options={SYSTEMS.map((sys) => ({ value: sys, label: sys }))}
                                    triggerClassName="w-full flex items-center justify-between px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-700 transition-all font-medium font-sans"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 font-sans">Category</label>
                                  <input
                                    type="text"
                                    value={item.extractedCard.category || ""}
                                    onChange={(e) => updateQueueItemMetadata(item.id, "category", e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-700 font-sans"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setApproachUploadQueue([]);
                          setModalStep("select");
                        }}
                        disabled={isSaving || approachUploadQueue.some(item => item.status === "uploading")}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer bg-transparent font-sans"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAllDocuments}
                        disabled={isSaving || !approachUploadQueue.some(item => item.status === "success")}
                        className="px-4 py-2 bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 shadow border-none cursor-pointer flex items-center gap-1.5 transition-all font-sans"
                      >
                        {isSaving ? (
                          <>
                            <Lucide.Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...
                          </>
                        ) : (
                          `Import Approaches (${approachUploadQueue.filter(item => item.status === "success").length})`
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Restore / Archive / Permanent Delete Confirm Modal */}
      <AnimatePresence>
        {bulkActionConfirm && (() => {
          const meta =
            bulkActionConfirm.type === "restore"
              ? {
                  Icon: Lucide.RotateCcw,
                  title: "Restore Selected Approaches?",
                  verb: "restore",
                  handler: handleBulkRestoreApproaches,
                  confirmLabel: "Restore Approaches",
                  iconWrap: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400",
                  progressBar: "bg-emerald-500",
                  confirmBtn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
                }
              : bulkActionConfirm.type === "archive"
              ? {
                  Icon: Lucide.Archive,
                  title: "Archive Selected Approaches?",
                  verb: "archive",
                  handler: handleBulkArchiveApproaches,
                  confirmLabel: "Archive Approaches",
                  iconWrap: "bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 text-teal-600 dark:text-teal-400",
                  progressBar: "bg-teal-500",
                  confirmBtn: "bg-teal-700 hover:bg-teal-800 shadow-teal-700/20",
                }
              : {
                  Icon: Lucide.Trash2,
                  title: "Permanently Delete Selected Approaches?",
                  verb: "permanently delete",
                  handler: handleBulkPermanentDeleteApproaches,
                  confirmLabel: "Delete Permanently",
                  iconWrap: "bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400",
                  progressBar: "bg-rose-500",
                  confirmBtn: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20",
                };
          return (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
                onClick={() => setBulkActionConfirm(null)}
              />
              <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 16 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 text-center"
                >
                  <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${meta.iconWrap}`}>
                    <meta.Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{meta.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Are you sure you want to {meta.verb} <strong>{bulkActionConfirm.ids.length} selected approach card(s)</strong>?
                  </p>
                  {bulkActionConfirm.type === "permanent_delete" && !bulkProgress && (
                    <div className="mt-3 p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl text-left text-[11px] text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30">
                      <p className="font-semibold">⚠️ Danger Zone</p>
                      <p className="mt-0.5 opacity-90">This action is irreversible and will permanently purge all selected approach cards from the database.</p>
                    </div>
                  )}
                  {bulkProgress && (
                    <div className="mt-3 space-y-1.5">
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${meta.progressBar}`}
                          style={{ width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 font-medium">
                        Processing {bulkProgress.done} of {bulkProgress.total}…
                      </p>
                    </div>
                  )}
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setBulkActionConfirm(null)}
                      disabled={!!bulkProgress}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={meta.handler}
                      disabled={!!bulkProgress}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all cursor-pointer ${meta.confirmBtn}`}
                    >
                      {bulkProgress ? "Working…" : meta.confirmLabel}
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Duplicate Document Conflict Resolution Modal */}
      <DuplicateConflictModal
        isOpen={showConflictModal}
        conflicts={duplicateConflicts}
        currentIndex={currentConflictIdx}
        totalConflicts={duplicateConflicts.length}
        onResolve={handleConflictResolve}
        onResolveAll={handleConflictResolveAll}
        onCancel={() => {
          setShowConflictModal(false);
          setDuplicateConflicts([]);
        }}
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Archive,
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  HelpCircle,
  Layers,
  Sparkles,
  ExternalLink,
  Tag,
  BookOpen,
  CheckCircle2,
  Eye,
  Edit3,
  Plus,
  Upload,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import {
  fetchQuestions,
  Question,
  fetchAdminUsersFromDb,
  AdminUser,
  fetchMedicalContent,
  MedicalContent,
  ApproachCard,
  AutofillTemplate,
} from "@/lib/quizData";
import {
  getApproachCardsFromDbAction,
} from "@/actions/approach.actions";
import {
  fetchAutofillTemplatesFromDbAction,
} from "@/actions/autofill.actions";
import {
  TopicItem,
  TAXONOMY_VERSION,
  getUnitName,
  getGroupName,
  formatTopicCode,
} from "@/lib/taxonomyData";
import {
  moveTopicHomeUnitAction,
  getAllDatabaseTopicsAction,
  archiveTaxonomyTopicAction,
  deleteTaxonomyTopicAction,
  restoreTaxonomyTopicAction,
  updateTopicClassificationAction,
  registerOrUpdateTopicWithCodeAction,
  bulkImportTaxonomyTopicsAction,
  UnifiedTopicItem,
} from "@/actions/taxonomy.actions";
import {
  themeBadge,
  themeBadgePill,
  themeBadgeSm,
  themeBorder,
  themePanel,
  themeSurface,
  themeText,
  themeMuted,
  themeIconBtn,
} from "@/lib/adminTheme";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

type TabType = "all" | "taxonomy" | "questions" | "content" | "approaches" | "autofill" | "users";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Database / state collections
  const [questions, setQuestions] = useState<Question[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [contentList, setContentList] = useState<MedicalContent[]>([]);
  const [approachesList, setApproachesList] = useState<ApproachCard[]>([]);
  const [autofillList, setAutofillList] = useState<AutofillTemplate[]>([]);

  // Taxonomy & unified database topics filters
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>("all");
  const [selectedDepth, setSelectedDepth] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [taxonomyTopics, setTaxonomyTopics] = useState<UnifiedTopicItem[]>([]);
  const [topicTitlesList, setTopicTitlesList] = useState<string[]>([]);
  const [unitsList, setUnitsList] = useState<{ code: string; name: string; groups?: { code: string; name: string }[] }[]>([]);

  // Move Topic modal state
  const [moveTopicTarget, setMoveTopicTarget] = useState<TopicItem | null>(null);
  const [moveUnitCode, setMoveUnitCode] = useState<string>("");
  const [moveGroupCode, setMoveGroupCode] = useState<string>("");
  const [isMoving, setIsMoving] = useState(false);

  // Create Topic modal state
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [createTopicForm, setCreateTopicForm] = useState({
    label: "",
    homeUnit: "",
    topicType: "Clinical Condition",
    depth: "Core" as "Core" | "Working" | "Awareness",
    tags: "",
  });
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [createTopicError, setCreateTopicError] = useState<string | null>(null);

  // Edit Topic modal state
  const [editTopicTarget, setEditTopicTarget] = useState<UnifiedTopicItem | null>(null);
  const [editTopicForm, setEditTopicForm] = useState({
    label: "",
    topicType: "",
    depth: "Core" as "Core" | "Working" | "Awareness",
    tags: "",
  });
  const [isSavingEditTopic, setIsSavingEditTopic] = useState(false);
  const [editTopicError, setEditTopicError] = useState<string | null>(null);

  // Mass Upload (JSON) modal state
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<{
    importedCount: number;
    failedCount: number;
    errors: { label: string; error: string }[];
  } | null>(null);

  // Delete Topic modal state
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<UnifiedTopicItem | null>(null);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);

  // Pagination / Incremental "See More" (10 items each)
  const [visibleTopicsCount, setVisibleTopicsCount] = useState<number>(10);
  const [visibleQuestionsCount, setVisibleQuestionsCount] = useState<number>(10);
  const [visibleContentCount, setVisibleContentCount] = useState<number>(10);
  const [visibleApproachesCount, setVisibleApproachesCount] = useState<number>(10);
  const [visibleAutofillCount, setVisibleAutofillCount] = useState<number>(10);

  // Reset pagination when filters or query change
  useEffect(() => {
    setVisibleTopicsCount(10);
    setVisibleQuestionsCount(10);
    setVisibleContentCount(10);
    setVisibleApproachesCount(10);
    setVisibleAutofillCount(10);
  }, [selectedUnit, selectedTopicTitle, selectedDepth, selectedType, selectedTag, query, activeTab]);

  const loadTaxonomyTopics = async () => {
    const res = await getAllDatabaseTopicsAction();
    if (res.success && res.topics && res.topics.length > 0) {
      setTaxonomyTopics(res.topics);
      setTopicTitlesList(res.topicTitles);
      if (res.units && res.units.length > 0) {
        setUnitsList(res.units);
      }
    }
    return res;
  };

  useEffect(() => {
    let isMounted = true;
    fetchQuestions(true).then((qs) => { if (isMounted) setQuestions(qs); });
    fetchAdminUsersFromDb().then((users) => { if (isMounted) setUsersList(users); });
    fetchMedicalContent(true).then((content) => { if (isMounted) setContentList(content); });
    getApproachCardsFromDbAction(true).then((approaches) => { if (isMounted) setApproachesList(approaches); });
    fetchAutofillTemplatesFromDbAction(true).then((templates) => { if (isMounted) setAutofillList(templates); });

    // Fetch all unified topics and titles from PostgreSQL
    loadTaxonomyTopics();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenCreateTopicModal = () => {
    setCreateTopicError(null);
    setCreateTopicForm({ label: "", homeUnit: unitsList[0]?.code || "", topicType: "Clinical Condition", depth: "Core", tags: "" });
    setShowCreateTopicModal(true);
  };

  const handleCreateTopic = async () => {
    if (!createTopicForm.label.trim()) {
      setCreateTopicError("Topic label is required");
      return;
    }
    setIsCreatingTopic(true);
    setCreateTopicError(null);
    try {
      const res = await registerOrUpdateTopicWithCodeAction({
        label: createTopicForm.label.trim(),
        homeUnit: createTopicForm.homeUnit || undefined,
        topicType: createTopicForm.topicType,
        depth: createTopicForm.depth,
        tags: createTopicForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      if (res.success) {
        setShowCreateTopicModal(false);
        await loadTaxonomyTopics();
      } else {
        setCreateTopicError(res.error || "Failed to create topic");
      }
    } catch (err: any) {
      setCreateTopicError(err.message);
    } finally {
      setIsCreatingTopic(false);
    }
  };

  const handleOpenEditModal = (topic: UnifiedTopicItem) => {
    setEditTopicError(null);
    setEditTopicTarget(topic);
    setEditTopicForm({
      label: topic.label,
      topicType: topic.topicType,
      depth: (topic.depth as "Core" | "Working" | "Awareness") || "Core",
      tags: (topic.crossCuttingTags || []).join(", "),
    });
  };

  const handleSaveEditTopic = async () => {
    if (!editTopicTarget) return;
    if (!editTopicForm.label.trim()) {
      setEditTopicError("Topic label is required");
      return;
    }
    setIsSavingEditTopic(true);
    setEditTopicError(null);
    try {
      const res = await updateTopicClassificationAction(editTopicTarget.code, {
        label: editTopicForm.label.trim(),
        topicType: editTopicForm.topicType,
        depth: editTopicForm.depth,
        crossCuttingTags: editTopicForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      if (res.success) {
        setEditTopicTarget(null);
        await loadTaxonomyTopics();
      } else {
        setEditTopicError(res.error || "Failed to update topic");
      }
    } catch (err: any) {
      setEditTopicError(err.message);
    } finally {
      setIsSavingEditTopic(false);
    }
  };

  const handleBulkUploadFile = async (file: File) => {
    setIsBulkUploading(true);
    setBulkUploadResult(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : parsed?.topics;
      if (!Array.isArray(items)) {
        setBulkUploadResult({ importedCount: 0, failedCount: 1, errors: [{ label: "", error: "JSON must be an array of topics (or { \"topics\": [...] })" }] });
        return;
      }
      const res = await bulkImportTaxonomyTopicsAction(
        items.map((it: any) => ({
          label: it.label ?? it.name ?? "",
          homeUnit: it.homeUnit ?? it.home_unit ?? it.unit,
          topicType: it.topicType ?? it.topic_type,
          depth: it.depth,
          tags: Array.isArray(it.tags) ? it.tags : typeof it.tags === "string" ? it.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : undefined,
          variants: Array.isArray(it.variants) ? it.variants : undefined,
        }))
      );
      setBulkUploadResult({ importedCount: res.importedCount, failedCount: res.failedCount, errors: res.errors });
      if (res.importedCount > 0) {
        await loadTaxonomyTopics();
      }
    } catch (err: any) {
      setBulkUploadResult({ importedCount: 0, failedCount: 1, errors: [{ label: "", error: `Invalid JSON file: ${err.message}` }] });
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleOpenMoveModal = (topic: TopicItem) => {
    setMoveTopicTarget(topic);
    setMoveUnitCode(topic.homeUnit);
    setMoveGroupCode(topic.group || "");
  };

  const handleSaveMoveTopic = async () => {
    if (!moveTopicTarget) return;
    setIsMoving(true);
    try {
      const res = await moveTopicHomeUnitAction(moveTopicTarget.code, moveUnitCode, moveGroupCode || null);
      if (res.success) {
        setTaxonomyTopics((prev) =>
          prev.map((t) =>
            t.code === moveTopicTarget.code ? { ...t, homeUnit: moveUnitCode, group: moveGroupCode || null } : t
          )
        );
        setMoveTopicTarget(null);
      } else {
        alert(`Failed to move topic: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsMoving(false);
    }
  };

  const handleArchiveTopic = async (topic: UnifiedTopicItem) => {
    if (!confirm(`Are you sure you want to archive "${topic.label}" (${topic.code})? It will be hidden from active taxonomy views.`)) return;
    const res = await archiveTaxonomyTopicAction(topic.code);
    if (res.success) {
      setTaxonomyTopics((prev) =>
        prev.map((t) => (t.code === topic.code ? { ...t, status: "archived" } : t))
      );
    } else {
      alert(`Failed to archive topic: ${res.error}`);
    }
  };

  const handleRestoreTopic = async (topic: UnifiedTopicItem) => {
    const res = await restoreTaxonomyTopicAction(topic.code);
    if (res.success) {
      setTaxonomyTopics((prev) =>
        prev.map((t) => (t.code === topic.code ? { ...t, status: "active" } : t))
      );
    } else {
      alert(`Failed to restore topic: ${res.error}`);
    }
  };

  const handleExecuteDeleteTopic = async () => {
    if (!deleteTopicTarget) return;
    setIsDeletingTopic(true);
    try {
      const res = await deleteTaxonomyTopicAction(deleteTopicTarget.code);
      if (res.success) {
        setTaxonomyTopics((prev) => prev.filter((t) => t.code !== deleteTopicTarget.code));
        setDeleteTopicTarget(null);
      } else {
        alert(`Failed to permanently delete topic: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeletingTopic(false);
    }
  };

  // Filter taxonomy topics
  const filteredTaxonomy = useMemo(() => {
    let list = taxonomyTopics.filter((t) => !t.label.includes("[Enter") && !t.code.toLowerCase().includes("enter-"));

    if (selectedUnit && selectedUnit !== "all") {
      list = list.filter(
        (t) =>
          t.homeUnit === selectedUnit ||
          (t.crossRefs && t.crossRefs.includes(selectedUnit))
      );
    }

    if (selectedTopicTitle && selectedTopicTitle !== "all") {
      list = list.filter((t) => t.label === selectedTopicTitle);
    }

    if (selectedDepth && selectedDepth !== "all") {
      list = list.filter((t) => t.depth === selectedDepth);
    }

    if (selectedType && selectedType !== "all") {
      const filter = selectedType.toLowerCase();
      list = list.filter((t) => t.topicType.toLowerCase().includes(filter));
    }

    if (selectedTag && selectedTag !== "all") {
      list = list.filter(
        (t) =>
          (t.crossCuttingTags && t.crossCuttingTags.includes(selectedTag)) ||
          (t.source && t.source === selectedTag)
      );
    }

    if (query && query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.label.toLowerCase().includes(q) ||
          (t.group && t.group.toLowerCase().includes(q)) ||
          (t.homeUnitName && t.homeUnitName.toLowerCase().includes(q)) ||
          (t.variants && t.variants.some((v) => v.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [taxonomyTopics, selectedUnit, selectedTopicTitle, selectedDepth, selectedType, selectedTag, query]);

  // Filter Questions
  const filteredQuestions = useMemo(() => {
    let list = questions;

    if (selectedUnit && selectedUnit !== "all") {
      list = list.filter((q) => {
        const t = (q.topic || "").toLowerCase();
        const u = selectedUnit.toLowerCase();
        return t.includes(u) || (q.subject && q.subject.toLowerCase().includes(u));
      });
    }

    if (selectedType && selectedType !== "all") {
      if (selectedType === "AKT" || selectedType === "KFP") {
        list = list.filter((q) => (q.examType || "AKT").toUpperCase() === selectedType);
      }
    }

    if (selectedDepth && selectedDepth !== "all") {
      list = list.filter((q) => q.difficulty.toLowerCase() === selectedDepth.toLowerCase());
    }

    if (query && query.trim().length > 0) {
      const qLower = query.trim().toLowerCase();
      list = list.filter(
        (q) =>
          (q.text && q.text.toLowerCase().includes(qLower)) ||
          q.id.toString().includes(qLower) ||
          (q.dbId && q.dbId.toLowerCase().includes(qLower)) ||
          (q.uqid && q.uqid.toLowerCase().includes(qLower)) ||
          (q.stem && q.stem.toLowerCase().includes(qLower)) ||
          (q.leadIn && q.leadIn.toLowerCase().includes(qLower)) ||
          (q.topic && q.topic.toLowerCase().includes(qLower)) ||
          (Array.isArray(q.tags) && q.tags.some((t) => t.toLowerCase().includes(qLower))) ||
          (Array.isArray(q.options) && q.options.some((opt) => opt.toLowerCase().includes(qLower))) ||
          (q.whyCorrect && q.whyCorrect.toLowerCase().includes(qLower)) ||
          (q.pearl && q.pearl.toLowerCase().includes(qLower)) ||
          (q.knowledgeBank && q.knowledgeBank.toLowerCase().includes(qLower))
      );
    }

    return list;
  }, [questions, selectedUnit, selectedType, selectedDepth, query]);

  // Filter Medical Content
  const filteredContent = useMemo(() => {
    let list = contentList;

    if (selectedUnit && selectedUnit !== "all") {
      list = list.filter((c) => {
        const sys = (c.system || "").toLowerCase();
        return sys.includes(selectedUnit.toLowerCase());
      });
    }

    if (selectedType && selectedType !== "all") {
      list = list.filter((c) => c.type.toLowerCase().includes(selectedType.toLowerCase()));
    }

    if (query && query.trim().length > 0) {
      const qLower = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(qLower)) ||
          (c.system && c.system.toLowerCase().includes(qLower)) ||
          (c.category && c.category.toLowerCase().includes(qLower)) ||
          (c.type && c.type.toLowerCase().includes(qLower)) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(qLower)))
      );
    }

    return list;
  }, [contentList, selectedUnit, selectedType, query]);

  // Filter Approaches
  const filteredApproaches = useMemo(() => {
    let list = approachesList;

    if (selectedUnit && selectedUnit !== "all") {
      list = list.filter((a) => (a.system || "").toLowerCase().includes(selectedUnit.toLowerCase()));
    }

    if (query && query.trim().length > 0) {
      const qLower = query.trim().toLowerCase();
      list = list.filter(
        (a) =>
          (a.title && a.title.toLowerCase().includes(qLower)) ||
          (a.subtitle && a.subtitle.toLowerCase().includes(qLower)) ||
          (a.system && a.system.toLowerCase().includes(qLower)) ||
          (a.category && a.category.toLowerCase().includes(qLower)) ||
          (a.overview && a.overview.toLowerCase().includes(qLower)) ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes(qLower))) ||
          (a.steps && a.steps.some((s) => s.title.toLowerCase().includes(qLower) || s.description.toLowerCase().includes(qLower)))
      );
    }

    return list;
  }, [approachesList, selectedUnit, query]);

  // Filter Autofill Templates
  const filteredAutofill = useMemo(() => {
    let list = autofillList;

    if (selectedUnit && selectedUnit !== "all") {
      list = list.filter((t) => (t.system || "").toLowerCase().includes(selectedUnit.toLowerCase()));
    }

    if (query && query.trim().length > 0) {
      const qLower = query.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.name && t.name.toLowerCase().includes(qLower)) ||
          (t.system && t.system.toLowerCase().includes(qLower)) ||
          (t.category && t.category.toLowerCase().includes(qLower))
      );
    }

    return list;
  }, [autofillList, selectedUnit, query]);

  // Filter Users
  const filteredUsers = useMemo(() => {
    if (!query || query.trim().length === 0) return usersList;
    const qLower = query.trim().toLowerCase();
    return usersList.filter(
      (u) =>
        u.name.toLowerCase().includes(qLower) ||
        u.email.toLowerCase().includes(qLower) ||
        (u.plan && u.plan.toLowerCase().includes(qLower)) ||
        (u.status && u.status.toLowerCase().includes(qLower))
    );
  }, [usersList, query]);

  // Dynamically collect all tags from database topics
  const availableTags = useMemo(() => {
    const set = new Set<string>(["atsi-relevant", "emergency", "approach", "question-bank", "autofill"]);
    taxonomyTopics.forEach((t) => {
      t.crossCuttingTags?.forEach((tag) => { if (tag) set.add(tag); });
      t.variants?.forEach((v) => {
        if (v && v.length < 25 && !v.startsWith("T") && !v.startsWith("MC-") && !v.startsWith("AF-") && !v.startsWith("TAG-")) {
          set.add(v);
        }
      });
    });
    return Array.from(set).sort();
  }, [taxonomyTopics]);

  // Compute live metrics across all database topics
  const metrics = useMemo(() => {
    const depthCounts = { Core: 0, Working: 0, Awareness: 0 };
    const typeCounts: Record<string, number> = {};
    const statusCounts = { active: 0, merged: 0 };
    const tagCounts: Record<string, number> = {};

    taxonomyTopics.forEach((t) => {
      if (t.depth in depthCounts) depthCounts[t.depth]++;
      if (t.status in statusCounts) statusCounts[t.status as keyof typeof statusCounts]++;

      const type = t.topicType || "Clinical Condition";
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      if (t.crossCuttingTags) {
        t.crossCuttingTags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return {
      totalTopics: taxonomyTopics.length,
      totalUnits: unitsList.length,
      depthCounts,
      typeCounts,
      statusCounts,
      tagCounts,
      version: TAXONOMY_VERSION,
    };
  }, [taxonomyTopics, unitsList]);

  const selectedUnitObj = unitsList.find((u) => u.code === moveUnitCode);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Search &"
        highlightedText="Feature Explorer"
        subtitle="Global search across Topics, Questions, Medical Content, Clinical Approaches, Autofill Templates, and Users"
        variants={itemVariants}
      />

      {/* Global Search Bar */}
      <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-slate-800/80 p-6 shadow-md shadow-slate-200/10 dark:shadow-slate-950/40 relative overflow-hidden">
        <div className="relative mb-4">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600/70 dark:text-teal-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search across Topics (T0142), Questions (UQID/Stem), Medical Content, Approaches, Autofills, Users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-sm bg-teal-50/20 dark:bg-slate-800/80 border border-teal-200/70 dark:border-teal-900/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm"
          />
        </div>

        {/* Global Search Results Navigation */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          {[
            { id: "all", label: "All Overview", count: filteredTaxonomy.length + filteredQuestions.length + filteredContent.length + filteredApproaches.length + filteredAutofill.length + filteredUsers.length },
            { id: "taxonomy", label: "Taxonomy Topics", count: filteredTaxonomy.length },
            { id: "questions", label: "Questions", count: filteredQuestions.length },
            { id: "content", label: "Medical Content", count: filteredContent.length },
            { id: "approaches", label: "Clinical Approaches", count: filteredApproaches.length },
            { id: "autofill", label: "Autofill Templates", count: filteredAutofill.length },
            { id: "users", label: "Users", count: filteredUsers.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800 shadow-sm"
                  : "bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Feature & Classification Audit Banner (Clickable to switch tab) */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveTab("taxonomy")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
            activeTab === "taxonomy"
              ? "bg-teal-50/80 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700 ring-2 ring-teal-500/20"
              : "bg-white/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-800 hover:border-teal-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Units</p>
            <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-1">{metrics.totalUnits} Units</p>
          <p className="text-[10px] text-slate-400">U01 to U37</p>
        </button>

        <button
          onClick={() => setActiveTab("taxonomy")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
            activeTab === "taxonomy"
              ? "bg-teal-50/80 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700 ring-2 ring-teal-500/20"
              : "bg-white/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-800 hover:border-slate-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Topics</p>
            <Tag className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{metrics.totalTopics}</p>
          <p className="text-[10px] text-slate-400">T0001+ Codes</p>
        </button>

        <button
          onClick={() => setActiveTab("questions")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
            activeTab === "questions"
              ? "bg-teal-100/70 dark:bg-teal-950/60 border-teal-500 dark:border-teal-600 ring-2 ring-teal-500/20"
              : "bg-teal-50/50 dark:bg-teal-950/20 border-teal-200/40 dark:border-teal-900/30 hover:border-teal-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">Questions</p>
            <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-lg font-bold text-teal-700 dark:text-teal-300 mt-1">{questions.length}</p>
          <p className="text-[10px] text-teal-600 dark:text-teal-400">AKT & KFP</p>
        </button>

        <button
          onClick={() => setActiveTab("content")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
            activeTab === "content"
              ? "bg-blue-100/70 dark:bg-blue-950/60 border-blue-500 dark:border-blue-600 ring-2 ring-blue-500/20"
              : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/40 dark:border-blue-900/30 hover:border-blue-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Library Content</p>
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-1">{contentList.length}</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400">Conditions & Guidelines</p>
        </button>

        <button
          onClick={() => setActiveTab("approaches")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
            activeTab === "approaches"
              ? "bg-purple-100/70 dark:bg-purple-950/60 border-purple-500 dark:border-purple-600 ring-2 ring-purple-500/20"
              : "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/40 dark:border-purple-900/30 hover:border-purple-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">Approaches</p>
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-lg font-bold text-purple-700 dark:text-purple-300 mt-1">{approachesList.length}</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400">Decision Trees</p>
        </button>

        <button
          onClick={() => setActiveTab("autofill")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
            activeTab === "autofill"
              ? "bg-amber-100/70 dark:bg-amber-950/60 border-amber-500 dark:border-amber-600 ring-2 ring-amber-500/20"
              : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/40 dark:border-amber-900/30 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Autofill</p>
            <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-1">{autofillList.length}</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400">Note Templates</p>
        </button>
      </motion.div>

      {/* FILTER BAR FOR TOPICS & CONTENT */}
      <motion.div variants={itemVariants} className="relative z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-center">
          {/* Unit Dropdown */}
          <CustomSelect
            value={selectedUnit}
            onChange={setSelectedUnit}
            options={[
              { value: "all", label: `All Units (${unitsList.length})` },
              ...unitsList.map((u) => ({
                value: u.code,
                label: `${u.code}: ${u.name}`,
              })),
            ]}
            className="w-full"
          />

          {/* Topic Title Dropdown */}
          <CustomSelect
            value={selectedTopicTitle}
            onChange={setSelectedTopicTitle}
            options={[
              { value: "all", label: `All Topic Titles (${topicTitlesList.length || taxonomyTopics.length})` },
              ...topicTitlesList.map((title) => ({
                value: title,
                label: title,
              })),
            ]}
            className="w-full"
          />

          {/* Depth Tier / Difficulty Dropdown */}
          <CustomSelect
            value={selectedDepth}
            onChange={setSelectedDepth}
            options={[
              { value: "all", label: "All Depth / Difficulty" },
              { value: "Core", label: "Core / Easy" },
              { value: "Working", label: "Working / Medium" },
              { value: "Awareness", label: "Awareness / Hard" },
            ]}
            className="w-full"
          />

          {/* Format / Type Dropdown */}
          <CustomSelect
            value={selectedType}
            onChange={setSelectedType}
            options={[
              { value: "all", label: "All Formats / Types" },
              { value: "AKT", label: "AKT Questions" },
              { value: "KFP", label: "KFP Questions" },
              { value: "Approach", label: "Clinical Approaches" },
              { value: "Condition", label: "Clinical Conditions" },
              { value: "Guideline", label: "Guidelines & Protocols" },
              { value: "Autofill", label: "Autofill Templates" },
            ]}
            className="w-full"
          />

          {/* Tag Dropdown */}
          <CustomSelect
            value={selectedTag}
            onChange={setSelectedTag}
            options={[
              { value: "all", label: "All Cross-Cutting Tags" },
              ...availableTags.map((tag) => ({
                value: tag,
                label: tag,
              })),
            ]}
            className="w-full"
          />
        </div>

        {(selectedUnit !== "all" || selectedTopicTitle !== "all" || selectedDepth !== "all" || selectedType !== "all" || selectedTag !== "all" || query) && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/50 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Active filters applied across taxonomy and features
            </span>
            <button
              onClick={() => {
                setSelectedUnit("all");
                setSelectedTopicTitle("all");
                setSelectedDepth("all");
                setSelectedType("all");
                setSelectedTag("all");
                setQuery("");
              }}
              className="px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 rounded-lg border border-teal-200/60 dark:border-teal-900/50 transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </motion.div>

      {/* 1. MASTER TAXONOMY TOPICS SECTION */}
      {(activeTab === "all" || activeTab === "taxonomy") && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-600" />
                <span>Master Taxonomy & Topic Codes</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 font-mono font-bold">
                  v{TAXONOMY_VERSION}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Permanent topic codes (T0001+). Links questions, clinical guidelines, and approaches to master RACGP units.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                {filteredTaxonomy.length} topics matching
              </span>
              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Mass upload topics from a JSON file"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload JSON
              </button>
              <button
                onClick={handleOpenCreateTopicModal}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Create a new topic"
              >
                <Plus className="w-3.5 h-3.5" />
                New Topic
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 w-28">topicCode</th>
                  <th className="p-3">Label / Topic Title</th>
                  <th className="p-3 w-44">homeUnit.group</th>
                  <th className="p-3 w-28">crossRefUnits</th>
                  <th className="p-3 w-28">depthTier</th>
                  <th className="p-3 w-36">topicType & Source</th>
                  <th className="p-3 w-32">crossCuttingTags</th>
                  <th className="p-3 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {filteredTaxonomy.slice(0, visibleTopicsCount).map((t) => {
                  const grpName = getGroupName(t.homeUnit, t.group);
                  const displayUnitName = t.homeUnitName || getUnitName(t.homeUnit);
                  return (
                    <tr key={`${t.code}-${t.label}`} className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-all">
                      <td className="p-3">
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200/50 dark:border-teal-900/40">
                          {formatTopicCode(t.code)}
                        </span>
                      </td>

                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{t.label}</div>
                        {t.variants && t.variants.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Variants: {t.variants.join(", ")}
                          </div>
                        )}
                        {t.status === "merged" && t.mergedInto && t.mergedInto.length > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded ml-1">
                            Merged → {t.mergedInto.join(", ")}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">{t.homeUnit} ({displayUnitName})</div>
                        {t.group && <div className="text-[10px] text-slate-400 truncate">{t.group} {grpName ? `· ${grpName}` : ""}</div>}
                      </td>

                      <td className="p-3">
                        {t.crossRefs && t.crossRefs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {t.crossRefs.map((u) => (
                              <span key={u} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                {u}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.depth === "Core"
                              ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800"
                              : t.depth === "Working"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800"
                              : "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800"
                          }`}
                        >
                          {t.depth}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{t.topicType}</span>
                          {t.source && t.source !== "taxonomy" && (
                            <span className="inline-block text-[9px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200/40 dark:border-teal-900/30 w-fit capitalize">
                              {t.source === "question" ? `Question (${t.usageCount || 1} Qs)` : t.source}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        {t.crossCuttingTags && t.crossCuttingTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {t.crossCuttingTags.map((tag) => (
                              <span
                                key={tag}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  tag === "atsi-relevant"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                                    : tag === "emergency"
                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="p-1 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/25 transition-all cursor-pointer"
                            title="Edit topic details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenMoveModal(t as TopicItem)}
                            className="px-2 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900 rounded border border-teal-200 dark:border-teal-800 transition-all cursor-pointer"
                            title="Move topic to another home unit"
                          >
                            Move
                          </button>

                          {t.status === "archived" ? (
                            <>
                              <button
                                onClick={() => handleRestoreTopic(t)}
                                className="p-1 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/25 transition-all cursor-pointer"
                                title="Restore topic to active"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTopicTarget(t)}
                                className="p-1 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/25 transition-all cursor-pointer"
                                title="Delete topic permanently (Archived items only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleArchiveTopic(t)}
                              className="p-1 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/25 transition-all cursor-pointer"
                              title="Archive topic (Soft Delete)"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-teal-600 dark:text-teal-400 font-bold">{Math.min(visibleTopicsCount, filteredTaxonomy.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredTaxonomy.length}</strong> Topics
            </span>

            {filteredTaxonomy.length > visibleTopicsCount && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisibleTopicsCount((prev) => prev + 10)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-900/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>See More (+10 Topics)</span>
                </button>
                {filteredTaxonomy.length > visibleTopicsCount + 10 && (
                  <button
                    onClick={() => setVisibleTopicsCount(filteredTaxonomy.length)}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all cursor-pointer"
                  >
                    Show All ({filteredTaxonomy.length})
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 2. QUESTIONS FEATURE LIST SECTION */}
      {(activeTab === "all" || activeTab === "questions") && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span>Question Bank Features & Classification</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stem vignettes, lead-in questions, answer keys, rationale, and exam format metadata.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {filteredQuestions.length} questions matching
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredQuestions.slice(0, visibleQuestionsCount).map((q) => {
              const examType = (q.examType || "AKT").toUpperCase();
              const isKfp = examType === "KFP";
              return (
                <div
                  key={q.id}
                  className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-300 dark:hover:border-teal-700 transition-all space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200/50 dark:border-teal-900/40">
                        {q.uqid || `${examType}-${String(q.id).padStart(6, "0")}`}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isKfp ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/50" : "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50"}`}>
                        {examType}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        q.difficulty === "Easy"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30"
                          : q.difficulty === "Hard"
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30"
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        q.status === "published"
                          ? "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300"
                          : q.status === "archived"
                          ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                          : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30"
                      }`}>
                        ● {q.status ? q.status.charAt(0).toUpperCase() + q.status.slice(1) : "Published"}
                      </span>
                      {q.image && (
                        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 px-1.5 py-0.5 rounded border border-teal-200">
                          📷 Image
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => router.push(`/admin/questions?id=${q.id}`)}
                      className="px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg border border-teal-200 dark:border-teal-800 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Edit Question</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                      {q.stem || q.text}
                    </p>
                    {q.leadIn && (
                      <p className="text-xs font-medium text-teal-800 dark:text-teal-300 mt-1 italic">
                        ↳ {q.leadIn}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topics:</span>
                    {(q.topic || "General").split(",").map((t) => (
                      <span key={t.trim()} className={themeBadgeSm}>
                        {t.trim()}
                      </span>
                    ))}
                    {Array.isArray(q.tags) && q.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        #{tag}
                      </span>
                    ))}
                    {Array.isArray(q.options) && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-auto">
                        {q.options.length} options · Correct: {isKfp ? `${q.kfpCorrectCount || q.correctIndices?.length || 1} required` : String.fromCharCode(65 + (q.correctIndex ?? 0))}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-teal-600 dark:text-teal-400 font-bold">{Math.min(visibleQuestionsCount, filteredQuestions.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredQuestions.length}</strong> Questions
            </span>

            {filteredQuestions.length > visibleQuestionsCount && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisibleQuestionsCount((prev) => prev + 10)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-900/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>See More Questions (+10)</span>
                </button>
                {filteredQuestions.length > visibleQuestionsCount + 10 && (
                  <button
                    onClick={() => setVisibleQuestionsCount(filteredQuestions.length)}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all cursor-pointer"
                  >
                    Show All ({filteredQuestions.length})
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 3. MEDICAL CONTENT LIBRARY SECTION */}
      {(activeTab === "all" || activeTab === "content") && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Medical Content Library Features</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clinical conditions, therapeutic guidelines, protocols, and diagnostic pathways.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {filteredContent.length} items matching
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredContent.slice(0, visibleContentCount).map((c) => (
              <div
                key={c.id}
                className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    c.type === "Condition"
                      ? "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300"
                      : c.type === "Guideline"
                      ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300"
                      : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                    {c.type}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {c.isFree ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Free</span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">Premium</span>
                    )}
                    <button
                      onClick={() => router.push(`/admin/content`)}
                      className="p-1 text-slate-500 hover:text-blue-600 rounded transition-all cursor-pointer"
                      title="Open Content Manager"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{c.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.system} {c.category ? `· ${c.category}` : ""}</p>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span>Author: {c.author || "GP Edge"}</span>
                  <span>{c.references || 0} references</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-blue-600 dark:text-blue-400 font-bold">{Math.min(visibleContentCount, filteredContent.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredContent.length}</strong> Content Items
            </span>

            {filteredContent.length > visibleContentCount && (
              <button
                onClick={() => setVisibleContentCount((prev) => prev + 10)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 hover:bg-blue-100 transition-all cursor-pointer"
              >
                See More Content (+10)
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* 4. CLINICAL APPROACHES SECTION */}
      {(activeTab === "all" || activeTab === "approaches") && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Clinical Approaches & Decision Pathways</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Structured clinical presentation algorithms, step-by-step actions, and red flag checklists.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {filteredApproaches.length} approaches matching
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredApproaches.slice(0, visibleApproachesCount).map((a) => (
              <div
                key={a.id}
                className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-purple-300 dark:hover:border-purple-700 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300 border border-purple-200">
                    {a.system || "Clinical Approach"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {a.isFree ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Free</span>
                    ) : (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">Pro</span>
                    )}
                    <button
                      onClick={() => router.push(`/admin/approaches/${a.id}`)}
                      className="p-1 text-slate-500 hover:text-purple-600 rounded transition-all cursor-pointer"
                      title="Open Approach Decision Tree"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.title}</h4>
                  {a.subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{a.subtitle}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    ⚡ {Array.isArray(a.steps) ? a.steps.length : 0} Clinical Steps
                  </span>
                  {Array.isArray(a.redFlags) && a.redFlags.length > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      🚩 {a.redFlags.length} Red Flags
                    </span>
                  )}
                  {Array.isArray(a.keyPoints) && a.keyPoints.length > 0 && (
                    <span>• {a.keyPoints.length} Key Points</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-purple-600 dark:text-purple-400 font-bold">{Math.min(visibleApproachesCount, filteredApproaches.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredApproaches.length}</strong> Approaches
            </span>

            {filteredApproaches.length > visibleApproachesCount && (
              <button
                onClick={() => setVisibleApproachesCount((prev) => prev + 10)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/70 hover:bg-purple-100 transition-all cursor-pointer"
              >
                See More Approaches (+10)
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* 5. AUTOFILL TEMPLATES SECTION */}
      {(activeTab === "all" || activeTab === "autofill") && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Autofill Note & Consultation Templates</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clinical documentation templates, GPMP shortcuts, and structured consultation proformas.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {filteredAutofill.length} templates matching
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAutofill.slice(0, visibleAutofillCount).map((t) => (
              <div
                key={t.id}
                className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-amber-300 dark:hover:border-amber-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200">
                    {t.system || "Template"}
                  </span>
                  <button
                    onClick={() => router.push(`/admin/autofill`)}
                    className="p-1 text-slate-500 hover:text-amber-600 rounded transition-all cursor-pointer"
                    title="Open Autofill Editor"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.category}</p>
                </div>

                {(t.description || t.subjective || t.content) && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg font-mono">
                    {t.description || t.subjective || t.content}
                  </p>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span>{t.fields || 0} Dynamic Fields</span>
                  <span>{t.version || "v1.0"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-amber-600 dark:text-amber-400 font-bold">{Math.min(visibleAutofillCount, filteredAutofill.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredAutofill.length}</strong> Templates
            </span>

            {filteredAutofill.length > visibleAutofillCount && (
              <button
                onClick={() => setVisibleAutofillCount((prev) => prev + 10)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 hover:bg-amber-100 transition-all cursor-pointer"
              >
                See More Templates (+10)
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* 6. ADMIN USERS SECTION */}
      {(activeTab === "all" || activeTab === "users") && filteredUsers.length > 0 && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Users & Administrators ({filteredUsers.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center font-bold text-xs text-teal-700 dark:text-teal-300">
                  {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                    u.plan === "premium"
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200"
                      : "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200"
                  }`}>
                    {u.plan || "Free"}
                  </span>
                  <span className="text-[9px] text-slate-400 capitalize">{u.status || "active"}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* MOVE UNIT MODAL - Enforces topicCode permanence */}
      <AnimatePresence>
        {moveTopicTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Move Topic Unit (<span className="font-mono text-teal-600">{moveTopicTarget.code}</span>)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {moveTopicTarget.label}
                  </p>
                </div>
                <button
                  onClick={() => setMoveTopicTarget(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <strong>Taxonomy Immutability Rule:</strong> Moving a topic between units updates <code className="font-bold">homeUnit</code>, but topicCode <code className="font-bold font-mono">{moveTopicTarget.code}</code> remains permanently unchanged.
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select New Home Unit:
                  </label>
                  <CustomSelect
                    value={moveUnitCode}
                    onChange={(val) => {
                      setMoveUnitCode(val);
                      setMoveGroupCode("");
                    }}
                    options={unitsList.map((u) => ({
                      value: u.code,
                      label: `${u.code}: ${u.name}`,
                    }))}
                    className="w-full"
                  />
                </div>

                {selectedUnitObj && selectedUnitObj.groups && selectedUnitObj.groups.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Unit Group (Optional):
                    </label>
                    <CustomSelect
                      value={moveGroupCode}
                      onChange={setMoveGroupCode}
                      options={[
                        { value: "", label: "No Group" },
                        ...selectedUnitObj.groups.map((g) => ({
                          value: g.code,
                          label: `${g.code}: ${g.name}`,
                        })),
                      ]}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setMoveTopicTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMoveTopic}
                  disabled={isMoving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isMoving ? "Saving..." : "Confirm Unit Move"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE TOPIC MODAL */}
      <AnimatePresence>
        {showCreateTopicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create New Topic</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    A permanent T#### code is assigned automatically.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateTopicModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {createTopicError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                  {createTopicError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Topic Label *</label>
                  <input
                    type="text"
                    value={createTopicForm.label}
                    onChange={(e) => setCreateTopicForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. Approach to acute chest pain"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Home Unit</label>
                  <CustomSelect
                    value={createTopicForm.homeUnit}
                    onChange={(val) => setCreateTopicForm((f) => ({ ...f, homeUnit: val }))}
                    options={unitsList.map((u) => ({ value: u.code, label: `${u.code}: ${u.name}` }))}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Topic Type</label>
                    <CustomSelect
                      value={createTopicForm.topicType}
                      onChange={(val) => setCreateTopicForm((f) => ({ ...f, topicType: val }))}
                      options={[
                        { value: "Clinical Condition", label: "Clinical Condition" },
                        { value: "Approach to a Presentation", label: "Approach to a Presentation" },
                      ]}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Depth Tier</label>
                    <CustomSelect
                      value={createTopicForm.depth}
                      onChange={(val) => setCreateTopicForm((f) => ({ ...f, depth: val as "Core" | "Working" | "Awareness" }))}
                      options={[
                        { value: "Core", label: "Core" },
                        { value: "Working", label: "Working" },
                        { value: "Awareness", label: "Awareness" },
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cross-Cutting Tags <span className="font-normal text-slate-400">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={createTopicForm.tags}
                    onChange={(e) => setCreateTopicForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="e.g. emergency, atsi-relevant"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setShowCreateTopicModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTopic}
                  disabled={isCreatingTopic}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingTopic ? "Creating..." : "Create Topic"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT TOPIC MODAL */}
      <AnimatePresence>
        {editTopicTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Edit Topic (<span className="font-mono text-teal-600">{editTopicTarget.code}</span>)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">topicCode remains permanently unchanged.</p>
                </div>
                <button
                  onClick={() => setEditTopicTarget(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {editTopicError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                  {editTopicError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Topic Label *</label>
                  <input
                    type="text"
                    value={editTopicForm.label}
                    onChange={(e) => setEditTopicForm((f) => ({ ...f, label: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Topic Type</label>
                    <CustomSelect
                      value={editTopicForm.topicType}
                      onChange={(val) => setEditTopicForm((f) => ({ ...f, topicType: val }))}
                      options={[
                        { value: "Clinical Condition", label: "Clinical Condition" },
                        { value: "Approach to a Presentation", label: "Approach to a Presentation" },
                        { value: "Clinical Tag", label: "Clinical Tag" },
                        { value: "Question Tag", label: "Question Tag" },
                        { value: "Autofill Template", label: "Autofill Template" },
                      ]}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Depth Tier</label>
                    <CustomSelect
                      value={editTopicForm.depth}
                      onChange={(val) => setEditTopicForm((f) => ({ ...f, depth: val as "Core" | "Working" | "Awareness" }))}
                      options={[
                        { value: "Core", label: "Core" },
                        { value: "Working", label: "Working" },
                        { value: "Awareness", label: "Awareness" },
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cross-Cutting Tags <span className="font-normal text-slate-400">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={editTopicForm.tags}
                    onChange={(e) => setEditTopicForm((f) => ({ ...f, tags: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setEditTopicTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditTopic}
                  disabled={isSavingEditTopic}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isSavingEditTopic ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MASS UPLOAD (JSON) MODAL */}
      <AnimatePresence>
        {showBulkUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Mass Upload Topics (JSON)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload a JSON array of topics. Existing topics (matched by label) are updated; new ones get an auto-assigned T#### code.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setBulkUploadResult(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 font-mono overflow-x-auto">
                {`[{ "label": "Approach to chest pain", "homeUnit": "u03", "topicType": "Approach to a Presentation", "depth": "Core", "tags": ["emergency"] }]`}
              </div>

              <div>
                <input
                  type="file"
                  accept="application/json,.json"
                  disabled={isBulkUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBulkUploadFile(file);
                    e.target.value = "";
                  }}
                  className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-950/40 dark:file:text-teal-300 file:font-semibold file:cursor-pointer cursor-pointer disabled:opacity-50"
                />
              </div>

              {isBulkUploading && (
                <div className="text-xs text-slate-500 dark:text-slate-400">Importing topics…</div>
              )}

              {bulkUploadResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900/40">
                      {bulkUploadResult.importedCount} imported
                    </span>
                    {bulkUploadResult.failedCount > 0 && (
                      <span className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/40">
                        {bulkUploadResult.failedCount} failed
                      </span>
                    )}
                  </div>
                  {bulkUploadResult.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-rose-600 dark:text-rose-400">
                      {bulkUploadResult.errors.map((e, i) => (
                        <div key={i}>
                          {e.label ? `${e.label}: ` : ""}
                          {e.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setBulkUploadResult(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PERMANENT DELETE TOPIC MODAL */}
      <AnimatePresence>
        {deleteTopicTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Delete Topic Permanently?
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    This action cannot be undone!
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1.5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <p><strong>Topic Code:</strong> <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{deleteTopicTarget.code}</span></p>
                <p><strong>Title:</strong> {deleteTopicTarget.label}</p>
                <p><strong>Home Unit:</strong> {deleteTopicTarget.homeUnit}</p>
                <p className="text-slate-500 dark:text-slate-400 pt-1">
                  Permanently deleting this topic removes it from taxonomy and database tables. If you just want to hide it, use <strong>Archive</strong> instead.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setDeleteTopicTarget(null)}
                  disabled={isDeletingTopic}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteDeleteTopic}
                  disabled={isDeletingTopic}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isDeletingTopic ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


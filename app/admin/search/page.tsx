"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Archive, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import {
  getQuestions,
  fetchQuestions,
  Question,
  fetchAdminUsersFromDb,
  AdminUser,
  getMedicalContent,
  MedicalContent,
  getAutofillTemplates,
  AutofillTemplate,
} from "@/lib/quizData";
import {
  TopicItem,
  UnitItem,
  TAXONOMY_VERSION,
  getUnitName,
  getGroupName,
  filterMasterTopics,
  getTaxonomyAuditMetrics,
  formatTopicCode,
} from "@/lib/taxonomyData";
import {
  getTaxonomyTopicsAction,
  getTaxonomyUnitsAction,
  moveTopicHomeUnitAction,
  getAllDatabaseTopicsAction,
  archiveTaxonomyTopicAction,
  deleteTaxonomyTopicAction,
  restoreTaxonomyTopicAction,
  UnifiedTopicItem,
} from "@/actions/taxonomy.actions";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "taxonomy" | "questions" | "users" | "content">("all");

  // Database / state collections
  const [questions, setQuestions] = useState<Question[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [contentList, setContentList] = useState<MedicalContent[]>([]);
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

  // Delete Topic modal state
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<UnifiedTopicItem | null>(null);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);

  // Pagination / Incremental "See More" (10 items each)
  const [visibleTopicsCount, setVisibleTopicsCount] = useState<number>(10);
  const [visibleQuestionsCount, setVisibleQuestionsCount] = useState<number>(10);

  // Reset pagination when filters or query change
  useEffect(() => {
    setVisibleTopicsCount(10);
    setVisibleQuestionsCount(10);
  }, [selectedUnit, selectedTopicTitle, selectedDepth, selectedType, selectedTag, query, activeTab]);

  useEffect(() => {
    let isMounted = true;
    fetchQuestions().then((qs) => { if (isMounted) setQuestions(qs); });
    fetchAdminUsersFromDb().then((users) => { if (isMounted) setUsersList(users); });
    if (isMounted) {
      setContentList(getMedicalContent());
      setAutofillList(getAutofillTemplates());
    }

    // Fetch all unified topics and titles from PostgreSQL (questions, approaches, conditions, autofills, taxonomy)
    getAllDatabaseTopicsAction().then((res) => {
      if (isMounted && res.success && res.topics && res.topics.length > 0) {
        setTaxonomyTopics(res.topics);
        setTopicTitlesList(res.topicTitles);
        if (res.units && res.units.length > 0) {
          setUnitsList(res.units);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
        // Update local list preserving permanent topicCode
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

  const hasResults = query.length > 1;

  // Filter taxonomy topics including database topics from questions, approaches, content
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

  // Global search filters
  const matchedQuestions = hasResults
    ? questions.filter((q) => {
        const qLower = query.trim().toLowerCase();
        return (
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
      })
    : [];

  const matchedUsers = hasResults
    ? usersList.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const matchedContent = hasResults
    ? [
        ...contentList.map((c) => ({ id: c.id, name: c.name, system: c.system, type: c.type, isTemplate: false })),
        ...autofillList.map((t) => ({ id: t.id, name: t.name, system: t.system, type: "Autofill", isTemplate: true })),
      ].filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.system.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const selectedUnitObj = unitsList.find((u) => u.code === moveUnitCode);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Search &"
        highlightedText="Taxonomy v1.1"
        subtitle="Global search, Master Taxonomy classification engine, and topic unit assignment"
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
            placeholder="Search across 1000+ Taxonomy topics (T0142), questions, content, users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-sm bg-teal-50/20 dark:bg-slate-800/80 border border-teal-200/70 dark:border-teal-900/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm"
          />
        </div>

        {/* Global Search Results Navigation */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          {(["all", "taxonomy", "questions", "users", "content"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                activeTab === tab
                  ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800"
                  : "bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab === "taxonomy" ? "Taxonomy Topics" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-1 text-[10px] opacity-70">
                ({tab === "all"
                  ? filteredTaxonomy.length + matchedQuestions.length + matchedUsers.length + matchedContent.length
                  : tab === "taxonomy"
                  ? filteredTaxonomy.length
                  : tab === "questions"
                  ? matchedQuestions.length
                  : tab === "users"
                  ? matchedUsers.length
                  : matchedContent.length})
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Quota & Classification Audit Banner (Matches Spec Image) */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Units</p>
          <p className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">{metrics.totalUnits} Units</p>
          <p className="text-[10px] text-slate-400">U01 to U37</p>
        </div>

        <div className="p-4 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Master Topics</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{metrics.totalTopics}</p>
          <p className="text-[10px] text-slate-400">Permanent topicCode (T0001+)</p>
        </div>

        <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200/40 dark:border-teal-900/30">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">Core Depth</p>
          <p className="text-xl font-bold text-teal-700 dark:text-teal-300 mt-1">{metrics.depthCounts.Core}</p>
          <p className="text-[10px] text-teal-600 dark:text-teal-400">GP diagnoses & manages</p>
        </div>

        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/40 dark:border-amber-900/30">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Working Depth</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">{metrics.depthCounts.Working}</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400">GP recognises & initiates</p>
        </div>

        <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200/40 dark:border-purple-900/30">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">Awareness Depth</p>
          <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">{metrics.depthCounts.Awareness}</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400">Quota: GP recognises & refers</p>
        </div>
      </motion.div>

      {/* MASTER TAXONOMY CLASSIFICATION EXPLORER */}
      {(activeTab === "all" || activeTab === "taxonomy") && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Taxonomy & Classification Engine</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 font-mono font-bold">
                  v{TAXONOMY_VERSION}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Topic codes are permanent. Moving a topic between units updates <code className="text-teal-600">homeUnit</code>, never code.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-2.5 items-center">
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
                className="w-full sm:w-60"
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
                className="w-full sm:w-64"
              />

              {/* Depth Tier Dropdown */}
              <CustomSelect
                value={selectedDepth}
                onChange={setSelectedDepth}
                options={[
                  { value: "all", label: "All Depth Tiers" },
                  { value: "Core", label: "Core" },
                  { value: "Working", label: "Working" },
                  { value: "Awareness", label: "Awareness" },
                ]}
                className="w-full sm:w-40"
              />

              {/* Topic Type Dropdown */}
              <CustomSelect
                value={selectedType}
                onChange={setSelectedType}
                options={[
                  { value: "all", label: "All Topic Types" },
                  { value: "Approach", label: "Approach to a Presentation" },
                  { value: "Condition", label: "Clinical Condition" },
                  { value: "Question", label: "Question Bank Topics" },
                  { value: "Autofill", label: "Autofill Templates" },
                ]}
                className="w-full sm:w-56"
              />

              {/* Cross Cutting Tag Dropdown */}
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
                className="w-full sm:w-56"
              />
            </div>
          </div>

          {/* Topics Table matching Spec Image Specification */}
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
                      {/* topicCode */}
                      <td className="p-3">
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200/50 dark:border-teal-900/40">
                          {formatTopicCode(t.code)}
                        </span>
                      </td>

                      {/* Label */}
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

                      {/* homeUnit.group */}
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">{t.homeUnit} ({displayUnitName})</div>
                        {t.group && <div className="text-[10px] text-slate-400 truncate">{t.group} {grpName ? `· ${grpName}` : ""}</div>}
                      </td>

                      {/* crossRefUnits */}
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

                      {/* depthTier */}
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

                      {/* topicType */}
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

                      {/* crossCuttingTags */}
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

                      {/* Actions: Move, Archive, Delete */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenMoveModal(t as TopicItem)}
                            className="px-2 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900 rounded border border-teal-200 dark:border-teal-800 transition-all"
                            title="Move topic to another home unit"
                          >
                            Move
                          </button>

                          {t.status === "archived" ? (
                            <button
                              onClick={() => handleRestoreTopic(t)}
                              className="p-1 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/25 transition-all"
                              title="Restore topic to active"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchiveTopic(t)}
                              className="p-1 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/25 transition-all"
                              title="Archive topic (Soft Delete)"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteTopicTarget(t)}
                            className="p-1 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/25 transition-all"
                            title="Delete topic permanently (IRREVERSIBLE)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination & "See More" Controls (10 items per increment) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800">
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
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
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

      {/* OTHER SEARCH RESULTS (Questions, Users, Content) */}
      {hasResults && (activeTab === "all" || activeTab === "questions") && matchedQuestions.length > 0 && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Questions (Showing {Math.min(visibleQuestionsCount, matchedQuestions.length)} of {matchedQuestions.length})
            </h3>
          </div>
          {matchedQuestions.slice(0, visibleQuestionsCount).map((r) => (
            <div
              key={r.id}
              onClick={() => router.push(`/admin/questions?id=${r.id}`)}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all cursor-pointer"
            >
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/35 px-2 py-1 rounded">Q</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold truncate">{r.text}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>ID #{r.id}</span>
                  <span>·</span>
                  <span>{r.topic}</span>
                </div>
              </div>
            </div>
          ))}

          {matchedQuestions.length > visibleQuestionsCount && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisibleQuestionsCount((prev) => prev + 10)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-900/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>See More Questions (+10)</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
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
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMoveTopic}
                  disabled={isMoving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50"
                >
                  {isMoving ? "Saving..." : "Confirm Unit Move"}
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteDeleteTopic}
                  disabled={isDeletingTopic}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
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

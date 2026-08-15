"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
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
  MASTER_UNITS,
  MASTER_TOPICS,
  TopicItem,
  UnitItem,
  TAXONOMY_VERSION,
  getUnitName,
  getGroupName,
  filterMasterTopics,
  getTaxonomyAuditMetrics,
} from "@/lib/taxonomyData";
import {
  syncMasterTaxonomyAction,
  getTaxonomyTopicsAction,
  getTaxonomyUnitsAction,
  moveTopicHomeUnitAction,
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

  // Taxonomy filters
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedDepth, setSelectedDepth] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [taxonomyTopics, setTaxonomyTopics] = useState<TopicItem[]>(MASTER_TOPICS);
  const [syncingTaxonomy, setSyncingTaxonomy] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Move Topic modal state
  const [moveTopicTarget, setMoveTopicTarget] = useState<TopicItem | null>(null);
  const [moveUnitCode, setMoveUnitCode] = useState<string>("");
  const [moveGroupCode, setMoveGroupCode] = useState<string>("");
  const [isMoving, setIsMoving] = useState(false);

  const metrics = getTaxonomyAuditMetrics();

  useEffect(() => {
    fetchQuestions().then(setQuestions);
    fetchAdminUsersFromDb().then(setUsersList);
    setContentList(getMedicalContent());
    setAutofillList(getAutofillTemplates());

    // Try fetching database synced topics if available
    getTaxonomyTopicsAction({ limit: 1000 }).then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setTaxonomyTopics(res.data as TopicItem[]);
      }
    });
  }, []);

  const handleSyncTaxonomy = async () => {
    setSyncingTaxonomy(true);
    setSyncMessage(null);
    try {
      const res = await syncMasterTaxonomyAction();
      if (res.success) {
        setSyncMessage(`Successfully synced ${res.topicsCount} topics & ${res.unitsCount} units (v${res.version}) to PostgreSQL!`);
        const updated = await getTaxonomyTopicsAction({ limit: 1000 });
        if (updated.success && updated.data) {
          setTaxonomyTopics(updated.data as TopicItem[]);
        }
      } else {
        setSyncMessage(`Sync Error: ${res.error}`);
      }
    } catch (e: any) {
      setSyncMessage(`Sync Error: ${e.message}`);
    } finally {
      setSyncingTaxonomy(false);
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

  const hasResults = query.length > 1;

  // Filter taxonomy topics
  const filteredTaxonomy = filterMasterTopics({
    query: query.length > 1 ? query : undefined,
    unitCode: selectedUnit,
    depthTier: selectedDepth,
    topicType: selectedType,
    crossCuttingTag: selectedTag,
  });

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

  const selectedUnitObj = MASTER_UNITS.find((u) => u.code === moveUnitCode);

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search across 1000+ Taxonomy topics (T0142), questions, content, users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 text-sm bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 dark:text-slate-100 transition-all"
            />
          </div>

          <button
            onClick={handleSyncTaxonomy}
            disabled={syncingTaxonomy}
            className="px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <svg className={`w-4 h-4 ${syncingTaxonomy ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncingTaxonomy ? "Syncing DB..." : "Sync Master Taxonomy JSON"}
          </button>
        </div>

        {syncMessage && (
          <div className="p-3 mb-4 text-xs font-semibold rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50">
            {syncMessage}
          </div>
        )}

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
            <div className="flex flex-wrap gap-2 items-center">
              {/* Unit Dropdown */}
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Units (U01–U37)</option>
                {MASTER_UNITS.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.code}: {u.name}
                  </option>
                ))}
              </select>

              {/* Depth Tier Dropdown */}
              <select
                value={selectedDepth}
                onChange={(e) => setSelectedDepth(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Depth Tiers</option>
                <option value="Core">Core</option>
                <option value="Working">Working</option>
                <option value="Awareness">Awareness</option>
              </select>

              {/* Topic Type Dropdown */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Topic Types</option>
                <option value="Approach">Approach to a Presentation</option>
                <option value="Condition">Clinical Condition</option>
              </select>

              {/* Cross Cutting Tag Dropdown */}
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Cross-Cutting Tags</option>
                <option value="atsi-relevant">atsi-relevant</option>
                <option value="emergency">emergency</option>
              </select>
            </div>
          </div>

          {/* Topics Table matching Spec Image Specification */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 w-28">topicCode</th>
                  <th className="p-3">Label / Topic Title</th>
                  <th className="p-3 w-40">homeUnit.group</th>
                  <th className="p-3 w-28">crossRefUnits</th>
                  <th className="p-3 w-28">depthTier</th>
                  <th className="p-3 w-32">topicType</th>
                  <th className="p-3 w-32">crossCuttingTags</th>
                  <th className="p-3 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {filteredTaxonomy.slice(0, 150).map((t) => {
                  const grpName = getGroupName(t.homeUnit, t.group);
                  return (
                    <tr key={t.code} className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-all">
                      {/* topicCode */}
                      <td className="p-3">
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200/50 dark:border-teal-900/40">
                          {t.code}
                        </span>
                      </td>

                      {/* Label */}
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        <div>{t.label}</div>
                        {t.variants && t.variants.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Variants: {t.variants.join(", ")}
                          </div>
                        )}
                        {t.status === "merged" && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded ml-1">
                            Merged → {t.mergedInto.join(", ")}
                          </span>
                        )}
                      </td>

                      {/* homeUnit.group */}
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">{t.homeUnit} ({getUnitName(t.homeUnit)})</div>
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
                        {t.topicType}
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

                      {/* Move Unit Action */}
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenMoveModal(t)}
                          className="px-2 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900 rounded border border-teal-200 dark:border-teal-800 transition-all"
                        >
                          Move Unit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredTaxonomy.length > 150 && (
            <p className="text-xs text-slate-400 text-center pt-2">
              Showing first 150 of {filteredTaxonomy.length} matching taxonomy items. Refine search query for more.
            </p>
          )}
        </motion.div>
      )}

      {/* OTHER SEARCH RESULTS (Questions, Users, Content) */}
      {hasResults && (activeTab === "all" || activeTab === "questions") && matchedQuestions.length > 0 && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Questions ({matchedQuestions.length})</h3>
          {matchedQuestions.slice(0, 10).map((r) => (
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

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select New Home Unit:
                  </label>
                  <select
                    value={moveUnitCode}
                    onChange={(e) => {
                      setMoveUnitCode(e.target.value);
                      setMoveGroupCode("");
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                  >
                    {MASTER_UNITS.map((u) => (
                      <option key={u.code} value={u.code}>
                        {u.code}: {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUnitObj && selectedUnitObj.groups && selectedUnitObj.groups.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Select Unit Group (Optional):
                    </label>
                    <select
                      value={moveGroupCode}
                      onChange={(e) => setMoveGroupCode(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                    >
                      <option value="">No Group</option>
                      {selectedUnitObj.groups.map((g) => (
                        <option key={g.code} value={g.code}>
                          {g.code}: {g.name}
                        </option>
                      ))}
                    </select>
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
    </motion.div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  fetchQuestions,
  saveQuestions,
  Question,
  getCustomTags,
  saveCustomTags,
  fetchAdminUsersFromDb,
  AdminUser,
  getMedicalContent,
  MedicalContent,
  getAutofillTemplates,
  AutofillTemplate,
} from "@/lib/quizData";
import {
  saveMasterTaxonomy,
  TaxonomyUnit,
  TaxonomyTopic,
  DepthTier,
  CONTROLLED_CROSS_CUTTING_TAGS,
} from "@/lib/taxonomy";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

export default function SearchPage() {
  const router = useRouter();

  // Search state
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Data states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [contentList, setContentList] = useState<MedicalContent[]>([]);
  const [autofillList, setAutofillList] = useState<AutofillTemplate[]>([]);

  // Master Taxonomy states
  const [units, setUnits] = useState<TaxonomyUnit[]>([]);
  const [topics, setTopics] = useState<TaxonomyTopic[]>([]);
  const [auditStats, setAuditStats] = useState({ totalActive: 0, coreCount: 0, workingCount: 0, awarenessCount: 0, schemaVersion: "1.1", generated: "" });

  // Taxonomy Filters
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [selectedDepth, setSelectedDepth] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [taxonomySearch, setTaxonomySearch] = useState("");

  // Modals state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetTopic, setTargetTopic] = useState<TaxonomyTopic | null>(null);
  const [newUnitCode, setNewUnitCode] = useState<string>("");
  const [newGroupCode, setNewGroupCode] = useState<string>("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTopicObj, setEditTopicObj] = useState<TaxonomyTopic | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDepth, setEditDepth] = useState<DepthTier>("Core");
  const [editTags, setEditTags] = useState<string[]>([]);

  const refreshTaxonomy = async () => {
    try {
      const res = await fetch("/api/taxonomy");
      const data = await res.json();
      if (data.success) {
        setUnits(data.units || []);
        setTopics(data.topics || []);
        setAuditStats(data.auditStats);
        
        // Cache to localStorage for backward compatibility with getTopics() in quizData.ts
        saveMasterTaxonomy({
          schemaVersion: data.schemaVersion || "1.1",
          generated: data.generated || new Date().toISOString(),
          notes: [],
          units: data.units || [],
          topics: data.topics || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch taxonomy from API:", err);
    }
  };

  useEffect(() => {
    fetchQuestions().then(setQuestions);
    setCustomTags(getCustomTags());
    fetchAdminUsersFromDb().then(setUsersList);
    setContentList(getMedicalContent());
    setAutofillList(getAutofillTemplates());
    refreshTaxonomy();
  }, []);

  const hasResults = query.length > 2;

  // Filter questions based on global search query
  const matchedQuestions = hasResults
    ? questions.filter(
        (q) =>
          q.text.toLowerCase().includes(query.toLowerCase()) ||
          q.id.toString().includes(query) ||
          q.topic.toLowerCase().includes(query.toLowerCase()) ||
          (q.tags && q.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())))
      )
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
        ...autofillList.map((t) => ({ id: t.id, name: t.name, system: t.system, type: "Autofill", isTemplate: true }))
      ].filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.system.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const searchResults = {
    questions: matchedQuestions,
    users: matchedUsers,
    content: matchedContent,
  };

  // Compute filtered taxonomy topics
  const filteredTaxonomyTopics = useMemo(() => {
    return topics.filter((t) => {
      if (t.status !== "active") return false;
      if (selectedUnit !== "ALL" && t.homeUnit !== selectedUnit && (!t.crossRefs || !t.crossRefs.includes(selectedUnit))) {
        return false;
      }
      if (selectedDepth !== "ALL" && t.depth !== selectedDepth) return false;
      if (selectedType !== "ALL" && t.topicType !== selectedType) return false;
      if (selectedTag !== "ALL" && (!t.crossCuttingTags || !t.crossCuttingTags.includes(selectedTag))) return false;

      if (taxonomySearch.trim()) {
        const q = taxonomySearch.toLowerCase();
        const matchCode = t.code.toLowerCase().includes(q);
        const matchLabel = t.label.toLowerCase().includes(q);
        const matchVar = t.variants && t.variants.some((v) => v.toLowerCase().includes(q));
        if (!matchCode && !matchLabel && !matchVar) return false;
      }
      return true;
    });
  }, [topics, selectedUnit, selectedDepth, selectedType, selectedTag, taxonomySearch]);

  // Handle Move Unit submit
  const handleMoveUnitSubmit = async () => {
    if (!targetTopic || !newUnitCode) return;
    try {
      const res = await fetch("/api/taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move_unit",
          topicCode: targetTopic.code,
          newHomeUnit: newUnitCode,
          newGroupCode: newGroupCode || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Condition ${targetTopic.code} (${targetTopic.label}) moved to unit ${newUnitCode}. Topic code remains invariant.`);
        setShowMoveModal(false);
        setTargetTopic(null);
        refreshTaxonomy();
      } else {
        alert(`Error moving topic: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Request failed: ${err.message}`);
    }
  };

  // Handle Edit Topic submit
  const handleEditTopicSubmit = async () => {
    if (!editTopicObj || !editLabel.trim()) return;
    try {
      const res = await fetch("/api/taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_topic",
          topicCode: editTopicObj.code,
          updates: {
            label: editLabel.trim(),
            depth: editDepth,
            crossCuttingTags: editTags,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Topic ${editTopicObj.code} successfully updated.`);
        setShowEditModal(false);
        setEditTopicObj(null);
        refreshTaxonomy();
      } else {
        alert(`Error updating topic: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Request failed: ${err.message}`);
    }
  };

  const selectedUnitObj = units.find((u) => u.code === newUnitCode);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Search &"
        highlightedText="Taxonomy v1.1"
        subtitle="Global search across all resources and complete RACGP Master Taxonomy structure"
        variants={itemVariants}
      />

      {/* Global Search Bar */}
      <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-slate-800/80 p-6 shadow-md shadow-slate-200/10 dark:shadow-slate-950/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-transparent via-transparent to-teal-50/2 dark:to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="relative max-w-2xl mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search across questions, users, content, topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-base bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 dark:text-slate-100 transition-all"
            />
          </div>

          {hasResults && (
            <div className="mt-6">
              <div className="flex gap-2 mb-4">
                {["all", "questions", "users", "content"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      activeTab === tab
                        ? "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/60"
                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span className="ml-1 text-[10px] opacity-60">
                      {tab === "all"
                        ? searchResults.questions.length + searchResults.users.length + searchResults.content.length
                        : tab === "questions"
                        ? searchResults.questions.length
                        : tab === "users"
                        ? searchResults.users.length
                        : searchResults.content.length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {(activeTab === "all" || activeTab === "questions") &&
                  searchResults.questions.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => router.push(`/admin/questions?id=${r.id}`)}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-all cursor-pointer"
                    >
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/35 px-2.5 py-1.5 rounded shrink-0">Q</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate font-semibold">{r.text}</p>
                        <p className="text-xs text-slate-400">#{r.id} · {r.topic}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quota Adherence Audit Banner */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/85 dark:bg-slate-900/90 p-4 rounded-2xl border border-teal-200/20 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Schema Version</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">v{auditStats.schemaVersion}</span>
            <span className="text-xs text-slate-400">Master Taxonomy</span>
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/90 p-4 rounded-2xl border border-teal-200/20 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Core Depth Topics</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{auditStats.coreCount}</span>
            <span className="text-xs text-emerald-500 font-medium">Full Wiki / Multiple Items</span>
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/90 p-4 rounded-2xl border border-teal-200/20 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Working Depth</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{auditStats.workingCount}</span>
            <span className="text-xs text-amber-500 font-medium">Medium Page / 1-2 Items</span>
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/90 p-4 rounded-2xl border border-teal-200/20 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Awareness Depth</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{auditStats.awarenessCount}</span>
            <span className="text-xs text-purple-500 font-medium">Brief / 0-1 Quota</span>
          </div>
        </div>
      </motion.div>

      {/* 37 Clinical Units Bar */}
      <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-slate-800/80 p-5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">37 Clinical Units (Stable Structure)</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-medium">
              U01 - U37
            </span>
          </div>
          <span className="text-xs text-slate-400">Unit codes never change or renumber</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedUnit("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border shrink-0 transition-all ${
              selectedUnit === "ALL"
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            }`}
          >
            All Units ({topics.length})
          </button>
          {units.map((unit) => {
            const count = topics.filter((t) => t.homeUnit === unit.code).length;
            const isSelected = selectedUnit === unit.code;
            return (
              <button
                key={unit.code}
                onClick={() => setSelectedUnit(unit.code)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className={`font-mono text-[10px] px-1 py-0.2 rounded ${isSelected ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>
                  {unit.code}
                </span>
                <span>{unit.name}</span>
                <span className={`text-[10px] opacity-75 px-1 rounded-full ${isSelected ? "bg-white/20" : "bg-slate-200/60 dark:bg-slate-700/60"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Master Taxonomy Topics Table */}
      <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-slate-800/80 p-6 shadow-md shadow-slate-200/10 dark:shadow-slate-950/40 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Taxonomy Topics & Conditions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredTaxonomyTopics.length} conditions · Topic codes (e.g. T0142) are permanent primary identifiers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search within taxonomy */}
            <input
              type="text"
              placeholder="Search code (T0142), condition, variant..."
              value={taxonomySearch}
              onChange={(e) => setTaxonomySearch(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-56"
            />

            {/* Depth Tier Filter */}
            <select
              value={selectedDepth}
              onChange={(e) => setSelectedDepth(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="ALL">All Depths</option>
              <option value="Core">Core</option>
              <option value="Working">Working</option>
              <option value="Awareness">Awareness</option>
            </select>

            {/* Topic Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="Condition">Condition</option>
              <option value="Approach to a Presentation">Approach</option>
            </select>

            {/* Controlled Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="ALL">All Controlled Tags</option>
              {CONTROLLED_CROSS_CUTTING_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Topics List Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Topic Code</th>
                <th className="px-4 py-3">Condition / Topic Label</th>
                <th className="px-4 py-3">Home Unit</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Depth Tier</th>
                <th className="px-4 py-3">Cross-Cutting Tags</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white/50 dark:bg-slate-900/40">
              {filteredTaxonomyTopics.slice(0, 100).map((topic) => {
                const homeUnitObj = units.find((u) => u.code === topic.homeUnit);

                let depthBadgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                if (topic.depth === "Core") depthBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50";
                else if (topic.depth === "Working") depthBadgeClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50";
                else if (topic.depth === "Awareness") depthBadgeClass = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50";

                return (
                  <tr key={topic.code} className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-all">
                    <td className="px-4 py-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {topic.code}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div>{topic.label}</div>
                      {topic.variants && topic.variants.length > 0 && (
                        <div className="text-[10px] font-normal text-slate-400 truncate max-w-xs">
                          Var: {topic.variants.join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <span className="font-mono text-[10px] font-bold text-teal-600 dark:text-teal-400">{topic.homeUnit}</span>
                        <span className="truncate max-w-[120px]">{homeUnitObj ? homeUnitObj.name : topic.homeUnit}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {topic.group || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${depthBadgeClass}`}>
                        {topic.depth}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {topic.crossCuttingTags && topic.crossCuttingTags.length > 0 ? (
                          topic.crossCuttingTags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setTargetTopic(topic);
                            setNewUnitCode(topic.homeUnit);
                            setNewGroupCode(topic.group || "");
                            setShowMoveModal(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 rounded-lg transition-all border border-teal-200/50 dark:border-teal-900/50"
                          title="Move condition to another unit while retaining topic code"
                        >
                          Move Unit
                        </button>
                        <button
                          onClick={() => {
                            setEditTopicObj(topic);
                            setEditLabel(topic.label);
                            setEditDepth(topic.depth);
                            setEditTags(topic.crossCuttingTags || []);
                            setShowEditModal(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-all"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTaxonomyTopics.length > 100 && (
          <div className="mt-3 text-center text-xs text-slate-400">
            Showing first 100 of {filteredTaxonomyTopics.length} topics. Use search or unit filters to refine view.
          </div>
        )}
      </motion.div>

      {/* Move Condition Unit Modal */}
      <AnimatePresence>
        {showMoveModal && targetTopic && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60]" onClick={() => setShowMoveModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="fixed inset-x-4 top-[20%] mx-auto max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl z-[70] shadow-2xl p-6 text-slate-800 dark:text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Move Condition to New Unit</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Topic Code: <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{targetTopic.code}</span> (Permanent)</p>
                </div>
                <button onClick={() => setShowMoveModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <strong>Taxonomy Invariant Rule:</strong> Moving a condition changes its <code className="font-bold">homeUnit</code>, but its <code className="font-bold">{targetTopic.code}</code> code never changes. Units themselves never move or renumber.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Target Home Unit (37 Clinical Units)</label>
                <select
                  value={newUnitCode}
                  onChange={(e) => {
                    setNewUnitCode(e.target.value);
                    setNewGroupCode("");
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:text-slate-100 font-medium"
                >
                  {units.map((u) => (
                    <option key={u.code} value={u.code}>
                      {u.code} — {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUnitObj && selectedUnitObj.groups && selectedUnitObj.groups.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Unit Group (Optional)</label>
                  <select
                    value={newGroupCode}
                    onChange={(e) => setNewGroupCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:text-slate-100 font-medium"
                  >
                    <option value="">None (No Group)</option>
                    {selectedUnitObj.groups.map((g) => (
                      <option key={g.code} value={g.code}>
                        {g.code} — {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowMoveModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleMoveUnitSubmit} className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow">Confirm Unit Transfer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Topic Modal */}
      <AnimatePresence>
        {showEditModal && editTopicObj && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60]" onClick={() => setShowEditModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="fixed inset-x-4 top-[20%] mx-auto max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl z-[70] shadow-2xl p-6 text-slate-800 dark:text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Edit Topic Metadata</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Topic Code: <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{editTopicObj.code}</span></p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Condition Label</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Depth Tier</label>
                <select
                  value={editDepth}
                  onChange={(e) => setEditDepth(e.target.value as DepthTier)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:text-slate-100 font-medium"
                >
                  <option value="Core">Core (Full wiki page, multiple items)</option>
                  <option value="Working">Working (Recognises, initiates/refers, 1-2 items)</option>
                  <option value="Awareness">Awareness (Recognises & refers, 0-1 items)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Controlled Cross-Cutting Tags</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {CONTROLLED_CROSS_CUTTING_TAGS.map((tag) => {
                    const isChecked = editTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isChecked) setEditTags(editTags.filter((t) => t !== tag));
                          else setEditTags([...editTags, tag]);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                          isChecked
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleEditTopicSubmit} className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow">Save Changes</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

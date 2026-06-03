"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import { bodySystems, mockConditions, MedicalCondition } from "@/app/medical-library/libraryData";

// ─── System helper utilities ──────────────────────────────────────────────────
type SystemId = string;

const SYSTEM_CONFIG: Record<SystemId, { glow: string; border: string; text: string; accent: string }> = {
  Cardiology:       { glow: "from-rose-500/10 dark:from-rose-500/20",    border: "hover:border-rose-400/80",   text: "text-rose-600 dark:text-rose-400",    accent: "bg-rose-500" },
  Respiratory:      { glow: "from-sky-500/10 dark:from-sky-500/20",      border: "hover:border-sky-400/80",    text: "text-sky-600 dark:text-sky-400",      accent: "bg-sky-500" },
  Endocrine:        { glow: "from-violet-500/10 dark:from-violet-500/20", border: "hover:border-violet-400/80", text: "text-violet-600 dark:text-violet-400", accent: "bg-violet-500" },
  Gastrointestinal: { glow: "from-amber-500/10 dark:from-amber-500/20",  border: "hover:border-amber-400/80",  text: "text-amber-600 dark:text-amber-400",  accent: "bg-amber-500" },
  Psychiatry:       { glow: "from-indigo-500/10 dark:from-indigo-500/20", border: "hover:border-indigo-400/80", text: "text-indigo-600 dark:text-indigo-400", accent: "bg-indigo-500" },
  Dermatology:      { glow: "from-emerald-500/10 dark:from-emerald-500/20", border: "hover:border-emerald-400/80", text: "text-emerald-600 dark:text-emerald-400", accent: "bg-emerald-500" },
  "Women's Health": { glow: "from-fuchsia-500/10 dark:from-fuchsia-500/20", border: "hover:border-fuchsia-400/80", text: "text-fuchsia-600 dark:text-fuchsia-400", accent: "bg-fuchsia-500" },
  Paediatrics:      { glow: "from-teal-500/10 dark:from-teal-500/20",    border: "hover:border-teal-400/80",   text: "text-teal-600 dark:text-teal-400",    accent: "bg-teal-500" },
};

const getSystem = (id: SystemId) => SYSTEM_CONFIG[id] ?? {
  glow: "from-teal-500/10 dark:from-teal-500/20",
  border: "hover:border-teal-400/80",
  text: "text-teal-600 dark:text-teal-400",
  accent: "bg-teal-500",
};

function SystemIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Lucide as Record<string, unknown>)[name] as React.ComponentType<{ className?: string }>;
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

// ─── Slide-over tabs ─────────────────────────────────────────────────────────
type SlideTab = "symptoms" | "diagnosis" | "treatment" | "notes" | "pdf";

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICAL LIBRARY PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function MedicalLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<MedicalCondition | null>(null);
  const [activeTab, setActiveTab] = useState<SlideTab>("symptoms");
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);

  // Memoize system counts
  const systemCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of mockConditions) {
      map.set(c.system, (map.get(c.system) ?? 0) + 1);
    }
    return map;
  }, []);

  // Memoize filtered conditions
  const filteredConditions = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mockConditions.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.symptoms.some((s) => s.toLowerCase().includes(q)) ||
        c.author.toLowerCase().includes(q);
      const matchesSystem = selectedSystem === "all" || c.system === selectedSystem;
      const matchesType =
        selectedType === "all" ||
        (selectedType === "condition" && c.type === "Condition") ||
        (selectedType === "guideline" && c.type === "Guideline") ||
        (selectedType === "document" && c.type === "Document") ||
        (selectedType === "note" && c.type === "Note");
      return matchesSearch && matchesSystem && matchesType;
    });
  }, [searchQuery, selectedSystem, selectedType]);

  const handleOpenCondition = useCallback((condition: MedicalCondition) => {
    setSelectedCondition(condition);
    setPdfPage(1);
    setPdfZoom(100);
    setActiveTab("symptoms");
  }, []);

  return (
    <div className="space-y-8 pb-6">

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/50 dark:border-teal-900/30 mb-5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
          </span>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
            Reference Library
          </span>
        </div>

        <h1 className="font-sans text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-3">
          Explore the{" "}
          <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Medical Directory
          </span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Browse official guidelines, diagnostic criteria, treatment options, and clinical summaries.{" "}
          <span className="font-semibold text-teal-600 dark:text-teal-400">{mockConditions.length} conditions</span>{" "}
          across major body systems.
        </p>
      </div>

      {/* ── Search + filters ─────────────────────────────────────────────────── */}
      <div className="relative p-5 rounded-[2rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 shadow-2xl ring-1 ring-slate-900/5 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Lucide.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by condition, symptoms, or guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-sm bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 dark:text-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <Lucide.X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-md rounded-xl p-1 w-full lg:w-auto overflow-x-auto border border-slate-200/40 dark:border-slate-800/60">
          {[
            { id: "all", label: "All Content" },
            { id: "condition", label: "Conditions" },
            { id: "guideline", label: "Guidelines" },
            { id: "document", label: "Documents" },
            { id: "note", label: "Notes" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all duration-150 ${
                selectedType === type.id
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/15"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body system grid ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Browse by Body System
          </h2>
          {selectedSystem !== "all" && (
            <button
              onClick={() => setSelectedSystem("all")}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-500"
            >
              Reset Category
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {bodySystems.map((system) => {
            const count = systemCounts.get(system.id) ?? 0;
            const isSelected = selectedSystem === system.id;
            return (
              <button
                key={system.id}
                onClick={() => setSelectedSystem(isSelected ? "all" : system.id)}
                className={`relative group rounded-2xl p-4 border text-left flex flex-col justify-between transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? "bg-gradient-to-br from-teal-500 via-teal-500 to-emerald-600 text-white shadow-xl shadow-teal-500/20 border-teal-400/30"
                    : "bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 shadow-md hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-800/60"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? "bg-white/20 text-white" : system.lightBg}`}>
                    <SystemIcon name={system.iconName} className={`w-4 h-4 ${isSelected ? "text-white" : system.textColor}`} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                    {count}
                  </span>
                </div>
                <div>
                  <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                    {system.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Condition listing ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Available Medical Libraries ({filteredConditions.length})
        </h2>

        {filteredConditions.length === 0 ? (
          <div className="bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-12 text-center max-w-lg mx-auto">
            <Lucide.Search className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <h3 className="font-sans text-lg text-slate-900 dark:text-slate-200 mt-3 font-bold tracking-tight">No medical content found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters, system category, or searching for other symptoms.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedSystem("all"); setSelectedType("all"); }}
              className="mt-4 px-4 py-2 bg-teal-500 text-white font-semibold text-xs rounded-full hover:bg-teal-600 transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredConditions.map((condition) => {
              const systemConfig = bodySystems.find((s) => s.id === condition.system);
              const sys = getSystem(condition.system);
              return (
                <motion.div
                  key={condition.id}
                  layoutId={`condition-card-${condition.id}`}
                  className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-md overflow-hidden relative group hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer flex flex-col justify-between ${sys.border}`}
                  onClick={() => handleOpenCondition(condition)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 pointer-events-none" />
                  <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${sys.glow} to-transparent rounded-full blur-xl pointer-events-none`} />

                  <div className="p-5 relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            condition.type === "Guideline"
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-900/30"
                              : condition.type === "Document"
                              ? "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border-teal-200/40 dark:border-teal-900/30"
                              : condition.type === "Note"
                              ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200/40 dark:border-green-900/30"
                              : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/40 dark:border-slate-800/40"
                          }`}>
                            {condition.type}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200/40 dark:border-slate-800/40 ${systemConfig?.lightBg} ${systemConfig?.textColor}`}>
                            {condition.system}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {condition.isPremium && (
                            <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg text-slate-500" title="Premium Content">
                              <Lucide.Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {condition.document && (
                            <span className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200/30 dark:border-teal-900/30 p-1 rounded-lg text-teal-600 dark:text-teal-400" title="PDF available">
                              <Lucide.FileText className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className={`font-sans text-base font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:${sys.text.split(" ")[0].replace("text-", "text-")} transition-colors leading-snug tracking-tight`}>
                        {condition.name}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 truncate font-medium">
                        {condition.category}
                      </p>
                    </div>

                    <div className="space-y-1.5 mt-auto">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Key Indicators</p>
                      <div className="flex flex-wrap gap-1">
                        {condition.symptoms.slice(0, 3).map((sym, i) => (
                          <span key={i} className="text-[10px] bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/30 dark:border-slate-700/30 truncate max-w-[150px]">
                            {sym}
                          </span>
                        ))}
                        {condition.symptoms.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-1 py-0.5">+{condition.symptoms.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs relative z-10">
                    <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                      <Lucide.Clock className="w-3.5 h-3.5" />
                      {condition.lastUpdated}
                    </span>
                    <span className={`font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs ${sys.text}`}>
                      Read Library
                      <Lucide.ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full w-12 rounded-full transition-all duration-300 group-hover:w-24 ${sys.accent}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail slide-over ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCondition && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
              onClick={() => setSelectedCondition(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border-l border-slate-200/60 dark:border-slate-800/80 z-50 shadow-2xl overflow-y-auto flex flex-col"
            >
              {/* Slide-over header */}
              <div className="p-6 border-b border-slate-200/60 dark:border-slate-800/80 relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
                <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
                <button
                  onClick={() => setSelectedCondition(null)}
                  className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                  <Lucide.X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-2 relative z-10 flex-wrap">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    {selectedCondition.type}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedCondition.system}
                  </span>
                  {selectedCondition.isPremium && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Lucide.Lock className="w-2.5 h-2.5" />
                      Premium Library
                    </span>
                  )}
                </div>
                <h2 className="font-sans text-2xl font-bold text-white tracking-tight relative z-10 pr-10">
                  {selectedCondition.name}
                </h2>
                <p className="text-xs text-slate-400 font-light mt-1 relative z-10">
                  {selectedCondition.category} · Updated {selectedCondition.lastUpdated} by {selectedCondition.author}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200/60 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 sticky top-0 z-10 overflow-x-auto">
                {[
                  { id: "symptoms", label: "Symptoms" },
                  { id: "diagnosis", label: "Diagnosis" },
                  { id: "treatment", label: "Treatment" },
                  { id: "notes", label: "Clinical Notes" },
                  ...(selectedCondition.document ? [{ id: "pdf", label: "Guideline PDF" }] : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SlideTab)}
                    className={`flex-1 px-4 py-3.5 text-xs font-bold text-center transition-all border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-teal-600 dark:text-teal-400 border-teal-500 dark:border-teal-400 bg-teal-500/5 dark:bg-teal-400/5"
                        : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6 flex-1 bg-slate-50/40 dark:bg-slate-955/40 text-slate-800 dark:text-slate-200">

                {activeTab === "symptoms" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Clinical Signs & Symptoms
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCondition.symptoms.map((symptom, i) => {
                        const sc = bodySystems.find((s) => s.id === selectedCondition.system);
                        return (
                          <div key={i} className="flex gap-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <span className={`w-5 h-5 rounded-full ${sc?.lightBg || "bg-teal-50"} ${sc?.textColor || "text-teal-600"} font-bold text-xs flex items-center justify-center shrink-0`}>
                              <Lucide.Check className="w-3 h-3" />
                            </span>
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{symptom}</span>
                          </div>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}

                {activeTab === "diagnosis" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Diagnosis & Assessment Criteria
                    </h3>
                    <div className="space-y-3">
                      {selectedCondition.diagnosisCriteria.map((crit, i) => {
                        const sc = bodySystems.find((s) => s.id === selectedCondition.system);
                        return (
                          <div key={i} className="bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-xl shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow">
                            <span className={`text-xs font-mono font-bold ${sc?.textColor || "text-teal-600"} ${sc?.lightBg || "bg-teal-50"} px-2 py-0.5 rounded mt-0.5`}>
                              Step {i + 1}
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{crit}</p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === "treatment" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Management & Treatment Regimen
                    </h3>
                    <div className="space-y-3">
                      {selectedCondition.treatmentOptions.map((opt, i) => {
                        const sys = getSystem(selectedCondition.system);
                        return (
                          <div key={i} className={`bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-xl shadow-sm border-l-4 ${sys.accent.replace("bg-", "border-l-")} hover:shadow-md transition-shadow`}>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{opt}</p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === "notes" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl p-5 shadow-sm">
                      <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Lucide.Lightbulb className="w-4 h-4 text-amber-500 shrink-0" /> Clinical Pearls & Guidelines
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {selectedCondition.clinicalNotes}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Clinical References ({selectedCondition.references.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedCondition.references.map((ref) => (
                          <div key={ref.id} className="flex gap-2.5 bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:shadow-md transition-shadow">
                            <span className="bg-slate-100 dark:bg-slate-800 w-5 h-5 rounded flex items-center justify-center shrink-0 font-bold text-[10px] text-slate-500">
                              {ref.id}
                            </span>
                            <div className="flex-1">
                              <p className="leading-snug font-medium">{ref.text}</p>
                              {ref.url && (
                                <a href={ref.url} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline mt-1.5 inline-block text-[11px] font-semibold">
                                  Access Online Source →
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "pdf" && selectedCondition.document && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col space-y-4">
                    {/* PDF Toolbar */}
                    <div className="bg-slate-950 text-slate-200 rounded-xl px-4 py-3 border border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap shadow-lg">
                      <div className="flex items-center gap-2">
                        <Lucide.FileText className="w-4 h-4 text-red-500" />
                        <span className="font-semibold truncate max-w-[200px]" title={selectedCondition.document.filename}>
                          {selectedCondition.document.filename}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                          {selectedCondition.document.fileSize}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => setPdfPage((p) => Math.max(1, p - 1))} disabled={pdfPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors">
                          <Lucide.ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-xs">Page {pdfPage} of {selectedCondition.document.totalPages}</span>
                        <button onClick={() => setPdfPage((p) => Math.min(selectedCondition.document!.totalPages, p + 1))} disabled={pdfPage === selectedCondition.document.totalPages} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors">
                          <Lucide.ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPdfZoom((z) => Math.max(50, z - 10))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800">
                          <Lucide.Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono w-10 text-center text-[11px]">{pdfZoom}%</span>
                        <button onClick={() => setPdfZoom((z) => Math.min(200, z + 10))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800">
                          <Lucide.Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* PDF mock viewer */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-100/60 dark:bg-slate-900/40 p-4 sm:p-6 flex justify-center overflow-auto max-h-[550px]">
                      <div
                        className="bg-white text-slate-800 p-8 sm:p-12 shadow-2xl border border-slate-200 relative origin-top transition-all duration-300 rounded-md"
                        style={{ transform: `scale(${pdfZoom / 100})`, width: "600px", minHeight: "750px", marginBottom: `${Math.max(0, (pdfZoom - 100) * 6)}px` }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.03] rotate-45">
                          <span className="font-sans font-black text-6xl tracking-widest text-slate-800">THE GP EDGE</span>
                        </div>
                        <div className="flex items-center justify-between border-b-2 border-teal-600 pb-4 mb-6 text-[10px] text-slate-500 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 bg-teal-600 text-white rounded flex items-center justify-center text-xs font-bold">GP</span>
                            <span>The GP Edge Clinical Reference Guideline</span>
                          </div>
                          <span>CONFIDENTIAL CLINICAL RECORD</span>
                        </div>
                        {pdfPage === 1 && (
                          <div className="space-y-6 text-xs leading-relaxed text-slate-700">
                            <div className="text-center">
                              <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">SECTION 1 // EXECUTIVE CLINICAL SUMMARY</span>
                              <h2 className="font-sans text-2xl font-bold text-slate-900 leading-tight mt-1">{selectedCondition.name} Clinical Outline</h2>
                              <p className="text-[11px] text-slate-500 mt-1 italic">Reference: {selectedCondition.id} · {selectedCondition.category}</p>
                            </div>
                            <p className="font-light">{selectedCondition.document.summary}</p>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-[11px] space-y-1.5">
                              <p className="font-bold text-slate-800">System Tags:</p>
                              <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium">
                                <li>Category: {selectedCondition.category}</li>
                                <li>System Area: {selectedCondition.system}</li>
                                <li>Authoring Board: {selectedCondition.author}</li>
                              </ul>
                            </div>
                          </div>
                        )}
                        {pdfPage === 2 && (
                          <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                            <h2 className="font-sans text-xl font-bold text-slate-900">Diagnostic Criteria Matrix</h2>
                            <p className="font-light">The following criteria must be evaluated sequentially. Confirm pathology readings against standardised medical laboratory values.</p>
                            <div className="space-y-2">
                              {selectedCondition.diagnosisCriteria.slice(0, 4).map((c, i) => (
                                <div key={i} className="flex gap-2 border border-slate-200 p-3 rounded-lg">
                                  <span className="font-mono font-bold text-teal-700 shrink-0">0{i + 1}</span>
                                  <p>{c}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

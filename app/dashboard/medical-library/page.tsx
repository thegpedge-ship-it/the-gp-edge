"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import { bodySystems, mockConditions, MedicalCondition } from "@/app/medical-library/libraryData";

// ─── System helper utilities ──────────────────────────────────────────────────
type SystemId = string;

interface SystemStyle {
  glow: string;
  border: string;
  text: string;
  accent: string;
  borderLeft: string;
  gradient: string;
}

const SYSTEM_CONFIG: Record<SystemId, SystemStyle> = {
  Cardiology: {
    glow: "from-emerald-500/10 dark:from-emerald-500/20",
    border: "hover:border-emerald-400/80 dark:hover:border-emerald-500/40",
    text: "text-emerald-600 dark:text-emerald-400",
    accent: "bg-emerald-500",
    borderLeft: "border-l-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
  },
  Respiratory: {
    glow: "from-teal-500/10 dark:from-teal-500/20",
    border: "hover:border-teal-400/80 dark:hover:border-teal-500/40",
    text: "text-teal-600 dark:text-teal-400",
    accent: "bg-teal-500",
    borderLeft: "border-l-teal-500",
    gradient: "from-teal-500 to-teal-600",
  },
  Endocrine: {
    glow: "from-green-500/10 dark:from-green-500/20",
    border: "hover:border-green-400/80 dark:hover:border-green-500/40",
    text: "text-green-600 dark:text-green-400",
    accent: "bg-green-500",
    borderLeft: "border-l-green-500",
    gradient: "from-green-500 to-green-600",
  },
  Gastrointestinal: {
    glow: "from-emerald-600/10 dark:from-emerald-600/20",
    border: "hover:border-emerald-500/80 dark:hover:border-emerald-600/40",
    text: "text-emerald-700 dark:text-emerald-400",
    accent: "bg-emerald-600",
    borderLeft: "border-l-emerald-600",
    gradient: "from-emerald-600 to-emerald-700",
  },
  Psychiatry: {
    glow: "from-teal-600/10 dark:from-teal-600/20",
    border: "hover:border-teal-500/80 dark:hover:border-teal-600/40",
    text: "text-teal-700 dark:text-teal-400",
    accent: "bg-teal-600",
    borderLeft: "border-l-teal-600",
    gradient: "from-teal-600 to-teal-700",
  },
  Dermatology: {
    glow: "from-green-600/10 dark:from-green-600/20",
    border: "hover:border-green-500/80 dark:hover:border-green-600/40",
    text: "text-green-700 dark:text-green-400",
    accent: "bg-green-600",
    borderLeft: "border-l-green-600",
    gradient: "from-green-600 to-green-700",
  },
  "Women's Health": {
    glow: "from-slate-500/10 dark:from-slate-500/20",
    border: "hover:border-slate-400/80 dark:hover:border-slate-500/40",
    text: "text-slate-600 dark:text-slate-300",
    accent: "bg-slate-500",
    borderLeft: "border-l-slate-500",
    gradient: "from-slate-500 to-slate-600",
  },
  Paediatrics: {
    glow: "from-emerald-400/10 dark:from-emerald-400/20",
    border: "hover:border-emerald-300/80 dark:hover:border-emerald-400/40",
    text: "text-emerald-600 dark:text-emerald-400",
    accent: "bg-emerald-400",
    borderLeft: "border-l-emerald-400",
    gradient: "from-emerald-400 to-emerald-500",
  },
};

const getSystem = (id: SystemId): SystemStyle =>
  SYSTEM_CONFIG[id] ?? {
    glow: "from-teal-500/10 dark:from-teal-500/20",
    border: "hover:border-teal-400/80 dark:hover:border-teal-500/40",
    text: "text-teal-600 dark:text-teal-400",
    accent: "bg-teal-500",
    borderLeft: "border-l-teal-500",
    gradient: "from-teal-500 to-teal-600",
  };

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
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

  // Lock body scroll when drawer is open to prevent background scrolling lag
  useEffect(() => {
    if (selectedCondition) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedCondition]);

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
    <div className="space-y-8 pb-10">

      {/* ── Hero header (Minimalist Style) ────────────────────────────────────── */}
      <div className="space-y-2 select-none">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-800/30 uppercase tracking-[0.12em]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          Reference Library
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-none">
          Explore the Medical Directory
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-2xl">
          Browse official guidelines, diagnostic criteria, treatment options, and clinical summaries. {mockConditions.length} conditions across major body systems.
        </p>
      </div>

      {/* ── Search + filters ─────────────────────────────────────────────────── */}
      <div className="relative p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 shadow-md flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Lucide.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by condition, symptoms, or guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-sm bg-white/70 dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
            >
              <Lucide.X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-950/60 backdrop-blur-md rounded-xl p-1 w-full lg:w-auto overflow-x-auto border border-slate-200/40 dark:border-slate-800/60">
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
              className={`relative px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all duration-300 z-10 ${
                selectedType === type.id
                  ? "text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {selectedType === type.id && (
                <motion.div
                  layoutId="activeTypeFilter"
                  className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-500 rounded-lg -z-10 shadow-md shadow-teal-600/15"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
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
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors flex items-center gap-1"
            >
              <Lucide.RotateCcw className="w-3 h-3" />
              Reset Category
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {bodySystems.map((system) => {
            const count = systemCounts.get(system.id) ?? 0;
            const isSelected = selectedSystem === system.id;
            const sys = getSystem(system.id);
            return (
              <button
                key={system.id}
                onClick={() => setSelectedSystem(isSelected ? "all" : system.id)}
                className={`relative group rounded-2xl p-4 border text-left flex flex-col justify-between transition-all duration-300 overflow-hidden hover:scale-[1.03] active:scale-[0.97] ${
                  isSelected
                    ? "bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 text-white shadow-xl shadow-teal-500/20 border-teal-400/30"
                    : `bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-950 border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md ${sys.border}`
                }`}
              >
                {/* Subtle top-right glow matching the system color on hover */}
                {!isSelected && (
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${sys.glow} to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                )}

                <div className="flex justify-end items-start mb-4 relative z-10">
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md transition-colors duration-300 ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400"
                  }`}>
                    {count}
                  </span>
                </div>
                <div className="relative z-10">
                  <p className={`text-xs font-bold truncate transition-colors duration-300 ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white"}`}>
                    {system.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Condition listing ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Available Medical Libraries ({filteredConditions.length})
        </h2>

        {filteredConditions.length === 0 ? (
          <div className="bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 p-12 text-center max-w-lg mx-auto">
            <Lucide.Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="font-sans text-lg text-slate-900 dark:text-slate-200 mt-3 font-bold tracking-tight">No medical content found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters, system category, or searching for other symptoms.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedSystem("all"); setSelectedType("all"); }}
              className="mt-5 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-xs rounded-full hover:shadow-lg hover:shadow-teal-500/20 active:scale-95 transition-all"
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
                  className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/40 dark:border-slate-800/70 shadow-sm overflow-hidden relative group hover:shadow-md hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 cursor-pointer flex flex-col justify-between ${sys.border}`}
                  onClick={() => handleOpenCondition(condition)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 pointer-events-none" />
                  <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${sys.glow} to-transparent rounded-full blur-xl pointer-events-none`} />

                  {/* Left accent strip indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b ${sys.gradient} opacity-80`} />

                  <div className="p-5 pl-6 relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            condition.type === "Guideline"
                              ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/15 dark:border-emerald-500/25"
                              : condition.type === "Document"
                              ? "bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/15 dark:border-teal-500/25"
                              : condition.type === "Note"
                              ? "bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/15 dark:border-green-500/25"
                              : "bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/15 dark:border-slate-500/25"
                          }`}>
                            {condition.type}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200/40 dark:border-slate-800/40 ${systemConfig?.lightBg} ${systemConfig?.textColor}`}>
                            {condition.system}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {condition.isPremium && (
                            <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded-lg text-slate-500 dark:text-slate-400" title="Premium Content">
                              <Lucide.Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {condition.document && (
                            <span className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200/30 dark:border-teal-900/30 p-1.5 rounded-lg text-teal-600 dark:text-teal-400" title="PDF available">
                              <Lucide.FileText className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className={`font-sans text-base font-bold text-slate-900 dark:text-slate-100 mb-1 transition-colors duration-300 leading-snug tracking-tight ${
                        condition.system === "Cardiology" ? "group-hover:text-emerald-600 dark:group-hover:text-emerald-400" :
                        condition.system === "Respiratory" ? "group-hover:text-teal-600 dark:group-hover:text-teal-400" :
                        condition.system === "Endocrine" ? "group-hover:text-green-600 dark:group-hover:text-green-400" :
                        condition.system === "Gastrointestinal" ? "group-hover:text-emerald-700 dark:group-hover:text-emerald-400" :
                        condition.system === "Psychiatry" ? "group-hover:text-teal-700 dark:group-hover:text-teal-400" :
                        condition.system === "Dermatology" ? "group-hover:text-green-700 dark:group-hover:text-green-400" :
                        condition.system === "Women's Health" ? "group-hover:text-slate-700 dark:group-hover:text-slate-400" :
                        "group-hover:text-emerald-500 dark:group-hover:text-emerald-400"
                      }`}>
                        {condition.name}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 truncate font-medium">
                        {condition.category}
                      </p>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Key Indicators</p>
                      <div className="flex flex-wrap gap-1">
                        {condition.symptoms.slice(0, 3).map((sym, i) => (
                          <span key={i} className="text-[10px] bg-slate-100/60 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/30 dark:border-slate-700/30 truncate max-w-[150px]">
                            {sym}
                          </span>
                        ))}
                        {condition.symptoms.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-1 py-0.5">+{condition.symptoms.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 pl-6 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs relative z-10">
                    <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                      <Lucide.Clock className="w-3.5 h-3.5" />
                      {condition.lastUpdated}
                    </span>
                    <span className={`font-semibold flex items-center gap-0.5 text-xs transition-colors duration-300 ${sys.text}`}>
                      Read Library
                      <Lucide.ArrowRight className="w-3.5 h-3.5 transform transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                    <div className={`h-full w-12 rounded-full transition-all duration-300 group-hover:w-full ${sys.accent}`} />
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
          <motion.div
            key="medical-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 cursor-pointer"
            onClick={() => setSelectedCondition(null)}
          />
        )}
        {selectedCondition && (
          <motion.div
            key="medical-detail-drawer"
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 34, stiffness: 280, mass: 0.9 }}
            className="fixed right-4 top-4 bottom-4 w-[calc(100%-2rem)] max-w-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200/50 dark:border-slate-800/50 z-50 shadow-2xl overflow-hidden flex flex-col rounded-2xl"
          >
            {/* Premium top gradient line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 shrink-0" />

            {/* Slide-over header */}
            <div className="p-6 border-b border-slate-200/60 dark:border-slate-800 relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shrink-0">
              <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
              <button
                onClick={() => setSelectedCondition(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
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
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1">
                    <Lucide.Lock className="w-2.5 h-2.5" />
                    Premium Library
                  </span>
                )}
              </div>
              <h2 className="font-sans text-2xl font-bold text-white tracking-tight relative z-10 pr-10">
                {selectedCondition.name}
              </h2>
              <p className="text-xs text-slate-400 font-light mt-1.5 relative z-10 leading-relaxed">
                {selectedCondition.category} · Updated {selectedCondition.lastUpdated} by {selectedCondition.author}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200/60 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 sticky top-0 z-10 overflow-x-auto shrink-0">
              {[
                { id: "symptoms", label: "Symptoms", icon: Lucide.Activity },
                { id: "diagnosis", label: "Diagnosis", icon: Lucide.ClipboardCheck },
                { id: "treatment", label: "Treatment", icon: Lucide.HeartPulse },
                { id: "notes", label: "Clinical Notes", icon: Lucide.BookOpen },
                ...(selectedCondition.document ? [{ id: "pdf", label: "Guideline PDF", icon: Lucide.FileText }] : []),
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SlideTab)}
                    className={`relative flex-1 px-4 py-3.5 text-xs font-bold text-center transition-all whitespace-nowrap flex items-center justify-center gap-1.5 z-10 ${
                      activeTab === tab.id
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeSlideTab"
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-teal-500 to-teal-400"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-6 flex-1 flex flex-col min-h-0 bg-slate-50/40 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200">

              {activeTab === "symptoms" && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Clinical Signs & Symptoms
                  </h3>
                  <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3" variants={containerVariants}>
                    {selectedCondition.symptoms.map((symptom, i) => {
                      const sc = bodySystems.find((s) => s.id === selectedCondition.system);
                      return (
                        <motion.div key={i} variants={itemVariants} className="flex gap-3 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                          <span className={`w-5 h-5 rounded-full ${sc?.lightBg || "bg-teal-50"} ${sc?.textColor || "text-teal-600"} font-bold text-xs flex items-center justify-center shrink-0`}>
                            <Lucide.Check className="w-3 h-3" />
                          </span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">{symptom}</span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "diagnosis" && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Diagnosis & Assessment Criteria
                  </h3>
                  <motion.div className="space-y-3" variants={containerVariants}>
                    {selectedCondition.diagnosisCriteria.map((crit, i) => {
                      const sc = bodySystems.find((s) => s.id === selectedCondition.system);
                      return (
                        <motion.div key={i} variants={itemVariants} className="bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-xl shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow">
                          <span className={`text-[10px] font-mono font-bold ${sc?.textColor || "text-teal-600"} bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md shrink-0 mt-0.5 border border-slate-200/40 dark:border-slate-700/40 shadow-sm`}>
                            Step {i + 1}
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{crit}</p>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "treatment" && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Management & Treatment Regimen
                  </h3>
                  <motion.div className="space-y-3" variants={containerVariants}>
                    {selectedCondition.treatmentOptions.map((opt, i) => {
                      const sys = getSystem(selectedCondition.system);
                      return (
                        <motion.div key={i} variants={itemVariants} className={`bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-xl shadow-sm border-l-4 ${sys.borderLeft} hover:shadow-md transition-shadow flex items-start gap-3`}>
                          <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/20 dark:border-slate-800/30">
                            {i + 1}
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold flex-1">{opt}</p>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "notes" && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex-1 overflow-y-auto scrollbar-hide">
                  <div className="bg-teal-500/5 dark:bg-teal-500/10 border border-teal-200/40 dark:border-teal-900/30 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Lucide.Lightbulb className="w-4 h-4 text-teal-500 shrink-0" /> Clinical Pearls & Guidelines
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                      {selectedCondition.clinicalNotes}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Clinical References ({selectedCondition.references.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedCondition.references.map((ref) => (
                        <div key={ref.id} className="flex gap-3 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 p-3.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:shadow-md transition-shadow">
                          <span className="bg-slate-100 dark:bg-slate-800 w-5 h-5 rounded border border-slate-200/30 dark:border-slate-700/30 flex items-center justify-center shrink-0 font-bold text-[10px] text-slate-500">
                            {ref.id}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="leading-snug font-semibold">{ref.text}</p>
                            {ref.url && (
                              <a href={ref.url} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline mt-1.5 inline-block text-[11px] font-bold">
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col space-y-4 flex-1 min-h-0 overflow-hidden">
                  {/* PDF Toolbar */}
                  <div className="bg-slate-900 dark:bg-slate-955 text-slate-200 rounded-xl px-4 py-3 border border-slate-800/80 flex items-center justify-between gap-3 text-xs flex-wrap shadow-lg shrink-0 select-none">
                    <div className="flex items-center gap-2">
                      <Lucide.FileText className="w-4 h-4 text-rose-500" />
                      <span className="font-bold truncate max-w-[200px]" title={selectedCondition.document.filename}>
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
                      <span className="font-mono text-xs font-semibold">Page {pdfPage} of {selectedCondition.document.totalPages}</span>
                      <button onClick={() => setPdfPage((p) => Math.min(selectedCondition.document!.totalPages, p + 1))} disabled={pdfPage === selectedCondition.document.totalPages} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors">
                        <Lucide.ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPdfZoom((z) => Math.max(50, z - 10))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800">
                          <Lucide.Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono w-10 text-center text-[11px] font-bold">{pdfZoom}%</span>
                        <button onClick={() => setPdfZoom((z) => Math.min(200, z + 10))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800">
                          <Lucide.Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          window.open(`/medical-library/view-pdf?id=${selectedCondition.id}`, "_blank");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] transition-colors"
                        title="Open in New Tab"
                      >
                        <Lucide.ExternalLink className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </button>
                      {selectedCondition.document.downloadUrl && (
                        <a
                          href={selectedCondition.document.downloadUrl}
                          download
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] transition-colors shadow-sm"
                        >
                          <Lucide.Download className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* PDF mock viewer */}
                  <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xl bg-slate-100/60 dark:bg-slate-900/40 p-4 sm:p-6 flex flex-col items-center flex-1 overflow-y-auto">
                    <div
                      className="bg-white text-slate-800 p-8 sm:p-12 shadow-2xl border border-slate-200/80 relative origin-top transition-all duration-300 rounded-md shrink-0"
                      style={{
                        transform: `scale(${pdfZoom / 100})`,
                        width: "600px",
                        minHeight: "780px",
                        marginBottom: `${Math.max(0, (pdfZoom / 100 - 1) * 780)}px`,
                      }}
                    >
                      {/* Faint Confidential Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.03] rotate-[35deg] overflow-hidden">
                        <span className="font-sans font-black text-7xl tracking-widest text-slate-900">GP EDGE</span>
                      </div>

                      {/* Professional PDF Header */}
                      <div className="flex items-center justify-between border-b-2 border-teal-600 pb-4 mb-6 text-[10px] text-slate-500 font-semibold tracking-wider uppercase select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-teal-600 text-white rounded flex items-center justify-center text-[10px] font-bold">GP</span>
                          <span>Clinical Reference Guideline Library</span>
                        </div>
                        <span className="text-red-600 font-bold">CONFIDENTIAL</span>
                      </div>

                      {pdfPage === 1 && (
                        <div className="space-y-6 text-xs leading-relaxed text-slate-700">
                          <div className="text-center">
                            <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">SECTION 1 // EXECUTIVE CLINICAL SUMMARY</span>
                            <h2 className="font-sans text-2xl font-bold text-slate-900 leading-tight mt-1">{selectedCondition.name} Outline</h2>
                            <p className="text-[11px] text-slate-500 mt-1 italic">Reference Index: {selectedCondition.id} · {selectedCondition.category}</p>
                          </div>
                          <p className="font-medium text-slate-600 border-l-2 border-slate-200 pl-3.5 italic">{selectedCondition.document.summary}</p>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-[11px] space-y-2">
                            <p className="font-bold text-slate-800">Metadata Profile:</p>
                            <ul className="list-disc pl-4 space-y-1.5 text-slate-600 font-medium">
                              <li><strong>Target System:</strong> {selectedCondition.system} Pathology</li>
                              <li><strong>Subcategory Classification:</strong> {selectedCondition.category}</li>
                              <li><strong>Authoring Board:</strong> {selectedCondition.author}</li>
                              <li><strong>Version Control:</strong> Release May 2026</li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {pdfPage === 2 && (
                        <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                          <div className="border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">SECTION 2 // CLINICAL DIAGNOSTIC MATRIX</span>
                            <h2 className="font-sans text-xl font-bold text-slate-900 mt-0.5">Diagnostic Criteria</h2>
                          </div>
                          <p className="font-medium text-slate-500">The following standard laboratory and clinical indicators must be evaluated sequentially:</p>
                          <div className="space-y-2">
                            {selectedCondition.diagnosisCriteria.slice(0, 4).map((c, i) => (
                              <div key={i} className="flex gap-3 border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                                <span className="font-mono font-bold text-teal-700 shrink-0 text-xs">0{i + 1}</span>
                                <p className="text-slate-600 font-medium">{c}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pdfPage === 3 && (
                        <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                          <div className="border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">SECTION 3 // THERAPEUTIC REGIMEN MANAGEMENT</span>
                            <h2 className="font-sans text-xl font-bold text-slate-900 mt-0.5">Recommended Interventions</h2>
                          </div>
                          <p className="font-medium text-slate-500">Stepwise pharmacological and non-pharmacological directives for {selectedCondition.name}:</p>
                          <div className="space-y-3">
                            {selectedCondition.treatmentOptions.map((opt, i) => (
                              <div key={i} className="flex gap-3.5 items-start border border-slate-100 bg-slate-50/30 p-3.5 rounded-lg">
                                <span className="w-5 h-5 rounded bg-teal-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <p className="text-[11px] leading-relaxed text-slate-600 font-medium">{opt}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pdfPage >= 4 && (
                        <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                          <div className="border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">SECTION 4 // CLINICAL NOTES & REFERENCES</span>
                            <h2 className="font-sans text-xl font-bold text-slate-900 mt-0.5">Pearls & Bibliography</h2>
                          </div>
                          <div className="bg-teal-50 border border-teal-200/50 p-4 rounded-xl text-[11px] leading-relaxed text-slate-600 italic">
                            <p className="font-bold text-teal-850 not-italic mb-1 flex items-center gap-1">
                              <Lucide.Lightbulb className="w-3.5 h-3.5 text-teal-600" />
                              Key Summary Pearls:
                            </p>
                            {selectedCondition.clinicalNotes}
                          </div>
                          <div className="space-y-2 mt-4">
                            <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">References</h3>
                            {selectedCondition.references.map((ref) => (
                              <div key={ref.id} className="border-t border-slate-100 pt-2 flex items-start gap-2 text-[10.5px]">
                                <span className="font-semibold text-slate-400 shrink-0 font-mono">[{ref.id}]</span>
                                <p className="text-slate-600 font-medium">
                                  {ref.text} {ref.url && <span className="text-teal-600 underline font-mono text-[9.5px]">({ref.url})</span>}
                                </p>
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
        )}
      </AnimatePresence>
    </div>
  );
}

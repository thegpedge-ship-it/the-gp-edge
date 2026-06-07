"use client";

import { useState, useMemo, useCallback, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
    glow: "from-green-500/10 dark:from-green-500/20",
    border: "hover:border-green-400/80 dark:hover:border-green-500/40",
    text: "text-green-600 dark:text-green-400",
    accent: "bg-green-500",
    borderLeft: "border-l-green-500",
    gradient: "from-green-500 to-green-600",
  },
  Respiratory: {
    glow: "from-green-500/10 dark:from-green-500/20",
    border: "hover:border-green-400/80 dark:hover:border-green-500/40",
    text: "text-green-600 dark:text-green-400",
    accent: "bg-green-500",
    borderLeft: "border-l-green-500",
    gradient: "from-green-500 to-green-600",
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
    glow: "from-green-600/10 dark:from-green-600/20",
    border: "hover:border-green-500/80 dark:hover:border-green-600/40",
    text: "text-green-700 dark:text-green-400",
    accent: "bg-green-600",
    borderLeft: "border-l-green-600",
    gradient: "from-green-600 to-green-700",
  },
  Psychiatry: {
    glow: "from-green-600/10 dark:from-green-600/20",
    border: "hover:border-green-500/80 dark:hover:border-green-600/40",
    text: "text-green-700 dark:text-green-400",
    accent: "bg-green-600",
    borderLeft: "border-l-green-600",
    gradient: "from-green-600 to-green-700",
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
    glow: "from-green-500/10 dark:from-green-500/20",
    border: "hover:border-green-400/80 dark:hover:border-green-500/40",
    text: "text-green-600 dark:text-green-400",
    accent: "bg-green-500",
    borderLeft: "border-l-green-500",
    gradient: "from-green-500 to-green-600",
  },
  Paediatrics: {
    glow: "from-green-400/10 dark:from-green-400/20",
    border: "hover:border-green-300/80 dark:hover:border-green-400/40",
    text: "text-green-600 dark:text-green-400",
    accent: "bg-green-400",
    borderLeft: "border-l-green-400",
    gradient: "from-green-400 to-green-500",
  },
};

const getSystem = (id: SystemId): SystemStyle =>
  SYSTEM_CONFIG[id] ?? {
    glow: "from-green-500/10 dark:from-green-500/20",
    border: "hover:border-green-400/80 dark:hover:border-green-500/40",
    text: "text-green-600 dark:text-green-400",
    accent: "bg-green-500",
    borderLeft: "border-l-green-500",
    gradient: "from-green-500 to-green-600",
  };

const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.24 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

const detailVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.16 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICAL LIBRARY PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function MedicalLibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Medical Library...</div>}>
      <MedicalLibraryContent />
    </Suspense>
  );
}

function MedicalLibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<string>("all");
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    symptoms: true,
    diagnosis: false,
    treatment: false,
    pearls: false,
    references: false,
  });

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const selectedConditionId = searchParams.get("id");
  const selectedCondition = useMemo(() => {
    if (!selectedConditionId) return null;
    return mockConditions.find((c) => c.id === selectedConditionId) ?? null;
  }, [selectedConditionId]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(720);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const width = entry.contentRect.width;
      if (width > 0) {
        setContainerWidth(width);
      }
    });
    observer.observe(containerRef.current);
    
    const width = containerRef.current.clientWidth;
    const computedStyle = window.getComputedStyle(containerRef.current);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const contentWidth = width - paddingLeft - paddingRight;
    if (contentWidth > 0) {
      setContainerWidth(contentWidth);
    }

    return () => observer.disconnect();
  }, [selectedCondition]);

  const scaleFactor = useMemo(() => {
    return containerWidth / 720;
  }, [containerWidth]);

  const currentZoomScale = useMemo(() => {
    return scaleFactor * (pdfZoom / 100);
  }, [scaleFactor, pdfZoom]);

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
    const q = searchQuery.trim().toLowerCase();
    return mockConditions.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.system.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.symptoms.some((s) => s.toLowerCase().includes(q)) ||
        c.clinicalNotes.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q);
      const matchesSystem = selectedSystem === "all" || c.system === selectedSystem;
      return matchesSearch && matchesSystem;
    });
  }, [searchQuery, selectedSystem]);

  const handleOpenCondition = useCallback((condition: MedicalCondition) => {
    const params = new URLSearchParams(window.location.search);
    params.set("id", condition.id);
    router.push(`/dashboard/medical-library?${params.toString()}`);
    setPdfPage(1);
    setPdfZoom(100);
  }, [router]);

  const handleTagClick = useCallback((e: React.MouseEvent, type: "system" | "type" | "category" | "symptom", value: string) => {
    e.stopPropagation();
    const params = new URLSearchParams(window.location.search);
    params.delete("id");
    router.push(`/dashboard/medical-library?${params.toString()}`);
    if (type === "system") {
      setSelectedSystem(value);
    } else if (type === "category" || type === "symptom") {
      setSearchQuery(value);
    }
  }, [router]);

  return (
    <div className="flex flex-col gap-6 pb-6">

      {/* ── Page Header (Minimalist Style) ────────────────────────────────────── */}
      <div className="space-y-2 select-none">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/30 text-[10px] font-bold text-green-700 dark:text-green-400 border border-green-200/30 dark:border-green-800/30 uppercase tracking-[0.12em]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
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

      <AnimatePresence mode="wait">
        {!selectedCondition ? (
          /* ─── SEARCH GRID VIEW ─────────────────────────────────────────────────── */
          <motion.div
            key="grid-view"
            variants={gridVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            {/* Merged Search & Type Filters Header Card */}
            <div className="relative p-2.5 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 shadow-md flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search input (MBS billing style input) */}
              <div className="relative flex-1 w-full">
                <div className="relative flex items-center">
                  <Lucide.Search className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by condition, system, symptoms, or keyword..."
                    className="w-full pl-12 pr-10 py-3 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <Lucide.X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Body system grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Browse by Body System
                </h2>
                {selectedSystem !== "all" && (
                  <button
                    onClick={() => setSelectedSystem("all")}
                    className="text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-500 transition-colors flex items-center gap-1"
                  >
                    <Lucide.RotateCcw className="w-3 h-3" />
                    Reset Category
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200/50">
                <button
                  onClick={() => setSelectedSystem("all")}
                  className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${
                    selectedSystem === "all"
                      ? "bg-slate-900 text-white border-slate-955 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm"
                      : "bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-955"
                  }`}
                >
                  All Systems
                </button>
                {bodySystems.map((system) => {
                  const count = systemCounts.get(system.id) ?? 0;
                  const isSelected = selectedSystem === system.id;
                  const sys = getSystem(system.id);
                  return (
                    <button
                      key={system.id}
                      onClick={() => setSelectedSystem(isSelected ? "all" : system.id)}
                      className={`px-4 py-2 text-xs font-bold rounded-full border flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${
                        isSelected
                          ? `bg-gradient-to-r ${sys.gradient} text-white border-transparent shadow-sm`
                          : `bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-955 ${sys.border}`
                      }`}
                    >
                      <span>{system.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800/85 text-slate-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Condition listing */}
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
                    onClick={() => { setSearchQuery(""); setSelectedSystem("all"); }}
                    className="mt-5 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-xs rounded-full hover:shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredConditions.map((condition) => {
                    const sys = getSystem(condition.system);
                    return (
                      <motion.div
                        key={condition.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.99 }}
                        className="glass dark:glass-strong rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/60 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                        onClick={() => handleOpenCondition(condition)}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold font-mono text-green-600 dark:text-green-400">
                              {condition.id}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {condition.isPremium && (
                                <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg text-slate-500 dark:text-slate-400" title="Premium Content">
                                  <Lucide.Lock className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-green-600 dark:group-hover:text-green-500 transition-colors mb-2">
                            {condition.name}
                          </h3>

                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                            {condition.category}
                          </p>

                          <div className="space-y-1.5 mb-4">
                            {condition.symptoms.slice(0, 2).map((sym, i) => (
                              <p
                                key={i}
                                className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5"
                              >
                                <span className="text-green-600 dark:text-green-500 font-bold">•</span>
                                <span className="truncate">{sym}</span>
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4 mt-auto flex items-center justify-between">
                          <div
                            onClick={(e) => handleTagClick(e, "system", condition.system)}
                            className="flex flex-col cursor-pointer group/footer"
                          >
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 group-hover/footer:text-green-600 dark:group-hover/footer:text-green-500 transition-colors">{condition.system}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Updated</span>
                            <span className={`text-xs font-bold ${sys.text}`}>{condition.lastUpdated}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ─── DETAIL VIEW ────────────────────────────────────────────────── */
          <motion.div
            key="detail-view"
            variants={detailVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-5"
          >
            {/* Back Button */}
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.delete("id");
                router.push(`/dashboard/medical-library?${params.toString()}`);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900 border border-slate-200/40 dark:border-slate-800/50 text-xs font-semibold transition-all"
            >
              <Lucide.ArrowLeft className="w-4 h-4" />
              Back to Search Grid
            </button>

            {/* Split Screen 12 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Clinical Info */}
              <div className="lg:col-span-7">
                <div className="glass dark:glass-strong rounded-3xl p-6 lg:p-8 border border-slate-200/50 dark:border-slate-800/60 shadow-lg space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-green-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

                  {/* Header info */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          onClick={(e) => handleTagClick(e, "system", selectedCondition.system)}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                          {selectedCondition.system}
                        </span>
                        {selectedCondition.isPremium && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1">
                            <Lucide.Lock className="w-2.5 h-2.5" />
                            Premium Library
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 leading-snug">
                        {selectedCondition.name}
                      </h2>
                    </div>
                  </div>

                  {/* Metadata profile chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Author</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedCondition.author}</span>
                    </div>
                    <div
                      onClick={(e) => handleTagClick(e, "system", selectedCondition.system)}
                      className="cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/85 p-1.5 rounded-xl transition-colors"
                    >
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">System</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedCondition.system}</span>
                    </div>
                    <div className="p-1.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Category</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedCondition.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Last Updated</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedCondition.lastUpdated}</span>
                    </div>
                  </div>

                  {/* Symptoms Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Clinical Signs & Symptoms</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedCondition.symptoms.map((symptom, i) => (
                        <div
                          key={i}
                          className="flex gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/10 dark:border-slate-800/15"
                        >
                          <Lucide.Check className="w-4 h-4 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                          <span>{symptom}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Diagnosis Steps Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Diagnosis & Assessment Criteria</h4>
                    <div className="space-y-2.5">
                      {selectedCondition.diagnosisCriteria.map((crit, i) => (
                        <div key={i} className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/10 dark:border-slate-800/15 p-3.5 rounded-xl flex items-start gap-3">
                          <span className="text-[10px] font-mono font-bold text-green-600 dark:text-green-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0 mt-0.5 border border-slate-200/40 dark:border-slate-700/40 shadow-sm">
                            Step {i + 1}
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{crit}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Treatment & Management Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Management & Treatment Regimen</h4>
                    <div className="space-y-2.5">
                      {selectedCondition.treatmentOptions.map((opt, i) => {
                        const sys = getSystem(selectedCondition.system);
                        return (
                          <div key={i} className={`bg-white/40 dark:bg-slate-900/40 border border-slate-200/10 dark:border-slate-800/15 p-3.5 rounded-xl border-l-4 ${sys.borderLeft} flex items-start gap-3`}>
                            <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/20 dark:border-slate-800/30">
                              {i + 1}
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold flex-1">{opt}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clinical Pearls & Guidelines */}
                  <div className="bg-green-50/5 dark:bg-green-500/10 border border-green-200/20 dark:border-green-900/30 rounded-2xl p-4 space-y-2">
                    <h4 className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Lucide.Lightbulb className="w-4 h-4 text-green-600 dark:text-green-500 shrink-0" /> Clinical Pearls & Guidelines
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line font-medium">
                      {selectedCondition.clinicalNotes}
                    </p>
                  </div>

                  {/* Clinical References */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                      Clinical References ({selectedCondition.references.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedCondition.references.map((ref) => (
                        <div key={ref.id} className="flex gap-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200/10 dark:border-slate-800/15 p-3.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:shadow-md transition-shadow">
                          <span className="bg-slate-100 dark:bg-slate-800 w-5 h-5 rounded border border-slate-200/30 dark:border-slate-700/30 flex items-center justify-center shrink-0 font-bold text-[10px] text-slate-500">
                            {ref.id}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="leading-snug font-semibold">{ref.text}</p>
                            {ref.url && (
                              <a href={ref.url} target="_blank" rel="noreferrer" className="text-green-600 dark:text-green-500 hover:underline mt-1.5 inline-block text-[11px] font-bold">
                                Access Online Source →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: PDF Viewer or Placeholder */}
              <div className="lg:col-span-5 space-y-5">
                {selectedCondition.document ? (
                  <div className="flex flex-col space-y-4">
                    {/* PDF Toolbar */}
                    <div className="bg-slate-900 dark:bg-slate-955 text-slate-200 rounded-xl px-4 py-3 border border-slate-800/80 flex items-center justify-between gap-3 text-xs flex-wrap shadow-lg shrink-0 select-none">
                      <div className="flex items-center gap-2 min-w-0">
                        <Lucide.FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="font-bold truncate max-w-[120px]" title={selectedCondition.document.filename}>
                          {selectedCondition.document.filename}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-450 px-2 py-0.5 rounded font-mono shrink-0">
                          {selectedCondition.document.fileSize}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setPdfPage((p) => Math.max(1, p - 1))} disabled={pdfPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors">
                          <Lucide.ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-xs font-semibold">Page {pdfPage} of {selectedCondition.document.totalPages}</span>
                        <button onClick={() => setPdfPage((p) => Math.min(selectedCondition.document!.totalPages, p + 1))} disabled={pdfPage === selectedCondition.document.totalPages} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors">
                          <Lucide.ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPdfZoom((z) => Math.max(50, z - 10))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800">
                          <Lucide.Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-[10px] font-bold">{pdfZoom}%</span>
                        <button onClick={() => setPdfZoom((z) => Math.min(200, z + 10))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800">
                          <Lucide.Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* PDF mock viewer */}
                    <div
                      ref={containerRef}
                      className="border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-lg bg-slate-150/50 dark:bg-slate-950/40 p-4 flex flex-col items-center overflow-auto max-h-[600px]"
                    >
                      <div
                        style={{
                          width: `${720 * currentZoomScale}px`,
                          height: `${940 * currentZoomScale}px`,
                          position: "relative",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          className="bg-white text-slate-800 p-8 shadow-2xl border border-slate-200 absolute top-0 left-0 rounded-lg select-text"
                          style={{
                            transform: `scale(${currentZoomScale})`,
                            transformOrigin: "top left",
                            width: "720px",
                            height: "940px",
                          }}
                        >
                          {/* Watermark */}
                          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.03] rotate-[35deg] overflow-hidden">
                            <span className="font-sans font-black text-8xl tracking-widest text-slate-900">GP EDGE</span>
                          </div>

                          {/* PDF Header */}
                          <div className="flex items-center justify-between border-b-2 border-green-600 pb-2 mb-4 text-[10px] text-slate-500 font-semibold tracking-wider uppercase select-none">
                            <div className="flex items-center gap-1">
                              <span className="w-5 h-5 bg-green-600 text-white rounded flex items-center justify-center text-[9px] font-bold">GP</span>
                              <span>Clinical Reference Guideline Library</span>
                            </div>
                            <span className="text-red-600 font-bold tracking-widest">CONFIDENTIAL</span>
                          </div>

                          {/* PAGE 1 CONTENT */}
                          {pdfPage === 1 && (
                            <div className="space-y-4 text-[10.5px] leading-relaxed text-slate-700">
                              <div className="text-center">
                                <span className="text-[9px] font-bold tracking-widest text-green-600 uppercase">SECTION 1 // EXECUTIVE CLINICAL SUMMARY</span>
                                <h2 className="font-sans text-lg font-extrabold text-slate-900 leading-tight mt-1">{selectedCondition.name} Outline</h2>
                                <p className="text-[9px] text-slate-500 mt-0.5 italic">Reference Index: {selectedCondition.id} · {selectedCondition.category}</p>
                              </div>
                              <p className="font-medium text-slate-600 border-l-2 border-slate-200 pl-3 italic text-xs leading-relaxed">{selectedCondition.document.summary}</p>
                              
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] space-y-2">
                                <p className="font-bold text-slate-900">Metadata Profile:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <p className="text-slate-400">Target System</p>
                                    <p className="font-semibold text-slate-700">{selectedCondition.system} Pathology</p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-slate-400">Subcategory Classification</p>
                                    <p className="font-semibold text-slate-700">{selectedCondition.category}</p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-slate-400">Authoring Board</p>
                                    <p className="font-semibold text-slate-700">{selectedCondition.author}</p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-slate-400">Version Control</p>
                                    <p className="font-semibold text-slate-700">Release May 2026</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h3 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">Clinical Presentation Summary</h3>
                                <p className="text-slate-605 leading-relaxed font-medium">
                                  {selectedCondition.name} is a high-priority diagnostic module requiring precise assessment protocols. This guideline serves as the evidence-backed decision pathway for GP Registrars preparing for clinical exams.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* PAGE 2 CONTENT */}
                          {pdfPage === 2 && (
                            <div className="space-y-4 text-[10.5px] leading-relaxed text-slate-700">
                              <div className="border-b border-slate-100 pb-2">
                                <span className="text-[9px] font-bold tracking-widest text-green-600 uppercase">SECTION 2 // CLINICAL DIAGNOSTIC MATRIX</span>
                                <h2 className="font-sans text-base font-extrabold text-slate-900 mt-1">Diagnostic Criteria</h2>
                              </div>
                              <p className="font-medium text-slate-500">The following standard laboratory and clinical indicators must be evaluated sequentially for {selectedCondition.name}:</p>
                              <div className="space-y-2">
                                {selectedCondition.diagnosisCriteria.map((c, i) => (
                                  <div key={i} className="flex gap-3 border border-slate-150 p-3 rounded-lg bg-slate-50/50 shadow-sm">
                                    <span className="font-mono font-bold text-green-600 dark:text-green-500 shrink-0 text-xs">0{i + 1}</span>
                                    <p className="text-slate-700 font-medium leading-relaxed">{c}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* PAGE 3 CONTENT */}
                          {pdfPage === 3 && (
                            <div className="space-y-4 text-[10.5px] leading-relaxed text-slate-700">
                              <div className="border-b border-slate-100 pb-2">
                                <span className="text-[9px] font-bold tracking-widest text-green-600 uppercase">SECTION 3 // THERAPEUTIC REGIMEN MANAGEMENT</span>
                                <h2 className="font-sans text-base font-extrabold text-slate-900 mt-1">Recommended Interventions</h2>
                              </div>
                              <p className="font-medium text-slate-500">Stepwise pharmacological and non-pharmacological directives for {selectedCondition.name}:</p>
                              <div className="space-y-2">
                                {selectedCondition.treatmentOptions.map((opt, i) => (
                                  <div key={i} className="flex gap-3 items-start border border-slate-150 bg-slate-50/40 p-3 rounded-lg shadow-sm">
                                    <span className="w-5 h-5 rounded bg-green-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                      {i + 1}
                                    </span>
                                    <p className="text-slate-700 leading-relaxed font-semibold flex-1">{opt}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* PAGE 4+ CONTENT */}
                          {pdfPage >= 4 && (
                            <div className="space-y-4 text-[10.5px] leading-relaxed text-slate-700">
                              <div className="border-b border-slate-100 pb-2">
                                <span className="text-[9px] font-bold tracking-widest text-green-600 uppercase">SECTION 4 // CLINICAL NOTES & REFERENCES</span>
                                <h2 className="font-sans text-base font-extrabold text-slate-900 mt-1">Pearls & Bibliography</h2>
                              </div>
                              
                              <div className="bg-green-50/80 dark:bg-green-950/20 border border-green-200/60 dark:border-green-900/30 p-3 rounded-lg text-[10.5px] leading-relaxed text-slate-700 dark:text-slate-300 italic space-y-1">
                                <p className="font-bold text-green-700 dark:text-green-400 not-italic mb-0.5 flex items-center gap-1 text-[10px]">
                                  <Lucide.Lightbulb className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                                  Key Summary Pearls:
                                </p>
                                <p className="font-medium whitespace-pre-line leading-relaxed">{selectedCondition.clinicalNotes}</p>
                              </div>

                              <div className="space-y-2 mt-4">
                                <h3 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest">References</h3>
                                <div className="divide-y divide-slate-100">
                                  {selectedCondition.references.map((ref) => (
                                    <div key={ref.id} className="py-2 flex items-start gap-2.5 text-[9.5px]">
                                      <span className="font-semibold text-slate-400 shrink-0 font-mono">[{ref.id}]</span>
                                      <div className="flex-1">
                                        <p className="text-slate-700 font-medium leading-relaxed">
                                          {ref.text}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Footer */}
                          <footer className="absolute bottom-6 left-8 right-8 border-t border-slate-200 pt-2 flex items-center justify-between text-[8px] text-slate-400 font-medium select-none uppercase tracking-wider">
                            <span>GP EDGE Clinical Library &copy; {new Date().getFullYear()}</span>
                            <span>{selectedCondition.id} · Page {pdfPage} of {selectedCondition.document.totalPages}</span>
                          </footer>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          window.open(`/medical-library/view-pdf?id=${selectedCondition.id}`, "_blank");
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-4 bg-green-600 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-500 text-white font-bold rounded-2xl shadow-lg transition-all duration-200 active:scale-[0.98] text-sm"
                      >
                        <Lucide.ExternalLink className="w-4 h-4 shrink-0" />
                        <span>Open Standalone PDF</span>
                      </button>
                      {selectedCondition.document.downloadUrl && (
                        <a
                          href={selectedCondition.document.downloadUrl}
                          download
                          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg transition-all duration-200 active:scale-[0.98] text-sm"
                        >
                          <Lucide.Download className="w-4 h-4 shrink-0" />
                          <span>Save PDF Guidelines</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass dark:glass-strong rounded-3xl p-8 border border-slate-200/50 dark:border-slate-800/60 shadow-lg text-center text-slate-400 space-y-4">
                    <Lucide.FileWarning className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No PDF Guideline Attached</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      This clinical item is a summary note and does not have an attached PDF document. Please refer to the clinical references in the left column.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

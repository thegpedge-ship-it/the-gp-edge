"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import { bodySystems, mockConditions, MedicalCondition } from "./libraryData";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function SystemIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Lucide as any)[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

export default function MedicalLibraryPage() {
  const [conditions, setConditions] = useState<MedicalCondition[]>(mockConditions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<MedicalCondition | null>(null);
  
  // Slide-over tabs
  const [activeTab, setActiveTab] = useState<"symptoms" | "diagnosis" | "treatment" | "notes" | "pdf">("symptoms");
  
  // PDF Viewer States
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);

  // Filter conditions
  const filteredConditions = conditions.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symptoms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.author.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesSystem = selectedSystem === "all" || c.system === selectedSystem;
    const matchesType =
      selectedType === "all" ||
      (selectedType === "condition" && c.type === "Condition") ||
      (selectedType === "guideline" && c.type === "Guideline") ||
      (selectedType === "document" && c.type === "Document") ||
      (selectedType === "note" && c.type === "Note");

    return matchesSearch && matchesSystem && matchesType;
  });

  // Calculate counts for each body system category
  const getSystemCount = (systemId: string) => {
    return mockConditions.filter((c) => c.system === systemId).length;
  };

  const handleOpenCondition = (condition: MedicalCondition) => {
    setSelectedCondition(condition);
    setPdfPage(1);
    setPdfZoom(100);
    setActiveTab("symptoms");
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      
      {/* 1. Greeting Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-8 shadow-xl shadow-teal-900/10 flex items-center justify-between gap-6 flex-wrap"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/[0.04] rounded-full pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-36 h-36 bg-white/[0.03] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full">
              Read-Only Reference Library
            </span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-normal text-white tracking-tight leading-tight mb-1">
            Medical Conditions Directory
          </h1>
          <p className="text-sm text-teal-100 font-light max-w-xl">
            Browse guidelines, diagnostic criteria, clinical treatments, and structured reference documents across major body systems.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
          <span className="text-xs font-semibold text-teal-200">{conditions.length} conditions loaded</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
          </span>
        </div>
      </motion.div>

      {/* 2. Interactive Search & Type Filters */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white dark:border-slate-800 p-4 shadow-md shadow-slate-200/30 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <Lucide.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by condition, symptoms, or guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-800 dark:text-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 p-0.5"
            >
              <Lucide.X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Type Selectors */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 w-full md:w-auto overflow-x-auto">
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
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                selectedType === type.id
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200/40 dark:border-slate-600/40"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 3. Browse by Body System */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Browse by Body System
          </h2>
          {selectedSystem !== "all" && (
            <button
              onClick={() => setSelectedSystem("all")}
              className="text-xs font-semibold text-teal-600 hover:text-teal-500 flex items-center gap-1"
            >
              Reset Category
            </button>
          )}
        </div>
        
        {/* Horizontal System Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {bodySystems.map((system) => {
            const count = getSystemCount(system.id);
            const isSelected = selectedSystem === system.id;
            return (
              <button
                key={system.id}
                onClick={() => setSelectedSystem(isSelected ? "all" : system.id)}
                className={`relative group rounded-2xl p-3 border text-left flex flex-col justify-between transition-all duration-300 ${
                  isSelected
                    ? "bg-white dark:bg-slate-900 border-teal-500/80 shadow-md ring-2 ring-teal-500/20"
                    : "bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border-white dark:border-slate-800 shadow-sm hover:shadow"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${system.lightBg}`}>
                    <SystemIcon name={system.iconName} className={`w-4.5 h-4.5 ${system.textColor}`} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                    count > 0 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      : "bg-slate-50 dark:bg-slate-850/50 text-slate-400"
                  }`}>
                    {count}
                  </span>
                </div>
                <div>
                  <p className={`text-xs font-bold truncate ${
                    isSelected ? "text-teal-700 dark:text-teal-400" : "text-slate-700 dark:text-slate-350"
                  }`}>
                    {system.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    System Category
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 4. Condition Listing Cards */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Available Medical Libraries ({filteredConditions.length})
        </h2>
        
        {filteredConditions.length === 0 ? (
          <div className="bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-12 text-center max-w-lg mx-auto">
            <Lucide.Search className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <h3 className="font-serif text-lg text-slate-900 dark:text-slate-200 mt-3 font-semibold">No medical content found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your filters, system category, or searching for other symptoms.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSystem("all");
                setSelectedType("all");
              }}
              className="mt-4 px-4 py-2 bg-teal-500 text-white font-semibold text-xs rounded-full hover:bg-teal-600 transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredConditions.map((condition) => {
              const systemConfig = bodySystems.find((s) => s.id === condition.system);
              return (
                <motion.div
                  key={condition.id}
                  layoutId={`condition-card-${condition.id}`}
                  className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white dark:border-slate-800 shadow-md shadow-slate-200/30 overflow-hidden relative group hover:shadow-lg hover:border-teal-200/60 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  onClick={() => handleOpenCondition(condition)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/5 dark:to-teal-900/5 pointer-events-none" />
                  
                  {/* Left accent bar on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="p-5 relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          condition.type === "Guideline"
                            ? "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border-teal-200/40"
                            : condition.type === "Document"
                            ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200/40"
                            : condition.type === "Note"
                            ? "bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-200/40"
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/40"
                        }`}>
                          {condition.type}
                        </span>
                        
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${systemConfig?.lightBg} ${systemConfig?.textColor}`}>
                          {condition.system}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {condition.isPremium && (
                          <span className="bg-amber-100 dark:bg-amber-500/10 border border-amber-200/40 dark:border-amber-500/25 p-1 rounded-lg text-amber-600 dark:text-amber-400" title="Premium Content">
                            <Lucide.Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {condition.document && (
                          <span className="bg-sky-100 dark:bg-sky-500/10 border border-sky-200/40 dark:border-sky-500/25 p-1 rounded-lg text-sky-600 dark:text-sky-400" title="Attachment PDF available">
                            <Lucide.FileText className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-base font-semibold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug">
                      {condition.name}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 truncate">
                      {condition.category}
                    </p>

                    {/* Symptoms Quick Preview */}
                    <div className="space-y-1 mb-4">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Key Indicators</p>
                      <div className="flex flex-wrap gap-1">
                        {condition.symptoms.slice(0, 3).map((sym, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/30 dark:border-slate-700/30 truncate max-w-[150px]">
                            {sym}
                          </span>
                        ))}
                        {condition.symptoms.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5">+{condition.symptoms.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/85 flex items-center justify-between text-xs text-slate-500 dark:text-slate-450">
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Lucide.Clock className="w-3.5 h-3.5 text-slate-400" />
                      {condition.lastUpdated}
                    </span>
                    
                    <span className="text-teal-600 dark:text-teal-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Read Library
                      <Lucide.ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* 5. Detail Slide-over & Interactive PDF Viewer */}
      <AnimatePresence>
        {selectedCondition && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
              onClick={() => setSelectedCondition(null)}
            />

            {/* Slide-over Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 shadow-2xl overflow-y-auto flex flex-col"
            >
              
              {/* Header Details */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 relative bg-[#090d16] text-white">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-60 h-full bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                
                {/* Close button */}
                <button
                  onClick={() => setSelectedCondition(null)}
                  className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Lucide.X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-2 relative z-10 flex-wrap">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    {selectedCondition.type}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-355 border border-slate-700">
                    {selectedCondition.system}
                  </span>
                  {selectedCondition.isPremium && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Lucide.Lock className="w-2.5 h-2.5" />
                      Premium Library
                    </span>
                  )}
                </div>

                <h2 className="font-serif text-2xl font-bold text-white tracking-tight relative z-10 pr-10">
                  {selectedCondition.name}
                </h2>
                <p className="text-xs text-slate-400 font-light mt-1 relative z-10">
                  {selectedCondition.category} · Updated {selectedCondition.lastUpdated} by {selectedCondition.author}
                </p>
              </div>

              {/* Tabs Section */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 overflow-x-auto">
                {[
                  { id: "symptoms", label: "Symptoms" },
                  { id: "diagnosis", label: "Diagnosis" },
                  { id: "treatment", label: "Treatment" },
                  { id: "notes", label: "Clinical Notes" },
                  ...(selectedCondition.document ? [{ id: "pdf", label: "Guideline PDF" }] : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-4 py-3 text-xs font-semibold text-center transition-all border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-teal-600 dark:text-teal-400 border-teal-500 bg-teal-50/30 dark:bg-teal-950/10"
                        : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Slide-over Content Body */}
              <div className="p-6 flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                
                {/* 5A. SYMPTOMS TAB */}
                {activeTab === "symptoms" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Clinical Signs & Symptoms
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCondition.symptoms.map((symptom, i) => (
                        <div key={i} className="flex gap-2.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-3 rounded-xl shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
                            <Lucide.Check className="w-3 h-3" />
                          </span>
                          <span className="text-xs text-slate-650 dark:text-slate-350 font-medium leading-relaxed">{symptom}</span>
                        </div>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* 5B. DIAGNOSIS TAB */}
                {activeTab === "diagnosis" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Diagnosis & Assessment Criteria
                    </h3>
                    <div className="space-y-3">
                      {selectedCondition.diagnosisCriteria.map((crit, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-start gap-3">
                          <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded mt-0.5">
                            Step {i + 1}
                          </span>
                          <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-light">{crit}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5C. TREATMENT OPTIONS */}
                {activeTab === "treatment" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Management & Treatment Regimen
                    </h3>
                    <div className="space-y-3">
                      {selectedCondition.treatmentOptions.map((opt, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-l-teal-500">
                          <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-medium">{opt}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5D. CLINICAL NOTES TAB & REFERENCES */}
                {activeTab === "notes" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 rounded-xl p-5">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Lucide.Lightbulb className="w-4 h-4 text-amber-500 shrink-0" /> Clinical Pearls & Guidelines
                      </h4>
                      <p className="text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed font-light whitespace-pre-line">
                        {selectedCondition.clinicalNotes}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Clinical References ({selectedCondition.references.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedCondition.references.map((ref) => (
                          <div key={ref.id} className="flex gap-2.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                            <span className="bg-slate-100 dark:bg-slate-800 w-5 h-5 rounded flex items-center justify-center shrink-0 font-bold text-[10px]">
                              {ref.id}
                            </span>
                            <div className="flex-1">
                              <p className="leading-snug">{ref.text}</p>
                              {ref.url && (
                                <a href={ref.url} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline mt-1 inline-block text-[11px] font-semibold">
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

                {/* 5E. HIGH FIDELITY PDF VIEWER TAB */}
                {activeTab === "pdf" && selectedCondition.document && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col h-full space-y-4"
                  >
                    
                    {/* PDF Toolbar */}
                    <div className="bg-[#0f172a] text-slate-200 rounded-xl px-4 py-2.5 border border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap shadow-md">
                      <div className="flex items-center gap-2">
                        <Lucide.FileText className="w-4 h-4 text-red-500" />
                        <span className="font-semibold truncate max-w-[200px] text-slate-300" title={selectedCondition.document.filename}>
                          {selectedCondition.document.filename}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                          {selectedCondition.document.fileSize}
                        </span>
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                          disabled={pdfPage === 1}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Lucide.ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-xs">
                          Page {pdfPage} of {selectedCondition.document.totalPages}
                        </span>
                        <button
                          onClick={() => setPdfPage((p) => Math.min(selectedCondition.document!.totalPages, p + 1))}
                          disabled={pdfPage === selectedCondition.document.totalPages}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Lucide.ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Zoom controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPdfZoom((z) => Math.max(50, z - 10))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-sm font-bold"
                          title="Zoom Out"
                        >
                          <Lucide.Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono w-10 text-center text-[11px]">{pdfZoom}%</span>
                        <button
                          onClick={() => setPdfZoom((z) => Math.min(200, z + 10))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-sm font-bold"
                          title="Zoom In"
                        >
                          <Lucide.Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => alert("Simulating PDF download...")}
                          className="p-1.5 rounded-lg hover:bg-slate-800"
                          title="Download PDF"
                        >
                          <Lucide.Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* PDF Pages rendering simulator */}
                    <div className="border border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg bg-[#525659] p-4 flex justify-center overflow-auto max-h-[500px]">
                      
                      {/* Paper Document Mockup */}
                      <div
                        className="bg-white text-slate-800 p-8 sm:p-12 shadow-xl border border-slate-400 relative origin-top transition-all duration-300"
                        style={{
                          transform: `scale(${pdfZoom / 100})`,
                          width: "600px",
                          minHeight: "750px",
                          marginBottom: `${Math.max(0, (pdfZoom - 100) * 6)}px`,
                        }}
                      >
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.03] rotate-45">
                          <span className="font-sans font-black text-6xl tracking-widest text-slate-800">
                            THE GP EDGE
                          </span>
                        </div>

                        {/* Page header */}
                        <div className="flex items-center justify-between border-b-2 border-teal-600 pb-4 mb-6 text-[10px] text-slate-500 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 bg-teal-600 text-white rounded flex items-center justify-center text-xs font-bold">
                              GP
                            </span>
                            <span>The GP Edge OS Reference Guideline</span>
                          </div>
                          <span>CONFIDENTIAL CLINICAL RECORD</span>
                        </div>

                        {/* PDF Pages Content Selector */}
                        {pdfPage === 1 && (
                          <div className="space-y-6">
                            <div className="text-center">
                              <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">
                                SECTION 1 // EXECUTIVE CLINICAL SUMMARY
                              </span>
                              <h2 className="font-serif text-2xl font-normal text-slate-900 leading-tight mt-1">
                                {selectedCondition.name} Clinical Outline
                              </h2>
                              <p className="text-[11px] text-slate-500 mt-1 italic">
                                Document Reference: {selectedCondition.id} · Category: {selectedCondition.category}
                              </p>
                            </div>

                            <div className="space-y-4 text-xs leading-relaxed font-light text-slate-700">
                              <div>
                                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">1.1 Document Scope</h4>
                                <p>{selectedCondition.document.summary}</p>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">1.2 Baseline Clinical Criteria</h4>
                                <p>
                                  Symptoms and criteria guidelines evaluated inside this document represent consensus statements from Australian clinical bodies (including RACGP, Heart Foundation, RANZCOG, RCH, and local state networks). Clinical judgment must govern individual application of targets and treatments.
                                </p>
                              </div>

                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-[11px] space-y-1.5">
                                <p className="font-bold text-slate-800 flex items-center gap-1">
                                  <Lucide.Info className="w-4 h-4 text-teal-600" /> Medical Directory System Tags:
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-slate-650">
                                  <li>Category Class: {selectedCondition.category}</li>
                                  <li>System Area: {selectedCondition.system}</li>
                                  <li>Authoring Board: {selectedCondition.author}</li>
                                  <li>Revision Level: 2026.1 (Latest)</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {pdfPage === 2 && (
                          <div className="space-y-6">
                            <div>
                              <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">
                                SECTION 2 // DIAGNOSTIC PATHWAY & EVALUATION
                              </span>
                              <h2 className="font-serif text-xl font-normal text-slate-900 mt-1">
                                Diagnostic Criteria Matrix
                              </h2>
                            </div>

                            <div className="space-y-4 text-xs leading-relaxed font-light text-slate-700">
                              <p>The following criteria must be evaluated sequentially. Confirm pathology readings against standardized medical laboratory values.</p>
                              
                              <table className="w-full border-collapse border border-slate-250 text-[11px] mt-2">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-250">
                                    <th className="border border-slate-250 p-2 text-left">Criteria Stage</th>
                                    <th className="border border-slate-250 p-2 text-left">Clinical Indicator</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedCondition.diagnosisCriteria.map((crit, idx) => (
                                    <tr key={idx} className="border-b border-slate-200">
                                      <td className="border border-slate-250 p-2 font-bold text-slate-900">Stage {idx + 1}</td>
                                      <td className="border border-slate-250 p-2">{crit}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {pdfPage === 3 && (
                          <div className="space-y-6">
                            <div>
                              <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">
                                SECTION 3 // MANAGEMENT FLOWCHART
                              </span>
                              <h2 className="font-serif text-xl font-normal text-slate-900 mt-1">
                                Recommended Treatment Hierarchy
                              </h2>
                            </div>

                            <div className="space-y-4 text-xs leading-relaxed font-light text-slate-700">
                              <div className="border border-teal-500 rounded-lg bg-teal-50/20 p-4 space-y-2">
                                <span className="text-[10px] font-bold text-teal-700 uppercase">FIRST LINE INTERVENTIONS</span>
                                <p className="font-bold text-slate-800 text-[11px]">{selectedCondition.treatmentOptions[0] || "Lifestyle optimization, patient education, baseline reviews."}</p>
                              </div>

                              <div className="text-center font-bold text-slate-400 text-lg">↓</div>

                              <div className="border border-amber-500 rounded-lg bg-amber-50/20 p-4 space-y-2">
                                <span className="text-[10px] font-bold text-amber-700 uppercase">SECOND LINE PHARMACOTHERAPY ADD-ON</span>
                                <p className="font-bold text-slate-800 text-[11px]">{selectedCondition.treatmentOptions[1] || "Targeted prescription therapies, titrate dosages, evaluate side-effect profiles."}</p>
                              </div>

                              <div className="text-center font-bold text-slate-400 text-lg">↓</div>

                              <div className="border border-rose-500 rounded-lg bg-rose-50/20 p-4 space-y-2">
                                <span className="text-[10px] font-bold text-rose-700 uppercase">THIRD LINE CLINICAL REFERRAL & TEAM CARE</span>
                                <p className="font-bold text-slate-800 text-[11px]">{selectedCondition.treatmentOptions[2] || "Consultation with cardiology/endocrine specialists and team care pathways."}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {pdfPage > 3 && (
                          <div className="space-y-6 text-center py-20 text-slate-400 text-xs font-light">
                            <Lucide.FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                            <p className="font-bold text-slate-650">Appendix and references page</p>
                            <p className="max-w-xs mx-auto text-[11px] mt-1">For references, review the detailed Clinical References tab in the slide-over selector.</p>
                          </div>
                        )}

                        {/* Page footer */}
                        <div className="absolute bottom-6 left-12 right-12 flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-3">
                          <span>The GP Edge Clinical Library</span>
                          <span>Page {pdfPage} of {selectedCondition.document.totalPages}</span>
                        </div>

                      </div>
                    </div>
                  </motion.div>
                )}

              </div>
              
              {/* Footer */}
              <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedCondition(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850"
                >
                  Close Reference
                </button>
                <button
                  onClick={() => {
                    alert(`Printing: ${selectedCondition.name} summary`);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow transition"
                >
                  Print Summary
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

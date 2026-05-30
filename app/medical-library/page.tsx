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

// System-specific premium glow helpers
const getSystemGlowClass = (systemId: string) => {
  switch (systemId) {
    case "Cardiology": return "from-rose-500/10 dark:from-rose-500/20";
    case "Respiratory": return "from-sky-500/10 dark:from-sky-500/20";
    case "Endocrine": return "from-violet-500/10 dark:from-violet-500/20";
    case "Gastrointestinal": return "from-amber-500/10 dark:from-amber-500/20";
    case "Psychiatry": return "from-indigo-500/10 dark:from-indigo-500/20";
    case "Dermatology": return "from-emerald-500/10 dark:from-emerald-500/20";
    case "Women's Health": return "from-fuchsia-500/10 dark:from-fuchsia-500/20";
    case "Paediatrics": return "from-teal-500/10 dark:from-teal-500/20";
    default: return "from-teal-500/10 dark:from-teal-500/20";
  }
};

const getSystemHoverBorderClass = (systemId: string) => {
  switch (systemId) {
    case "Cardiology": return "hover:border-rose-400/80 dark:hover:border-rose-800/50";
    case "Respiratory": return "hover:border-sky-400/80 dark:hover:border-sky-800/50";
    case "Endocrine": return "hover:border-violet-400/80 dark:hover:border-violet-800/50";
    case "Gastrointestinal": return "hover:border-amber-400/80 dark:hover:border-amber-800/50";
    case "Psychiatry": return "hover:border-indigo-400/80 dark:hover:border-indigo-800/50";
    case "Dermatology": return "hover:border-emerald-400/80 dark:hover:border-emerald-800/50";
    case "Women's Health": return "hover:border-fuchsia-400/80 dark:hover:border-fuchsia-800/50";
    case "Paediatrics": return "hover:border-teal-400/80 dark:hover:border-teal-800/50";
    default: return "hover:border-teal-400/80 dark:hover:border-teal-800/50";
  }
};

const getSystemTextClass = (systemId: string) => {
  switch (systemId) {
    case "Cardiology": return "text-rose-600 dark:text-rose-400";
    case "Respiratory": return "text-sky-600 dark:text-sky-400";
    case "Endocrine": return "text-violet-600 dark:text-violet-400";
    case "Gastrointestinal": return "text-amber-600 dark:text-amber-400";
    case "Psychiatry": return "text-indigo-600 dark:text-indigo-400";
    case "Dermatology": return "text-emerald-600 dark:text-emerald-400";
    case "Women's Health": return "text-fuchsia-600 dark:text-fuchsia-400";
    case "Paediatrics": return "text-teal-600 dark:text-teal-400";
    default: return "text-teal-600 dark:text-teal-400";
  }
};

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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-10 font-sans">
      
      {/* 1. Greeting / Hero Header */}
      <div className="relative">
        <div className="text-center lg:text-left">
          {/* Eyebrow Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/50 dark:border-teal-900/30 mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
              Reference Library
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="font-sans text-[2.5rem] sm:text-[3.25rem] lg:text-[3.75rem] font-bold text-slate-900 dark:text-white leading-[1.05] tracking-[-0.03em] mb-4"
          >
            Explore the{" "}
            <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Medical Directory
            </span>
          </motion.h1>

          {/* Subheading with total conditions */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-6">
            <p className="text-lg text-slate-650 dark:text-slate-400 max-w-2xl leading-relaxed tracking-[-0.01em]">
              Browse official guidelines, diagnostic criteria, treatment options, and clinical summaries. 
              Currently hosting <span className="font-semibold text-teal-600 dark:text-teal-400">{conditions.length} conditions</span> across major body systems.
            </p>
          </motion.div>
        </div>
      </div>

      {/* 2. Interactive Search & Type Filters */}
      <motion.div 
        variants={itemVariants} 
        className="relative p-5 rounded-[2rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 shadow-2xl ring-1 ring-slate-900/5 flex flex-col lg:flex-row gap-4 items-center justify-between"
      >
        {/* Search Bar */}
        <div className="relative w-full lg:max-w-md">
          <Lucide.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by condition, symptoms, or guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-sm bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-450 transition-all text-slate-800 dark:text-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 p-0.5"
            >
              <Lucide.X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Type Selectors */}
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
              className={`px-4.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all duration-200 ${
                selectedType === type.id
                  ? "bg-teal-650 text-white dark:bg-teal-500 dark:text-slate-950 shadow-md shadow-teal-600/15"
                  : "text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-250 hover:bg-white/80 dark:hover:bg-slate-800/80"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 3. Browse by Body System */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Browse by Body System
          </h2>
          {selectedSystem !== "all" && (
            <button
              onClick={() => setSelectedSystem("all")}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-505 flex items-center gap-1"
            >
              Reset Category
            </button>
          )}
        </div>
        
        {/* Horizontal System Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {bodySystems.map((system) => {
            const count = getSystemCount(system.id);
            const isSelected = selectedSystem === system.id;
            return (
              <button
                key={system.id}
                onClick={() => setSelectedSystem(isSelected ? "all" : system.id)}
                className={`relative group rounded-2xl p-5 border text-left flex flex-col justify-between transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? "bg-gradient-to-br from-teal-500 via-teal-500 to-emerald-600 text-white shadow-xl shadow-teal-500/20 border-teal-400/30"
                    : "bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 shadow-md hover:shadow-lg hover:border-teal-350 dark:hover:border-teal-800/60"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-teal-500/0 group-hover:from-teal-500/5 dark:group-hover:from-teal-500/10 group-hover:to-emerald-500/5 dark:group-hover:to-emerald-500/10 transition-all duration-400 pointer-events-none rounded-2xl" />
                <div className="flex justify-between items-start mb-4 relative z-10 w-full">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? "bg-white/20 text-white" : system.lightBg
                  }`}>
                    <SystemIcon name={system.iconName} className={`w-5 h-5 ${isSelected ? "text-white" : system.textColor}`} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : count > 0 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350"
                      : "bg-slate-50 dark:bg-slate-850/50 text-slate-400"
                  }`}>
                    {count}
                  </span>
                </div>
                <div className="relative z-10">
                  <p className={`text-xs font-bold truncate ${
                    isSelected ? "text-white" : "text-slate-800 dark:text-slate-200"
                  }`}>
                    {system.name}
                  </p>
                  <p className={`text-[10px] mt-0.5 truncate ${
                    isSelected ? "text-teal-100" : "text-slate-400 dark:text-slate-500"
                  }`}>
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
            <h3 className="font-sans text-lg text-slate-900 dark:text-slate-200 mt-3 font-bold tracking-tight">No medical content found</h3>
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
                  className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-md shadow-slate-200/20 dark:shadow-black/45 overflow-hidden relative group hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col justify-between ${getSystemHoverBorderClass(condition.system)}`}
                  onClick={() => handleOpenCondition(condition)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 pointer-events-none" />
                  
                  {/* Premium System Glow Orb */}
                  <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${getSystemGlowClass(condition.system)} to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />
                  
                  <div className="p-5 relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Header */}
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
                            <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg text-slate-500 dark:text-slate-400" title="Premium Content">
                              <Lucide.Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {condition.document && (
                            <span className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200/30 dark:border-teal-900/30 p-1 rounded-lg text-teal-650 dark:text-teal-400" title="Attachment PDF available">
                              <Lucide.FileText className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className={`font-sans text-base font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:${getSystemTextClass(condition.system)} transition-colors leading-snug tracking-tight`}>
                        {condition.name}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 truncate font-medium">
                        {condition.category}
                      </p>
                    </div>

                    {/* Symptoms Quick Preview */}
                    <div className="space-y-1.5 mt-auto">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Key Indicators</p>
                      <div className="flex flex-wrap gap-1">
                        {condition.symptoms.slice(0, 3).map((sym, i) => (
                          <span key={i} className="text-[10px] bg-slate-100/80 dark:bg-slate-800/80 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/30 dark:border-slate-700/30 truncate max-w-[150px]">
                            {sym}
                          </span>
                        ))}
                        {condition.symptoms.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-1 py-0.5">+{condition.symptoms.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-450 relative z-10">
                    <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                      <Lucide.Clock className="w-3.5 h-3.5" />
                      {condition.lastUpdated}
                    </span>
                    
                    <span className={`font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs ${getSystemTextClass(condition.system)}`}>
                      Read Library
                      <Lucide.ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Premium Bento-style Accent Bar Micro-animation */}
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100 dark:bg-slate-850 overflow-hidden">
                    <div className={`h-full w-12 rounded-full transition-all duration-500 group-hover:w-24 ${
                      condition.system === "Cardiology" ? "bg-rose-500" :
                      condition.system === "Respiratory" ? "bg-sky-500" :
                      condition.system === "Endocrine" ? "bg-violet-500" :
                      condition.system === "Gastrointestinal" ? "bg-amber-500" :
                      condition.system === "Psychiatry" ? "bg-indigo-500" :
                      condition.system === "Dermatology" ? "bg-emerald-500" :
                      condition.system === "Women's Health" ? "bg-fuchsia-500" :
                      "bg-teal-500"
                    }`} />
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white/95 dark:bg-slate-955/95 backdrop-blur-3xl border-l border-slate-200/60 dark:border-slate-800/80 z-50 shadow-2xl overflow-y-auto flex flex-col"
            >
              
              {/* Header Details */}
              <div className="p-6 border-b border-slate-200/60 dark:border-slate-800/80 relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[size:16px_16px] opacity-60 pointer-events-none" />
                
                {/* Close button */}
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

              {/* Tabs Section */}
              <div className="flex border-b border-slate-200/60 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-md sticky top-0 z-10 overflow-x-auto">
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
                    className={`flex-1 px-4 py-3.5 text-xs font-bold text-center transition-all border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-teal-650 dark:text-teal-400 border-teal-500 dark:border-teal-400 bg-teal-500/5 dark:bg-teal-400/5"
                        : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Slide-over Content Body */}
              <div className="p-6 flex-1 bg-slate-50/40 dark:bg-slate-955/40 backdrop-blur-md text-slate-800 dark:text-slate-250">
                
                {/* 5A. SYMPTOMS TAB */}
                {activeTab === "symptoms" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Clinical Signs & Symptoms
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCondition.symptoms.map((symptom, i) => {
                        const systemConfig = bodySystems.find((s) => s.id === selectedCondition.system);
                        return (
                          <div key={i} className="flex gap-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-850/80 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <span className={`w-5 h-5 rounded-full ${systemConfig?.lightBg || 'bg-teal-50 dark:bg-teal-950/30'} ${systemConfig?.textColor || 'text-teal-600 dark:text-teal-400'} font-bold text-xs flex items-center justify-center shrink-0`}>
                              <Lucide.Check className="w-3 h-3" />
                            </span>
                            <span className="text-xs text-slate-700 dark:text-slate-350 font-medium leading-relaxed">{symptom}</span>
                          </div>
                        );
                      })}
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
                      {selectedCondition.diagnosisCriteria.map((crit, i) => {
                        const systemConfig = bodySystems.find((s) => s.id === selectedCondition.system);
                        return (
                          <div key={i} className="bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-850/80 p-4 rounded-xl shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow">
                            <span className={`text-xs font-mono font-bold ${systemConfig?.textColor || 'text-teal-600 dark:text-teal-400'} ${systemConfig?.lightBg || 'bg-teal-50 dark:bg-teal-950/20'} px-2 py-0.5 rounded mt-0.5`}>
                              Step {i + 1}
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-normal">{crit}</p>
                          </div>
                        );
                      })}
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
                        <div key={i} className={`bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-850/80 p-4 rounded-xl shadow-sm border-l-4 ${
                          selectedCondition.system === "Cardiology" ? "border-l-rose-500" :
                          selectedCondition.system === "Respiratory" ? "border-l-sky-500" :
                          selectedCondition.system === "Endocrine" ? "border-l-violet-500" :
                          selectedCondition.system === "Gastrointestinal" ? "border-l-amber-500" :
                          selectedCondition.system === "Psychiatry" ? "border-l-indigo-500" :
                          selectedCondition.system === "Dermatology" ? "border-l-emerald-500" :
                          selectedCondition.system === "Women's Health" ? "border-l-fuchsia-500" :
                          "border-l-teal-500"
                        } hover:shadow-md transition-shadow`}>
                          <p className="text-xs text-slate-750 dark:text-slate-300 leading-relaxed font-medium">{opt}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5D. CLINICAL NOTES TAB & REFERENCES */}
                {activeTab === "notes" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl p-5 shadow-sm">
                      <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Lucide.Lightbulb className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" /> Clinical Pearls & Guidelines
                      </h4>
                      <p className="text-xs text-slate-750 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                        {selectedCondition.clinicalNotes}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Clinical References ({selectedCondition.references.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedCondition.references.map((ref) => (
                          <div key={ref.id} className="flex gap-2.5 bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-850/80 p-3.5 rounded-xl text-xs text-slate-750 dark:text-slate-400 hover:shadow-md transition-shadow">
                            <span className="bg-slate-100 dark:bg-slate-800 w-5 h-5 rounded flex items-center justify-center shrink-0 font-bold text-[10px] text-slate-500 dark:text-slate-450">
                              {ref.id}
                            </span>
                            <div className="flex-1">
                              <p className="leading-snug font-medium">{ref.text}</p>
                              {ref.url && (
                                <a href={ref.url} target="_blank" rel="noreferrer" className="text-teal-650 dark:text-teal-400 hover:underline mt-1.5 inline-block text-[11px] font-semibold">
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
                    <div className="bg-slate-950 text-slate-200 rounded-xl px-4 py-3 border border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap shadow-lg">
                      <div className="flex items-center gap-2">
                        <Lucide.FileText className="w-4 h-4 text-red-500 animate-pulse" />
                        <span className="font-semibold truncate max-w-[200px] text-slate-350" title={selectedCondition.document.filename}>
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
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Lucide.ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-xs">
                          Page {pdfPage} of {selectedCondition.document.totalPages}
                        </span>
                        <button
                          onClick={() => setPdfPage((p) => Math.min(selectedCondition.document!.totalPages, p + 1))}
                          disabled={pdfPage === selectedCondition.document.totalPages}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Lucide.ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Zoom controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPdfZoom((z) => Math.max(50, z - 10))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-850 text-sm font-bold"
                          title="Zoom Out"
                        >
                          <Lucide.Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono w-10 text-center text-[11px]">{pdfZoom}%</span>
                        <button
                          onClick={() => setPdfZoom((z) => Math.min(200, z + 10))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-850 text-sm font-bold"
                          title="Zoom In"
                        >
                          <Lucide.Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => alert("Simulating PDF download...")}
                          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Download PDF"
                        >
                          <Lucide.Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* PDF Pages rendering simulator */}
                    <div className="border border-slate-200 dark:border-slate-850/80 rounded-xl overflow-hidden shadow-2xl bg-slate-100/60 dark:bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 flex justify-center overflow-auto max-h-[550px]">
                      
                      {/* Paper Document Mockup */}
                      <div
                        className="bg-white text-slate-850 p-8 sm:p-12 shadow-2xl border border-slate-250 relative origin-top transition-all duration-300 rounded-md"
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
                        <div className="flex items-center justify-between border-b-2 border-teal-650 pb-4 mb-6 text-[10px] text-slate-500 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 bg-teal-650 text-white rounded flex items-center justify-center text-xs font-bold">
                              GP
                            </span>
                            <span>The GP Edge Clinical Reference Guideline</span>
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
                              <h2 className="font-sans text-2xl font-bold text-slate-900 leading-tight mt-1">
                                {selectedCondition.name} Clinical Outline
                              </h2>
                              <p className="text-[11px] text-slate-500 mt-1 italic">
                                Document Reference: {selectedCondition.id} · Category: {selectedCondition.category}
                              </p>
                            </div>

                            <div className="space-y-4 text-xs leading-relaxed font-normal text-slate-700">
                              <div>
                                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">1.1 Document Scope</h4>
                                <p className="font-light">{selectedCondition.document.summary}</p>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">1.2 Baseline Clinical Criteria</h4>
                                <p className="font-light">
                                  Symptoms and criteria guidelines evaluated inside this document represent consensus statements from Australian clinical bodies (including RACGP, Heart Foundation, RANZCOG, RCH, and local state networks). Clinical judgment must govern individual application of targets and treatments.
                                </p>
                              </div>

                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-[11px] space-y-1.5">
                                <p className="font-bold text-slate-800 flex items-center gap-1">
                                  <Lucide.Info className="w-4 h-4 text-teal-650" /> Medical Directory System Tags:
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-slate-650 font-medium">
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
                              <h2 className="font-sans text-xl font-bold text-slate-900 mt-1">
                                Diagnostic Criteria Matrix
                              </h2>
                            </div>

                            <div className="space-y-4 text-xs leading-relaxed font-light text-slate-750">
                              <p className="font-normal text-slate-700">The following criteria must be evaluated sequentially. Confirm pathology readings against standardized medical laboratory values.</p>
                              
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
                                      <td className="border border-slate-250 p-2 font-normal text-slate-700">{crit}</td>
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
                              <h2 className="font-sans text-xl font-bold text-slate-900 mt-1">
                                Recommended Treatment Hierarchy
                              </h2>
                            </div>

                            <div className="space-y-4 text-xs leading-relaxed font-light text-slate-750">
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
              <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/80 flex justify-end gap-2.5">
                <button
                  onClick={() => setSelectedCondition(null)}
                  className="px-4.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-250 dark:border-slate-800/80 rounded-xl hover:bg-slate-150 dark:hover:bg-slate-900 transition-all active:scale-[0.98]"
                >
                  Close Reference
                </button>
                <button
                  onClick={() => {
                    alert(`Printing: ${selectedCondition.name} summary`);
                  }}
                  className="px-4.5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-lg shadow-teal-600/15 hover:shadow-teal-600/25 transition-all active:scale-[0.98]"
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

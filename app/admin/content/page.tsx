"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

interface MedicalContent {
  id: number;
  name: string;
  category: string;
  system: string;
  type: "Condition" | "Guideline" | "Protocol" | "Pathway" | "Document" | "Note";
  status: "published" | "draft" | "review";
  lastUpdated: string;
  author: string;
  references: number;
  usedInQuestions: number;
}

const mockContent: MedicalContent[] = [
  { id: 1, name: "Type 2 Diabetes Management", category: "Chronic Disease", system: "Endocrine", type: "Guideline", status: "published", lastUpdated: "28 May 2026", author: "Dr. Arun Mehta", references: 12, usedInQuestions: 34 },
  { id: 2, name: "Acute Coronary Syndrome", category: "Emergency", system: "Cardiovascular", type: "Protocol", status: "published", lastUpdated: "25 May 2026", author: "Siddhant Udavant", references: 18, usedInQuestions: 47 },
  { id: 3, name: "Childhood Immunisation Schedule", category: "Preventive", system: "Paediatrics", type: "Guideline", status: "published", lastUpdated: "22 May 2026", author: "Dr. Arun Mehta", references: 8, usedInQuestions: 21 },
  { id: 4, name: "Depression Screening & Management", category: "Mental Health", system: "Psychiatry", type: "Pathway", status: "review", lastUpdated: "20 May 2026", author: "Jessica Park", references: 15, usedInQuestions: 28 },
  { id: 5, name: "Asthma Action Plan", category: "Chronic Disease", system: "Respiratory", type: "Protocol", status: "published", lastUpdated: "18 May 2026", author: "Dr. Arun Mehta", references: 9, usedInQuestions: 19 },
  { id: 6, name: "Melanoma Detection & Referral", category: "Skin Cancer", system: "Dermatology", type: "Pathway", status: "draft", lastUpdated: "15 May 2026", author: "Jessica Park", references: 6, usedInQuestions: 8 },
  { id: 7, name: "Antenatal Care Schedule", category: "Obstetrics", system: "Women's Health", type: "Guideline", status: "published", lastUpdated: "12 May 2026", author: "Siddhant Udavant", references: 14, usedInQuestions: 16 },
  { id: 8, name: "GORD Management Algorithm", category: "GI", system: "Gastroenterology", type: "Pathway", status: "review", lastUpdated: "10 May 2026", author: "Dr. Arun Mehta", references: 7, usedInQuestions: 12 },
  { id: 9, name: "Red Flags in Back Pain", category: "MSK", system: "Musculoskeletal", type: "Protocol", status: "published", lastUpdated: "8 May 2026", author: "Siddhant Udavant", references: 11, usedInQuestions: 23 },
  { id: 10, name: "MBS Item 721 — GPMP Guide", category: "Billing", system: "MBS", type: "Guideline", status: "draft", lastUpdated: "5 May 2026", author: "Jessica Park", references: 4, usedInQuestions: 9 },
];

const typeColors: Record<string, string> = {
  Condition: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40",
  Guideline: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-800/40",
  Protocol: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/40",
  Pathway: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/60",
  Document: "bg-emerald-50/50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/10 dark:text-emerald-350 dark:border-emerald-900/20",
  Note: "bg-teal-50/50 text-teal-800 border-teal-100 dark:bg-teal-950/10 dark:text-teal-350 dark:border-teal-900/20",
};

export default function ContentPage() {
  const [content, setContent] = useState(mockContent);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContent, setSelectedContent] = useState<MedicalContent | null>(null);

  // Content Upload Modal Wizard
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState<"select" | "condition" | "document" | "note">("select");
  
  // New entry states
  const [newTitle, setNewTitle] = useState("");
  const [newSystem, setNewSystem] = useState("Endocrine");
  const [newCategory, setNewCategory] = useState("");
  
  // Custom Condition items
  const [symptomsInput, setSymptomsInput] = useState("");
  const [treatmentInput, setTreatmentInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  // PDF upload simulation
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success">("idle");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");

  const systems = Array.from(new Set(content.map((c) => c.system)));

  const filtered = content.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.system.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSystem = systemFilter === "all" || c.system === systemFilter;
    const matchType = typeFilter === "all" || c.type === typeFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchSystem && matchType && matchStatus;
  });

  const updateStatus = (id: number, newStatus: MedicalContent["status"]) => {
    setContent((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
  };

  // Reset Modal Form
  const resetForm = () => {
    setNewTitle("");
    setNewSystem("Endocrine");
    setNewCategory("");
    setSymptomsInput("");
    setTreatmentInput("");
    setNotesInput("");
    setUploadProgress(0);
    setUploadState("idle");
    setUploadedFileName("");
    setUploadedFileSize("");
    setModalStep("select");
  };

  // Trigger File Upload simulation
  const simulateFileUpload = () => {
    setUploadState("uploading");
    setUploadProgress(0);
    setUploadedFileName("Clinical_Guideline_Ref_" + Math.floor(Math.random() * 900 + 100) + ".pdf");
    setUploadedFileSize((Math.random() * 1.5 + 0.5).toFixed(1) + " MB");
  };

  // Handle uploading progress bar loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (uploadState === "uploading") {
      timer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setUploadState("success");
            return 100;
          }
          return prev + 10;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [uploadState]);

  // Submit and save content
  const handleSaveContent = (type: MedicalContent["type"]) => {
    if (!newTitle.trim()) {
      alert("Please fill in the title field.");
      return;
    }

    const newItem: MedicalContent = {
      id: content.length + 1,
      name: newTitle,
      system: newSystem,
      category: newCategory.trim() || "Clinical Reference",
      type: type,
      status: "published",
      lastUpdated: "Just now",
      author: "Dr. Siddhant Udavant",
      references: type === "Condition" ? 3 : 1,
      usedInQuestions: 0,
    };

    setContent((prev) => [newItem, ...prev]);
    setShowAddModal(false);
    resetForm();
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-8 shadow-xl shadow-teal-900/10 flex items-center justify-between gap-6 flex-wrap"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/[0.04] rounded-full pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-36 h-36 bg-white/[0.03] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-serif text-2xl lg:text-3xl font-normal text-white tracking-tight leading-tight mb-1">Medical Content</h1>
          <p className="text-sm text-teal-100 font-light">Clinical guidelines, protocols, and care pathways</p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            <span className="text-xs font-semibold text-teal-200">{content.length} items</span>
          </div>
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-4 py-2.5 bg-white text-sm font-semibold text-teal-800 rounded-full hover:bg-teal-50 transition-all shadow-sm flex items-center gap-2"
          >
            <Lucide.Plus className="w-4 h-4" />
            Add Content
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Guidelines", value: content.filter((c) => c.type === "Guideline").length, icon: <Lucide.Clipboard className="w-5 h-5" />, color: "text-teal-600 dark:text-teal-400" },
          { label: "Protocols / Conditions", value: content.filter((c) => c.type === "Protocol" || c.type === "Condition").length, icon: <Lucide.Zap className="w-5 h-5" />, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Documents / PDFs", value: content.filter((c) => c.type === "Document" || c.type === "Pathway").length, icon: <Lucide.GitMerge className="w-5 h-5" />, color: "text-green-600 dark:text-green-400" },
          { label: "Linked Questions", value: content.reduce((sum, c) => sum + c.usedInQuestions, 0), icon: <Lucide.Link className="w-5 h-5" />, color: "text-slate-600 dark:text-slate-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white dark:border-slate-800 p-4 shadow-md shadow-slate-200/30 relative overflow-hidden group hover:shadow-lg hover:border-teal-200/60 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/5 dark:to-teal-900/5 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3">
              <span className={`text-slate-500 ${s.color}`}>{s.icon}</span>
              <div>
                <p className={`text-2xl font-serif ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all dark:text-slate-200" />
        </div>
        <select value={systemFilter} onChange={(e) => setSystemFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600 dark:text-slate-350">
          <option value="all">All Systems</option>
          {systems.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600 dark:text-slate-355">
          <option value="all">All Types</option>
          <option value="Condition">Condition</option>
          <option value="Guideline">Guideline</option>
          <option value="Protocol">Protocol</option>
          <option value="Pathway">Pathway</option>
          <option value="Document">Document</option>
          <option value="Note">Note</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600 dark:text-slate-355">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="review">Review</option>
          <option value="draft">Draft</option>
        </select>
      </motion.div>

      {/* Content cards grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white dark:border-slate-800 shadow-md shadow-slate-200/30 overflow-hidden relative group hover:shadow-lg hover:border-teal-200/60 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-300 cursor-pointer"
            onClick={() => setSelectedContent(item)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 dark:to-teal-900/5 pointer-events-none" />
            <div className="relative z-10 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColors[item.type]}`}>{item.type}</span>
                  <StatusBadge variant={item.status} />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{item.lastUpdated}</span>
              </div>
              <h3 className="font-serif text-base text-slate-900 dark:text-slate-100 mb-1 leading-tight group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">{item.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{item.system} · {item.category}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 text-xs text-slate-505">
                  <span className="flex items-center gap-1">
                    <Lucide.Link className="w-3.5 h-3.5 text-slate-400" />
                    {item.references} refs
                  </span>
                  <span className="flex items-center gap-1">
                    <Lucide.HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    {item.usedInQuestions} Q
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  {item.status === "draft" && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(item.id, "review"); }} className="p-1 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all" title="Send to Review">
                      <Lucide.ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {item.status === "review" && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(item.id, "published"); }} className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all" title="Publish">
                      <Lucide.Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Content Upload wizard Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-50 cursor-pointer" onClick={() => setShowAddModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-y-auto flex flex-col"
            >
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#090d16] text-white">
                <div>
                  <h3 className="font-serif text-lg font-bold">Add Clinical Content</h3>
                  <p className="text-xs text-slate-400">Create new directory elements, PDFs, or summaries</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition">
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 flex-1">
                
                {/* STEP 1: Select Type */}
                {modalStep === "select" && (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Select Content Type</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => { setModalStep("condition"); }}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/80 hover:bg-teal-50/10 transition-all text-left flex items-start gap-4 group"
                      >
                        <span className="bg-teal-50 dark:bg-teal-950/20 p-2.5 rounded-xl group-hover:scale-105 transition">
                          <Lucide.Stethoscope className="w-6 h-6 text-teal-650" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition">Clinical Condition / Guideline</h4>
                          <p className="text-xs text-slate-505 dark:text-slate-400 mt-0.5">Input diagnostic criteria, treatments, clinical notes, and resources.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { setModalStep("document"); }}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/80 hover:bg-emerald-50/10 transition-all text-left flex items-start gap-4 group"
                      >
                        <span className="bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl group-hover:scale-105 transition">
                          <Lucide.FileText className="w-6 h-6 text-emerald-600" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition">Clinical Document (PDF)</h4>
                          <p className="text-xs text-slate-505 dark:text-slate-400 mt-0.5">Upload a clinical guide, chart, or official PDF summary sheet.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { setModalStep("note"); }}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-green-500/80 hover:bg-green-50/10 transition-all text-left flex items-start gap-4 group"
                      >
                        <span className="bg-green-50 dark:bg-green-950/20 p-2.5 rounded-xl group-hover:scale-105 transition">
                          <Lucide.FileText className="w-6 h-6 text-green-650" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-green-600 transition">Structured Note</h4>
                          <p className="text-xs text-slate-505 dark:text-slate-400 mt-0.5">Draft simple clinical summaries, bulletins, or references.</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2A: Create Condition */}
                {modalStep === "condition" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Condition Name</label>
                        <input type="text" placeholder="e.g. Chronic Kidney Disease" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs dark:text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Body System</label>
                        <select value={newSystem} onChange={(e) => setNewSystem(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs text-slate-600 dark:text-slate-350">
                          <option value="Endocrine">Endocrine</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Respiratory">Respiratory</option>
                          <option value="Gastroenterology">Gastrointestinal</option>
                          <option value="Psychiatry">Psychiatry</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Women's Health">Women's Health</option>
                          <option value="Paediatrics">Paediatrics</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Category / Area</label>
                      <input type="text" placeholder="e.g. Chronic Disease, Emergency Care" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs dark:text-slate-200" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Symptoms (one per line)</label>
                      <textarea rows={2} placeholder="Polyuria&#10;Polydipsia" value={symptomsInput} onChange={(e) => setSymptomsInput(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs dark:text-slate-200 font-mono" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Treatment Options (one per line)</label>
                      <textarea rows={2} placeholder="First-line: Metformin&#10;Second-line: SGLT2i" value={treatmentInput} onChange={(e) => setTreatmentInput(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs dark:text-slate-200 font-mono" />
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setModalStep("select")} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Back</button>
                      <button onClick={() => handleSaveContent("Condition")} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-500 shadow">Save Condition</button>
                    </div>
                  </div>
                )}

                {/* STEP 2B: Upload PDF Document */}
                {modalStep === "document" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Document Title</label>
                        <input type="text" placeholder="e.g. ACS Emergency Protocol Guide" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs dark:text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Body System</label>
                        <select value={newSystem} onChange={(e) => setNewSystem(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs text-slate-600 dark:text-slate-350">
                          <option value="Endocrine">Endocrine</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Respiratory">Respiratory</option>
                          <option value="Gastroenterology">Gastrointestinal</option>
                          <option value="Psychiatry">Psychiatry</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Women's Health">Women's Health</option>
                          <option value="Paediatrics">Paediatrics</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Category</label>
                      <input type="text" placeholder="e.g. PDF Summary, Flowchart Guide" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs dark:text-slate-200" />
                    </div>

                    {/* PDF Drag and Drop Simulator */}
                    <div>
                      <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1.5">PDF Document Attachment</label>
                      
                      {uploadState === "idle" && (
                        <div 
                          onClick={simulateFileUpload}
                          className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-850 hover:bg-teal-50/10 transition-all flex flex-col items-center justify-center"
                        >
                          <Lucide.Upload className="w-8 h-8 text-slate-400 mb-1.5" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & Drop Guideline PDF here</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">or click to choose file from directory (Max 10MB)</p>
                        </div>
                      )}

                      {uploadState === "uploading" && (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50 dark:bg-slate-850 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-350 truncate max-w-[220px]">{uploadedFileName}</span>
                            <span className="text-slate-400 font-mono">{uploadProgress}%</span>
                          </div>
                          
                          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Size: {uploadedFileSize} · Uploading file to GP Edge repository...</p>
                        </div>
                      )}

                      {uploadState === "success" && (
                        <div className="border border-emerald-250 dark:border-emerald-900/40 rounded-2xl p-5 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2 flex items-start gap-3">
                          <span className="text-xl bg-emerald-100 dark:bg-emerald-900/30 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                            <Lucide.Check className="w-4 h-4 text-emerald-600" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{uploadedFileName}</p>
                            <p className="text-[10px] text-slate-400">Uploaded successfully ({uploadedFileSize})</p>
                            <button onClick={simulateFileUpload} className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold hover:underline mt-1">Replace file</button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setModalStep("select")} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-505 hover:bg-slate-50 dark:hover:bg-slate-800">Back</button>
                      <button 
                        onClick={() => handleSaveContent("Document")} 
                        disabled={uploadState !== "success"}
                        className="px-4 py-2 bg-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold hover:bg-teal-500 shadow"
                      >
                        Save PDF Document
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2C: Create Note */}
                {modalStep === "note" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Note Title</label>
                        <input type="text" placeholder="e.g. Clinical pearl on Otitis Media" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs dark:text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Body System</label>
                        <select value={newSystem} onChange={(e) => setNewSystem(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs text-slate-600 dark:text-slate-350">
                          <option value="Endocrine">Endocrine</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Respiratory">Respiratory</option>
                          <option value="Gastroenterology">Gastrointestinal</option>
                          <option value="Psychiatry">Psychiatry</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Women's Health">Women's Health</option>
                          <option value="Paediatrics">Paediatrics</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Note Category / Tag</label>
                      <input type="text" placeholder="e.g. Clinical Pearl, Fact Sheet" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs dark:text-slate-200" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1">Structured Note Content</label>
                      <textarea rows={4} placeholder="Draft clinical reference note..." value={notesInput} onChange={(e) => setNotesInput(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-xs dark:text-slate-200" />
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setModalStep("select")} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-505 hover:bg-slate-50 dark:hover:bg-slate-800">Back</button>
                      <button onClick={() => handleSaveContent("Note")} className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-500 shadow">Save Note</button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail slide-over */}
      <AnimatePresence>
        {selectedContent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setSelectedContent(null)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-white dark:border-slate-850 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 text-slate-800 dark:text-slate-200">
                <button onClick={() => setSelectedContent(null)} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <Lucide.X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${typeColors[selectedContent.type]}`}>{selectedContent.type}</span>
                  <StatusBadge variant={selectedContent.status} />
                </div>
                <h2 className="font-serif text-xl text-slate-900 dark:text-slate-100 mb-2">{selectedContent.name}</h2>
                <p className="text-sm text-slate-505 dark:text-slate-400 mb-6">{selectedContent.system} · {selectedContent.category}</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-4"><p className="text-xs text-slate-400 mb-1">References</p><p className="text-xl font-serif text-slate-900 dark:text-slate-200">{selectedContent.references}</p></div>
                  <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-4"><p className="text-xs text-slate-400 mb-1">Used in Questions</p><p className="text-xl font-serif text-slate-900 dark:text-slate-200">{selectedContent.usedInQuestions}</p></div>
                  <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-4"><p className="text-xs text-slate-400 mb-1">Author</p><p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedContent.author}</p></div>
                  <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-4"><p className="text-xs text-slate-400 mb-1">Last Updated</p><p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedContent.lastUpdated}</p></div>
                </div>

                {/* Content Editor Preview */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Content Preview</h3>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      {["B", "I", "U", "H1", "H2", "List", "Num", "Link", "Img"].map((btn) => (
                        <button key={btn} className="h-8 px-2 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:text-teal-600 transition-all flex items-center justify-center">{btn}</button>
                      ))}
                    </div>
                    <div className="prose prose-sm text-slate-700 dark:text-slate-300 max-w-none">
                      <p className="text-sm leading-relaxed">This is a preview of the clinical content for <strong>{selectedContent.name}</strong>. In a full implementation, this would contain the detailed medical content, references, and clinical guidelines.</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">Key points, evidence levels, and management algorithms would be displayed here with proper formatting.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2.5 bg-teal-500 text-sm font-semibold text-white rounded-xl hover:bg-teal-600 transition-all">Edit Content</button>
                  <button className="px-4 py-2.5 text-sm font-medium text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-850 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Duplicate</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

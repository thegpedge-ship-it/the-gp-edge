"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { getMedicalContent, saveMedicalContent, MedicalContent } from "@/lib/quizData";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const typeColors: Record<string, string> = {
  Condition: "bg-teal-50/70 text-teal-800 border-teal-200/60 dark:bg-teal-950/30 dark:text-teal-350 dark:border-teal-900/50",
  Guideline: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/25 dark:text-teal-300 dark:border-teal-900/60",
  Protocol: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50",
  Pathway: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700/70",
  Document: "bg-teal-50/40 text-teal-700 border-teal-100 dark:bg-teal-950/10 dark:text-teal-400 dark:border-teal-900/30",
  Note: "bg-teal-50/30 text-teal-800 border-teal-100/70 dark:bg-teal-950/15 dark:text-teal-400 dark:border-teal-900/20",
};

export default function ContentPage() {
  const router = useRouter();
  const [content, setContent] = useState<MedicalContent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Document extraction states
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionState, setExtractionState] = useState<"idle" | "extracting" | "success">("idle");
  const [extractionLog, setExtractionLog] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  useEffect(() => {
    setContent(getMedicalContent());
  }, []);

  const systems = Array.from(new Set(content.map((c) => c.system)));

  const filtered = content.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.system.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSystem = systemFilter === "all" || c.system === systemFilter;
    const matchType = typeFilter === "all" || c.type === typeFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchSystem && matchType && matchStatus;
  });

  const updateStatus = (id: number, newStatus: MedicalContent["status"]) => {
    const updated = content.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
    setContent(updated);
    saveMedicalContent(updated);
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
    setUploadedFileSize("");
    setModalStep("select");
    setExtractionProgress(0);
    setExtractionState("idle");
    setExtractionLog("");
    setExtractedData(null);
  };

  // Trigger File Upload simulation
  const simulateFileUpload = () => {
    setUploadState("uploading");
    setUploadProgress(0);
    setUploadedFileName("Clinical_Guideline_Ref_" + Math.floor(Math.random() * 900 + 100) + ".pdf");
    setUploadedFileSize((Math.random() * 1.5 + 0.5).toFixed(1) + " MB");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
    setUploadState("uploading");
    setUploadProgress(0);

    const progressTimer = setInterval(() => {
      setUploadProgress((p) => (p >= 90 ? 90 : p + 10));
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const result = await res.json();
      if (result.success) {
        setExtractedData(result);
        setUploadState("success");
      } else {
        alert(result.error || "Failed to extract text from document");
        setUploadState("idle");
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      alert("Upload error: " + err.message);
      setUploadState("idle");
    }
  };

  const runTextExtraction = () => {
    setExtractionState("extracting");
    setExtractionProgress(0);
    setExtractionLog("Opening document stream...");
    
    setTimeout(() => {
      setExtractionProgress(25);
      setExtractionLog("Extracting raw text from pages...");
    }, 300);

    setTimeout(() => {
      setExtractionProgress(55);
      setExtractionLog("Identifying clinical sections...");
    }, 600);

    setTimeout(() => {
      setExtractionProgress(85);
      setExtractionLog("Mapping fields...");
    }, 900);

    setTimeout(() => {
      setExtractionProgress(100);
      setExtractionState("success");
      setExtractionLog("Extraction complete!");
      
      // Auto-populate the states!
      if (extractedData) {
        setNewTitle(extractedData.title || "Extracted Document");
        setNewSystem(extractedData.system || "Endocrine");
        setNewCategory(extractedData.category || "Clinical Reference");
        setSymptomsInput(extractedData.symptoms || "");
        setTreatmentInput(extractedData.treatment || "");
        setNotesInput(extractedData.notes || "");
      } else {
        // Fallback to Acne
        setNewTitle("Acne Vulgaris Guideline");
        setNewSystem("Dermatology");
        setNewCategory("Skin Disease");
        setSymptomsInput("Comedones (blackheads and whiteheads)\nInflammatory papules and pustules\nSevere nodulocystic lesions\nPost-inflammatory hyperpigmentation or scarring");
        setTreatmentInput("Mild: Topical benzoyl peroxide + retinoid (adapalene)\nModerate: Oral doxycycline 50-100mg daily + topical retinoid\nSevere: Specialist referral for oral isotretinoin (Accutane)\nMaintenance: Ongoing topical retinoid therapy to prevent microcomedones");
        setNotesInput("Avoid oil-based cosmetics and harsh face scrubs. Educate patient that topical therapies take 6-8 weeks for visible improvement and may cause initial irritation.");
      }
      
      // Redirect to the condition editor step with pre-filled values
      setModalStep("condition");
    }, 1200);
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

  // Lock body scroll when modal is open to prevent background scrolling lag
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAddModal]);

  // Submit and save content
  const handleSaveContent = (type: MedicalContent["type"]) => {
    if (!newTitle.trim()) {
      alert("Please fill in the title field.");
      return;
    }

    const newItem: MedicalContent = {
      id: content.length > 0 ? Math.max(...content.map(c => c.id)) + 1 : 1,
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

    const updated = [newItem, ...content];
    setContent(updated);
    saveMedicalContent(updated);
    setShowAddModal(false);
    resetForm();
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      
      <AdminPageHeader
        title="Medical"
        highlightedText="Content"
        subtitle={`Clinical guidelines, protocols, and care pathways · ${content.length} items`}
        actions={
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-4 py-2.5 bg-teal-800 text-sm font-semibold text-white rounded-xl hover:bg-teal-900 transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            <Lucide.Plus className="w-4 h-4" />
            Add Content
          </button>
        }
        variants={itemVariants}
      />

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Guidelines"
          percentage="+12%"
          data={content.filter((c) => c.type === "Guideline").length.toString()}
          progress={content.length > 0 ? Math.round((content.filter((c) => c.type === "Guideline").length / content.length) * 100) : 0}
        />
        <AnalyticsCard
          title="Protocols / Conditions"
          percentage="+8%"
          data={content.filter((c) => c.type === "Protocol" || c.type === "Condition").length.toString()}
          progress={content.length > 0 ? Math.round((content.filter((c) => c.type === "Protocol" || c.type === "Condition").length / content.length) * 100) : 0}
        />
        <AnalyticsCard
          title="Documents / PDFs"
          percentage="+15%"
          data={content.filter((c) => c.type === "Document" || c.type === "Pathway").length.toString()}
          progress={content.length > 0 ? Math.round((content.filter((c) => c.type === "Document" || c.type === "Pathway").length / content.length) * 100) : 0}
        />
        <AnalyticsCard
          title="Linked Questions"
          percentage="+18%"
          data={content.reduce((sum, c) => sum + c.usedInQuestions, 0).toLocaleString()}
          progress={Math.min(100, content.length > 0 ? Math.round((content.reduce((sum, c) => sum + c.usedInQuestions, 0) / 300) * 100) : 0)}
        />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center relative z-20">
        <div className="relative flex-1 max-w-sm">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700/60 transition-all dark:text-slate-200" />
        </div>
        <CustomSelect
          value={systemFilter}
          onChange={setSystemFilter}
          options={[
            { value: "all", label: "All Systems" },
            ...systems.map((s) => ({ value: s, label: s })),
          ]}
          className="w-48"
        />
        <CustomSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "All Types" },
            { value: "Condition", label: "Condition" },
            { value: "Guideline", label: "Guideline" },
            { value: "Protocol", label: "Protocol" },
            { value: "Pathway", label: "Pathway" },
            { value: "Document", label: "Document" },
            { value: "Note", label: "Note" },
          ]}
          className="w-48"
        />
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Status" },
            { value: "published", label: "Published" },
            { value: "review", label: "Review" },
            { value: "draft", label: "Draft" },
          ]}
          className="w-48"
        />
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
            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-teal-200/70 dark:border-teal-900/40 shadow-md shadow-slate-200/30 overflow-hidden relative group hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-300 cursor-pointer"
            onClick={() => router.push(`/admin/content/${item.id}`)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-slate-50/5 dark:to-slate-900/5 pointer-events-none" />
            <div className="relative z-10 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColors[item.type]}`}>{item.type}</span>
                  <StatusBadge variant={item.status} />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{item.lastUpdated}</span>
              </div>
              <h3 className="font-serif text-base text-slate-900 dark:text-slate-100 mb-1 leading-tight group-hover:text-slate-850 dark:group-hover:text-slate-300 transition-colors">{item.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{item.system} · {item.category}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 text-xs text-slate-500">
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
                  <Link
                    href={`/admin/content/editor?id=${item.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-850 hover:bg-slate-50/65 dark:hover:bg-slate-950/25 transition-all"
                    title="Edit Content"
                  >
                    <Lucide.Edit className="w-4 h-4" />
                  </Link>
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
          <div key="content-add-modal-container" className="fixed inset-0 z-50 pointer-events-none">
            <motion.div
              key="content-add-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto cursor-pointer"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              key="content-add-modal-content"
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }}
              className="fixed inset-x-4 top-[10%] mx-auto w-full max-w-lg max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-y-auto flex flex-col pointer-events-auto"
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
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-500/80 hover:bg-slate-50/10 transition-all text-left flex items-start gap-4 group"
                      >
                        <span className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl group-hover:scale-105 transition">
                          <Lucide.Stethoscope className="w-6 h-6 text-slate-600" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-600 transition">Clinical Condition / Guideline</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Input diagnostic criteria, treatments, clinical notes, and resources.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { setModalStep("document"); }}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-500/80 hover:bg-slate-50/10 transition-all text-left flex items-start gap-4 group"
                      >
                        <span className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl group-hover:scale-105 transition">
                          <Lucide.FileText className="w-6 h-6 text-slate-600" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-600 transition">Clinical Document (PDF)</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upload a clinical guide, chart, or official PDF summary sheet.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { setModalStep("note"); }}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-500/80 hover:bg-slate-50/10 transition-all text-left flex items-start gap-4 group"
                      >
                        <span className="bg-slate-50 dark:bg-slate-955/20 p-2.5 rounded-xl group-hover:scale-105 transition">
                          <Lucide.FileText className="w-6 h-6 text-slate-600" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-600 transition">Structured Note</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Draft simple clinical summaries, bulletins, or references.</p>
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
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Condition Name</label>
                        <input type="text" placeholder="e.g. Chronic Kidney Disease" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Body System</label>
                        <CustomSelect
                          value={newSystem}
                          onChange={setNewSystem}
                          options={[
                            { value: "Endocrine", label: "Endocrine" },
                            { value: "Cardiology", label: "Cardiology" },
                            { value: "Respiratory", label: "Respiratory" },
                            { value: "Gastroenterology", label: "Gastrointestinal" },
                            { value: "Psychiatry", label: "Psychiatry" },
                            { value: "Dermatology", label: "Dermatology" },
                            { value: "Women's Health", label: "Women's Health" },
                            { value: "Paediatrics", label: "Paediatrics" }
                          ]}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Category / Area</label>
                      <input type="text" placeholder="e.g. Chronic Disease, Emergency Care" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Symptoms (one per line)</label>
                      <textarea rows={2} placeholder="Polyuria&#10;Polydipsia" value={symptomsInput} onChange={(e) => setSymptomsInput(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200 font-mono" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Treatment Options (one per line)</label>
                      <textarea rows={2} placeholder="First-line: Metformin&#10;Second-line: SGLT2i" value={treatmentInput} onChange={(e) => setTreatmentInput(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200 font-mono" />
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setModalStep("select")} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Back</button>
                      <button onClick={() => handleSaveContent("Condition")} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 shadow">Save Condition</button>
                    </div>
                  </div>
                )}

                {/* STEP 2B: Upload PDF Document */}
                {modalStep === "document" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Document Title</label>
                        <input type="text" placeholder="e.g. ACS Emergency Protocol Guide" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Body System</label>
                        <CustomSelect
                          value={newSystem}
                          onChange={setNewSystem}
                          options={[
                            { value: "Endocrine", label: "Endocrine" },
                            { value: "Cardiology", label: "Cardiology" },
                            { value: "Respiratory", label: "Respiratory" },
                            { value: "Gastroenterology", label: "Gastrointestinal" },
                            { value: "Psychiatry", label: "Psychiatry" },
                            { value: "Dermatology", label: "Dermatology" },
                            { value: "Women's Health", label: "Women's Health" },
                            { value: "Paediatrics", label: "Paediatrics" }
                          ]}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                      <input type="text" placeholder="e.g. PDF Summary, Flowchart Guide" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                    </div>

                    {/* PDF Drag and Drop Simulator */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">PDF Document Attachment</label>
                      
                      {uploadState === "idle" && (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-50/10 transition-all flex flex-col items-center justify-center"
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".pdf,.docx" 
                            className="hidden" 
                          />
                          <Lucide.Upload className="w-8 h-8 text-slate-400 mb-1.5" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & Drop Guideline PDF or DOCX here</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">or click to choose file from directory (Max 10MB)</p>
                        </div>
                      )}

                      {uploadState === "uploading" && (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50 dark:bg-slate-800 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-300 truncate max-w-[220px]">{uploadedFileName}</span>
                            <span className="text-slate-400 font-mono">{uploadProgress}%</span>
                          </div>
                          
                          <div className="flex h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-slate-400 to-slate-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Size: {uploadedFileSize} · Uploading file to GP Edge repository...</p>
                        </div>
                      )}

                      {uploadState === "success" && (
                        <div className="space-y-4">
                          <div className="border border-slate-200 dark:border-slate-900/40 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-950/10 flex items-start gap-3 shadow-sm">
                            <span className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center shrink-0">
                              <Lucide.Check className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{uploadedFileName}</p>
                              <p className="text-[10px] text-slate-400">Uploaded successfully ({uploadedFileSize})</p>
                              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold hover:underline mt-1 cursor-pointer">Replace file</button>
                            </div>
                          </div>

                          {extractionState === "idle" && (
                            <div className="bg-teal-50/40 dark:bg-teal-950/10 border border-teal-100/50 dark:border-teal-900/30 rounded-2xl p-4 text-center space-y-2.5">
                              <div className="flex items-center justify-center gap-2 text-teal-800 dark:text-teal-450">
                                <Lucide.Sparkles className="w-5 h-5 animate-pulse" />
                                <span className="text-xs font-bold">Smart Document Extractor Available</span>
                              </div>
                              <p className="text-[10px] text-slate-450 max-w-sm mx-auto leading-relaxed">
                                We can automatically extract clinical headings, symptoms, and treatment protocols from this document to populate your website's medical library.
                              </p>
                              <button 
                                onClick={runTextExtraction}
                                className="px-4 py-2 bg-teal-850 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5 mx-auto active:scale-98"
                              >
                                <Lucide.Cpu className="w-3.5 h-3.5" />
                                Extract Text & Auto-Populate Fields
                              </button>
                            </div>
                          )}

                          {extractionState === "extracting" && (
                            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 space-y-3 shadow-inner">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                                <span className="flex items-center gap-2">
                                  <Lucide.Loader className="w-3.5 h-3.5 text-teal-500 animate-spin" />
                                  <span>{extractionLog}</span>
                                </span>
                                <span className="font-mono text-teal-600 dark:text-teal-450">{extractionProgress}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${extractionProgress}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setModalStep("select")} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Back</button>
                      <button 
                        onClick={() => handleSaveContent("Document")} 
                        disabled={uploadState !== "success"}
                        className="px-4 py-2 bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 shadow"
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
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Note Title</label>
                        <input type="text" placeholder="e.g. Clinical pearl on Otitis Media" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Body System</label>
                        <CustomSelect
                          value={newSystem}
                          onChange={setNewSystem}
                          options={[
                            { value: "Endocrine", label: "Endocrine" },
                            { value: "Cardiology", label: "Cardiology" },
                            { value: "Respiratory", label: "Respiratory" },
                            { value: "Gastroenterology", label: "Gastrointestinal" },
                            { value: "Psychiatry", label: "Psychiatry" },
                            { value: "Dermatology", label: "Dermatology" },
                            { value: "Women's Health", label: "Women's Health" },
                            { value: "Paediatrics", label: "Paediatrics" }
                          ]}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Note Category / Tag</label>
                      <input type="text" placeholder="e.g. Clinical Pearl, Fact Sheet" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Structured Note Content</label>
                      <textarea rows={4} placeholder="Draft clinical reference note..." value={notesInput} onChange={(e) => setNotesInput(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setModalStep("select")} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Back</button>
                      <button onClick={() => handleSaveContent("Note")} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 shadow">Save Note</button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { getAutofillTemplates, saveAutofillTemplates, AutofillTemplate } from "@/lib/quizData";
import { addUserNotification } from "@/utils/notifications";
import {
  themeBorder,
  themeBtnGhost,
  themeBtnPrimary,
  themeLabel,
  themeInput,
} from "@/lib/adminTheme";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };



type ViewMode = "grid" | "table";

/* ---------- System color mapping ---------- */
const systemColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  Respiratory: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Endocrine: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Psychiatry: { bg: "bg-teal-50/40 dark:bg-teal-950/10", text: "text-teal-600", border: "border-teal-100/50 dark:border-teal-900/20", gradient: "from-teal-800 to-teal-900" },
  Dermatology: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  "Women's Health": { bg: "bg-teal-50/50 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/50 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Paediatrics: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Cardiovascular: { bg: "bg-teal-50/60 dark:bg-teal-950/25", text: "text-teal-600", border: "border-teal-100/60 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Gastroenterology: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Musculoskeletal: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  MBS: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
};
const defaultSystemColor = { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100 dark:border-teal-900/20", gradient: "from-teal-800 to-teal-900" };

const fieldTypes = ["Text Input", "Dropdown", "Checkbox", "Radio", "Textarea", "Date Picker", "Numeric", "Calculated"];



export default function AutofillPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<AutofillTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showEditor, setShowEditor] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [newSystem, setNewSystem] = useState("Respiratory");
  const [newCategory, setNewCategory] = useState("Acute");
  const [newName, setNewName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [savedTemplateId, setSavedTemplateId] = useState<number | null>(null);
  const [tempFields, setTempFields] = useState<{ name: string; type: string; required: boolean }[]>([]);

  // SOAP extracted states for uploader fallback
  const [extractedSubjective, setExtractedSubjective] = useState("");
  const [extractedObjective, setExtractedObjective] = useState("");
  const [extractedAssessment, setExtractedAssessment] = useState("");
  const [extractedPlan, setExtractedPlan] = useState("");
  const [extractedDoctorSummary, setExtractedDoctorSummary] = useState("");
  const [extractedPatientResources, setExtractedPatientResources] = useState("");

  // Wizard tab & ref
  const [activeTab, setActiveTab] = useState<"manual" | "upload">("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF upload & text extraction states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success">("idle");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");
  const [uploadedFileType, setUploadedFileType] = useState("");
  const [uploadedFilePreview, setUploadedFilePreview] = useState<"pdf" | "docx" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionState, setExtractionState] = useState<"idle" | "extracting" | "success">("idle");
  const [extractionLog, setExtractionLog] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);

  // Handle file selection and API call

  // Handle file selection and API call
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    setSelectedFile(file);
    setUploadedFileName(file.name);
    setUploadedFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
    setUploadedFileType(ext.toUpperCase());
    setUploadedFilePreview(ext === "pdf" ? "pdf" : "docx");
    setUploadState("uploading");
    setUploadProgress(0);

    const progressTimer = setInterval(() => {
      setUploadProgress((p) => (p >= 90 ? 90 : p + 10));
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "autofill");

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
        // Auto-trigger extraction immediately — no manual button needed
        runTextExtraction(result);
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

  // Run text extraction simulation
  const runTextExtraction = (data?: any) => {
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
      
      const activeData = data || extractedData;
      const title = activeData?.title || "Extracted Template";
      const system = activeData?.system || "Respiratory";
      const category = activeData?.category || "Acute";
      const subjective = activeData?.symptoms || activeData?.subjective || "";
      const objective = activeData?.objective || "";
      const plan = activeData?.treatment || activeData?.plan || "";
      const assessment = activeData?.notes || activeData?.assessment || "";
      const doctorSummary = activeData?.doctorSummary || "";
      const patientResources = activeData?.patientResources || "";

      // Load templates and create a new one
      const list = getAutofillTemplates();
      const nextId = list.length > 0 ? Math.max(...list.map(t => t.id)) + 1 : 1;
      const newTemplate: AutofillTemplate = {
        id: nextId,
        name: title,
        system: system,
        category: category,
        fields: 0,
        usageCount: 0,
        lastUsed: "Just now",
        status: "active",
        author: "GP Edge Admin",
        version: "v1.0",
        subjective,
        objective,
        assessment,
        plan,
        doctorSummary,
        patientResources,
        sampleFields: []
      };
      
      const updated = [newTemplate, ...list];
      setTemplates(updated);
      saveAutofillTemplates(updated);

      // Reset extraction and upload states
      setUploadState("idle");
      setExtractionState("idle");
      setSelectedFile(null);
      setShowEditor(false);

      // Notify and redirect to template editor!
      addUserNotification("Template Extracted", `Successfully created "${title}" and opened it in the editor.`, 1, "custom");
      router.push(`/admin/autofill/${nextId}/editor`);
    }, 1200);
  };

  useEffect(() => {
    setTemplates(getAutofillTemplates());
  }, []);

  const handleDeleteTemplate = (id: number) => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveAutofillTemplates(updated);
  };

  const handleOpenEdit = (template: AutofillTemplate) => {    setEditingTemplateId(template.id);
    setNewName(template.name);
    setNewSystem(template.system);
    setNewCategory(template.category);
    setTempFields(template.sampleFields);
    setShowEditor(true);
  };

  const handleSaveTemplate = () => {
    if (!newName.trim()) {
      alert("Please enter a template name.");
      return;
    }

    let updatedTemplates: AutofillTemplate[];
    if (editingTemplateId !== null) {
      updatedTemplates = templates.map((t) =>
        t.id === editingTemplateId
          ? {
              ...t,
              name: newName,
              system: newSystem,
              category: newCategory,
              fields: 0,
              sampleFields: [],
            }
          : t
      );
    } else {
      const newTemplate: AutofillTemplate = {
        id: templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1,
        name: newName,
        system: newSystem,
        category: newCategory,
        fields: 0,
        usageCount: 0,
        lastUsed: "Just now",
        status: "active",
        author: "GP Edge Admin",
        version: "v1.0",
        subjective: extractedSubjective,
        objective: extractedObjective,
        assessment: extractedAssessment,
        plan: extractedPlan,
        doctorSummary: extractedDoctorSummary,
        patientResources: extractedPatientResources,
        sampleFields: []
      };
      updatedTemplates = [newTemplate, ...templates];
    }

    setTemplates(updatedTemplates);
    saveAutofillTemplates(updatedTemplates);
    // Track which template was saved so we can offer the editor link
    const justSavedId = editingTemplateId !== null
      ? editingTemplateId
      : updatedTemplates[0]?.id ?? null;
    setSavedTemplateId(justSavedId);
    setShowEditor(false);
    setEditingTemplateId(null);
  };

  const addField = (type: string) => {
    const name = prompt(`Enter name for the ${type} field:`, `New ${type} Field`);
    if (name === null) return;
    const finalName = name.trim() || `New ${type} Field`;
    setTempFields((prev) => [...prev, { name: finalName, type, required: true }]);
  };

  useEffect(() => {
    if (showEditor) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showEditor]);

  const filtered = templates.filter((t) => {
    return t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.system.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Autofill"
        highlightedText="Templates"
        subtitle="Manage consultation autofill templates and form builders"
        actions={
          <button 
            onClick={() => {
              setEditingTemplateId(null);
              setNewName("");
              setNewSystem("Respiratory");
              setNewCategory("Acute");
              setTempFields([]);
              setShowEditor(true);
            }}
            className="px-4 py-2.5 bg-teal-800 text-sm font-semibold text-white rounded-xl hover:bg-teal-900 transition-all shadow-sm flex items-center gap-2 shrink-0 border-none outline-none cursor-pointer"
          >
            <Lucide.Plus className="w-4 h-4" />
            Add Template
          </button>
        }
        variants={itemVariants}
      />

      {/* Stats */}
      {templates.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AnalyticsCard
            title="Total Templates"
            percentage=""
            data={templates.length.toString()}
            progress={100}
          />
          <AnalyticsCard
            title="Active Templates"
            percentage=""
            data={templates.filter(t => t.status === "active").length.toString()}
            progress={Math.min(100, Math.round((templates.filter(t => t.status === "active").length / templates.length) * 100))}
          />
          <AnalyticsCard
            title="Total Usage Count"
            percentage=""
            data={templates.reduce((sum, t) => sum + (t.usageCount || 0), 0).toString()}
            progress={Math.min(100, Math.round((templates.reduce((sum, t) => sum + (t.usageCount || 0), 0) / 100) * 100))}
          />
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700/60 dark:text-slate-100 transition-all" />
        </div>
      </motion.div>

      {/* ========== CARD GRID VIEW ========== */}
      {viewMode === "grid" && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden relative group hover:shadow-md hover:border-teal-300/60 dark:hover:border-teal-800 transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/admin/autofill/${template.id}`)}
            >
              <div className="p-5">

                {/* Top row: category + status + timestamp */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-transparent">
                      {template.category}
                    </span>
                    <StatusBadge variant={template.status === "active" ? "published" : template.status === "suspended" ? "review" : "draft"} />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">{template.lastUsed}</span>
                </div>

                {/* Title + subtitle */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5 leading-tight">{template.name}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{template.system}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    <Lucide.Clock className="w-3 h-3" />
                    <span>{template.lastUsed}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/autofill/${template.id}`); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all cursor-pointer border-none bg-transparent"
                      title="View Details"
                    >
                      <Lucide.Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(template); }}
                      className="p-1 rounded-lg text-slate-400 hover:text-teal-800 hover:bg-teal-50/60 dark:hover:bg-teal-950/25 transition-all cursor-pointer border-none bg-transparent"
                      title="Edit Template Info"
                    >
                      <Lucide.Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/autofill/${template.id}/editor`); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all cursor-pointer border-none bg-transparent"
                      title="Template Editor"
                    >
                      <Lucide.FileEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer border-none bg-transparent"
                      title="Delete Template"
                    >
                      <Lucide.Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400">No templates found matching your criteria.</p>
        </div>
      )}

      {/* Template builder modal */}
      <AnimatePresence>
        {showEditor && (
          <div key="autofill-builder-modal-container" className="fixed inset-0 z-50 pointer-events-none">
            <motion.div
              key="autofill-builder-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
              onClick={() => setShowEditor(false)}
            />
            <motion.div
              key="autofill-builder-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-[10%] mx-auto max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl z-50 shadow-2xl overflow-y-auto max-h-[80vh] pointer-events-auto text-slate-950 dark:text-slate-50"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                    {editingTemplateId !== null ? "Edit Autofill Template" : "Add Autofill Template"}
                  </h3>
                  <button
                    onClick={() => setShowEditor(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-none outline-none bg-transparent cursor-pointer"
                  >
                    <Lucide.X className="w-5 h-5" />
                  </button>
                </div>
                {/* Modal Tab Switcher */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 mb-5">
                  <button
                    onClick={() => setActiveTab("manual")}
                    className={`flex-1 py-2 cursor-pointer text-center text-xs font-semibold border-b-2 transition-all border-none bg-transparent ${
                      activeTab === "manual"
                        ? "border-b-teal-700 text-teal-700 font-bold border-solid"
                        : "border-b-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                  >
                    Manual Builder
                  </button>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className={`flex-1 py-2 cursor-pointer text-center text-xs font-semibold border-b-2 transition-all border-none bg-transparent ${
                      activeTab === "upload"
                        ? "border-b-teal-700 text-teal-700 font-bold border-solid"
                        : "border-b-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                  >
                    Import from Document (PDF/DOCX)
                  </button>
                </div>

                {activeTab === "manual" ? (
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${themeLabel}`}>Template Name</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className={`w-full px-4 py-2.5 text-sm dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                        placeholder="e.g. Acute Sore Throat"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">System</label>
                        <CustomSelect
                          value={newSystem}
                          onChange={setNewSystem}
                          options={[
                            { value: "Respiratory", label: "Respiratory" },
                            { value: "Cardiovascular", label: "Cardiovascular" },
                            { value: "Endocrine", label: "Endocrine" },
                            { value: "Psychiatry", label: "Psychiatry" },
                            { value: "Dermatology", label: "Dermatology" },
                            { value: "Women's Health", label: "Women's Health" },
                            { value: "Paediatrics", label: "Paediatrics" }
                          ]}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Category</label>
                        <CustomSelect
                          value={newCategory}
                          onChange={setNewCategory}
                          options={[
                            { value: "Acute", label: "Acute" },
                            { value: "Chronic", label: "Chronic" },
                            { value: "Screening", label: "Screening" },
                            { value: "Mental Health", label: "Mental Health" },
                          ]}
                          className="w-full"
                        />
                      </div>
                    </div>



                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setShowEditor(false)} className={`px-4 py-2.5 text-sm font-medium ${themeBtnGhost}`}>Cancel</button>
                      <button onClick={handleSaveTemplate} className={`px-4 py-2.5 text-sm font-semibold ${themeBtnPrimary}`}>
                        {editingTemplateId !== null ? "Save Changes" : "Create Template"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* PDF/DOCX dropzone / uploader */}
                    {uploadState === "idle" && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Attach Consultation Guideline or SOAP Note</label>
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file && fileInputRef.current) {
                                const dt = new DataTransfer();
                                dt.items.add(file);
                                fileInputRef.current.files = dt.files;
                                fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                              }
                            }}
                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all flex flex-col items-center justify-center gap-2 group"
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".pdf,.docx"
                              className="hidden"
                            />
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Lucide.Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drop PDF or DOCX here</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">or <span className="text-teal-600 font-semibold">click to browse</span> · Max 10MB</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {["PDF", "DOCX", "DOC"].map((t) => (
                                <span key={t} className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* File preview card — shown immediately on file selection */}
                        {selectedFile && (
                          <div className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className={`w-10 h-12 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-black text-white ${uploadedFilePreview === "pdf" ? "bg-red-500" : "bg-blue-500"}`}>
                              {uploadedFileType}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{uploadedFileName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{uploadedFileSize} · Ready to upload</p>
                            </div>
                            <button
                              onClick={() => { setSelectedFile(null); setUploadedFileName(""); setUploadedFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer border-none bg-transparent"
                              title="Remove file"
                            >
                              <Lucide.X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {uploadState === "uploading" && (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50 dark:bg-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700 dark:text-slate-350 truncate max-w-[220px]">{uploadedFileName}</span>
                          <span className="text-slate-400 font-mono">{uploadProgress}%</span>
                        </div>
                        
                        <div className="flex h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-700 transition-all" style={{ width: `${uploadProgress}%` }} />
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
                            <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-slate-650 dark:text-slate-400 font-semibold hover:underline mt-1 cursor-pointer border-none bg-transparent">Replace file</button>
                          </div>
                        </div>

                        {extractionState === "extracting" && (
                          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 space-y-3 shadow-inner">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                              <span className="flex items-center gap-2">
                                <Lucide.Loader className="w-3.5 h-3.5 text-teal-700 animate-spin" />
                                <span>{extractionLog}</span>
                              </span>
                              <span className="font-mono text-teal-700 dark:text-teal-400">{extractionProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-700 transition-all duration-300" style={{ width: `${extractionProgress}%` }} />
                            </div>
                          </div>
                        )}


                      </div>
                    )}
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


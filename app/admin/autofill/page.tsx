"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminRole } from "@/hooks/useAdminRole";
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
  const { isReadOnly } = useAdminRole();
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

  interface AutofillUploadQueueItem {
    id: string;
    name: string;
    size: string;
    progress: number;
    status: "idle" | "uploading" | "success" | "error";
    error?: string;
    extractedTemplate?: any;
  }

  const [autofillUploadQueue, setAutofillUploadQueue] = useState<AutofillUploadQueueItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Handle file selection and API call
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newItems: AutofillUploadQueueItem[] = fileList.map((file, idx) => ({
      id: `autofill-upload-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      progress: 5,
      status: "uploading",
    }));

    setAutofillUploadQueue((prev) => [...prev, ...newItems]);

    // Process each file in parallel
    newItems.forEach((item, index) => {
      const originalFile = fileList[index];
      runAutofillExtraction(item.id, originalFile);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runAutofillExtraction = async (id: string, file: File) => {
    let currentProgress = 5;
    const progressTimer = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress > 90) currentProgress = 90;
      setAutofillUploadQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, progress: Math.round(currentProgress) } : item))
      );
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

      const result = await res.json();
      if (result.success) {
        setAutofillUploadQueue((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "success",
                  progress: 100,
                  extractedTemplate: {
                    name: result.title || file.name.replace(/\.[^/.]+$/, ""),
                    system: result.system || "Respiratory",
                    category: result.category || "Acute",
                    subjective: result.symptoms || result.subjective || "",
                    objective: result.objective || "",
                    plan: result.treatment || result.plan || "",
                    assessment: result.notes || result.assessment || "",
                    doctorSummary: result.doctorSummary || "",
                    patientResources: result.patientResources || "",
                  },
                }
              : item
          )
        );
      } else {
        setAutofillUploadQueue((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "error", error: result.error || "Failed to extract text from document." } : item))
        );
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setAutofillUploadQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "error", error: err.message || "Failed to extract text from document." } : item))
      );
    }
  };

  const updateQueueItemMetadata = (id: string, field: "name" | "system" | "category", value: string) => {
    setAutofillUploadQueue((prev) =>
      prev.map((item) => {
        if (item.id === id && item.extractedTemplate) {
          return {
            ...item,
            extractedTemplate: {
              ...item.extractedTemplate,
              [field]: value,
            },
          };
        }
        return item;
      })
    );
  };

  const removeQueueItem = (id: string) => {
    setAutofillUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveAllAutofills = async () => {
    if (isReadOnly) return;
    const successItems = autofillUploadQueue.filter((item) => item.status === "success" && item.extractedTemplate);
    if (successItems.length === 0) return;

    setIsSaving(true);
    try {
      let templatesList = getAutofillTemplates();
      let nextId = templatesList.length > 0 ? Math.max(...templatesList.map((t) => t.id)) + 1 : 1;

      const newTemplates = successItems.map((item) => {
        const et = item.extractedTemplate;
        const temp: AutofillTemplate = {
          id: nextId++,
          name: et.name,
          system: et.system,
          category: et.category,
          fields: 0,
          usageCount: 0,
          lastUsed: "Just now",
          status: "active",
          author: "GP Edge Admin",
          version: "v1.0",
          subjective: et.subjective,
          objective: et.objective,
          assessment: et.assessment,
          plan: et.plan,
          doctorSummary: et.doctorSummary,
          patientResources: et.patientResources,
          sampleFields: [],
        };
        return temp;
      });

      const updated = [...newTemplates, ...templatesList];
      setTemplates(updated);
      saveAutofillTemplates(updated);

      setShowEditor(false);
      setAutofillUploadQueue([]);
      addUserNotification("Import Successful", `Successfully imported ${newTemplates.length} autofill templates.`, 1, "custom");
    } catch (err) {
      console.error(err);
      alert("Failed to save templates.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setTemplates(getAutofillTemplates());
  }, []);

  const handleDeleteTemplate = (id: number) => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
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
              if (isReadOnly) return;
              setEditingTemplateId(null);
              setNewName("");
              setNewSystem("Respiratory");
              setNewCategory("Acute");
              setTempFields([]);
              setShowEditor(true);
            }}
            disabled={isReadOnly}
            className={`px-4 py-2.5 bg-teal-800 text-sm font-semibold text-white rounded-xl hover:bg-teal-900 transition-all shadow-sm flex items-center gap-2 shrink-0 border-none outline-none ${isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Lucide.Plus className="w-4 h-4" />
            Add Template
          </button>
        }
        variants={itemVariants}
      />

      {isReadOnly && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 rounded-2xl flex gap-3 text-xs text-blue-850 dark:text-blue-300 leading-relaxed items-center shadow-sm"
        >
          <svg className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-450" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">View-Only Mode Enabled</p>
            <p className="mt-0.5 opacity-90">
              You are signed in under the <strong>Viewer</strong> role. You have full read-only access to all sections and data, but editing, adding, or deleting content is restricted.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {templates.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      onClick={(e) => { e.stopPropagation(); if (isReadOnly) return; handleOpenEdit(template); }}
                      disabled={isReadOnly}
                      className={`p-1 rounded-lg text-slate-400 hover:text-teal-800 hover:bg-teal-50/60 dark:hover:bg-teal-950/25 transition-all cursor-pointer border-none bg-transparent ${isReadOnly ? "opacity-30 cursor-not-allowed" : ""}`}
                      title={isReadOnly ? "Viewers cannot edit templates" : "Edit Template Info"}
                    >
                      <Lucide.Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (isReadOnly) return; router.push(`/admin/autofill/${template.id}/editor`); }}
                      disabled={isReadOnly}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all cursor-pointer border-none bg-transparent ${isReadOnly ? "opacity-30 cursor-not-allowed" : ""}`}
                      title={isReadOnly ? "Viewers cannot edit templates" : "Template Editor"}
                    >
                      <Lucide.FileEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (isReadOnly) return; handleDeleteTemplate(template.id); }}
                      disabled={isReadOnly}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer border-none bg-transparent ${isReadOnly ? "opacity-30 cursor-not-allowed" : ""}`}
                      title={isReadOnly ? "Viewers cannot delete templates" : "Delete Template"}
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
        <motion.div variants={itemVariants} className="text-center py-16 text-slate-400 dark:text-slate-500 space-y-2">
          <Lucide.Layers className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-sm font-medium">No autofill templates found.</p>
          {!isReadOnly && (
            <button
              onClick={() => {
                if (isReadOnly) return;
                setEditingTemplateId(null);
                setNewName("");
                setNewSystem("Respiratory");
                setNewCategory("Acute");
                setTempFields([]);
                setShowEditor(true);
              }}
              className="text-teal-600 text-xs font-semibold hover:underline cursor-pointer border-none bg-transparent"
            >
              Create your first autofill template →
            </button>
          )}
        </motion.div>
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
                ) : (                  <div className="space-y-4">
                    {/* PDF/DOCX dropzone / uploader */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">Attach Consultation Guideline or SOAP Note</label>
                        <div
                          onClick={() => { if (isReadOnly) return; fileInputRef.current?.click(); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (isReadOnly) return;
                            const files = e.dataTransfer.files;
                            if (files && files.length > 0 && fileInputRef.current) {
                              const dt = new DataTransfer();
                              Array.from(files).forEach((f) => dt.items.add(f));
                              fileInputRef.current.files = dt.files;
                              fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                            }
                          }}
                          className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all flex flex-col items-center justify-center gap-1.5 group"
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.docx"
                            multiple
                            className="hidden"
                          />
                          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Lucide.Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">Drop PDF or DOCX here</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-sans">or <span className="text-teal-600 font-semibold">click to browse</span> · Max 10MB</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {autofillUploadQueue.length > 0 && (
                      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-sans">Upload Queue ({autofillUploadQueue.length} files)</p>
                        {autofillUploadQueue.map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-3 relative group">
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-sans">{item.name}</h5>
                                <p className="text-[10px] text-slate-400 font-semibold font-sans">{item.size}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {item.status === "uploading" && (
                                  <span className="text-[10px] font-bold text-teal-850 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                                    <Lucide.Loader2 className="w-3 h-3 animate-spin" /> Extracting
                                  </span>
                                )}
                                {item.status === "success" && (
                                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full font-sans">
                                    Extracted
                                  </span>
                                )}
                                {item.status === "error" && (
                                  <span className="text-[10px] font-bold text-red-800 dark:text-red-405 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full font-sans">
                                    Error
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeQueueItem(item.id)}
                                  className="p-1 rounded-lg text-slate-455 hover:text-red-500 hover:bg-red-55 dark:hover:bg-red-950/20 transition-all border-none bg-transparent cursor-pointer"
                                >
                                  <Lucide.Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {item.status === "uploading" && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-slate-405 dark:text-slate-400">
                                  <span className="font-sans">Extracting clinical fields...</span>
                                  <span className="font-mono text-teal-600 dark:text-teal-400">{item.progress}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${item.progress}%` }} />
                                </div>
                              </div>
                            )}

                            {item.status === "error" && (
                              <p className="text-[10px] font-semibold text-red-500 font-sans">{item.error || "Failed to extract clinical fields."}</p>
                            )}

                            {item.status === "success" && item.extractedTemplate && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/40">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 font-sans">Template Name</label>
                                  <input
                                    type="text"
                                    value={item.extractedTemplate.name || ""}
                                    onChange={(e) => updateQueueItemMetadata(item.id, "name", e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-700 font-sans"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 font-sans">Body System</label>
                                  <CustomSelect
                                    value={item.extractedTemplate.system || "Respiratory"}
                                    onChange={(val) => updateQueueItemMetadata(item.id, "system", val)}
                                    options={[
                                      { value: "Respiratory", label: "Respiratory" },
                                      { value: "Cardiovascular", label: "Cardiovascular" },
                                      { value: "Endocrine", label: "Endocrine" },
                                      { value: "Psychiatry", label: "Psychiatry" },
                                      { value: "Dermatology", label: "Dermatology" },
                                      { value: "Women's Health", label: "Women's Health" },
                                      { value: "Paediatrics", label: "Paediatrics" }
                                    ]}
                                    triggerClassName="w-full flex items-center justify-between px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-700 transition-all font-medium font-sans"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 font-sans">Category</label>
                                  <CustomSelect
                                    value={item.extractedTemplate.category || "Acute"}
                                    onChange={(val) => updateQueueItemMetadata(item.id, "category", val)}
                                    options={[
                                      { value: "Acute", label: "Acute" },
                                      { value: "Chronic", label: "Chronic" },
                                      { value: "Screening", label: "Screening" },
                                      { value: "Mental Health", label: "Mental Health" }
                                    ]}
                                    triggerClassName="w-full flex items-center justify-between px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-700 transition-all font-medium font-sans"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setAutofillUploadQueue([]);
                          setShowEditor(false);
                        }}
                        disabled={isSaving || autofillUploadQueue.some(item => item.status === "uploading")}
                        className={`px-4 py-2 text-xs font-semibold ${themeBtnGhost}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAllAutofills}
                        disabled={isSaving || !autofillUploadQueue.some(item => item.status === "success")}
                        className={`px-4 py-2 text-xs font-semibold ${themeBtnPrimary} flex items-center gap-1.5`}
                      >
                        {isSaving ? (
                          <>
                            <Lucide.Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                          </>
                        ) : (
                          `Import Templates (${autofillUploadQueue.filter(item => item.status === "success").length})`
                        )}
                      </button>
                    </div>
                  </div>)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


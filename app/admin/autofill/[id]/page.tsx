"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import { getAutofillTemplates, saveAutofillTemplates, AutofillTemplate } from "@/lib/quizData";
import {
  themeBorder,
  themeBtnGhost,
  themeBtnPrimary,
  themeLabel,
  themeInput,
} from "@/lib/adminTheme";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const modalListVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.15 } }
};
const modalItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
};

const fieldTypes = ["Text Input", "Dropdown", "Checkbox", "Radio", "Textarea", "Date Picker", "Numeric", "Calculated"];

export default function AutofillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = Number(params.id);

  const [templates, setTemplates] = useState<AutofillTemplate[]>([]);
  const [template, setTemplate] = useState<AutofillTemplate | null>(null);

  // Editor modal state
  const [showEditor, setShowEditor] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSystem, setNewSystem] = useState("Respiratory");
  const [newCategory, setNewCategory] = useState("Acute");
  const [tempFields, setTempFields] = useState<{ name: string; type: string; required: boolean }[]>([]);

  // SOAP Fields states
  const [newSubjective, setNewSubjective] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [newAssessment, setNewAssessment] = useState("");
  const [newPlan, setNewPlan] = useState("");
  const [newDoctorSummary, setNewDoctorSummary] = useState("");
  const [newPatientResources, setNewPatientResources] = useState("");
  const [newTagsString, setNewTagsString] = useState("");

  // Wizard tab & ref
  const [activeTab, setActiveTab] = useState<"manual" | "upload">("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF upload & text extraction states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success">("idle");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");

  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionState, setExtractionState] = useState<"idle" | "extracting" | "success">("idle");
  const [extractionLog, setExtractionLog] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);

  // Editable review states to let the user "arrange" the extracted document content
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewSystem, setReviewSystem] = useState("Respiratory");
  const [reviewCategory, setReviewCategory] = useState("Acute");
  const [reviewSymptoms, setReviewSymptoms] = useState("");
  const [reviewObjective, setReviewObjective] = useState("");
  const [reviewTreatment, setReviewTreatment] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewDoctorSummary, setReviewDoctorSummary] = useState("");
  const [reviewPatientResources, setReviewPatientResources] = useState("");

  // Handle file selection and API call
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
        // Auto-trigger extraction immediately after upload
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
      if (activeData) {
        setReviewTitle(activeData.title || "Extracted Template");
        setReviewSystem(activeData.system || "Respiratory");
        setReviewCategory(activeData.category || "Acute");
        setReviewSymptoms(activeData.symptoms || activeData.subjective || "");
        setReviewObjective(activeData.objective || "");
        setReviewTreatment(activeData.treatment || activeData.plan || "");
        setReviewNotes(activeData.notes || activeData.assessment || "");
        setReviewDoctorSummary(activeData.doctorSummary || "");
        setReviewPatientResources(activeData.patientResources || "");
      } else {
        setReviewTitle("Acne SOAP Template");
        setReviewSystem("Dermatology");
        setReviewCategory("SOAP Template");
        setReviewSymptoms("Comedones, papules, pustules on face.");
        setReviewObjective("Skin exam: multiple open and closed comedones on forehead and chin. Mild erythema.");
        setReviewTreatment("Topical benzoyl peroxide, oral doxycycline.");
        setReviewNotes("Educate patient on 6-8 weeks timeline.");
        setReviewDoctorSummary("Standard acne SOAP note. No systemic features.");
        setReviewPatientResources("Australasian College of Dermatologists acne factsheet.");
      }
    }, 1200);
  };

  // Convert reviewed text sections into template fields
  const handleProceedGenerateFields = () => {
    setNewName(reviewTitle);
    setNewSystem(reviewSystem);
    setNewCategory(reviewCategory);

    const generated: { name: string; type: string; required: boolean; placeholder?: string }[] = [];
    if (reviewSymptoms.trim()) {
      generated.push({ name: "Subjective (Symptoms)", type: "Textarea", required: true, placeholder: reviewSymptoms.trim() });
    }
    if (reviewObjective.trim()) {
      generated.push({ name: "Objective (Exam / Investigations)", type: "Textarea", required: false, placeholder: reviewObjective.trim() });
    } else {
      generated.push({ name: "Objective (Exam / Investigations)", type: "Textarea", required: false, placeholder: "Physical examination findings and relevant investigation results." });
    }
    if (reviewNotes.trim()) {
      generated.push({ name: "Assessment (Clinical Notes)", type: "Textarea", required: true, placeholder: reviewNotes.trim() });
    }
    if (reviewTreatment.trim()) {
      generated.push({ name: "Plan (Management / Treatment)", type: "Textarea", required: true, placeholder: reviewTreatment.trim() });
    }
    if (reviewDoctorSummary.trim()) {
      generated.push({ name: "Doctor Revision Summary", type: "Textarea", required: false, placeholder: reviewDoctorSummary.trim() });
    }
    if (reviewPatientResources.trim()) {
      generated.push({ name: "Patient Resources", type: "Textarea", required: false, placeholder: reviewPatientResources.trim() });
    }

    setTempFields(generated);
    setActiveTab("manual");
  };

  useEffect(() => {
    const loaded = getAutofillTemplates();
    setTemplates(loaded);
    const found = loaded.find((t) => t.id === templateId);
    if (found) {
      setTemplate(found);
    }
  }, [templateId]);

  if (!template) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">Autofill Template not found.</p>
        <button onClick={() => router.push("/admin/autofill")} className={`mt-4 ${themeBtnPrimary} px-4 py-2 text-sm`}>
          Back to Templates
        </button>
      </div>
    );
  }

  const handleOpenEdit = () => {
    setNewName(template.name);
    setNewSystem(template.system);
    setNewCategory(template.category);
    setTempFields(template.sampleFields);
    setNewSubjective(template.subjective || "");
    setNewObjective(template.objective || "");
    setNewAssessment(template.assessment || "");
    setNewPlan(template.plan || "");
    setNewDoctorSummary(template.doctorSummary || "");
    setNewPatientResources(template.patientResources || "");
    setNewTagsString(template.tags?.join(", ") || "");
    setShowEditor(true);
  };

  const handleSaveTemplate = () => {
    if (!newName.trim()) {
      alert("Please enter a template name.");
      return;
    }

    const updatedTemplate: AutofillTemplate = {
      ...template,
      name: newName,
      system: newSystem,
      category: newCategory,
      fields: tempFields.length,
      sampleFields: tempFields,
      subjective: newSubjective,
      objective: newObjective,
      assessment: newAssessment,
      plan: newPlan,
      doctorSummary: newDoctorSummary,
      patientResources: newPatientResources,
      tags: newTagsString.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const updatedTemplates = templates.map((t) =>
      t.id === template.id ? updatedTemplate : t
    );

    setTemplate(updatedTemplate);
    setTemplates(updatedTemplates);
    saveAutofillTemplates(updatedTemplates);
    setShowEditor(false);
  };

  const addField = (type: string) => {
    const name = prompt(`Enter name for the ${type} field:`, `New ${type} Field`);
    if (name === null) return;
    const finalName = name.trim() || `New ${type} Field`;
    setTempFields((prev) => [...prev, { name: finalName, type, required: true }]);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
      {/* Header / Back Action */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/autofill")}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-900 transition-all shadow-sm flex items-center justify-center shrink-0 hover:scale-[1.02]"
          title="Back to Templates"
        >
          <Lucide.ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Template Details</span>
      </motion.div>

      <AdminPageHeader
        title={template.name}
        highlightedText=""
        subtitle={`${template.system} · ${template.category} · ${template.fields} Fields`}
        actions={null}
        variants={itemVariants}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Operations */}
        <div className="space-y-6">


          <motion.div
            variants={itemVariants}
            className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm space-y-3`}
          >
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Operations</h3>
            <button
              onClick={() => router.push(`/admin/autofill/${templateId}/editor`)}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-teal-800 hover:bg-teal-900 text-sm font-bold text-white rounded-xl shadow-md transition-all active:scale-[0.98] border-none outline-none cursor-pointer"
            >
              <Lucide.FileEdit className="w-4 h-4" />
              Open Editor
            </button>
            <button
              onClick={handleOpenEdit}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-100 transition-all bg-transparent cursor-pointer"
            >
              <Lucide.Edit className="w-4 h-4" />
              Edit Template Form
            </button>
            <button className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-100 transition-all bg-transparent cursor-pointer">
              <Lucide.Copy className="w-4 h-4" />
              Duplicate Template
            </button>
          </motion.div>
        </div>
        {/* Right Column: Template & Fields Preview */}
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          {/* SOAP Document Template Preview */}
          <div className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl shadow-sm overflow-hidden`}>
            {/* Header */}
            <div className="bg-slate-50/70 dark:bg-slate-850/50 px-6 py-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
                  <Lucide.FileText className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">SOAP Document Template</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-505 font-medium">Standard clinical format preview</p>
                </div>
              </div>
              <span className="text-[10px] bg-teal-50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-400 font-bold px-2.5 py-1 rounded-full border border-teal-100/30 dark:border-teal-900/20 uppercase tracking-wider select-none">
                Clinical Preview
              </span>
            </div>

            {/* Document sheet body */}
            <div className="p-8 space-y-6 font-sans select-text leading-relaxed bg-white dark:bg-slate-900/40">
              {/* Subjective */}
              <div className="space-y-2">
                <h4 style={{ fontFamily: "Georgia, serif" }} className="text-base font-bold text-teal-800 dark:text-teal-400 border-l-[3.5px] border-teal-700 dark:border-teal-500 pl-3.5 leading-none py-1">
                  Subjective
                </h4>
                <div className="text-sm text-slate-650 dark:text-slate-305 pl-4 font-normal leading-relaxed whitespace-pre-wrap">
                  {template.subjective || <em className="text-slate-400 dark:text-slate-505 font-light">No subjective notes defined in template.</em>}
                </div>
              </div>

              {/* Objective */}
              <div className="space-y-2">
                <h4 style={{ fontFamily: "Georgia, serif" }} className="text-base font-bold text-teal-800 dark:text-teal-400 border-l-[3.5px] border-teal-700 dark:border-teal-500 pl-3.5 leading-none py-1">
                  Objective
                </h4>
                <div className="text-sm text-slate-650 dark:text-slate-305 pl-4 font-normal leading-relaxed whitespace-pre-wrap">
                  {template.objective || <em className="text-slate-400 dark:text-slate-505 font-light">No objective measurements defined in template.</em>}
                </div>
              </div>

              {/* Assessment */}
              <div className="space-y-2">
                <h4 style={{ fontFamily: "Georgia, serif" }} className="text-base font-bold text-teal-800 dark:text-teal-400 border-l-[3.5px] border-teal-700 dark:border-teal-500 pl-3.5 leading-none py-1">
                  Assessment
                </h4>
                <div className="text-sm text-slate-650 dark:text-slate-305 pl-4 font-normal leading-relaxed whitespace-pre-wrap">
                  {template.assessment || <em className="text-slate-400 dark:text-slate-505 font-light">No assessment notes defined in template.</em>}
                </div>
              </div>

              {/* Plan */}
              <div className="space-y-2">
                <h4 style={{ fontFamily: "Georgia, serif" }} className="text-base font-bold text-teal-800 dark:text-teal-400 border-l-[3.5px] border-teal-700 dark:border-teal-500 pl-3.5 leading-none py-1">
                  Plan
                </h4>
                <div className="text-sm text-slate-650 dark:text-slate-305 pl-4 font-normal leading-relaxed whitespace-pre-wrap">
                  {template.plan || <em className="text-slate-400 dark:text-slate-505 font-light">No management plan defined in template.</em>}
                </div>
              </div>

              {/* Doctor Revision Summary */}
              <div className="space-y-2">
                <h4 style={{ fontFamily: "Georgia, serif" }} className="text-base font-bold text-teal-800 dark:text-teal-400 border-l-[3.5px] border-teal-700 dark:border-teal-500 pl-3.5 leading-none py-1">
                  Doctor Revision Summary
                </h4>
                <div className="text-sm text-slate-650 dark:text-slate-305 pl-4 font-normal leading-relaxed whitespace-pre-wrap">
                  {template.doctorSummary || <em className="text-slate-400 dark:text-slate-505 font-light">No revision summary notes defined in template.</em>}
                </div>
              </div>

              {/* Patient Resources */}
              <div className="space-y-2">
                <h4 style={{ fontFamily: "Georgia, serif" }} className="text-base font-bold text-teal-800 dark:text-teal-400 border-l-[3.5px] border-teal-700 dark:border-teal-500 pl-3.5 leading-none py-1">
                  Patient Resources
                </h4>
                <div className="text-sm text-slate-650 dark:text-slate-305 pl-4 font-normal leading-relaxed whitespace-pre-wrap">
                  {template.patientResources || <em className="text-slate-400 dark:text-slate-505 font-light">No patient resources specified in template.</em>}
                </div>
              </div>

              {/* Tags */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
                <h4 style={{ fontFamily: "Georgia, serif" }} className="text-sm font-bold text-teal-800 dark:text-teal-400 border-l-[3.5px] border-teal-700 dark:border-teal-500 pl-3.5 leading-none py-1">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5 pl-4">
                  {template.tags && template.tags.length > 0 ? (
                    template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold text-teal-750 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20 px-2.5 py-1 rounded-full border border-teal-100/30 dark:border-teal-900/30 select-none hover:bg-teal-100/50 dark:hover:bg-teal-900/40 transition-all cursor-default"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <em className="text-xs text-slate-400 dark:text-slate-505 font-light">No tags associated with this template.</em>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Preview */}
          <div className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm`}>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Form Fields Preview</h3>
            <motion.div
              variants={modalListVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {template.sampleFields.map((field) => {
                let iconSvg = <Lucide.FileText className="w-3.5 h-3.5" />;
                let badgeColor = "bg-teal-50 text-teal-800 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100/30 dark:border-teal-900/20";

                if (field.type === "Textarea") {
                  iconSvg = <Lucide.AlignLeft className="w-3.5 h-3.5" />;
                } else if (field.type === "Dropdown") {
                  iconSvg = <Lucide.ChevronDown className="w-3.5 h-3.5" />;
                } else if (field.type === "Numeric") {
                  iconSvg = <Lucide.Binary className="w-3.5 h-3.5" />;
                } else if (field.type === "Checkbox") {
                  iconSvg = <Lucide.CheckSquare className="w-3.5 h-3.5" />;
                } else if (field.type === "Text Input") {
                  iconSvg = <Lucide.Type className="w-3.5 h-3.5" />;
                } else if (field.type === "Date Picker") {
                  iconSvg = <Lucide.Calendar className="w-3.5 h-3.5" />;
                }

                return (
                  <motion.div
                    key={field.name}
                    variants={modalItemVariants}
                    className="flex items-start justify-between border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{field.name}</p>
                      {field.placeholder && (
                        <p className="text-xs text-slate-400 dark:text-slate-505 mt-1 font-medium">{field.placeholder}</p>
                      )}
                      {field.options && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {field.options.map((opt) => (
                            <span key={opt} className="text-[9.5px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 px-2 py-0.5 rounded-md border border-slate-200/10">{opt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 capitalize shrink-0 select-none ${badgeColor}`}>
                      {iconSvg}
                      {field.type}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </div>

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
                    Edit Autofill Template
                  </h3>
                  <button
                    onClick={() => setShowEditor(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-none outline-none bg-transparent cursor-pointer"
                  >
                    <Lucide.X className="w-5 h-5" />
                  </button>
                </div>                {/* Modal Tab Switcher */}
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

                    <div>
                      <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Subjective (Symptoms / Presentation)</label>
                      <textarea
                        value={newSubjective}
                        onChange={(e) => setNewSubjective(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                        placeholder="Subjective template text..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Objective (Exam / Investigation)</label>
                      <textarea
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                        placeholder="Objective template text..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Assessment (Clinical Guidelines / Callout Box)</label>
                      <textarea
                        value={newAssessment}
                        onChange={(e) => setNewAssessment(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                        placeholder="Assessment template text..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Plan (Management / Treatment Plan)</label>
                      <textarea
                        value={newPlan}
                        onChange={(e) => setNewPlan(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                        placeholder="Plan template text..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Doctor Revision Summary</label>
                      <textarea
                        value={newDoctorSummary}
                        onChange={(e) => setNewDoctorSummary(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                        placeholder="Summary for internal doctor revision..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Patient Resources (Links / Advice)</label>
                      <textarea
                        value={newPatientResources}
                        onChange={(e) => setNewPatientResources(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                        placeholder="Patient-facing advice / leaflets / links..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        value={newTagsString}
                        onChange={(e) => setNewTagsString(e.target.value)}
                        className={`w-full px-4 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                        placeholder="e.g. Asthma, Paediatrics, Inhaler"
                      />
                    </div>

                    <div>
                      {tempFields.length > 0 && (
                        <div className="space-y-2 mb-4 max-h-[160px] overflow-y-auto pr-1 border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Current Template Fields ({tempFields.length})</p>
                          {tempFields.map((field, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-350">{field.name} <span className="text-[10px] font-normal text-slate-400">({field.type})</span></span>
                              <button
                                onClick={() => setTempFields((prev) => prev.filter((_, idx) => idx !== i))}
                                className="text-red-500 hover:text-red-750 font-bold text-[10px] border-none bg-transparent cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Form Fields Editor</label>
                      <div className="border border-dashed border-slate-200 dark:border-slate-850 rounded-xl p-4 text-center hover:border-teal-500/80 transition-colors">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Click a field type below to append to template:</p>
                        <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
                          {fieldTypes.map((ft) => (
                            <span
                              key={ft}
                              onClick={() => addField(ft)}
                              className="text-[10px] font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/25 px-2.5 py-1 rounded-full border border-teal-100 dark:border-teal-900/40 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-teal-900/40 transition-all select-none"
                            >
                              + {ft}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setShowEditor(false)} className={`px-4 py-2.5 text-sm font-medium ${themeBtnGhost}`}>Cancel</button>
                      <button onClick={handleSaveTemplate} className={`px-4 py-2.5 text-sm font-semibold ${themeBtnPrimary}`}>
                        Save Changes
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
                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center"
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
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/60">
                          <div className="flex items-center gap-2">
                            <Lucide.FileText className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">Need the document import template?</span>
                          </div>
                          <a 
                            href="/templates/autofill_template.docx" 
                            download 
                            className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-900 shadow transition flex items-center gap-1 shrink-0 no-underline cursor-pointer"
                          >
                            <Lucide.Download className="w-3 h-3" />
                            Download Template
                          </a>
                        </div>
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

                        {/* Extracted content review & rearrangement */}
                        {extractionState === "success" && (
                          <div className="space-y-3 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-950/10">
                            <div className="flex items-center gap-1.5 text-teal-850 dark:text-teal-450 mb-1">
                              <Lucide.Sparkles className="w-4 h-4" />
                              <span className="text-xs font-bold">Review Extracted Content</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-normal mb-3">
                              The document has been analyzed. You can edit and rearrange these fields to clean up the content before generating the template.
                            </p>

                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Template Name</label>
                                <input
                                  type="text"
                                  value={reviewTitle}
                                  onChange={(e) => setReviewTitle(e.target.value)}
                                  className={`w-full px-3 py-2 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">System</label>
                                  <CustomSelect
                                    value={reviewSystem}
                                    onChange={setReviewSystem}
                                    options={[
                                      { value: "Respiratory", label: "Respiratory" },
                                      { value: "Cardiovascular", label: "Cardiovascular" },
                                      { value: "Endocrine", label: "Endocrine" },
                                      { value: "Psychiatry", label: "Psychiatry" },
                                      { value: "Dermatology", label: "Dermatology" },
                                      { value: "Women's Health", label: "Women's Health" },
                                      { value: "Paediatrics", label: "Paediatrics" }
                                    ]}
                                    className="w-full text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                                  <CustomSelect
                                    value={reviewCategory}
                                    onChange={setReviewCategory}
                                    options={[
                                      { value: "Acute", label: "Acute" },
                                      { value: "Chronic", label: "Chronic" },
                                      { value: "Screening", label: "Screening" },
                                      { value: "Mental Health", label: "Mental Health" },
                                    ]}
                                    className="w-full text-xs"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Subjective (Symptoms)</label>
                                <textarea
                                  rows={2}
                                  value={reviewSymptoms}
                                  onChange={(e) => setReviewSymptoms(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Objective (Exam / Investigations)</label>
                                <textarea
                                  rows={2}
                                  value={reviewObjective}
                                  onChange={(e) => setReviewObjective(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Assessment (Clinical Notes)</label>
                                <textarea
                                  rows={2}
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Plan (Management / Treatment)</label>
                                <textarea
                                  rows={2}
                                  value={reviewTreatment}
                                  onChange={(e) => setReviewTreatment(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Doctor Revision Summary</label>
                                <textarea
                                  rows={2}
                                  value={reviewDoctorSummary}
                                  onChange={(e) => setReviewDoctorSummary(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Patient Resources</label>
                                <textarea
                                  rows={2}
                                  value={reviewPatientResources}
                                  onChange={(e) => setReviewPatientResources(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-200"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                              <button
                                onClick={() => setUploadState("idle")}
                                className="px-3.5 py-2 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer bg-transparent"
                              >
                                Reset uploader
                              </button>
                              <button
                                onClick={handleProceedGenerateFields}
                                className="px-4 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold hover:bg-teal-900 transition-all cursor-pointer shadow border-none"
                              >
                                Proceed & Generate Fields
                              </button>
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

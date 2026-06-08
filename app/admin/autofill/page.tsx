"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const modalListVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.15 } }
};
const modalItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
};

interface AutofillTemplate {
  id: number;
  name: string;
  category: string;
  system: string;
  fields: number;
  usageCount: number;
  lastUsed: string;
  status: "active" | "draft" | "suspended";
  author: string;
  version: string;
  sampleFields: { name: string; type: string; required: boolean; placeholder?: string; options?: string[] }[];
}

const mockTemplates: AutofillTemplate[] = [
  { 
    id: 1, 
    name: "URTI Assessment", 
    category: "Acute", 
    system: "Respiratory", 
    fields: 12, 
    usageCount: 2340, 
    lastUsed: "2 mins ago", 
    status: "active", 
    author: "Dr. Arun Mehta", 
    version: "v3.1",
    sampleFields: [
      { name: "Presenting Symptoms (Cough/Sore Throat)", type: "Textarea", required: true },
      { name: "Symptom Duration (Days)", type: "Dropdown", required: true },
      { name: "Vitals (Temp, HR, SpO2)", type: "Numeric", required: true },
      { name: "Tonsillar Exudate / Swelling", type: "Checkbox", required: false },
      { name: "Management Plan & Rest Guide", type: "Textarea", required: true },
      { name: "Prescription Plan (Amoxicillin/Symptomatic)", type: "Text Input", required: false }
    ]
  },
  { 
    id: 2, 
    name: "Type 2 Diabetes Review", 
    category: "Chronic", 
    system: "Endocrine", 
    fields: 18, 
    usageCount: 1876, 
    lastUsed: "15 mins ago", 
    status: "active", 
    author: "Siddhant Udavant", 
    version: "v2.4",
    sampleFields: [
      { name: "Last HbA1c Results (mmol/mol)", type: "Numeric", required: true },
      { name: "Foot Sensation (Monofilament Test)", type: "Checkbox", required: true },
      { name: "Eye Screening Referral Status", type: "Dropdown", required: false },
      { name: "Metformin Adherence & Side Effects", type: "Textarea", required: true },
      { name: "Exercise & Diet Compliance Logs", type: "Checkbox", required: false },
      { name: "Lipid Panel (LDL, HDL, Triglycerides)", type: "Text Input", required: false }
    ]
  },
  { 
    id: 3, 
    name: "Mental Health Assessment", 
    category: "Mental Health", 
    system: "Psychiatry", 
    fields: 22, 
    usageCount: 1543, 
    lastUsed: "1 hour ago", 
    status: "active", 
    author: "Jessica Park", 
    version: "v4.0",
    sampleFields: [
      { name: "K10 Score (Distress Level)", type: "Numeric", required: true },
      { name: "Sleep Patterns & Insomnia Rating", type: "Dropdown", required: true },
      { name: "Suicide Risk Assessment Profile", type: "Textarea", required: true },
      { name: "Major Life Stressors / Triggers", type: "Textarea", required: false },
      { name: "Coping Strategies Identified", type: "Checkbox", required: false },
      { name: "Mental Health Care Plan Activation", type: "Checkbox", required: true }
    ]
  },
  { 
    id: 4, 
    name: "Skin Check Template", 
    category: "Screening", 
    system: "Dermatology", 
    fields: 8, 
    usageCount: 987, 
    lastUsed: "3 hours ago", 
    status: "active", 
    author: "Dr. Arun Mehta", 
    version: "v1.2",
    sampleFields: [
      { name: "Anatomical Location of Lesion", type: "Dropdown", required: true },
      { name: "Size & Dimensions (mm)", type: "Numeric", required: true },
      { name: "Border Regularity & Symmetry", type: "Checkbox", required: true },
      { name: "Evolution / Growth Speed", type: "Dropdown", required: false },
      { name: "Biopsy Plan & Patient Consent", type: "Textarea", required: false },
      { name: "Dermoscopic Photos Uploaded", type: "Checkbox", required: true }
    ]
  },
  { 
    id: 5, 
    name: "Antenatal Visit", 
    category: "Obstetrics", 
    system: "Women's Health", 
    fields: 24, 
    usageCount: 654, 
    lastUsed: "5 hours ago", 
    status: "active", 
    author: "Siddhant Udavant", 
    version: "v2.0",
    sampleFields: [
      { name: "Gestation Age (Weeks/Days)", type: "Numeric", required: true },
      { name: "Maternal Blood Pressure (BP)", type: "Numeric", required: true },
      { name: "Fetal Heart Rate (bpm)", type: "Numeric", required: true },
      { name: "Symphyseal Fundal Height (cm)", type: "Numeric", required: false },
      { name: "Fetal Movement Status", type: "Dropdown", required: true },
      { name: "Urine Protein Dipstick Result", type: "Dropdown", required: false }
    ]
  },
  { 
    id: 6, 
    name: "Paediatric Well Child Check", 
    category: "Screening", 
    system: "Paediatrics", 
    fields: 16, 
    usageCount: 432, 
    lastUsed: "1 day ago", 
    status: "active", 
    author: "Dr. Arun Mehta", 
    version: "v1.8",
    sampleFields: [
      { name: "Weight & Length Percentiles", type: "Numeric", required: true },
      { name: "Gross Motor Milestones Rating", type: "Dropdown", required: true },
      { name: "Language / Social Development Status", type: "Dropdown", required: true },
      { name: "Vision & Hearing Screening Result", type: "Checkbox", required: false },
      { name: "Immunisation Status Check", type: "Checkbox", required: true },
      { name: "Parent Concerns / Nutrition Log", type: "Textarea", required: false }
    ]
  },
  { 
    id: 7, 
    name: "Hypertension Review", 
    category: "Chronic", 
    system: "Cardiovascular", 
    fields: 14, 
    usageCount: 876, 
    lastUsed: "2 hours ago", 
    status: "active", 
    author: "Siddhant Udavant", 
    version: "v3.2",
    sampleFields: [
      { name: "Home Blood Pressure Readings Log", type: "Textarea", required: true },
      { name: "Kidney Function (eGFR & ACR)", type: "Numeric", required: true },
      { name: "Cardiovascular Risk Score", type: "Numeric", required: false },
      { name: "Compliance with Antihypertensives", type: "Dropdown", required: true },
      { name: "Salt Intake & Weight Management Goals", type: "Textarea", required: false },
      { name: "ECG Findings & Heart Sounds", type: "Text Input", required: false }
    ]
  },
  { 
    id: 8, 
    name: "GORD Assessment", 
    category: "GI", 
    system: "Gastroenterology", 
    fields: 10, 
    usageCount: 345, 
    lastUsed: "1 day ago", 
    status: "draft", 
    author: "Jessica Park", 
    version: "v1.0",
    sampleFields: [
      { name: "Heartburn Frequency (Weekly)", type: "Numeric", required: true },
      { name: "Severity & Nocturnal Symptoms", type: "Dropdown", required: true },
      { name: "Dysphagia / Odynophagia (Alarm Flags)", type: "Checkbox", required: true },
      { name: "PPI Trial Plan & Dose", type: "Text Input", required: false },
      { name: "Weight Loss / Appetite Check", type: "Checkbox", required: false },
      { name: "Endoscopy Referral Details", type: "Textarea", required: false }
    ]
  },
  { 
    id: 9, 
    name: "Lower Back Pain", 
    category: "MSK", 
    system: "Musculoskeletal", 
    fields: 15, 
    usageCount: 567, 
    lastUsed: "6 hours ago", 
    status: "active", 
    author: "Dr. Arun Mehta", 
    version: "v2.1",
    sampleFields: [
      { name: "Onset, Trigger & Location of Pain", type: "Textarea", required: true },
      { name: "Radiation (Sciatica) & Sensory Loss", type: "Checkbox", required: true },
      { name: "Red Flags (Bowels/Bladder Retention)", type: "Checkbox", required: true },
      { name: "Straight Leg Raise (SLR) Angle", type: "Numeric", required: false },
      { name: "Analgesia Regimen (NSAIDs/Paracetamol)", type: "Text Input", required: false },
      { name: "Physiotherapy Referral Plan", type: "Textarea", required: false }
    ]
  },
  { 
    id: 10, 
    name: "MBS 721 — GPMP Template", 
    category: "Billing", 
    system: "MBS", 
    fields: 20, 
    usageCount: 198, 
    lastUsed: "2 days ago", 
    status: "draft", 
    author: "Jessica Park", 
    version: "v0.9",
    sampleFields: [
      { name: "Primary Chronic Medical Conditions", type: "Textarea", required: true },
      { name: "Patient Co-designed Care Goals", type: "Textarea", required: true },
      { name: "Allied Health Referrals Scheduled", type: "Checkbox", required: true },
      { name: "Care Team Members & Contact info", type: "Textarea", required: false },
      { name: "GPMP Consent Form Signed", type: "Checkbox", required: true },
      { name: "Review Date Scheduled (6 months)", type: "Date Picker", required: true }
    ]
  }
];

const fieldTypes = ["Text Input", "Dropdown", "Checkbox", "Radio", "Textarea", "Date Picker", "Numeric", "Calculated"];

type ViewMode = "grid" | "table";

/* ---------- System color mapping ---------- */
const systemColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  Respiratory: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Endocrine: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Psychiatry: { bg: "bg-teal-50/40 dark:bg-teal-950/10", text: "text-teal-600", border: "border-teal-100/50 dark:border-teal-900/20", gradient: "from-teal-800 to-teal-900" },
  Dermatology: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  "Women's Health": { bg: "bg-teal-50/50 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/50 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Paediatrics: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Cardiovascular: { bg: "bg-teal-50/60 dark:bg-teal-950/25", text: "text-teal-600", border: "border-teal-100/60 dark:bg-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Gastroenterology: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  Musculoskeletal: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
  MBS: { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100/70 dark:border-teal-900/30", gradient: "from-teal-800 to-teal-900" },
};
const defaultSystemColor = { bg: "bg-teal-50/60 dark:bg-teal-950/20", text: "text-teal-600", border: "border-teal-100 dark:border-teal-900/20", gradient: "from-teal-800 to-teal-900" };

/* ---------- Mini field-type icons (just generic stacked bars) ---------- */
const fieldTypeIcons: Record<string, string> = {
  Textarea: "M4 6h16M4 10h16M4 14h10",
  Dropdown: "M8 9l4-4 4 4m0 6l-4 4-4-4",
  Numeric: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14",
  Checkbox: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  "Text Input": "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
};

/* ---------- Usage sparkline (fake) ---------- */
function UsageBar({ count, max }: { count: number; max: number }) {
  const pct = Math.min(100, (count / max) * 100);
  return (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-teal-700"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      />
    </div>
  );
}

export default function AutofillPage() {
  const [templates, setTemplates] = useState(mockTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<AutofillTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [newSystem, setNewSystem] = useState("Respiratory");
  const [newCategory, setNewCategory] = useState("Acute");
  const [newName, setNewName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [tempFields, setTempFields] = useState<{ name: string; type: string; required: boolean }[]>([]);

  const handleOpenEdit = (template: AutofillTemplate) => {
    setEditingTemplateId(template.id);
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

    if (editingTemplateId !== null) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplateId
            ? {
                ...t,
                name: newName,
                system: newSystem,
                category: newCategory,
                fields: tempFields.length,
                sampleFields: tempFields,
              }
            : t
        )
      );
      if (selectedTemplate && selectedTemplate.id === editingTemplateId) {
        setSelectedTemplate({
          ...selectedTemplate,
          name: newName,
          system: newSystem,
          category: newCategory,
          fields: tempFields.length,
          sampleFields: tempFields,
        });
      }
    } else {
      const newTemplate: AutofillTemplate = {
        id: templates.length + 1,
        name: newName,
        system: newSystem,
        category: newCategory,
        fields: tempFields.length,
        usageCount: 0,
        lastUsed: "Just now",
        status: "active",
        author: "Dr. Siddhant Udavant",
        version: "v1.0",
        sampleFields: tempFields.length > 0 ? tempFields : [
          { name: "Symptom Log", type: "Textarea", required: true },
          { name: "Treatment Path", type: "Dropdown", required: true }
        ]
      };
      setTemplates((prev) => [newTemplate, ...prev]);
    }

    setShowEditor(false);
    setEditingTemplateId(null);
  };

  const addField = (type: string) => {
    const name = prompt(`Enter name for the ${type} field:`, `New ${type} Field`);
    if (name === null) return;
    const finalName = name.trim() || `New ${type} Field`;
    setTempFields((prev) => [...prev, { name: finalName, type, required: true }]);
  };

  // Lock body scroll when drawer or modal is open to prevent background scrolling lag
  useEffect(() => {
    if (selectedTemplate || showEditor) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedTemplate, showEditor]);

  const filtered = templates.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.system.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
  const maxUsage = Math.max(...templates.map((t) => t.usageCount));

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
            className="px-4 py-2.5 bg-teal-800 text-sm font-semibold text-white rounded-xl hover:bg-teal-900 transition-all shadow-sm flex items-center gap-2 shrink-0 border-none outline-none"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Template
          </button>
        }
        variants={itemVariants}
      />
      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Active Templates"
          percentage="+12%"
          data={templates.filter((t) => t.status === "active").length.toString()}
          progress={Math.round((templates.filter((t) => t.status === "active").length / templates.length) * 100)}
        />
        <AnalyticsCard
          title="Total Fields"
          percentage="+8%"
          data={templates.reduce((sum, t) => sum + t.fields, 0).toString()}
          progress={Math.min(100, Math.round((templates.reduce((sum, t) => sum + t.fields, 0) / 200) * 100))}
        />
        <AnalyticsCard
          title="Total Usage"
          percentage="+24%"
          data={totalUsage.toLocaleString()}
          progress={Math.min(100, Math.round((totalUsage / 12000) * 100))}
        />
        <AnalyticsCard
          title="Avg Fields/Template"
          percentage="+5%"
          data={Math.round(templates.reduce((sum, t) => sum + t.fields, 0) / templates.length).toString()}
          progress={Math.min(100, Math.round((Math.round(templates.reduce((sum, t) => sum + t.fields, 0) / templates.length) / 30) * 100))}
        />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700/60 dark:text-slate-100 transition-all" />
        </div>
        {["all", "active", "draft", "suspended"].map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${statusFilter === f ? "bg-teal-50 text-teal-800 border-teal-200/70 dark:bg-teal-950/25 dark:text-teal-400 dark:border-teal-900/40" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-600"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </motion.div>      {/* ========== CARD GRID VIEW ========== */}
      {viewMode === "grid" && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((template, idx) => {
            const sc = systemColors[template.system] || defaultSystemColor;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setSelectedTemplate(template)}
                className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-teal-200/70 dark:border-teal-900/40 shadow-md dark:shadow-none shadow-slate-200/40 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-teal-900/10 hover:border-teal-300 dark:hover:border-teal-700 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Gradient header with system color */}
                <div className={`relative bg-gradient-to-r ${sc.gradient} px-5 py-4`}>
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white leading-snug">{template.name}</p>
                      <p className="text-[11px] text-white/70 mt-1">{template.system} · {template.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge variant={template.status} />
                      <span className="text-[10px] font-mono text-white/60 bg-white/10 px-1.5 py-0.5 rounded">{template.version}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* Sample fields list preview */}
                  <div className="mb-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-2">Sample Fields</p>
                    <div className="space-y-1.5 min-h-[96px]">
                      {template.sampleFields.slice(0, 4).map((field, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: `var(--${sc.text.replace("text-", "").replace("-600", "")}-400, #0d9488)` }} />
                          <span className="text-xs text-slate-600 dark:text-slate-400 truncate font-semibold">{field.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-2.5 text-center">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{template.fields}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Fields</p>
                    </div>
                    <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-2.5 text-center">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{template.usageCount.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Uses</p>
                    </div>
                    <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-2.5 text-center">
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-tight">{template.lastUsed}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Last</p>
                    </div>
                  </div>

                  {/* Usage bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Popularity</span>
                      <span className="text-[9px] text-slate-400">{Math.round((template.usageCount / maxUsage) * 100)}%</span>
                    </div>
                    <UsageBar count={template.usageCount} max={maxUsage} />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-medium truncate">by {template.author}</span>
                    <div className="flex items-center gap-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-800 hover:bg-teal-50/60 dark:hover:bg-teal-950/25 transition-all"
                        title="View Details"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        title="Duplicate"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(template); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-850 hover:bg-teal-50/60 dark:hover:bg-teal-950/25 transition-all"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ========== TABLE VIEW ========== */}
      {viewMode === "table" && (
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/40">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Template</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">System</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Fields</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Usage</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Last Used</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Version</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group cursor-pointer" onClick={() => setSelectedTemplate(t)}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.category} · by {t.author}</p>
                    </td>
                    <td className="px-4 py-4"><span className="text-sm text-slate-600">{t.system}</span></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {Array.from({ length: Math.min(t.fields, 5) }).map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-teal-400 border border-white" />
                          ))}
                          {t.fields > 5 && <span className="text-[10px] text-slate-400 ml-1.5">+{t.fields - 5}</span>}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{t.fields}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-slate-700">{t.usageCount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4"><span className="text-sm text-slate-500">{t.lastUsed}</span></td>
                    <td className="px-4 py-4"><span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">{t.version}</span></td>
                    <td className="px-4 py-4"><StatusBadge variant={t.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-800 hover:bg-teal-50/60 transition-all" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-850 hover:bg-teal-50/60 transition-all" title="Duplicate">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400">No templates found matching your criteria.</p>
        </div>
      )}

      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            key="autofill-detail-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 cursor-pointer"
            onClick={() => setSelectedTemplate(null)}
          />
        )}
        {selectedTemplate && (
          <motion.div 
            key="autofill-detail-drawer-content"
            initial={{ x: "calc(100% + 2rem)", opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: "calc(100% + 2rem)", opacity: 0 }} 
            transition={{ type: "spring", damping: 34, stiffness: 280, mass: 0.9 }} 
            className="fixed right-4 top-4 bottom-4 w-[calc(100%-2rem)] max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl overflow-hidden flex flex-col rounded-2xl z-50"
          >
            {/* Decorative top accent line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800" />
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 relative flex-shrink-0 bg-white/40 dark:bg-slate-900/40">
              <button 
                onClick={() => setSelectedTemplate(null)} 
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 group"
              >
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="flex items-center gap-2 mb-2.5">
                <StatusBadge variant={selectedTemplate.status} />
                <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/20 dark:border-slate-700/20">{selectedTemplate.version}</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">{selectedTemplate.name}</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{selectedTemplate.system} · {selectedTemplate.category} · by {selectedTemplate.author}</p>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {/* Stats cards grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800 p-3 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all">
                  <p className="text-xl font-serif text-teal-750 dark:text-teal-400 font-bold">{selectedTemplate.fields}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Fields</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800 p-3 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all">
                  <p className="text-xl font-serif text-teal-800 dark:text-teal-400 font-bold">{selectedTemplate.usageCount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Total Uses</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800 p-3 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all flex flex-col justify-center">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1">{selectedTemplate.lastUsed}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-1.5">Last Used</p>
                </div>
              </div>

              {/* Field preview list */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Form Fields Preview</h3>
                <motion.div 
                  variants={modalListVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2.5"
                >
                  {selectedTemplate.sampleFields.map((field, i) => {
                    let iconSvg = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
                    let badgeColor = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
                    
                    if (field.type === "Textarea") {
                      iconSvg = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
                      badgeColor = "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/20";
                    } else if (field.type === "Dropdown") {
                      iconSvg = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>;
                      badgeColor = "bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100/30 dark:border-teal-900/20";
                    } else if (field.type === "Numeric") {
                      iconSvg = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;
                      badgeColor = "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/30 dark:border-amber-900/20";
                    } else if (field.type === "Checkbox") {
                      iconSvg = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                      badgeColor = "bg-teal-50 text-teal-800 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100/30 dark:border-teal-900/20";
                    } else if (field.type === "Text Input") {
                      iconSvg = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
                      badgeColor = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/20";
                    } else if (field.type === "Date Picker") {
                      iconSvg = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
                      badgeColor = "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100/30 dark:border-purple-900/20";
                    }
                    
                    return (
                      <motion.div 
                        key={field.name}
                        variants={modalItemVariants}
                        className="flex items-start justify-between border border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/20 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{field.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-550 mt-1 font-medium">{field.placeholder}</p>
                          {field.options && (
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {field.options.map((opt) => (
                                <span key={opt} className="text-[9.5px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200/10">{opt}</span>
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
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex gap-3 flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <button 
                onClick={() => {
                  setSelectedTemplate(null);
                  setEditingTemplateId(selectedTemplate.id);
                  setNewName(selectedTemplate.name);
                  setNewSystem(selectedTemplate.system);
                  setNewCategory(selectedTemplate.category);
                  setTempFields([...selectedTemplate.sampleFields]);
                  setShowEditor(true);
                }} 
                className="flex-1 text-center px-4 py-2.5 bg-teal-800 text-sm font-bold text-white rounded-xl shadow-md hover:bg-teal-900 active:scale-[0.98] transition-all"
              >
                Edit Template Form
              </button>
              <button className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all">Duplicate</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 top-[5%] mx-auto max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white dark:border-slate-800 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] pointer-events-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-normal text-slate-900 dark:text-slate-100 tracking-tight">
                    {editingTemplateId !== null ? "Edit Autofill Template" : "New Autofill Template"}
                  </h2>
                  <button onClick={() => setShowEditor(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Template Name</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700/60 dark:text-slate-100 transition-all" 
                      placeholder="e.g. URTI Assessment" 
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
                    {tempFields.length > 0 && (
                      <div className="space-y-2 mb-4 max-h-[160px] overflow-y-auto pr-1 border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-955/20">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-505 font-bold mb-1.5">Current Template Fields ({tempFields.length})</p>
                        {tempFields.map((field, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-150 dark:border-slate-800 text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-350">{field.name} <span className="text-[10px] font-normal text-slate-400">({field.type})</span></span>
                            <button 
                              onClick={() => setTempFields((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-red-500 hover:text-red-750 font-bold text-[10px]"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Form Fields Editor</label>
                    <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-teal-350 dark:hover:border-teal-500/80 transition-colors">
                      <p className="text-xs font-bold text-slate-505 dark:text-slate-400 mb-1">Click a field type below to append to template:</p>
                      <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
                        {fieldTypes.map((ft) => (
                          <span 
                            key={ft} 
                            onClick={() => addField(ft)}
                            className="text-[10px] font-medium text-teal-750 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/25 px-2.5 py-1 rounded-full border border-teal-100 dark:border-teal-900/40 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-teal-900/40 transition-all select-none"
                          >
                            + {ft}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowEditor(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
                    <button onClick={handleSaveTemplate} className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-800 rounded-xl hover:bg-teal-900 transition-all shadow-sm shadow-teal-900/20">
                      {editingTemplateId !== null ? "Save Changes" : "Create Template"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

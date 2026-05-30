"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

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
}

const mockTemplates: AutofillTemplate[] = [
  { id: 1, name: "URTI Assessment", category: "Acute", system: "Respiratory", fields: 12, usageCount: 2340, lastUsed: "2 mins ago", status: "active", author: "Dr. Arun Mehta", version: "v3.1" },
  { id: 2, name: "Type 2 Diabetes Review", category: "Chronic", system: "Endocrine", fields: 18, usageCount: 1876, lastUsed: "15 mins ago", status: "active", author: "Siddhant Udavant", version: "v2.4" },
  { id: 3, name: "Mental Health Assessment", category: "Mental Health", system: "Psychiatry", fields: 22, usageCount: 1543, lastUsed: "1 hour ago", status: "active", author: "Jessica Park", version: "v4.0" },
  { id: 4, name: "Skin Check Template", category: "Screening", system: "Dermatology", fields: 8, usageCount: 987, lastUsed: "3 hours ago", status: "active", author: "Dr. Arun Mehta", version: "v1.2" },
  { id: 5, name: "Antenatal Visit", category: "Obstetrics", system: "Women's Health", fields: 24, usageCount: 654, lastUsed: "5 hours ago", status: "active", author: "Siddhant Udavant", version: "v2.0" },
  { id: 6, name: "Paediatric Well Child Check", category: "Screening", system: "Paediatrics", fields: 16, usageCount: 432, lastUsed: "1 day ago", status: "active", author: "Dr. Arun Mehta", version: "v1.8" },
  { id: 7, name: "Hypertension Review", category: "Chronic", system: "Cardiovascular", fields: 14, usageCount: 876, lastUsed: "2 hours ago", status: "active", author: "Siddhant Udavant", version: "v3.2" },
  { id: 8, name: "GORD Assessment", category: "GI", system: "Gastroenterology", fields: 10, usageCount: 345, lastUsed: "1 day ago", status: "draft", author: "Jessica Park", version: "v1.0" },
  { id: 9, name: "Lower Back Pain", category: "MSK", system: "Musculoskeletal", fields: 15, usageCount: 567, lastUsed: "6 hours ago", status: "active", author: "Dr. Arun Mehta", version: "v2.1" },
  { id: 10, name: "MBS 721 — GPMP Template", category: "Billing", system: "MBS", fields: 20, usageCount: 198, lastUsed: "2 days ago", status: "draft", author: "Jessica Park", version: "v0.9" },
];

const fieldTypes = ["Text Input", "Dropdown", "Checkbox", "Radio", "Textarea", "Date Picker", "Numeric", "Calculated"];

type ViewMode = "grid" | "table";

/* ---------- System color mapping ---------- */
const systemColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  Respiratory: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", gradient: "from-teal-500 to-emerald-500" },
  Endocrine: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", gradient: "from-emerald-500 to-green-500" },
  Psychiatry: { bg: "bg-green-50", text: "text-green-600", border: "border-green-100", gradient: "from-green-500 to-teal-500" },
  Dermatology: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", gradient: "from-slate-500 to-slate-600" },
  "Women's Health": { bg: "bg-teal-50/50", text: "text-teal-700", border: "border-teal-100/50", gradient: "from-teal-600 to-slate-500" },
  Paediatrics: { bg: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100/50", gradient: "from-emerald-500 to-slate-500" },
  Cardiovascular: { bg: "bg-green-50/50", text: "text-green-700", border: "border-green-100/50", gradient: "from-green-600 to-teal-600" },
  Gastroenterology: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", gradient: "from-emerald-500 to-teal-600" },
  Musculoskeletal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", gradient: "from-teal-500 to-emerald-600" },
  MBS: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", gradient: "from-slate-500 to-slate-700" },
};
const defaultSystemColor = { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100", gradient: "from-teal-500 to-emerald-600" };

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
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
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

  const filtered = templates.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.system.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
  const maxUsage = Math.max(...templates.map((t) => t.usageCount));

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
          <h1 className="font-serif text-2xl lg:text-3xl font-normal text-white tracking-tight leading-tight mb-1">Autofill Templates</h1>
          <p className="text-sm text-teal-100 font-light">Manage consultation autofill templates and form builders</p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            <span className="text-xs font-semibold text-teal-200">{totalUsage.toLocaleString()} total uses</span>
          </div>
          {/* View Toggle */}
          <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl p-1 gap-0.5 border border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"}`}
              title="Card View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"}`}
              title="Table View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
          </div>
          <button onClick={() => setShowEditor(true)} className="px-4 py-2.5 bg-white text-sm font-semibold text-teal-800 rounded-full hover:bg-teal-50 transition-all shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Template
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Templates", value: templates.filter((t) => t.status === "active").length, color: "text-teal-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Total Fields", value: templates.reduce((sum, t) => sum + t.fields, 0), color: "text-green-600", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
          { label: "Total Usage", value: totalUsage.toLocaleString(), color: "text-emerald-600", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          { label: "Avg Fields/Template", value: Math.round(templates.reduce((sum, t) => sum + t.fields, 0) / templates.length), color: "text-slate-600", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
        ].map((s) => (
          <div key={s.label} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-5 shadow-md shadow-slate-200/30 relative overflow-hidden group hover:shadow-lg hover:border-teal-200/60 hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/5 pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className={`text-2xl font-bold ${s.color} mb-0.5`}>{s.value}</p>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
              </div>
              <div className={`p-2 rounded-xl bg-slate-50 ${s.color} opacity-40`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" />
        </div>
        {["all", "active", "draft", "suspended"].map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${statusFilter === f ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* ========== CARD GRID VIEW ========== */}
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
                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-md shadow-slate-200/40 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-200/60 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Gradient header with system color */}
                <div className={`relative bg-gradient-to-r ${sc.gradient} px-5 py-4`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:12px_12px] pointer-events-none" />
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
                  {/* Mini form-layout mockup */}
                  <div className="mb-4 space-y-1.5">
                    {[
                      { w: "w-full", h: "h-2.5" },
                      { w: "w-3/4", h: "h-2" },
                      { w: "w-1/2", h: "h-2" },
                      { w: "w-5/6", h: "h-2.5" },
                    ].map((bar, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${sc.bg.replace("50", "400")} flex-shrink-0`} style={{ backgroundColor: `var(--${sc.text.replace("text-", "").replace("-600", "")}-400, #94a3b8)` }} />
                        <motion.div
                          className={`${bar.h} rounded-full bg-slate-100`}
                          style={{ width: "100%" }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className={`h-full ${bar.w} rounded-full bg-slate-200/80`} />
                        </motion.div>
                      </div>
                    ))}
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-50/80 rounded-xl p-2.5 text-center">
                      <p className="text-sm font-bold text-slate-700">{template.fields}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Fields</p>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-2.5 text-center">
                      <p className="text-sm font-bold text-slate-700">{template.usageCount.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Uses</p>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-2.5 text-center">
                      <p className="text-[11px] font-semibold text-slate-600 leading-tight">{template.lastUsed}</p>
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
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100/60">
                    <span className="text-[10px] text-slate-400 font-medium truncate">by {template.author}</span>
                    <div className="flex items-center gap-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
                        title="View Details"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                        title="Duplicate"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
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
                  <tr key={t.id} className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer" onClick={() => setSelectedTemplate(t)}>
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
                        <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Duplicate">
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

      {/* Template detail slide-over */}
      <AnimatePresence>
        {selectedTemplate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setSelectedTemplate(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white/95 backdrop-blur-2xl border-l border-white z-50 shadow-2xl overflow-y-auto">
              <div className="p-6">
                <button onClick={() => setSelectedTemplate(null)} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge variant={selectedTemplate.status} />
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{selectedTemplate.version}</span>
                </div>
                <h2 className="font-serif text-xl text-slate-900 mb-1">{selectedTemplate.name}</h2>
                <p className="text-sm text-slate-500 mb-6">{selectedTemplate.system} · {selectedTemplate.category} · by {selectedTemplate.author}</p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-xl font-serif text-teal-600">{selectedTemplate.fields}</p><p className="text-[10px] text-slate-400 font-medium">Fields</p></div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-xl font-serif text-emerald-600">{selectedTemplate.usageCount.toLocaleString()}</p><p className="text-[10px] text-slate-400 font-medium">Uses</p></div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-sm font-semibold text-slate-700 mt-1">{selectedTemplate.lastUsed}</p><p className="text-[10px] text-slate-400 font-medium">Last Used</p></div>
                </div>

                {/* Field preview */}
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Form Fields Preview</h3>
                <div className="space-y-2 mb-6">
                  {[
                    { name: "Presenting Complaint", type: "Textarea", required: true },
                    { name: "Duration of Symptoms", type: "Dropdown", required: true },
                    { name: "Severity (1–10)", type: "Numeric", required: true },
                    { name: "Associated Symptoms", type: "Checkbox", required: false },
                    { name: "Medications Tried", type: "Text Input", required: false },
                    { name: "Examination Findings", type: "Textarea", required: true },
                  ].map((field, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-teal-200 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-600 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{field.name}</p>
                          <p className="text-[10px] text-slate-400">{field.type}{field.required ? " · Required" : ""}</p>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2.5 bg-teal-500 text-sm font-semibold text-white rounded-xl hover:bg-teal-600 transition-all">Edit Template</button>
                  <button className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Export</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Template builder modal */}
      <AnimatePresence>
        {showEditor && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setShowEditor(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed inset-x-4 top-[5%] mx-auto max-w-2xl bg-white/95 backdrop-blur-2xl border border-white rounded-2xl z-50 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-normal text-slate-900 tracking-tight">New Autofill Template</h2>
                  <button onClick={() => setShowEditor(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Template Name</label><input type="text" className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" placeholder="e.g. URTI Assessment" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">System</label><select className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600"><option>Respiratory</option><option>Cardiovascular</option><option>Endocrine</option><option>Psychiatry</option><option>Dermatology</option></select></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label><select className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600"><option>Acute</option><option>Chronic</option><option>Screening</option><option>Mental Health</option></select></div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Form Fields</label>
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-teal-300 transition-colors cursor-pointer">
                      <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                      <p className="text-sm font-medium text-slate-500">Add form fields</p>
                      <p className="text-xs text-slate-400 mt-1">Drag and drop or click to add fields</p>
                      <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                        {fieldTypes.map((ft) => (
                          <span key={ft} className="text-[10px] font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full border border-teal-100 cursor-pointer hover:bg-teal-100 transition-all">{ft}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowEditor(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                    <button onClick={() => setShowEditor(false)} className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-all shadow-sm shadow-teal-500/20">Create Template</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

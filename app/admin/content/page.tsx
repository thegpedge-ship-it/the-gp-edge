"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

interface MedicalContent {
  id: number;
  name: string;
  category: string;
  system: string;
  type: "Condition" | "Guideline" | "Protocol" | "Pathway";
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
  Condition: "bg-blue-50 text-blue-700 border-blue-200",
  Guideline: "bg-teal-50 text-teal-700 border-teal-200",
  Protocol: "bg-violet-50 text-violet-700 border-violet-200",
  Pathway: "bg-amber-50 text-amber-700 border-amber-200",
};

const systems = Array.from(new Set(mockContent.map((c) => c.system)));

export default function ContentPage() {
  const [content, setContent] = useState(mockContent);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContent, setSelectedContent] = useState<MedicalContent | null>(null);

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
          <button className="px-4 py-2.5 bg-white text-sm font-semibold text-teal-800 rounded-full hover:bg-teal-50 transition-all shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Content
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Guidelines", value: content.filter((c) => c.type === "Guideline").length, icon: "📋", color: "text-teal-600" },
          { label: "Protocols", value: content.filter((c) => c.type === "Protocol").length, icon: "⚡", color: "text-violet-600" },
          { label: "Pathways", value: content.filter((c) => c.type === "Pathway").length, icon: "🔀", color: "text-amber-600" },
          { label: "Linked Questions", value: content.reduce((sum, c) => sum + c.usedInQuestions, 0), icon: "🔗", color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-4 shadow-md shadow-slate-200/30 relative overflow-hidden group hover:shadow-lg hover:border-teal-200/60 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/5 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className={`text-2xl font-serif ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" />
        </div>
        <select value={systemFilter} onChange={(e) => setSystemFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600">
          <option value="all">All Systems</option>
          {systems.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600">
          <option value="all">All Types</option>
          <option value="Guideline">Guideline</option>
          <option value="Protocol">Protocol</option>
          <option value="Pathway">Pathway</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600">
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
            className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative group hover:shadow-lg hover:border-teal-200/60 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-300 cursor-pointer"
            onClick={() => setSelectedContent(item)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
            <div className="relative z-10 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColors[item.type]}`}>{item.type}</span>
                  <StatusBadge variant={item.status} />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{item.lastUpdated}</span>
              </div>
              <h3 className="font-serif text-base text-slate-900 mb-1 leading-tight group-hover:text-teal-700 transition-colors">{item.name}</h3>
              <p className="text-xs text-slate-400 mb-4">{item.system} · {item.category}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    {item.references} refs
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {item.usedInQuestions} Q
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  {item.status === "draft" && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(item.id, "review"); }} className="p-1 rounded-lg text-amber-500 hover:bg-amber-50 transition-all" title="Send to Review">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}
                  {item.status === "review" && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(item.id, "published"); }} className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-all" title="Publish">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Detail slide-over */}
      <AnimatePresence>
        {selectedContent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setSelectedContent(null)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white/95 backdrop-blur-2xl border-l border-white z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <button onClick={() => setSelectedContent(null)} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${typeColors[selectedContent.type]}`}>{selectedContent.type}</span>
                  <StatusBadge variant={selectedContent.status} />
                </div>
                <h2 className="font-serif text-xl text-slate-900 mb-2">{selectedContent.name}</h2>
                <p className="text-sm text-slate-500 mb-6">{selectedContent.system} · {selectedContent.category}</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-400 mb-1">References</p><p className="text-xl font-serif text-slate-900">{selectedContent.references}</p></div>
                  <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-400 mb-1">Used in Questions</p><p className="text-xl font-serif text-slate-900">{selectedContent.usedInQuestions}</p></div>
                  <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-400 mb-1">Author</p><p className="text-sm font-semibold text-slate-700">{selectedContent.author}</p></div>
                  <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-400 mb-1">Last Updated</p><p className="text-sm font-semibold text-slate-700">{selectedContent.lastUpdated}</p></div>
                </div>

                {/* Content Editor Preview */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Content Preview</h3>
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      {["B", "I", "U", "H1", "H2", "•", "1.", "🔗", "📷"].map((btn) => (
                        <button key={btn} className="w-8 h-8 text-xs font-bold text-slate-500 bg-slate-50 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center">{btn}</button>
                      ))}
                    </div>
                    <div className="prose prose-sm text-slate-700 max-w-none">
                      <p className="text-sm text-slate-600 leading-relaxed">This is a preview of the clinical content for <strong>{selectedContent.name}</strong>. In a full implementation, this would contain the detailed medical content, references, and clinical guidelines.</p>
                      <p className="text-sm text-slate-500 leading-relaxed mt-2">Key points, evidence levels, and management algorithms would be displayed here with proper formatting.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2.5 bg-teal-500 text-sm font-semibold text-white rounded-xl hover:bg-teal-600 transition-all">Edit Content</button>
                  <button className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Duplicate</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

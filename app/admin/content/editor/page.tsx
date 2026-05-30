"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

interface ContentBlock {
  id: string;
  type: "heading" | "paragraph" | "list" | "callout" | "code" | "table" | "divider" | "image";
  content: string;
  meta?: Record<string, string>;
}

const initialBlocks: ContentBlock[] = [
  { id: "b1", type: "heading", content: "Type 2 Diabetes Management in General Practice" },
  { id: "b2", type: "paragraph", content: "Type 2 diabetes mellitus (T2DM) is a chronic metabolic disorder characterised by hyperglycaemia resulting from progressive impairment of insulin secretion and/or action. It affects approximately 1.3 million Australians, with prevalence increasing due to ageing populations and lifestyle factors." },
  { id: "b3", type: "callout", content: "Key Guideline: RACGP recommends screening all patients ≥40 years using the AUSDRISK tool every 3 years. High-risk groups should be screened from age 18.", meta: { variant: "info" } },
  { id: "b4", type: "heading", content: "Initial Assessment" },
  { id: "b5", type: "list", content: "HbA1c (target generally <7% or 53 mmol/mol)\nFasting glucose and lipid profile\neGFR and urine albumin:creatinine ratio\nBlood pressure measurement\nFoot examination and risk stratification\nEye examination referral\nCardiovascular risk assessment" },
  { id: "b6", type: "paragraph", content: "The initial management approach should include lifestyle interventions as the foundation of care. This includes dietary modification (Mediterranean-style or DASH diet), regular physical activity (150 mins/week moderate intensity), weight management (5-10% loss target if overweight), and smoking cessation." },
  { id: "b7", type: "callout", content: "MBS Billing: Use item 721 (GP Management Plan) for initial care plan setup. Item 723 for Team Care Arrangements when involving allied health professionals. Review under item 732 at least every 12 months.", meta: { variant: "billing" } },
  { id: "b8", type: "heading", content: "Pharmacological Management" },
  { id: "b9", type: "paragraph", content: "First-line therapy is metformin (500mg BD, titrate to 1g BD). If HbA1c target not met after 3 months, consider adding a second agent. Second-line options include SGLT2 inhibitors (especially if cardiovascular or renal comorbidity), GLP-1 receptor agonists, DPP-4 inhibitors, or sulfonylureas." },
  { id: "b10", type: "table", content: "Drug Class|Examples|Key Benefit|Key Risk\nMetformin|Glucophage, Diaformin|Weight neutral, CV benefit|GI side effects\nSGLT2i|Dapagliflozin, Empagliflozin|CV + Renal protection|UTI, DKA risk\nGLP-1 RA|Semaglutide, Dulaglutide|Weight loss, CV benefit|GI side effects, cost\nDPP-4i|Sitagliptin, Linagliptin|Weight neutral, well tolerated|Modest efficacy\nSulfonylurea|Gliclazide, Glimepiride|Potent, cheap|Hypos, weight gain" },
  { id: "b11", type: "callout", content: "Clinical Pearl: SGLT2 inhibitors should be considered first-line add-on for patients with established cardiovascular disease or chronic kidney disease (eGFR 25-75), based on EMPA-REG, CANVAS, and CREDENCE trial evidence.", meta: { variant: "pearl" } },
  { id: "b12", type: "divider", content: "" },
  { id: "b13", type: "heading", content: "Monitoring & Follow-up" },
  { id: "b14", type: "paragraph", content: "Regular monitoring is essential. HbA1c should be checked every 3-6 months until stable, then 6-monthly. Annual comprehensive review should include retinal screening, foot assessment, renal function, lipid profile, and mental health screening." },
];

const references = [
  { id: 1, text: "RACGP. Management of type 2 diabetes: A handbook for general practice. 2020.", url: "#" },
  { id: 2, text: "Diabetes Australia. Australian evidence-based guidelines. 2023.", url: "#" },
  { id: 3, text: "EMPA-REG OUTCOME Investigators. N Engl J Med. 2015;373:2117-28.", url: "#" },
  { id: 4, text: "ADS Position Statement: Individualisation of HbA1c targets. 2022.", url: "#" },
  { id: 5, text: "MBS Online. Items 721, 723, 732 – Chronic Disease Management.", url: "#" },
];

const versionHistory = [
  { version: "v3.2", date: "28 May 2026", author: "Dr. Arun Mehta", changes: "Updated SGLT2i evidence section" },
  { version: "v3.1", date: "15 May 2026", author: "Jessica Park", changes: "Added MBS billing callout" },
  { version: "v3.0", date: "2 May 2026", author: "Dr. Arun Mehta", changes: "Major revision — new pharmacology table" },
  { version: "v2.4", date: "18 Apr 2026", author: "Siddhant Udavant", changes: "Fixed monitoring timeline" },
];

const calloutStyles: Record<string, { bg: string; border: string; icon: string; label: string; text: string }> = {
  info: { bg: "bg-teal-50/70", border: "border-teal-200", icon: "ℹ️", label: "Guideline", text: "text-teal-900" },
  billing: { bg: "bg-slate-50/70", border: "border-slate-200", icon: "💰", label: "Billing", text: "text-slate-900" },
  pearl: { bg: "bg-emerald-50/70", border: "border-emerald-250", icon: "💎", label: "Clinical Pearl", text: "text-emerald-900" },
  warning: { bg: "bg-green-50/70", border: "border-green-200", icon: "⚠️", label: "Warning", text: "text-green-900" },
};

export default function ContentEditorPage() {
  const [blocks] = useState(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"meta" | "refs" | "history">("meta");
  const [contentStatus, setContentStatus] = useState<"draft" | "review" | "published">("published");
  const [wordCount] = useState(483);
  const [charCount] = useState(3247);

  const renderBlock = (block: ContentBlock) => {
    const isActive = activeBlockId === block.id;

    switch (block.type) {
      case "heading":
        return (
          <motion.div
            key={block.id}
            onClick={() => setActiveBlockId(block.id)}
            className={`group relative py-2 px-3 -mx-3 rounded-xl transition-all cursor-text ${isActive ? "bg-teal-50/50 ring-1 ring-teal-200" : "hover:bg-slate-50/60"}`}
          >
            <h2 className="font-serif text-xl text-slate-900 font-normal tracking-tight">{block.content}</h2>
            {isActive && (
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="w-1 h-1 rounded-full bg-slate-300" />
              </div>
            )}
          </motion.div>
        );

      case "paragraph":
        return (
          <motion.div
            key={block.id}
            onClick={() => setActiveBlockId(block.id)}
            className={`group relative py-1.5 px-3 -mx-3 rounded-xl transition-all cursor-text ${isActive ? "bg-teal-50/50 ring-1 ring-teal-200" : "hover:bg-slate-50/60"}`}
          >
            <p className="text-sm text-slate-600 leading-relaxed font-light">{block.content}</p>
          </motion.div>
        );

      case "list":
        return (
          <motion.div
            key={block.id}
            onClick={() => setActiveBlockId(block.id)}
            className={`group relative py-1.5 px-3 -mx-3 rounded-xl transition-all cursor-text ${isActive ? "bg-teal-50/50 ring-1 ring-teal-200" : "hover:bg-slate-50/60"}`}
          >
            <ul className="space-y-1.5 pl-1">
              {block.content.split("\n").map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-light">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        );

      case "callout": {
        const style = calloutStyles[block.meta?.variant || "info"];
        return (
          <motion.div
            key={block.id}
            onClick={() => setActiveBlockId(block.id)}
            className={`group relative py-1.5 px-3 -mx-3 rounded-xl transition-all cursor-text ${isActive ? "ring-1 ring-teal-200" : ""}`}
          >
            <div className={`${style.bg} border ${style.border} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{style.icon}</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>{style.label}</span>
              </div>
              <p className={`text-sm ${style.text} font-light leading-relaxed`}>{block.content}</p>
            </div>
          </motion.div>
        );
      }

      case "table":
        const rows = block.content.split("\n").map((r) => r.split("|"));
        return (
          <motion.div
            key={block.id}
            onClick={() => setActiveBlockId(block.id)}
            className={`group relative py-1.5 px-3 -mx-3 rounded-xl transition-all cursor-text ${isActive ? "bg-teal-50/50 ring-1 ring-teal-200" : "hover:bg-slate-50/60"}`}
          >
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {rows[0]?.map((cell, i) => (
                      <th key={i} className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-2.5">{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(1).map((row, ri) => (
                    <tr key={ri} className="hover:bg-slate-50/60 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className={`px-4 py-2.5 ${ci === 0 ? "font-medium text-slate-800" : "text-slate-600 font-light"}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );

      case "divider":
        return <hr key={block.id} className="border-slate-200 my-4" />;

      default:
        return null;
    }
  };

  const statusColors = {
    draft: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
    review: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    published: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      {/* Editor toolbar */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin/content" className="text-slate-400 hover:text-teal-600 transition-colors font-medium">Content</Link>
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-700 font-semibold">Type 2 Diabetes Management</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Status */}
            <button
              onClick={() => setContentStatus(contentStatus === "published" ? "draft" : contentStatus === "draft" ? "review" : "published")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusColors[contentStatus].bg} ${statusColors[contentStatus].text} border-current/20`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusColors[contentStatus].dot}`} />
              {contentStatus.charAt(0).toUpperCase() + contentStatus.slice(1)}
            </button>

            {/* Preview toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${previewMode ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
            >
              {previewMode ? "✏️ Edit" : "👁 Preview"}
            </button>

            {/* Sidebar toggle */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border border-slate-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>

            {/* Save */}
            <button className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-all shadow-sm shadow-teal-500/20">
              Save Changes
            </button>
          </div>
        </div>

        {/* Formatting toolbar */}
        {!previewMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="border-t border-slate-200/40 px-5 py-2 flex items-center gap-1 flex-wrap"
          >
            {[
              { label: "H1", title: "Heading 1" },
              { label: "H2", title: "Heading 2" },
              { label: "H3", title: "Heading 3" },
            ].map((b) => (
              <button key={b.label} title={b.title} className="w-8 h-8 text-xs font-bold text-slate-500 bg-slate-50 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center">{b.label}</button>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            {["B", "I", "U", "S"].map((b) => (
              <button key={b} className={`w-8 h-8 text-xs font-bold text-slate-500 bg-slate-50 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center ${b === "I" ? "italic" : ""} ${b === "U" ? "underline" : ""} ${b === "S" ? "line-through" : ""}`}>{b}</button>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            {[
              { icon: "•", title: "Bullet List" },
              { icon: "1.", title: "Numbered List" },
              { icon: "❝", title: "Quote" },
            ].map((b) => (
              <button key={b.icon} title={b.title} className="w-8 h-8 text-xs font-bold text-slate-500 bg-slate-50 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center">{b.icon}</button>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            {[
              { icon: "🔗", title: "Link" },
              { icon: "📷", title: "Image" },
              { icon: "📊", title: "Table" },
              { icon: "📦", title: "Callout" },
              { icon: "—", title: "Divider" },
              { icon: "</>" , title: "Code Block" },
            ].map((b) => (
              <button key={b.title} title={b.title} className="w-8 h-8 text-xs font-bold text-slate-500 bg-slate-50 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center">{b.icon}</button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Editor + sidebar layout */}
      <div className={`grid gap-6 ${showSidebar ? "grid-cols-1 lg:grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
        {/* Main editor */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10 p-8 lg:p-10 max-w-3xl mx-auto">
            {/* Content type badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-teal-50 text-teal-700 border-teal-200">Guideline</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-750 border-emerald-200">Endocrine</span>
              <span className="text-xs text-slate-400 font-medium ml-auto">Last saved: 2 mins ago</span>
            </div>

            {/* Blocks */}
            <div className="space-y-3">
              {blocks.map(renderBlock)}
            </div>

            {/* Add block button */}
            {!previewMode && (
              <div className="mt-8 flex items-center justify-center">
                <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-xl hover:border-teal-300 hover:text-teal-600 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Block
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Sidebar tabs */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex border-b border-slate-200/40">
                    {(["meta", "refs", "history"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSidebarTab(tab)}
                        className={`flex-1 px-3 py-3 text-xs font-semibold text-center transition-all ${sidebarTab === tab ? "text-teal-600 border-b-2 border-teal-500 bg-teal-50/30" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        {tab === "meta" ? "Metadata" : tab === "refs" ? "References" : "History"}
                      </button>
                    ))}
                  </div>

                  <div className="p-4">
                    {sidebarTab === "meta" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title</label>
                          <input type="text" defaultValue="Type 2 Diabetes Management" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">System</label>
                          <select className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600">
                            <option>Endocrine</option>
                            <option>Cardiovascular</option>
                            <option>Respiratory</option>
                            <option>Psychiatry</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
                          <select className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600">
                            <option>Chronic Disease</option>
                            <option>Emergency</option>
                            <option>Preventive</option>
                            <option>Mental Health</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Author</label>
                          <input type="text" defaultValue="Dr. Arun Mehta" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tags</label>
                          <div className="flex flex-wrap gap-1.5">
                            {["Diabetes", "Endocrine", "Chronic", "Pharmacology", "MBS"].map((tag) => (
                              <span key={tag} className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded-full border border-teal-100 flex items-center gap-1">
                                {tag}
                                <svg className="w-3 h-3 text-teal-400 cursor-pointer hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="pt-3 border-t border-slate-200/60">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Content Stats</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                              <p className="text-lg font-serif text-slate-800">{wordCount}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Words</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                              <p className="text-lg font-serif text-slate-800">{charCount}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Characters</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                              <p className="text-lg font-serif text-slate-800">{blocks.length}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Blocks</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                              <p className="text-lg font-serif text-slate-800">5</p>
                              <p className="text-[10px] text-slate-400 font-medium">References</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200/60">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Linked Questions</h4>
                          <div className="space-y-1.5">
                            {[
                              { id: 2341, text: "A 54-year-old male with T2DM..." },
                              { id: 2847, text: "HbA1c target for elderly patient..." },
                              { id: 3102, text: "First-line add-on to metformin..." },
                            ].map((q) => (
                              <div key={q.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg hover:bg-teal-50/40 transition-colors cursor-pointer">
                                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">Q</span>
                                <span className="text-xs text-slate-600 truncate">#{q.id} {q.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {sidebarTab === "refs" && (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400 font-medium mb-3">{references.length} references linked</p>
                        {references.map((ref, i) => (
                          <div key={ref.id} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl hover:bg-teal-50/40 transition-colors group">
                            <span className="text-[10px] font-bold text-teal-600 bg-teal-100 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-xs text-slate-600 leading-relaxed">{ref.text}</p>
                          </div>
                        ))}
                        <button className="w-full px-3 py-2.5 text-xs font-medium text-teal-600 border border-dashed border-teal-200 rounded-xl hover:bg-teal-50 transition-all flex items-center justify-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Add Reference
                        </button>
                      </div>
                    )}

                    {sidebarTab === "history" && (
                      <div className="space-y-3">
                        {versionHistory.map((v) => (
                          <div key={v.version} className="relative pl-5 pb-4 border-l-2 border-slate-200 last:border-l-0 last:pb-0">
                            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-teal-400 border-2 border-white" />
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">{v.version}</span>
                              <span className="text-[10px] text-slate-400">{v.date}</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">{v.changes}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">by {v.author}</p>
                          </div>
                        ))}
                        <button className="w-full px-3 py-2.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                          View Full History
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h4>
                  {[
                    { label: "Export as PDF", icon: "📄" },
                    { label: "Duplicate Content", icon: "📋" },
                    { label: "Link to Question", icon: "🔗" },
                    { label: "Generate Quiz", icon: "⚡" },
                  ].map((action) => (
                    <button key={action.label} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-teal-50 hover:text-teal-700 transition-all border border-slate-100 hover:border-teal-200 text-left">
                      <span>{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

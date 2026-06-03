"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PageBanner from "@/components/shared/PageBanner";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const searchResults = {
  questions: [
    { id: 2847, text: "A 54-year-old male presents with sudden chest pain...", topic: "Cardiology", type: "Question" },
    { id: 2849, text: "A 35-year-old woman describes 3 weeks of depressed mood...", topic: "Mental Health", type: "Question" },
  ],
  users: [
    { name: "Dr. Sarah Chen", email: "sarah.chen@gmail.com", type: "User" },
    { name: "Dr. James Wilson", email: "j.wilson@outlook.com", type: "User" },
  ],
  content: [
    { name: "Type 2 Diabetes", system: "Endocrine", type: "Condition" },
    { name: "URTI Template", system: "Respiratory", type: "Autofill" },
  ],
};

const topics = [
  { name: "Cardiology", questions: 420, usage: 1204, subtopics: 12 },
  { name: "Respiratory", questions: 380, usage: 987, subtopics: 8 },
  { name: "Mental Health", questions: 200, usage: 342, subtopics: 6 },
  { name: "Dermatology", questions: 160, usage: 289, subtopics: 9 },
  { name: "Paediatrics", questions: 170, usage: 256, subtopics: 7 },
  { name: "Musculoskeletal", questions: 290, usage: 756, subtopics: 10 },
  { name: "Endocrine", questions: 210, usage: 543, subtopics: 5 },
  { name: "Gastroenterology", questions: 250, usage: 654, subtopics: 8 },
  { name: "MBS Billing", questions: 180, usage: 198, subtopics: 4 },
  { name: "Women's Health", questions: 150, usage: 198, subtopics: 6 },
];

const allTags = [
  { name: "STEMI", count: 34 }, { name: "ECG", count: 67 }, { name: "Pharmacology", count: 145 }, { name: "Emergency", count: 89 },
  { name: "Chronic", count: 234 }, { name: "Screening", count: 78 }, { name: "Vaccination", count: 45 }, { name: "Depression", count: 56 },
  { name: "Asthma", count: 38 }, { name: "Melanoma", count: 23 }, { name: "Antibiotics", count: 112 }, { name: "MBS", count: 67 },
  { name: "Diabetes", count: 98 }, { name: "Hypertension", count: 87 }, { name: "Paediatrics", count: 65 }, { name: "Pregnancy", count: 43 },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const hasResults = query.length > 2;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <PageBanner
        title="Search &"
        highlightedText="Taxonomy"
        subtitle="Global search, topic management, and tag organization"
        illustrationPath="/assets/admin_analytics_illustration.png"
        pillText="System"
        variants={itemVariants}
      />

      {/* Global search */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="relative max-w-2xl mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search across questions, users, content, quizzes..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 text-base bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" />
          </div>

        {hasResults && (
          <div className="mt-6">
            <div className="flex gap-2 mb-4">
              {["all", "questions", "users", "content"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeTab === tab ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-slate-500 border-slate-200"}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-1 text-[10px] opacity-60">
                    {tab === "all" ? Object.values(searchResults).flat().length : tab === "questions" ? searchResults.questions.length : tab === "users" ? searchResults.users.length : searchResults.content.length}
                  </span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {(activeTab === "all" || activeTab === "questions") && searchResults.questions.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer">
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">Q</span>
                  <div className="flex-1 min-w-0"><p className="text-sm text-slate-700 truncate">{r.text}</p><p className="text-xs text-slate-400">#{r.id} · {r.topic}</p></div>
                </div>
              ))}
              {(activeTab === "all" || activeTab === "users") && searchResults.users.map((r) => (
                <div key={r.email} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">U</span>
                  <div className="flex-1 min-w-0"><p className="text-sm text-slate-700">{r.name}</p><p className="text-xs text-slate-400">{r.email}</p></div>
                </div>
              ))}
              {(activeTab === "all" || activeTab === "content") && searchResults.content.map((r) => (
                <div key={r.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">C</span>
                  <div className="flex-1 min-w-0"><p className="text-sm text-slate-700">{r.name}</p><p className="text-xs text-slate-400">{r.type} · {r.system}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic management */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="px-6 py-4 border-b border-slate-200/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Topics</h3>
              <button className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50/70 border border-teal-100/60 rounded-lg hover:bg-teal-100 transition-all">+ Add Topic</button>
            </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {topics.map((t) => (
              <div key={t.name} className="px-6 py-3.5 flex items-center justify-between hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.subtopics} subtopics</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{t.questions} Q</span>
                  <span>{t.usage.toLocaleString()} uses</span>
                </div>
              </div>
            ))}
          </div>
          </div>
        </motion.div>

        {/* Tag management */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Tag Cloud</h3>
              <button className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50/70 border border-teal-100/60 rounded-lg hover:bg-teal-100 transition-all">+ New Tag</button>
            </div>
          <div className="flex flex-wrap gap-2">
            {allTags.sort((a, b) => b.count - a.count).map((tag) => {
              const size = tag.count > 100 ? "text-sm" : tag.count > 50 ? "text-xs" : "text-[11px]";
              const weight = tag.count > 100 ? "font-bold" : tag.count > 50 ? "font-semibold" : "font-medium";
              return (
                <button key={tag.name} className={`px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all cursor-pointer ${size} ${weight}`}>
                  {tag.name} <span className="opacity-40 ml-1">{tag.count}</span>
                </button>
              );
            })}
          </div>

          {/* Index rebuild */}
          <div className="mt-6 pt-5 border-t border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Search Index</h4>
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Last rebuilt: <span className="font-medium">2 hours ago</span></p>
                <p className="text-xs text-slate-400">Index size: 24.3 MB · 4,847 items</p>
              </div>
              <button className="px-4 py-2 text-xs font-medium text-teal-700 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 transition-all">Rebuild Index</button>
            </div>
          </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

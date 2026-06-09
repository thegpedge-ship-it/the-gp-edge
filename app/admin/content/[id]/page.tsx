"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getMedicalContent, MedicalContent } from "@/lib/quizData";
import {
  themeBorder,
  themeBtnGhost,
  themeBtnPrimary,
  themeLabel,
  themeSurface,
  themeText,
} from "@/lib/adminTheme";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const typeColors: Record<string, string> = {
  Condition: "bg-teal-50/70 text-teal-800 border-teal-200/60 dark:bg-teal-950/30 dark:text-teal-350 dark:border-teal-900/50",
  Guideline: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/25 dark:text-teal-300 dark:border-teal-900/60",
  Protocol: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50",
  Pathway: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700/70",
  Document: "bg-teal-50/40 text-teal-700 border-teal-100 dark:bg-teal-950/10 dark:text-teal-400 dark:border-teal-900/30",
  Note: "bg-teal-50/30 text-teal-800 border-teal-100/70 dark:bg-teal-950/15 dark:text-teal-400 dark:border-teal-900/20",
};

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = Number(params.id);

  const [item, setItem] = useState<MedicalContent | null>(null);

  useEffect(() => {
    const loaded = getMedicalContent();
    const found = loaded.find((c) => c.id === contentId);
    if (found) {
      setItem(found);
    }
  }, [contentId]);

  if (!item) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">Clinical Content not found.</p>
        <button onClick={() => router.push("/admin/content")} className={`mt-4 ${themeBtnPrimary} px-4 py-2 text-sm`}>
          Back to Content List
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
      {/* Header / Back action */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/content")}
          className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-900 transition-all shadow-sm flex items-center justify-center shrink-0 hover:scale-[1.02]`}
          title="Back to Content List"
        >
          <Lucide.ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Clinical Content Details</span>
      </motion.div>

      <AdminPageHeader
        title={item.name}
        highlightedText=""
        subtitle={`${item.system} · ${item.category}`}
        actions={
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${typeColors[item.type]}`}>{item.type}</span>
            <StatusBadge variant={item.status} />
          </div>
        }
        variants={itemVariants}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Metrics & Metadata */}
        <div className="md:col-span-1 space-y-6">
          <motion.div
            variants={itemVariants}
            className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm space-y-4`}
          >
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Metadata</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Author</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.author}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Last Updated</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.lastUpdated}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">References Count</p>
                <p className="text-base font-serif text-slate-900 dark:text-slate-200 font-bold">{item.references} items</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Used in Questions</p>
                <p className="text-base font-serif text-slate-900 dark:text-slate-200 font-bold">{item.usedInQuestions} times</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            variants={itemVariants}
            className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm space-y-3`}
          >
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Operations</h3>
            <Link
              href={`/admin/content/editor?id=${item.id}`}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-teal-800 hover:bg-teal-900 text-sm font-bold text-white rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <Lucide.Edit className="w-4 h-4" />
              Edit in Content Editor
            </Link>
            <button className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-100 transition-all">
              <Lucide.Copy className="w-4 h-4" />
              Duplicate Template
            </button>
          </motion.div>
        </div>

        {/* Right Column: Rich Content Preview */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-2 space-y-6"
        >
          <div className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm space-y-4`}>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Content Editor Preview</h3>
            
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 pb-3.5 border-b border-slate-200/40 dark:border-slate-800/60">
                {["B", "I", "U", "H1", "H2", "List", "Num", "Link", "Img"].map((btn) => (
                  <button
                    key={btn}
                    className="h-7 px-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-lg hover:bg-teal-50/60 dark:hover:bg-teal-950/20 hover:text-teal-700 dark:hover:text-teal-400 transition-all flex items-center justify-center cursor-default"
                  >
                    {btn}
                  </button>
                ))}
              </div>
              
              <div className="prose prose-sm text-slate-700 dark:text-slate-300 max-w-none space-y-3">
                <p className="text-sm leading-relaxed">
                  This is a live content container preview of the clinical reference document for{" "}
                  <strong>{item.name}</strong>.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  In the clinical workspace, GP registrars reference this structured guideline to study clinical markers, review red flags, and resolve practice questions. All updates saved inside the Content Editor reflect here automatically in real-time.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

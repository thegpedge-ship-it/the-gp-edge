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
  const [bodyHtml, setBodyHtml] = useState("");

  useEffect(() => {
    const loaded = getMedicalContent();
    const found = loaded.find((c) => c.id === contentId);
    if (found) {
      setItem(found);
      const savedHtml = localStorage.getItem(`gpedge_content_body_${contentId}`);
      if (savedHtml) {
        setBodyHtml(savedHtml);
      } else {
        // Fallback placeholder content
        setBodyHtml(`
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">1. Overview</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No overview provided.</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">2. Pathophysiology</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No pathophysiology details provided.</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">3. Clinical Features</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No clinical features listed.</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">4. Diagnosis & Investigations</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No diagnosis and investigations outline provided.</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5. Management</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No management overview provided.</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5a. Non-Pharmacological Management</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No non-pharmacological directives listed.</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5b. Pharmacological Management</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No pharmacological directives listed.</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">6. Complications</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No complications listed.</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">7. When to Refer</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No referral guidelines listed.</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">8. Prognosis</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No prognosis outlook provided.</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">9. Resources</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">No reference resources provided.</p>
        `);
      }
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
          <style dangerouslySetInnerHTML={{ __html: `
            .print-area h2 {
              font-family: Georgia, serif !important;
              font-size: 1.35rem !important;
              font-weight: bold !important;
              color: #0f766e !important;
              border-left: 4px solid #0f766e !important;
              padding-left: 0.75rem !important;
              margin-top: 1.75rem !important;
              margin-bottom: 0.75rem !important;
              line-height: 1.25 !important;
            }
            .print-area table {
              width: 100% !important;
              border-collapse: collapse !important;
              text-align: left !important;
              margin-bottom: 1.25rem !important;
              border: 1px solid #cbd5e1 !important;
              border-radius: 0.75rem !important;
              overflow: hidden !important;
            }
            .print-area th {
              text-align: left !important;
              font-weight: 600 !important;
              font-size: 0.75rem !important;
              text-transform: uppercase !important;
              letter-spacing: 0.05em !important;
              padding: 0.75rem 1rem !important;
              background-color: #2bb09c !important;
              color: #ffffff !important;
              border: 1px solid #cbd5e1 !important;
            }
            .print-area td {
              padding: 0.75rem 1rem !important;
              font-size: 0.825rem !important;
              border: 1px solid #e2e8f0 !important;
              color: #475569 !important;
            }
            .print-area td p, .print-area th p {
              margin: 0 !important;
              font-size: inherit !important;
              color: inherit !important;
              line-height: inherit !important;
            }
            .print-area tr:nth-child(even) td {
              background-color: #f8fafc !important;
            }
            .print-area tr:nth-child(odd) td {
              background-color: #ffffff !important;
            }
            .print-area .callout-block {
              border-radius: 0.75rem !important;
              padding: 1rem !important;
              margin-bottom: 1.25rem !important;
            }
            .print-area .callout-block p {
              color: inherit !important;
              font-size: inherit !important;
              line-height: inherit !important;
              margin-bottom: 0.75rem !important;
            }
            .print-area .callout-block p:last-child {
              margin-bottom: 0 !important;
            }
            .print-area .callout-block ul, .print-area .callout-block ol {
              margin-bottom: 0.75rem !important;
            }
            .print-area .callout-block li {
              color: inherit !important;
              font-size: inherit !important;
            }
            .print-area .callout-block[data-variant="info"], 
            .print-area .callout-block:not([data-variant]) {
              background-color: #e6f7f4 !important;
              border: 1px solid #e6f7f4 !important;
              border-left: 5px solid #2bb09c !important;
              color: #1a5c51 !important;
            }
            .print-area .callout-block[data-variant="pearl"] {
              background-color: #e6f7f4 !important;
              border: 1px solid #e6f7f4 !important;
              border-left: 5px solid #2bb09c !important;
              color: #1a5c51 !important;
            }
            .print-area .callout-block[data-variant="warning"] {
              background-color: #fff9e6 !important;
              border: 1px solid #fff9e6 !important;
              border-left: 5px solid #dd6b20 !important;
              color: #7b341e !important;
            }
            .print-area .callout-block[data-variant="danger"] {
              background-color: #fff5f5 !important;
              border: 1px solid #fff5f5 !important;
              border-left: 5px solid #c53030 !important;
              color: #9b2c2c !important;
            }
            .print-area .callout-block[data-variant="billing"] {
              background-color: #f8fafc !important;
              border: 1px solid #f8fafc !important;
              border-left: 5px solid #64748b !important;
              color: #334155 !important;
            }
          ` }} />
          <div className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm h-full`}>
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-5 space-y-4 h-full">
              <div 
                className="print-area prose prose-sm text-slate-700 dark:text-slate-300 max-w-none select-text"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

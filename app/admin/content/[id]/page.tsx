"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getMedicalContent, fetchMedicalContent, MedicalContent } from "@/lib/quizData";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import {
  themeBorder,
  themeBtnGhost,
  themeBtnPrimary,
  themeLabel,
  themeSurface,
  themeText,
} from "@/lib/adminTheme";

import { splitHtmlIntoPages } from "@/utils/pdfPagination";

function cleanTableHtmlStyles(html: string): string {
  return html;
}

function decodeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

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
  const contentId = params.id as string;

  const [item, setItem] = useState<MedicalContent | null>(null);
  const [bodyHtml, setBodyHtml] = useState("");
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const updateScale = () => {
      const parentWidth = containerRef.current?.getBoundingClientRect().width || 794;
      // Subtract padding of parent (p-6 is 24px on each side, so 48px total)
      const availableWidth = parentWidth - 48;
      const factor = Math.min(1, availableWidth / 794);
      setScaleFactor(factor);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [bodyHtml]);

  const currentZoomScale = useMemo(() => {
    return scaleFactor * (pdfZoom / 100);
  }, [scaleFactor, pdfZoom]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setItem(null);
      setBodyHtml("");

      // 1. Fetch metadata and body directly from Neon API for this specific item first
      if (contentId && !String(contentId).startsWith("local")) {
        try {
          const res = await fetch(`/api/medical-content/${contentId}`);
          const json = await res.json();
          if (json.success && json.data) {
            const data = json.data;
            
            // Reconstruct the MedicalContent metadata object
            const loadedItem: MedicalContent = {
              id: data.id,
              name: data.name,
              system: data.system,
              category: data.category,
              type: data.type || "Document",
              status: data.status,
              author: data.author,
              lastUpdated: data.lastUpdated,
              tags: data.tags || [],
              references: data.references?.length ?? 0,
              pdfUrl: data.pdfUrl,
            };
            
            setItem(loadedItem);

            // Prefer the pre-built fullHtml; assemble from sections as fallback
            let html = (data.fullHtml || "").trim();

            if (!html && data.sections) {
              const s = data.sections as Record<string, string>;
              const sectionOrder = [
                { label: "1. Overview",                   key: "overview" },
                { label: "2. Pathophysiology",            key: "pathophysiology" },
                { label: "3. Clinical Features",          key: "clinical_features" },
                { label: "4. Diagnosis & Investigations", key: "diagnosis" },
                { label: "5. Management",                 key: "management" },
                { label: "6. Complications",              key: "complications" },
                { label: "7. When to Refer",              key: "when_to_refer" },
                { label: "8. Prognosis",                  key: "prognosis" },
                { label: "9. Resources",                  key: "resources" },
              ];
              html = sectionOrder
                .filter(({ key }) => s[key]?.trim())
                .map(({ label, key }) =>
                  `<h2 style="font-family:Georgia,serif;font-size:1.35rem;font-weight:bold;color:#0f766e;border-left:4px solid #0f766e;padding-left:0.75rem;margin-top:1.75rem;margin-bottom:0.75rem;line-height:1.25;">${label}</h2>${s[key]}`
                )
                .join("\n");
            }

            if (html) {
              setBodyHtml(html);
            } else {
              setBodyHtml(`<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e;">Overview</h2><p>No content available yet.</p>`);
            }
            setPdfPage(1);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error("Direct fetch failed:", err);
        }
      }

      // 2. Fallback to list lookup if direct fetch fails or local ID
      const loaded = await fetchMedicalContent().catch(() => getMedicalContent());
      const found = loaded.find((c) => String(c.id) === String(contentId));
      if (found) {
        setItem(found);
        setBodyHtml(`<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e;">Overview</h2><p>No content available yet.</p>`);
        setPdfPage(1);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    };
    load();
  }, [contentId]);



  const pages = useMemo(() => {
    const cleaned = cleanTableHtmlStyles(bodyHtml);
    return splitHtmlIntoPages(cleaned);
  }, [bodyHtml]);

  const totalPages = pages.length;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8 text-center">
        <div>
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700" />
          <p className="text-slate-500 dark:text-slate-400">Loading clinical content...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
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
        title={decodeHtml(item.name)}
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
            .print-area p, .print-area li, .print-area ul, .print-area ol {
              color: #334155 !important;
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
              background-color: #16a34a !important;
              color: #ffffff !important;
              border: 1px solid #cbd5e1 !important;
            }
             .print-area td {
               padding: 0.75rem 1rem !important;
               font-size: 0.825rem !important;
               border: 1px solid #e2e8f0 !important;
               color: #475569;
             }
             .print-area td p, .print-area th p {
               margin: 0 !important;
               font-size: inherit !important;
               color: inherit !important;
               line-height: inherit !important;
             }
             .print-area tr:nth-child(even) td {
               background-color: #ffffff;
             }
             .print-area tr:nth-child(odd) td {
               background-color: #ffffff;
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
              background-color: #e6f7f4;
              border: 1px solid #e6f7f4;
              border-left: 5px solid #2bb09c;
              color: #1a5c51;
            }
            .print-area .callout-block[data-variant="pearl"] {
              background-color: #f0fdf4;
              border: 1px solid #d1fae5;
              border-left: 5px solid #16a34a;
              color: #14532d;
            }
            .print-area .callout-block[data-variant="pearl"] > div:first-child {
              color: #15803d;
            }
            .print-area .callout-block[data-variant="important"] {
              background-color: #fefce8;
              border: 1px solid #fef08a;
              border-left: 5px solid #eab308;
              color: #713f12;
            }
            .print-area .callout-block[data-variant="important"] > div:first-child {
              color: #854d0e;
            }
            .print-area .callout-block[data-variant="warning"],
            .print-area .callout-block[data-variant="danger"] {
              background-color: #fef2f2;
              border: 1px solid #fee2e2;
              border-left: 5px solid #ef4444;
              color: #7f1d1d;
            }
            .print-area .callout-block[data-variant="warning"] > div:first-child,
            .print-area .callout-block[data-variant="danger"] > div:first-child {
              color: #b91c1c;
            }
            .print-area .callout-block[data-variant="billing"] {
              background-color: #f8fafc;
              border: 1px solid #f8fafc;
              border-left: 5px solid #64748b;
              color: #334155;
            }

            /* Dark mode overrides for print-area content */
            .dark .print-area {
              background-color: #0f172a !important;
              color: #f1f5f9 !important;
              border-color: #334155 !important;
            }
            .dark .print-area h1,
            .dark .print-area h2,
            .dark .print-area h3,
            .dark .print-area h4 {
              color: #2dd4bf !important;
              border-color: #2dd4bf !important;
            }
            .dark .print-area p,
            .dark .print-area li,
            .dark .print-area ul,
            .dark .print-area ol,
            .dark .print-area span {
              color: #cbd5e1 !important;
            }
            .dark .print-area table {
              border-color: #334155 !important;
              background-color: #1e293b !important;
            }
            .dark .print-area th {
              background-color: #115e59 !important;
              color: #f8fafc !important;
              border-color: #334155 !important;
            }
             .dark .print-area td {
               border-color: #334155 !important;
               color: #cbd5e1;
             }
            .dark .print-area tr:nth-child(even) td {
              background-color: #1e293b !important;
            }
            .dark .print-area tr:nth-child(odd) td {
              background-color: #0f172a !important;
            }
            .dark .print-area .callout-block {
              border-color: transparent !important;
            }
            .dark .print-area .callout-block[data-variant="info"], 
            .dark .print-area .callout-block:not([data-variant]) {
              background-color: rgba(20, 184, 166, 0.1) !important;
              border-left: 5px solid #2dd4bf !important;
              color: #a7f3d0 !important;
            }
            .dark .print-area .callout-block[data-variant="info"] > div:first-child, 
            .dark .print-area .callout-block:not([data-variant]) > div:first-child {
              color: #2dd4bf !important;
            }
            .dark .print-area .callout-block[data-variant="pearl"] {
              background-color: rgba(20, 184, 166, 0.1) !important;
              border-left: 5px solid #2dd4bf !important;
              color: #a7f3d0 !important;
            }
            .dark .print-area .callout-block[data-variant="pearl"] > div:first-child {
              color: #2dd4bf !important;
            }
            .dark .print-area .callout-block[data-variant="warning"] {
              background-color: rgba(245, 158, 11, 0.1) !important;
              border-left: 5px solid #fbbf24 !important;
              color: #fde68a !important;
            }
            .dark .print-area .callout-block[data-variant="warning"] > div:first-child {
              color: #fbbf24 !important;
            }
            .dark .print-area .callout-block[data-variant="danger"] {
              background-color: rgba(239, 68, 68, 0.1) !important;
              border-left: 5px solid #f87171 !important;
              color: #fca5a5 !important;
            }
            .dark .print-area .callout-block[data-variant="danger"] > div:first-child {
              color: #f87171 !important;
            }
            .dark .print-area .callout-block[data-variant="billing"] {
              background-color: rgba(148, 163, 184, 0.1) !important;
              border-left: 5px solid #94a3b8 !important;
              color: #cbd5e1 !important;
            }
            .dark .print-area .callout-block[data-variant="billing"] > div:first-child {
              color: #94a3b8 !important;
            }
          ` }} />
          {/* PDF Toolbar */}
          {totalPages > 1 && (
            <div className="bg-slate-900 dark:bg-slate-950 text-slate-200 rounded-xl px-4 py-3 border border-slate-800/80 flex items-center justify-between gap-3 text-xs flex-wrap shadow-lg shrink-0 select-none">
              <div className="flex items-center gap-2 min-w-0">
                <Lucide.FileText className="w-4 h-4 text-teal-500 shrink-0" />
                <span className="font-bold truncate max-w-[150px]" title={item.name}>
                  {item.name}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono shrink-0">
                  Document Preview
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))} 
                  disabled={pdfPage === 1} 
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors border-none bg-transparent cursor-pointer text-white"
                >
                  <Lucide.ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs font-semibold">Page {pdfPage} of {totalPages}</span>
                <button 
                  onClick={() => setPdfPage((p) => Math.min(totalPages, p + 1))} 
                  disabled={pdfPage === totalPages} 
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors border-none bg-transparent cursor-pointer text-white"
                >
                  <Lucide.ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPdfZoom((z) => Math.max(50, z - 10))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 border-none bg-transparent cursor-pointer text-white">
                  <Lucide.Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] font-bold">{pdfZoom}%</span>
                <button onClick={() => setPdfZoom((z) => Math.min(200, z + 10))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 border-none bg-transparent cursor-pointer text-white">
                  <Lucide.Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div 
            ref={containerRef}
            className={`bg-slate-100 dark:bg-slate-950 border ${themeBorder} rounded-2xl p-6 shadow-sm overflow-y-auto overflow-x-auto max-h-[850px] flex items-start justify-start custom-scrollbar`}
          >
            <div
              className="mx-auto"
              style={{
                width: `${794 * currentZoomScale}px`,
                height: totalPages > 1 ? `${1123 * currentZoomScale}px` : "auto",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div 
                className="bg-white text-slate-850 p-10 shadow-2xl border border-slate-200 absolute top-0 left-0 rounded-lg select-text print-area"
                style={{
                  transform: `scale(${currentZoomScale})`,
                  transformOrigin: "top left",
                  width: "794px",
                  minHeight: totalPages > 1 ? "1123px" : "auto",
                  height: totalPages > 1 ? "1123px" : "auto",
                  position: totalPages > 1 ? "absolute" : "relative",
                  overflowY: totalPages > 1 ? "hidden" : "visible",
                }}
              >
                {/* Header info inside paginated document preview */}
                <div className="mb-4 border-b-2 border-teal-700/30 pb-2 select-none text-left">
                  <span className="text-[9px] font-bold text-teal-700 uppercase tracking-widest leading-none">
                    {item.system} · {item.category}
                  </span>
                  {pdfPage === 1 ? (
                    <>
                      <h1 className="font-serif text-2xl text-slate-900 mt-1.5 font-normal tracking-tight leading-snug">
                        {item.name}
                      </h1>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span>Author: {item.author || "GP Edge Content Team"}</span>
                        <span>•</span>
                        <span>Last updated: {item.lastUpdated || "Just now"}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs font-serif text-slate-600 mt-1 italic">
                      {item.name} — continued (Page {pdfPage})
                    </p>
                  )}
                </div>
                
                <div 
                  className="text-slate-700 select-text pb-12 text-left"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(pages[pdfPage - 1] || "") }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

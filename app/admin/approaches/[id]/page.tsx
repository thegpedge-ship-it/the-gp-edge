"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { splitHtmlIntoPages } from "@/utils/pdfPagination";
import { themeBorder } from "@/lib/adminTheme";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const systemColors: Record<string, string> = {
  Cardiology: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Respiratory: "bg-teal-50 text-teal-700 border-teal-200",
  Endocrine: "bg-green-50 text-green-700 border-green-200",
  Gastrointestinal: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Psychiatry: "bg-teal-50 text-teal-800 border-teal-200",
  Dermatology: "bg-green-50 text-green-800 border-green-200",
  "Women's Health": "bg-slate-50 text-slate-700 border-slate-200",
  Paediatrics: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Neurology: "bg-blue-50 text-blue-700 border-blue-200",
  Musculoskeletal: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MBS: "bg-amber-50 text-amber-700 border-amber-200",
};

const CALLOUT_STYLES = `
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
  .print-area p, .print-area li, .print-area ul, .print-area ol { color: #334155 !important; }
  .print-area table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 1.25rem !important; border: 1px solid #cbd5e1 !important; border-radius: 0.75rem !important; overflow: hidden !important; }
  .print-area th { text-align: left !important; font-weight: 600 !important; font-size: 0.75rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; padding: 0.75rem 1rem !important; background-color: #16a34a !important; color: #ffffff !important; border: 1px solid #cbd5e1 !important; }
  .print-area td { padding: 0.75rem 1rem !important; font-size: 0.825rem !important; border: 1px solid #e2e8f0 !important; color: #475569; }
  .print-area td p, .print-area th p { margin: 0 !important; font-size: inherit !important; color: inherit !important; }
  .print-area .callout-block { border-radius: 0.75rem !important; padding: 1rem !important; margin-bottom: 1.25rem !important; }
  .print-area .callout-block p { color: inherit !important; font-size: inherit !important; line-height: inherit !important; margin-bottom: 0.75rem !important; }
  .print-area .callout-block p:last-child { margin-bottom: 0 !important; }
  .print-area .callout-block ul, .print-area .callout-block ol { margin-bottom: 0.75rem !important; }
  .print-area .callout-block li { color: inherit !important; font-size: inherit !important; }
  .print-area .callout-block[data-variant="info"], .print-area .callout-block:not([data-variant]) { background-color: #e6f7f4; border: 1px solid #e6f7f4; border-left: 5px solid #2bb09c; color: #1a5c51; }
  .print-area .callout-block[data-variant="pearl"] { background-color: #f0fdf4; border: 1px solid #d1fae5; border-left: 5px solid #16a34a; color: #14532d; }
  .print-area .callout-block[data-variant="pearl"] > div:first-child { color: #15803d; }
  .print-area .callout-block[data-variant="important"] { background-color: #fefce8; border: 1px solid #fef08a; border-left: 5px solid #eab308; color: #713f12; }
  .print-area .callout-block[data-variant="important"] > div:first-child { color: #854d0e; }
  .print-area .callout-block[data-variant="warning"], .print-area .callout-block[data-variant="danger"] { background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 5px solid #ef4444; color: #7f1d1d; }
  .print-area .callout-block[data-variant="warning"] > div:first-child, .print-area .callout-block[data-variant="danger"] > div:first-child { color: #b91c1c; }
  .print-area .callout-block[data-variant="billing"] { background-color: #f8fafc; border: 1px solid #f8fafc; border-left: 5px solid #64748b; color: #334155; }
  .dark .print-area { background-color: #0f172a !important; color: #f1f5f9 !important; }
  .dark .print-area h1, .dark .print-area h2, .dark .print-area h3, .dark .print-area h4 { color: #2dd4bf !important; border-color: #2dd4bf !important; }
  .dark .print-area p, .dark .print-area li, .dark .print-area span { color: #cbd5e1 !important; }
  .dark .print-area th { background-color: #115e59 !important; color: #f8fafc !important; border-color: #334155 !important; }
  .dark .print-area td { border-color: #334155 !important; color: #cbd5e1; }
  .dark .print-area .callout-block[data-variant="info"], .dark .print-area .callout-block:not([data-variant]) { background-color: rgba(20,184,166,0.1) !important; border-left: 5px solid #2dd4bf !important; color: #a7f3d0 !important; }
  .dark .print-area .callout-block[data-variant="pearl"] { background-color: rgba(20,184,166,0.1) !important; border-left: 5px solid #2dd4bf !important; color: #a7f3d0 !important; }
  .dark .print-area .callout-block[data-variant="warning"], .dark .print-area .callout-block[data-variant="danger"] { background-color: rgba(239,68,68,0.1) !important; border-left: 5px solid #f87171 !important; color: #fca5a5 !important; }
  .dark .print-area .callout-block[data-variant="billing"] { background-color: rgba(148,163,184,0.1) !important; border-left: 5px solid #94a3b8 !important; color: #cbd5e1 !important; }
`;

function buildFallbackHtml(card: any): string {
  const lines: string[] = [];

  if (card.overview) {
    lines.push(`<h2 style="font-family:Georgia,serif;font-size:1.35rem;font-weight:bold;color:#0f766e;border-left:4px solid #0f766e;padding-left:0.75rem;margin-top:1.75rem;margin-bottom:0.75rem;">Overview</h2>`);
    lines.push(`<p style="font-family:'DM Sans',sans-serif;font-size:0.875rem;color:#334155;line-height:1.7;margin-bottom:1rem;">${card.overview}</p>`);
  }

  if (card.steps?.length) {
    lines.push(`<h2 style="font-family:Georgia,serif;font-size:1.35rem;font-weight:bold;color:#0f766e;border-left:4px solid #0f766e;padding-left:0.75rem;margin-top:1.75rem;margin-bottom:0.75rem;">Clinical Steps</h2>`);
    card.steps.forEach((step: any, idx: number) => {
      lines.push(`<div class="callout-block" data-variant="info" style="background-color:#e6f7f4;border-left:4px solid #2bb09c;border-radius:0.5rem;padding:0.85rem 1rem;margin-bottom:1rem;color:#1a5c51;">
        <div style="font-weight:700;font-size:0.85rem;margin-bottom:0.4rem;color:#2bb09c;">Step ${idx + 1}: ${step.title || ""}</div>
        ${step.description ? `<div style="font-size:0.875rem;line-height:1.65;">${step.description}</div>` : ""}
        ${step.checklistItems?.length ? `<ul style="list-style-type:disc;padding-left:1.4rem;margin:0.5rem 0 0;">${step.checklistItems.map((c: string) => `<li style="font-size:0.875rem;color:inherit;margin-bottom:0.3rem;">${c}</li>`).join("")}</ul>` : ""}
      </div>`);
    });
  }

  if (card.keyPoints?.length) {
    lines.push(`<div class="callout-block" data-variant="pearl" style="background-color:#f0fdf4;border-left:4px solid #16a34a;border-radius:0.5rem;padding:0.85rem 1rem;margin-bottom:1rem;color:#14532d;">
      <div style="font-weight:700;font-size:0.85rem;margin-bottom:0.5rem;color:#15803d;">Key Points</div>
      <ul style="list-style-type:disc;padding-left:1.4rem;margin:0;">${card.keyPoints.map((k: string) => `<li style="font-size:0.875rem;color:inherit;margin-bottom:0.3rem;">${k}</li>`).join("")}</ul>
    </div>`);
  }

  if (card.redFlags?.length) {
    lines.push(`<div class="callout-block" data-variant="warning" style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:0.5rem;padding:0.85rem 1rem;margin-bottom:1rem;color:#7f1d1d;">
      <div style="font-weight:700;font-size:0.85rem;margin-bottom:0.5rem;color:#b91c1c;">Red Flags</div>
      <ul style="list-style-type:disc;padding-left:1.4rem;margin:0;">${card.redFlags.map((r: string) => `<li style="font-size:0.875rem;color:inherit;margin-bottom:0.3rem;">${r}</li>`).join("")}</ul>
    </div>`);
  }

  if (card.references?.length) {
    lines.push(`<h2 style="font-family:Georgia,serif;font-size:1.35rem;font-weight:bold;color:#0f766e;border-left:4px solid #0f766e;padding-left:0.75rem;margin-top:1.75rem;margin-bottom:0.75rem;">References</h2>`);
    lines.push(`<ol style="padding-left:1.25rem;font-family:'DM Sans',sans-serif;margin-bottom:1rem;">${card.references.map((r: any) => `<li style="font-size:0.875rem;color:#334155;margin-bottom:0.4rem;">${r.text || r}${r.url && r.url !== "#" ? ` — <a href="${r.url}" style="color:#0f766e;">${r.url}</a>` : ""}</li>`).join("")}</ol>`);
  }

  return lines.join("\n");
}

export default function ApproachDetailPage() {
  const params = useParams();
  const router = useRouter();
  const approachId = params.id as string;

  const [card, setCard] = useState<any>(null);
  const [bodyHtml, setBodyHtml] = useState("");
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [viewTab, setViewTab] = useState<"document" | "steps">("document");

  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Edit History state for approaches
  const [historyLog, setHistoryLog] = useState<any[]>([]);
  const [versionList, setVersionList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Responsive scale to fit the A4 canvas inside its container
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const update = () => {
      const available = (containerRef.current?.getBoundingClientRect().width || 794) - 48;
      setScaleFactor(Math.min(1, available / 794));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [bodyHtml]);

  const currentZoomScale = useMemo(() => scaleFactor * (pdfZoom / 100), [scaleFactor, pdfZoom]);

  // Load card data
  useEffect(() => {
    if (!approachId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/approach/${approachId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setCard(json.data);
          const html = json.data.fullHtml?.trim() || buildFallbackHtml(json.data);
          setBodyHtml(html);
          setPdfPage(1);

          // Load history log
          setLoadingHistory(true);
          Promise.all([
            fetch(`/api/content-history/${approachId}?resource=history&type=approach`).then(r => r.ok ? r.json() : { success: false }),
            fetch(`/api/content-history/${approachId}?resource=versions&type=approach`).then(r => r.ok ? r.json() : { success: false }),
          ]).then(([hRes, vRes]) => {
            if (hRes.success && hRes.history) setHistoryLog(hRes.history);
            if (vRes.success && vRes.versions) setVersionList(vRes.versions);
          }).catch(console.error).finally(() => setLoadingHistory(false));
        }
      } catch (err) {
        console.error("Failed to load approach:", err);
      }
    };
    load();
  }, [approachId]);

  const pages = useMemo(() => splitHtmlIntoPages(bodyHtml), [bodyHtml]);
  const totalPages = pages.length;

  if (!card) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">Clinical Approach not found.</p>
        <button onClick={() => router.push("/admin/approaches")} className="mt-4 px-4 py-2 text-sm bg-teal-800 text-white rounded-xl hover:bg-teal-900">
          Back to Approaches
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
      <style dangerouslySetInnerHTML={{ __html: CALLOUT_STYLES }} />

      {/* Back */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/approaches")}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-900 shadow-sm hover:scale-[1.02] transition-all"
          title="Back to Approaches"
        >
          <Lucide.ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Clinical Approach Details</span>
      </motion.div>

      <AdminPageHeader
        title={card.title}
        highlightedText=""
        subtitle={`${card.system} · ${card.category}`}
        actions={
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${systemColors[card.system] || "bg-slate-50 text-slate-600 border-slate-200"}`}>{card.system}</span>
            <StatusBadge variant={card.status} />
            {card.isPremium && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Premium</span>}
          </div>
        }
        variants={itemVariants}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Metadata + Actions */}
        <div className="md:col-span-1 space-y-6">
          {/* Metadata card */}
          <motion.div variants={itemVariants} className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm space-y-4`}>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Metadata</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Author</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{card.author}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Last Updated</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{card.lastUpdated}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Steps</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{card.steps?.length ?? 0} clinical steps</p>
              </div>
              {card.tags?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {card.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Operations card */}
          <motion.div variants={itemVariants} className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm space-y-3`}>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Operations</h3>
            <Link
              href={`/admin/content/editor?id=${card.id}`}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-teal-800 hover:bg-teal-900 text-sm font-bold text-white rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <Lucide.Edit className="w-4 h-4" />
              Edit in Content Editor
            </Link>
            <button
              onClick={() => router.push("/admin/approaches")}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <Lucide.ArrowLeft className="w-4 h-4" />
              Back to Approaches
            </button>
          </motion.div>

          {/* Edit & Version History Card */}
          <motion.div variants={itemVariants} className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm space-y-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lucide.History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Edit History</h3>
              </div>
              {loadingHistory && <Lucide.Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />}
            </div>

            {historyLog.length === 0 && !loadingHistory ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No edit history entries yet for this approach.</p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {historyLog.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{entry.adminUserName}</span>
                      <span className="text-slate-400">{new Date(entry.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 capitalize">
                      {entry.fieldName === "full_html" ? "Updated document content" : `${entry.changeType} ${entry.fieldName}`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {versionList.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Saved Versions ({versionList.length})</p>
                <div className="space-y-1.5">
                  {versionList.slice(0, 3).map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="font-semibold text-teal-700 dark:text-teal-400">v{v.versionNumber}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link
              href={`/admin/content/editor?id=${card.id}`}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline block text-center pt-1"
            >
              View Full History in Content Editor →
            </Link>
          </motion.div>
        </div>

        {/* Right: Document viewer */}
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-4">
          {/* Tab switcher */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
            {(["document", "steps"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setViewTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewTab === tab
                    ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab === "document" ? "Document View" : "Steps & Details"}
              </button>
            ))}
          </div>

          {/* DOCUMENT VIEW — A4 paginated viewer */}
          {viewTab === "document" && (
            <>
              {/* PDF toolbar */}
              {totalPages > 1 && (
                <div className="bg-slate-900 dark:bg-slate-950 text-slate-200 rounded-xl px-4 py-3 border border-slate-800/80 flex items-center justify-between gap-3 text-xs flex-wrap shadow-lg select-none">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lucide.FileText className="w-4 h-4 text-teal-500 shrink-0" />
                    <span className="font-bold truncate max-w-[150px]">{card.title}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono shrink-0">Approach</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setPdfPage(p => Math.max(1, p - 1))} disabled={pdfPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors border-none bg-transparent cursor-pointer text-white">
                      <Lucide.ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-xs font-semibold">Page {pdfPage} of {totalPages}</span>
                    <button onClick={() => setPdfPage(p => Math.min(totalPages, p + 1))} disabled={pdfPage === totalPages} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors border-none bg-transparent cursor-pointer text-white">
                      <Lucide.ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPdfZoom(z => Math.max(50, z - 10))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 border-none bg-transparent cursor-pointer text-white">
                      <Lucide.Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[10px] font-bold">{pdfZoom}%</span>
                    <button onClick={() => setPdfZoom(z => Math.min(200, z + 10))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 border-none bg-transparent cursor-pointer text-white">
                      <Lucide.Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* A4 canvas */}
              <div
                ref={containerRef}
                className={`bg-slate-100 dark:bg-slate-950 border ${themeBorder} rounded-2xl p-6 shadow-sm overflow-y-auto overflow-x-auto max-h-[850px] flex items-start justify-start`}
              >
                <div className="mx-auto" style={{ width: `${794 * currentZoomScale}px`, height: totalPages > 1 ? `${1123 * currentZoomScale}px` : "auto", position: "relative", flexShrink: 0 }}>
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
                    {/* Document header */}
                    <div className="mb-4 border-b-2 border-teal-700/30 pb-2 text-left">
                      <span className="text-[9px] font-bold text-teal-700 uppercase tracking-widest">{card.system} · {card.category}</span>
                      {pdfPage === 1 ? (
                        <>
                          <h1 className="font-serif text-2xl text-slate-900 mt-1.5 font-normal tracking-tight leading-snug">{card.title}</h1>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                            <span>Author: {card.author}</span>
                            <span>•</span>
                            <span>Updated: {card.lastUpdated}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs font-serif text-slate-600 mt-1 italic">{card.title} — continued (Page {pdfPage})</p>
                      )}
                    </div>
                    <div className="text-slate-700 select-text pb-12 text-left" dangerouslySetInnerHTML={{ __html: sanitizeHtml(pages[pdfPage - 1] || "") }} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEPS VIEW — structured card display */}
          {viewTab === "steps" && (
            <div className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm space-y-5`}>
              {/* Overview */}
              {card.overview && (
                <div className="p-4 bg-teal-50 dark:bg-teal-950/20 rounded-2xl border border-teal-100 dark:border-teal-900/30">
                  <p className="text-sm text-teal-800 dark:text-teal-300 leading-relaxed">{card.overview}</p>
                </div>
              )}

              {/* Steps */}
              {card.steps?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical Steps</h3>
                  {card.steps.map((step: any, idx: number) => (
                    <div key={step.id || idx} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold shrink-0">{idx + 1}</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{step.title}</h4>
                          {step.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.description}</p>}
                        </div>
                      </div>
                      {step.checklistItems?.length > 0 && (
                        <div className="px-4 pb-4 pt-1 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                          {step.checklistItems.map((item: string, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                              <span className="text-xs text-slate-700 dark:text-slate-300">{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Key Points */}
              {card.keyPoints?.length > 0 && (
                <div className="p-4 bg-teal-50 dark:bg-teal-950/20 rounded-2xl border border-teal-100 dark:border-teal-900/30">
                  <h3 className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider mb-3">Key Points</h3>
                  <ul className="space-y-1.5">
                    {card.keyPoints.map((kp: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-teal-800 dark:text-teal-300">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                        {kp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flags */}
              {card.redFlags?.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <h3 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3">Red Flags</h3>
                  <ul className="space-y-1.5">
                    {card.redFlags.map((rf: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {rf}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* References */}
              {card.references?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">References</h3>
                  {card.references.map((ref: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] font-bold text-teal-700 bg-teal-100 dark:bg-teal-950/30 w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 dark:text-slate-400">{ref.text || ref}</p>
                        {ref.url && ref.url !== "#" && <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-600 truncate mt-0.5 block">{ref.url}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

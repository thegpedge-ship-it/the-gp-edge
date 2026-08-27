"use client";

import { useState, useEffect, Suspense, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as Lucide from "lucide-react";
import { mockConditions, bodySystems, MedicalCondition } from "@/app/medical-library/libraryData";
import { getMedicalContent } from "@/lib/quizData";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

function normalizeSystemName(sys: string): string {
  const s = (sys || "").trim().toLowerCase();
  if (s === "cardiovascular" || s === "cardiology") return "Cardiology";
  if (s === "gastroenterology" || s === "gastrointestinal") return "Gastrointestinal";
  if (s === "psychiatry" || s === "psychology" || s === "mental health") return "Psychiatry";
  if (s === "endocrine") return "Endocrine";
  if (s === "respiratory") return "Respiratory";
  if (s === "dermatology") return "Dermatology";
  if (s === "women's health" || s === "womens health") return "Women's Health";
  if (s === "paediatrics" || s === "pediatrics") return "Paediatrics";
  if (s === "neurology") return "Neurology";
  if (s === "musculoskeletal" || s === "msk") return "Musculoskeletal";
  if (s === "mbs" || s === "billing") return "MBS";
  return sys;
}

import { splitHtmlIntoPages } from "@/utils/pdfPagination";

function cleanTableHtmlStyles(html: string): string {
  return html;
}

/** Waits for every <img> inside an element to finish loading (or fail) before continuing —
 *  needed before html2canvas snapshots a detached/off-screen container, since it would
 *  otherwise capture watermark images that haven't painted yet. */
function waitForImagesToLoad(el: HTMLElement): Promise<void[]> {
  const images = Array.from(el.querySelectorAll("img"));
  return Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
    )
  );
}

function PDFViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [condition, setCondition] = useState<MedicalCondition | null>(null);
  const [customHtml, setCustomHtml] = useState<string>("");
  const [customPages, setCustomPages] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);
  const [savingPdf, setSavingPdf] = useState(false);

  const observerRef = useRef<ResizeObserver | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(720);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node !== null) {
      const width = node.clientWidth;
      const computedStyle = window.getComputedStyle(node);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const contentWidth = width - paddingLeft - paddingRight;
      if (contentWidth > 0) {
        setContainerWidth(contentWidth);
      }

      const observer = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const entry = entries[0];
        const w = entry.contentRect.width;
        if (w > 0) {
          setContainerWidth(w);
        }
      });
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  // Fit the document to the available width on small screens; larger screens fill up to
  // the natural 794px page width instead of stretching the page beyond its real size.
  const scaleFactor = useMemo(() => {
    return Math.min(containerWidth / 794, 1);
  }, [containerWidth]);

  const currentZoomScale = useMemo(() => {
    return scaleFactor * (pdfZoom / 100);
  }, [scaleFactor, pdfZoom]);


  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      setTimeout(() => {
        router.push("/dashboard/medical-library");
      }, 150);
    } else {
      router.push("/dashboard/medical-library");
    }
  };

  useEffect(() => {
    const loadPdfData = async () => {
      setLoading(true);
      let found = mockConditions.find((c) => c.id === id) || null;
      if (!found && id && id.startsWith("CUSTOM-")) {
        const adminContent = getMedicalContent();
        const cleanId = id.replace("CUSTOM-APPROACH-", "").replace("CUSTOM-", "");
        const item = adminContent.find((c) => String(c.id) === cleanId);
        
        try {
          const res = await fetch(`/api/medical-content/${cleanId}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json.success && json.data) {
            const data = json.data;
            const fullHtml = data.fullHtml || "";
            const cleanedHtml = cleanTableHtmlStyles(fullHtml);
            setCustomHtml(cleanedHtml);

            const parsedPages = splitHtmlIntoPages(cleanedHtml);
            setCustomPages(parsedPages);
            
            const refs = data.references || [];
            const tags = data.tags || [];
            setCustomTags(tags);

            const normalizedType: "Condition" | "Guideline" | "Document" | "Note" = 
              data.type === "Condition" ? "Condition" :
              data.type === "Guideline" || data.type === "Protocol" || data.type === "Pathway" ? "Guideline" :
              data.type === "Note" ? "Note" : "Document";

            found = {
              id: `CUSTOM-${data.id}`,
              name: data.name,
              system: normalizeSystemName(data.system) as any,
              category: data.category,
              type: normalizedType,
              lastUpdated: data.lastUpdated,
              author: data.author,
              symptoms: [],
              diagnosisCriteria: [],
              treatmentOptions: [],
              clinicalNotes: "",
              references: refs,
              document: {
                filename: `${data.name.replace(/\s+/g, "_")}.pdf`,
                fileSize: "1.2 MB",
                totalPages: parsedPages.length,
                downloadUrl: "#",
                summary: data.name
              }
            };
          }
        } catch (err) {
          console.error("Error loading view-pdf details from API:", err);
        }
      }
      setCondition(found);
      setLoading(false);
    };

    loadPdfData();
  }, [id]);

  useEffect(() => {
    // Set page title dynamically
    if (condition?.document) {
      document.title = `${condition.document.filename} - GP EDGE Library`;
    }
  }, [condition]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-400">
        <Lucide.Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-2 animate-bounce" />
        <span className="text-xs font-semibold">Loading clinical document...</span>
      </div>
    );
  }

  if (!condition || !condition.document) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <Lucide.AlertCircle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold tracking-tight mb-2">Document Not Found</h1>
        <p className="text-slate-400 max-w-md mb-6">
          The requested clinical guideline or document could not be found or does not have an attached PDF.
        </p>
        <button
          onClick={handleBack}
          className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/20 active:scale-95 transition-all text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const doc = condition.document;
  const systemConfig = bodySystems.find((s) => s.id === condition.system);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAsPdf = async () => {
    if (savingPdf) return;
    setSavingPdf(true);

    // Render one page-chunk at a time (the same pagination the viewer already uses)
    // instead of one giant canvas for the whole document — a single huge canvas hits
    // browser canvas-size limits on long documents and silently truncates the PDF.
    const pageChunks = customPages.length > 0 ? customPages : [customHtml || condition.clinicalNotes || "<p>No content available.</p>"];

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const PAGE_W = 595.28;
      const PAGE_H = 841.89;
      const pdf = new jsPDF({ unit: "pt", format: "a4" });

      for (let i = 0; i < pageChunks.length; i++) {
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.top = "0";
        container.style.left = "-9999px";
        container.style.width = "794px";
        container.style.background = "#ffffff";
        container.style.padding = "48px";
        container.className = "print-area";
        container.innerHTML = `
          <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; overflow:hidden; z-index:0;">
            <img src="${window.location.origin}/assets/logo.png" style="opacity:0.06; width:60%; max-width:420px; object-fit:contain;" />
          </div>
          <div style="position:relative; z-index:1; font-family: Arial, Helvetica, sans-serif; color:#1e293b;">
            ${i === 0 ? `
              <div style="border-bottom:2px solid #0d9488; padding-bottom:12px; margin-bottom:20px;">
                <div style="font-size:10px; font-weight:700; color:#0d9488; text-transform:uppercase; letter-spacing:0.05em;">${condition.system} &middot; ${condition.category}</div>
                <h1 style="font-size:22px; margin:6px 0 0; color:#0f172a;">${condition.name}</h1>
              </div>
            ` : ""}
            ${sanitizeHtml(pageChunks[i])}
          </div>
        `;
        document.body.appendChild(container);

        try {
          await waitForImagesToLoad(container);
          const canvas = await html2canvas(container, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
          const imgData = canvas.toDataURL("image/jpeg", 0.92);
          let renderW = PAGE_W;
          let renderH = (canvas.height * renderW) / canvas.width;
          if (renderH > PAGE_H) {
            renderH = PAGE_H;
            renderW = (canvas.width * renderH) / canvas.height;
          }
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, 0, renderW, renderH);
        } finally {
          document.body.removeChild(container);
        }
      }

      pdf.save(doc.filename.replace(/\.pdf$/i, "") + ".pdf");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setSavingPdf(false);
    }
  };

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Print and custom styles */}
      <style jsx global>{`
        .global-nav-header {
          display: none !important;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-pdf-area, #printable-pdf-area *,
          #print-all-pages, #print-all-pages * {
            visibility: visible;
          }
          #printable-pdf-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            transform: none !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          #print-all-pages {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-page-block {
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            page-break-after: always;
          }
          .print-page-block:last-child {
            page-break-after: auto;
          }
          .no-print {
            display: none !important;
          }
        }
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
          background-color: #e6f7f4 !important;
          border: 1px solid #e6f7f4 !important;
          border-left: 5px solid #2bb09c !important;
          color: #1a5c51 !important;
        }
        .print-area .callout-block[data-variant="pearl"] {
          background-color: #f0fdf4 !important;
          border: 1px solid #d1fae5 !important;
          border-left: 5px solid #16a34a !important;
          color: #14532d !important;
        }
        .print-area .callout-block[data-variant="pearl"] > div:first-child {
          color: #15803d !important;
        }
        .print-area .callout-block[data-variant="important"] {
          background-color: #fefce8 !important;
          border: 1px solid #fef08a !important;
          border-left: 5px solid #eab308 !important;
          color: #713f12 !important;
        }
        .print-area .callout-block[data-variant="important"] > div:first-child {
          color: #854d0e !important;
        }
        .print-area .callout-block[data-variant="warning"],
        .print-area .callout-block[data-variant="danger"] {
          background-color: #fef2f2 !important;
          border: 1px solid #fee2e2 !important;
          border-left: 5px solid #ef4444 !important;
          color: #7f1d1d !important;
        }
        .print-area .callout-block[data-variant="warning"] > div:first-child,
        .print-area .callout-block[data-variant="danger"] > div:first-child {
          color: #b91c1c !important;
        }
        .print-area .callout-block[data-variant="billing"] {
          background-color: #f8fafc !important;
          border: 1px solid #f8fafc !important;
          border-left: 5px solid #64748b !important;
          color: #334155 !important;
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
      `}</style>

      {/* Standalone PDF Toolbar */}
      <header className="bg-slate-955 text-slate-200 border-b border-slate-800/80 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4 z-50 shrink-0 no-print shadow-md">
        {/* Left Side: Back & Filename */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink sm:order-1">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 active:scale-95 transition-all shrink-0"
            title="Go Back"
          >
            <Lucide.ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-slate-800 hidden sm:block shrink-0" />
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 shrink-0">
              <Lucide.FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[280px] md:max-w-md text-slate-200" title={doc.filename}>
                {doc.filename}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5 truncate">
                <span className="hidden sm:inline">{condition.system} Path &middot; </span>
                {doc.fileSize}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Zoom and actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 sm:order-3">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPdfZoom((z) => Math.max(50, z - 10))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
              title="Zoom Out"
            >
              <Lucide.Minus className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-bold w-12 text-center text-slate-300">{pdfZoom}%</span>
            <button
              onClick={() => setPdfZoom((z) => Math.min(200, z + 10))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
              title="Zoom In"
            >
              <Lucide.Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 active:scale-95 transition-all shrink-0"
              title="Print Document"
            >
              <Lucide.Printer className="w-4.5 h-4.5" />
            </button>
            {doc.downloadUrl &&
            doc.downloadUrl !== "#" &&
            !doc.downloadUrl.toLowerCase().includes(".docx") &&
            !doc.downloadUrl.toLowerCase().includes(".doc") ? (
              <a
                href={doc.downloadUrl}
                download={doc.filename}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/10 active:scale-95 transition-all shrink-0"
                title="Download PDF"
              >
                <Lucide.Download className="w-4 h-4" />
                <span className="hidden md:inline">Save Document</span>
              </a>
            ) : (
              // No standalone file attached — this content is rendered from HTML.
              // Build a real PDF client-side and download it directly (works the same
              // on mobile as desktop, since it's a plain Blob download, not a print dialog).
              <button
                onClick={handleSaveAsPdf}
                disabled={savingPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/10 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-wait"
                title="Save as PDF"
              >
                {savingPdf ? (
                  <Lucide.Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lucide.Download className="w-4 h-4" />
                )}
                <span className="hidden md:inline">{savingPdf ? "Preparing…" : "Save as PDF"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Page navigation — wraps to its own centered row on narrow screens */}
        {doc.totalPages > 1 && (
          <div className="order-last basis-full sm:order-2 sm:basis-auto flex items-center justify-center sm:justify-start gap-2 bg-slate-900 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800 mx-auto sm:mx-0">
            <button
              onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
              disabled={pdfPage === 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Previous Page"
            >
              <Lucide.ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-semibold px-2 text-slate-300">
              Page {pdfPage} of {doc.totalPages}
            </span>
            <button
              onClick={() => setPdfPage((p) => Math.min(doc.totalPages, p + 1))}
              disabled={pdfPage === doc.totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Next Page"
            >
              <Lucide.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Main Canvas Scroll Area */}
      <main 
        ref={containerRef}
        className="flex-1 bg-slate-950 overflow-auto p-3 sm:p-8 md:p-12 flex items-start justify-center sm:justify-start relative custom-scrollbar"
      >
        <div
          className={`mx-auto ${condition.id.startsWith("CUSTOM-") && customPages.length > 0 ? "print:hidden" : ""}`}
          style={{
            width: `${794 * currentZoomScale}px`,
            height: doc.totalPages > 1 ? `${1123 * currentZoomScale}px` : "auto",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div 
            id="printable-pdf-area"
            className="bg-white text-slate-800 p-16 shadow-2xl border border-slate-200/80 absolute top-0 left-0 rounded-lg select-text print-area"
            style={{
              transform: `scale(${currentZoomScale})`,
              transformOrigin: "top left",
              width: "794px",
              minHeight: doc.totalPages > 1 ? "1123px" : "auto",
              height: doc.totalPages > 1 ? "1123px" : "auto",
              position: doc.totalPages > 1 ? "absolute" : "relative",
              overflowY: doc.totalPages > 1 ? "hidden" : "visible",
            }}
          >
            {/* Faint Confidential Watermark */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.06] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="" className="w-2/3 max-w-md object-contain" />
            </div>

            {/* Professional PDF Header */}
            <div className="flex items-center justify-between border-b-2 border-teal-600 pb-4 mb-8 text-[11px] text-slate-500 font-semibold tracking-wider uppercase select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-5.5 h-5.5 bg-teal-600 text-white rounded flex items-center justify-center text-[10px] font-bold">GP</span>
                <span>Clinical Reference Guideline Library</span>
              </div>
              <span className="text-red-600 font-bold tracking-widest">CONFIDENTIAL</span>
            </div>

            {/* Render custom guideline HTML or paginated default content */}
            {condition.id.startsWith("CUSTOM-") ? (
              <div className="space-y-6 flex flex-col h-full text-slate-800">
                {/* Header info / title inside document */}
                <div className="mb-8 border-b-2 border-teal-700/30 pb-4 select-none text-left">
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest leading-none">
                    {condition.system} · {condition.category}
                  </span>
                  {pdfPage === 1 ? (
                    <>
                      <h1 className="font-serif text-3xl text-slate-900 mt-2 font-normal tracking-tight leading-snug">
                        {condition.name}
                      </h1>
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        <span>Author: {condition.author || "GP Edge Content Team"}</span>
                        <span>•</span>
                        <span>Last updated: {condition.lastUpdated || "Just now"}</span>
                      </div>
                      {customTags && customTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {customTags.map((tag) => (
                            <span key={tag} className="inline-flex items-center text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200/50 px-2.5 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-lg font-serif text-slate-600 mt-1 italic">
                      {condition.name} — continued (Page {pdfPage})
                    </p>
                  )}
                </div>
                <div 
                  className="prose prose-sm text-slate-700 max-w-none select-text pb-12 flex-1 text-left"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(customPages[pdfPage - 1] || "") }}
                />
              </div>
            ) : (
              <>
                {/* PAGE 1 CONTENT */}
                {pdfPage === 1 && (
                  <div className="space-y-8 text-xs leading-relaxed text-slate-700">
                    <div className="text-center">
                      <span className="text-[11px] font-bold tracking-widest text-teal-600 uppercase">SECTION 1 // EXECUTIVE CLINICAL SUMMARY</span>
                      <h2 className="font-sans text-2xl font-extrabold text-slate-900 leading-tight mt-1">{condition.name} Outline</h2>
                      <p className="text-[11px] text-slate-500 mt-1 italic">{condition.category}</p>
                    </div>
                    <p className="font-medium text-slate-605 border-l-2 border-slate-200 pl-4 italic text-sm leading-relaxed">{doc.summary}</p>
                    
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 text-[11.5px] space-y-3">
                      <p className="font-bold text-slate-900 text-xs">Metadata Profile:</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-slate-400">Target System</p>
                          <p className="font-semibold text-slate-700">{condition.system} Pathology</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-400">Subcategory Classification</p>
                          <p className="font-semibold text-slate-700">{condition.category}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-400">Authoring Board</p>
                          <p className="font-semibold text-slate-700">{condition.author}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-400">Version Control</p>
                          <p className="font-semibold text-slate-700">Release May 2026</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Clinical Presentation Summary</h3>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {condition.name} is a high-priority diagnostic module requiring precise assessment protocols. This guideline serves as the evidence-backed decision pathway for GP Registrars preparing for clinical exams.
                      </p>
                    </div>
                  </div>
                )}

                {/* PAGE 2 CONTENT */}
                {pdfPage === 2 && (
                  <div className="space-y-6 text-xs leading-relaxed text-slate-700">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-[11px] font-bold tracking-widest text-teal-600 uppercase">SECTION 2 // CLINICAL DIAGNOSTIC MATRIX</span>
                      <h2 className="font-sans text-xl font-extrabold text-slate-900 mt-1">Diagnostic Criteria</h2>
                    </div>
                    <p className="font-medium text-slate-500">The following standard laboratory and clinical indicators must be evaluated sequentially for {condition.name}:</p>
                    <div className="space-y-3">
                      {condition.diagnosisCriteria.map((c, i) => (
                        <div key={i} className="flex gap-4 border border-slate-200/80 p-4 rounded-xl bg-slate-50/50 shadow-sm">
                          <span className="font-mono font-bold text-teal-700 shrink-0 text-sm">0{i + 1}</span>
                          <p className="text-slate-700 font-medium leading-relaxed">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAGE 3 CONTENT */}
                {pdfPage === 3 && (
                  <div className="space-y-6 text-xs leading-relaxed text-slate-700">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-[11px] font-bold tracking-widest text-teal-600 uppercase">SECTION 3 // THERAPEUTIC REGIMEN MANAGEMENT</span>
                      <h2 className="font-sans text-xl font-extrabold text-slate-900 mt-1">Recommended Interventions</h2>
                    </div>
                    <p className="font-medium text-slate-500">Stepwise pharmacological and non-pharmacological directives for {condition.name}:</p>
                    <div className="space-y-3.5">
                      {condition.treatmentOptions.map((opt, i) => (
                        <div key={i} className="flex gap-4 items-start border border-slate-150 bg-slate-50/40 p-4 rounded-xl shadow-sm">
                          <span className="w-5.5 h-5.5 rounded bg-teal-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            {i + 1}
                          </span>
                          <p className="text-slate-700 leading-relaxed font-semibold flex-1">{opt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAGE 4+ CONTENT */}
                {pdfPage >= 4 && (
                  <div className="space-y-6 text-xs leading-relaxed text-slate-700">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-[11px] font-bold tracking-widest text-teal-600 uppercase">SECTION 4 // CLINICAL NOTES & REFERENCES</span>
                      <h2 className="font-sans text-xl font-extrabold text-slate-900 mt-1">Pearls & Bibliography</h2>
                    </div>
                    
                    <div className="bg-teal-50/80 border border-teal-200/60 p-5 rounded-xl text-[11.5px] leading-relaxed text-slate-700 italic space-y-2">
                      <p className="font-bold text-teal-850 not-italic mb-1 flex items-center gap-1.5 text-xs">
                        <Lucide.Lightbulb className="w-4.5 h-4.5 text-teal-600" />
                        Key Summary Pearls:
                      </p>
                      <p className="font-medium whitespace-pre-line leading-relaxed">{condition.clinicalNotes}</p>
                    </div>

                    <div className="space-y-3 mt-6">
                      <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">References</h3>
                      <div className="divide-y divide-slate-100">
                        {condition.references.map((ref) => (
                          <div key={ref.id} className="py-3.5 flex items-start gap-3 text-[11px]">
                            <span className="font-semibold text-slate-400 shrink-0 font-mono">[{ref.id}]</span>
                            <div className="flex-1">
                              <p className="text-slate-700 font-medium leading-relaxed">
                                {ref.text}
                              </p>
                              {ref.url && (
                                <a 
                                  href={ref.url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-teal-600 font-semibold hover:underline mt-1 inline-block no-print text-[10px]"
                                >
                                  Access Original Source →
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Professional PDF Footer */}
            <footer className="absolute bottom-8 left-16 right-16 border-t border-slate-200 pt-3 flex items-center justify-between text-[9px] text-slate-400 font-medium select-none uppercase tracking-wider">
              <span>GP EDGE Clinical Library &copy; {new Date().getFullYear()}</span>
              <span>Page {pdfPage} of {doc.totalPages}</span>
            </footer>
          </div>
        </div>

        {/* Print-only container — includes every page so "Save as PDF" / Print produces
            the full document, not just the page currently on screen. */}
        {condition.id.startsWith("CUSTOM-") && customPages.length > 0 && (
          <div id="print-all-pages" className="hidden print:block">
            {customPages.map((pageHtml, idx) => (
              <div key={idx} className="print-page-block bg-white text-slate-800 p-16 print-area">
                <div className="flex items-center justify-between border-b-2 border-teal-600 pb-4 mb-8 text-[11px] text-slate-500 font-semibold tracking-wider uppercase select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5.5 h-5.5 bg-teal-600 text-white rounded flex items-center justify-center text-[10px] font-bold">GP</span>
                    <span>Clinical Reference Guideline Library</span>
                  </div>
                  <span className="text-red-600 font-bold tracking-widest">CONFIDENTIAL</span>
                </div>

                <div className="mb-8 border-b-2 border-teal-700/30 pb-4 select-none text-left">
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest leading-none">
                    {condition.system} · {condition.category}
                  </span>
                  {idx === 0 ? (
                    <>
                      <h1 className="font-serif text-3xl text-slate-900 mt-2 font-normal tracking-tight leading-snug">
                        {condition.name}
                      </h1>
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        <span>Author: {condition.author || "GP Edge Content Team"}</span>
                        <span>•</span>
                        <span>Last updated: {condition.lastUpdated || "Just now"}</span>
                      </div>
                      {customTags && customTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {customTags.map((tag) => (
                            <span key={tag} className="inline-flex items-center text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200/50 px-2.5 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-lg font-serif text-slate-600 mt-1 italic">
                      {condition.name} — continued (Page {idx + 1})
                    </p>
                  )}
                </div>

                <div
                  className="prose prose-sm text-slate-700 max-w-none select-text pb-12 text-left"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(pageHtml) }}
                />

                <footer className="border-t border-slate-200 pt-3 mt-6 flex items-center justify-between text-[9px] text-slate-400 font-medium select-none uppercase tracking-wider">
                  <span>GP EDGE Clinical Library &copy; {new Date().getFullYear()}</span>
                  <span>Page {idx + 1} of {customPages.length}</span>
                </footer>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function PDFViewerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-400">
        <Lucide.Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-2" />
        <span className="text-xs font-semibold">Loading clinical document...</span>
      </div>
    }>
      <PDFViewerContent />
    </Suspense>
  );
}

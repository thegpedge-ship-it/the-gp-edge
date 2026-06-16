"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as Lucide from "lucide-react";
import { mockConditions, bodySystems, MedicalCondition } from "@/app/medical-library/libraryData";
import { getMedicalContent } from "@/lib/quizData";

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

function PDFViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [condition, setCondition] = useState<MedicalCondition | null>(null);
  const [customHtml, setCustomHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);

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
    if (typeof window !== "undefined") {
      let found = mockConditions.find((c) => c.id === id) || null;
      if (!found && id && id.startsWith("CUSTOM-")) {
        const adminContent = getMedicalContent();
        const cleanId = id.replace("CUSTOM-", "");
        const item = adminContent.find((c) => String(c.id) === cleanId);
        if (item) {
          const referencesRaw = localStorage.getItem(`gpedge_content_refs_${item.id}`);
          let refs = [{ id: 1, text: "Clinical reference handbook - Resource 1" }];
          if (referencesRaw) {
            try { refs = JSON.parse(referencesRaw); } catch {}
          }
          const savedHtml = localStorage.getItem(`gpedge_content_body_${item.id}`) || "";
          setCustomHtml(savedHtml);

          const normalizedType: "Condition" | "Guideline" | "Document" | "Note" = 
            item.type === "Condition" ? "Condition" :
            item.type === "Guideline" || item.type === "Protocol" || item.type === "Pathway" ? "Guideline" :
            item.type === "Note" ? "Note" : "Document";

          found = {
            id: `CUSTOM-${item.id}`,
            name: item.name,
            system: normalizeSystemName(item.system) as any,
            category: item.category,
            type: normalizedType,
            lastUpdated: item.lastUpdated,
            author: item.author,
            symptoms: [],
            diagnosisCriteria: [],
            treatmentOptions: [],
            clinicalNotes: "",
            references: refs,
            document: {
              filename: `${item.name.replace(/\s+/g, "_")}.pdf`,
              fileSize: "1.2 MB",
              totalPages: 1,
              downloadUrl: "#",
              summary: item.name
            }
          };
        }
      }
      setCondition(found);
      setLoading(false);
    }
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
          #printable-pdf-area, #printable-pdf-area * {
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
      `}</style>

      {/* Standalone PDF Toolbar */}
      <header className="bg-slate-955 text-slate-200 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between gap-4 z-50 shrink-0 no-print shadow-md">
        {/* Left Side: Back & Filename */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 active:scale-95 transition-all"
            title="Go Back"
          >
            <Lucide.ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 shrink-0">
              <Lucide.FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate max-w-[280px] sm:max-w-md text-slate-200" title={doc.filename}>
                {doc.filename}
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                {condition.system} Path · {doc.fileSize}
              </p>
            </div>
          </div>
        </div>

        {/* Middle Side: Page navigation */}
        {!condition.id.startsWith("CUSTOM-") && (
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
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

        {/* Right Side: Zoom and actions */}
        <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 active:scale-95 transition-all"
              title="Print Document"
            >
              <Lucide.Printer className="w-4.5 h-4.5" />
            </button>
            {doc.downloadUrl && (
              <a
                href={doc.downloadUrl}
                download
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/10 active:scale-95 transition-all"
                title="Download PDF"
              >
                <Lucide.Download className="w-4 h-4" />
                <span className="hidden md:inline">Save Document</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Canvas Scroll Area */}
      <main className="flex-1 bg-slate-950 overflow-auto p-8 sm:p-12 flex justify-center items-start relative">
        <div
          style={{
            width: `${720 * (pdfZoom / 100)}px`,
            height: condition.id.startsWith("CUSTOM-") ? "auto" : `${940 * (pdfZoom / 100)}px`,
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div 
            id="printable-pdf-area"
            className="bg-white text-slate-800 p-12 sm:p-16 shadow-2xl border border-slate-200/80 absolute top-0 left-0 rounded-lg select-text print-area"
            style={{
              transform: `scale(${pdfZoom / 100})`,
              transformOrigin: "top left",
              width: "720px",
              height: condition.id.startsWith("CUSTOM-") ? "auto" : "940px",
              position: condition.id.startsWith("CUSTOM-") ? "relative" : "absolute",
            }}
          >
            {/* Faint Confidential Watermark */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.03] rotate-[35deg] overflow-hidden">
              <span className="font-sans font-black text-8xl tracking-widest text-slate-900">GP EDGE</span>
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
              <div 
                className="prose prose-sm text-slate-700 max-w-none select-text pb-12"
                dangerouslySetInnerHTML={{ __html: customHtml }}
              />
            ) : (
              <>
                {/* PAGE 1 CONTENT */}
                {pdfPage === 1 && (
                  <div className="space-y-8 text-xs leading-relaxed text-slate-700">
                    <div className="text-center">
                      <span className="text-[11px] font-bold tracking-widest text-teal-600 uppercase">SECTION 1 // EXECUTIVE CLINICAL SUMMARY</span>
                      <h2 className="font-sans text-2xl font-extrabold text-slate-900 leading-tight mt-1">{condition.name} Outline</h2>
                      <p className="text-[11px] text-slate-500 mt-1 italic">Reference Index: {condition.id} · {condition.category}</p>
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
            <footer className="absolute bottom-12 left-12 right-12 border-t border-slate-200 pt-4 flex items-center justify-between text-[9px] text-slate-400 font-medium select-none uppercase tracking-wider">
              <span>GP EDGE Clinical Library &copy; {new Date().getFullYear()}</span>
              <span>{condition.id} · Page {pdfPage} of {doc.totalPages}</span>
            </footer>
          </div>
        </div>
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

"use client";

import { useState } from "react";
import { Download, ChevronRight, Loader2, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { exportAllUserDataAction } from "@/actions/userPrivacy.actions";
import { generateDataExportPdfBlob } from "@/lib/report/generateDataExportPdf";

export default function ExportUserDataButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"fetching" | "building" | "downloading" | "done">("fetching");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setStep("fetching");
    setErrorMsg(null);

    try {
      // 1. Fetch user data from server action
      const result = await exportAllUserDataAction();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to retrieve account data from server.");
      }

      setStep("building");

      // Give UI a brief moment to update step
      await new Promise((resolve) => setTimeout(resolve, 600));

      const payload = result.data;

      // Generate Structured PDF File Blob
      const pdfBlob = await generateDataExportPdfBlob(payload);

      setStep("downloading");
      await new Promise((resolve) => setTimeout(resolve, 400));

      const dateStr = new Date().toISOString().slice(0, 10);
      const pdfFilename = `gpedge_data_export_${dateStr}.pdf`;

      // Trigger PDF Download Only
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const aPdf = document.createElement("a");
      aPdf.href = pdfUrl;
      aPdf.download = pdfFilename;
      document.body.appendChild(aPdf);
      aPdf.click();
      document.body.removeChild(aPdf);
      URL.revokeObjectURL(pdfUrl);

      setStep("done");
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    } catch (err: any) {
      console.error("Export data failed:", err);
      setErrorMsg(err.message || "Failed to complete data export.");
    }
  };

  return (
    <>
      {/* Trigger Button in Quick Actions Card */}
      <button
        type="button"
        id="profile-download-my-data"
        onClick={handleExport}
        disabled={isLoading}
        className="w-full text-left flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent hover:from-emerald-500/20 hover:to-teal-500/10 transition-all duration-200 group shadow-sm disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Download size={18} />
          </div>
          <div>
            <p className="font-sans text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Download My Data / Export Data
            </p>
            <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Export all private account, payment & score records (Structured PDF)
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
      </button>

      {/* Full-Screen Processing Overlay Modal */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Glowing Accent Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 animate-pulse" />

            {/* Spinner Icon / Success Icon */}
            <div className="my-3 relative">
              {step !== "done" && !errorMsg ? (
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Loader2 size={36} className="animate-spin" />
                </div>
              ) : errorMsg ? (
                <div className="w-16 h-16 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertTriangle size={36} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={36} className="animate-bounce" />
                </div>
              )}
            </div>

            {/* Main Header */}
            <h3 className="font-sans text-xl font-bold text-slate-900 dark:text-slate-50 mt-1 mb-2">
              {step === "done"
                ? "Export Prepared Successfully!"
                : errorMsg
                ? "Export Preparation Failed"
                : "Preparing Your Privacy Data Request"}
            </h3>

            {/* DO NOT EXIT Warning Box */}
            {!errorMsg && step !== "done" && (
              <div className="w-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl p-3.5 my-3 flex items-start gap-3 text-left">
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Important Notice
                  </p>
                  <p className="font-sans text-xs font-semibold text-amber-800 dark:text-amber-200 leading-snug mt-0.5">
                    Do not exit or close this page while we are preparing your request.
                  </p>
                </div>
              </div>
            )}

            {/* Step Progress Description */}
            {!errorMsg && (
              <div className="w-full space-y-2 mt-2 text-left">
                <div className={`flex items-center gap-2.5 text-xs ${step === "fetching" ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                  {step === "fetching" ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>Step 1: Extracting database tables & correspondence...</span>
                </div>
                <div className={`flex items-center gap-2.5 text-xs ${step === "building" ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                  {step === "building" ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>Step 2: Formatting structured PDF report...</span>
                </div>
                <div className={`flex items-center gap-2.5 text-xs ${step === "downloading" || step === "done" ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                  {step === "downloading" ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>Step 3: Triggering automatic PDF download...</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 my-3 text-xs text-rose-600 dark:text-rose-400">
                {errorMsg}
              </div>
            )}

            {/* Close button if error occurs */}
            {errorMsg && (
              <button
                type="button"
                onClick={() => setIsLoading(false)}
                className="mt-4 px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            )}

          </div>
        </div>
      )}
    </>
  );
}

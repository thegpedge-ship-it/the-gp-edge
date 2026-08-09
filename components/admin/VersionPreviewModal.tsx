"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import DiffViewer from "./DiffViewer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

export interface VersionInfo {
  id: string;
  versionNumber: number;
  label: string;
  fullHtml?: string;
  metadata?: {
    name?: string;
    status?: string;
    author?: string;
    tags?: string[];
  };
  createdByName?: string;
  createdAt: string;
}

interface VersionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: VersionInfo | null;
  entityId: string;
  entityType?: string;
  currentHtml?: string;
  /** Called when user clicks "Restore This Version" */
  onRestore: (version: VersionInfo) => void;
  adminUserName?: string;
}

const CALLOUT_STYLES = `
  .version-preview h2 {
    font-family: Georgia, serif !important;
    font-size: 1.35rem !important; font-weight: bold !important;
    color: #0f766e !important; border-left: 4px solid #0f766e !important;
    padding-left: 0.75rem !important; margin-top: 1.75rem !important;
    margin-bottom: 0.75rem !important; line-height: 1.25 !important;
  }
  .version-preview p, .version-preview li { color: #334155 !important; }
  .version-preview table { width: 100% !important; border-collapse: collapse !important; }
  .version-preview th { background-color: #16a34a !important; color: #fff !important; padding: 0.5rem !important; }
  .version-preview td { padding: 0.5rem !important; border: 1px solid #e2e8f0 !important; }
  .version-preview .callout-block { border-radius: 0.75rem !important; padding: 1rem !important; margin-bottom: 1.25rem !important; }
`;

export default function VersionPreviewModal({
  isOpen,
  onClose,
  version,
  entityId,
  entityType = "medical_condition",
  currentHtml = "",
  onRestore,
  adminUserName,
}: VersionPreviewModalProps) {
  const [viewTab, setViewTab] = useState<"preview" | "compare">("preview");
  const [fullHtml, setFullHtml] = useState<string>("");
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load full HTML when version changes (only metadata in list to save bandwidth)
  useEffect(() => {
    if (!isOpen || !version) { setFullHtml(""); return; }

    if (version.fullHtml !== undefined) {
      setFullHtml(version.fullHtml || "");
      return;
    }

    setLoadingHtml(true);
    fetch(`/api/content-history/${entityId}?resource=versions&type=${entityType}`)
      .then((r) => r.json())
      .catch(() => ({}))
      .finally(() => setLoadingHtml(false));
  }, [isOpen, version, entityId, entityType]);

  useEffect(() => {
    if (isOpen) setViewTab("preview");
    setRestoreConfirm(false);
  }, [isOpen, version?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!version) return null;

  const htmlToShow = fullHtml || version.fullHtml || "";
  const formattedDate = new Date(version.createdAt).toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
          >
            <style dangerouslySetInnerHTML={{ __html: CALLOUT_STYLES }} />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900/30">
                  <Lucide.History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {version.label}
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {version.createdByName && `By ${version.createdByName} · `}
                    {formattedDate}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  v{version.versionNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Tab switcher */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {(["preview", "compare"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setViewTab(tab)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                        viewTab === tab
                          ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {tab === "preview" ? "Preview" : "Compare with Current"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto" ref={contentRef}>
              {loadingHtml ? (
                <div className="flex items-center justify-center h-40">
                  <Lucide.Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                </div>
              ) : viewTab === "preview" ? (
                <div className="p-6">
                  {htmlToShow ? (
                    <div
                      className="version-preview bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-slate-700 leading-relaxed select-text"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlToShow) }}
                    />
                  ) : (
                    <div className="text-center text-slate-400 py-12 text-sm">
                      <Lucide.FileX className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      No HTML content in this version.
                    </div>
                  )}
                </div>
              ) : (
                // Compare mode
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Lucide.GitCompare className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Comparing <span className="text-teal-600">v{version.versionNumber}</span> vs{" "}
                      <span className="text-slate-700 dark:text-slate-300">current version</span>
                    </span>
                  </div>
                  <DiffViewer
                    oldContent={htmlToShow}
                    newContent={currentHtml}
                    mode="sidebyside"
                    stripHtml={true}
                    maxChars={6000}
                  />
                </div>
              )}
            </div>

            {/* Footer — Restore button */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
              <div className="text-[11px] text-slate-400">
                {version.metadata && (
                  <span>
                    Status:{" "}
                    <span className="font-semibold capitalize">
                      {version.metadata.status || "—"}
                    </span>
                    {version.metadata.author && ` · Author: ${version.metadata.author}`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  Close
                </button>

                {!restoreConfirm ? (
                  <button
                    onClick={() => setRestoreConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Lucide.RotateCcw className="w-3.5 h-3.5" />
                    Restore This Version
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      This will overwrite the current content.
                    </span>
                    <button
                      onClick={() => { setRestoreConfirm(false); onClose(); onRestore(version); }}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg transition-all"
                    >
                      Yes, Restore
                    </button>
                    <button
                      onClick={() => setRestoreConfirm(false)}
                      className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-[11px] font-semibold rounded-lg hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

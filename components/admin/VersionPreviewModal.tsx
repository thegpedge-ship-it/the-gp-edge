"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  onRestore: (version: VersionInfo) => void;
  adminUserName?: string;
}

const PREVIEW_STYLES = `
  .version-preview h2 {
    font-family: Georgia, serif !important;
    font-size: 1.2rem !important; font-weight: bold !important;
    color: #0f766e !important; border-left: 4px solid #0f766e !important;
    padding-left: 0.75rem !important; margin-top: 1.5rem !important;
    margin-bottom: 0.65rem !important; line-height: 1.25 !important;
  }
  .version-preview p, .version-preview li { color: #334155 !important; font-size: 0.875rem !important; line-height: 1.65 !important; }
  .version-preview table { width: 100% !important; border-collapse: collapse !important; }
  .version-preview th { background-color: #0f766e !important; color: #fff !important; padding: 0.45rem 0.6rem !important; font-size: 0.75rem !important; }
  .version-preview td { padding: 0.45rem 0.6rem !important; border: 1px solid #e2e8f0 !important; font-size: 0.8rem !important; }
  .version-preview .callout-block { border-radius: 0.65rem !important; padding: 0.85rem !important; margin-bottom: 1rem !important; }
`;

export default function VersionPreviewModal({
  isOpen,
  onClose,
  version,
  entityId,
  entityType = "medical_condition",
  currentHtml = "",
  onRestore,
}: VersionPreviewModalProps) {
  const [viewTab, setViewTab] = useState<"preview" | "changes">("preview");
  const [diffMode, setDiffMode] = useState<"inline" | "sidebyside">("inline");
  const [fullHtml, setFullHtml] = useState<string>("");
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !version) { setFullHtml(""); return; }
    if (version.fullHtml !== undefined) {
      setFullHtml(version.fullHtml || "");
      return;
    }
    setLoadingHtml(true);
    fetch(`/api/content-history/${entityId}?resource=versions&type=${entityType}`)
      .then((r) => (r.ok ? r.json() : { success: false }))
      .then((data) => {
        if (data.success && Array.isArray(data.versions)) {
          const match = data.versions.find((v: VersionInfo) => String(v.id) === String(version.id));
          if (match && match.fullHtml) {
            setFullHtml(match.fullHtml);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load version full HTML:", err);
      })
      .finally(() => setLoadingHtml(false));
  }, [isOpen, version, entityId, entityType]);

  useEffect(() => {
    if (isOpen) { setViewTab("preview"); setDiffMode("inline"); }
    setRestoreConfirm(false);
  }, [isOpen, version?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!version || !mounted) return null;

  const htmlToShow = fullHtml || version.fullHtml || "";
  const formattedDate = new Date(version.createdAt).toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const modalJSX = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-6 bg-slate-950/70 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
          >
            <style dangerouslySetInnerHTML={{ __html: PREVIEW_STYLES }} />



            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto" ref={contentRef}>
              {loadingHtml ? (
                <div className="flex items-center justify-center h-48">
                  <Lucide.Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                </div>
              ) : viewTab === "preview" ? (
                /* ── Full Document Preview ── */
                <div className="p-5">
                  {htmlToShow ? (
                    <div
                      className="version-preview bg-white rounded-xl border border-slate-200 shadow-sm p-7 text-slate-700 leading-relaxed select-text text-sm"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlToShow) }}
                    />
                  ) : (
                    <div className="text-center text-slate-400 py-16 text-sm">
                      <Lucide.FileX className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      No HTML content saved in this version.
                    </div>
                  )}
                </div>
              ) : (
                /* ── What Changed (hunks-only diff) ── */
                <div className="p-5">
                  {/* Sub-toolbar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Lucide.GitCompare className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        v{version.versionNumber}
                        <span className="mx-1.5 text-slate-300 dark:text-slate-600">→</span>
                        current
                      </span>
                    </div>

                    {/* Inline / Side-by-side toggle */}
                    <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      {(["inline", "sidebyside"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setDiffMode(m)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                            diffMode === m
                              ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          }`}
                        >
                          {m === "inline" ? "Inline" : "Side by Side"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <DiffViewer
                    oldContent={htmlToShow}
                    newContent={currentHtml}
                    mode={diffMode === "sidebyside" ? "sidebyside" : "hunks"}
                    stripHtml={true}
                    maxChars={14000}
                  />
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">

              {/* Left: version info + metadata */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 shrink-0">
                  v{version.versionNumber}
                </span>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{version.label}</span>
                  {version.createdByName && <span> · by {version.createdByName}</span>}
                  <span> · {formattedDate}</span>
                  {version.metadata?.status && (
                    <span> · Status: <span className="font-semibold capitalize">{version.metadata.status}</span></span>
                  )}
                </div>
              </div>

              {/* Right: tab switcher + actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Preview / What Changed tabs */}
                <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {(["preview", "changes"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setViewTab(tab)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                        viewTab === tab
                          ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {tab === "preview" ? (
                        <><Lucide.Eye className="w-3 h-3" />Preview</>
                      ) : (
                        <><Lucide.GitCompare className="w-3 h-3" />What Changed</>
                      )}
                    </button>
                  ))}
                </div>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium"
                >
                  Close
                </button>

                {!restoreConfirm ? (
                  <button
                    onClick={() => setRestoreConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Lucide.RotateCcw className="w-3.5 h-3.5" />
                    Restore This Version
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <Lucide.AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      This will overwrite current content.
                    </span>
                    <button
                      onClick={() => { setRestoreConfirm(false); onClose(); onRestore(version); }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-all"
                    >
                      Yes, Restore
                    </button>
                    <button
                      onClick={() => setRestoreConfirm(false)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] font-semibold rounded-lg hover:bg-slate-50 transition-all"
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

  return createPortal(modalJSX, document.body);
}

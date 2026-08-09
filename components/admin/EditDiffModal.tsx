"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import DiffViewer from "./DiffViewer";

export interface EditHistoryEntry {
  id: string;
  entityId: string;
  entityType: string;
  fieldName: string;
  changeType: "added" | "deleted" | "modified" | "status_change" | "meta_change" | "restored";
  oldContent?: string | null;
  newContent?: string | null;
  adminUserId?: string | null;
  adminUserName: string;
  sessionId?: string | null;
  createdAt: string;
}

interface EditDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: EditHistoryEntry | null;
}

const CHANGE_CONFIG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  modified: { label: "Modified", badgeClass: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800", icon: Lucide.Edit3 },
  added: { label: "Added", badgeClass: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icon: Lucide.Plus },
  deleted: { label: "Deleted", badgeClass: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800", icon: Lucide.Trash2 },
  status_change: { label: "Status Change", badgeClass: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800", icon: Lucide.Tag },
  meta_change: { label: "Meta Updated", badgeClass: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800", icon: Lucide.Sliders },
  restored: { label: "Restored", badgeClass: "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800", icon: Lucide.RotateCcw },
};

function fieldLabel(fieldName: string): string {
  switch (fieldName) {
    case "full_html": return "Document Content";
    case "name": return "Title";
    case "system": return "System";
    case "category": return "Category";
    case "status": return "Status";
    case "author": return "Author";
    case "isFree": return "Free Status";
    default: return fieldName.replace(/_/g, " ");
  }
}

function getUserInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function EditDiffModal({ isOpen, onClose, entry }: EditDiffModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"sidebyside" | "inline">("sidebyside");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!entry || !mounted) return null;

  const config = CHANGE_CONFIG[entry.changeType] ?? CHANGE_CONFIG.modified;
  const Icon = config.icon;
  const isContentChange = entry.fieldName === "full_html";
  const formattedDate = new Date(entry.createdAt).toLocaleString("en-AU", {
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
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {getUserInitials(entry.adminUserName)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {entry.adminUserName}
                    </h3>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {fieldLabel(entry.fieldName)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Edited on {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {isContentChange && (
                  <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {(["sidebyside", "inline"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                          mode === m
                            ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        {m === "sidebyside" ? "Side by Side" : "Inline"}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isContentChange ? (
                /* Document HTML change diff */
                <DiffViewer
                  oldContent={entry.oldContent ?? ""}
                  newContent={entry.newContent ?? ""}
                  mode={mode === "sidebyside" ? "sidebyside" : "hunks"}
                  stripHtml={true}
                  maxChars={14000}
                />
              ) : (
                /* Non-html metadata field diff */
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Before</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 text-red-700 dark:text-red-300 font-mono break-words">
                      {entry.oldContent || <span className="italic opacity-50">Empty</span>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">After (Now)</span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 text-emerald-700 dark:text-emerald-300 font-mono font-semibold break-words">
                      {entry.newContent || <span className="italic opacity-50">Empty</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Change ID: <code className="font-mono">{entry.id}</code>
              </span>

              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalJSX, document.body);
}

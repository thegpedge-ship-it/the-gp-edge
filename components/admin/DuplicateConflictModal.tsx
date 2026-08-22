"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Copy, RefreshCw, X, FileText, CheckCircle2 } from "lucide-react";

export interface DuplicateConflictItem {
  queueItemId: string;
  incomingTitle: string;
  incomingSystem?: string;
  incomingCategory?: string;
  existingId: string;
  existingTitle: string;
  existingSystem?: string;
  existingCategory?: string;
  existingLastUpdated?: string;
}

interface DuplicateConflictModalProps {
  isOpen: boolean;
  conflicts: DuplicateConflictItem[];
  currentIndex: number;
  totalConflicts: number;
  onResolve: (action: "replace" | "keep_both" | "skip", conflict: DuplicateConflictItem) => void;
  onResolveAll?: (action: "replace_all" | "keep_both_all") => void;
  onCancel: () => void;
}

export default function DuplicateConflictModal({
  isOpen,
  conflicts,
  currentIndex = 0,
  totalConflicts,
  onResolve,
  onResolveAll,
  onCancel,
}: DuplicateConflictModalProps) {
  if (!isOpen || conflicts.length === 0) return null;

  const currentConflict = conflicts[currentIndex] || conflicts[0];
  if (!currentConflict) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-lg overflow-hidden bg-white border shadow-2xl rounded-3xl border-slate-200 dark:bg-slate-900 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Duplicate Document Detected
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {totalConflicts > 1
                    ? `Conflict ${currentIndex + 1} of ${totalConflicts}`
                    : "An existing document with the same title already exists"}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="p-4 border rounded-xl bg-slate-50 border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-700/60 space-y-2">
              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Existing Record
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {currentConflict.existingTitle}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {currentConflict.existingSystem && (
                      <span className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        {currentConflict.existingSystem}
                      </span>
                    )}
                    {currentConflict.existingCategory && (
                      <span className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        {currentConflict.existingCategory}
                      </span>
                    )}
                    {currentConflict.existingLastUpdated && (
                      <span className="text-[11px]">
                        Last updated: {currentConflict.existingLastUpdated}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-xl">
              <p className="text-xs text-teal-900 dark:text-teal-300 leading-relaxed">
                Choose whether you want to <strong className="font-semibold">Replace</strong> the existing
                document with the newly extracted version, or <strong className="font-semibold">Keep Both</strong> by
                creating a distinct copy.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onResolve("replace", currentConflict)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-sm hover:shadow transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Replace File
              </button>
              <button
                type="button"
                onClick={() => onResolve("keep_both", currentConflict)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm transition-all"
              >
                <Copy className="w-4 h-4" />
                Keep Both
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              {totalConflicts > 1 && onResolveAll ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onResolveAll("replace_all")}
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
                  >
                    Replace All ({totalConflicts})
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => onResolveAll("keep_both_all")}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:underline font-medium"
                  >
                    Keep Both for All
                  </button>
                </div>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => onResolve("skip", currentConflict)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 underline font-medium ml-auto"
              >
                Skip This File
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

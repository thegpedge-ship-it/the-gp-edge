"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import DiffViewer, { diffStats } from "./DiffViewer";
import VersionPreviewModal, { VersionInfo } from "./VersionPreviewModal";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

interface EditHistorySidebarProps {
  entityId: string;
  entityType?: "medical_condition" | "approach";
  /** All entries loaded from the API */
  history: EditHistoryEntry[];
  versions: VersionInfo[];
  loading: boolean;
  currentHtml?: string;
  adminUserName?: string;
  onRestore: (version: VersionInfo) => void;
  onSaveVersion: () => void;
  isSavingVersion?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString("en-AU", {
    day: "numeric", month: "short",
  });
}

function groupByDate(entries: EditHistoryEntry[]): Map<string, EditHistoryEntry[]> {
  const groups = new Map<string, EditHistoryEntry[]>();
  for (const entry of entries) {
    const key = new Date(entry.createdAt).toLocaleDateString("en-AU", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return groups;
}

function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type ChangeTypeConfig = {
  label: string;
  icon: React.ElementType;
  badgeClass: string;
  dotClass: string;
};

const CHANGE_TYPE_CONFIG: Record<string, ChangeTypeConfig> = {
  added: {
    label: "Added",
    icon: Lucide.Plus,
    badgeClass: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dotClass: "bg-emerald-400",
  },
  deleted: {
    label: "Deleted",
    icon: Lucide.Minus,
    badgeClass: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    dotClass: "bg-red-400",
  },
  modified: {
    label: "Modified",
    icon: Lucide.Edit2,
    badgeClass: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dotClass: "bg-amber-400",
  },
  status_change: {
    label: "Status",
    icon: Lucide.Tag,
    badgeClass: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dotClass: "bg-blue-400",
  },
  meta_change: {
    label: "Metadata",
    icon: Lucide.Settings,
    badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
  restored: {
    label: "Restored",
    icon: Lucide.RotateCcw,
    badgeClass: "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    dotClass: "bg-purple-400",
  },
};

function fieldLabel(fieldName: string): string {
  const map: Record<string, string> = {
    full_html: "Content",
    name: "Title",
    status: "Status",
    author: "Author",
    category: "Category",
    tags: "Tags",
    overview: "Overview",
    pathophysiology: "Pathophysiology",
    clinical_features: "Clinical Features",
    diagnosis: "Diagnosis",
    management: "Management",
    complications: "Complications",
    when_to_refer: "When to Refer",
    prognosis: "Prognosis",
    resources: "Resources",
  };
  return map[fieldName] || fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function avatarColor(name: string): string {
  const colors = [
    "bg-teal-500", "bg-blue-500", "bg-violet-500", "bg-amber-500",
    "bg-rose-500", "bg-emerald-500", "bg-indigo-500", "bg-orange-500",
  ];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// History Entry Row
// ─────────────────────────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: EditHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = CHANGE_TYPE_CONFIG[entry.changeType] ?? CHANGE_TYPE_CONFIG.modified;
  const Icon = config.icon;

  const hasContent = entry.oldContent !== null || entry.newContent !== null;
  const isContentChange = entry.fieldName === "full_html";

  const stats = isContentChange && hasContent
    ? diffStats(entry.oldContent ?? "", entry.newContent ?? "")
    : null;

  return (
    <div className="relative group">
      {/* Timeline dot */}
      <div className={`absolute left-[7px] top-[18px] w-2 h-2 rounded-full ${config.dotClass} ring-2 ring-white dark:ring-slate-900`} />

      <div
        className={`ml-6 rounded-xl border transition-all cursor-pointer ${
          expanded
            ? "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/80 shadow-sm"
            : "border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
        }`}
        onClick={() => hasContent && setExpanded(!expanded)}
      >
        {/* Row header */}
        <div className="flex items-start gap-2.5 p-2.5">
          {/* User avatar */}
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-full ${avatarColor(entry.adminUserName)} text-white text-[9px] font-bold shrink-0 mt-0.5`}
            title={entry.adminUserName}
          >
            {getUserInitials(entry.adminUserName)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[90px]">
                {entry.adminUserName}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${config.badgeClass}`}
              >
                <Icon className="w-2.5 h-2.5" />
                {config.label}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {fieldLabel(entry.fieldName)}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400">{relativeTime(entry.createdAt)}</span>
              {stats && (
                <>
                  {stats.added > 0 && (
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                      +{stats.added}
                    </span>
                  )}
                  {stats.removed > 0 && (
                    <span className="text-[9px] font-semibold text-red-600 dark:text-red-400">
                      -{stats.removed}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Quick preview for non-html fields */}
            {!isContentChange && entry.newContent && !expanded && (
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                {entry.oldContent ? (
                  <>
                    <span className="line-through opacity-60">{entry.oldContent}</span>
                    {" → "}
                    <span className="font-medium">{entry.newContent}</span>
                  </>
                ) : (
                  <span className="font-medium">{entry.newContent}</span>
                )}
              </p>
            )}
          </div>

          {hasContent && (
            <Lucide.ChevronDown
              className={`w-3 h-3 text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </div>

        {/* Expanded diff */}
        <AnimatePresence>
          {expanded && hasContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-700 pt-2.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Changes
                </div>
                {isContentChange ? (
                  <DiffViewer
                    oldContent={entry.oldContent ?? ""}
                    newContent={entry.newContent ?? ""}
                    mode="sidebyside"
                    maxChars={3000}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <div className="text-[9px] font-bold text-red-500 uppercase mb-1">Before</div>
                      <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-2 text-red-700 dark:text-red-300 break-words">
                        {entry.oldContent || <span className="italic opacity-50">empty</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-emerald-500 uppercase mb-1">After</div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2 text-emerald-700 dark:text-emerald-300 break-words">
                        {entry.newContent || <span className="italic opacity-50">empty</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Version Row
// ─────────────────────────────────────────────────────────────────────────────

function VersionRow({
  version,
  onPreview,
}: {
  version: VersionInfo;
  onPreview: (v: VersionInfo) => void;
}) {
  const formattedDate = new Date(version.createdAt).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });

  const isRestored = version.label?.toLowerCase().includes("restored");

  return (
    <div className="relative group">
      <div className="absolute left-[7px] top-[18px] w-2 h-2 rounded-full bg-teal-400 ring-2 ring-white dark:ring-slate-900" />

      <div className="ml-6 p-2.5 rounded-xl hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group/v"
           onClick={() => onPreview(version)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 px-1.5 py-0.5 rounded-full shrink-0">
              v{version.versionNumber}
            </span>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
              {version.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isRestored && (
              <span className="text-[9px] font-bold text-purple-500 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded-full">
                Restored
              </span>
            )}
            <Lucide.Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover/v:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-0.5 ml-[calc(10px+0.5rem)]">
          {version.createdByName && (
            <span className="text-[10px] text-slate-400">by {version.createdByName}</span>
          )}
          <span className="text-[10px] text-slate-400">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Sidebar Component
// ─────────────────────────────────────────────────────────────────────────────

export default function EditHistorySidebar({
  entityId,
  entityType = "medical_condition",
  history,
  versions,
  loading,
  currentHtml = "",
  adminUserName,
  onRestore,
  onSaveVersion,
  isSavingVersion = false,
  className = "",
}: EditHistorySidebarProps) {
  const [activeTab, setActiveTab] = useState<"history" | "versions">("history");
  const [selectedVersion, setSelectedVersion] = useState<VersionInfo | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const uniqueUsers = Array.from(new Set(history.map((h) => h.adminUserName)));
  const changeTypes = Array.from(new Set(history.map((h) => h.changeType)));

  const filteredHistory = history.filter((h) => {
    if (filterUser !== "all" && h.adminUserName !== filterUser) return false;
    if (filterType !== "all" && h.changeType !== filterType) return false;
    return true;
  });

  const grouped = groupByDate(filteredHistory);

  const handlePreviewVersion = (v: VersionInfo) => {
    setSelectedVersion(v);
    setShowVersionModal(true);
  };

  const handleRestoreVersion = (v: VersionInfo) => {
    setShowVersionModal(false);
    onRestore(v);
  };

  return (
    <>
      <div
        className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden min-h-[340px] max-h-[calc(100vh-320px)] shadow-sm ${className}`}
      >
        {/* Sidebar Header */}
        <div className="px-4 pt-4 pb-0 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lucide.History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Change History
              </span>
            </div>
            {loading && (
              <Lucide.Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5">
            {(["history", "versions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[11px] font-bold transition-all border-b-2 ${
                  activeTab === tab
                    ? "border-teal-600 text-teal-700 dark:text-teal-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab === "history" ? (
                  <>
                    Edit History
                    {history.length > 0 && (
                      <span className="ml-1.5 text-[9px] bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 px-1 py-0.5 rounded-full">
                        {history.length}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Versions
                    {versions.length > 0 && (
                      <span className="ml-1.5 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded-full">
                        {versions.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "history" && (
            <div className="p-3 space-y-1">
              {/* Filters */}
              {history.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="text-[10px] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <option value="all">All users</option>
                    {uniqueUsers.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-[10px] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <option value="all">All changes</option>
                    {changeTypes.map((t) => (
                      <option key={t} value={t}>
                        {CHANGE_TYPE_CONFIG[t]?.label ?? t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {loading && history.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                  <Lucide.Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[11px]">Loading history…</span>
                </div>
              )}

              {!loading && filteredHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                  <Lucide.Clock className="w-6 h-6 opacity-40" />
                  <span className="text-[11px] text-center">
                    No edit history yet.<br />Changes will appear here after saving.
                  </span>
                </div>
              )}

              {/* Timeline grouped by date */}
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-2 space-y-1 pb-4">
                {Array.from(grouped.entries()).map(([date, entries]) => (
                  <div key={date}>
                    <div className="sticky top-0 z-10 flex items-center gap-2 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                      <div className="absolute -left-[9px] w-3.5 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full border-2 border-white dark:border-slate-900" />
                      <span className="ml-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {date}
                      </span>
                    </div>
                    {entries.map((entry) => (
                      <HistoryRow key={entry.id} entry={entry} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "versions" && (
            <div className="p-3 space-y-1">
              {/* Save Version button */}
              <button
                onClick={onSaveVersion}
                disabled={isSavingVersion}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mb-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm"
              >
                {isSavingVersion ? (
                  <Lucide.Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lucide.Save className="w-3.5 h-3.5" />
                )}
                {isSavingVersion ? "Saving…" : "Save Current as Version"}
              </button>

              {loading && versions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                  <Lucide.Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[11px]">Loading versions…</span>
                </div>
              )}

              {!loading && versions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                  <Lucide.Layers className="w-6 h-6 opacity-40" />
                  <span className="text-[11px] text-center">
                    No versions saved yet.<br />Click above to save the current version.
                  </span>
                </div>
              )}

              {/* Version timeline */}
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-2 space-y-1 pb-4">
                {versions.map((v) => (
                  <VersionRow key={v.id} version={v} onPreview={handlePreviewVersion} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Version Preview Modal */}
      <VersionPreviewModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        version={selectedVersion}
        entityId={entityId}
        entityType={entityType}
        currentHtml={currentHtml}
        onRestore={handleRestoreVersion}
        adminUserName={adminUserName}
      />
    </>
  );
}

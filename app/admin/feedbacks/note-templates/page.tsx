"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getNoteTemplateFeedbacks, updateNoteTemplateFeedbackStatus, exportNoteTemplateFeedbacksCsvAction } from "@/app/admin/feedbacks/actions";
import type { NoteTemplateFeedbackRow } from "@/app/admin/feedbacks/actions";
import { useAdminRole } from "@/hooks/useAdminRole";
import { downloadCsv } from "@/lib/csvDownload";
import { X, Copy, Check, Download } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const PAGE_SIZE = 20;

const SEVERITY_LABELS: Record<string, string> = {
  typo_or_presentation: "Typo / presentation",
  content_may_be_wrong: "Content may be wrong",
  could_cause_harm: "Could cause harm",
};

const SEVERITY_COLORS: Record<string, string> = {
  typo_or_presentation: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  content_may_be_wrong: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  could_cause_harm: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
};

const ISSUE_LABELS: Record<string, string> = {
  clinical_content_wrong: "Clinical content wrong / out of date",
  missing_field: "Missing field for documentation",
  software_issue: "Doesn't work in software",
  export_formatting: "Export or formatting breaks",
  typo: "Typo",
};

const SOFTWARE_LABELS: Record<string, string> = {
  best_practice: "Best Practice",
  medical_director: "MedicalDirector",
  zedmed: "Zedmed",
  helix: "Helix",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  under_review: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  resolved: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export default function NoteTemplateFeedbackPage() {
  const { currentAdmin } = useAdminRole();
  const [rows, setRows] = useState<NoteTemplateFeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NoteTemplateFeedbackRow | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const csv = await exportNoteTemplateFeedbacksCsvAction(currentAdmin);
      downloadCsv(`note-template-feedback-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } finally {
      setExporting(false);
    }
  };

  const fetchPage = (p: number) => {
    setLoading(true);
    getNoteTemplateFeedbacks(p, PAGE_SIZE)
      .then((res) => { setRows(res.rows); setTotal(res.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPage(page); }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });

  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const handleStatusChange = async (row: NoteTemplateFeedbackRow, newStatus: string) => {
    await updateNoteTemplateFeedbackStatus(row.id, newStatus as any, currentAdmin);
    const updated = { ...row, status: newStatus };
    setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
    if (selected?.id === row.id) setSelected(updated);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Note Template"
        highlightedText="Feedback"
        subtitle="User-reported issues on clinical autofill note templates"
        variants={itemVariants}
        actions={
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-950/50 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        }
      />

      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/40">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Template</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">Severity</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">Issue</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">What's Wrong</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">Loading feedbacks…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">No note template feedback yet.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} onClick={() => setSelected(row)} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{row.template_name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{row.section_where}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${SEVERITY_COLORS[row.severity] || SEVERITY_COLORS.content_may_be_wrong}`}>
                      {SEVERITY_LABELS[row.severity] || row.severity}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{ISSUE_LABELS[row.issue_type] || row.issue_type}</p>
                    {row.software_name && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{SOFTWARE_LABELS[row.software_name] || row.software_name}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{row.user_name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{row.user_email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{row.whats_wrong.replace(/\n/g, " ")}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_COLORS[row.status] || STATUS_COLORS.open}`}>
                      {row.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{fmtDate(row.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-800/20">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Showing {rows.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">Previous</button>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 tabular-nums">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">Next</button>
          </div>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/35" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[780px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Note Template Feedback</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${SEVERITY_COLORS[selected.severity] || ""}`}>
                    {SEVERITY_LABELS[selected.severity] || selected.severity}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content — two columns */}
              <div className="grid grid-cols-[240px_1fr] divide-x divide-slate-100 dark:divide-slate-800">
                {/* Left: metadata */}
                <div className="px-5 py-5 space-y-4 text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Template</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">{selected.template_name}</span>
                    </div>
                    {selected.version_label && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{selected.version_label}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Template ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400 break-all">{selected.template_id}</span>
                      <button onClick={() => copyId(selected.template_id)} className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Reported By</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{selected.user_name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{selected.user_email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Date</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{fmtDateTime(selected.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Section</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selected.section_where}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Issue</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{ISSUE_LABELS[selected.issue_type] || selected.issue_type}</p>
                  </div>
                  {selected.wrong_detail && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">What's Wrong / Out of Date</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{selected.wrong_detail}</p>
                    </div>
                  )}
                  {selected.software_name && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Software</span>
                      <p className="text-sm font-bold text-violet-600 dark:text-violet-400">{SOFTWARE_LABELS[selected.software_name] || selected.software_name}</p>
                    </div>
                  )}
                  {selected.source && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Source / Reference</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{selected.source}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Status</span>
                    <select
                      value={selected.status}
                      onChange={(e) => handleStatusChange(selected, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
                    >
                      <option value="open">Open</option>
                      <option value="under_review">Under Review</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Right: description */}
                <div className="px-6 py-5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">What's Wrong</span>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 break-words">{selected.whats_wrong || "No description provided."}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

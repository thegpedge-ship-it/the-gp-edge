"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getQuestionFeedbacks } from "@/app/admin/(protected)/feedbacks/actions";
import type { QuestionFeedbackRow } from "@/app/admin/(protected)/feedbacks/actions";
import { X, Copy, Check } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const PAGE_SIZE = 20;

export default function QuestionFeedbackPage() {
  const [rows, setRows] = useState<QuestionFeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QuestionFeedbackRow | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    getQuestionFeedbacks(page, PAGE_SIZE)
      .then((res: { rows: QuestionFeedbackRow[]; total: number }) => { setRows(res.rows); setTotal(res.total); })
      .finally(() => setLoading(false));
  }, [page]);

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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader title="Question" highlightedText="Feedback" subtitle="User-reported issues and feedback on exam questions" variants={itemVariants} />

      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[22%]" />
              <col className="w-[52%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/40">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Question ID</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Feedback</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">Loading feedbacks…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">No question feedback yet.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} onClick={() => setSelected(row)} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20 px-2 py-0.5 rounded border border-teal-200/30 truncate block max-w-full" title={row.question_id}>{row.question_id.length > 12 ? row.question_id.slice(0, 12) + "…" : row.question_id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{row.user_name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{row.user_email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{row.feedback.replace(/\n/g, " ")}</p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
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

      {/* Detail Modal — wide landscape */}
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
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Question Feedback Detail</span>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content — two columns */}
              <div className="grid grid-cols-[220px_1fr] divide-x divide-slate-100 dark:divide-slate-800">
                {/* Left: metadata */}
                <div className="px-5 py-5 space-y-4 text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Question ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400 break-all">{selected.question_id}</span>
                      <button onClick={() => copyId(selected.question_id)} className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
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
                </div>

                {/* Right: feedback */}
                <div className="px-6 py-5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Feedback</span>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 break-words">{selected.feedback.replace(/\n/g, " ")}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

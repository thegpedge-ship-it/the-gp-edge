"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getQuestionFeedbacks, updateFeedbackStatus, saveAdminReply, getFeedbackMessages, sendAdminFeedbackMessage } from "@/app/admin/feedbacks/actions";
import type { QuestionFeedbackRow, AdminFeedbackMessage } from "@/app/admin/feedbacks/actions";
import { X, Copy, Check, Send } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const PAGE_SIZE = 20;

const ISSUE_LABELS: Record<string, string> = {
  keyed_answer_wrong: "Keyed answer wrong",
  schedule_wrong: "Schedule wrong",
  more_than_one_defensible: "Multiple defensible",
  no_correct_option: "No correct option",
  out_of_date: "Out of date",
  drug_error: "Drug error",
  stem_ambiguous: "Stem ambiguous",
  stem_ambiguous_or_inconsistent: "Stem ambiguous / inconsistent",
  explanation_contradicts_key: "Explanation contradicts key",
  poor_distractor: "Poor distractor",
  typo: "Typo",
};

const WHERE_LABELS: Record<string, string> = {
  stem: "Stem",
  lead_in: "Lead-in",
  option_a: "Option A",
  option_b: "Option B",
  option_c: "Option C",
  option_d: "Option D",
  option_e: "Option E",
  answer_key: "Answer key",
  explanation: "Explanation",
  reference: "Reference",
  image_table: "Image / table",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  under_review: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  resolved: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export default function QuestionFeedbackPage() {
  const [rows, setRows] = useState<QuestionFeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QuestionFeedbackRow | null>(null);
  const [copied, setCopied] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);
  const [threadMessages, setThreadMessages] = useState<AdminFeedbackMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadReplyText, setThreadReplyText] = useState("");
  const [threadSending, setThreadSending] = useState(false);

  const fetchPage = (p: number) => {
    setLoading(true);
    getQuestionFeedbacks(p, PAGE_SIZE)
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

  const handleSelect = async (row: QuestionFeedbackRow) => {
    setSelected(row);
    setReplyText(row.admin_reply ?? "");
    setThreadMessages([]);
    setThreadReplyText("");
    setThreadLoading(true);
    try {
      const msgs = await getFeedbackMessages(row.id);
      setThreadMessages(msgs);
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSaveReply = async () => {
    if (!selected || replySaving) return;
    setReplySaving(true);
    const result = await saveAdminReply(selected.id, replyText);
    setReplySaving(false);
    if (result.ok) {
      const updated = { ...selected, admin_reply: replyText.trim(), replied_at: new Date().toISOString() };
      setRows((prev) => prev.map((r) => (r.id === selected.id ? updated : r)));
      setSelected(updated);
    }
  };

  const handleSendThreadMessage = async () => {
    if (!selected || threadSending || !threadReplyText.trim()) return;
    setThreadSending(true);
    const result = await sendAdminFeedbackMessage(selected.id, threadReplyText);
    setThreadSending(false);
    if (result.ok) {
      setThreadMessages((prev) => [
        ...prev,
        {
          id: result.messageId ?? crypto.randomUUID(),
          feedbackId: selected.id,
          senderRole: "admin",
          message: threadReplyText.trim(),
          createdAt: result.createdAt ?? new Date().toISOString(),
        },
      ]);
      setThreadReplyText("");
    }
  };

  const handleStatusChange = async (row: QuestionFeedbackRow, newStatus: string) => {
    await updateFeedbackStatus(row.id, newStatus as any);
    const updated = { ...row, status: newStatus };
    setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
    if (selected?.id === row.id) setSelected(updated);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader title="Question" highlightedText="Feedback" subtitle="User-reported issues and feedback on exam questions" variants={itemVariants} />

      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[7%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[22%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/40">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Question ID</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">Issue</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">Comment</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">Loading feedbacks…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">No question feedback yet.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} onClick={() => handleSelect(row)} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20 px-2 py-0.5 rounded border border-teal-200/30 truncate block max-w-full" title={row.question_id}>{row.question_id.slice(0, 10)}…</span>
                  </td>
                  <td className="px-3 py-3">
                    {row.exam_type && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${row.exam_type === "AKT" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" : "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"}`}>
                        {row.exam_type}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{ISSUE_LABELS[row.issue_type || ""] || row.issue_type || "—"}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{WHERE_LABELS[row.issue_where || ""] || row.issue_where || ""}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{row.user_name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{row.user_email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{(row.comment || "—").replace(/\n/g, " ")}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_COLORS[row.status] || STATUS_COLORS.open}`}>
                        {row.status.replace(/_/g, " ")}
                      </span>
                      {row.has_user_message && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                          {row.thread_count} msg
                        </span>
                      )}
                    </div>
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
              className="relative w-full max-w-[860px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Feedback Detail</span>
                  {selected.exam_type && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selected.exam_type === "AKT" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" : "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"}`}>
                      {selected.exam_type}
                    </span>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content — two columns */}
              <div className="grid grid-cols-[240px_1fr] divide-x divide-slate-100 dark:divide-slate-800 flex-1 min-h-0 overflow-y-auto">
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
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Where</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{WHERE_LABELS[selected.issue_where || ""] || selected.issue_where || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Issue</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{ISSUE_LABELS[selected.issue_type || ""] || selected.issue_type || "—"}</p>
                  </div>
                  {selected.suggested_answer && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Suggested Answer</span>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Option {selected.suggested_answer}</p>
                    </div>
                  )}
                  {selected.disputed_answer && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Disputed Answer</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{selected.disputed_answer}</p>
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

                {/* Right: comment + admin reply */}
                <div className="px-6 py-5 min-w-0 flex flex-col gap-5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">User Comment</span>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 break-words">{selected.comment || "No additional comment."}</p>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800" />

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Admin Reply</span>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value.slice(0, 200))}
                      placeholder="Write a reply to the user…"
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 dark:focus:border-teal-500 resize-none transition-colors"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[11px] font-semibold tabular-nums ${replyText.length >= 180 ? "text-rose-500" : "text-slate-400 dark:text-slate-500"}`}>
                        {replyText.length}/200
                      </span>
                      <button
                        onClick={handleSaveReply}
                        disabled={replySaving || replyText.trim().length === 0}
                        className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        {replySaving ? "Saving…" : selected.admin_reply ? "Update Reply" : "Save Reply"}
                      </button>
                    </div>
                    {selected.replied_at && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                        Last replied: {fmtDateTime(selected.replied_at)}
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800" />

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Conversation Thread</span>
                    {threadLoading ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic">Loading messages…</p>
                    ) : threadMessages.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic">No thread messages yet.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {threadMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-xl text-sm leading-relaxed ${
                              msg.senderRole === "admin"
                                ? "bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-900/40"
                                : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/40"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                msg.senderRole === "admin" ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
                              }`}>
                                {msg.senderRole === "admin" ? "Admin" : "User"}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">{fmtDateTime(msg.createdAt)}</span>
                            </div>
                            <p className={msg.senderRole === "admin" ? "text-teal-900 dark:text-teal-200" : "text-slate-700 dark:text-slate-300"}>
                              {msg.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={threadReplyText}
                        onChange={(e) => setThreadReplyText(e.target.value.slice(0, 200))}
                        placeholder="Send a message…"
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-colors"
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendThreadMessage(); } }}
                      />
                      <button
                        onClick={handleSendThreadMessage}
                        disabled={threadSending || !threadReplyText.trim()}
                        className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

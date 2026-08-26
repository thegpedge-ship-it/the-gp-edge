"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Send, MessageSquare } from "lucide-react";
import { getUserFeedbacksWithMessages, sendFeedbackMessage } from "@/app/exam-prep/actions";
import type { UserFeedbackWithMessages, FeedbackMessage } from "@/app/exam-prep/actions";

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
  answer_key: "Answer key",
  explanation: "Explanation",
  reference: "Reference",
  image_table: "Image / table",
  option_a: "Option A",
  option_b: "Option B",
  option_c: "Option C",
  option_d: "Option D",
  option_e: "Option E",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  under_review: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  resolved: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MyFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<UserFeedbackWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    getUserFeedbacksWithMessages()
      .then(setFeedbacks)
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSend = async (feedbackId: string) => {
    const text = replyTexts[feedbackId]?.trim();
    if (!text || sendingId) return;
    setSendingId(feedbackId);
    const result = await sendFeedbackMessage(feedbackId, text);
    setSendingId(null);
    if (result.ok) {
      const newMsg: FeedbackMessage = {
        id: result.messageId ?? crypto.randomUUID(),
        feedbackId,
        senderRole: "user",
        message: text,
        createdAt: result.createdAt ?? new Date().toISOString(),
      };
      setFeedbacks((prev) =>
        prev.map((fb) =>
          fb.id === feedbackId ? { ...fb, messages: [...fb.messages, newMsg] } : fb
        )
      );
      setReplyTexts((prev) => ({ ...prev, [feedbackId]: "" }));
    }
  };

  const buildThread = (fb: UserFeedbackWithMessages) => {
    const thread: { role: "user" | "admin"; text: string; date: string }[] = [];
    if (fb.adminReply) {
      thread.push({ role: "admin", text: fb.adminReply, date: fb.repliedAt ?? fb.createdAt });
    }
    for (const m of fb.messages) {
      thread.push({ role: m.senderRole, text: m.message, date: m.createdAt });
    }
    return thread;
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 pt-2">
      <Link
        href="/exam-prep"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Exam Prep
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          My Feedback
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track your reported issues and continue the conversation.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="w-7 h-7 rounded-full border-2 border-slate-100 dark:border-slate-800 border-t-teal-500 animate-spin" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Loading your feedback…</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No feedback yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
            When you report an issue on a question during a test, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => {
            const isExpanded = expandedId === fb.id;
            const thread = buildThread(fb);
            const hasThread = thread.length > 0;
            const hasAdminMsg = thread.some((t) => t.role === "admin");
            return (
              <div
                key={fb.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-shadow duration-200 hover:shadow-sm"
              >
                {/* Collapsed row */}
                <button
                  onClick={() => toggleExpand(fb.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer"
                >
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_COLORS[fb.status] || STATUS_COLORS.open}`}>
                        {fb.status.replace(/_/g, " ")}
                      </span>
                      {fb.examType && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          fb.examType === "AKT"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                            : "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                        }`}>
                          {fb.examType}
                        </span>
                      )}
                      {hasAdminMsg && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                          replied
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                      {ISSUE_LABELS[fb.issueType || ""] || fb.issueType || "Reported issue"}
                      {fb.issueWhere && (
                        <span className="font-normal text-slate-400 dark:text-slate-500">
                          {" "}in {WHERE_LABELS[fb.issueWhere] || fb.issueWhere}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{fmtDate(fb.createdAt)}</p>
                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{fb.questionId.slice(0, 8)}…</p>
                  </div>
                </button>

                {/* Expanded detail */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {/* Report details */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mt-3 mb-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Where</span>
                            <p className="text-slate-700 dark:text-slate-300">{WHERE_LABELS[fb.issueWhere || ""] || fb.issueWhere || "—"}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Issue Type</span>
                            <p className="text-slate-700 dark:text-slate-300">{ISSUE_LABELS[fb.issueType || ""] || fb.issueType || "—"}</p>
                          </div>
                          {fb.suggestedAnswer && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Suggested Answer</span>
                              <p className="text-indigo-600 dark:text-indigo-400 font-bold">Option {fb.suggestedAnswer}</p>
                            </div>
                          )}
                          {fb.disputedAnswer && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Disputed Answer</span>
                              <p className="text-slate-700 dark:text-slate-300">{fb.disputedAnswer}</p>
                            </div>
                          )}
                        </div>

                        {fb.comment && (
                          <div className="mb-4">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Your Comment</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{fb.comment}</p>
                          </div>
                        )}

                        {/* Conversation thread */}
                        {hasThread && (
                          <div className="mb-4">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Conversation</span>
                            <div className="space-y-2.5">
                              {thread.map((msg, i) => (
                                <div
                                  key={i}
                                  className={`p-3 rounded-xl text-sm leading-relaxed ${
                                    msg.role === "admin"
                                      ? "bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-900/40"
                                      : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/40"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                      msg.role === "admin" ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
                                    }`}>
                                      {msg.role === "admin" ? "Admin" : "You"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{fmtDateTime(msg.date)}</span>
                                  </div>
                                  <p className={msg.role === "admin" ? "text-teal-900 dark:text-teal-200" : "text-slate-700 dark:text-slate-300"}>
                                    {msg.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reply input */}
                        <div className="flex gap-2">
                          <textarea
                            value={replyTexts[fb.id] ?? ""}
                            onChange={(e) =>
                              setReplyTexts((prev) => ({ ...prev, [fb.id]: e.target.value.slice(0, 200) }))
                            }
                            placeholder="Write a reply…"
                            rows={2}
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 dark:focus:border-teal-500 resize-none transition-colors"
                          />
                          <button
                            onClick={() => handleSend(fb.id)}
                            disabled={sendingId === fb.id || !(replyTexts[fb.id]?.trim())}
                            className="self-end px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {sendingId === fb.id ? "Sending…" : "Send"}
                          </button>
                        </div>
                        <div className="flex justify-end mt-1">
                          <span className={`text-[10px] font-semibold tabular-nums ${(replyTexts[fb.id]?.length ?? 0) >= 180 ? "text-rose-500" : "text-slate-400 dark:text-slate-500"}`}>
                            {replyTexts[fb.id]?.length ?? 0}/200
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

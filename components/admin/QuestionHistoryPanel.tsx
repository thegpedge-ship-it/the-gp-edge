"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionEventsAction, QuestionEvent } from "@/actions/question.actions";

const EVENT_LABELS: Record<string, string> = {
  created: "Created",
  edited: "Edited",
  reviewed: "Reviewed",
  signedoff: "Signed off",
  published: "Published",
  flagged: "Flagged",
  retired: "Archived",
  restored: "Restored",
};

export default function QuestionHistoryPanel({ questionId, uqid, onClose }: { questionId: string; uqid?: string; onClose: () => void }) {
  const [events, setEvents] = useState<QuestionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getQuestionEventsAction(questionId).then((data) => {
      if (mounted) {
        setEvents(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [questionId]);

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[80]" onClick={onClose} />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="fixed inset-x-4 top-[8%] mx-auto max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl z-[85] shadow-2xl overflow-y-auto max-h-[80vh]"
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Change History {uqid && <span className="font-mono text-teal-600 dark:text-teal-400">— {uqid}</span>}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 text-center py-6">Loading…</p>
          ) : events.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No recorded events yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="flex gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{EVENT_LABELS[e.eventType] || e.eventType}</span>
                      <span className="text-slate-400">{new Date(e.createdAt).toLocaleString()}</span>
                    </div>
                    {e.actorName && <p className="text-slate-500 dark:text-slate-400 mt-0.5">by {e.actorName}</p>}
                    {e.fromStatus && e.toStatus && e.fromStatus !== e.toStatus && (
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{e.fromStatus} → {e.toStatus}</p>
                    )}
                    {e.fieldsChanged.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {e.fieldsChanged.map((f) => (
                          <span
                            key={f}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              f === "answer"
                                ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                    {e.note && <p className="text-slate-500 dark:text-slate-400 mt-0.5 italic">{e.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

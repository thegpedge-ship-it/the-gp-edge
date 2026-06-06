"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { addUserNotification } from "@/utils/notifications";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const uploadHistory = [
  { id: 1, filename: "cardiology_q_batch_3.csv", date: "28 May 2026", items: 142, successes: 139, failures: 3, status: "success" as const },
  { id: 2, filename: "mental_health_autofills.csv", date: "25 May 2026", items: 86, successes: 86, failures: 0, status: "success" as const },
  { id: 3, filename: "dermatology_questions.csv", date: "22 May 2026", items: 200, successes: 187, failures: 13, status: "warning" as const },
  { id: 4, filename: "mbs_items_update.csv", date: "18 May 2026", items: 50, successes: 0, failures: 50, status: "failed" as const },
];

const validationErrors = [
  { row: 14, field: "correct_answer", message: "Value 'E' is not a valid option. Must be A, B, C, or D." },
  { row: 37, field: "topic", message: "Topic 'Cardio' not found. Did you mean 'Cardiology'?" },
  { row: 89, field: "question_text", message: "Duplicate detected — matches Question #2341." },
];

export default function UploadsPage() {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const simulateUpload = () => {
    setUploadProgress(0);
    setShowValidation(false);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          setShowValidation(true);
          addUserNotification(
            "139 New Questions Uploaded",
            "Admin has successfully uploaded a batch of 139 Cardiology questions to the practice library.",
            139,
            "upload"
          );
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Bulk Upload"
        highlightedText="System"
        subtitle="Upload and validate CSV files for questions and content"
        variants={itemVariants}
      />

      {/* Upload zone */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 shadow-sm relative overflow-hidden rounded-3xl text-slate-800 dark:text-slate-100">
        <div className="relative z-10">
          <div
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500/60 hover:bg-teal-50/10 dark:hover:bg-teal-950/10 rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer group"
            onClick={simulateUpload}
          >
            <svg
              className="w-12 h-12 text-slate-400 mx-auto mb-4 group-hover:scale-105 group-hover:text-teal-500 transition-all duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Drop your CSV file here</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 font-normal">or click to browse · Supports .csv files up to 10MB</p>
            <div className="flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400">
                <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                .csv
              </span>
              <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Download Template
              </button>
            </div>
          </div>

          {/* Upload progress */}
          {uploadProgress !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {uploadProgress >= 100 ? "Upload complete" : "Uploading..."}
                </span>
                <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{Math.min(Math.round(uploadProgress), 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${Math.min(uploadProgress, 100)}%` }}
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
              {uploadProgress >= 100 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1.5 animate-fade-in">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  139 of 142 items processed successfully
                </p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Validation errors */}
      {showValidation && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50/30 backdrop-blur-xl rounded-2xl border border-red-200/60 shadow-md shadow-red-200/5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-red-50/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <h3 className="text-sm font-bold text-red-800">3 Validation Errors</h3>
              </div>
              <button className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-all">Retry Failed</button>
            </div>
            <div className="divide-y divide-red-100">
              {validationErrors.map((err, i) => (
                <div key={i} className="px-6 py-3 flex items-start gap-4">
                  <span className="text-xs font-bold text-red-400 mt-0.5">Row {err.row}</span>
                  <div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{err.field}</span>
                    <p className="text-sm text-slate-600 mt-1">{err.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Upload history */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200/40">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">File</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Items</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Success</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Failed</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {uploadHistory.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-sm font-medium text-slate-700">{u.filename}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">{u.date}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{u.items}</td>
                  <td className="px-4 py-4 text-sm font-medium text-emerald-600">{u.successes}</td>
                  <td className="px-4 py-4 text-sm font-medium text-red-600">{u.failures}</td>
                  <td className="px-4 py-4"><StatusBadge variant={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

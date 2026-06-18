"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminRole } from "@/hooks/useAdminRole";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const featureFlags = [
  { name: "Dark Mode", desc: "System-wide dark mode support across all pages", enabled: true, tag: "Stable" },
  { name: "PDF Export", desc: "Export clinical templates and content as print-ready PDFs", enabled: true, tag: "Stable" },
  { name: "Document Import (AI Extract)", desc: "Extract question and template data from uploaded PDF/DOCX files", enabled: true, tag: "Beta" },
  { name: "New Quiz Interface", desc: "Redesigned quiz-taking experience with improved navigation", enabled: false, tag: "Alpha" },
  { name: "Flowchart Builder", desc: "Visual flowchart editor inside the template content editor", enabled: true, tag: "Beta" },
  { name: "Offline Mode", desc: "Allow content downloads for offline access on supported devices", enabled: false, tag: "Planned" },
];

const scheduledJobs: { name: string; schedule: string; lastRun: string; nextRun: string; status: "active" | "suspended" }[] = [
  { name: "Daily Analytics Aggregation", schedule: "Every day at 2:00 AM", lastRun: "28 May 2026, 2:00 AM", nextRun: "29 May 2026, 2:00 AM", status: "active" as const },
  { name: "Weekly Billing Summary Email", schedule: "Every Monday at 9:00 AM", lastRun: "26 May 2026, 9:00 AM", nextRun: "2 Jun 2026, 9:00 AM", status: "active" as const },
  { name: "Subscription Expiry Checker", schedule: "Every 6 hours", lastRun: "28 May 2026, 6:00 PM", nextRun: "29 May 2026, 12:00 AM", status: "active" as const },
  { name: "Content Expiry & Review Check", schedule: "Every day at 8:00 AM", lastRun: "28 May 2026, 8:00 AM", nextRun: "29 May 2026, 8:00 AM", status: "active" as const },
  { name: "Search Index Rebuild", schedule: "Every 12 hours", lastRun: "28 May 2026, 10:00 PM", nextRun: "29 May 2026, 10:00 AM", status: "active" as const },
  { name: "Database Backup", schedule: "Every day at 3:00 AM", lastRun: "28 May 2026, 3:00 AM", nextRun: "29 May 2026, 3:00 AM", status: "active" as const },
  { name: "Failed Payment Retry", schedule: "Every day at 7:00 AM", lastRun: "28 May 2026, 7:00 AM", nextRun: "29 May 2026, 7:00 AM", status: "active" as const },
];

const tagColors: Record<string, string> = {
  Beta: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/50",
  Alpha: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50",
  Stable: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
  Experimental: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  Planned: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

export default function SettingsPage() {
  const { isReadOnly } = useAdminRole();
  const [flags, setFlags] = useState(featureFlags);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("We're performing scheduled maintenance. We'll be back shortly!");
  const [jobs, setJobs] = useState(scheduledJobs);

  const toggleFlag = (index: number) => {
    if (isReadOnly) return;
    setFlags((prev) => prev.map((f, i) => (i === index ? { ...f, enabled: !f.enabled } : f)));
  };

  const toggleJob = (index: number) => {
    if (isReadOnly) return;
    setJobs((prev) => prev.map((j, i) => (i === index ? { ...j, status: j.status === "active" ? "suspended" as const : "active" as const } : j)));
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="System"
        highlightedText="Settings"
        subtitle="Feature flags, maintenance mode, and system controls"
        variants={itemVariants}
      />

      {isReadOnly && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 rounded-2xl flex gap-3 text-xs text-blue-850 dark:text-blue-300 leading-relaxed items-center shadow-sm"
        >
          <svg className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-455" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">View-Only Mode Enabled</p>
            <p className="mt-0.5 opacity-90">
              You are signed in under the <strong>Viewer</strong> role. You have full read-only access to all sections and data, but toggling maintenance mode, feature flags, or scheduled jobs is restricted.
            </p>
          </div>
        </motion.div>
      )}

      {/* Maintenance mode */}
      <motion.div variants={itemVariants} className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border p-6 shadow-md shadow-slate-200/30 dark:shadow-slate-950/40 transition-all relative overflow-hidden ${maintenanceMode ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50" : "border-slate-100/80 dark:border-slate-800/80"}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 dark:from-transparent via-transparent to-teal-50/5 dark:to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${maintenanceMode ? "bg-amber-100 dark:bg-amber-950/40" : "bg-slate-100 dark:bg-slate-800"}`}>
                <svg className={`w-5 h-5 ${maintenanceMode ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Maintenance Mode</h3>
                <p className="text-xs text-slate-400">{maintenanceMode ? "Platform is currently offline for users" : "Platform is running normally"}</p>
              </div>
            </div>
            <button 
              onClick={() => !isReadOnly && setMaintenanceMode(!maintenanceMode)} 
              disabled={isReadOnly}
              className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0 ${maintenanceMode ? "bg-[#34C759]" : "bg-[#e9e9eb] dark:bg-slate-950/60"} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <motion.div
                animate={{ x: maintenanceMode ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] transition-colors duration-200 ${
                  maintenanceMode ? "bg-white dark:bg-slate-900" : "bg-white dark:bg-slate-800"
                }`}
              />
            </button>
          </div>
          {maintenanceMode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Maintenance Message</label>
              <textarea 
                value={maintenanceMessage} 
                disabled={isReadOnly}
                onChange={(e) => !isReadOnly && setMaintenanceMessage(e.target.value)} 
                rows={2} 
                className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-955 border border-amber-200 dark:border-amber-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none dark:text-slate-100" 
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Feature flags */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800/80 shadow-md shadow-slate-200/30 dark:shadow-slate-950/40 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-transparent via-transparent to-teal-50/5 dark:to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-800/60"><h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Feature Flags</h3></div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {flags.map((flag, i) => (
              <div key={flag.name} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{flag.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagColors[flag.tag]}`}>{flag.tag}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{flag.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => !isReadOnly && toggleFlag(i)} 
                  disabled={isReadOnly}
                  className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 flex-shrink-0 ml-4 ${flag.enabled ? "bg-[#34C759]" : "bg-[#e9e9eb] dark:bg-slate-950/60"} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <motion.div
                    animate={{ x: flag.enabled ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] transition-colors duration-200 ${
                      flag.enabled ? "bg-white dark:bg-slate-900" : "bg-white dark:bg-slate-800"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Upload monitoring */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800/80 p-6 shadow-md shadow-slate-200/30 dark:shadow-slate-950/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-transparent via-transparent to-teal-50/5 dark:to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Upload Monitoring</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Storage Used</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">2.4 GB</p>
              <p className="text-xs text-slate-400">of 10 GB</p>
            </div>
            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Files Uploaded</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">847</p>
              <p className="text-xs text-slate-400">this month</p>
            </div>
            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Largest File</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">45 MB</p>
              <p className="text-xs text-slate-400">medical_library.pdf</p>
            </div>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full" style={{ width: "24%" }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">24% of storage used</p>
        </div>
      </motion.div>

      {/* Scheduled jobs */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800/80 shadow-md shadow-slate-200/30 dark:shadow-slate-950/40 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-transparent via-transparent to-teal-50/5 dark:to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-800/60"><h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Scheduled Jobs</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200/40 dark:border-slate-800/60">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Job</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Schedule</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Last Run</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Next Run</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Toggle</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {jobs.map((job, i) => (
                  <tr key={job.name} className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">{job.name}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{job.schedule}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{job.lastRun}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{job.nextRun}</td>
                    <td className="px-4 py-4"><StatusBadge variant={job.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => !isReadOnly && toggleJob(i)} 
                        disabled={isReadOnly}
                        className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${job.status === "active" ? "bg-[#34C759]" : "bg-[#e9e9eb] dark:bg-slate-955/60"} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <motion.div
                          animate={{ x: job.status === "active" ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] transition-colors duration-200 ${
                            job.status === "active" ? "bg-white dark:bg-slate-900" : "bg-white dark:bg-slate-800"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

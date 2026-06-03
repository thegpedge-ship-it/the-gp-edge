"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import PageBanner from "@/components/shared/PageBanner";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const adminRoles = [
  { name: "Siddhant Udavant", email: "udavantsiddhant@outlook.com", role: "Super Admin", permissions: "Full Access", lastLogin: "Just now" },
  { name: "Dr. Arun Mehta", email: "arun.mehta@gpedge.com", role: "Admin", permissions: "Content, Users, Analytics", lastLogin: "2 hours ago" },
  { name: "Jessica Park", email: "j.park@gpedge.com", role: "Moderator", permissions: "Content Review, Flags", lastLogin: "1 day ago" },
];

const auditLogs = [
  { timestamp: "28 May 2026, 11:45 PM", admin: "Siddhant Udavant", action: "Published Question #2850", category: "Questions", severity: "info" },
  { timestamp: "28 May 2026, 11:30 PM", admin: "Siddhant Udavant", action: "Suspended user Dr. Alex Kumar", category: "Users", severity: "warning" },
  { timestamp: "28 May 2026, 10:15 PM", admin: "Dr. Arun Mehta", action: "Uploaded CSV: cardiology_q_batch_3.csv (142 items)", category: "Uploads", severity: "info" },
  { timestamp: "28 May 2026, 9:00 PM", admin: "Jessica Park", action: "Approved Question #2853 for review", category: "Questions", severity: "info" },
  { timestamp: "28 May 2026, 6:30 PM", admin: "Siddhant Udavant", action: "Updated adaptive weighting for Mental Health (+15%)", category: "Adaptive", severity: "info" },
  { timestamp: "28 May 2026, 4:00 PM", admin: "Dr. Arun Mehta", action: "Deleted Question #2839 (Duplicate)", category: "Questions", severity: "warning" },
  { timestamp: "27 May 2026, 11:00 PM", admin: "Siddhant Udavant", action: "Enabled maintenance mode for 30 minutes", category: "System", severity: "warning" },
  { timestamp: "27 May 2026, 8:00 PM", admin: "Jessica Park", action: "Approved refund $24.00 for Dr. David Kim", category: "Billing", severity: "info" },
];

const softDeleted = [
  { item: "Question #2839", type: "Question", deletedBy: "Dr. Arun Mehta", date: "28 May 2026", reason: "Duplicate" },
  { item: "GORD Template v1", type: "Autofill", deletedBy: "Jessica Park", date: "25 May 2026", reason: "Outdated" },
  { item: "Dr. Test Account", type: "User", deletedBy: "Siddhant Udavant", date: "20 May 2026", reason: "Test data cleanup" },
];

const severityColors: Record<string, string> = {
  info: "text-teal-600 bg-teal-50",
  warning: "text-amber-600 bg-amber-50",
  critical: "text-red-600 bg-red-50",
};

export default function AuditPage() {
  const [logFilter, setLogFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [preventBulk, setPreventBulk] = useState(true);
  const [archiveInstead, setArchiveInstead] = useState(false);

  const filteredLogs = logFilter === "all" ? auditLogs : auditLogs.filter((l) => l.category.toLowerCase() === logFilter);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <PageBanner
        title="Audit &"
        highlightedText="Security"
        subtitle="Admin roles, activity logs, and delete protection"
        illustrationPath="/assets/admin_users_illustration.png"
        pillText="System"
        variants={itemVariants}
      />

      {/* Admin roles */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40"><h3 className="text-sm font-bold text-slate-900">Admin Roles & Permissions</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200/40">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Admin</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Permissions</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Last Login</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {adminRoles.map((a) => (
                  <tr
                    key={a.email}
                    className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">{a.name.split(" ").map((n) => n[0]).join("")}</div>
                        <div><p className="text-sm font-semibold text-slate-800">{a.name}</p><p className="text-xs text-slate-400">{a.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.role === "Super Admin" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : a.role === "Admin" ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>{a.role}</span></td>
                    <td className="px-4 py-4 text-xs text-slate-500 max-w-[200px]">{a.permissions}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{a.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Audit log */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-bold text-slate-900">Audit Log</h3>
            <div className="flex gap-1.5 bg-slate-100/50 rounded-lg p-1">
              {["all", "users", "questions", "billing", "system"].map((f) => (
                <button key={f} onClick={() => setLogFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${logFilter === f ? "bg-white text-teal-700 shadow-sm border border-teal-100/30" : "text-slate-500 hover:text-slate-700"}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {filteredLogs.map((log, i) => (
              <div
                key={i}
                className="px-6 py-3.5 flex items-start gap-4 hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
              >
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${severityColors[log.severity]}`}>{log.category}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{log.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5">by {log.admin} · {log.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soft delete recovery */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="px-6 py-4 border-b border-slate-200/40"><h3 className="text-sm font-bold text-slate-900">Soft-Deleted Items</h3></div>
            <div className="divide-y divide-slate-100">
              {softDeleted.map((d, i) => (
                <div
                  key={i}
                  className="px-6 py-4 flex items-center justify-between hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{d.item}</p>
                    <p className="text-xs text-slate-400">{d.type} · by {d.deletedBy} · {d.date} · {d.reason}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <button className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-all">Restore</button>
                    <button className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all">Permanent</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Delete protection */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Delete Protection</h3>
            <div className="space-y-4">
              {[
                { label: "Require confirmation dialog", desc: "Show a confirmation modal before any delete action", value: confirmDelete, set: setConfirmDelete },
                { label: "Prevent bulk delete", desc: "Disable deleting more than 5 items at once", value: preventBulk, set: setPreventBulk },
                { label: "Archive instead of delete", desc: "Soft-delete all items by default", value: archiveInstead, set: setArchiveInstead },
              ].map((toggle) => (
                <div key={toggle.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{toggle.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{toggle.desc}</p>
                  </div>
                  <button onClick={() => toggle.set(!toggle.value)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${toggle.value ? "bg-teal-500" : "bg-slate-300"}`}>
                    <motion.div animate={{ x: toggle.value ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const scheduledNotifs = [
  { id: 1, title: "Maintenance Window — 2:00–3:00 AM AEST", type: "In-app", target: "All Users", scheduled: "Every Sunday 1:30 AM", status: "active" as const },
  { id: 2, title: "New Cardiology Module Available", type: "In-app", target: "All Subscribers", scheduled: "30 May 2026, 10:00 AM", status: "pending" as const },
  { id: 3, title: "Subscription Renewal Reminder", type: "Email", target: "Expiring in 7 days", scheduled: "1 Jun 2026, 9:00 AM", status: "pending" as const },
];

const sentHistory = [
  { title: "Platform Update — v2.4 Release Notes", type: "In-app", target: "All Users", sent: 14230, opened: 9870, clicked: 4120, date: "27 May 2026" },
  { title: "New Mental Health Content Published", type: "In-app", target: "All Subscribers", sent: 12847, opened: 8432, clicked: 3214, date: "25 May 2026" },
  { title: "Subscription Renewal Reminder", type: "Email", target: "Expiring Subscribers", sent: 1456, opened: 1123, clicked: 876, date: "22 May 2026" },
  { title: "Billing Receipt — May 2026", type: "Email", target: "All Subscribers", sent: 1456, opened: 1302, clicked: 241, date: "20 May 2026" },
];

const templates = [
  { name: "Platform Update", desc: "Announce a new release or feature change" },
  { name: "New Content Alert", desc: "Notify subscribers about new modules or articles" },
  { name: "Billing & Invoice", desc: "Subscription receipts and renewal reminders" },
  { name: "Maintenance Notice", desc: "Scheduled downtime or system maintenance" },
];

export default function NotificationsPage() {
  const [showCompose, setShowCompose] = useState(false);
  const [newNotifType, setNewNotifType] = useState("In-app");
  const [newNotifTarget, setNewNotifTarget] = useState("All Subscribers");
  const [newNotifSchedule, setNewNotifSchedule] = useState("Send Now");

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="System"
        highlightedText="Notifications"
        subtitle="Broadcast platform updates, billing alerts, and content announcements"
        variants={itemVariants}
      />

      {/* Create New Notification button */}
      <motion.div variants={itemVariants} className="flex justify-end">
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]"
          style={{
            background: showCompose
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #14b8a6, #0d9488)",
          }}
        >
          {showCompose ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create New Notification
            </>
          )}
        </button>
      </motion.div>

      {/* Compose form */}
      {showCompose && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/80 dark:border-slate-800 p-6 shadow-md shadow-slate-200/30 relative z-20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-slate-900/85 via-transparent to-teal-50/5 dark:to-teal-950/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">New Notification</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 text-sm bg-white/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-800 dark:text-slate-200"
                  placeholder="Notification title..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Message</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 text-sm bg-white/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none text-slate-800 dark:text-slate-200"
                  placeholder="Write your message..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Type</label>
                  <CustomSelect
                    value={newNotifType}
                    onChange={setNewNotifType}
                    options={[
                      { value: "In-app", label: "In-app" },
                      { value: "Email", label: "Email" },
                      { value: "Both", label: "Both" },
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Target</label>
                  <CustomSelect
                    value={newNotifTarget}
                    onChange={setNewNotifTarget}
                    options={[
                      { value: "All Subscribers", label: "All Subscribers" },
                      { value: "All Users", label: "All Users" },
                      { value: "Expiring Soon", label: "Expiring Soon" },
                      { value: "Monthly Plan", label: "Monthly Plan" },
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Schedule</label>
                  <CustomSelect
                    value={newNotifSchedule}
                    onChange={setNewNotifSchedule}
                    options={[
                      { value: "Send Now", label: "Send Now" },
                      { value: "Schedule Later", label: "Schedule Later" },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-all shadow-sm"
                >
                  Send Notification
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/80 dark:border-slate-800 shadow-md shadow-slate-200/30 overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-slate-900/85 via-transparent to-teal-50/5 dark:to-teal-950/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Scheduled Notifications</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {scheduledNotifs.map((n) => (
                <div
                  key={n.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{n.type} · {n.target} · {n.scheduled}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={n.status} />
                    <div className="opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <button className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Delivery targets panel */}
        <motion.div
          variants={itemVariants}
          className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/80 dark:border-slate-800 p-6 shadow-md shadow-slate-200/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-slate-900/85 via-transparent to-teal-50/5 dark:to-teal-950/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Audience Targets</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Reach specific subscriber segments</p>
            <div className="space-y-2">
              {[
                { label: "All Subscribers", count: "1,456", desc: "Active premium accounts" },
                { label: "Expiring Soon", count: "87", desc: "Renewal within 7 days" },
                { label: "Monthly Plan", count: "466", desc: "Non-annual subscribers" },
                { label: "All Users", count: "14,230", desc: "Entire registered base" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex items-center justify-between p-3 bg-white/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-teal-200 dark:hover:border-teal-800 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t.desc}</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 px-2.5 py-0.5 rounded-full">
                    {t.count}
                  </span>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-5 mb-3">Quick Templates</h4>
            <div className="space-y-2">
              {templates.map((t) => (
                <button
                  key={t.name}
                  className="w-full text-left p-3 bg-white/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-teal-200 dark:hover:border-teal-800 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200"
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sent history */}
      <motion.div
        variants={itemVariants}
        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/80 dark:border-slate-800 shadow-md shadow-slate-200/30 overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-slate-900/85 via-transparent to-teal-50/5 dark:to-teal-950/10 pointer-events-none rounded-2xl" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sent History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/40 dark:border-slate-800">
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Notification</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Sent</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Opened</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Clicked</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sentHistory.map((n, i) => (
                  <tr
                    key={i}
                    className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{n.target}</p>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">{n.type}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">{n.sent.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{n.opened.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-teal-600 dark:text-teal-400 font-semibold">{n.clicked.toLocaleString()}</td>
                    <td className="px-4 py-4 text-xs text-slate-400 dark:text-slate-500">{n.date}</td>
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

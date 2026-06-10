"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const scheduledNotifs = [
  { id: 1, title: "Weekly Study Reminder", type: "Email", target: "All Users", scheduled: "Every Monday 9:00 AM", status: "active" as const },
  { id: 2, title: "New Cardiology Questions Available", type: "In-app", target: "Premium", scheduled: "30 May 2026, 10:00 AM", status: "pending" as const },
  { id: 3, title: "Exam Date Approaching", type: "Both", target: "AKT Registrants", scheduled: "1 Jun 2026, 8:00 AM", status: "pending" as const },
];

const sentHistory = [
  { title: "Welcome to The GP Edge!", type: "Email", target: "New Users", sent: 1245, opened: 987, clicked: 432, date: "27 May 2026" },
  { title: "New Mental Health Module", type: "In-app", target: "All Users", sent: 12847, opened: 8432, clicked: 3214, date: "25 May 2026" },
  { title: "Subscription Renewal Reminder", type: "Email", target: "Premium", sent: 1456, opened: 1123, clicked: 876, date: "22 May 2026" },
  { title: "Study Streak Achievement", type: "In-app", target: "Active Users", sent: 3219, opened: 2876, clicked: 1543, date: "20 May 2026" },
];

const templates = [
  { name: "Welcome Email", desc: "Sent to new users after signup" },
  { name: "Study Reminder", desc: "Weekly study nudge for inactive users" },
  { name: "New Content Alert", desc: "Notify about new questions or modules" },
  { name: "Exam Countdown", desc: "Countdown reminders before exam dates" },
];

export default function NotificationsPage() {
  const [showCompose, setShowCompose] = useState(false);
  const [inactivityDays, setInactivityDays] = useState(7);
  const [newNotifType, setNewNotifType] = useState("In-app");
  const [newNotifTarget, setNewNotifTarget] = useState("All Users");
  const [newNotifSchedule, setNewNotifSchedule] = useState("Send Now");

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="System"
        highlightedText="Notifications"
        subtitle="Send in-app and email notifications to users"
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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative z-20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 mb-4">New Notification</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Title</label><input type="text" className="w-full px-4 py-2.5 text-sm bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" placeholder="Notification title..." /></div>
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Message</label><textarea rows={3} className="w-full px-4 py-3 text-sm bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none" placeholder="Write your message..." /></div>
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
                      { value: "All Users", label: "All Users" },
                      { value: "Premium", label: "Premium" },
                      { value: "Free", label: "Free" },
                      { value: "Inactive", label: "Inactive" },
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
                <button onClick={() => setShowCompose(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={() => setShowCompose(false)} className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-all shadow-sm">Send Notification</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="px-6 py-4 border-b border-slate-200/40"><h3 className="text-sm font-bold text-slate-900">Scheduled Notifications</h3></div>
            <div className="divide-y divide-slate-100">
              {scheduledNotifs.map((n) => (
                <div key={n.id} className="px-6 py-4 flex items-center justify-between hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.type} · {n.target} · {n.scheduled}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={n.status} />
                    <div className="opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Inactivity reminder */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Inactivity Reminder</h3>
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Send reminder after</p>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={30} value={inactivityDays} onChange={(e) => setInactivityDays(Number(e.target.value))} className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-teal-500" />
                <span className="text-sm font-bold text-teal-600 w-16 text-right">{inactivityDays} days</span>
              </div>
            </div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Templates</h4>
            <div className="space-y-2">
              {templates.map((t) => (
                <button key={t.name} className="w-full text-left p-3 bg-white/40 border border-slate-100 rounded-xl hover:border-teal-200 hover:bg-teal-50/30 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200">
                  <p className="text-sm font-semibold text-slate-700">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sent history */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40"><h3 className="text-sm font-bold text-slate-900">Sent History</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200/40">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Notification</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Sent</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Opened</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Clicked</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {sentHistory.map((n, i) => (
                  <tr key={i} className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer">
                    <td className="px-6 py-4"><p className="text-sm font-semibold text-slate-800">{n.title}</p><p className="text-xs text-slate-400">{n.target}</p></td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-600">{n.type}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{n.sent.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-emerald-600 font-semibold">{n.opened.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-teal-600 font-semibold">{n.clicked.toLocaleString()}</td>
                    <td className="px-4 py-4 text-xs text-slate-400">{n.date}</td>
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

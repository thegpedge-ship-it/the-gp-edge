"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  getNotificationsFromDbAction,
  getNotificationAudienceMetricsAction,
  createNotificationInDbAction,
  deleteNotificationFromDbAction,
  SystemNotificationItem,
  AudienceMetrics,
} from "@/actions/admin.actions";
import { Bell, Send, Clock, Users, Trash2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const templates = [
  { name: "Platform Update", desc: "Announce a new release or feature change", title: "Platform Update — Release Notes", msg: "We've rolled out new updates to enhance your exam prep experience." },
  { name: "New Content Alert", desc: "Notify subscribers about new modules or articles", title: "New Clinical Content Published", msg: "Explore newly added clinical guidelines and approaches now in your library." },
  { name: "Billing & Invoice", desc: "Subscription receipts and renewal reminders", title: "Subscription Renewal Reminder", msg: "Your subscription renewal is upcoming. Verify your billing preferences." },
  { name: "Maintenance Notice", desc: "Scheduled downtime or system maintenance", title: "Scheduled Maintenance Notice", msg: "Platform maintenance is scheduled. Minimal downtime expected." },
];

export default function NotificationsPage() {
  const { isReadOnly } = useAdminRole();
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form state
  const [newNotifTitle, setNewNotifTitle] = useState("");
  const [newNotifMessage, setNewNotifMessage] = useState("");
  const [newNotifType, setNewNotifType] = useState("In-app");
  const [newNotifTarget, setNewNotifTarget] = useState("All Subscribers");
  const [newNotifSchedule, setNewNotifSchedule] = useState("Send Now");
  const [newNotifScheduledAt, setNewNotifScheduledAt] = useState("");

  // Real data state
  const [notifications, setNotifications] = useState<SystemNotificationItem[]>([]);
  const [audienceMetrics, setAudienceMetrics] = useState<AudienceMetrics>({
    allUsers: 0,
    allSubscribers: 0,
    expiringSoon: 0,
    monthlyPlan: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [notifsData, metricsData] = await Promise.all([
        getNotificationsFromDbAction(),
        getNotificationAudienceMetricsAction(),
      ]);
      setNotifications(notifsData);
      setAudienceMetrics(metricsData);
    } catch (err) {
      console.error("Error loading notification data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendNotification = async () => {
    if (isReadOnly) return;
    if (!newNotifTitle.trim()) {
      setFeedback({ type: "error", msg: "Please enter a notification title." });
      return;
    }
    if (newNotifSchedule === "Scheduled" && !newNotifScheduledAt) {
      setFeedback({ type: "error", msg: "Please choose a date and time to schedule this notification." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const res = await createNotificationInDbAction({
      title: newNotifTitle.trim(),
      message: newNotifMessage.trim(),
      type: newNotifType,
      target: newNotifTarget,
      schedule: newNotifSchedule,
      scheduledAt: newNotifSchedule === "Scheduled" ? new Date(newNotifScheduledAt).toISOString() : undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: "success", msg: "Notification created and processed successfully!" });
      setNewNotifTitle("");
      setNewNotifMessage("");
      setNewNotifSchedule("Send Now");
      setNewNotifScheduledAt("");
      setShowCompose(false);
      await loadData();
    } else {
      setFeedback({ type: "error", msg: res.error || "Failed to create notification." });
    }
  };

  const handleDeleteNotification = async (id: string, title: string) => {
    if (isReadOnly) return;
    if (!confirm(`Cancel and delete "${title}"?`)) return;

    const res = await deleteNotificationFromDbAction(id);
    if (res.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } else {
      alert(res.error || "Failed to delete notification.");
    }
  };

  const applyTemplate = (tmpl: typeof templates[0]) => {
    setNewNotifTitle(tmpl.title);
    setNewNotifMessage(tmpl.msg);
    setShowCompose(true);
  };

  // Filter scheduled vs sent notifications
  const scheduledList = notifications.filter((n) => n.status === "active" || n.status === "pending");
  const sentList = notifications.filter((n) => n.status === "sent" || n.status === "failed");

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="System"
        highlightedText="Notifications"
        subtitle="Broadcast live platform updates, billing alerts, and content announcements"
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
              You are signed in under the <strong>Viewer</strong> role. Composing new notifications or cancelling scheduled alerts is restricted.
            </p>
          </div>
        </motion.div>
      )}

      {/* Action Bar */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-3">
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
          <span>Refresh</span>
        </button>

        <button
          onClick={() => !isReadOnly && setShowCompose(!showCompose)}
          disabled={isReadOnly}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all duration-200 cursor-pointer ${isReadOnly ? "opacity-50 cursor-not-allowed" : "hover:shadow-md active:scale-[0.97]"}`}
          style={{
            background: isReadOnly
              ? "#94a3b8"
              : showCompose
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

      {/* Feedback banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose form */}
      {showCompose && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-md shadow-slate-200/30 relative z-20"
        >
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-teal-600" />
              <span>Compose Broadcast Notification</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={newNotifTitle}
                  onChange={(e) => setNewNotifTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-800 dark:text-slate-200"
                  placeholder="Notification title..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Message</label>
                <textarea
                  rows={3}
                  value={newNotifMessage}
                  onChange={(e) => setNewNotifMessage(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none text-slate-800 dark:text-slate-200"
                  placeholder="Write your broadcast message..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Type</label>
                  <CustomSelect
                    value={newNotifType}
                    onChange={setNewNotifType}
                    options={[
                      { value: "In-app", label: "In-app" },
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
                      { value: "All Subscribers", label: `All Subscribers (${audienceMetrics.allSubscribers})` },
                      { value: "All Users", label: `All Users (${audienceMetrics.allUsers})` },
                      { value: "Expiring Soon", label: `Expiring Soon (${audienceMetrics.expiringSoon})` },
                      { value: "Monthly Plan", label: `Monthly Plan (${audienceMetrics.monthlyPlan})` },
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Schedule</label>
                  <CustomSelect
                    value={newNotifSchedule}
                    onChange={(v) => {
                      setNewNotifSchedule(v);
                      if (v === "Send Now") setNewNotifScheduledAt("");
                    }}
                    options={[
                      { value: "Send Now", label: "Send Immediately" },
                      { value: "Scheduled", label: "Schedule for Later" },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>
              {newNotifSchedule === "Scheduled" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Send Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newNotifScheduledAt}
                    min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    onChange={(e) => setNewNotifScheduledAt(e.target.value)}
                    className="w-full sm:w-1/3 px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-800 dark:text-slate-200"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isReadOnly || isSubmitting}
                  onClick={handleSendNotification}
                  className={`px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-500 transition-all shadow-sm cursor-pointer ${isReadOnly || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSubmitting ? "Processing..." : "Send Notification"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled Notifications */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/30 overflow-hidden relative"
        >
          <div className="relative z-10">
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Scheduled Notifications</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {scheduledList.length} scheduled
              </span>
            </div>

            {scheduledList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                <p className="font-semibold">No scheduled notifications</p>
                <p className="mt-1 text-[11px]">Use &quot;Create New Notification&quot; to queue up upcoming platform alerts.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {scheduledList.map((n) => (
                  <div
                    key={n.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                      {n.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{n.message}</p>}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{n.type} · {n.target} · {n.scheduled}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge variant={n.status === "active" ? "active" : "pending"} />
                      {!isReadOnly && (
                        <button
                          onClick={() => handleDeleteNotification(n.id, n.title)}
                          title="Cancel and Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Real Audience targets panel */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-md shadow-slate-200/30 relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Audience Targets</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Live subscriber segment counts from database</p>
            <div className="space-y-2">
              {[
                { label: "All Subscribers", count: audienceMetrics.allSubscribers.toLocaleString(), desc: "Active premium accounts" },
                { label: "Expiring Soon", count: audienceMetrics.expiringSoon.toLocaleString(), desc: "Renewal within 7 days" },
                { label: "Monthly Plan", count: audienceMetrics.monthlyPlan.toLocaleString(), desc: "Non-annual subscribers" },
                { label: "All Users", count: audienceMetrics.allUsers.toLocaleString(), desc: "Entire registered base" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex items-center justify-between p-3 bg-white/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-teal-200 dark:hover:border-teal-800 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-all duration-200"
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
                  onClick={() => applyTemplate(t)}
                  className="w-full text-left p-3 bg-white/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-teal-200 dark:hover:border-teal-800 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 cursor-pointer"
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
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/30 overflow-hidden relative"
      >
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-teal-600" />
              <span>Broadcast & Sent History</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {sentList.length} sent
            </span>
          </div>

          {sentList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              <Send className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
              <p className="font-semibold">No sent notifications yet</p>
              <p className="mt-1 text-[11px]">When you send in-app or email broadcasts, delivery history will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Notification</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Type</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Recipients</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Read / Opened</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sentList.map((n) => (
                    <tr
                      key={n.id}
                      className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                        {n.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{n.message}</p>}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Target: {n.target}</p>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">{n.type}</td>
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 font-semibold">{n.sent.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{n.opened.toLocaleString()}</td>
                      <td className="px-4 py-4 text-xs text-slate-400 dark:text-slate-500">{n.date}</td>
                      <td className="px-6 py-4 text-right">
                        {!isReadOnly && (
                          <button
                            onClick={() => handleDeleteNotification(n.id, n.title)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

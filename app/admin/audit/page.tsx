"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

/* ── Feature list that can be assigned ── */
const ALL_FEATURES = [
  { key: "dashboard", label: "Dashboard", desc: "View analytics overview" },
  { key: "questions", label: "Questions", desc: "Create, edit & delete questions" },
  { key: "quizzes", label: "Quizzes", desc: "Manage quiz templates" },
  { key: "content", label: "Medical Content", desc: "Manage medical library articles" },
  { key: "autofill", label: "Autofill Templates", desc: "Create & edit autofill templates" },
  { key: "users", label: "Users", desc: "View & manage user accounts" },
  { key: "notifications", label: "Notifications", desc: "Send system notifications" },
  { key: "billing", label: "Billing", desc: "View revenue & manage subscriptions" },
  { key: "audit", label: "Audit & Security", desc: "View audit logs & manage roles" },
  { key: "settings", label: "Settings", desc: "System-level configuration" },
];

const ALL_FEATURE_KEYS = ALL_FEATURES.map((f) => f.key);

/* ── Role presets ── */
const ROLE_PRESETS: Record<string, string[]> = {
  "Super Admin": [...ALL_FEATURE_KEYS],
  Admin: ["dashboard", "questions", "quizzes", "content", "autofill", "users", "notifications", "billing"],
  Moderator: ["dashboard", "questions", "content"],
  Viewer: ["dashboard"],
};

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  lastLogin: string;
  status: "active" | "inactive";
}

const initialAdmins: AdminUser[] = [
  { id: "1", name: "Siddhant Udavant", email: "admin@gpedge.com", role: "Super Admin", permissions: [...ALL_FEATURE_KEYS], lastLogin: "Just now", status: "active" },
  { id: "2", name: "Arun Mehta", email: "content@gpedge.com", role: "Admin", permissions: ["dashboard", "questions", "quizzes", "content", "autofill", "users", "notifications", "billing"], lastLogin: "2 hours ago", status: "active" },
  { id: "3", name: "Jessica Park", email: "moderator@gpedge.com", role: "Moderator", permissions: ["dashboard", "questions", "content"], lastLogin: "1 day ago", status: "active" },
];

const auditLogs = [
  { timestamp: "28 May 2026, 11:45 PM", admin: "Siddhant Udavant", action: "Published Question #2850 to live bank", category: "Questions", severity: "info" },
  { timestamp: "28 May 2026, 11:30 PM", admin: "Siddhant Udavant", action: "Suspended account — policy violation", category: "Users", severity: "warning" },
  { timestamp: "28 May 2026, 10:15 PM", admin: "Arun Mehta", action: "Bulk imported 142 Cardiology questions", category: "Questions", severity: "info" },
  { timestamp: "28 May 2026, 9:00 PM", admin: "Jessica Park", action: "Approved Question #2853 for review queue", category: "Questions", severity: "info" },
  { timestamp: "28 May 2026, 6:30 PM", admin: "Siddhant Udavant", action: "Published new Respiratory autofill template", category: "Content", severity: "info" },
  { timestamp: "28 May 2026, 4:00 PM", admin: "Arun Mehta", action: "Deleted Question #2839 — duplicate entry", category: "Questions", severity: "warning" },
  { timestamp: "27 May 2026, 11:00 PM", admin: "Siddhant Udavant", action: "Enabled maintenance mode for 30 minutes", category: "System", severity: "warning" },
  { timestamp: "27 May 2026, 8:00 PM", admin: "Jessica Park", action: "Approved refund $24.00 — policy criteria met", category: "Billing", severity: "info" },
];

const softDeleted = [
  { item: "Question #2839", type: "Question", deletedBy: "Arun Mehta", date: "28 May 2026", reason: "Duplicate" },
  { item: "GORD Template v1", type: "Autofill", deletedBy: "Jessica Park", date: "25 May 2026", reason: "Outdated" },
  { item: "Test Account #9999", type: "User", deletedBy: "Siddhant Udavant", date: "20 May 2026", reason: "Test data cleanup" },
];

const severityColors: Record<string, string> = {
  info: "text-teal-600 bg-teal-50",
  warning: "text-amber-600 bg-amber-50",
  critical: "text-red-600 bg-red-50",
};

/* ═══════════════════════════════════════════════════════════════ */

export default function AuditPage() {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [currentAdminId, setCurrentAdminId] = useState("1");
  const currentAdmin = admins.find((a) => a.id === currentAdminId) || admins[0];
  const isSuperAdmin = currentAdmin?.role === "Super Admin";

  const [logFilter, setLogFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [preventBulk, setPreventBulk] = useState(true);
  const [archiveInstead, setArchiveInstead] = useState(false);

  /* Modal state */
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Lock body scroll when drawer or modal is open to prevent background scrolling lag
  useEffect(() => {
    if (editingAdmin || showAddModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [editingAdmin, showAddModal]);

  /* Edit form state */
  const [editRole, setEditRole] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  /* Add form state */
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("Viewer");
  const [addPermissions, setAddPermissions] = useState<string[]>(["dashboard"]);

  const filteredLogs = logFilter === "all" ? auditLogs : auditLogs.filter((l) => l.category.toLowerCase() === logFilter);

  /* ── Handlers ── */
  function openEdit(admin: AdminUser) {
    setEditingAdmin(admin);
    setEditRole(admin.role);
    setEditPermissions([...admin.permissions]);
  }

  function saveEdit() {
    if (!editingAdmin) return;
    setAdmins((prev) =>
      prev.map((a) =>
        a.id === editingAdmin.id
          ? { ...a, role: editRole, permissions: [...editPermissions] }
          : a
      )
    );
    setEditingAdmin(null);
  }

  function openAdd() {
    setAddName("");
    setAddEmail("");
    setAddRole("Viewer");
    setAddPermissions(["dashboard"]);
    setShowAddModal(true);
  }

  function saveAdd() {
    if (!addName.trim() || !addEmail.trim()) return;
    const newAdmin: AdminUser = {
      id: String(Date.now()),
      name: addName.trim(),
      email: addEmail.trim(),
      role: addRole,
      permissions: [...addPermissions],
      lastLogin: "Never",
      status: "inactive",
    };
    setAdmins((prev) => [...prev, newAdmin]);
    setShowAddModal(false);
  }

  function removeAdmin(id: string) {
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  }

  function togglePermission(perms: string[], key: string, setter: (v: string[]) => void) {
    setter(perms.includes(key) ? perms.filter((p) => p !== key) : [...perms, key]);
  }

  function applyRolePreset(role: string, setter: (v: string[]) => void, roleSetter: (v: string) => void) {
    roleSetter(role);
    if (ROLE_PRESETS[role]) setter([...ROLE_PRESETS[role]]);
  }

  /* helper to display permission summary */
  function permSummary(perms: string[]): string {
    if (perms.length === ALL_FEATURE_KEYS.length) return "Full Access";
    if (perms.length === 0) return "No Access";
    const labels = perms.map((k) => ALL_FEATURES.find((f) => f.key === k)?.label ?? k);
    if (labels.length <= 3) return labels.join(", ");
    return `${labels.slice(0, 3).join(", ")} +${labels.length - 3} more`;
  }

  /* ── Render ── */
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Audit &"
        highlightedText="Security"
        subtitle="Admin roles, activity logs, and delete protection"
        variants={itemVariants}
        actions={
          <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Logged in as:</span>
            <CustomSelect
              value={currentAdminId}
              onChange={setCurrentAdminId}
              options={admins.map((a) => ({ value: a.id, label: `${a.name} (${a.role})` }))}
              className="w-56"
            />
          </div>
        }
      />

      {/* ═══ Admin Roles & Permissions ═══ */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Admin Roles & Permissions</h3>
            <button
              onClick={isSuperAdmin ? openAdd : undefined}
              disabled={!isSuperAdmin}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all duration-200 ${
                isSuperAdmin
                  ? "hover:shadow-md active:scale-[0.97] cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
              style={{ background: isSuperAdmin ? "linear-gradient(135deg, #0f766e, #115e59)" : "#94a3b8" }}
              title={isSuperAdmin ? "Add new administrator" : "Only Super Admins can add team members"}
            >
              {!isSuperAdmin ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              )}
              Add Admin
            </button>
          </div>

          {!isSuperAdmin && (
            <div className="mx-6 mt-4 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">Permissions Locked</p>
                <p className="mt-0.5 opacity-90 leading-normal">You are viewing as <span className="font-semibold">{currentAdmin.name} ({currentAdmin.role})</span>. Only Super Admins are permitted to add team members, modify roles, assign feature permissions, or adjust system security configurations.</p>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200/40">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Admin</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Permissions</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Last Login</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${a.status === "active" ? "bg-gradient-to-br from-teal-400 to-emerald-500" : "bg-gradient-to-br from-slate-300 to-slate-400"}`}>{a.name.split(" ").map((n) => n[0]).join("")}</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                          <p className="text-xs text-slate-400">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50/70 text-teal-900 border border-teal-300/80 dark:bg-teal-950/45 dark:text-teal-300 dark:border-teal-900/60">{a.role}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs text-slate-500 max-w-[240px]">{permSummary(a.permissions)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className="text-sm text-slate-500">{a.lastLogin}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => isSuperAdmin && openEdit(a)}
                          disabled={!isSuperAdmin}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            isSuperAdmin
                              ? "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100 cursor-pointer"
                              : "text-slate-400 bg-slate-50 border-slate-100 cursor-not-allowed opacity-60"
                          }`}
                          title={isSuperAdmin ? "Modify user role & permissions" : "Only Super Admins can modify permissions"}
                        >
                          Edit Role
                        </button>
                        {a.role !== "Super Admin" && (
                          <button
                            onClick={() => isSuperAdmin && removeAdmin(a.id)}
                            disabled={!isSuperAdmin}
                            className={`p-1.5 rounded-lg transition-all ${
                              isSuperAdmin
                                ? "text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                                : "text-slate-300 cursor-not-allowed opacity-50"
                            }`}
                            title={isSuperAdmin ? "Remove this admin" : "Only Super Admins can remove team members"}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ═══ Edit Role Modal ═══ */}
      <AnimatePresence>
        {editingAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => setEditingAdmin(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 w-full max-w-xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Role & Permissions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{editingAdmin.name} · {editingAdmin.email}</p>
                </div>
                <button onClick={() => setEditingAdmin(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Role selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assign Role</label>
                  <CustomSelect
                    value={editRole}
                    onChange={(v) => applyRolePreset(v, setEditPermissions, setEditRole)}
                    options={Object.keys(ROLE_PRESETS).map((r) => ({ value: r, label: r }))}
                    className="w-full"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">Selecting a role will apply its default permissions. You can customise below.</p>
                </div>

                {/* Feature permissions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-600">Feature Permissions</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditPermissions([...ALL_FEATURE_KEYS])}
                        className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                      >Select All</button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => setEditPermissions([])}
                        className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                      >Clear All</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_FEATURES.map((feature) => {
                      const checked = editPermissions.includes(feature.key);
                      return (
                        <button
                          key={feature.key}
                          type="button"
                          onClick={() => togglePermission(editPermissions, feature.key, setEditPermissions)}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                            checked
                              ? "bg-teal-50/60 border-teal-200 shadow-sm"
                              : "bg-slate-50/40 border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                            checked ? "bg-teal-500 border-teal-500" : "border-slate-300 bg-white"
                          }`}>
                            {checked && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${checked ? "text-teal-700" : "text-slate-600"}`}>{feature.label}</p>
                            <p className="text-[11px] text-slate-400 leading-tight">{feature.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">{editPermissions.length} of {ALL_FEATURE_KEYS.length} features enabled</p>
                <div className="flex gap-3">
                  <button onClick={() => setEditingAdmin(null)} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                  <button
                    onClick={saveEdit}
                    className="px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]"
                    style={{ background: "linear-gradient(135deg, #0f766e, #115e59)" }}
                  >Save Changes</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Add Admin Modal ═══ */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 w-full max-w-xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Admin</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Invite a team member and assign their role</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                      placeholder="jane@gpedge.com"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
                  <CustomSelect
                    value={addRole}
                    onChange={(v) => applyRolePreset(v, setAddPermissions, setAddRole)}
                    options={Object.keys(ROLE_PRESETS).map((r) => ({ value: r, label: r }))}
                    className="w-full"
                  />
                </div>

                {/* Feature permissions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-600">Feature Permissions</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAddPermissions([...ALL_FEATURE_KEYS])}
                        className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                      >Select All</button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => setAddPermissions([])}
                        className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                      >Clear All</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_FEATURES.map((feature) => {
                      const checked = addPermissions.includes(feature.key);
                      return (
                        <button
                          key={feature.key}
                          type="button"
                          onClick={() => togglePermission(addPermissions, feature.key, setAddPermissions)}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                            checked
                              ? "bg-teal-50/60 border-teal-200 shadow-sm"
                              : "bg-slate-50/40 border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                            checked ? "bg-teal-500 border-teal-500" : "border-slate-300 bg-white"
                          }`}>
                            {checked && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${checked ? "text-teal-700" : "text-slate-600"}`}>{feature.label}</p>
                            <p className="text-[11px] text-slate-400 leading-tight">{feature.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">{addPermissions.length} of {ALL_FEATURE_KEYS.length} features enabled</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                  <button
                    onClick={saveAdd}
                    disabled={!addName.trim() || !addEmail.trim()}
                    className="px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
                    style={{ background: "linear-gradient(135deg, #0f766e, #115e59)" }}
                  >Add Admin</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Audit Log ═══ */}
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
                className="px-6 py-3.5 flex items-start gap-4 hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group cursor-pointer"
              >
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 bg-teal-50/70 text-teal-900 border border-teal-300/80 dark:bg-teal-950/45 dark:text-teal-300 dark:border-teal-900/60">{log.category}</span>
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
                  className="px-6 py-4 flex items-center justify-between hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group cursor-pointer"
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
                <div key={toggle.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{toggle.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{toggle.desc}</p>
                  </div>
                  <button
                    onClick={() => isSuperAdmin && toggle.set(!toggle.value)}
                    disabled={!isSuperAdmin}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      toggle.value ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-800"
                    } ${!isSuperAdmin ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    title={isSuperAdmin ? "Toggle protection setting" : "Only Super Admins can toggle settings"}
                  >
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


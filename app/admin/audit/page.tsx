"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import { useAdminRole } from "@/hooks/useAdminRole";
import { addUserNotification } from "@/utils/notifications";
import {
  themeBorder,
  themeBtnGhost,
  themeBtnPrimary,
  themeLabel,
  themeInput,
  themePanel,
} from "@/lib/adminTheme";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

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
  role: "Super Admin" | "Admin" | "Moderator" | "Viewer";
  permissions: string[];
  lastLogin: string;
  status: "active" | "inactive";
  username: string;
  forgotPasswordEnabled: boolean;
  oauthEnabled: boolean;
  mfaEnabled: boolean;
  mustResetPassword?: boolean;
}

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

export default function AuditPage() {
  const { currentAdmin: loggedInAdmin, isReadOnly, isSuperAdmin } = useAdminRole();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState("1");

  const [activeTab, setActiveTab] = useState<"accounts" | "logs" | "deleted" | "policies">("accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [logFilter, setLogFilter] = useState("all");

  // Policy configurations states
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [lockoutAttempts, setLockoutAttempts] = useState(5);
  const [mfaEnforcedGlobal, setMfaEnforcedGlobal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [preventBulk, setPreventBulk] = useState(true);
  const [archiveInstead, setArchiveInstead] = useState(false);

  /* Modal state */
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  /* Edit form state */
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editRole, setEditRole] = useState<"Super Admin" | "Admin" | "Moderator" | "Viewer">("Admin");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editForgotPassword, setEditForgotPassword] = useState(true);
  const [editOauth, setEditOauth] = useState(false);
  const [editMfa, setEditMfa] = useState(false);

  /* Add form state */
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addRole, setAddRole] = useState<"Super Admin" | "Admin" | "Moderator" | "Viewer">("Admin");
  const [addPermissions, setAddPermissions] = useState<string[]>([]);
  const [addForgotPassword, setAddForgotPassword] = useState(true);
  const [addOauth, setAddOauth] = useState(false);
  const [addMfa, setAddMfa] = useState(false);

  const syncAdminsFromStorage = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gpedge_admin_credentials_list");
      if (stored) {
        try {
          const credsList = JSON.parse(stored);
          const mappedAdmins = credsList.map((u: any) => {
            let permissions = u.permissions || [];
            if (permissions.length === 0) {
              if (u.role === "Super Admin" || u.role === "Viewer") {
                permissions = ["dashboard", "questions", "quizzes", "content", "autofill", "users", "notifications", "billing", "audit", "settings", "search"];
              } else if (u.role === "Admin") {
                permissions = ["dashboard", "questions", "quizzes", "content", "autofill", "users", "notifications", "billing"];
              } else if (u.role === "Moderator") {
                permissions = ["dashboard", "questions", "content"];
              }
            }
            return {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              permissions,
              lastLogin: u.id === "1" ? "Just now" : u.id === "2" ? "2 hours ago" : u.id === "3" ? "1 day ago" : "Never",
              status: u.status || "active",
              username: u.username || "",
              forgotPasswordEnabled: u.forgotPasswordEnabled ?? true,
              oauthEnabled: u.oauthEnabled ?? false,
              mfaEnabled: u.mfaEnabled ?? false,
              mustResetPassword: u.mustResetPassword ?? false,
            };
          });
          setAdmins(mappedAdmins);
        } catch (e) {
          // ignore
        }
      }
    }
  };

  useEffect(() => {
    syncAdminsFromStorage();

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gpedge_active_admin_id") || "1";
      setCurrentAdminId(stored);

      // Load Security Policies
      const storedPolicies = localStorage.getItem("gpedge_admin_security_policies");
      if (storedPolicies) {
        try {
          const parsed = JSON.parse(storedPolicies);
          if (parsed.passwordMinLength) setPasswordMinLength(parsed.passwordMinLength);
          if (parsed.lockoutAttempts) setLockoutAttempts(parsed.lockoutAttempts);
          if (parsed.mfaEnforcedGlobal !== undefined) setMfaEnforcedGlobal(parsed.mfaEnforcedGlobal);
          if (parsed.confirmDelete !== undefined) setConfirmDelete(parsed.confirmDelete);
          if (parsed.preventBulk !== undefined) setPreventBulk(parsed.preventBulk);
          if (parsed.archiveInstead !== undefined) setArchiveInstead(parsed.archiveInstead);
        } catch (e) {
          // ignore
        }
      }

      const handleAdminChanged = () => {
        const val = localStorage.getItem("gpedge_active_admin_id") || "1";
        setCurrentAdminId(val);
        syncAdminsFromStorage();
      };

      window.addEventListener("gpedge_admin_changed", handleAdminChanged);
      return () => {
        window.removeEventListener("gpedge_admin_changed", handleAdminChanged);
      };
    }
  }, []);

  const currentAdmin = admins.find((a) => a.id === currentAdminId) || admins[0];

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

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logFilter === "all" ? auditLogs : auditLogs.filter((l) => l.category.toLowerCase() === logFilter);

  /* ── Handlers ── */
  function openEdit(admin: AdminUser) {
    setEditingAdmin(admin);
    setEditRole(admin.role);
    setEditPermissions([...admin.permissions]);
    setEditName(admin.name);
    setEditEmail(admin.email);
    setEditUsername(admin.username);
    setEditPassword("");
    setShowEditPassword(false);
    setEditForgotPassword(admin.forgotPasswordEnabled);
    setEditOauth(admin.oauthEnabled);
    setEditMfa(admin.mfaEnabled);
  }

  function saveEdit() {
    if (!editingAdmin) return;
    if (isReadOnly) return;
    if (!editName.trim() || !editEmail.trim() || !editUsername.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    if (typeof window !== "undefined") {
      const storedCreds = localStorage.getItem("gpedge_admin_credentials_list");
      const credsList = storedCreds ? JSON.parse(storedCreds) : [];
      const updatedCreds = credsList.map((u: any) => {
        if (u.id === editingAdmin.id) {
          const isTargetSuperAdmin = editRole === "Super Admin";
          return {
            ...u,
            name: editName.trim(),
            email: editEmail.trim(),
            username: editUsername.trim(),
            role: editRole,
            permissions: [...editPermissions],
            lastChanged: "Just now",
            ...(editPassword.trim() ? { password: editPassword } : {}),
            forgotPasswordEnabled: isTargetSuperAdmin ? editForgotPassword : true,
            oauthEnabled: isTargetSuperAdmin ? editOauth : false,
            mfaEnabled: isTargetSuperAdmin ? editMfa : false,
          };
        }
        return u;
      });
      localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(updatedCreds));
      window.dispatchEvent(new Event("gpedge_admin_changed"));
      addUserNotification("Admin Updated", `Successfully updated details for "${editName}".`, 1, "custom");
    }

    setEditingAdmin(null);
    syncAdminsFromStorage();
  }

  function openAdd() {
    setAddName("");
    setAddEmail("");
    setAddUsername("");
    setAddPassword("");
    setAddRole("Admin");
    setAddPermissions(["dashboard", "questions", "quizzes", "content", "autofill", "users", "notifications", "billing"]);
    setAddForgotPassword(true);
    setAddOauth(false);
    setAddMfa(false);
    setShowAddPassword(false);
    setShowAddModal(true);
  }

  function saveAdd() {
    if (isReadOnly) return;
    if (!addName.trim() || !addEmail.trim() || !addUsername.trim() || !addPassword.trim()) {
      alert("Please fill in all required fields.");
      return;
    }
    
    if (typeof window !== "undefined") {
      const storedCreds = localStorage.getItem("gpedge_admin_credentials_list");
      const credsList = storedCreds ? JSON.parse(storedCreds) : [];
      const isTargetSuperAdmin = addRole === "Super Admin";
      const newCred = {
        id: String(Date.now()),
        name: addName.trim(),
        email: addEmail.trim(),
        username: addUsername.trim(),
        password: addPassword,
        role: addRole,
        permissions: [...addPermissions],
        lastChanged: "Just now",
        forgotPasswordEnabled: isTargetSuperAdmin ? addForgotPassword : true,
        oauthEnabled: isTargetSuperAdmin ? addOauth : false,
        mfaEnabled: isTargetSuperAdmin ? addMfa : false,
        mustResetPassword: true, // Force password reset on first login
        status: "active",
      };
      localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify([...credsList, newCred]));
      window.dispatchEvent(new Event("gpedge_admin_changed"));
      addUserNotification("Admin User Added", `Successfully created credentials for "${addName}" (${addRole}).`, 1, "custom");
    }

    setShowAddModal(false);
    syncAdminsFromStorage();
  }

  function removeAdmin(id: string, name: string) {
    if (isReadOnly) return;
    if (id === "1") {
      alert("Cannot delete primary Super Admin account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete administrator "${name}"?`)) return;

    if (typeof window !== "undefined") {
      const storedCreds = localStorage.getItem("gpedge_admin_credentials_list");
      const credsList = storedCreds ? JSON.parse(storedCreds) : [];
      const updatedCreds = credsList.filter((u: any) => u.id !== id);
      localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(updatedCreds));
      window.dispatchEvent(new Event("gpedge_admin_changed"));
      addUserNotification("Admin Deleted", `Successfully removed credentials for "${name}".`, 1, "custom");
    }
    syncAdminsFromStorage();
  }

  function togglePermission(perms: string[], key: string, setter: (v: string[]) => void) {
    setter(perms.includes(key) ? perms.filter((p) => p !== key) : [...perms, key]);
  }

  function applyRolePreset(role: string, setter: (v: string[]) => void, roleSetter: (v: any) => void, forgotSetter?: (v: boolean) => void, oauthSetter?: (v: boolean) => void, mfaSetter?: (v: boolean) => void) {
    roleSetter(role);
    if (ROLE_PRESETS[role]) setter([...ROLE_PRESETS[role]]);

    if (role !== "Super Admin") {
      if (forgotSetter) forgotSetter(true);
      if (oauthSetter) oauthSetter(false);
      if (mfaSetter) mfaSetter(false);
    }
  }

  function savePoliciesForm() {
    if (isReadOnly) return;
    if (typeof window !== "undefined") {
      const policies = {
        passwordMinLength,
        lockoutAttempts,
        mfaEnforcedGlobal,
        confirmDelete,
        preventBulk,
        archiveInstead,
      };
      localStorage.setItem("gpedge_admin_security_policies", JSON.stringify(policies));
      addUserNotification("Policies Saved", "Security & validation policies updated successfully.", 1, "custom");
    }
  }

  const handleTogglePolicy = (key: string, value: boolean) => {
    if (isReadOnly || !isSuperAdmin) return;
    
    let nextConfirmDelete = confirmDelete;
    let nextPreventBulk = preventBulk;
    let nextArchiveInstead = archiveInstead;
    let nextMfaEnforcedGlobal = mfaEnforcedGlobal;

    if (key === "confirmDelete") {
      setConfirmDelete(value);
      nextConfirmDelete = value;
    } else if (key === "preventBulk") {
      setPreventBulk(value);
      nextPreventBulk = value;
    } else if (key === "archiveInstead") {
      setArchiveInstead(value);
      nextArchiveInstead = value;
    } else if (key === "mfaEnforcedGlobal") {
      setMfaEnforcedGlobal(value);
      nextMfaEnforcedGlobal = value;
    }

    if (typeof window !== "undefined") {
      const policies = {
        passwordMinLength,
        lockoutAttempts,
        mfaEnforcedGlobal: nextMfaEnforcedGlobal,
        confirmDelete: nextConfirmDelete,
        preventBulk: nextPreventBulk,
        archiveInstead: nextArchiveInstead,
      };
      localStorage.setItem("gpedge_admin_security_policies", JSON.stringify(policies));
    }
  };

  /* helper to display permission summary */
  function permSummary(perms: string[]): string {
    if (perms.length === ALL_FEATURE_KEYS.length) return "Full Access";
    if (perms.length === 0) return "No Access";
    const labels = perms.map((k) => ALL_FEATURES.find((f) => f.key === k)?.label ?? k);
    if (labels.length <= 3) return labels.join(", ");
    return `${labels.slice(0, 3).join(", ")} +${labels.length - 3} more`;
  }

  // Lock role selections strictly to Admin only (not Super Admin, Moderator, or Viewer)
  const addRoleOptions = [{ value: "Admin", label: "Admin" }];
  const editRoleOptions = editingAdmin?.role === "Super Admin"
    ? [{ value: "Super Admin", label: "Super Admin" }]
    : [{ value: "Admin", label: "Admin" }];

  /* ── Render ── */
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 font-sans">
      <AdminPageHeader
        title="Audit &"
        highlightedText="Security"
        subtitle="Manage administrator access credentials, security policy parameters, activity logs, and delete protection."
        variants={itemVariants}
        actions={
          <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md rounded-xl px-3.5 py-2 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-slate-450 dark:text-slate-500 uppercase tracking-wider text-[9px] font-bold">Logged in as:</span>
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {currentAdmin?.name} ({currentAdmin?.role})
            </span>
          </div>
        }
      />

      {isReadOnly && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 rounded-2xl flex gap-3 text-xs text-blue-850 dark:text-blue-300 leading-relaxed items-center shadow-sm"
        >
          <Lucide.Info className="w-5 h-5 shrink-0 text-blue-600" />
          <div>
            <p className="font-bold">View-Only Mode Enabled</p>
            <p className="mt-0.5 opacity-90">
              You are signed in under the <strong>Viewer</strong> role. You have full read-only access to all sections and data, but editing settings, adding users, or modifying roles is restricted.
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabs Menu */}
      <motion.div variants={itemVariants} className="flex border-b border-slate-200 dark:border-slate-850 overflow-x-auto select-none">
        {[
          { id: "accounts", label: "Administrator Accounts", icon: <Lucide.Users className="w-4 h-4" /> },
          { id: "logs", label: "Activity logs", icon: <Lucide.Activity className="w-4 h-4" /> },
          { id: "deleted", label: "Deleted Items", icon: <Lucide.Trash2 className="w-4 h-4" /> },
          { id: "policies", label: "Security & Delete Policies", icon: <Lucide.ShieldCheck className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 text-sm font-bold border-b-2 bg-transparent border-none cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-teal-700 text-teal-700 dark:text-teal-400"
                : "border-b-transparent text-slate-450 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Administrator Accounts Tab */}
      {activeTab === "accounts" && (
        <div className="space-y-6">
          <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-slate-800/80 shadow-md shadow-slate-200/10 dark:shadow-slate-950/40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-transparent via-transparent to-teal-50/2 dark:to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="px-6 py-4 border-b border-slate-200/40 flex items-center justify-between gap-4 flex-wrap">
                <div className="relative w-full max-w-xs">
                  <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/60 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-750/10 focus:border-teal-700/50 dark:text-slate-100 transition-all"
                  />
                </div>
                <button
                  onClick={isSuperAdmin ? openAdd : undefined}
                  disabled={!isSuperAdmin || isReadOnly}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all duration-200 ${
                    isSuperAdmin && !isReadOnly
                      ? "hover:shadow-md active:scale-[0.97] cursor-pointer hover:opacity-95"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ background: isSuperAdmin && !isReadOnly ? "linear-gradient(135deg, #0f766e, #115e59)" : "#94a3b8" }}
                  title={isSuperAdmin ? "Add new administrator" : "Only Super Admins can add team members"}
                >
                  <Lucide.Plus className="w-3.5 h-3.5" />
                  Add Admin
                </button>
              </div>

              {!isSuperAdmin && (
                <div className="mx-6 mt-4 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                  <Lucide.Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-200">Permissions Locked</p>
                    <p className="mt-0.5 opacity-90 leading-normal">You are viewing as <span className="font-semibold">{loggedInAdmin?.name} ({loggedInAdmin?.role})</span>. Only Super Administrators are permitted to add team members, modify roles, assign feature permissions, or adjust system security configurations.</p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200/40 dark:border-slate-800 text-slate-500">
                      <th className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-3">Admin</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3">Role</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3">Security Features</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3">Permissions</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3">Last Active</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAdmins.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${a.status === "active" ? "bg-gradient-to-br from-teal-400 to-emerald-500" : "bg-gradient-to-br from-slate-300 to-slate-400"}`}>
                              {a.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">{a.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{a.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50/70 text-teal-900 border border-teal-300/80 dark:bg-teal-950/45 dark:text-teal-300 dark:border-teal-900/60">
                            {a.role}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-1.5 select-none">
                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded" title="Forgot Password Recovery Route">
                              <Lucide.Key className="w-2.5 h-2.5" />
                              Pass
                            </span>

                            {a.mustResetPassword && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200/50" title="Administrator has not completed first login password reset">
                                Reset Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-slate-500 max-w-[200px] truncate" title={a.permissions.join(", ")}>{permSummary(a.permissions)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                            <span className="text-xs text-slate-500">{a.lastLogin}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => isSuperAdmin && openEdit(a)}
                              disabled={!isSuperAdmin || isReadOnly}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                isSuperAdmin && !isReadOnly
                                  ? "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100 cursor-pointer"
                                  : "text-slate-400 bg-slate-50 border-slate-100 cursor-not-allowed opacity-60"
                              }`}
                              title={isSuperAdmin ? "Modify user details & permissions" : "Only Super Admins can modify accounts"}
                            >
                              Edit details
                            </button>
                            {a.id !== "1" && (
                              <button
                                onClick={() => isSuperAdmin && removeAdmin(a.id, a.name)}
                                disabled={!isSuperAdmin || isReadOnly}
                                className={`p-1.5 rounded-lg transition-all ${
                                  isSuperAdmin && !isReadOnly
                                    ? "text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                                    : "text-slate-300 cursor-not-allowed opacity-50"
                                }`}
                                title={isSuperAdmin ? "Remove this admin" : "Only Super Admins can remove team members"}
                              >
                                <Lucide.Trash className="w-4 h-4" />
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
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === "logs" && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-slate-800/80 shadow-md shadow-slate-200/10 dark:shadow-slate-950/40 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-transparent via-transparent to-teal-50/2 dark:to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="px-6 py-4 border-b border-slate-200/40 flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Audit Logs Trail</h3>
              <div className="flex gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg p-1">
                {["all", "users", "questions", "billing", "system"].map((f) => (
                  <button key={f} onClick={() => setLogFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all border-none bg-transparent cursor-pointer ${logFilter === f ? "bg-white dark:bg-slate-850 text-teal-700 dark:text-teal-400 shadow-sm" : "text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-350"}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto">
              {filteredLogs.map((log, i) => (
                <div
                  key={i}
                  className="px-6 py-3.5 flex items-start gap-4 hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group cursor-pointer"
                >
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-0.5 bg-teal-50/70 text-teal-850 border border-teal-300/80 dark:bg-teal-950/45 dark:text-teal-400 dark:border-teal-900/60">{log.category}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{log.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5">by {log.admin} · {log.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Deleted Items Tab */}
      {activeTab === "deleted" && (
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-slate-800/80 shadow-md shadow-slate-200/10 dark:shadow-slate-950/40 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-transparent via-transparent to-teal-50/2 dark:to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="px-6 py-4 border-b border-slate-200/40"><h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Soft-Deleted Items</h3></div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {softDeleted.map((d, i) => (
                <div
                  key={i}
                  className="px-6 py-4 flex items-center justify-between hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-850 dark:text-slate-200">{d.item}</p>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">{d.type} · by {d.deletedBy} · {d.date} · {d.reason}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <button className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-250 rounded-lg hover:bg-teal-100 transition-all border-none cursor-pointer">Restore</button>
                    <button className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all border-none cursor-pointer">Permanent Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Security & Delete Policies Tab */}
      {activeTab === "policies" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            {/* Integrity Settings */}
            <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-slate-800/80 p-6 shadow-md shadow-slate-200/10 dark:shadow-slate-950/40 relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Credential Integrity Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Minimum Password Length</label>
                  <input
                    type="number"
                    value={passwordMinLength}
                    disabled={isReadOnly || !isSuperAdmin}
                    onChange={(e) => setPasswordMinLength(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                    min={8}
                    max={32}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Account Lockout Threshold</label>
                  <input
                    type="number"
                    value={lockoutAttempts}
                    disabled={isReadOnly || !isSuperAdmin}
                    onChange={(e) => setLockoutAttempts(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                    min={3}
                    max={10}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Maximum failures allowed before account lockout (Default 5)</p>
                </div>



                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={savePoliciesForm}
                    disabled={isReadOnly || !isSuperAdmin}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer ${themeBtnPrimary} disabled:opacity-50`}
                  >
                    Save Policy Config
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            {/* Delete Protection Policies */}
            <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-slate-800/80 p-6 shadow-md shadow-slate-200/10 dark:shadow-slate-950/40 relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Delete Protection Settings</h3>
              <div className="space-y-4">
                {[
                  { key: "confirmDelete", label: "Require confirmation dialog", desc: "Show prompt verification before any removal action", value: confirmDelete },
                  { key: "preventBulk", label: "Prevent bulk delete actions", desc: "Forbid deleting more than 5 elements concurrently", value: preventBulk },
                  { key: "archiveInstead", label: "Archive instead of hard delete", desc: "Soft-delete resources by default to recover them later", value: archiveInstead },
                ].map((toggle) => (
                  <div key={toggle.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100/70 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{toggle.label}</p>
                      <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">{toggle.desc}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePolicy(toggle.key, !toggle.value)}
                      disabled={isReadOnly || !isSuperAdmin}
                      className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0 ${
                        toggle.value ? "bg-[#34C759]" : "bg-[#e9e9eb] dark:bg-slate-950/60"
                      } ${(isReadOnly || !isSuperAdmin) ? "opacity-50 cursor-not-allowed" : "cursor-pointer border-none"}`}
                    >
                      <motion.div
                        animate={{ x: toggle.value ? 20 : 0 }}
                        className="absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full shadow-md bg-white dark:bg-slate-900"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>


        </div>
      )}

      {/* ═══ Edit Admin Modal ═══ */}
      <AnimatePresence>
        {editingAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 pointer-events-auto"
            onClick={() => setEditingAdmin(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/80 w-full max-w-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-150">Edit Administrator Account</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Modify role permissions and credential parameters</p>
                </div>
                <button onClick={() => setEditingAdmin(null)} className="p-1.5 border-none bg-transparent rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
                  <Lucide.X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all ${themeInput}`}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all ${themeInput}`}
                      placeholder="jane@gpedge.com"
                    />
                  </div>
                </div>

                {/* Username & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all ${themeInput}`}
                      placeholder="e.g. jane_smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Password (leave blank to keep current)</label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? "text" : "password"}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className={`w-full pl-4 pr-10 py-2.5 text-sm rounded-xl transition-all ${themeInput}`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 border-none bg-transparent cursor-pointer flex items-center justify-center p-1 rounded-lg"
                      >
                        {showEditPassword ? <Lucide.EyeOff className="w-4 h-4" /> : <Lucide.Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Assign Role</label>
                  <CustomSelect
                    value={editRole}
                    onChange={(v) => applyRolePreset(v, setEditPermissions, setEditRole as any, setEditForgotPassword, setEditOauth, setEditMfa)}
                    options={editRoleOptions}
                    className="w-full"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Note: Role parameters lock to credential validation specifications.</p>
                </div>

                {/* Recovery Route / SSO settings */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Security Validation Rules (Role-based)</span>
                  
                  {editRole !== "Super Admin" ? (
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/35 dark:border-amber-900/20 rounded-xl space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex gap-2 items-start text-[10px] text-amber-800 dark:text-amber-350">
                        <Lucide.Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Credential Restrictions Apply</p>
                          <p className="mt-0.5">Admin, Moderator, and Viewer roles are restricted to username/password login recovery. OAuth, SAML SSO, and physical authenticators are disabled.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <Lucide.Check className="w-3.5 h-3.5 text-teal-650" />
                        <span>Username & Password Authentication (Enforced)</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <div className="flex items-center gap-2">
                          <Lucide.Check className="w-3.5 h-3.5 text-teal-650" />
                          <span>Forgot Password Email Recovery Option</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">Enforced</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-655 dark:text-slate-350">Allow Forgot Password email recovery</label>
                        <button
                          type="button"
                          onClick={() => setEditForgotPassword(!editForgotPassword)}
                          className={`w-8 h-5 rounded-full relative transition-all border-none cursor-pointer ${
                            editForgotPassword ? "bg-teal-700" : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        >
                          <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-all ${editForgotPassword ? "left-4" : "left-0.5"}`} />
                        </button>
                      </div>

                    </div>
                  )}
                </div>

                {/* Feature permissions checkbox list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Feature Permissions</label>
                    <div className="flex gap-2">
                      <button onClick={() => setEditPermissions([...ALL_FEATURE_KEYS])} className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 transition-colors border-none bg-transparent cursor-pointer">Select All</button>
                      <span className="text-slate-300">·</span>
                      <button onClick={() => setEditPermissions([])} className="text-[10px] font-semibold text-slate-450 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer">Clear All</button>
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
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                            checked
                              ? "bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/40 shadow-sm"
                              : "bg-slate-50/40 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                            checked ? "bg-teal-500 border-teal-500" : "border-slate-300 bg-white"
                          }`}>
                            {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${checked ? "text-teal-700" : "text-slate-600"}`}>{feature.label}</p>
                            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{feature.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-400">{editPermissions.length} of {ALL_FEATURE_KEYS.length} features enabled</p>
                <div className="flex gap-3">
                  <button onClick={() => setEditingAdmin(null)} className={`px-4 py-2 text-xs font-semibold ${themeBtnGhost}`}>Cancel</button>
                  <button onClick={saveEdit} className={`px-5 py-2.5 text-xs font-bold ${themeBtnPrimary}`}>Save Changes</button>
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 pointer-events-auto"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/80 w-full max-w-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-150">Add New Administrator</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Invite a team member and assign login access credentials</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 border-none bg-transparent rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
                  <Lucide.X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all ${themeInput}`}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all ${themeInput}`}
                      placeholder="jane@gpedge.com"
                    />
                  </div>
                </div>

                {/* Username & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
                    <input
                      type="text"
                      required
                      value={addUsername}
                      onChange={(e) => setAddUsername(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all ${themeInput}`}
                      placeholder="e.g. jane_smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input
                        type={showAddPassword ? "text" : "password"}
                        required
                        value={addPassword}
                        onChange={(e) => setAddPassword(e.target.value)}
                        className={`w-full pl-4 pr-10 py-2.5 text-sm rounded-xl transition-all ${themeInput}`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 border-none bg-transparent cursor-pointer flex items-center justify-center p-1 rounded-lg"
                      >
                        {showAddPassword ? <Lucide.EyeOff className="w-4 h-4" /> : <Lucide.Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
                  <CustomSelect
                    value={addRole}
                    onChange={(v) => applyRolePreset(v, setAddPermissions, setAddRole as any, setAddForgotPassword, setAddOauth, setAddMfa)}
                    options={addRoleOptions}
                    className="w-full"
                  />
                </div>

                {/* Validation rules matrix visual description */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Security Validation Rules (Role-based)</span>
                  
                  {addRole !== "Super Admin" ? (
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/35 dark:border-amber-900/20 rounded-xl space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex gap-2 items-start text-[10px] text-amber-800 dark:text-amber-350">
                        <Lucide.Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Credential Restrictions Apply</p>
                          <p className="mt-0.5">Admin, Moderator, and Viewer roles are restricted to username/password login recovery. OAuth, SAML SSO, and physical authenticators are disabled.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <Lucide.Check className="w-3.5 h-3.5 text-teal-650" />
                        <span>Username & Password Authentication (Enforced)</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <div className="flex items-center gap-2">
                          <Lucide.Check className="w-3.5 h-3.5 text-teal-650" />
                          <span>Forgot Password Email Recovery Option</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">Enforced</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-655 dark:text-slate-350">Allow Forgot Password email recovery</label>
                        <button
                          type="button"
                          onClick={() => setAddForgotPassword(!addForgotPassword)}
                          className={`w-8 h-5 rounded-full relative transition-all border-none cursor-pointer ${
                            addForgotPassword ? "bg-teal-700" : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        >
                          <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-all ${addForgotPassword ? "left-4" : "left-0.5"}`} />
                        </button>
                      </div>

                    </div>
                  )}
                </div>

                {/* Feature Permissions Checkboxes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Feature Permissions</label>
                    <div className="flex gap-2">
                      <button onClick={() => setAddPermissions([...ALL_FEATURE_KEYS])} className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 transition-colors border-none bg-transparent cursor-pointer">Select All</button>
                      <span className="text-slate-300">·</span>
                      <button onClick={() => setAddPermissions([])} className="text-[10px] font-semibold text-slate-450 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer">Clear All</button>
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
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                            checked
                              ? "bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/40 shadow-sm"
                              : "bg-slate-50/40 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                            checked ? "bg-teal-500 border-teal-500" : "border-slate-300 bg-white"
                          }`}>
                            {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${checked ? "text-teal-700" : "text-slate-600"}`}>{feature.label}</p>
                            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{feature.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-400">{addPermissions.length} of {ALL_FEATURE_KEYS.length} features enabled</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddModal(false)} className={`px-4 py-2 text-xs font-semibold ${themeBtnGhost}`}>Cancel</button>
                  <button
                    onClick={saveAdd}
                    disabled={!addName.trim() || !addEmail.trim() || !addUsername.trim() || !addPassword.trim()}
                    className={`px-5 py-2.5 text-xs font-bold ${themeBtnPrimary} disabled:opacity-50 disabled:pointer-events-none`}
                  >
                    Add Admin
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

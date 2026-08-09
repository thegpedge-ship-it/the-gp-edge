"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import { useAdminRole } from "@/hooks/useAdminRole";
import { addUserNotification } from "@/utils/notifications";
import { saveAdminToDbAction, deleteAdminFromDbAction, getAdminsFromDbAction } from "@/actions/admin.actions";
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
  { key: "approaches", label: "Clinical Approaches", desc: "Manage clinical approach guidelines" },
  { key: "autofill", label: "Autofill Templates", desc: "Create & edit autofill templates" },
  { key: "users", label: "Users", desc: "View & manage user accounts" },
  { key: "mbs", label: "Update MBS", desc: "Upload government MBS data & rebuild search" },
  { key: "notifications", label: "Notifications", desc: "Send system notifications" },
  { key: "billing", label: "Billing", desc: "View revenue & manage subscriptions" },
  { key: "audit", label: "Audit & Security", desc: "View audit logs & manage roles" },
  { key: "settings", label: "Settings", desc: "System-level configuration" },
  { key: "search", label: "Search", desc: "Global admin search tool" },
];

const ALL_FEATURE_KEYS = ALL_FEATURES.map((f) => f.key);

/* ── Role presets (canonical — no duplicates) ── */
const ROLE_PRESETS: Record<string, string[]> = {
  "SA (Super Admin)": [...ALL_FEATURE_KEYS],
  "CE (Clinical Editor)": ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "audit"],
  "OM (Operations Manager)": ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "mbs", "billing", "audit"],
  "DR (Drafter)": ["dashboard", "questions", "content", "approaches"],
  "PR (Peer Reviewer)": ["dashboard", "questions", "content", "approaches"],
  "SUB (Subscriber)": ["dashboard"],
};

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  permissions: string[];
  lastLogin: string;
  lastActiveAt?: number;
  status: "active" | "inactive" | "deactivated" | "suspended";
  username: string;
  forgotPasswordEnabled: boolean;
  oauthEnabled: boolean;
  mfaEnabled: boolean;
  mustResetPassword?: boolean;
}

function getRelativeLastActive(timestampMs?: number, isCurrentLoggedIn?: boolean): string {
  if (isCurrentLoggedIn) return "Active now";
  if (!timestampMs) return "Never";
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffSec < 5) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export default function AuditPage() {
  const { currentAdmin: loggedInAdmin, isReadOnly, isSuperAdmin, isOperationsManager } = useAdminRole();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState("e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00");
  const [nowTick, setNowTick] = useState(Date.now());

  /* 3G Governance Capability Flags */
  const canInviteContributor = isSuperAdmin || isOperationsManager;
  const canInviteAnyAccount = isSuperAdmin;
  const canDeactivateContributor = isSuperAdmin || isOperationsManager;
  const canDeactivateAnyAccount = isSuperAdmin;
  const canEditPermissionBundle = isSuperAdmin;

  const [searchQuery, setSearchQuery] = useState("");

  /* Modal state */
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);

  /* Edit form state */
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editRole, setEditRole] = useState<string>("Admin");
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
  const [addRole, setAddRole] = useState<string>("Admin");
  const [addPermissions, setAddPermissions] = useState<string[]>([...ALL_FEATURE_KEYS]);
  const [addForgotPassword, setAddForgotPassword] = useState(true);
  const [addOauth, setAddOauth] = useState(false);
  const [addMfa, setAddMfa] = useState(false);

  // Live real-time ticker to update relative active timestamps every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const syncAdminsFromStorage = async () => {
    try {
      const dbAdmins = await getAdminsFromDbAction();
      if (dbAdmins && dbAdmins.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(dbAdmins));
        }
      }
    } catch (e) {
      console.error("Failed to fetch admins from DB:", e);
    }

    if (typeof window !== "undefined") {
      const activeId = localStorage.getItem("gpedge_active_admin_id") || "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00";
      
      let lastActiveMap: Record<string, number> = {};
      const storedMap = localStorage.getItem("gpedge_admin_last_active_map");
      if (storedMap) {
        try { lastActiveMap = JSON.parse(storedMap); } catch (e) {}
      }
      lastActiveMap[activeId] = Date.now();
      localStorage.setItem("gpedge_admin_last_active_map", JSON.stringify(lastActiveMap));

      const stored = localStorage.getItem("gpedge_admin_credentials_list");
      if (stored) {
        try {
          const credsList = JSON.parse(stored);
          const mappedAdmins = credsList.map((u: any) => {
            const uRoles: string[] = u.roles || [];
            let permissions = u.permissions || [];
            const uIsSA = uRoles.includes("SA") || u.role === "Super Admin" || u.role === "SA (Super Admin)";
            const uIsCE = uRoles.includes("CE") || u.role === "Clinical Editor" || u.role === "CE (Clinical Editor)";
            const uIsOM = uRoles.includes("OM") || u.role === "Operations Manager" || u.role === "OM (Operations Manager)";
            const uIsDR = uRoles.includes("DR") || u.role === "Drafter" || u.role === "DR (Drafter)";
            const uIsPR = uRoles.includes("PR") || u.role === "Peer Reviewer" || u.role === "PR (Peer Reviewer)";
            const uIsSUB = uRoles.includes("SUB") || u.role === "Subscriber" || u.role === "SUB (Subscriber)";

            if (permissions.length === 0) {
              if (uIsSA) {
                permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "users", "mbs", "notifications", "billing", "audit", "settings", "search"];
              } else if (uIsCE) {
                permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "audit"];
              } else if (uIsOM) {
                permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "mbs", "billing", "audit"];
              } else if (uIsDR || uIsPR) {
                permissions = ["dashboard", "questions", "content", "approaches"];
              } else if (uIsSUB) {
                permissions = ["dashboard"];
              } else if (u.role === "Admin") {
                permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "users", "mbs", "notifications", "billing"];
              } else if (u.role === "Moderator") {
                permissions = ["dashboard", "questions", "content", "approaches"];
              }
            }

            const defaultPastTimes: Record<string, number> = {
              "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00": Date.now(),
              "b5a452ef-09c3-4d2b-aa58-bf8827f8a101": Date.now() - 7200000,
              "d7c92b23-1c32-4f8a-9a99-8cb142646202": Date.now() - 86400000,
            };

            const lastActiveAt = lastActiveMap[u.id] || u.lastActiveAt || defaultPastTimes[u.id] || (u.id === activeId ? Date.now() : undefined);

            return {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              roles: u.roles || [],
              permissions,
              lastLogin: u.id === activeId ? "Active now" : getRelativeLastActive(lastActiveAt, u.id === activeId),
              lastActiveAt,
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
      const stored = localStorage.getItem("gpedge_active_admin_id") || "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00";
      setCurrentAdminId(stored);

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

  function isContributorAccount(u: AdminUser): boolean {
    const uRoles = u.roles || [];
    return (
      uRoles.includes("DR") ||
      uRoles.includes("PR") ||
      u.role.includes("DR") ||
      u.role.includes("PR") ||
      u.role === "Drafter" ||
      u.role === "Peer Reviewer"
    );
  }

  /* ── Handlers ── */
  function openEdit(admin: AdminUser) {
    const canEditTarget = isSuperAdmin || (isOperationsManager && isContributorAccount(admin));
    if (!canEditTarget || isReadOnly) return;
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

  async function saveEdit() {
    if (!editingAdmin || isReadOnly) return;
    if (!editName.trim() || !editEmail.trim() || !editUsername.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!isSuperAdmin && !isContributorAccount(editingAdmin)) {
      alert("Section 3G Rule Violation: Operations Manager can modify Drafter (DR) and Peer Reviewer (PR) contributor accounts ONLY.");
      return;
    }

    const isTargetSuperAdmin = editRole === "Super Admin" || editRole.includes("SA");
    const derivedRoles = editRole.includes("SA") ? ["SA"] :
      editRole.includes("CE") ? ["CE"] :
      editRole.includes("OM") ? ["OM"] :
      editRole.includes("DR") ? ["DR"] :
      editRole.includes("PR") ? ["PR"] :
      editRole.includes("SUB") ? ["SUB"] :
      editRole === "Super Admin" ? ["SA", "CE", "OM"] : [editRole];

    // Under 3G, OM cannot alter permission bundles — force preset permissions if non-SA
    const finalPermissions = isSuperAdmin ? [...editPermissions] : [...(ROLE_PRESETS[editRole] || editPermissions)];

    const updatedUser = {
      id: editingAdmin.id,
      name: editName.trim(),
      email: editEmail.trim(),
      username: editUsername.trim(),
      role: editRole,
      roles: derivedRoles,
      permissions: finalPermissions,
      lastChanged: "Just now",
      ...(editPassword.trim() ? { password: editPassword } : {}),
      forgotPasswordEnabled: isTargetSuperAdmin ? editForgotPassword : true,
      oauthEnabled: isTargetSuperAdmin ? editOauth : false,
      mfaEnabled: isTargetSuperAdmin ? editMfa : false,
      mustResetPassword: editingAdmin.mustResetPassword,
      status: editingAdmin.status,
    };

    try {
      const res = await saveAdminToDbAction(updatedUser);
      if (!res.success) {
        alert(res.error || "Failed to update admin.");
        return;
      }
      setEditingAdmin(null);
      const dbAdmins = await getAdminsFromDbAction();
      if (dbAdmins && dbAdmins.length > 0) {
        localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(dbAdmins));
      }
      window.dispatchEvent(new Event("gpedge_admin_changed"));
      addUserNotification("Admin Updated", `Successfully updated details for "${editName}".`, 1, "custom");
    } catch (err: any) {
      console.error("Failed to save admin to DB:", err);
      alert(err.message || "An unexpected error occurred.");
    }
    syncAdminsFromStorage();
  }

  function openAdd() {
    if (!canInviteContributor || isReadOnly) return;
    setAddName("");
    setAddEmail("");
    setAddUsername("");
    setAddPassword("");
    const defaultRole = isSuperAdmin ? "SA (Super Admin)" : "DR (Drafter)";
    setAddRole(defaultRole);
    setAddPermissions([...(ROLE_PRESETS[defaultRole] || ALL_FEATURE_KEYS)]);
    setAddForgotPassword(true);
    setAddOauth(false);
    setAddMfa(false);
    setShowAddPassword(false);
    setShowAddModal(true);
  }

  async function saveAdd() {
    if (!canInviteContributor || isReadOnly) return;
    if (!addName.trim() || !addEmail.trim() || !addUsername.trim() || !addPassword.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!isSuperAdmin && !["DR (Drafter)", "PR (Peer Reviewer)", "DR", "PR"].includes(addRole)) {
      alert("Section 3G Rule Violation: Operations Manager can invite Drafter (DR) and Peer Reviewer (PR) contributor accounts ONLY.");
      return;
    }
    
    const isTargetSuperAdmin = addRole === "Super Admin";
    const finalPermissions = isSuperAdmin ? [...addPermissions] : [...(ROLE_PRESETS[addRole] || addPermissions)];

    const newCred = {
      id: String(Date.now()),
      name: addName.trim(),
      email: addEmail.trim(),
      username: addUsername.trim(),
      password: addPassword,
      role: addRole,
      permissions: finalPermissions,
      lastChanged: "Just now",
      forgotPasswordEnabled: isTargetSuperAdmin ? addForgotPassword : true,
      oauthEnabled: isTargetSuperAdmin ? addOauth : false,
      mfaEnabled: isTargetSuperAdmin ? addMfa : false,
      mustResetPassword: true, // Force password reset on first login
      status: "active",
    };

    try {
      const res = await saveAdminToDbAction(newCred);
      if (!res.success) {
        alert(res.error || "Failed to create admin.");
        return;
      }
      setShowAddModal(false);
      const dbAdmins = await getAdminsFromDbAction();
      if (dbAdmins && dbAdmins.length > 0) {
        localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(dbAdmins));
      }
      window.dispatchEvent(new Event("gpedge_admin_changed"));
      addUserNotification("Contributor Account Invited", `Successfully created credentials for "${addName}" (${addRole}). Account set to force password reset on first login.`, 1, "custom");
    } catch (err: any) {
      console.error("Failed to add admin to DB:", err);
      alert(err.message || "An unexpected error occurred.");
    }
    syncAdminsFromStorage();
  }

  function requestDeleteAdmin(admin: AdminUser) {
    if (isReadOnly) return;
    if (admin.role === "Super Admin" || admin.id === "1" || admin.id === "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00") {
      alert("Cannot delete Super Admin account.");
      return;
    }
    if (!isSuperAdmin && !isContributorAccount(admin)) {
      alert("Section 3G Rule Violation: Operations Manager can deactivate Drafter (DR) and Peer Reviewer (PR) contributor accounts ONLY.");
      return;
    }
    setAdminToDelete(admin);
  }

  async function removeAdmin(id: string, name: string) {
    if (isReadOnly) return;

    try {
      await deleteAdminFromDbAction(id);

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("gpedge_admin_credentials_list");
        if (stored) {
          try {
            const list = JSON.parse(stored).filter((u: any) => u.id !== id);
            localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(list));
          } catch (e) {}
        }
        const storedMap = localStorage.getItem("gpedge_admin_last_active_map");
        if (storedMap) {
          try {
            const map = JSON.parse(storedMap);
            delete map[id];
            localStorage.setItem("gpedge_admin_last_active_map", JSON.stringify(map));
          } catch (e) {}
        }
      }

      const dbAdmins = await getAdminsFromDbAction();
      if (dbAdmins && dbAdmins.length > 0) {
        localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(dbAdmins));
      }
      window.dispatchEvent(new Event("gpedge_admin_changed"));
      addUserNotification("Admin Deleted", `Completely deleted credentials for "${name}" from database.`, 1, "custom");
    } catch (err) {
      console.error("Failed to delete admin from DB:", err);
    }
    syncAdminsFromStorage();
  }

  async function confirmDeleteAdmin() {
    if (!adminToDelete) return;
    const { id, name } = adminToDelete;
    setAdminToDelete(null);
    await removeAdmin(id, name);
  }

  function togglePermission(perms: string[], key: string, setter: (v: string[]) => void) {
    if (!canEditPermissionBundle) return;
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

  /* helper to display permission summary */
  function permSummary(perms: string[]): string {
    if (perms.length === ALL_FEATURE_KEYS.length) return "Full Access";
    if (perms.length === 0) return "No Access";
    const labels = perms.map((k) => ALL_FEATURES.find((f) => f.key === k)?.label ?? k);
    if (labels.length <= 3) return labels.join(", ");
    return `${labels.slice(0, 3).join(", ")} +${labels.length - 3} more`;
  }

  const ALL_ROLE_OPTIONS = [
    { value: "SA (Super Admin)", label: "SA — Super Admin (Founder / Clinical Director)" },
    { value: "CE (Clinical Editor)", label: "CE — Clinical Editor (Senior GP)" },
    { value: "OM (Operations Manager)", label: "OM — Operations Manager (Pipeline & Finance)" },
    { value: "DR (Drafter)", label: "DR — Drafter (Assigned Items)" },
    { value: "PR (Peer Reviewer)", label: "PR — Peer Reviewer (Review Management)" },
    { value: "SUB (Subscriber)", label: "SUB — Subscriber" },
  ];

  const CONTRIBUTOR_ROLE_OPTIONS = [
    { value: "DR (Drafter)", label: "DR — Drafter (Assigned Items)" },
    { value: "PR (Peer Reviewer)", label: "PR — Peer Reviewer (Review Management)" },
  ];

  const addRoleOptions = isSuperAdmin ? ALL_ROLE_OPTIONS : CONTRIBUTOR_ROLE_OPTIONS;
  const editRoleOptions = isSuperAdmin ? ALL_ROLE_OPTIONS : CONTRIBUTOR_ROLE_OPTIONS;

  /* ── Render ── */
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 font-sans">
      <AdminPageHeader
        title="Audit &"
        highlightedText="Security"
        subtitle="Manage administrator access credentials, team member roles, and feature permissions."
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

      {/* Administrator Accounts */}
      <div className="space-y-6">
        <motion.div variants={itemVariants} className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-slate-800/80 shadow-md shadow-slate-200/10 dark:shadow-slate-950/40 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-transparent via-transparent to-teal-50/2 dark:to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-xs">
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
                onClick={canInviteContributor ? openAdd : undefined}
                disabled={!canInviteContributor || isReadOnly}
                className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all duration-200 ${
                  canInviteContributor && !isReadOnly
                    ? "hover:shadow-md active:scale-[0.97] cursor-pointer hover:opacity-95"
                    : "opacity-50 cursor-not-allowed"
                }`}
                style={{ background: canInviteContributor && !isReadOnly ? "linear-gradient(135deg, #0f766e, #115e59)" : "#94a3b8" }}
                title={isSuperAdmin ? "Add team member & assign roles" : isOperationsManager ? "Invite Drafter (DR) or Peer Reviewer (PR) contributor account" : "Account creation is restricted"}
              >
                <Lucide.Plus className="w-3.5 h-3.5" />
                {isOperationsManager ? "Invite Contributor" : "Add Admin"}
              </button>
            </div>

            {!isSuperAdmin && (
              <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                <Lucide.Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">Section 3G Governance Mode</p>
                  <p className="mt-0.5 opacity-90 leading-normal">
                    {isOperationsManager
                      ? "As Operations Manager (OM), you can invite and deactivate Drafter (DR) and Peer Reviewer (PR) contributor accounts. Assigning/revoking elevated roles (SA/CE/OM) and editing permission bundles are restricted to Super Admins."
                      : "Account creation, role modification, access log viewing, and audit log exports are restricted."}
                  </p>
                </div>
              </div>
            )}

            {/* Desktop / Tablet Table View */}
            <div className="hidden sm:block overflow-x-auto">
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
                  {filteredAdmins.map((a) => {
                    const isTargetContributor = isContributorAccount(a);
                    const canEditTargetUser = isSuperAdmin || (isOperationsManager && isTargetContributor);
                    const canDeleteTargetUser = isSuperAdmin || (isOperationsManager && isTargetContributor);

                    return (
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
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            (a as any).roles?.includes("SA") || a.role === "Super Admin" || a.role.includes("SA")
                              ? "bg-purple-50/70 text-purple-900 border-purple-300/80 dark:bg-purple-950/45 dark:text-purple-300 dark:border-purple-900/60"
                              : (a as any).roles?.includes("CE") || a.role === "Clinical Editor" || a.role.includes("CE")
                              ? "bg-blue-50/70 text-blue-900 border-blue-300/80 dark:bg-blue-950/45 dark:text-blue-300 dark:border-blue-900/60"
                              : (a as any).roles?.includes("OM") || a.role === "Operations Manager" || a.role.includes("OM")
                              ? "bg-amber-50/70 text-amber-900 border-amber-300/80 dark:bg-amber-950/45 dark:text-amber-300 dark:border-amber-900/60"
                              : (a as any).roles?.includes("DR") || a.role === "Drafter" || a.role.includes("DR")
                              ? "bg-green-50/70 text-green-900 border-green-300/80 dark:bg-green-950/45 dark:text-green-300 dark:border-green-900/60"
                              : (a as any).roles?.includes("PR") || a.role === "Peer Reviewer" || a.role.includes("PR")
                              ? "bg-orange-50/70 text-orange-900 border-orange-300/80 dark:bg-orange-950/45 dark:text-orange-300 dark:border-orange-900/60"
                              : "bg-teal-50/70 text-teal-900 border-teal-300/80 dark:bg-teal-950/45 dark:text-teal-300 dark:border-teal-900/60"
                          }`}>
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
                            <span className={`w-1.5 h-1.5 rounded-full ${a.id === currentAdminId ? "bg-emerald-500 animate-pulse" : a.status === "active" ? "bg-emerald-400" : "bg-slate-300"}`} />
                            <span className="text-xs text-slate-500 font-medium">
                              {getRelativeLastActive(a.lastActiveAt, a.id === currentAdminId)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => canEditTargetUser && openEdit(a)}
                              disabled={!canEditTargetUser || isReadOnly}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                canEditTargetUser && !isReadOnly
                                  ? "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100 cursor-pointer"
                                  : "text-slate-400 bg-slate-50 border-slate-100 cursor-not-allowed opacity-60"
                              }`}
                              title={canEditTargetUser ? "Modify user details & permissions" : "Only Super Admins can modify non-contributor accounts"}
                            >
                              Edit details
                            </button>
                            {a.role !== "Super Admin" && (
                              <button
                                onClick={() => canDeleteTargetUser && requestDeleteAdmin(a)}
                                disabled={!canDeleteTargetUser || isReadOnly}
                                className={`p-1.5 rounded-lg transition-all ${
                                  canDeleteTargetUser && !isReadOnly
                                    ? "text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                                    : "text-slate-300 cursor-not-allowed opacity-50"
                                  }`}
                                title={canDeleteTargetUser ? "Deactivate this account" : "Only Super Admins can deactivate non-contributor accounts"}
                              >
                                <Lucide.Trash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (small screens < 640px) */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAdmins.map((a) => (
                <div key={a.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${a.status === "active" ? "bg-gradient-to-br from-teal-400 to-emerald-500" : "bg-gradient-to-br from-slate-300 to-slate-400"}`}>
                        {a.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{a.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{a.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                      (a as any).roles?.includes("SA") || a.role === "Super Admin" || a.role.includes("SA")
                        ? "bg-purple-50/70 text-purple-900 border-purple-300/80 dark:bg-purple-950/45 dark:text-purple-300"
                        : (a as any).roles?.includes("CE") || a.role === "Clinical Editor" || a.role.includes("CE")
                        ? "bg-blue-50/70 text-blue-900 border-blue-300/80 dark:bg-blue-950/45 dark:text-blue-300"
                        : (a as any).roles?.includes("OM") || a.role === "Operations Manager" || a.role.includes("OM")
                        ? "bg-amber-50/70 text-amber-900 border-amber-300/80 dark:bg-amber-950/45 dark:text-amber-300"
                        : (a as any).roles?.includes("DR") || a.role === "Drafter" || a.role.includes("DR")
                        ? "bg-green-50/70 text-green-900 border-green-300/80 dark:bg-green-950/45 dark:text-green-300"
                        : (a as any).roles?.includes("PR") || a.role === "Peer Reviewer" || a.role.includes("PR")
                        ? "bg-orange-50/70 text-orange-900 border-orange-300/80 dark:bg-orange-950/45 dark:text-orange-300"
                        : "bg-teal-50/70 text-teal-900 border-teal-300/80 dark:bg-teal-950/45 dark:text-teal-300"
                    }`}>
                      {a.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${a.id === currentAdminId ? "bg-emerald-500 animate-pulse" : a.status === "active" ? "bg-emerald-400" : "bg-slate-300"}`} />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {getRelativeLastActive(a.lastActiveAt, a.id === currentAdminId)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate max-w-[150px]" title={a.permissions.join(", ")}>
                      {permSummary(a.permissions)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100/60 dark:border-slate-800/60 justify-end">
                    {(() => {
                      const isTargetContributor = isContributorAccount(a);
                      const canEditThisUser = isSuperAdmin || (isOperationsManager && isTargetContributor);
                      const canDeleteThisUser = isSuperAdmin || (isOperationsManager && isTargetContributor);
                      return (
                        <>
                          <button
                            onClick={() => canEditThisUser && openEdit(a)}
                            disabled={!canEditThisUser || isReadOnly}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                              canEditThisUser && !isReadOnly
                                ? "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100 cursor-pointer"
                                : "text-slate-400 bg-slate-50 border-slate-100 cursor-not-allowed opacity-60"
                            }`}
                          >
                            Edit details
                          </button>
                          {a.role !== "Super Admin" && (
                            <button
                              onClick={() => canDeleteThisUser && requestDeleteAdmin(a)}
                              disabled={!canDeleteThisUser || isReadOnly}
                              className={`p-1.5 rounded-lg border transition-all ${
                                canDeleteThisUser && !isReadOnly
                                  ? "text-red-600 bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer"
                                  : "text-slate-300 border-slate-100 cursor-not-allowed opacity-50"
                              }`}
                            >
                              <Lucide.Trash className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

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
                  
                  {(editRole === "Super Admin" || editRole.startsWith("SA")) ? (
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
                  ) : (
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/35 dark:border-amber-900/20 rounded-xl space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex gap-2 items-start text-[10px] text-amber-800 dark:text-amber-350">
                        <Lucide.Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Security & Relational Validation Rules</p>
                          <p className="mt-0.5">SA and CE roles require mandatory 2FA. OM, DR, and PR roles are governed by item-scoped relational permissions.</p>
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
                  )}
                </div>

                {/* Feature permissions checkbox list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Feature Permissions {!canEditPermissionBundle && "(Locked by Preset)"}
                    </label>
                    {canEditPermissionBundle && (
                      <div className="flex gap-2">
                        <button onClick={() => setEditPermissions([...ALL_FEATURE_KEYS])} className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 transition-colors border-none bg-transparent cursor-pointer">Select All</button>
                        <span className="text-slate-300">·</span>
                        <button onClick={() => setEditPermissions([])} className="text-[10px] font-semibold text-slate-450 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer">Clear All</button>
                      </div>
                    )}
                  </div>
                  {!canEditPermissionBundle && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2.5 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/40">
                      Section 3G Governance: Feature permission bundles are locked to predefined role presets. Only Super Admins can customize permission bundles.
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_FEATURES.map((feature) => {
                      const checked = editPermissions.includes(feature.key);
                      return (
                        <button
                          key={feature.key}
                          type="button"
                          disabled={!canEditPermissionBundle}
                          onClick={() => togglePermission(editPermissions, feature.key, setEditPermissions)}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                            !canEditPermissionBundle ? "cursor-not-allowed opacity-75" : "cursor-pointer"
                          } ${
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
                  
                  {(addRole === "Super Admin" || addRole.startsWith("SA")) ? (
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
                  ) : (
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/35 dark:border-amber-900/20 rounded-xl space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex gap-2 items-start text-[10px] text-amber-800 dark:text-amber-350">
                        <Lucide.Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Security & Relational Validation Rules</p>
                          <p className="mt-0.5">SA and CE roles require mandatory 2FA. OM, DR, and PR roles are governed by item-scoped relational permissions.</p>
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
                  )}
                </div>

                {/* Feature Permissions Checkboxes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Feature Permissions {!canEditPermissionBundle && "(Locked by Preset)"}
                    </label>
                    {canEditPermissionBundle && (
                      <div className="flex gap-2">
                        <button onClick={() => setAddPermissions([...ALL_FEATURE_KEYS])} className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 transition-colors border-none bg-transparent cursor-pointer">Select All</button>
                        <span className="text-slate-300">·</span>
                        <button onClick={() => setAddPermissions([])} className="text-[10px] font-semibold text-slate-450 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer">Clear All</button>
                      </div>
                    )}
                  </div>
                  {!canEditPermissionBundle && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2.5 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/40">
                      Section 3G Governance: Feature permission bundles are locked to predefined role presets. Only Super Admins can customize permission bundles.
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_FEATURES.map((feature) => {
                      const checked = addPermissions.includes(feature.key);
                      return (
                        <button
                          key={feature.key}
                          type="button"
                          disabled={!canEditPermissionBundle}
                          onClick={() => togglePermission(addPermissions, feature.key, setAddPermissions)}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                            !canEditPermissionBundle ? "cursor-not-allowed opacity-75" : "cursor-pointer"
                          } ${
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

      <AnimatePresence>
        {adminToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 pointer-events-auto"
            onClick={() => setAdminToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/80 w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-150">Delete Administrator Account</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Confirm removal of administrator account credentials</p>
                </div>
                <button
                  onClick={() => setAdminToDelete(null)}
                  className="p-1.5 border-none bg-transparent rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer transition-colors"
                >
                  <Lucide.X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <div className="p-4 rounded-xl border border-teal-200/40 dark:border-teal-900/30 bg-teal-50/40 dark:bg-teal-950/20">
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    Are you sure you want to delete administrator <span className="font-bold text-teal-800 dark:text-teal-400">"{adminToDelete.name}"</span>?
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setAdminToDelete(null)}
                  className={`px-4 py-2 text-xs font-semibold ${themeBtnGhost}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAdmin}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all duration-200 cursor-pointer hover:opacity-95 active:scale-[0.97]"
                  style={{ background: "linear-gradient(135deg, #0f766e, #115e59)" }}
                >
                  <Lucide.Trash2 className="w-3.5 h-3.5" />
                  Delete Admin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

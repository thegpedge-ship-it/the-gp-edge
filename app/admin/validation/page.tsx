"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import StatusBadge from "@/components/admin/StatusBadge";
import { addUserNotification } from "@/utils/notifications";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  themeBorder,
  themeBtnGhost,
  themeBtnPrimary,
  themeLabel,
  themeInput,
} from "@/lib/adminTheme";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
};

interface CredentialUser {
  id: string;
  name: string;
  username: string;
  role: "Super Admin" | "Admin" | "Moderator" | "Viewer";
  email: string;
  lastChanged: string;
  forgotPasswordEnabled: boolean;
  oauthEnabled: boolean;
  mfaEnabled: boolean;
  password?: string;
}

const INITIAL_USERS: CredentialUser[] = [
  {
    id: "1",
    name: "Siddhant Udavant",
    username: "siddhant_super",
    role: "Super Admin",
    email: "admin@gpedge.com",
    lastChanged: "12 days ago",
    forgotPasswordEnabled: true,
    oauthEnabled: true,
    mfaEnabled: true,
    password: "super123",
  },
  {
    id: "2",
    name: "Arun Mehta",
    username: "arun_admin",
    role: "Admin",
    email: "content@gpedge.com",
    lastChanged: "3 days ago",
    forgotPasswordEnabled: true,
    oauthEnabled: false,
    mfaEnabled: false,
    password: "admin123",
  },
  {
    id: "3",
    name: "Jessica Park",
    username: "jessica_mod",
    role: "Moderator",
    email: "moderator@gpedge.com",
    lastChanged: "Yesterday",
    forgotPasswordEnabled: true,
    oauthEnabled: false,
    mfaEnabled: false,
    password: "moderator123",
  },
  {
    id: "4",
    name: "Sarah Connor",
    username: "sarah_view",
    role: "Viewer",
    email: "viewer@gpedge.com",
    lastChanged: "Never",
    forgotPasswordEnabled: true,
    oauthEnabled: false,
    mfaEnabled: false,
    password: "viewer123",
  },
];

export default function ValidationPage() {
  const { isReadOnly } = useAdminRole();
  const [users, setUsers] = useState<CredentialUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts" | "policies">("accounts");

  // Form states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formRole, setFormRole] = useState<"Super Admin" | "Admin" | "Moderator" | "Viewer">("Viewer");
  const [formForgotPassword, setFormForgotPassword] = useState(true);
  const [formOauth, setFormOauth] = useState(false);
  const [formMfa, setFormMfa] = useState(false);

  // Policy configurations
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [lockoutAttempts, setLockoutAttempts] = useState(5);
  const [mfaEnforcedGlobal, setMfaEnforcedGlobal] = useState(false);

  // Load from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gpedge_admin_credentials_list");
      if (stored) {
        setUsers(JSON.parse(stored));
      } else {
        setUsers(INITIAL_USERS);
        localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(INITIAL_USERS));
      }
    }
  }, []);

  const saveUsers = (updated: CredentialUser[]) => {
    setUsers(updated);
    localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormUsername("");
    setFormPassword("");
    setShowFormPassword(false);
    setFormRole("Viewer");
    setFormForgotPassword(true);
    setFormOauth(false);
    setFormMfa(false);
    setShowModal(true);
  };

  const handleOpenEdit = (user: CredentialUser) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormUsername(user.username);
    setFormPassword(""); // Don't prefill password for security
    setShowFormPassword(false);
    setFormRole(user.role);
    setFormForgotPassword(user.forgotPasswordEnabled);
    setFormOauth(user.oauthEnabled);
    setFormMfa(user.mfaEnabled);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!formName.trim() || !formUsername.trim() || !formEmail.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!editingUserId && !formPassword.trim()) {
      alert("Password is required for new accounts.");
      return;
    }

    let updated: CredentialUser[];

    if (editingUserId) {
      updated = users.map((u) => {
        if (u.id === editingUserId) {
          // If role is NOT Super Admin, enforce strict properties
          const isTargetSuperAdmin = formRole === "Super Admin";
          return {
            ...u,
            name: formName,
            email: formEmail,
            username: formUsername,
            role: formRole,
            lastChanged: "Just now",
            // Save password if entered
            ...(formPassword.trim() ? { password: formPassword } : {}),
            // Other roles can ONLY have Forgot Password enabled; OAuth & MFA are strictly disabled
            forgotPasswordEnabled: isTargetSuperAdmin ? formForgotPassword : true,
            oauthEnabled: isTargetSuperAdmin ? formOauth : false,
            mfaEnabled: isTargetSuperAdmin ? formMfa : false,
          };
        }
        return u;
      });
      addUserNotification("Credentials Updated", `Successfully updated credentials for "${formName}".`, 1, "custom");
    } else {
      const isTargetSuperAdmin = formRole === "Super Admin";
      const newUser: CredentialUser = {
        id: String(users.length + 1),
        name: formName,
        email: formEmail,
        username: formUsername,
        password: formPassword,
        role: formRole,
        lastChanged: "Just now",
        // Other roles can ONLY have Forgot Password enabled; OAuth & MFA are strictly disabled
        forgotPasswordEnabled: isTargetSuperAdmin ? formForgotPassword : true,
        oauthEnabled: isTargetSuperAdmin ? formOauth : false,
        mfaEnabled: isTargetSuperAdmin ? formMfa : false,
      };
      updated = [...users, newUser];
      addUserNotification("Admin User Added", `Successfully created credentials for "${formName}" (${formRole}).`, 1, "custom");
    }

    saveUsers(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (isReadOnly) return;
    if (id === "1") {
      alert("Cannot delete primary Super Admin account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete administrator credentials for "${name}"?`)) {
      return;
    }
    const updated = users.filter((u) => u.id !== id);
    saveUsers(updated);
    addUserNotification("Admin User Deleted", `Successfully removed credentials for "${name}".`, 1, "custom");
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const editingUser = users.find((u) => u.id === editingUserId);
  const showSuperAdminOption = editingUser ? editingUser.role === "Super Admin" : false;

  const roleSelectOptions = [
    ...(showSuperAdminOption ? [{ value: "Super Admin", label: "Super Admin" }] : []),
    { value: "Admin", label: "Admin" },
    { value: "Moderator", label: "Moderator" },
    { value: "Viewer", label: "Viewer" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Credentials &"
        highlightedText="Validation"
        subtitle="Manage administrator access credentials and security validation policy. Super Admin controls credentials configuration."
        actions={
          activeTab === "accounts" && !isReadOnly && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-teal-800 text-sm font-semibold text-white rounded-xl hover:bg-teal-900 transition-all shadow-sm flex items-center gap-2 border-none outline-none cursor-pointer"
            >
              <Lucide.Plus className="w-4 h-4" />
              Add Admin Credentials
            </button>
          )
        }
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
              You are signed in under the <strong>Viewer</strong> role. You have full read-only access to all sections and data, but editing, adding, or deleting credentials is restricted.
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`px-5 py-3 text-sm font-bold border-b-2 bg-transparent border-none cursor-pointer transition-all ${
            activeTab === "accounts"
              ? "border-b-teal-700 text-teal-700 dark:text-teal-400"
              : "border-b-transparent text-slate-450 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Administrator Credentials
        </button>
        <button
          onClick={() => setActiveTab("policies")}
          className={`px-5 py-3 text-sm font-bold border-b-2 bg-transparent border-none cursor-pointer transition-all ${
            activeTab === "policies"
              ? "border-b-teal-700 text-teal-700 dark:text-teal-400"
              : "border-b-transparent text-slate-450 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Validation & Security Policies
        </button>
      </motion.div>

      {activeTab === "accounts" ? (
        <div className="space-y-6">
          {/* Info Banner */}
          <motion.div
            variants={itemVariants}
            className="p-4 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100/70 dark:border-teal-900/30 rounded-2xl flex gap-3 text-xs text-teal-850 dark:text-teal-300 leading-relaxed"
          >
            <Lucide.ShieldCheck className="w-5 h-5 shrink-0 text-teal-600" />
            <div>
              <p className="font-bold">Credential Access Validation Rule Enforced</p>
              <p className="mt-0.5">
                For administrative security, Super Admins can only configure standard <strong>Username and Password</strong> credentials for other roles (Viewer, Admin, Moderator). Furthermore, only the <strong>Forgot Password</strong> recovery flow is allowed for these roles. OAuth, SAML SSO, and physical authenticators are disabled for non-Super Admin roles.
              </p>
            </div>
          </motion.div>

          {/* Search bar */}
          <motion.div variants={itemVariants} className="relative w-full max-w-md">
            <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
            <input
              type="text"
              placeholder="Search admin accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700/50 dark:text-slate-100 transition-all"
            />
          </motion.div>

          {/* Grid Layout */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((user) => {
              const isUserSuperAdmin = user.role === "Super Admin";
              return (
                <div
                  key={user.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden group hover:shadow-md hover:border-teal-200 dark:hover:border-teal-900 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/45 flex items-center justify-center border border-teal-150/50 dark:border-teal-900/40 text-teal-700">
                        {isUserSuperAdmin ? (
                          <Lucide.ShieldAlert className="w-5 h-5" />
                        ) : (
                          <Lucide.UserCheck className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-850 dark:text-slate-150 leading-tight">
                          {user.name}
                        </h4>
                        <span className="text-[10px] text-slate-450 font-mono mt-0.5 block">{user.email}</span>
                      </div>
                    </div>
                    <StatusBadge variant={user.role === "Super Admin" ? "published" : "draft"} label={user.role} />
                  </div>

                  <div className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-3.5 border border-slate-100 dark:border-slate-850 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-450">Username</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450">Login Method</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Lucide.Key className="w-3 h-3 text-slate-400" />
                        Username/Password
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450">Recovery Route</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        {user.forgotPasswordEnabled ? (
                          <>
                            <Lucide.MailCheck className="w-3 h-3 text-emerald-500" />
                            Forgot Password Only
                          </>
                        ) : (
                          <>
                            <Lucide.XCircle className="w-3 h-3 text-red-500" />
                            Disabled
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/50 dark:border-slate-800/60">
                      <span className="text-slate-450 text-[10px]">OAuth / SSO Integration</span>
                      <span className="flex items-center gap-1">
                        {isUserSuperAdmin ? (
                          user.oauthEnabled ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-450 px-2 py-0.5 rounded-md">
                              SSO Enabled
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">SSO Offline</span>
                          )
                        ) : (
                          <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 select-none">
                            <Lucide.Lock className="w-2.5 h-2.5" />
                            Restricted
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-450">Last modified: {user.lastChanged}</span>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 rounded-lg text-slate-450 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-all border-none bg-transparent cursor-pointer"
                          title="Edit Credentials"
                        >
                          <Lucide.Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {user.id !== "1" && (
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            className="p-1.5 rounded-lg text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border-none bg-transparent cursor-pointer"
                            title="Delete Credentials"
                          >
                            <Lucide.Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-6 max-w-3xl">
          {/* Policy Settings card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3">
              Role Access & Recovery Rules Matrix
            </h3>

            {/* Validation Matrix Visualizer */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-450">
                    <th className="py-2.5">Role</th>
                    <th className="py-2.5">Allowed Credentials</th>
                    <th className="py-2.5">Allowed Recovery Options</th>
                    <th className="py-2.5">SSO/OAuth Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  <tr>
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">Super Admin</td>
                    <td className="py-3 text-slate-500">Username/Password, OAuth, Passkey</td>
                    <td className="py-3 text-slate-500">Forgot Password, Authenticator Reset</td>
                    <td className="py-3 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Lucide.Check className="w-3.5 h-3.5" /> Allowed
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">Admin</td>
                    <td className="py-3 text-slate-500 font-semibold text-teal-650">Username/Password Only</td>
                    <td className="py-3 text-slate-500 font-semibold text-teal-650">Forgot Password Only</td>
                    <td className="py-3 text-red-500 dark:text-red-400 font-semibold flex items-center gap-1">
                      <Lucide.Lock className="w-3.5 h-3.5" /> Restricted (Rule Enforced)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">Moderator</td>
                    <td className="py-3 text-slate-500 font-semibold text-teal-650">Username/Password Only</td>
                    <td className="py-3 text-slate-500 font-semibold text-teal-650">Forgot Password Only</td>
                    <td className="py-3 text-red-500 dark:text-red-400 font-semibold flex items-center gap-1">
                      <Lucide.Lock className="w-3.5 h-3.5" /> Restricted (Rule Enforced)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">Viewer</td>
                    <td className="py-3 text-slate-500 font-semibold text-teal-650">Username/Password Only</td>
                    <td className="py-3 text-slate-500 font-semibold text-teal-650">Forgot Password Only</td>
                    <td className="py-3 text-red-500 dark:text-red-400 font-semibold flex items-center gap-1">
                      <Lucide.Lock className="w-3.5 h-3.5" /> Restricted (Rule Enforced)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Credential Integrity Configurations</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Minimum Password Length</label>
                  <input
                    type="number"
                    value={passwordMinLength}
                    disabled={isReadOnly}
                    onChange={(e) => setPasswordMinLength(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                    min={8}
                    max={32}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Account Lockout Threshold</label>
                  <input
                    type="number"
                    value={lockoutAttempts}
                    disabled={isReadOnly}
                    onChange={(e) => setLockoutAttempts(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                    min={3}
                    max={10}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Attempts before temporary ban (Default 5)</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-355">Enforce Multi-Factor Auth (MFA) for Super Admin</p>
                  <p className="text-[10px] text-slate-450 mt-0.5">Enforces mandatory authenticator application validation for role level 1.</p>
                </div>
                <button
                  onClick={() => !isReadOnly && setMfaEnforcedGlobal(!mfaEnforcedGlobal)}
                  disabled={isReadOnly}
                  className={`w-10 h-6 rounded-full relative transition-all duration-200 border-none cursor-pointer ${
                    mfaEnforcedGlobal ? "bg-teal-700" : "bg-slate-300 dark:bg-slate-800"
                  } ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${
                      mfaEnforcedGlobal ? "left-5" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  disabled={isReadOnly}
                  onClick={() => !isReadOnly && addUserNotification("Policy Saved", "Validation policies updated successfully.", 1, "custom")}
                  className={`px-4 py-2 text-xs font-bold ${themeBtnPrimary} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Save Policy Config
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal Dialog */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/35 backdrop-blur-sm pointer-events-auto"
            />

            {/* Content box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-[10%] mx-auto max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl z-50 shadow-2xl overflow-y-auto max-h-[80vh] pointer-events-auto text-slate-950 dark:text-slate-50 p-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 uppercase tracking-wider">
                  {editingUserId ? "Edit Admin Credentials" : "Add Admin Credentials"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 border-none bg-transparent cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                    placeholder="e.g. john.doe@gpedge.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className={`w-full px-3.5 py-2 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                      placeholder="e.g. john_doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Role</label>
                    <CustomSelect
                      value={formRole}
                      onChange={(val) => {
                        setFormRole(val as any);
                        if (val !== "Super Admin") {
                          setFormOauth(false);
                          setFormMfa(false);
                          setFormForgotPassword(true);
                        }
                      }}
                      options={roleSelectOptions}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Password {editingUserId && "(Leave blank to keep current)"}
                  </label>
                  <div className="relative">
                    <input
                      type={showFormPassword ? "text" : "password"}
                      required={!editingUserId}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer flex items-center justify-center p-1 rounded-lg"
                      title={showFormPassword ? "Hide password" : "Show password"}
                    >
                      {showFormPassword ? (
                        <Lucide.EyeOff className="w-4 h-4" />
                      ) : (
                        <Lucide.Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Security Validation Rules (Role-based)
                  </span>

                  {formRole !== "Super Admin" ? (
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/20 rounded-xl space-y-2">
                      <div className="flex gap-2 items-start text-[10px] text-amber-850 dark:text-amber-300">
                        <Lucide.Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <p className="font-bold">Credential Restrictions Apply</p>
                          <p className="mt-0.5">
                            Viewer, Admin, and Moderator roles are restricted to <strong>Username & Password</strong> login. No external integrations (SSO / OAuth / MFA) can be associated with these roles.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-450 pt-1">
                        <Lucide.CheckSquare className="w-4 h-4 text-teal-700 shrink-0" />
                        <span>Username & Password Authentication (Always Allowed)</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-450">
                        <div className="flex items-center gap-2">
                          <Lucide.CheckSquare className="w-4 h-4 text-teal-750 shrink-0" />
                          <span>Forgot Password Email Recovery Option</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                          Allowed Recovery
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-655 dark:text-slate-350">Allow Forgot Password email recovery</label>
                        <button
                          type="button"
                          onClick={() => setFormForgotPassword(!formForgotPassword)}
                          className={`w-8 h-5 rounded-full relative transition-all border-none cursor-pointer ${
                            formForgotPassword ? "bg-teal-700" : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-all ${
                              formForgotPassword ? "left-4" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-655 dark:text-slate-350">Allow Google SSO / OAuth Login</label>
                        <button
                          type="button"
                          onClick={() => setFormOauth(!formOauth)}
                          className={`w-8 h-5 rounded-full relative transition-all border-none cursor-pointer ${
                            formOauth ? "bg-teal-700" : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-all ${
                              formOauth ? "left-4" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-655 dark:text-slate-350">Enforce Multi-Factor Auth (MFA)</label>
                        <button
                          type="button"
                          onClick={() => setFormMfa(!formMfa)}
                          className={`w-8 h-5 rounded-full relative transition-all border-none cursor-pointer ${
                            formMfa ? "bg-teal-700" : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-all ${
                              formMfa ? "left-4" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`px-4 py-2 text-xs font-semibold ${themeBtnGhost}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-xs font-bold ${themeBtnPrimary}`}
                  >
                    {editingUserId ? "Save Credentials" : "Create Account"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

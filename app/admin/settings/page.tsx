"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  updateAdminProfileAction,
  getAdminsFromDbAction,
  getUploadMonitoringStatsAction,
  UploadMonitoringStats,
} from "@/actions/admin.actions";
import { getMaintenanceSettingsAction, saveMaintenanceSettingsAction } from "@/actions/settings.actions";
import { MaintenanceSettings, DEFAULT_MAINTENANCE_SETTINGS } from "@/lib/maintenance";
import { themeInput, themeBtnPrimary } from "@/lib/adminTheme";

const MAINTENANCE_MODULES: { id: keyof MaintenanceSettings["modules"]; label: string }[] = [
  { id: "exam_prep", label: "Exam Prep & Practice Quizzes" },
  { id: "mbs_billing", label: "MBS Billing & Fee Search" },
  { id: "medical_directory", label: "Medical Reference Directory" },
  { id: "clinical_content", label: "Clinical Templates & Autofills" },
  { id: "user_dashboard", label: "User Dashboard" },
  { id: "subscriptions", label: "Subscriptions & Payment Gateway" },
];

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

function ProfileSection({ itemVariants }: { itemVariants: any }) {
  const { currentAdmin, isSuperAdmin } = useAdminRole();

  // The cached id from localStorage can go stale (e.g. it still points at an old seed/mock id
  // that no longer exists as a real admin_users row). Resolve the real DB row for this admin by
  // id, falling back to username/email, so Save always writes to a genuine account.
  const [dbId, setDbId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setResolving(true);
    setResolveError(null);
    getAdminsFromDbAction()
      .then((admins) => {
        const match =
          admins.find((a) => a.id === currentAdmin.id) ||
          admins.find((a) => a.email?.toLowerCase() === currentAdmin.email?.toLowerCase());

        if (!match) {
          setResolveError("Couldn't find your admin account in the database. Please log out and log back in.");
          setDbId(null);
          return;
        }

        setDbId(match.id);
        setName(match.name || "");
        setUsername(match.username || "");
        setEmail(match.email || "");
      })
      .catch(() => {
        setResolveError("Failed to load your profile from the database.");
      })
      .finally(() => setResolving(false));
  }, [currentAdmin.id, currentAdmin.email]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!dbId) {
      setError(resolveError || "Your account could not be verified. Please log out and log back in.");
      return;
    }

    if (!name.trim() || !username.trim() || !email.trim()) {
      setError("Name, username, and email are required.");
      return;
    }

    if (showPasswordFields && (newPassword || confirmPassword || currentPassword)) {
      if (!currentPassword) {
        setError("Enter your current password to change your password.");
        return;
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirmation do not match.");
        return;
      }
    }

    setSaving(true);
    try {
      const result = await updateAdminProfileAction({
        id: dbId,
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        currentPassword: showPasswordFields && newPassword ? currentPassword : undefined,
        newPassword: showPasswordFields && newPassword ? newPassword : undefined,
      });

      if (!result.success) {
        setError(result.error || "Failed to update profile.");
        setSaving(false);
        return;
      }

      // Re-sync the session's cached admin list from the DB (the source of truth) so the topbar
      // and other localStorage-backed reads pick up the change immediately.
      if (typeof window !== "undefined") {
        try {
          const freshAdmins = await getAdminsFromDbAction();
          localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(freshAdmins));
          localStorage.setItem("gpedge_active_admin_id", dbId);
          window.dispatchEvent(new Event("gpedge_admin_changed"));
        } catch {}
      }

      setSuccess("Profile updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);
    } catch (err) {
      setError("An unexpected error occurred while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      id="profile"
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800/80 shadow-md shadow-slate-200/30 dark:shadow-slate-950/40 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-transparent via-transparent to-teal-50/5 dark:to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-800/60 flex items-center gap-2">
          <Lucide.UserCog className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">My Profile</h3>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {resolveError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-400 rounded-xl flex gap-2 items-start leading-relaxed">
              <Lucide.AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resolveError}</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-650 dark:text-red-400 rounded-xl flex gap-2 items-start leading-relaxed">
              <Lucide.AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-400 rounded-xl flex gap-2 items-start leading-relaxed">
              <Lucide.CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={`w-full px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`} placeholder="Username" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`} placeholder="Email address" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Role
                {!isSuperAdmin && <span className="ml-1.5 normal-case font-normal text-slate-400">(Super Admin only)</span>}
              </label>
              <input
                value={currentAdmin.role}
                disabled
                title="Your own role can only be changed by a different Super Admin account."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-800 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
            {!showPasswordFields ? (
              <button
                type="button"
                onClick={() => setShowPasswordFields(true)}
                className="text-xs font-bold text-teal-800 dark:text-teal-400 hover:opacity-80 transition-all flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 mt-3"
              >
                <Lucide.Lock className="w-3.5 h-3.5" />
                Change Password
              </button>
            ) : (
              <div className="mt-3 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Change Password</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordFields(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 uppercase tracking-wider bg-transparent border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={`w-full px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`} placeholder="Current password" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`} placeholder="New password" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`} placeholder="Confirm new password" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving || resolving || !dbId}
              className={`px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-2 border-none outline-none rounded-xl cursor-pointer ${themeBtnPrimary} hover:opacity-95 active:scale-[0.98] disabled:opacity-60`}
            >
              {saving ? (
                <>
                  <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Lucide.Save className="w-3.5 h-3.5" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function MaintenanceModeSection({ itemVariants }: { itemVariants: any }) {
  const { currentAdmin } = useAdminRole();

  const [settings, setSettings] = useState<MaintenanceSettings>(DEFAULT_MAINTENANCE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getMaintenanceSettingsAction()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const result = await saveMaintenanceSettingsAction(settings, currentAdmin.id);
      if (!result.success) {
        setError(result.message || "Failed to save maintenance settings.");
        return;
      }
      if (result.settings) setSettings(result.settings);
      setSuccess("Maintenance settings saved. Changes apply to users on their next page load.");
    } catch {
      setError("An unexpected error occurred while saving maintenance settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateModule = (id: keyof MaintenanceSettings["modules"], patch: Partial<{ enabled: boolean; customMessage: string }>) => {
    setSettings((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [id]: {
          enabled: false,
          ...prev.modules[id],
          ...patch,
        },
      },
    }));
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800/80 shadow-md shadow-slate-200/30 dark:shadow-slate-950/40 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-transparent via-transparent to-teal-50/5 dark:to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-800/60 flex items-center gap-2">
          <Lucide.Wrench className="w-4 h-4 text-slate-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Maintenance Mode</h3>
            <p className="text-xs text-slate-400 mt-0.5">Hide a section from users while you make backend changes to it. Turn it back off to make it visible again.</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-650 dark:text-red-400 rounded-xl flex gap-2 items-start leading-relaxed">
              <Lucide.AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-400 rounded-xl flex gap-2 items-start leading-relaxed">
              <Lucide.CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="text-xs text-slate-400 py-4 text-center">Loading maintenance settings...</div>
          ) : (
            <>
              <div className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Global Maintenance Mode</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Blocks the entire user-facing site, not just one section.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, globalEnabled: !prev.globalEnabled }))}
                    className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0 ${settings.globalEnabled ? "bg-amber-500" : "bg-[#e9e9eb] dark:bg-slate-800"}`}
                  >
                    <motion.div
                      animate={{ x: settings.globalEnabled ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)]"
                    />
                  </button>
                </div>
                {settings.globalEnabled && (
                  <textarea
                    value={settings.globalMessage}
                    onChange={(e) => setSettings((prev) => ({ ...prev, globalMessage: e.target.value }))}
                    rows={2}
                    className={`w-full mt-3 px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all resize-none ${themeInput}`}
                    placeholder="Message shown to users while the site is offline"
                  />
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden">
                {MAINTENANCE_MODULES.map((mod) => {
                  const modSettings = settings.modules[mod.id];
                  const enabled = Boolean(modSettings?.enabled);
                  return (
                    <div key={mod.id} className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{mod.label}</p>
                        <button
                          type="button"
                          disabled={settings.globalEnabled}
                          onClick={() => updateModule(mod.id, { enabled: !enabled })}
                          title={settings.globalEnabled ? "Global maintenance is already blocking all sections" : undefined}
                          className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0 ${enabled ? "bg-amber-500" : "bg-[#e9e9eb] dark:bg-slate-800"} ${settings.globalEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <motion.div
                            animate={{ x: enabled ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)]"
                          />
                        </button>
                      </div>
                      {enabled && (
                        <input
                          value={modSettings?.customMessage || ""}
                          onChange={(e) => updateModule(mod.id, { customMessage: e.target.value })}
                          className={`w-full mt-3 px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                          placeholder="Message shown to users for this section"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-2 border-none outline-none rounded-xl cursor-pointer ${themeBtnPrimary} hover:opacity-95 active:scale-[0.98] disabled:opacity-60`}
                >
                  {saving ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Lucide.Save className="w-3.5 h-3.5" />
                      Save Maintenance Settings
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function UploadMonitoringSection({ itemVariants }: { itemVariants: any }) {
  const [stats, setStats] = useState<UploadMonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUploadMonitoringStatsAction()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800/80 p-6 shadow-md shadow-slate-200/30 dark:shadow-slate-950/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-transparent via-transparent to-teal-50/5 dark:to-transparent pointer-events-none" />
      <div className="relative z-10">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Upload Monitoring</h3>
        {loading ? (
          <div className="text-xs text-slate-400 py-4 text-center">Loading storage stats...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Storage Used</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatBytes(stats?.totalStorageBytes || 0)}</p>
              <p className="text-xs text-slate-400">{stats?.totalFiles ?? 0} files total</p>
            </div>
            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Files Uploaded</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats?.filesUploadedThisMonth ?? 0}</p>
              <p className="text-xs text-slate-400">this month</p>
            </div>
            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Largest File</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats?.largestFile ? formatBytes(stats.largestFile.sizeBytes) : "—"}</p>
              <p className="text-xs text-slate-400 truncate">{stats?.largestFile?.name || "No files uploaded yet"}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { isReadOnly, isSuperAdmin } = useAdminRole();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="System"
        highlightedText="Settings"
        subtitle="Your profile and system storage metrics"
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
              You are signed in under the <strong>Viewer</strong> role. You have full read-only access to all sections and data.
            </p>
          </div>
        </motion.div>
      )}

      {/* --- PROFILE --- */}
      <ProfileSection itemVariants={itemVariants} />

      {/* --- MAINTENANCE MODE (Super Admin only) --- */}
      {isSuperAdmin && <MaintenanceModeSection itemVariants={itemVariants} />}

      {/* --- UPLOAD MONITORING --- */}
      <UploadMonitoringSection itemVariants={itemVariants} />
    </motion.div>
  );
}

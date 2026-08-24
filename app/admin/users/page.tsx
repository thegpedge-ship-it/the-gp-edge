"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { getAdminUsers, saveAdminUsers, fetchAdminUsersFromDb, AdminUser } from "@/lib/quizData";
import {
  toggleUserStatusInDbAction,
  updateUserRoleInDbAction,
} from "@/actions/admin.actions";
import { ROLE_DEFINITIONS } from "@/lib/roles";
import { useAdminRole } from "@/hooks/useAdminRole";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

type FilterType = "all" | "active" | "suspended" | "deactivated" | "trial" | "lapsed" | "premium" | "free";
type RoleFilterType = "all" | "SA" | "CE" | "OM" | "DR" | "PR" | "SUB";

/** Masks a learner's name/email for roles without the "can view learner-identifiable data" grant. */
function maskPiiName(name: string): string {
  return name
    .split(" ")
    .map((part) => (part ? `${part[0]}${"*".repeat(Math.max(part.length - 1, 2))}` : part))
    .join(" ");
}
function maskPiiEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "••••••";
  return `${(local || "").slice(0, 1)}${"*".repeat(Math.max((local || "").length - 1, 2))}@${domain}`;
}

export default function UsersPage() {
  const { isReadOnly, isSuperAdmin, isOperationsManager, canManageUsers, canViewLearnerPii } = useAdminRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [confirmUser, setConfirmUser] = useState<{ user: AdminUser; action: "suspend" | "activate" | "deactivate" } | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  useEffect(() => {
    // Load local cache immediately for instant UI
    setUsers(getAdminUsers());

    // Fetch real users from Neon DB
    fetchAdminUsersFromDb()
      .then((realUsers) => {
        setUsers(realUsers);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: string, newRole: "SA" | "CE" | "OM" | "DR" | "PR" | "SUB") => {
    if (isReadOnly || (!isSuperAdmin && !isOperationsManager)) return;
    setUpdatingRoleId(userId);
    try {
      await updateUserRoleInDbAction(userId, newRole);
      const roleInfo = ROLE_DEFINITIONS[newRole] || ROLE_DEFINITIONS.SUB;
      const updated = users.map((u) =>
        String(u.id) === userId ? { ...u, role: newRole, roleTitle: roleInfo.title, roles: [newRole] } : u
      );
      setUsers(updated);
      saveAdminUsers(updated);
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const userRole = (u.role || "SUB").toUpperCase();
    const matchesRole = roleFilter === "all" || userRole === roleFilter;

    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.roleTitle && u.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && (u.status === "active" || !u.status)) ||
      (filter === "suspended" && u.status === "suspended") ||
      (filter === "deactivated" && u.status === "deactivated") ||
      (filter === "trial" && (u.status === "trial" || u.plan === "free")) ||
      (filter === "lapsed" && u.status === "lapsed") ||
      (filter === "premium" && u.plan === "premium") ||
      (filter === "free" && u.plan === "free");

    return matchesRole && matchesSearch && matchesFilter;
  });

  const visibleUsers = filteredUsers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredUsers.length;

  const promptStatusChange = (user: AdminUser, action: "suspend" | "activate" | "deactivate") => {
    if (isReadOnly) return;
    setConfirmUser({ user, action });
  };

  const executeStatusChange = async () => {
    if (!confirmUser) return;
    const { user: targetUser, action } = confirmUser;
    const newStatus: AdminUser["status"] =
      action === "activate" ? "active" : action === "deactivate" ? "deactivated" : "suspended";

    // Optimistic UI update
    const updated = users.map((u) =>
      u.id === targetUser.id ? { ...u, status: newStatus } : u
    );
    setUsers(updated);
    saveAdminUsers(updated);
    setConfirmUser(null);

    // Sync to DB
    await toggleUserStatusInDbAction(String(targetUser.id), newStatus);
  };

  const premiumCount = users.filter((u) => u.plan === "premium").length;
  const freeCount = users.filter((u) => u.plan === "free").length;
  const activeCount = users.filter((u) => u.status === "active" || !u.status).length;
  const suspendedCount = users.filter((u) => u.status === "suspended").length;
  const deactivatedCount = users.filter((u) => u.status === "deactivated").length;
  const premiumRate = users.length > 0 ? Math.round((premiumCount / users.length) * 100) : 0;

  // Role counts
  const saCount = users.filter((u) => (u.role || "").toUpperCase() === "SA").length;
  const ceCount = users.filter((u) => (u.role || "").toUpperCase() === "CE").length;
  const omCount = users.filter((u) => (u.role || "").toUpperCase() === "OM").length;
  const drCount = users.filter((u) => (u.role || "").toUpperCase() === "DR").length;
  const prCount = users.filter((u) => (u.role || "").toUpperCase() === "PR").length;
  const subCount = users.filter((u) => (u.role || "SUB").toUpperCase() === "SUB").length;

  const roleFilters: { label: string; code: RoleFilterType; count: number }[] = [
    { label: "All Roles", code: "all", count: users.length },
    { label: "SA (Super Admin)", code: "SA", count: saCount },
    { label: "CE (Clinical Editor)", code: "CE", count: ceCount },
    { label: "OM (Operations Manager)", code: "OM", count: omCount },
    { label: "DR (Drafter)", code: "DR", count: drCount },
    { label: "PR (Peer Reviewer)", code: "PR", count: prCount },
    { label: "SUB (Subscriber)", code: "SUB", count: subCount },
  ];

  const filters: { label: string; value: FilterType; count: number }[] = [
    { label: "All Status", value: "all", count: users.length },
    { label: "Active", value: "active", count: activeCount },
    { label: "Suspended", value: "suspended", count: suspendedCount },
    { label: "Deactivated", value: "deactivated", count: deactivatedCount },
    { label: "Premium", value: "premium", count: premiumCount },
    { label: "Free", value: "free", count: freeCount },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="User & Contributor"
        highlightedText="Governance"
        subtitle="Role matrices (SA, CE, OM, DR, PR, SUB), permissions, and account lifecycle management"
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
              You are signed in under the <strong>Viewer</strong> role. You have full read-only access to all sections and data, but suspending or reinstating accounts is restricted.
            </p>
          </div>
        </motion.div>
      )}

      {/* KPI row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Accounts"
          percentage={`${activeCount} active`}
          data={String(users.length)}
          progress={Math.round((activeCount / Math.max(users.length, 1)) * 100)}
        />
        <AnalyticsCard
          title="Premium Subscribers"
          percentage={`${premiumRate}% conversion`}
          data={String(premiumCount)}
          progress={premiumRate}
        />
        <AnalyticsCard
          title="Free Tier Accounts"
          percentage={`${100 - premiumRate}% of base`}
          data={String(freeCount)}
          progress={100 - premiumRate}
        />
        <AnalyticsCard
          title="Suspended Accounts"
          percentage={suspendedCount > 0 ? "Requires review" : "None pending"}
          data={String(suspendedCount)}
          progress={Math.round((suspendedCount / Math.max(users.length, 1)) * 100)}
        />
      </motion.div>

      {/* Plan distribution bar */}
      <motion.div
        variants={itemVariants}
        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800 p-5 shadow-md shadow-slate-200/30 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-slate-900/85 via-transparent to-teal-50/5 dark:to-teal-950/10 pointer-events-none rounded-2xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subscription Distribution</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{users.length} total accounts</p>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200/50 px-3 py-1 rounded-full dark:text-teal-400 dark:bg-teal-950/30 dark:border-teal-900/40">
              MRR contribution: {premiumCount} × $24–199
            </span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-teal-600 transition-all duration-700"
              style={{ width: `${premiumRate}%` }}
              title={`Premium: ${premiumCount} (${premiumRate}%)`}
            />
            <div
              className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-700"
              style={{ width: `${100 - premiumRate}%` }}
              title={`Free: ${freeCount} (${100 - premiumRate}%)`}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              Premium — {premiumCount} accounts ({premiumRate}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
              Free — {freeCount} accounts ({100 - premiumRate}%)
            </span>
          </div>
        </div>
      </motion.div>

      {/* Role Filters + Status Filters + Search */}
      <motion.div variants={itemVariants} className="space-y-3">
        {/* Role Matrix Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap bg-slate-50/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
            <Lucide.Shield className="w-3.5 h-3.5" /> Role:
          </span>
          {roleFilters.map((rf) => {
            const isSelected = roleFilter === rf.code;
            const def = rf.code !== "all" ? ROLE_DEFINITIONS[rf.code] : null;
            return (
              <button
                key={rf.code}
                onClick={() => setRoleFilter(rf.code)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? def
                      ? `${def.bg} ${def.color} ${def.border} shadow-sm font-bold`
                      : "bg-teal-700 text-white border-teal-700 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                }`}
              >
                {rf.code !== "all" && (
                  <span className="font-mono text-[10px] font-extrabold px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">
                    {rf.code}
                  </span>
                )}
                {rf.label}
                <span className="text-[10px] opacity-75 font-mono">({rf.count})</span>
              </button>
            );
          })}
        </div>

        {/* Search and Status Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, account ID, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 dark:text-slate-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  filter === f.value
                    ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-[10px] opacity-60 font-mono">({f.count})</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Accounts table */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/40">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  Account
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">
                  Role (Matrix 3G)
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">
                  Plan
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">
                  Joined
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleUsers.map((user) => {
                const userRole = (user.role || "SUB").toUpperCase();
                const roleMeta = ROLE_DEFINITIONS[userRole] || ROLE_DEFINITIONS.SUB;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/50 dark:border-teal-900/40 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {canViewLearnerPii ? user.name : maskPiiName(user.name)}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">ID #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isSuperAdmin ? (
                        <select
                          value={userRole}
                          disabled={updatingRoleId === String(user.id)}
                          onChange={(e) => handleRoleChange(String(user.id), e.target.value as any)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${roleMeta.bg} ${roleMeta.color} ${roleMeta.border} focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer font-sans`}
                        >
                          <option value="SA">SA — Super Admin</option>
                          <option value="CE">CE — Clinical Editor</option>
                          <option value="OM">OM — Operations Manager</option>
                          <option value="DR">DR — Drafter</option>
                          <option value="PR">PR — Peer Reviewer</option>
                          <option value="SUB">SUB — Subscriber</option>
                        </select>
                      ) : isOperationsManager && (userRole === "DR" || userRole === "PR") ? (
                        <select
                          value={userRole}
                          disabled={updatingRoleId === String(user.id)}
                          onChange={(e) => handleRoleChange(String(user.id), e.target.value as any)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${roleMeta.bg} ${roleMeta.color} ${roleMeta.border} focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer font-sans`}
                        >
                          <option value="DR">DR — Drafter</option>
                          <option value="PR">PR — Peer Reviewer</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md border ${roleMeta.bg} ${roleMeta.color} ${roleMeta.border}`}>
                          <span className="font-mono font-bold">{userRole}</span>
                          <span className="opacity-80">· {roleMeta.title}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge variant={user.plan} showDot={false} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{user.joined}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity duration-200">
                      {user.status === "active" || !user.status ? (
                        <>
                          <button
                            onClick={() => !isReadOnly && promptStatusChange(user, "suspend")}
                            disabled={isReadOnly}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isReadOnly
                                ? "opacity-30 cursor-not-allowed text-slate-300"
                                : "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            }`}
                            title={isReadOnly ? "View-Only Mode" : "Suspend user account"}
                          >
                            <svg className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                          </button>
                          <button
                            onClick={() => !isReadOnly && promptStatusChange(user, "deactivate")}
                            disabled={isReadOnly}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isReadOnly
                                ? "opacity-30 cursor-not-allowed text-slate-300"
                                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            }`}
                            title={isReadOnly ? "View-Only Mode" : "Deactivate contributor account (Rule R8 history preserved)"}
                          >
                            <svg className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => !isReadOnly && promptStatusChange(user, "activate")}
                          disabled={isReadOnly}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            isReadOnly
                              ? "opacity-30 cursor-not-allowed text-slate-300"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          }`}
                          title={isReadOnly ? "View-Only Mode" : "Reactivate user account"}
                        >
                          <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No accounts match the selected filter.</p>
          </div>
        )}
        {/* See More button at bottom */}
        {hasMore && (
          <div className="p-4 flex justify-center border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 select-none">
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="px-6 py-2.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 dark:text-teal-400 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 border border-teal-200/60 dark:border-teal-900/50 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <span>See More Accounts</span>
              <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
        {/* Table footer with count */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing {visibleUsers.length} of {filteredUsers.length} accounts
          </p>
          <p className="text-xs text-slate-400">
            {premiumCount} premium · {freeCount} free · {activeCount} active · {suspendedCount} suspended · {deactivatedCount} deactivated
          </p>
        </div>
      </motion.div>

      {/* Confirmation Warning Modal */}
      <AnimatePresence>
        {confirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 select-none"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    confirmUser.action === "deactivate"
                      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
                      : confirmUser.action === "suspend"
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
                      : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                  }`}
                >
                  {confirmUser.action === "deactivate" ? (
                    <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ) : confirmUser.action === "suspend" ? (
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize">
                    Confirm Account {confirmUser.action === "activate" ? "Activation" : confirmUser.action === "deactivate" ? "Deactivation" : "Suspension"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Final Confirmation Required</p>
                </div>
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                <p>
                  Are you sure you want to {confirmUser.action}{" "}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {canViewLearnerPii ? confirmUser.user.name : maskPiiName(confirmUser.user.name)}
                  </strong>{" "}
                  ({canViewLearnerPii ? confirmUser.user.email : maskPiiEmail(confirmUser.user.email)})?
                </p>
                {confirmUser.action === "deactivate" && (
                  <p className="text-xs bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 font-medium">
                    <strong>Rule R8 Notice:</strong> Access will be revoked immediately. Attribution, version history, and sign-off records remain permanently intact in the system.
                  </p>
                )}
                {confirmUser.action === "suspend" && (
                  <p className="text-xs bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                    Access is frozen while records remain intact. The user can be reinstated later.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmUser(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeStatusChange}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer capitalize ${
                    confirmUser.action === "deactivate"
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                      : confirmUser.action === "suspend"
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                      : "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20"
                  }`}
                >
                  Yes, {confirmUser.action} Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

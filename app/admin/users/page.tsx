"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { getAdminUsers, saveAdminUsers, AdminUser } from "@/lib/quizData";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

type FilterType = "all" | "active" | "suspended" | "premium" | "free";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    setUsers(getAdminUsers());
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.id).includes(searchQuery);
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && u.status === "active") ||
      (filter === "suspended" && u.status === "suspended") ||
      (filter === "premium" && u.plan === "premium") ||
      (filter === "free" && u.plan === "free");
    return matchesSearch && matchesFilter;
  });

  const toggleSuspend = (userId: number) => {
    const updated = users.map((u) =>
      u.id === userId
        ? { ...u, status: u.status === "active" ? ("suspended" as const) : ("active" as const) }
        : u
    );
    setUsers(updated);
    saveAdminUsers(updated);
  };

  const premiumCount = users.filter((u) => u.plan === "premium").length;
  const freeCount = users.filter((u) => u.plan === "free").length;
  const activeCount = users.filter((u) => u.status === "active").length;
  const suspendedCount = users.filter((u) => u.status === "suspended").length;
  const premiumRate = users.length > 0 ? Math.round((premiumCount / users.length) * 100) : 0;

  const filters: { label: string; value: FilterType; count: number }[] = [
    { label: "All", value: "all", count: users.length },
    { label: "Active", value: "active", count: activeCount },
    { label: "Suspended", value: "suspended", count: suspendedCount },
    { label: "Premium", value: "premium", count: premiumCount },
    { label: "Free", value: "free", count: freeCount },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Subscriber"
        highlightedText="Management"
        subtitle="Account status, plan distribution, and subscription operations"
        variants={itemVariants}
      />

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

      {/* Filters + search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
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
            placeholder="Search by account ID..."
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                filter === f.value
                  ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] opacity-60">{f.count}</span>
            </button>
          ))}
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
                  Plan
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">
                  Last Active
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">
                  Joined
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">
                  Notes
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => (
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
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">ID #{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge variant={user.plan} showDot={false} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{user.lastActive}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{user.joined}</span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge variant={user.status} />
                  </td>
                  <td className="px-4 py-4">
                    {user.notes && user.notes.length > 0 ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400 italic">{user.notes[0]}</span>
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => toggleSuspend(user.id)}
                        className={`p-1.5 rounded-lg transition-all ${
                          user.status === "active"
                            ? "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        }`}
                        title={user.status === "active" ? "Suspend account" : "Reinstate account"}
                      >
                        {user.status === "active" ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No accounts match the selected filter.</p>
          </div>
        )}
        {/* Table footer with count */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing {filteredUsers.length} of {users.length} accounts
          </p>
          <p className="text-xs text-slate-400">
            {premiumCount} premium · {freeCount} free · {suspendedCount} suspended
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
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

const avatarGradients = [
  "from-teal-400 to-emerald-500",
  "from-emerald-500 to-green-600",
  "from-slate-400 to-slate-500",
  "from-teal-500 to-teal-600",
  "from-green-400 to-emerald-500",
  "from-slate-500 to-slate-600",
];

export default function UsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    setUsers(getAdminUsers());
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
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
      u.id === userId ? { ...u, status: u.status === "active" ? ("suspended" as const) : ("active" as const) } : u
    );
    setUsers(updated);
    saveAdminUsers(updated);
  };

  const filters: { label: string; value: FilterType; count: number }[] = [
    { label: "All", value: "all", count: users.length },
    { label: "Active", value: "active", count: users.filter((u) => u.status === "active").length },
    { label: "Suspended", value: "suspended", count: users.filter((u) => u.status === "suspended").length },
    { label: "Premium", value: "premium", count: users.filter((u) => u.plan === "premium").length },
    { label: "Free", value: "free", count: users.filter((u) => u.plan === "free").length },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="User"
        highlightedText="Management"
        subtitle={`${users.length} registered users across all plans`}
        actions={
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
            <span>{users.filter(u => u.status === "active").length} active</span>
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
          </div>
        }
        variants={itemVariants}
      />

      {/* Filters + search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 dark:text-slate-100 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                filter === f.value
                  ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-700"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* User table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">User</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Last Active</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Joined</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user, idx) => {
                const gradient = avatarGradients[idx % avatarGradients.length];
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${user.id}`); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all"
                          title="View"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSuspend(user.id); }}
                          className={`p-1.5 rounded-lg transition-all ${user.status === "active" ? "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"}`}
                          title={user.status === "active" ? "Suspend" : "Unsuspend"}
                        >
                          {user.status === "active" ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No users found matching your criteria.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

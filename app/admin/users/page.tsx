"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

interface User {
  id: number;
  name: string;
  email: string;
  plan: "premium" | "free";
  lastActive: string;
  status: "active" | "suspended";
  joined: string;
  notes: string[];
}

const mockUsers: User[] = [
  { id: 1, name: "Dr. Sarah Chen", email: "sarah.chen@gmail.com", plan: "premium", lastActive: "2 mins ago", status: "active", joined: "12 Jan 2026", notes: [] },
  { id: 2, name: "Dr. James Wilson", email: "j.wilson@outlook.com", plan: "premium", lastActive: "1 hour ago", status: "active", joined: "3 Feb 2026", notes: ["VIP user — supervisor referral"] },
  { id: 3, name: "Dr. Priya Sharma", email: "priya.sharma@hotmail.com", plan: "free", lastActive: "3 hours ago", status: "active", joined: "18 Feb 2026", notes: [] },
  { id: 4, name: "Dr. Michael Torres", email: "m.torres@gmail.com", plan: "premium", lastActive: "5 hours ago", status: "active", joined: "7 Dec 2025", notes: [] },
  { id: 5, name: "Dr. Emily Watson", email: "emily.w@yahoo.com", plan: "free", lastActive: "1 day ago", status: "active", joined: "28 Mar 2026", notes: [] },
  { id: 6, name: "Dr. Alex Kumar", email: "alex.kumar@gmail.com", plan: "free", lastActive: "3 days ago", status: "suspended", joined: "15 Apr 2026", notes: ["Flagged for ToS violation"] },
  { id: 7, name: "Dr. Rachel Green", email: "r.green@outlook.com", plan: "premium", lastActive: "30 mins ago", status: "active", joined: "20 Jan 2026", notes: [] },
  { id: 8, name: "Dr. Tom Baker", email: "tom.baker@gmail.com", plan: "free", lastActive: "2 days ago", status: "active", joined: "9 Mar 2026", notes: [] },
  { id: 9, name: "Dr. Nina Patel", email: "nina.p@hotmail.com", plan: "premium", lastActive: "6 hours ago", status: "active", joined: "14 Feb 2026", notes: [] },
  { id: 10, name: "Dr. David Kim", email: "d.kim@gmail.com", plan: "free", lastActive: "5 days ago", status: "active", joined: "2 May 2026", notes: [] },
  { id: 11, name: "Dr. Laura Simmons", email: "laura.s@yahoo.com", plan: "premium", lastActive: "15 mins ago", status: "active", joined: "1 Nov 2025", notes: ["Top performer"] },
  { id: 12, name: "Dr. Chris Martin", email: "c.martin@outlook.com", plan: "free", lastActive: "1 week ago", status: "suspended", joined: "22 Apr 2026", notes: ["Inactive — possible churn risk"] },
];

type FilterType = "all" | "active" | "suspended" | "premium" | "free";

/* ---------- Avatar gradient colors ---------- */
const avatarGradients = [
  "from-teal-400 to-emerald-500",
  "from-emerald-500 to-green-600",
  "from-slate-400 to-slate-500",
  "from-teal-500 to-teal-600",
  "from-green-400 to-emerald-500",
  "from-slate-500 to-slate-600",
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [noteInput, setNoteInput] = useState("");

  // Lock body scroll when drawer is open to prevent background scrolling lag
  useEffect(() => {
    if (selectedUser) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedUser]);

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
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === "active" ? "suspended" as const : "active" as const } : u
      )
    );
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) =>
        prev ? { ...prev, status: prev.status === "active" ? "suspended" as const : "active" as const } : prev
      );
    }
  };

  const addNote = (userId: number) => {
    if (!noteInput.trim()) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, notes: [...u.notes, noteInput.trim()] } : u))
    );
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) =>
        prev ? { ...prev, notes: [...prev.notes, noteInput.trim()] } : prev
      );
    }
    setNoteInput("");
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
                    onClick={() => setSelectedUser(user)}
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
                          onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
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

      {/* User detail slide-over */}
      <AnimatePresence>
        {selectedUser && (
          <div key="admin-user-drawer-container" className="fixed inset-0 z-50 pointer-events-none">
            <motion.div
              key="admin-user-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto cursor-pointer"
              onClick={() => setSelectedUser(null)}
            />
            <motion.div
              key="admin-user-drawer-content"
              initial={{ x: "calc(100% + 2rem)", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "calc(100% + 2rem)", opacity: 0 }}
              transition={{ type: "spring", damping: 34, stiffness: 280, mass: 0.9 }}
              className="fixed right-4 top-4 bottom-4 w-[calc(100%-2rem)] max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
            >
              {/* Decorative top accent line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />

              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 relative flex-shrink-0 bg-white/40 dark:bg-slate-900/40">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-5 right-5 p-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 group"
                >
                  <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-base font-bold shadow-sm">
                    {selectedUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 leading-tight">{selectedUser.name}</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge variant={selectedUser.status} />
                  <StatusBadge variant={selectedUser.plan} showDot={false} />
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800 p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-1">Last Active</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedUser.lastActive}</p>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800 p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-1">Joined</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedUser.joined}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Actions</h3>
                  <button
                    onClick={() => toggleSuspend(selectedUser.id)}
                    className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      selectedUser.status === "active"
                        ? "border-red-200/60 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15"
                        : "border-emerald-200/60 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/15"
                    }`}
                  >
                    {selectedUser.status === "active" ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        Suspend User
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Unsuspend User
                      </>
                    )}
                  </button>
                  <button className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Reset Stuck Sessions
                  </button>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Admin Notes</h3>
                  {selectedUser.notes.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {selectedUser.notes.map((note, i) => (
                        <div key={i} className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-xl px-3.5 py-2.5 text-xs text-teal-800 dark:text-teal-300 font-medium leading-relaxed">
                          {note}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-medium">No notes yet.</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addNote(selectedUser.id)}
                      placeholder="Add a note..."
                      className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 dark:text-slate-100 transition-all"
                    />
                    <button
                      onClick={() => addNote(selectedUser.id)}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold rounded-xl hover:shadow-md hover:shadow-teal-500/10 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

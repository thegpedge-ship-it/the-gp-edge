"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

interface User {
  id: number;
  name: string;
  email: string;
  plan: "premium" | "free";
  readiness: number;
  weakTopic: string;
  lastActive: string;
  status: "active" | "suspended";
  quizzes: number;
  joined: string;
  notes: string[];
}

const mockUsers: User[] = [
  { id: 1, name: "Dr. Sarah Chen", email: "sarah.chen@gmail.com", plan: "premium", readiness: 91, weakTopic: "Dermatology", lastActive: "2 mins ago", status: "active", quizzes: 87, joined: "12 Jan 2026", notes: [] },
  { id: 2, name: "Dr. James Wilson", email: "j.wilson@outlook.com", plan: "premium", readiness: 85, weakTopic: "Mental Health", lastActive: "1 hour ago", status: "active", quizzes: 64, joined: "3 Feb 2026", notes: ["VIP user — supervisor referral"] },
  { id: 3, name: "Dr. Priya Sharma", email: "priya.sharma@hotmail.com", plan: "free", readiness: 72, weakTopic: "Paediatrics", lastActive: "3 hours ago", status: "active", quizzes: 45, joined: "18 Feb 2026", notes: [] },
  { id: 4, name: "Dr. Michael Torres", email: "m.torres@gmail.com", plan: "premium", readiness: 90, weakTopic: "Women's Health", lastActive: "5 hours ago", status: "active", quizzes: 102, joined: "7 Dec 2025", notes: [] },
  { id: 5, name: "Dr. Emily Watson", email: "emily.w@yahoo.com", plan: "free", readiness: 58, weakTopic: "Cardiology", lastActive: "1 day ago", status: "active", quizzes: 23, joined: "28 Mar 2026", notes: [] },
  { id: 6, name: "Dr. Alex Kumar", email: "alex.kumar@gmail.com", plan: "free", readiness: 44, weakTopic: "Mental Health", lastActive: "3 days ago", status: "suspended", quizzes: 12, joined: "15 Apr 2026", notes: ["Flagged for ToS violation"] },
  { id: 7, name: "Dr. Rachel Green", email: "r.green@outlook.com", plan: "premium", readiness: 88, weakTopic: "Endocrine", lastActive: "30 mins ago", status: "active", quizzes: 76, joined: "20 Jan 2026", notes: [] },
  { id: 8, name: "Dr. Tom Baker", email: "tom.baker@gmail.com", plan: "free", readiness: 65, weakTopic: "Respiratory", lastActive: "2 days ago", status: "active", quizzes: 34, joined: "9 Mar 2026", notes: [] },
  { id: 9, name: "Dr. Nina Patel", email: "nina.p@hotmail.com", plan: "premium", readiness: 79, weakTopic: "Musculoskeletal", lastActive: "6 hours ago", status: "active", quizzes: 53, joined: "14 Feb 2026", notes: [] },
  { id: 10, name: "Dr. David Kim", email: "d.kim@gmail.com", plan: "free", readiness: 51, weakTopic: "Dermatology", lastActive: "5 days ago", status: "active", quizzes: 18, joined: "2 May 2026", notes: [] },
  { id: 11, name: "Dr. Laura Simmons", email: "laura.s@yahoo.com", plan: "premium", readiness: 93, weakTopic: "Gastroenterology", lastActive: "15 mins ago", status: "active", quizzes: 112, joined: "1 Nov 2025", notes: ["Top performer"] },
  { id: 12, name: "Dr. Chris Martin", email: "c.martin@outlook.com", plan: "free", readiness: 38, weakTopic: "Mental Health", lastActive: "1 week ago", status: "suspended", quizzes: 8, joined: "22 Apr 2026", notes: ["Inactive — possible churn risk"] },
];

type FilterType = "all" | "active" | "suspended" | "premium" | "free";
type ViewMode = "grid" | "table";

/* ---------- Readiness Gauge Ring ---------- */
function ReadinessRing({ value, size = 72 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const color =
    value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";
  const trailColor =
    value >= 80 ? "#d1fae5" : value >= 60 ? "#fef3c7" : "#fee2e2";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trailColor} strokeWidth="5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{value}%</span>
        <span className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold">Ready</span>
      </div>
    </div>
  );
}

/* ---------- Avatar gradient colors ---------- */
const avatarGradients = [
  "from-teal-400 to-emerald-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-cyan-500",
  "from-indigo-400 to-blue-500",
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [noteInput, setNoteInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
    { label: "All Users", value: "all", count: users.length },
    { label: "Active", value: "active", count: users.filter((u) => u.status === "active").length },
    { label: "Suspended", value: "suspended", count: users.filter((u) => u.status === "suspended").length },
    { label: "Premium", value: "premium", count: users.filter((u) => u.plan === "premium").length },
    { label: "Free", value: "free", count: users.filter((u) => u.plan === "free").length },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-8 shadow-xl shadow-teal-900/10 flex items-center justify-between gap-6 flex-wrap"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/[0.04] rounded-full pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-36 h-36 bg-white/[0.03] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-serif text-2xl lg:text-3xl font-normal text-white tracking-tight leading-tight mb-1">User Management</h1>
          <p className="text-sm text-teal-100 font-light">{users.length} registered users across all plans</p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            <span className="text-xs font-semibold text-teal-200">{users.filter(u => u.status === "active").length} active</span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* Filters, search & view toggle */}
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
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                filter === f.value
                  ? "bg-teal-50 text-teal-700 border-teal-200"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 flex-shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            title="Card View"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            title="Table View"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
        </div>
      </motion.div>

      {/* ========== CARD GRID VIEW ========== */}
      {viewMode === "grid" && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredUsers.map((user, idx) => {
            const gradient = avatarGradients[idx % avatarGradients.length];
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setSelectedUser(user)}
                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-md shadow-slate-200/40 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-200/60 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Decorative gradient top bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${user.status === "suspended" ? "from-red-400 to-rose-500" : user.plan === "premium" ? "from-amber-400 via-yellow-300 to-amber-500" : "from-teal-400 to-emerald-500"}`} />

                <div className="p-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-teal-500/15 flex-shrink-0`}>
                        {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusBadge variant={user.status} />
                      <StatusBadge variant={user.plan} showDot={false} />
                    </div>
                  </div>

                  {/* Center: Readiness Gauge */}
                  <div className="flex items-center justify-center mb-5">
                    <ReadinessRing value={user.readiness} />
                  </div>

                  {/* Footer Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-50/80 rounded-xl p-2.5 text-center">
                      <p className="text-xs font-bold text-slate-700">{user.quizzes}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Quizzes</p>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-2.5 text-center">
                      <p className="text-[11px] font-semibold text-slate-600 leading-tight">{user.lastActive}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Last Seen</p>
                    </div>
                    <div className="bg-rose-50/80 rounded-xl p-2.5 text-center border border-rose-100/60">
                      <p className="text-[11px] font-semibold text-rose-600 leading-tight truncate">{user.weakTopic}</p>
                      <p className="text-[9px] text-rose-400 font-medium uppercase tracking-wider">Weak</p>
                    </div>
                  </div>

                  {/* Hover actions slide-up */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100/60">
                    <span className="text-[10px] text-slate-400 font-medium">Joined {user.joined}</span>
                    <div className="flex items-center gap-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
                        title="View Profile"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSuspend(user.id); }}
                        className={`p-1.5 rounded-lg transition-all ${user.status === "active" ? "text-slate-400 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                        title={user.status === "active" ? "Suspend" : "Unsuspend"}
                      >
                        {user.status === "active" ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notes indicator */}
                  {user.notes.length > 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/60">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" clipRule="evenodd" /></svg>
                        {user.notes.length}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ========== TABLE VIEW ========== */}
      {viewMode === "table" && (
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/40">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Plan</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Readiness</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Weak Topic</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Last Active</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge variant={user.plan} showDot={false} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              user.readiness >= 80 ? "bg-emerald-500" : user.readiness >= 60 ? "bg-amber-400" : "bg-red-400"
                            }`}
                            style={{ width: `${user.readiness}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{user.readiness}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">{user.weakTopic}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-500">{user.lastActive}</span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge variant={user.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
                          title="View Profile"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button
                          onClick={() => toggleSuspend(user.id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            user.status === "active"
                              ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
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
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-400">No users found matching your criteria.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state for grid */}
      {viewMode === "grid" && filteredUsers.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400">No users found matching your criteria.</p>
        </div>
      )}

      {/* User detail slide-over */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              onClick={() => setSelectedUser(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white/95 backdrop-blur-2xl border-l border-white z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                {/* Close button */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Profile header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-teal-500/20">
                    {selectedUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-normal font-serif text-slate-900 leading-tight">{selectedUser.name}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Status & Plan */}
                <div className="flex items-center gap-2 mb-6">
                  <StatusBadge variant={selectedUser.status} />
                  <StatusBadge variant={selectedUser.plan} showDot={false} />
                </div>

                {/* Readiness gauge centered */}
                <div className="flex justify-center mb-6">
                  <ReadinessRing value={selectedUser.readiness} size={100} />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Readiness Score</p>
                    <p className="text-2xl font-bold text-slate-900">{selectedUser.readiness}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Quizzes Taken</p>
                    <p className="text-2xl font-bold text-slate-900">{selectedUser.quizzes}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Weak Topic</p>
                    <p className="text-sm font-semibold text-amber-600">{selectedUser.weakTopic}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Joined</p>
                    <p className="text-sm font-semibold text-slate-700">{selectedUser.joined}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 mb-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Actions</h3>
                  <button
                    onClick={() => toggleSuspend(selectedUser.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedUser.status === "active"
                        ? "border-red-200 text-red-600 hover:bg-red-50"
                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    {selectedUser.status === "active" ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        Suspend User
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Unsuspend User
                      </>
                    )}
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Reset Stuck Sessions
                  </button>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Admin Notes</h3>
                  {selectedUser.notes.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {selectedUser.notes.map((note, i) => (
                        <div key={i} className="bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2 text-xs text-amber-800">
                          {note}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mb-3">No notes yet.</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addNote(selectedUser.id)}
                      placeholder="Add a note..."
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                    />
                    <button
                      onClick={() => addNote(selectedUser.id)}
                      className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

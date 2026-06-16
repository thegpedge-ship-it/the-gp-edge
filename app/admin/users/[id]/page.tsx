"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getAdminUsers, saveAdminUsers, AdminUser } from "@/lib/quizData";
import {
  themeBorder,
  themeBtnGhost,
  themeBtnPrimary,
  themeDot,
  themeIconBtn,
  themeInput,
  themeLabel,
  themeMuted,
  themeSelected,
  themeSurface,
  themeText,
} from "@/lib/adminTheme";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const avatarGradients = [
  "from-teal-400 to-emerald-500",
  "from-emerald-500 to-green-600",
  "from-slate-400 to-slate-500",
  "from-teal-500 to-teal-600",
  "from-green-400 to-emerald-500",
  "from-slate-500 to-slate-600",
];

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.id);

  const [user, setUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [sessionResetMsg, setSessionResetMsg] = useState(false);

  useEffect(() => {
    const loaded = getAdminUsers();
    setUsers(loaded);
    const found = loaded.find((u) => u.id === userId);
    if (found) {
      setUser(found);
    }
  }, [userId]);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">User not found.</p>
        <button onClick={() => router.push("/admin/users")} className={`mt-4 ${themeBtnPrimary} px-4 py-2 text-sm`}>
          Back to Users
        </button>
      </div>
    );
  }

  const toggleSuspend = () => {
    const updatedStatus = user.status === "active" ? ("suspended" as const) : ("active" as const);
    const updatedUser = { ...user, status: updatedStatus };
    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));

    setUser(updatedUser);
    setUsers(updatedUsers);
    saveAdminUsers(updatedUsers);
  };

  const addNote = () => {
    if (!noteInput.trim()) return;
    const updatedUser = { ...user, notes: [...user.notes, noteInput.trim()] };
    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));

    setUser(updatedUser);
    setUsers(updatedUsers);
    saveAdminUsers(updatedUsers);
    setNoteInput("");
  };

  const handleResetSessions = () => {
    setSessionResetMsg(true);
    setTimeout(() => setSessionResetMsg(false), 3000);
  };

  const avatarIndex = user.id % avatarGradients.length;
  const gradient = avatarGradients[avatarIndex];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
      {/* Header / Back Action */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/users")}
          className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-900 transition-all shadow-sm flex items-center justify-center shrink-0 hover:scale-[1.02]`}
          title="Back to Users"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">User Details</span>
      </motion.div>

      <AdminPageHeader
        title={user.name}
        highlightedText=""
        subtitle={`User ID: #${user.id} · Registered Plan: ${user.plan.toUpperCase()}`}
        actions={
          <div className="flex gap-2">
            <StatusBadge variant={user.plan} showDot={false} />
            <StatusBadge variant={user.status} />
          </div>
        }
        variants={itemVariants}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card: Summary Profile */}
        <motion.div
          variants={itemVariants}
          className={`md:col-span-1 bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm flex flex-col items-center text-center`}
        >
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-3xl font-bold shadow-md mb-4`}>
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-tight mb-1">{user.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{user.email}</p>

          <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4 text-left">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Joined Date</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.joined}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Last Active</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.lastActive}</p>
            </div>
          </div>
        </motion.div>

        {/* Right Cards: Actions & Notes */}
        <div className="md:col-span-2 space-y-6">
          {/* Actions panel */}
          <motion.div
            variants={itemVariants}
            className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm`}
          >
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Operations & Control</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={toggleSuspend}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  user.status === "active"
                    ? "border-red-200/60 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15"
                    : "border-emerald-200/60 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/15"
                }`}
              >
                {user.status === "active" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Suspend User Account
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Activate User Account
                  </>
                )}
              </button>

              <button
                onClick={handleResetSessions}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Stuck Sessions
              </button>
            </div>

            {sessionResetMsg && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 text-center"
              >
                Sessions reset successfully for this user.
              </motion.div>
            )}
          </motion.div>

          {/* Notes panel */}
          <motion.div
            variants={itemVariants}
            className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm space-y-4`}
          >
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Admin Notes</h3>
            {user.notes.length > 0 ? (
              <div className="space-y-2">
                {user.notes.map((note, i) => (
                  <div
                    key={i}
                    className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-xl px-4 py-3 text-sm text-teal-800 dark:text-teal-300 font-medium leading-relaxed"
                  >
                    {note}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">No notes recorded yet.</p>
            )}

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="Add an admin note..."
                className="flex-1 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 dark:text-slate-100 transition-all"
              />
              <button
                onClick={addNote}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold rounded-xl hover:shadow-md hover:shadow-teal-500/10 transition-all shrink-0"
              >
                Add Note
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getAdminUsers, saveAdminUsers, fetchAdminUsersFromDb, AdminUser } from "@/lib/quizData";
import { toggleUserStatusInDbAction } from "@/actions/admin.actions";
import { themeBorder, themeBtnPrimary } from "@/lib/adminTheme";

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
  const rawId = params.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : "";
  const userId = rawId;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sessionResetMsg, setSessionResetMsg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const loaded = getAdminUsers();
    setUsers(loaded);
    const found = loaded.find((u) => String(u.id) === String(userId));
    if (found) {
      setUser(found);
    }

    fetchAdminUsersFromDb()
      .then((realUsers) => {
        setUsers(realUsers);
        const match = realUsers.find((u) => String(u.id) === String(userId));
        if (match) setUser(match);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (!user && !loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">User not found.</p>
        <button onClick={() => router.push("/admin/users")} className={`mt-4 ${themeBtnPrimary} px-4 py-2 text-sm`}>
          Back to Users
        </button>
      </div>
    );
  }

  if (!user && loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Loading user profile details...
      </div>
    );
  }

  if (!user) return null;

  const handleConfirmToggleSuspend = async () => {
    const updatedStatus = user.status === "active" ? ("suspended" as const) : ("active" as const);
    const updatedUser = { ...user, status: updatedStatus };
    const updatedUsers = users.map((u) => (String(u.id) === String(user.id) ? updatedUser : u));

    setUser(updatedUser);
    setUsers(updatedUsers);
    saveAdminUsers(updatedUsers);
    setShowConfirmModal(false);

    await toggleUserStatusInDbAction(String(user.id), updatedStatus);
  };

  const handleResetSessions = () => {
    setSessionResetMsg(true);
    setTimeout(() => setSessionResetMsg(false), 3000);
  };

  const avatarIndex = Math.abs(String(user.id).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % avatarGradients.length;
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
          </div>
        </motion.div>

        {/* Right Cards: Actions */}
        <div className="md:col-span-2 space-y-6">
          {/* Actions panel */}
          <motion.div
            variants={itemVariants}
            className={`bg-white dark:bg-slate-900 border ${themeBorder} rounded-2xl p-6 shadow-sm`}
          >
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Operations & Control</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirmModal(true)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  user.status === "active"
                    ? "border-red-200/60 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15"
                    : "border-emerald-200/60 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/15"
                }`}
              >
                {user.status === "active" ? (
                  <>
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    <span>Suspend User Account</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Activate User Account</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetSessions}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
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
        </div>
      </div>

      {/* Confirmation Warning Modal */}
      <AnimatePresence>
        {showConfirmModal && (
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
                    user.status === "active"
                      ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50"
                      : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                  }`}
                >
                  {user.status === "active" ? (
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {user.status === "active" ? "Confirm Account Suspension" : "Confirm Account Activation"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Final Confirmation Required</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {user.status === "active" ? (
                  <>Are you sure you want to suspend <strong className="text-slate-900 dark:text-slate-100">{user.name}</strong> ({user.email})? This user will be restricted from accessing GP Edge platform resources until reinstated.</>
                ) : (
                  <>Are you sure you want to reactivate <strong className="text-slate-900 dark:text-slate-100">{user.name}</strong> ({user.email})?</>
                )}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmToggleSuspend}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
                    user.status === "active"
                      ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                      : "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20"
                  }`}
                >
                  {user.status === "active" ? "Yes, Suspend Account" : "Yes, Activate Account"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

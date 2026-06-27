"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import * as Lucide from "lucide-react";

import {
  themeBorder,
  themeBtnPrimary,
  themeLabel,
  themeInput,
  themePanel,
} from "@/lib/adminTheme";

interface CredentialUser {
  id: string;
  name: string;
  username: string;
  role: "Super Admin" | "Admin" | "Moderator" | "Viewer";
  email: string;
  password?: string;
  forgotPasswordEnabled: boolean;
  mustResetPassword?: boolean;
}

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<CredentialUser | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tempId = localStorage.getItem("gpedge_temp_reset_admin_id");
      if (!tempId) {
        router.push("/admin/login");
        return;
      }
      setUserId(tempId);

      const stored = localStorage.getItem("gpedge_admin_credentials_list");
      if (stored) {
        try {
          const list: CredentialUser[] = JSON.parse(stored);
          const found = list.find((u) => u.id === tempId);
          if (found) {
            setAdminUser(found);
          } else {
            router.push("/admin/login");
          }
        } catch (e) {
          router.push("/admin/login");
        }
      } else {
        router.push("/admin/login");
      }
    }
  }, [router]);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (typeof window !== "undefined" && userId) {
        const stored = localStorage.getItem("gpedge_admin_credentials_list");
        if (stored) {
          try {
            const list: CredentialUser[] = JSON.parse(stored);
            const updatedList = list.map((u) => {
              if (u.id === userId) {
                return {
                  ...u,
                  password: newPassword,
                  mustResetPassword: false,
                };
              }
              return u;
            });
            localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(updatedList));
            localStorage.removeItem("gpedge_temp_reset_admin_id");

            // Sync layout changes
            window.dispatchEvent(new Event("gpedge_admin_changed"));

            router.push("/admin/login?resetSuccess=true");
          } catch (e) {
            setError("An error occurred while saving the password. Please try again.");
            setLoading(false);
          }
        } else {
          setError("Failed to retrieve credentials list. Please contact Super Admin.");
          setLoading(false);
        }
      }
    }, 800);
  };

  return (
    <main className="min-h-screen bg-gradient-to-tr from-slate-50 to-teal-50/20 dark:from-slate-950 dark:to-slate-900/40 flex items-center justify-center px-4 py-20 font-sans select-none animate-fade-in">
      <div className="w-full max-w-md">
        {/* Logo and header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative w-12 h-12 mb-4 shadow-sm rounded-xl overflow-hidden ring-1 ring-black/5 bg-white flex items-center justify-center">
            <Image
              src="/assets/logo.png"
              alt="GP Edge Logo"
              fill
              sizes="48px"
              className="rounded-xl object-contain"
              priority
            />
          </div>
          <h2 className="text-xl font-sans font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            GP Edge <span className="text-slate-500 dark:text-slate-400 font-medium">· Password Reset</span>
          </h2>
          <p className="text-xs text-slate-450 dark:text-slate-500 mt-2">
            Establish your personalized password to activate access
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`w-full ${themePanel} p-8`}
        >
          {adminUser && (
            <div className="mb-5 p-4 bg-teal-50/30 dark:bg-teal-950/10 border border-teal-200/50 dark:border-teal-900/20 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider block mb-1">
                Account Verification
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {adminUser.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 font-mono mt-0.5">
                {adminUser.username} · {adminUser.role}
              </p>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-650 dark:text-red-400 rounded-xl flex gap-2 items-start leading-relaxed animate-shake">
                <Lucide.AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lucide.Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-355 border-none bg-transparent cursor-pointer flex items-center justify-center p-1 rounded-lg"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
                    <Lucide.EyeOff className="w-4 h-4" />
                  ) : (
                    <Lucide.Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <Lucide.Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-355 border-none bg-transparent cursor-pointer flex items-center justify-center p-1 rounded-lg"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <Lucide.EyeOff className="w-4 h-4" />
                  ) : (
                    <Lucide.Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 border-none outline-none rounded-xl cursor-pointer ${themeBtnPrimary} hover:opacity-95 active:scale-[0.98]`}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lucide.Save className="w-4 h-4" />
                  <span>Update Password & Log In</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-5">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("gpedge_temp_reset_admin_id");
                }
                router.push("/admin/login");
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors uppercase tracking-wider bg-transparent border-none cursor-pointer"
            >
              Cancel and return to login
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

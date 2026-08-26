"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import {
  getAdminsFromDbAction,
  syncLocalAdminsWithDbAction,
  verifyAdminCredentialsAction,
  requestPasswordResetAction,
} from "@/actions/admin.actions";

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

const FALLBACK_USERS: CredentialUser[] = [
  {
    id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00",
    name: "Siddhant Udavant",
    username: "siddhant_super",
    role: "Super Admin",
    email: "admin@gpedge.com",
    forgotPasswordEnabled: true,
    password: "super123",
  },
  {
    id: "b5a452ef-09c3-4d2b-aa58-bf8827f8a101",
    name: "Arun Mehta",
    username: "arun_admin",
    role: "Admin",
    email: "content@gpedge.com",
    forgotPasswordEnabled: true,
    password: "admin123",
  },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [signedInElsewhere, setSignedInElsewhere] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("resetSuccess") === "true") {
        setResetSuccess(true);
      }
      if (searchParams.get("signedInElsewhere") === "true") {
        setSignedInElsewhere(true);
      }
      const savedUsername = localStorage.getItem("gpedge_admin_remembered_username");
      if (savedUsername) {
        setUsername(savedUsername);
        setRememberMe(true);
      }
    }
  }, []);

  // Forgot password flow
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("gpedge_admin_logged_in") === "true";
      if (loggedIn) {
        router.push("/admin/dashboard");
      }
    }
  }, [router]);

  useEffect(() => {
    syncLocalAdminsWithDbAction(FALLBACK_USERS)
      .then((dbAdmins) => {
        if (dbAdmins && dbAdmins.length > 0) {
          localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(dbAdmins));
        }
      })
      .catch((err) => {
        console.warn("Failed to sync local admins with DB:", err);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await verifyAdminCredentialsAction(username, password);

      if (!result.success || !result.user) {
        setError(result.error || "Invalid username or password.");
        setLoading(false);
        return;
      }

      const foundUser = result.user;

      if (rememberMe) {
        localStorage.setItem("gpedge_admin_remembered_username", username);
      } else {
        localStorage.removeItem("gpedge_admin_remembered_username");
      }

      try {
        const dbAdmins = await getAdminsFromDbAction();
        if (dbAdmins && dbAdmins.length > 0) {
          localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(dbAdmins));
        }
      } catch (adminFetchErr) {
        console.warn("Failed to fetch admin list post-login:", adminFetchErr);
      }

      if (foundUser.mustResetPassword) {
        localStorage.setItem("gpedge_temp_reset_admin_id", foundUser.id);
        router.push("/admin/reset-password");
        setLoading(false);
        return;
      }

      localStorage.setItem("gpedge_admin_logged_in", "true");
      localStorage.setItem("gpedge_active_admin_id", foundUser.id);
      if (foundUser.sessionToken) {
        localStorage.setItem("gpedge_admin_session_token", foundUser.sessionToken);
      }

      window.dispatchEvent(new Event("gpedge_admin_changed"));
      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      const isServerActionMismatch =
        err?.message?.includes("Invalid Server Actions request") ||
        err?.message?.includes("Server Action");
      if (isServerActionMismatch) {
        setError("Dev server updated. Please refresh the page (F5) and try logging in again.");
      } else {
        setError("An error occurred during authentication. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotError(null);
    setForgotSent(true);

    try {
      const result = await requestPasswordResetAction(forgotEmail);
      if (!result.success || !result.userId) {
        setForgotError(result.error || "Could not verify that account.");
        setForgotSent(false);
        return;
      }

      localStorage.setItem("gpedge_temp_reset_admin_id", result.userId);
      setShowForgotModal(false);
      setForgotEmail("");
      setForgotSent(false);
      router.push("/admin/reset-password");
    } catch (err) {
      setForgotError("An error occurred while verifying your account. Please try again.");
      setForgotSent(false);
    }
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
            GP Edge <span className="text-slate-500 dark:text-slate-400 font-medium">· Admin Panel</span>
          </h2>
          <p className="text-xs text-slate-450 dark:text-slate-500 mt-2">
            Sign in to manage system access and configurations
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`w-full ${themePanel} p-8`}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-650 dark:text-red-400 rounded-xl flex gap-2 items-start leading-relaxed animate-shake">
                <Lucide.AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-400 rounded-xl flex gap-2 items-start leading-relaxed animate-fade-in">
                <Lucide.CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>Password updated successfully. Please log in with your new password.</span>
              </div>
            )}

            {signedInElsewhere && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-400 rounded-xl flex gap-2 items-start leading-relaxed animate-fade-in">
                <Lucide.Laptop className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>You were signed out because this account was signed in on another device. Each admin account can only be active on one device at a time.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <Lucide.User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                  placeholder="e.g. siddhant_super"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300 hover:underline border-none bg-transparent cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lucide.Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-355 border-none bg-transparent cursor-pointer flex items-center justify-center p-1 rounded-lg"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Lucide.EyeOff className="w-4 h-4" />
                  ) : (
                    <Lucide.Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 accent-teal-600 dark:accent-teal-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Remember my username</span>
            </label>

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
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lucide.LogIn className="w-4 h-4" />
                  <span>Log In to Dashboard</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`fixed inset-x-4 top-[25%] mx-auto max-w-sm ${themePanel} p-6 pointer-events-auto text-slate-950 dark:text-slate-50`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-850 dark:text-slate-200">
                  Reset Password
                </h3>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotError(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 border-none bg-transparent cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendResetLink} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your administrator email address or username. If it matches an account with password reset enabled, you'll be taken straight to set a new password.
                </p>

                {forgotError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-650 dark:text-red-400 rounded-xl flex gap-2 items-start leading-relaxed">
                    <Lucide.AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Admin Email / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs dark:text-slate-100 rounded-xl transition-all ${themeInput}`}
                    placeholder="e.g. admin@gpedge.com"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotError(null);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border-none bg-transparent cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSent}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer ${themeBtnPrimary}`}
                  >
                    {forgotSent ? "Verifying..." : "Continue"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

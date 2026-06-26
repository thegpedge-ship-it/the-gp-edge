"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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

const FALLBACK_USERS: CredentialUser[] = [
  {
    id: "1",
    name: "Siddhant Udavant",
    username: "siddhant_super",
    role: "Super Admin",
    email: "admin@gpedge.com",
    forgotPasswordEnabled: true,
    password: "super123",
  },
  {
    id: "2",
    name: "Arun Mehta",
    username: "arun_admin",
    role: "Admin",
    email: "content@gpedge.com",
    forgotPasswordEnabled: true,
    password: "admin123",
  },
  {
    id: "3",
    name: "Jessica Park",
    username: "jessica_mod",
    role: "Moderator",
    email: "moderator@gpedge.com",
    forgotPasswordEnabled: true,
    password: "moderator123",
  },
  {
    id: "4",
    name: "Sarah Connor",
    username: "sarah_view",
    role: "Viewer",
    email: "viewer@gpedge.com",
    forgotPasswordEnabled: true,
    password: "viewer123",
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("resetSuccess") === "true") {
        setResetSuccess(true);
      }
    }
  }, []);

  // Forgot password flow
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("gpedge_admin_logged_in") === "true";
      if (loggedIn) {
        router.push("/admin/dashboard");
      }
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (typeof window !== "undefined") {
        // Load actual credential list configured
        let stored = localStorage.getItem("gpedge_admin_credentials_list");
        let usersList: CredentialUser[] = [];
        try {
          usersList = stored ? JSON.parse(stored) : [];
        } catch (e) {
          usersList = [];
        }
        if (!usersList || usersList.length === 0 || !usersList.find(u => u.username === "siddhant_super")) {
          localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(FALLBACK_USERS));
          usersList = FALLBACK_USERS;
        }

        const foundUser = usersList.find(
          (u) => u.username.toLowerCase() === username.trim().toLowerCase()
        );

        if (!foundUser) {
          setError("Username not found. Please contact your Super Administrator.");
          setLoading(false);
          return;
        }

        const expectedPassword = foundUser.password || "password123"; // fallback just in case
        if (password !== expectedPassword) {
          setError("Invalid password. Please check your credentials and try again.");
          setLoading(false);
          return;
        }

        // Success! Set active admin id and mark as logged in or redirect to force reset
        if (foundUser.mustResetPassword) {
          localStorage.setItem("gpedge_temp_reset_admin_id", foundUser.id);
          router.push("/admin/reset-password");
          setLoading(false);
          return;
        }

        localStorage.setItem("gpedge_admin_logged_in", "true");
        localStorage.setItem("gpedge_active_admin_id", foundUser.id);
        
        // Dispatch event so layout and header sync up instantly
        window.dispatchEvent(new Event("gpedge_admin_changed"));
        
        router.push("/admin/dashboard");
      }
    }, 800);
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setShowForgotModal(false);
      setForgotEmail("");
      alert("A password reset link has been dispatched to your verified email address.");
    }, 1500);
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

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <Lucide.User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                <input
                  type="text"
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

          {/* Collapsible reference block for demo access */}
          <details className="mt-6 pt-5 border-t border-teal-150/20 dark:border-teal-900/30 text-left group">
            <summary className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-colors uppercase tracking-wider cursor-pointer list-none flex items-center justify-between select-none">
              <span>Demo Accounts Reference</span>
              <Lucide.ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-relaxed mt-3.5">
              <div className="bg-teal-50/20 dark:bg-teal-950/10 p-2.5 rounded-xl border border-teal-100/40 dark:border-teal-900/20">
                <p className="font-bold text-teal-800 dark:text-teal-450 mb-1">Super Admin</p>
                <p className="text-slate-600 dark:text-slate-450">U: <span className="text-slate-800 dark:text-slate-200">siddhant_super</span></p>
                <p className="text-slate-600 dark:text-slate-450">P: <span className="text-slate-800 dark:text-slate-200">super123</span></p>
              </div>
              <div className="bg-teal-50/20 dark:bg-teal-950/10 p-2.5 rounded-xl border border-teal-100/40 dark:border-teal-900/20">
                <p className="font-bold text-teal-800 dark:text-teal-450 mb-1">Admin (View-Only)</p>
                <p className="text-slate-600 dark:text-slate-450">U: <span className="text-slate-800 dark:text-slate-200">sarah_view</span></p>
                <p className="text-slate-600 dark:text-slate-450">P: <span className="text-slate-800 dark:text-slate-200">viewer123</span></p>
              </div>
            </div>
          </details>
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
                  Password Recovery Link
                </h3>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 border-none bg-transparent cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendResetLink} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your administrator email address or username. A verification code will be sent to the configured recovery address.
                </p>

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
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border-none bg-transparent cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSent}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer ${themeBtnPrimary}`}
                  >
                    {forgotSent ? "Sending..." : "Request Reset Link"}
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

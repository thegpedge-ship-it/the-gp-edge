"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { getAdminsFromDbAction, syncLocalAdminsWithDbAction, CredentialUser } from "@/actions/admin.actions";
import { resolveAdminSectionKey } from "@/lib/adminPermissionKeys";

const FULL_PERMISSIONS = [
  "dashboard", "questions", "quizzes", "content", "approaches", "autofill",
  "users", "mbs", "medical", "notifications", "billing", "audit", "settings", "search",
  "validation", "cancellations", "feedbacksLibrary", "feedbacksQuestions", "feedbacksNoteTemplates",
];

const ADMIN_PROFILES = [
  { id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00", name: "GPEDGE Admin", email: "admin@gpedge.com", role: "Super Admin", permissions: FULL_PERMISSIONS },
  { id: "b5a452ef-09c3-4d2b-aa58-bf8827f8a101", name: "Arun Mehta", email: "content@gpedge.com", role: "Admin", permissions: ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "feedbacksLibrary", "feedbacksQuestions", "feedbacksNoteTemplates", "users", "mbs", "notifications", "billing"] },
  { id: "d7c92b23-1c32-4f8a-9a99-8cb142646202", name: "Jessica Park", email: "moderator@gpedge.com", role: "Moderator", permissions: ["dashboard", "questions", "content", "approaches", "feedbacksLibrary", "feedbacksQuestions", "feedbacksNoteTemplates"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);
  const currentSection = resolveAdminSectionKey(segments.slice(1));

  // --- All hooks must be declared before any early returns ---
  const [currentAdmin, setCurrentAdmin] = useState({
    id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00",
    name: "GPEDGE Admin",
    email: "admin@gpedge.com",
    role: "Super Admin",
    permissions: FULL_PERMISSIONS,
  });
  const [currentAdminId, setCurrentAdminId] = useState("e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00");
  // Both start with SSR-safe defaults (the server has no localStorage, so the first client render
  // must match that same "not yet known" state, or hydration fails) and only flip once the effect
  // below runs on the client. A defensive timeout further down force-clears `loading` if that
  // effect is ever delayed, so the spinner can no longer get stuck indefinitely.
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [collapsed, setCollapsed] = useState(true); // Default to collapsed for hover UX
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Run auth init ONCE on mount — do NOT re-run on every pathname change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gpedge_active_admin_id") || "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00";
      const loggedIn = localStorage.getItem("gpedge_admin_logged_in") === "true";
      setCurrentAdminId(stored);
      setIsLoggedIn(loggedIn);
      setLoading(false);

      const updateProfile = (adminId: string) => {
        let storedCreds = localStorage.getItem("gpedge_admin_credentials_list");
        let credsList: any[] = [];
        try {
          credsList = storedCreds ? JSON.parse(storedCreds) : [];
        } catch (e) {
          credsList = [];
        }
        if (!credsList || credsList.length === 0) {
          const defaultCreds = [
            { id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00", name: "GPEDGE Admin (Founder)", username: "siddhant_super", role: "Super Admin", roles: ["SA"], email: "admin@gpedge.com", lastChanged: "12 days ago", forgotPasswordEnabled: true, oauthEnabled: true, mfaEnabled: true, password: "super123" },
            { id: "b5a452ef-09c3-4d2b-aa58-bf8827f8a101", name: "Arun Mehta (Clinical Editor)", username: "arun_editor", role: "Clinical Editor", roles: ["CE"], email: "content@gpedge.com", lastChanged: "3 days ago", forgotPasswordEnabled: true, oauthEnabled: false, mfaEnabled: false, password: "admin123" },
            { id: "d7c92b23-1c32-4f8a-9a99-8cb142646202", name: "Operations Lead (OM)", username: "ops_lead", role: "Operations Manager", roles: ["OM"], email: "ops@gpedge.com", lastChanged: "5 days ago", forgotPasswordEnabled: true, oauthEnabled: false, mfaEnabled: false, password: "ops123" }
          ];
          localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(defaultCreds));
          credsList = defaultCreds;
        }
        const foundUser = credsList.find((u: any) => u.id === adminId);
        if (foundUser) {
          let permissions: string[] = foundUser.permissions || [];
          const userRoles: string[] = foundUser.roles || [];
          const isSA = userRoles.includes("SA") || foundUser.role === "Super Admin" || foundUser.role === "SA (Super Admin)";
          const isCE = userRoles.includes("CE") || foundUser.role === "Clinical Editor" || foundUser.role === "CE (Clinical Editor)";
          const isOM = userRoles.includes("OM") || foundUser.role === "Operations Manager" || foundUser.role === "OM (Operations Manager)";
          const isDR = userRoles.includes("DR") || foundUser.role === "Drafter" || foundUser.role === "DR (Drafter)";
          const isPR = userRoles.includes("PR") || foundUser.role === "Peer Reviewer" || foundUser.role === "PR (Peer Reviewer)";
          const isSUB = userRoles.includes("SUB") || foundUser.role === "Subscriber" || foundUser.role === "SUB (Subscriber)";

          if (isSA || permissions.length === 0) {
            if (isSA) {
              permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "feedbacks", "users", "mbs", "notifications", "billing", "audit", "settings", "search"];
            } else if (isCE) {
              permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "feedbacks", "audit"];
            } else if (isOM) {
              permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "feedbacks", "mbs", "billing", "audit"];
            } else if (isDR) {
              permissions = ["dashboard", "questions", "content", "approaches", "feedbacks"];
            } else if (isPR) {
              permissions = ["dashboard", "questions", "content", "approaches", "feedbacks"];
            } else if (isSUB) {
              permissions = ["dashboard"];
            } else if (foundUser.role === "Admin") {
              permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "feedbacks", "users", "mbs", "notifications", "billing"];
            } else if (foundUser.role === "Moderator") {
              permissions = ["dashboard", "questions", "content", "approaches", "feedbacks"];
            } else {
              permissions = ["dashboard"];
            }
          } else if (isCE && permissions.length === 0) {
            permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "feedbacks", "audit"];
          }

          setCurrentAdmin({
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
            permissions
          });
        }
      };

      updateProfile(stored);

      const defaultCreds: CredentialUser[] = [
        { id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00", name: "GPEDGE Admin (Founder)", username: "siddhant_super", role: "Super Admin", roles: ["SA"], email: "admin@gpedge.com", lastChanged: "12 days ago", forgotPasswordEnabled: true, oauthEnabled: true, mfaEnabled: true, password: "super123" },
        { id: "b5a452ef-09c3-4d2b-aa58-bf8827f8a101", name: "Arun Mehta (Clinical Editor)", username: "arun_editor", role: "Clinical Editor", roles: ["CE"], email: "content@gpedge.com", lastChanged: "3 days ago", forgotPasswordEnabled: true, oauthEnabled: false, mfaEnabled: false, password: "admin123" },
        { id: "d7c92b23-1c32-4f8a-9a99-8cb142646202", name: "Operations Lead (OM)", username: "ops_lead", role: "Operations Manager", roles: ["OM"], email: "ops@gpedge.com", lastChanged: "5 days ago", forgotPasswordEnabled: true, oauthEnabled: false, mfaEnabled: false, password: "ops123" }
      ];

      syncLocalAdminsWithDbAction(defaultCreds).then((dbAdmins) => {
        if (dbAdmins && dbAdmins.length > 0) {
          localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(dbAdmins));
          const found = dbAdmins.find((u) => u.id === stored);
          if (found) {
            const foundRoles: string[] = (found as any).roles || [];
            const fIsSA = foundRoles.includes("SA") || found.role === "Super Admin" || found.role === "SA (Super Admin)";
            const fIsCE = foundRoles.includes("CE") || found.role === "Clinical Editor" || found.role === "CE (Clinical Editor)";
            const fIsOM = foundRoles.includes("OM") || found.role === "Operations Manager" || found.role === "OM (Operations Manager)";
            const fIsDR = foundRoles.includes("DR") || found.role === "Drafter" || found.role === "DR (Drafter)";
            const fIsPR = foundRoles.includes("PR") || found.role === "Peer Reviewer" || found.role === "PR (Peer Reviewer)";
            let permissions: string[] = found.permissions || [];
            if (fIsSA) {
              permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "feedbacks", "users", "mbs", "notifications", "billing", "audit", "settings", "search"];
            } else if (fIsCE) {
              permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "feedbacks", "audit"];
            } else if (fIsOM) {
              permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "feedbacks", "mbs", "billing", "audit"];
            } else if (fIsDR || fIsPR) {
              permissions = ["dashboard", "questions", "content", "approaches", "feedbacks"];
            } else if (permissions.length === 0) {
              permissions = ["dashboard"];
            }
            setCurrentAdmin({
              id: found.id,
              name: found.name,
              email: found.email,
              role: found.role,
              permissions,
            });
          }
        }
      });

      const handleAdminChanged = () => {
        const val = localStorage.getItem("gpedge_active_admin_id") || "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00";
        const log = localStorage.getItem("gpedge_admin_logged_in") === "true";
        setCurrentAdminId(val);
        setIsLoggedIn(log);
        updateProfile(val);
      };

      window.addEventListener("gpedge_admin_changed", handleAdminChanged);
      return () => {
        window.removeEventListener("gpedge_admin_changed", handleAdminChanged);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Run ONCE on mount only

  // Safety net: the effect above should always clear `loading` almost immediately, but if it's
  // ever delayed or skipped (a remount race, a slow tick), don't leave the admin panel stuck
  // behind the loading screen forever — force it closed after a short grace period.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Separate effect: redirect to login when not authenticated (deferred to next tick to prevent AppRouter hook conflict)
  useEffect(() => {
    if (!loading && !isLoggedIn && pathname !== "/admin/login" && pathname !== "/admin/reset-password") {
      const timer = setTimeout(() => {
        router.push("/admin/login");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loading, isLoggedIn, pathname, router]);

  // Clean up hover timeout on unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const sectionKeys = [
    "dashboard", "questions", "quizzes", "content", "approaches", "autofill",
    "users", "mbs", "medical", "notifications", "billing", "audit", "settings", "search",
    "validation", "cancellations", "feedbacksLibrary", "feedbacksQuestions", "feedbacksNoteTemplates",
  ];
  const isGatedSection = sectionKeys.includes(currentSection);
  const hasPermission = !isGatedSection || currentAdmin.permissions.includes(currentSection);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 350);
  };

  const isExpanded = !collapsed || isHovered;

  const sectionNames: Record<string, string> = {
    dashboard: "Dashboard Overview",
    questions: "Question Bank",
    quizzes: "Quiz Management",
    content: "Medical Content Directory",
    approaches: "Clinical Approaches",
    autofill: "Clinical Autofills",
    users: "Subscriber Management",
    mbs: "MBS Data Update",
    medical: "Medical Reference Data",
    notifications: "System Notifications",
    billing: "Revenue & Subscriptions",
    audit: "Audit & Security Logs",
    settings: "System Settings",
    search: "Global Admin Search",
    validation: "Validation Queue",
    cancellations: "Subscription Cancellations",
    feedbacksLibrary: "Library Feedback",
    feedbacksQuestions: "Question Feedback",
    feedbacksNoteTemplates: "Note Template Feedback",
  };
  const sectionName = sectionNames[currentSection] || currentSection;

  const deniedContent = (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-6 py-12 text-center select-none">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center border border-amber-200/50 dark:border-amber-900/30 shadow-lg shadow-amber-500/5 relative overflow-hidden">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center">
          <span className="text-[10px] font-black text-white">!</span>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Permissions Locked</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
        You are currently viewing as <span className="font-bold text-slate-700 dark:text-slate-200">{currentAdmin.name} ({currentAdmin.role})</span>.
      </p>
      <div className="mt-6 p-5 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/20 rounded-2xl text-left text-xs text-amber-800 dark:text-amber-350 leading-relaxed space-y-2">
        <p className="font-bold text-amber-900 dark:text-amber-250">Access Restricted</p>
        <p>Your current security clearance and role permissions do not permit access to the <span className="font-semibold">{sectionName}</span> section.</p>
        <p>To request access, please contact a Super Administrator or switch to an authorized admin profile using the <strong>View As</strong> switcher in the top bar.</p>
      </div>
    </div>
  );

  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/reset-password";
  const showLoading = loading || (!isLoggedIn && !isAuthPage);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 relative overflow-x-clip font-sans admin-layout">
        {!isAuthPage && (
          <>
            {/* Backdrop for mobile sidebar */}
            <AnimatePresence>
              {mobileOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileOpen(false)}
                  className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[45] lg:hidden cursor-pointer"
                />
              )}
            </AnimatePresence>

            <AdminSidebar
              collapsed={!isExpanded}
              onToggle={() => setCollapsed(!collapsed)}
              mobileOpen={mobileOpen}
              onMobileClose={() => setMobileOpen(false)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
            <AdminTopbar
              collapsed={!isExpanded}
              onMenuClick={() => setMobileOpen(!mobileOpen)}
            />
          </>
        )}

        {/* Main content area */}
        <main
          className={isAuthPage ? "min-h-screen" : `admin-main-content pt-14 min-h-screen relative ${isExpanded ? "expanded" : "collapsed"}`}
        >
          <div className={isAuthPage ? "" : "p-6 lg:p-8"}>
            {showLoading ? (
              <div className="min-h-[60vh] flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-8 h-8 text-teal-700 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading...</span>
                </div>
              </div>
            ) : hasPermission ? (
              children
            ) : (
              deniedContent
            )}
          </div>
        </main>
      </div>
  );
}

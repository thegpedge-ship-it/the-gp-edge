"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";

interface AdminTopbarProps {
  collapsed: boolean;
  onMenuClick?: () => void;
}

const sectionLabels: Record<string, string> = {
  dashboard: "Dashboard",
  users: "User Management",
  questions: "Question Bank",
  quizzes: "Quiz Management",
  content: "Medical Content",
  autofill: "Autofill Templates",
  notifications: "Notifications",
  billing: "Billing & Subscription",
  audit: "Audit Log",
  search: "Search",
  settings: "System Settings",
};

export default function AdminTopbar({ collapsed, onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);
  const currentSection = segments[1] || "dashboard";
  const currentLabel = sectionLabels[currentSection] || currentSection.charAt(0).toUpperCase() + currentSection.slice(1);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const mockNotifs = [
    { id: 1, title: "New Cardiology Questions", desc: "Added to review bank", time: "2 hours ago", unread: true },
    { id: 2, title: "System Maintenance", desc: "Scheduled for tonight 11 PM", time: "4 hours ago", unread: true },
    { id: 3, title: "Account Suspended", desc: "ToS policy action logged", time: "1 day ago", unread: false },
  ];

  const handleLogout = () => {
    alert("Simulation: Logged out successfully!");
    setShowProfile(false);
  };

  return (
    <>
      {/* Click-outside handled via custom ref logic */}

      <header
        className={`fixed top-0 right-0 left-0 z-40 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 ${
          collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        } pl-4`}
      >
        <div className="h-full flex items-center justify-between px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[13px]">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-all flex-shrink-0 cursor-pointer border-none bg-transparent"
                aria-label="Toggle Sidebar"
              >
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <span className="text-slate-400 dark:text-slate-500 font-medium">Admin</span>
            <svg className="w-3 h-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-700 dark:text-slate-200 font-semibold">{currentLabel}</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 relative z-50">
            {/* Notification bell */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                }}
                className={`relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-none bg-transparent cursor-pointer ${
                  showNotifications ? "bg-slate-100 dark:bg-slate-800" : ""
                }`}
              >
                <Lucide.Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-2.5 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden py-1 z-50"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Notifications</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">3 New</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-y-auto">
                      {mockNotifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            router.push("/admin/notifications");
                          }}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all flex items-start gap-3 relative ${
                            n.unread ? "bg-teal-50/10 dark:bg-teal-950/5" : ""
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 ${n.unread ? "opacity-100" : "opacity-0"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{n.desc}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        router.push("/admin/notifications");
                      }}
                      className="w-full text-center py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-teal-800 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-none bg-transparent cursor-pointer"
                    >
                      View all notifications
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {/* Admin profile */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
                className={`flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-none bg-transparent cursor-pointer ${
                  showProfile ? "bg-slate-50 dark:bg-slate-800" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-emerald-500/25">
                  SU
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">Siddhant U.</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">Admin</p>
                </div>
                <motion.div
                  animate={{ rotate: showProfile ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="hidden sm:block shrink-0"
                >
                  <Lucide.ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-2.5 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden py-1.5 z-50 text-slate-800 dark:text-slate-200"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Siddhant Udavant</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">admin@gpedge.com</p>
                      <span className="inline-block text-[9px] font-bold bg-teal-50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-400 px-2 py-0.5 rounded-md border border-teal-100/30 dark:border-teal-900/20 mt-1.5">Super Admin</span>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          router.push("/admin/settings");
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 border-none bg-transparent cursor-pointer"
                      >
                        <Lucide.Settings className="w-3.5 h-3.5 text-slate-400" />
                        System Settings
                      </button>
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          router.push("/admin/audit");
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 border-none bg-transparent cursor-pointer"
                      >
                        <Lucide.ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                        Audit Security Log
                      </button>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15 transition-all flex items-center gap-2 border-none bg-transparent cursor-pointer"
                      >
                        <Lucide.LogOut className="w-3.5 h-3.5" />
                        Logout Session
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

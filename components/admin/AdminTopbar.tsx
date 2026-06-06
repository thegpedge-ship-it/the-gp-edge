"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
  uploads: "Uploads",
  notifications: "Notifications",
  billing: "Billing & Subscription",
  audit: "Audit Log",
  search: "Search",
  settings: "System Settings",
};

export default function AdminTopbar({ collapsed, onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentSection = segments[1] || "dashboard";
  const currentLabel = sectionLabels[currentSection] || currentSection.charAt(0).toUpperCase() + currentSection.slice(1);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-30 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 ${
        collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
      } pl-4`}
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[13px]">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-all flex-shrink-0"
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
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

          {/* Admin profile */}
          <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-emerald-500/25">
              SU
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">Siddhant U.</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">Admin</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

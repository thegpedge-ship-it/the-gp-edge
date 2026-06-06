"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 relative overflow-x-hidden font-sans">


      {/* Backdrop for mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <AdminTopbar
        collapsed={collapsed}
        onMenuClick={() => setMobileOpen(!mobileOpen)}
      />

      {/* Main content area */}
      <main
        className={`pt-14 min-h-screen relative transition-all duration-300 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"} ml-0`}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

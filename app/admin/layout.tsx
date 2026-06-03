"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans">
      {/* Premium ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.08),transparent)] pointer-events-none z-0" />

      {/* Dot grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(226,232,240)_1px,transparent_0)] bg-[size:24px_24px] opacity-60 pointer-events-none z-0" />

      {/* Soft gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[100px] right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-teal-200/20 via-emerald-100/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-gradient-to-tr from-slate-200/40 to-teal-100/20 rounded-full blur-[100px]" />
      </div>

      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <AdminTopbar collapsed={collapsed} />

      {/* Main content area */}
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="pt-16 min-h-screen relative z-10"
      >
        <div className="p-6 lg:p-8">{children}</div>
      </motion.main>
    </div>
  );
}

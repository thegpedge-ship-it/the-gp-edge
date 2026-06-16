"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true); // Default to collapsed for hover UX
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const isExpanded = !collapsed || isHovered;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 relative overflow-x-clip font-sans admin-layout">


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

      {/* Main content area */}
      <main
        className={`pt-14 min-h-screen relative transition-all duration-300 ml-0 ${isExpanded ? "lg:ml-[260px]" : "lg:ml-[72px]"}`}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

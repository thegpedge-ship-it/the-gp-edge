"use client";

import { memo } from "react";
import Header from "@/components/shared/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import PageTransition from "@/components/ui/PageTransition";
import {
  SidebarProvider,
  useSidebar,
  SIDEBAR_RAIL_PX,
  SIDEBAR_PANEL_PX,
  MARGIN_TRANSITION,
} from "@/contexts/SidebarContext";

/**
 * DashboardInner — reads sidebar context to sync content margin with sidebar width.
 * Both transitions use identical cubic-bezier so they move in perfect sync.
 * Wrapped in React.memo to prevent re-renders when parent context updates unrelated state.
 */
const DashboardInner = memo(function DashboardInner({ children }: { children: React.ReactNode }) {
  const { isExpanded, ready } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Header variant="static" />

      {/* Fixed sidebar */}
      <Sidebar />

      {/* Content — margin-left matches sidebar width at all times */}
      <main
        style={{
          marginLeft: isExpanded ? SIDEBAR_PANEL_PX : SIDEBAR_RAIL_PX,
          transition: ready ? MARGIN_TRANSITION : "none",
        }}
        className="min-h-screen px-6 sm:px-8 pt-28 sm:pt-32 pb-12"
      >
        {/* PageTransition wraps route content for smooth, single entry animation */}
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
});

/**
 * DashboardShell — the single client boundary for all dashboard routes.
 * SidebarProvider lives here so all nested pages share one sidebar instance.
 * Sidebar and Header remain mounted; only route content updates.
 */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardInner>{children}</DashboardInner>
    </SidebarProvider>
  );
}

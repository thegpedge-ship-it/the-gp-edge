"use client";

import { memo } from "react";
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
 *
 * No landing-page Header here — the Sidebar provides all dashboard navigation.
 * The Header (with Exam Prep / GP Toolkit / etc. nav) is purely a landing-page
 * component. Keeping it inside the dashboard would show irrelevant landing-page
 * links and waste vertical space on every dashboard route.
 *
 * Sidebar handles: profile, navigation, exam readiness, badges, and weekly goals.
 * Wrapped in React.memo to prevent re-renders when sidebar context updates.
 */
const DashboardInner = memo(function DashboardInner({ children }: { children: React.ReactNode }) {
  const { isExpanded, ready } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Fixed sidebar — provides all dashboard navigation */}
      <Sidebar />

      {/* Content — margin-left matches sidebar width at all times */}
      <main
        style={{
          marginLeft: isExpanded ? SIDEBAR_PANEL_PX : SIDEBAR_RAIL_PX,
          transition: ready ? MARGIN_TRANSITION : "none",
        }}
        className="min-h-screen px-6 sm:px-8 pt-6 pb-12"
      >
        {/* PageTransition wraps route content for smooth, unified entry animation */}
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
});

/**
 * DashboardShell — the single client boundary for all dashboard routes.
 * SidebarProvider lives here so all nested pages share one sidebar instance.
 * Sidebar remains mounted; only route content (wrapped in PageTransition) updates.
 */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardInner>{children}</DashboardInner>
    </SidebarProvider>
  );
}

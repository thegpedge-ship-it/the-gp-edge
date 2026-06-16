"use client";

import { memo } from "react";
import Header from "@/components/shared/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import PageTransition from "@/components/ui/PageTransition";
import { useAuth } from "@clerk/nextjs";
import {
  SidebarProvider,
  useSidebar,
  SIDEBAR_RAIL_PX,
  SIDEBAR_PANEL_PX,
  MARGIN_TRANSITION,
} from "@/contexts/SidebarContext";

// Local SignedIn wrapper to avoid Clerk package ESM export issues in this Next.js version
function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <>{children}</> : null;
}

/**
 * DashboardInner — reads sidebar context to sync content margin with sidebar width.
 * Both transitions use identical cubic-bezier so they move in perfect sync.
 * Wrapped in React.memo to prevent re-renders when parent context updates unrelated state.
 */
const DashboardInner = memo(function DashboardInner({
  children,
  className = "px-6 sm:px-8 pt-6 sm:pt-8 pb-12",
  bgClassName = "bg-slate-100 dark:bg-slate-950",
  hideSidebar = false,
}: {
  children: React.ReactNode;
  className?: string;
  bgClassName?: string;
  hideSidebar?: boolean;
}) {
  const { isExpanded, ready } = useSidebar();
  const { isSignedIn } = useAuth();

  const showSidebar = !hideSidebar && isSignedIn;

  return (
    <div className={`min-h-screen ${bgClassName}`}>
      <div
        style={{
          marginLeft: showSidebar ? (isExpanded ? SIDEBAR_PANEL_PX : SIDEBAR_RAIL_PX) : "0px",
          transition: ready ? MARGIN_TRANSITION : "none",
        }}
      >
        <Header variant="static" />
      </div>

      {/* Fixed sidebar — suppressed on pages that opt out (e.g. the landing/home page) */}
      {!hideSidebar && (
        <SignedIn>
          <Sidebar />
        </SignedIn>
      )}

      {/* Content — margin-left matches sidebar width only when the sidebar is shown, otherwise 0px */}
      <main
        style={{
          marginLeft: showSidebar ? (isExpanded ? SIDEBAR_PANEL_PX : SIDEBAR_RAIL_PX) : "0px",
          transition: ready ? MARGIN_TRANSITION : "none",
        }}
        className={`min-h-screen ${className}`}
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
export default function DashboardShell({
  children,
  className,
  bgClassName,
  hideSidebar = false,
}: {
  children: React.ReactNode;
  className?: string;
  bgClassName?: string;
  hideSidebar?: boolean;
}) {
  return (
    <SidebarProvider>
      <DashboardInner className={className} bgClassName={bgClassName} hideSidebar={hideSidebar}>
        {children}
      </DashboardInner>
    </SidebarProvider>
  );
}

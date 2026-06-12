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
}: {
  children: React.ReactNode;
  className?: string;
  bgClassName?: string;
}) {
  const { isExpanded, ready } = useSidebar();
  const { isSignedIn } = useAuth();

  return (
    <div className={`min-h-screen ${bgClassName}`}>
      <Header variant="static" />

      {/* Fixed sidebar */}
      <SignedIn>
        <Sidebar />
      </SignedIn>

      {/* Content — margin-left matches sidebar width only when signed in, otherwise 0px */}
      <main
        style={{
          marginLeft: isSignedIn ? (isExpanded ? SIDEBAR_PANEL_PX : SIDEBAR_RAIL_PX) : "0px",
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
}: {
  children: React.ReactNode;
  className?: string;
  bgClassName?: string;
}) {
  return (
    <SidebarProvider>
      <DashboardInner className={className} bgClassName={bgClassName}>
        {children}
      </DashboardInner>
    </SidebarProvider>
  );
}

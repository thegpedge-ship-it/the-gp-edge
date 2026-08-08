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
import { ProfileProvider, EMPTY_PROFILE, type DbProfile } from "@/contexts/ProfileContext";

/**
 * DashboardInner — reads sidebar context to sync content margin with sidebar width.
 * Both transitions use identical cubic-bezier so they move in perfect sync.
 * Wrapped in React.memo to prevent re-renders when parent context updates unrelated state.
 */
const DashboardInner = memo(function DashboardInner({
  children,
  className = "px-6 sm:px-8 pt-6 sm:pt-8 pb-12",
  bgClassName = "bg-transparent",
  hideSidebar = false,
  showSidebar = false,
}: {
  children: React.ReactNode;
  className?: string;
  bgClassName?: string;
  hideSidebar?: boolean;
  showSidebar?: boolean;
}) {
  const { isExpanded, ready } = useSidebar();
  const shouldShowSidebar = !hideSidebar && showSidebar;

  // The sidebar is desktop-only (hidden below lg), so the content offset must be
  // ZERO on mobile — otherwise the page reserves empty space for an invisible
  // sidebar and shifts right. We expose the desktop offset as a CSS variable and
  // apply it only at lg+ via `lg:ml-[var(--dash-ml)]`; mobile keeps `ml-0`.
  const desktopMargin = shouldShowSidebar
    ? `${isExpanded ? SIDEBAR_PANEL_PX : SIDEBAR_RAIL_PX}px`
    : "0px";
  const offsetStyle = {
    ["--dash-ml" as string]: desktopMargin,
    transition: ready ? MARGIN_TRANSITION : "none",
  } as React.CSSProperties;

  return (
    <div className={`min-h-screen ${bgClassName}`}>
      <div
        className="sticky top-0 z-50 pt-4 pb-2 bg-transparent ml-0 lg:ml-[var(--dash-ml)]"
        style={offsetStyle}
      >
        <Header variant="static" />
      </div>

      {/* Fixed sidebar — suppressed on pages that opt out (e.g. the landing/home page) */}
      {!hideSidebar && (showSidebar ? <Sidebar /> : null)}

      {/* Content — offset matches sidebar width only at lg+ (desktop); 0 on mobile. */}
      <main
        style={offsetStyle}
        className={`min-h-screen ml-0 lg:ml-[var(--dash-ml)] ${className}`}
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
  showSidebar = false,
  profile = EMPTY_PROFILE,
}: {
  children: React.ReactNode;
  className?: string;
  bgClassName?: string;
  hideSidebar?: boolean;
  showSidebar?: boolean;
  profile?: DbProfile;
}) {
  return (
    <ProfileProvider value={profile}>
      <SidebarProvider hasDrawer={!hideSidebar && showSidebar}>
        <DashboardInner className={className} bgClassName={bgClassName} hideSidebar={hideSidebar} showSidebar={showSidebar}>
          {children}
        </DashboardInner>
      </SidebarProvider>
    </ProfileProvider>
  );
}

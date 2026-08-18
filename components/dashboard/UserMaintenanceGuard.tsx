"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useMaintenanceMode } from "@/contexts/MaintenanceContext";
import MaintenanceCard from "@/components/ui/MaintenanceCard";
import { DEFAULT_MAINTENANCE_SETTINGS } from "@/lib/maintenance";

/**
 * USER-SIDE ONLY maintenance guard.
 * Intercepts user-facing routes and renders a maintenance notice when:
 *   1. Global Maintenance Mode is ON  → blocks all user routes
 *   2. A specific module is ON         → blocks only that module's routes
 *
 * Admin users visiting /admin/* are NEVER affected by this guard.
 */

const ROUTE_MODULE_MAP: Record<string, { id: string; name: string }> = {
  "/dashboard/billing":          { id: "mbs_billing",       name: "MBS Billing Guide & Fee Search" },
  "/dashboard/medical-library":  { id: "medical_directory", name: "Medical Reference Directory" },
  "/medical-library":            { id: "medical_directory", name: "Medical Reference Directory" },
  "/dashboard/exam-prep":        { id: "exam_prep",         name: "Exam Prep & Practice Quizzes" },
  "/exam-prep":                  { id: "exam_prep",         name: "Exam Prep & Practice Quizzes" },
  "/dashboard/clinical-autofills": { id: "clinical_content", name: "Clinical Templates & Autofills" },
  "/autofills":                  { id: "clinical_content",  name: "Clinical Templates & Autofills" },
  "/dashboard/pricing":          { id: "subscriptions",     name: "Subscriptions & Payment Gateway" },
  "/pricing":                    { id: "subscriptions",     name: "Subscriptions & Payment Gateway" },
  "/billing":                    { id: "subscriptions",     name: "Subscriptions & Payment Gateway" },
  "/dashboard":                  { id: "user_dashboard",    name: "User Dashboard" },
};

export default function UserMaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings, isGlobalMaintenance, isModuleInMaintenance, getModuleMessage, refreshMaintenance, loading } = useMaintenanceMode();

  // While settings are loading, render children normally
  if (loading) {
    return <>{children}</>;
  }

  // 1. Global Maintenance Mode — block all user-facing pages
  if (isGlobalMaintenance) {
    return (
      <MaintenanceCard
        moduleName="GP Edge Platform"
        message={settings.globalMessage || DEFAULT_MAINTENANCE_SETTINGS.globalMessage}
        backHref=""
        onRefresh={refreshMaintenance}
      />
    );
  }

  // 2. Selective Module Maintenance — block only matching routes
  if (pathname) {
    // Sort entries so deeper routes match before shallower ones (e.g. /dashboard/billing before /dashboard)
    const sortedEntries = Object.entries(ROUTE_MODULE_MAP).sort(
      ([a], [b]) => b.length - a.length
    );

    for (const [routePrefix, modInfo] of sortedEntries) {
      if (pathname === routePrefix || pathname.startsWith(routePrefix + "/")) {
        if (isModuleInMaintenance(modInfo.id)) {
          return (
            <MaintenanceCard
              moduleName={modInfo.name}
              message={getModuleMessage(modInfo.id)}
              backHref="/dashboard"
              onRefresh={refreshMaintenance}
            />
          );
        }
        // Found a matching route — stop checking further (most specific match wins)
        break;
      }
    }
  }

  return <>{children}</>;
}

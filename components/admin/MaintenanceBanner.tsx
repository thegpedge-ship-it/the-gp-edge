"use client";

import React from "react";
import { useMaintenanceMode } from "@/contexts/MaintenanceContext";
import { Wrench, ArrowRight, Info } from "lucide-react";
import Link from "next/link";

/**
 * Admin-side informational banner — purely advisory.
 * Maintenance mode ONLY blocks users on the user-facing side.
 * Admins retain full access to all admin tools and settings at all times.
 */
export default function MaintenanceBanner() {
  const { settings, isGlobalMaintenance } = useMaintenanceMode();

  const activeModules = Object.entries(settings.modules || {})
    .filter(([_, mod]) => mod?.enabled)
    .map(([id]) => id);

  if (!isGlobalMaintenance && activeModules.length === 0) {
    return null;
  }

  const moduleNamesMap: Record<string, string> = {
    mbs_billing: "MBS Billing",
    medical_directory: "Medical Directory",
    exam_prep: "Exam Prep",
    clinical_content: "Clinical Templates",
    user_dashboard: "User Dashboard",
    subscriptions: "Subscriptions",
  };

  const activeModuleLabels = activeModules.map((id) => moduleNamesMap[id] || id).join(", ");

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border-b border-amber-200/80 dark:border-amber-900/40 px-4 py-2 shadow-sm transition-all relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
            <Info className="w-3.5 h-3.5" />
          </span>
          <div>
            {isGlobalMaintenance ? (
              <span>
                <strong className="font-semibold">User-facing Maintenance Active:</strong> All user-facing pages are currently showing a maintenance notice. You (admin) retain full access.
              </span>
            ) : (
              <span>
                <strong className="font-semibold">Selective User Maintenance Active:</strong> Users cannot access:{" "}
                <span className="font-semibold text-amber-800 dark:text-amber-300">{activeModuleLabels}</span>. Admin tools are unaffected.
              </span>
            )}
          </div>
        </div>

        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold transition-colors shrink-0 whitespace-nowrap"
        >
          Manage
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

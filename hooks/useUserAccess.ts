"use client";

import { useEffect, useState, useCallback } from "react";
import { getUserAccessAction, type SerializedUserAccess } from "@/actions/access.actions";
import { useUserAccessContext, type UserAccessContextValue } from "@/contexts/UserAccessContext";

export interface UserAccessState {
  /** True while the initial fetch is in flight. */
  loading: boolean;
  /** Null until resolved, or if user is not signed in. */
  access: SerializedUserAccess | null;
  /** User's current career stage ("REGISTRAR", "FELLOW", "OTHER"). Default "REGISTRAR". */
  trainingStage: "REGISTRAR" | "FELLOW" | "OTHER";
  /**
   * Convenience shorthand: any active paid plan
   * ($15/mo, $30/mo, $300/yr, or Registrar).
   * false while loading.
   */
  hasPaidAccess: boolean;
  /**
   * Convenience shorthand: Registrar plan AND within the active access window.
   * Grants full Exam Prep / Quizzes access.
   * false while loading.
   */
  isRegistrarActive: boolean;
  /**
   * Convenience shorthand: true for Registrar or any active paid plan.
   * Alias for hasPaidAccess — kept separately so callers can be explicit.
   */
  hasAnyPaidPlan: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  /** Manually trigger a re-fetch of the user access tier. */
  refresh: () => void;
}

export function useUserAccess(): UserAccessState {
  const context = useUserAccessContext();

  // If provided by UserAccessProvider (e.g. within DashboardShell), use the context directly
  if (context) {
    return context;
  }

  return useStandaloneUserAccess();
}

function useStandaloneUserAccess(): UserAccessState {
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<SerializedUserAccess | null>(null);

  const fetchAccess = useCallback(() => {
    setLoading(true);
    getUserAccessAction()
      .then((result) => {
        setAccess(result);
      })
      .catch((err) => {
        console.error("[useUserAccess] failed to resolve access:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const hasPaidAccess = !loading && (access?.hasPaidAccess ?? false);
  const isRegistrarActive = !loading && (access?.isRegistrarActive ?? false);
  const trainingStage = access?.trainingStage ?? "REGISTRAR";

  return {
    loading,
    access,
    trainingStage,
    hasPaidAccess,
    isRegistrarActive,
    hasAnyPaidPlan: hasPaidAccess,
    cancelAtPeriodEnd: !loading && (access?.cancelAtPeriodEnd ?? false),
    currentPeriodEnd: !loading ? (access?.currentPeriodEnd ?? null) : null,
    refresh: fetchAccess,
  };
}



/**
 * hooks/useUserAccess.ts
 *
 * Client-side hook that resolves the signed-in user's access tier once on mount.
 * Uses the getUserAccessAction Server Action — never calls Prisma/DB directly.
 *
 * Returns a stable, memoized shape so all dashboard pages share the result
 * without redundant round-trips (each page instance still fetches independently,
 * but the hook itself only fires once per mount).
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { getUserAccessAction, type SerializedUserAccess } from "@/actions/access.actions";

export interface UserAccessState {
  /** True while the initial fetch is in flight. */
  loading: boolean;
  /** Null until resolved, or if user is not signed in. */
  access: SerializedUserAccess | null;
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
  /** Manually trigger a re-fetch of the user access tier. */
  refresh: () => void;
}

export function useUserAccess(): UserAccessState {
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

  return {
    loading,
    access,
    hasPaidAccess,
    isRegistrarActive,
    hasAnyPaidPlan: hasPaidAccess,
    refresh: fetchAccess,
  };
}


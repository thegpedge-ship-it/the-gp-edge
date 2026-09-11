"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { getUserAccessAction, type SerializedUserAccess } from "@/actions/access.actions";

export interface UserAccessContextValue {
  loading: boolean;
  access: SerializedUserAccess | null;
  trainingStage: "REGISTRAR" | "FELLOW" | "OTHER";
  hasPaidAccess: boolean;
  isRegistrarActive: boolean;
  hasAnyPaidPlan: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  refresh: () => void;
}

const UserAccessContext = createContext<UserAccessContextValue | null>(null);

export function UserAccessProvider({
  children,
  initialAccess,
}: {
  children: ReactNode;
  initialAccess?: SerializedUserAccess | null;
}) {
  // If initialAccess is provided (including explicit null for free/unauthenticated),
  // start with loading: false. If undefined (e.g. not provided by layout), start with loading: true.
  const [loading, setLoading] = useState<boolean>(initialAccess === undefined);
  const [access, setAccess] = useState<SerializedUserAccess | null>(initialAccess ?? null);

  const fetchAccess = useCallback(() => {
    setLoading(true);
    getUserAccessAction()
      .then((result) => {
        setAccess(result);
      })
      .catch((err) => {
        console.error("[UserAccessProvider] failed to resolve access:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const hasPaidAccess = !loading && (access?.hasPaidAccess ?? false);
  const isRegistrarActive = !loading && (access?.isRegistrarActive ?? false);
  const trainingStage = access?.trainingStage ?? "REGISTRAR";

  const value = useMemo<UserAccessContextValue>(
    () => ({
      loading,
      access,
      trainingStage,
      hasPaidAccess,
      isRegistrarActive,
      hasAnyPaidPlan: hasPaidAccess,
      cancelAtPeriodEnd: !loading && (access?.cancelAtPeriodEnd ?? false),
      currentPeriodEnd: !loading ? (access?.currentPeriodEnd ?? null) : null,
      refresh: fetchAccess,
    }),
    [loading, access, trainingStage, hasPaidAccess, isRegistrarActive, fetchAccess]
  );

  return <UserAccessContext.Provider value={value}>{children}</UserAccessContext.Provider>;
}

export function useUserAccessContext(): UserAccessContextValue | null {
  return useContext(UserAccessContext);
}

"use client";

import { createContext, useContext, useMemo } from "react";

export type DbProfile = {
  roleTitle: string | null;
  location: string | null;
  examTarget: string | null;
  postgraduateYear: number | null;
  examTargetCode: string | null;
  primaryMedicalDegree: string | null;
  fellowshipStatus: string | null;
  country: string | null;
  stateTerritory: string | null;
  joinedAt: string | null;
};

export const EMPTY_PROFILE: DbProfile = {
  roleTitle: null,
  location: null,
  examTarget: null,
  postgraduateYear: null,
  examTargetCode: null,
  primaryMedicalDegree: null,
  fellowshipStatus: null,
  country: null,
  stateTerritory: null,
  joinedAt: null,
};

const ProfileContext = createContext<DbProfile>(EMPTY_PROFILE);

export function ProfileProvider({
  value,
  children,
}: {
  value: DbProfile;
  children: React.ReactNode;
}) {
  const memoizedValue = useMemo(
    () => value,
    [
      value.roleTitle,
      value.location,
      value.examTarget,
      value.postgraduateYear,
      value.examTargetCode,
      value.primaryMedicalDegree,
      value.fellowshipStatus,
      value.country,
      value.stateTerritory,
      value.joinedAt,
    ]
  );

  return <ProfileContext.Provider value={memoizedValue}>{children}</ProfileContext.Provider>;
}

export function useProfile(): DbProfile {
  return useContext(ProfileContext);
}

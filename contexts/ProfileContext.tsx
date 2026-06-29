"use client";

import { createContext, useContext } from "react";

/**
 * The user's own-profile fields that live in our Neon `users` table (collected
 * during onboarding), made available to client components without each one
 * re-fetching. Clerk-owned identity (name, email, avatar) stays on `useUser()`.
 */
export type DbProfile = {
  roleTitle: string | null;
  hospital: string | null;
  location: string | null;
  bio: string | null;
  racgpId: string | null;
  examTarget: string | null;
  joinedAt: string | null; // ISO timestamp
};

export const EMPTY_PROFILE: DbProfile = {
  roleTitle: null,
  hospital: null,
  location: null,
  bio: null,
  racgpId: null,
  examTarget: null,
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
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): DbProfile {
  return useContext(ProfileContext);
}

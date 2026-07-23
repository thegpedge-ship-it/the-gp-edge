"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";

export type OnboardingState = { error?: string };

export type LiveExam = { code: string; name: string };

/**
 * Exams currently live on the platform — i.e. exam types that have at least one
 * published, non-deleted question. Drives the onboarding "Exam Target" dropdown
 * so users can only pick an exam we actually have content for.
 */
export async function getLiveExams(): Promise<LiveExam[]> {
  return prisma.exam_types.findMany({
    where: { questions: { some: { status: "published", deleted_at: null } } },
    orderBy: { code: "asc" },
    select: { code: true, name: true },
  });
}

/**
 * Persist the onboarding form into the `users` table, then flag the Clerk
 * account as onboarded so the auth gate stops redirecting here.
 *
 * Returns `{ error }` to show inline on failure. On success it redirects to the
 * dashboard (the thrown NEXT_REDIRECT is handled by Next automatically, even
 * when this action is invoked from a client transition).
 */
export async function completeOnboarding(
  formData: FormData,
): Promise<OnboardingState> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Guarantee the DB row exists before we update it (handles Google OAuth users
  // who reach onboarding without ever having hit the dashboard).
  const dbUser = await ensureDbUser();
  if (!dbUser) {
    return { error: "We couldn't load your account. Please refresh and try again." };
  }

  // Trim each field; treat empty strings as NULL so the DB stays clean.
  const value = (key: string) => {
    const raw = formData.get(key);
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    return trimmed.length > 0 ? trimmed : null;
  };

  const role_title = value("role_title");
  const hospital = value("hospital");
  const location = value("location");
  const racgp_id = value("racgp_id");
  const exam_target = value("exam_target");
  const bio = value("bio");

  if (!role_title) {
    return { error: "Please tell us your current training level or role." };
  }

  await prisma.users.update({
    where: { clerk_user_id: userId },
    data: { role_title, hospital, location, racgp_id, exam_target, bio },
  });

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { onboardingComplete: true },
  });

  redirect("/dashboard");
}

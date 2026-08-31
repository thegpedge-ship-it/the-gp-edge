"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";

export type OnboardingState = { error?: string };

export async function completeOnboarding(
  formData: FormData,
): Promise<OnboardingState> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await ensureDbUser();
  if (!dbUser) {
    return { error: "We couldn't load your account. Please refresh and try again." };
  }

  const str = (key: string) => {
    const raw = formData.get(key);
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    return trimmed.length > 0 ? trimmed : null;
  };

  // ── Step 1 (mandatory) ──────────────────────────────────────────────────
  const postgraduate_year_raw = str("postgraduate_year");
  const exam_target_code = str("exam_target_code");

  if (!postgraduate_year_raw || !exam_target_code) {
    return { error: "Please complete all required fields." };
  }

  const postgraduate_year = parseInt(postgraduate_year_raw, 10);
  if (isNaN(postgraduate_year) || postgraduate_year < 1 || postgraduate_year > 10) {
    return { error: "Invalid postgraduate year." };
  }

  const validTargets = ["AKT", "KFP", "BOTH", "NONE"];
  if (!validTargets.includes(exam_target_code)) {
    return { error: "Invalid exam target." };
  }

  const terms_accepted = str("terms_accepted") === "true";
  if (!terms_accepted) {
    return { error: "You must agree to the Terms of Service and Privacy Policy." };
  }

  const marketing_consent = str("marketing_consent") === "true";
  const now = new Date();

  // ── Step 2 (optional) ──────────────────────────────────────────────────
  const primary_medical_degree = str("primary_medical_degree");
  const fellowship_status = str("fellowship_status");
  const country = str("country");
  const state_territory = str("state_territory");
  const referral_source = str("referral_source");
  const referral_source_other = str("referral_source_other");

  let exam_history: string[] = [];
  const exam_history_raw = str("exam_history");
  if (exam_history_raw) {
    try {
      exam_history = JSON.parse(exam_history_raw);
    } catch {
      exam_history = [];
    }
  }

  // Derive training_stage and user_role from fellowship_status
  const isFellow = fellowship_status === "FRACGP" || fellowship_status === "FACRRM";
  const training_stage = isFellow ? "FELLOW" : "REGISTRAR";
  const user_role = isFellow ? "FELLOW" : "REGISTRAR";

  // Build the legacy exam_target string for backward compat with profile/settings
  const targetLabels: Record<string, string> = {
    AKT: "AKT",
    KFP: "KFP",
    BOTH: "AKT + KFP",
    NONE: "Reference & CPD",
  };
  const exam_target = targetLabels[exam_target_code] || null;
  const role_title = `PGY${postgraduate_year === 10 ? "10+" : postgraduate_year}`;

  await prisma.users.update({
    where: { clerk_user_id: userId },
    data: {
      postgraduate_year,
      exam_target_code,
      terms_accepted_at: now,
      terms_version: "1.0",
      privacy_version: "1.0",
      marketing_consent,
      marketing_consent_at: marketing_consent ? now : null,
      primary_medical_degree,
      exam_history,
      fellowship_status,
      country,
      state_territory,
      referral_source,
      referral_source_other,
      training_stage,
      user_role,
      role_title,
      exam_target,
    },
  });

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true,
      trainingStage: training_stage,
    },
  });

  redirect("/dashboard");
}

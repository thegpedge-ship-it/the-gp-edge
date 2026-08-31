import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { ensureDbUser, isOnboarded } from "@/lib/user";
import OnboardingForm from "./OnboardingForm";

export const metadata: Metadata = {
  title: "Complete Your Profile | The GP Edge",
  description: "Tell us a little about yourself to personalise your GP Edge experience.",
};

export default async function OnboardingPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  if (isOnboarded(clerkUser)) redirect("/dashboard");

  const dbUser = await ensureDbUser();

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-20">
      <OnboardingForm
        firstName={clerkUser.firstName}
        defaults={{
          postgraduate_year: dbUser?.postgraduate_year ?? null,
          exam_target_code: dbUser?.exam_target_code ?? "",
          terms_accepted_at: dbUser?.terms_accepted_at?.toISOString() ?? null,
          primary_medical_degree: dbUser?.primary_medical_degree ?? "",
          exam_history: dbUser?.exam_history ?? [],
          fellowship_status: dbUser?.fellowship_status ?? "",
          country: dbUser?.country ?? "Australia",
          state_territory: dbUser?.state_territory ?? "",
          referral_source: dbUser?.referral_source ?? "",
          referral_source_other: dbUser?.referral_source_other ?? "",
        }}
      />
    </main>
  );
}

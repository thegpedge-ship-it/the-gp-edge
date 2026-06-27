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

  // Already onboarded — nothing to collect.
  if (isOnboarded(clerkUser)) redirect("/dashboard");

  // Make sure the DB row exists and pre-fill anything already saved (e.g. if the
  // user started onboarding earlier and came back).
  const dbUser = await ensureDbUser();

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-20">
      <OnboardingForm
        firstName={clerkUser.firstName}
        defaults={{
          role_title: dbUser?.role_title ?? "",
          hospital: dbUser?.hospital ?? "",
          location: dbUser?.location ?? "",
          racgp_id: dbUser?.racgp_id ?? "",
          exam_target: dbUser?.exam_target ?? "",
          bio: dbUser?.bio ?? "",
        }}
      />
    </main>
  );
}

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { isOnboarded } from "@/lib/user";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Hero from "@/components/landing/Hero";
import BentoGrid from "@/components/landing/BentoGrid";
import IntelligenceEngine from "@/components/landing/IntelligenceEngine";
import Footer from "@/components/shared/Footer";

export default async function Home() {
  // currentUser() throws if the session points at a deleted user — treat any
  // failure as "signed out" and just show the landing page.
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }

  // First-time / un-onboarded users go straight to onboarding instead of
  // briefly flashing the full landing page.
  if (user && !isOnboarded(user)) redirect("/onboarding");

  const userId = user?.id;

  const content = (
    <>
      <Hero />
      <BentoGrid />
      <IntelligenceEngine />
      <Footer />
    </>
  );

  if (userId) {
    return (
      <DashboardShell className="" bgClassName="bg-transparent">
        {content}
      </DashboardShell>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      {content}
    </main>
  );
}

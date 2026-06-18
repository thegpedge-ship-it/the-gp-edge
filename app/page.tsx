import { auth } from "@clerk/nextjs/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Hero from "@/components/landing/Hero";
import BentoGrid from "@/components/landing/BentoGrid";
import IntelligenceEngine from "@/components/landing/IntelligenceEngine";
import Footer from "@/components/shared/Footer";

export default async function Home() {
  const { userId } = await auth();

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

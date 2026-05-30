import Header from "@/components/shared/Header";
import Hero from "@/components/landing/Hero";
import BentoGrid from "@/components/landing/BentoGrid";
import IntelligenceEngine from "@/components/landing/IntelligenceEngine";
import Footer from "@/components/shared/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header variant="static" />
      <Hero />
      <BentoGrid />
      <IntelligenceEngine />
      <Footer />
    </main>
  );
}

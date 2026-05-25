import Header from "@/components/Header";
import Hero from "@/components/Hero";
import BentoGrid from "@/components/BentoGrid";
import IntelligenceEngine from "@/components/IntelligenceEngine";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <Hero />
      <BentoGrid />
      <IntelligenceEngine />
      <Footer />
    </main>
  );
}

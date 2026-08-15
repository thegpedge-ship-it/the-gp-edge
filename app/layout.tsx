import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/shared/Providers";
import Header from "@/components/shared/Header";
import PageBackground from "@/components/shared/PageBackground";
import { Inter, Lora } from "next/font/google";
import GlobalLogo from "@/components/shared/GlobalLogo";
import VisitTracker from "@/components/shared/VisitTracker";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({ 
  subsets: ["latin"], 
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "The GP Edge | Smart Exam Prep for GP Registrars",
  description:
    "Adaptive mock exams, MBS billing tools, and clinical templates for GP registrars in Australia. Study smarter. Pass with confidence.",
  keywords: [
    "GP registrar",
    "AKT exam",
    "KFT exam",
    "medical exam prep",
    "MBS billing",
    "clinical templates",
    "Australia",
  ],
  icons: {
    icon: '/assets/favicon-curved.png',
    shortcut: '/assets/favicon-curved.png',
    apple: '/assets/favicon-curved.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/assets/favicon-curved.png',
    },
  },
  openGraph: {
    title: "The GP Edge | Smart Exam Prep for GP Registrars",
    description: "Adaptive mock exams, MBS billing tools, and clinical templates for GP registrars in Australia.",
    images: [{ url: "/assets/logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased bg-slate-50 dark:bg-[#0F1115] text-slate-800 dark:text-[#F5F7FA] min-h-screen overflow-x-hidden transition-colors duration-300`} suppressHydrationWarning>
        <Providers>
          <PageBackground />
          <GlobalLogo />
          <Header />
          {children}
          <VisitTracker />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/shared/Header";

export const metadata: Metadata = {
  title: "The GP Edge | Smart Exam Prep for GP Registrars",
  description:
    "Adaptive mock exams, MBS billing tools, and clinical templates for GP registrars in Australia. Study smarter. Pass with confidence.",
  keywords: [
    "GP registrar",
    "AKT exam",
    "KFP exam",
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
    <html lang="en" className="scroll-smooth">
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen">
        <Header />
        {children}
      </body>
    </html>
  );
}

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.startsWith("http")
        ? process.env.NEXT_PUBLIC_APP_URL
        : `https://${process.env.NEXT_PUBLIC_APP_URL}`
      : "https://thegpedge.com.au"
  ),
  title: {
    default: "The GP Edge | Smart Exam Prep & Clinical Tools for GP Registrars",
    template: "%s | The GP Edge",
  },
  description:
    "Adaptive AKT & KFP mock exams, clinical consult templates, and MBS billing tools for GP registrars across Australia. Study smarter. Pass with confidence.",
  applicationName: "The GP Edge",
  authors: [{ name: "The GP Edge" }],
  keywords: [
    "GP registrar",
    "AKT exam",
    "KFP exam",
    "medical exam prep",
    "MBS billing",
    "clinical templates",
    "Australia",
    "RACGP",
    "ACRRM",
  ],
  icons: {
    icon: "/assets/favicon-curved.png",
    shortcut: "/assets/favicon-curved.png",
    apple: "/assets/favicon-curved.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/assets/favicon-curved.png",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://thegpedge.com.au",
    siteName: "The GP Edge",
    title: "The GP Edge | Smart Exam Prep & Clinical Tools for GP Registrars",
    description:
      "Adaptive AKT & KFP mock exams, clinical consult templates, and MBS billing tools for GP registrars across Australia. Study smarter. Pass with confidence.",
    images: [
      {
        url: "https://thegpedge.com.au/og-image.png",
        width: 1200,
        height: 630,
        alt: "The GP Edge — Smart Exam Prep & Clinical Tools for GP Registrars",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The GP Edge | Smart Exam Prep & Clinical Tools for GP Registrars",
    description:
      "Adaptive AKT & KFP mock exams, clinical consult templates, and MBS billing tools for GP registrars across Australia. Study smarter. Pass with confidence.",
    images: ["https://thegpedge.com.au/og-image.png"],
  },
  alternates: {
    canonical: "https://thegpedge.com.au",
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

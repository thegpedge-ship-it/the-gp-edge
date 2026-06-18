import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/shared/Header";
import PageBackground from "@/components/shared/PageBackground";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Inter, Lora } from "next/font/google";
import Link from "next/link";
import Image from "next/image";

import Script from "next/script";

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
    <ClerkProvider>
      <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
        <head>
          <Script
            id="theme-initializer"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var saved = localStorage.getItem("gpedge-theme-v3");
                  if (!saved) {
                    localStorage.setItem("gpedge-theme-v3", "light");
                    document.documentElement.classList.remove("dark");
                  } else if (saved === "dark") {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                } catch (_) {}
              `,
            }}
          />
        </head>
        <body className={`${inter.variable} ${lora.variable} font-sans antialiased bg-slate-50 dark:bg-[#0F1115] text-slate-800 dark:text-[#F5F7FA] min-h-screen overflow-x-hidden transition-colors duration-300`}>
          <ThemeProvider>
            <PageBackground />
            
            {/* Global Corner Logo — always visible on all pages and scroll positions */}
            <div className="fixed top-2 left-2 z-[60] pointer-events-auto hidden lg:block">
              <Link href="/">
                <Image
                  src="/assets/logo.png"
                  alt="The GP Edge"
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] object-contain rounded-2xl ring-1 ring-black/5"
                  priority
                />
              </Link>
            </div>

            <Header />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

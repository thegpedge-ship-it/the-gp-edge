"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageBackground() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full -z-50 pointer-events-none overflow-hidden select-none">
      {/* ── Light Mode Background ── */}
      <div className="absolute inset-0 dark:hidden bg-[#f8fafc]" />
      
      {/* Light mode: soft teal/blue radial glow at top */}
      <div className={`absolute inset-0 dark:hidden ${isHomePage ? 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(66,139,225,0.12),transparent)]' : 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.12),transparent)]'}`} />

      {/* Light mode: dot grid overlay */}
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(circle_at_1px_1px,rgb(226,232,240)_1px,transparent_0)] bg-[size:24px_24px] opacity-60" />

      {/* Light mode: soft gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none dark:hidden">
        <div className={`absolute -top-[200px] right-[10%] w-[600px] h-[600px] rounded-full blur-[100px] ${isHomePage ? 'bg-gradient-to-br from-blue-200/40 via-blue-100/30 to-transparent' : 'bg-gradient-to-br from-teal-200/40 via-emerald-100/30 to-transparent'}`} />
        <div className={`absolute bottom-[10%] -left-[100px] w-[400px] h-[400px] rounded-full blur-[80px] ${isHomePage ? 'bg-gradient-to-tr from-slate-200/60 to-blue-100/40' : 'bg-gradient-to-tr from-slate-200/60 to-teal-100/40'}`} />
      </div>

      {/* ── Dark Mode Background ── */}
      <div className="absolute inset-0 hidden dark:block bg-[#0F1115]" />
      
      {/* Dark mode: calm radial gradient, no busy patterns */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: `radial-gradient(
            circle at center,
            ${isHomePage ? 'rgba(96,165,250,0.06)' : 'rgba(90,200,176,0.06)'} 0%,
            ${isHomePage ? 'rgba(96,165,250,0.02)' : 'rgba(90,200,176,0.02)'} 35%,
            transparent 70%
          )`,
        }}
      />
    </div>
  );
}

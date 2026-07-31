"use client";

import { useEffect, useState } from "react";

export default function PageBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full -z-50 pointer-events-none overflow-hidden select-none">
      {/* ── Light Mode Background ── */}
      <div className="absolute inset-0 dark:hidden bg-[#f8fafc]" />
      
      {/* Light mode: soft teal radial glow at top */}
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.12),transparent)]" />

      {/* Light mode: dot grid overlay */}
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(circle_at_1px_1px,rgb(226,232,240)_1px,transparent_0)] bg-[size:24px_24px] opacity-60" />

      {/* Light mode: soft gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none dark:hidden">
        <div className="absolute -top-[200px] right-[10%] w-[600px] h-[600px] bg-gradient-to-br from-teal-200/40 via-emerald-100/30 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] -left-[100px] w-[400px] h-[400px] bg-gradient-to-tr from-slate-200/60 to-teal-100/40 rounded-full blur-[80px]" />
      </div>

      {/* ── Dark Mode Background ── */}
      <div className="absolute inset-0 hidden dark:block bg-[#0F1115]" />
      
      {/* Dark mode: calm radial gradient, no busy patterns */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: `radial-gradient(
            circle at center,
            rgba(90,200,176,0.06) 0%,
            rgba(90,200,176,0.02) 35%,
            transparent 70%
          )`,
        }}
      />
    </div>
  );
}

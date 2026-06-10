"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "ghost";
  showWordmark?: boolean;
}

export default function Logo({ className = "", size = "md", showWordmark = true }: LogoProps) {
  // Height only — width is auto to preserve true aspect ratio
  const heightClass: Record<string, string> = {
    sm:    "h-9",
    md:    "h-10",
    lg:    "h-12",
    ghost: "h-5",
  };

  const isGhost = size === "ghost";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo image — natural aspect ratio, no distortion */}
      <Image
        src="/assets/logo.png"
        alt="The GP Edge logo"
        width={160}
        height={40}
        className={`w-auto object-contain rounded-xl overflow-hidden flex-shrink-0 ${heightClass[size]} ${
          isGhost
            ? "opacity-50 grayscale"
            : "ring-1 ring-black/5"
        }`}
        priority
      />

      {/* SaaS Wordmark */}
      {showWordmark && !isGhost && (
        <div className="flex items-baseline">
          <span className="font-light text-slate-500">The</span>
          <span className="font-extrabold text-slate-900 tracking-tight ml-1">GP</span>
          <span className="font-medium text-slate-700 ml-1">Edge</span>
        </div>
      )}
    </div>
  );
}

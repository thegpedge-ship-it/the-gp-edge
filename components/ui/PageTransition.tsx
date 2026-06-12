"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * PageTransition — route-level entry animation.
 *
 * ANIMATION RULES (strictly enforced):
 *   • Desktop (md+, ≥768px): opacity fade only, 150ms. NO translate. Static layout.
 *   • Mobile (<768px): subtle opacity + translateY(8px→0), 280ms. Feels native.
 *
 * This prevents the jarring "jumping content" that translateY causes on desktop
 * when the sidebar and topbar are already in fixed positions.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Desktop: opacity-only, fast.
  // Mobile: opacity + subtle upward slide, slower and more natural.
  const desktopVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.15, ease: "easeOut" },
  };

  const mobileVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  };

  const v = isMobile ? mobileVariants : desktopVariants;

  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      transition={v.transition}
    >
      {children}
    </motion.div>
  );
}

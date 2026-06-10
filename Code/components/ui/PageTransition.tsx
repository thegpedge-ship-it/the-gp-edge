"use client";

/**
 * PageTransition — wraps route-level content with a smooth fade-in.
 * Replaces the per-component entry animations that fire on every navigation.
 * One unified, calm entry experience for all dashboard pages.
 */
import { motion } from "framer-motion";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

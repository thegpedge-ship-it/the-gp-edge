"use client";

/**
 * FadeIn — lightweight animation wrapper for individual sections/cards.
 * Replaces the ad-hoc `motion.div {...fadeUp(delay)}` pattern used across
 * profile, settings, and other pages.
 *
 * Timing is standardized at 280ms with the platform easing curve.
 * delay is in seconds.
 */
import { motion } from "framer-motion";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

"use client";

import React from "react";

/**
 * PageTransition — route-level entry animation.
 *
 * ANIMATION RULES (strictly enforced):
 *   • Desktop (md+, ≥768px): opacity fade only, 150ms. NO translate. Static layout.
 *   • Mobile (<768px): subtle opacity + translateY(8px→0), 280ms. Feels native.
 *
 * Pure GPU-accelerated CSS animation for zero main-thread JS overhead.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style jsx>{`
        .page-entry-anim {
          animation: pageFadeDesktop 150ms ease-out forwards;
        }
        @media (max-width: 767px) {
          .page-entry-anim {
            animation: pageFadeMobile 280ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
        }
        @keyframes pageFadeDesktop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pageFadeMobile {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="page-entry-anim">
        {children}
      </div>
    </>
  );
}

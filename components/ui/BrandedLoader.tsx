/**
 * BrandedLoader — the single loading screen for every user-facing wait.
 *
 * Exists because several routes rendered `return null` while resolving, which
 * paints a blank white page. After clicking "Start", a blank screen is
 * indistinguishable from a dead button, so people click again or navigate away
 * mid-fetch. Showing the logo makes the wait obviously intentional.
 *
 * Two variants:
 *   BrandedLoader      — fills its container, for in-page resolving states
 *   FullScreenLoader   — fixed overlay, for route transitions and blocking work
 */

"use client";

import Image from "next/image";

function LoaderCore({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-5">
      {/* The pulse is on a wrapper, not the logo, so next/image can still
          optimise the asset and the animation never resamples it. */}
      <div className="animate-pulse">
        <Image
          src="/assets/logo.png"
          alt=""
          width={64}
          height={64}
          priority
          className="w-16 h-16 object-contain rounded-2xl"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
          {message}
        </span>
        {/* Three dots on staggered delays — reads as ongoing work even when a
            request stalls, which a static ellipsis does not. */}
        <span className="flex gap-1 pb-0.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

/** Fills the available space. Use inside a page that is resolving its data. */
export function BrandedLoader({ message = "Loading" }: { message?: string }) {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <LoaderCore message={message} />
    </div>
  );
}

/**
 * Covers the viewport. Use for route transitions and for blocking work started
 * from a modal, where the underlying page would otherwise look idle.
 */
export function FullScreenLoader({ message = "Loading" }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-50 dark:bg-slate-950"
    >
      <LoaderCore message={message} />
    </div>
  );
}

export default BrandedLoader;

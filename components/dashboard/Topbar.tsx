"use client";

import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { greeting as fallbackGreeting } from "./data";

type Greeting = { salutation: string; title: string; highlight: string; subtext: string };

/**
 * Topbar — dashboard welcome banner.
 * Client Component — reads the signed-in user from Clerk to show their avatar.
 * No entry animation: the PageTransition wrapper in DashboardShell handles the
 * page-level fade-in. Animating the Topbar independently would cause it to
 * re-animate on every dashboard navigation.
 */
export default function Topbar({ greeting = fallbackGreeting }: { greeting?: Greeting }) {
  const { user } = useUser();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 dark:from-emerald-900/20 dark:via-slate-800/40 dark:to-teal-900/20 border border-emerald-100/60 dark:border-emerald-800/40 p-8 lg:p-10 mb-6">
      {/* Decorative blobs */}
      <div className="absolute -top-16 right-1/3 w-64 h-64 rounded-full bg-emerald-200/40 dark:bg-emerald-700/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-teal-200/30 dark:bg-teal-700/15 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-6">
        <div className="flex-1 min-w-0 max-w-xl">
          <p className="inline-flex items-center gap-2 text-[14px] text-slate-600 dark:text-slate-300 font-medium mb-1">
            {greeting.salutation}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
            {greeting.title}{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              {greeting.highlight}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {greeting.subtext}
          </p>
        </div>

        {/* User avatar */}
        <div className="hidden lg:block relative w-32 h-32 rounded-full overflow-hidden flex-shrink-0 lg:mr-10 ring-4 ring-white dark:ring-slate-800 shadow-lg shadow-emerald-900/10">
          {user?.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt={user.fullName || "User avatar"}
              fill
              priority
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <AvatarSVG />
          )}
        </div>
      </div>
    </section>
  );
}

function AvatarSVG() {
  return (
    <svg viewBox="0 0 96 96" fill="none" className="w-full h-full" aria-label="Profile avatar">
      <circle cx="48" cy="48" r="48" fill="#DCEEED" />
      <circle cx="48" cy="33" r="15" fill="#7BBDB8" />
      <path d="M10 84c0-15.464 17.01-28 38-28s38 12.536 38 28" fill="#7BBDB8" />
    </svg>
  );
}

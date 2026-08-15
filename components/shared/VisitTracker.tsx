"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

const STORAGE_KEY = "gpedge-visit-logged";

const localDayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Fire-and-forget beacon that marks the signed-in user active for the current
 * calendar day, so *any* platform visit — not just a submitted test — lights up
 * the study-activity heatmap. Rendered once in the root layout, so it fires on
 * whichever page the user lands on. Throttled to one request per day per browser
 * via localStorage; the server upsert is idempotent regardless.
 */
export default function VisitTracker() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;
    if (pathname?.startsWith("/admin")) return;

    const today = localDayKey();
    try {
      if (localStorage.getItem(STORAGE_KEY) === today) return;
    } catch {
      /* localStorage unavailable — fall through and just ping. */
    }

    fetch("/api/visit", { method: "POST", keepalive: true })
      .then((res) => {
        if (res.ok) {
          try {
            localStorage.setItem(STORAGE_KEY, today);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* best-effort — a missed ping just means today isn't marked yet. */
      });
  }, [isSignedIn]);

  return null;
}

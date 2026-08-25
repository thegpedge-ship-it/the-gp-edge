"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ValidationRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/audit");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-8 h-8 text-teal-700 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Redirecting to Audit & Security...</span>
      </div>
    </div>
  );
}

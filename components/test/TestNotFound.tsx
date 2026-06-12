"use client";

import { useRouter } from "next/navigation";

export default function TestNotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 px-8 py-10 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Test not found</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          This test doesn&apos;t exist or isn&apos;t available to you. Please pick a test from the exam prep page.
        </p>
        <button
          onClick={() => router.push("/exam-prep")}
          className="mt-6 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[14px] font-bold shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5"
        >
          Back to Exam Prep
        </button>
      </div>
    </div>
  );
}

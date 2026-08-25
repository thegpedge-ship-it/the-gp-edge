"use client";

import { motion } from "framer-motion";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="font-serif text-xl text-slate-900 dark:text-slate-100 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-light mb-6">{error.message || "An unexpected error occurred in the admin panel."}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-full hover:bg-teal-600 transition-all shadow-sm shadow-teal-500/20"
        >
          Try again
        </button>
      </motion.div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import { AlertTriangle, X, Loader2, Trash2 } from "lucide-react";
import { deleteOwnAccountData } from "./actions";

// Exactly what's destroyed — shown strictly before anything happens.
const LOSS_ITEMS = [
  "Your profile & credentials — name, hospital, RACGP number and exam targets",
  "Your entire study history — every quiz, mock exam attempt and score",
  "All performance analytics — streaks, subject mastery and progress",
  "Every earned badge and achievement",
  "Saved questions, bookmarks, templates and favourites",
  "Any active subscription and billing history (no refund for remaining time)",
];

export default function DeleteAccountModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useUser();

  // Wrapping user.delete() with reverification means Clerk prompts the user to
  // re-confirm their identity (a one-time email code or password) before the
  // delete runs — and retries it automatically once they pass.
  const deleteIdentity = useReverification(() => user!.delete());

  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (busy) return;
    onClose();
    setTimeout(() => {
      setError(null);
      setAgreed(false);
    }, 200);
  }

  async function confirmDelete() {
    if (!user || !agreed) return;
    setError(null);
    setBusy(true);
    try {
      // 1. Delete all of the user's data from our database, using the still-valid
      //    authenticated session. Reliable — no dependency on Clerk timing.
      const res = await deleteOwnAccountData();
      if (!res.ok) throw new Error(res.error);
      // 2. Reverify (OTP/password) then delete the Clerk identity itself.
      await deleteIdentity();
      // 3. The session now points at a deleted user — calling signOut() here can
      //    hang, so force a full navigation to the register page. The public page
      //    initializes Clerk fresh and discards the stale session.
      window.location.href = "/sign-up";
      return;
    } catch (err: unknown) {
      if (isReverificationCancelledError(err)) {
        setError("Verification was cancelled — your account was not deleted.");
      } else {
        const e = err as { errors?: { longMessage?: string; message?: string }[]; message?: string };
        setError(
          e?.errors?.[0]?.longMessage ||
            e?.errors?.[0]?.message ||
            e?.message ||
            "Could not delete your account. Please try again.",
        );
      }
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={close} />

          {/* Dialog — same card structure & sizing as the test instructions page */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            initial={{ opacity: 0, y: 16, scale: 1.05 }}
            animate={{ opacity: 1, y: 0, scale: 1.1 }}
            exit={{ opacity: 0, y: 16, scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="absolute top-7 right-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-40 z-10"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Header — label + title, with a danger accent */}
            <div className="px-8 py-4 border-b border-slate-200 dark:border-slate-700 bg-red-50/60 dark:bg-red-900/10 flex items-center justify-between gap-6">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-0.5">
                  Delete Account
                </p>
                <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">This action is permanent</h1>
              </div>
            </div>

            {/* Body — numbered list of exactly what's lost */}
            <div className="px-8 py-6">
              <h2 className="text-[12px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-4">
                What you will permanently lose
              </h2>
              <ol className="space-y-3">
                {LOSS_ITEMS.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-5 leading-relaxed">
                You&apos;ll be signed out of all devices and won&apos;t be able to sign back in. You&apos;ll be asked to
                verify your identity before the deletion completes.
              </p>

              {error && (
                <div className="flex items-start gap-1.5 text-red-600 dark:text-red-400 mt-4">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium">{error}</p>
                </div>
              )}
            </div>

            {/* Footer — declaration checkbox gates the delete button */}
            <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-6">
              <label className="flex items-center gap-3 cursor-pointer select-none min-w-0">
                <input
                  type="checkbox"
                  checked={agreed}
                  disabled={busy}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 flex-shrink-0 rounded border-slate-300 dark:border-slate-600 text-red-600 focus:ring-red-500 accent-red-600"
                />
                <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  I understand this is permanent and want to delete my account and all my data.
                </span>
              </label>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={close}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={!agreed || busy}
                  className={`inline-flex items-center gap-1.5 px-7 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                    agreed && !busy
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 hover:-translate-y-0.5"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete permanently
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

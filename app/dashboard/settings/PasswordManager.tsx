"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function PwInput({
  id,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
  onEnter,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
  onEnter?: () => void;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Not a real <form> (it lives inside the Account form), so submit on Enter ourselves.
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
          }
        }}
        placeholder={placeholder}
        autoComplete={id === "current-password" ? "current-password" : "new-password"}
        className="w-full pl-3.5 pr-10 py-2 rounded-lg border border-slate-200 bg-white
                   text-sm text-slate-800 placeholder-slate-400
                   focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
                   hover:border-slate-300 transition-all duration-150"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

/**
 * Password management via Clerk.
 *
 * - Users with a password (`passwordEnabled`) can CHANGE it — the current
 *   password is required.
 * - Users who signed in with Google have no password (`passwordEnabled` is
 *   false). They may ADD one, but are never forced to: the section just offers
 *   an optional "Set a password" so they can also sign in with email later.
 */
export default function PasswordManager() {
  const { user, isLoaded } = useUser();

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!isLoaded) return null;

  const hasPassword = Boolean(user?.passwordEnabled);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    setDone(false);

    if (hasPassword && current.length === 0) {
      setError("Enter your current password.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      await user!.updatePassword({
        newPassword: next,
        ...(hasPassword ? { currentPassword: current } : {}),
        signOutOfOtherSessions: true,
      });
      setDone(true);
      setOpen(false);
      reset();
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string; message?: string }[] };
      setError(
        clerkErr?.errors?.[0]?.longMessage ||
          clerkErr?.errors?.[0]?.message ||
          "Could not update your password. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
        Password
      </label>

      {!open ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50">
            <Lock size={14} className="text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-600">
              {hasPassword
                ? "Password set · ••••••••"
                : "No password — you sign in with Google"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setDone(false);
            }}
            className="flex-shrink-0 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all whitespace-nowrap"
          >
            {hasPassword ? "Change" : "Add password"}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          {!hasPassword && (
            <p className="text-[11px] text-slate-500">
              Optional — add a password so you can also sign in with your email, not just Google.
            </p>
          )}

          {hasPassword && (
            <PwInput
              id="current-password"
              value={current}
              onChange={setCurrent}
              placeholder="Current password"
              show={showCurrent}
              onToggle={() => setShowCurrent((s) => !s)}
              onEnter={handleSubmit}
            />
          )}
          <PwInput
            id="new-password"
            value={next}
            onChange={setNext}
            placeholder={hasPassword ? "New password" : "Create a password"}
            show={showNext}
            onToggle={() => setShowNext((s) => !s)}
            onEnter={handleSubmit}
          />
          <PwInput
            id="confirm-password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Confirm password"
            show={showNext}
            onToggle={() => setShowNext((s) => !s)}
            onEnter={handleSubmit}
          />

          {error && (
            <div className="flex items-start gap-1.5 text-red-600">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              <p className="text-[12px] font-medium">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60
                         text-white text-sm font-semibold rounded-lg transition-all duration-150"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              {hasPassword ? "Update Password" : "Set Password"}
            </button>
          </div>
        </div>
      )}

      {done && !open && (
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-teal-600 mt-1.5">
          <CheckCircle2 size={13} />
          {hasPassword ? "Password updated." : "Password added — you can now sign in with email too."}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import {
  Stethoscope,
  Building2,
  MapPin,
  BadgeCheck,
  Target,
  AlignLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { completeOnboarding } from "./actions";

export type OnboardingDefaults = {
  role_title: string;
  hospital: string;
  location: string;
  racgp_id: string;
  exam_target: string;
  bio: string;
};

function Field({
  id,
  label,
  required,
  icon,
  placeholder,
  defaultValue,
  type = "text",
}: {
  id: keyof OnboardingDefaults;
  label: string;
  required?: boolean;
  icon: React.ReactNode;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {icon}
        </span>
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                     text-sm text-slate-800 placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
                     hover:border-slate-300 transition-all duration-150"
        />
      </div>
    </div>
  );
}

export default function OnboardingForm({
  firstName,
  defaults,
}: {
  firstName: string | null;
  defaults: OnboardingDefaults;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      // On success the action redirects server-side; only the error path returns.
      const res = await completeOnboarding(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-slate-100">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {firstName ? `Welcome, ${firstName}!` : "Welcome to The GP Edge!"}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            A few details to personalise your dashboard, exam prep, and billing tools.
            You can change any of this later in Settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3 text-red-700">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <p className="text-[13px] font-medium">{error}</p>
            </div>
          )}

          <Field
            id="role_title"
            label="Training Level / Role"
            required
            icon={<Stethoscope size={14} />}
            placeholder="e.g. GP Registrar — PGY3"
            defaultValue={defaults.role_title}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              id="hospital"
              label="Hospital / Practice"
              icon={<Building2 size={14} />}
              placeholder="e.g. Royal North Shore Hospital"
              defaultValue={defaults.hospital}
            />
            <Field
              id="location"
              label="Location"
              icon={<MapPin size={14} />}
              placeholder="e.g. Sydney, NSW"
              defaultValue={defaults.location}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              id="racgp_id"
              label="RACGP Number"
              icon={<BadgeCheck size={14} />}
              placeholder="e.g. RACGP-89241"
              defaultValue={defaults.racgp_id}
            />
            <Field
              id="exam_target"
              label="Exam Target"
              icon={<Target size={14} />}
              placeholder="e.g. AKT — Aug 2026"
              defaultValue={defaults.exam_target}
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1"
            >
              Short Bio
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 pointer-events-none text-slate-400">
                <AlignLeft size={14} />
              </span>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                placeholder="e.g. RACGP Candidate · PGY3 · Royal North Shore"
                defaultValue={defaults.bio}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                           text-sm text-slate-800 placeholder-slate-400 resize-none
                           focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
                           hover:border-slate-300 transition-all duration-150"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5
                         bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed
                         text-white text-sm font-bold rounded-xl shadow-sm shadow-teal-600/20
                         transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0"
            >
              {pending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Continue to Dashboard"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

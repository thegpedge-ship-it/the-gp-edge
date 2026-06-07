"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Lock,
  LogOut,
  Trash2,
  ChevronRight,
  Calendar,
  Info,
  AlertTriangle,
  Target,
  Camera,
  Upload,
  X,
  MapPin,
  GraduationCap,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import FadeIn from "@/components/ui/FadeIn";
import PageCard from "@/components/ui/PageCard";
import CardHeader from "@/components/ui/CardHeader";
import PageHeading from "@/components/ui/PageHeading";

// ─── Form primitives ────────────────────────────────────────────────────────────
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5"
    >
      {children}
    </label>
  );
}

function TextInput({
  id,
  type = "text",
  defaultValue,
  placeholder,
  readOnly,
  icon,
}: {
  id: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  readOnly?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {icon}
        </span>
      )}
      <input
        id={id}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl border border-slate-200 bg-white
                   text-sm text-slate-800 placeholder-slate-400
                   focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
                   hover:border-slate-300 transition-all duration-150 shadow-sm`}
      />
    </div>
  );
}

function SelectInput({
  id,
  defaultValue,
  options,
}: {
  id: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative select-none">
      <input type="hidden" id={id} name={id} value={value} />
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white
                   text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40
                   focus:border-teal-500 hover:border-slate-300 transition-all duration-150
                   shadow-sm text-left font-medium"
      >
        <span className="truncate">{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ml-2 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 z-50 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
          >
            <div className="p-1">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setValue(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                      isSelected
                        ? "bg-teal-50 text-teal-600 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-teal-500 shrink-0 ml-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  sublabel,
  danger = false,
  id,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  danger?: boolean;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-150 group
        border-b border-slate-50 last:border-0
        ${danger ? "hover:bg-red-50/60" : "hover:bg-slate-50"}`}
    >
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          danger
            ? "bg-red-50 text-red-400 border border-red-100"
            : "bg-slate-100 text-slate-400 border border-slate-200"
        }`}
      >
        {icon}
      </span>
      <div className="flex-1 text-left">
        <p className={`text-sm font-semibold leading-tight ${danger ? "text-red-600" : "text-slate-800"}`}>
          {label}
        </p>
        <p className={`text-xs mt-0.5 ${danger ? "text-red-400" : "text-slate-500"}`}>{sublabel}</p>
      </div>
      <ChevronRight
        size={15}
        className={`flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 ${
          danger ? "text-red-300" : "text-slate-300"
        }`}
      />
    </button>
  );
}

function SaveButton({ id, label = "Save Changes" }: { id: string; label?: string }) {
  return (
    <button
      type="button"
      id={id}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white
                 text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm
                 hover:shadow-md active:scale-[0.98]"
    >
      <CheckCircle2 size={14} />
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [coverHovered, setCoverHovered] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-6 pb-6">

      {/* ── Page title ─────────────────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <PageHeading
          title="Settings"
          subtitle="Manage your account and exam preparation preferences"
        />
      </FadeIn>

      {/* ══ PROFILE HEADER ════════════════════════════════════════════════════ */}
      <FadeIn delay={0.06}>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Cover banner */}
          <div
            className="relative h-32 cursor-pointer group overflow-hidden"
            onMouseEnter={() => setCoverHovered(true)}
            onMouseLeave={() => setCoverHovered(false)}
            onClick={() => coverInputRef.current?.click()}
            role="button"
            aria-label="Update cover photo"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-teal-950 to-slate-900" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  radial-gradient(ellipse at 18% 65%, rgba(20,184,166,0.28) 0%, transparent 52%),
                  radial-gradient(ellipse at 82% 22%, rgba(13,148,136,0.22) 0%, transparent 44%)
                `,
              }}
            />
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 900 130" preserveAspectRatio="none">
              {Array.from({ length: 18 }).map((_, i) => (
                <line key={i} x1={-50 + i * 58} y1="130" x2={i * 58 + 120} y2="0" stroke="white" strokeWidth="1" />
              ))}
            </svg>
            <div className="absolute bottom-3 right-5 flex items-center gap-1.5 select-none pointer-events-none opacity-30">
              <Image src="/assets/logo.png" alt="The GP Edge" width={20} height={20} className="rounded-md object-contain" />
              <span className="text-teal-300 text-[10px] tracking-widest font-medium uppercase">
                The GP Edge
              </span>
            </div>

            <div
              className={`absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center gap-2
                          transition-opacity duration-200 ${coverHovered ? "opacity-100" : "opacity-0"}`}
            >
              <button
                type="button"
                id="upload-cover-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/90 hover:bg-white rounded-xl
                           text-slate-800 text-xs font-semibold transition-all shadow-md"
                onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
              >
                <Upload size={13} />
                Upload Cover
              </button>
              <button
                type="button"
                id="remove-cover-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/20 hover:bg-white/30 rounded-xl
                           text-white text-xs font-semibold border border-white/40 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <X size={13} />
                Remove
              </button>
            </div>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload cover photo file"
            />
          </div>

          {/* Identity strip */}
          <div className="px-7 pb-6 relative">
            {/* Editable avatar */}
            <div
              className="absolute -top-10 left-7 cursor-pointer group"
              onMouseEnter={() => setAvatarHovered(true)}
              onMouseLeave={() => setAvatarHovered(false)}
              onClick={() => avatarInputRef.current?.click()}
              role="button"
              aria-label="Update profile photo"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden ring-[3px] ring-white shadow-md bg-[#E2F0EE]">
                <Avatar className="w-full h-full" />
              </div>
              <div
                className={`absolute inset-0 rounded-full bg-slate-900/50 flex flex-col items-center justify-center
                            transition-opacity duration-200 ${avatarHovered ? "opacity-100" : "opacity-0"}`}
              >
                <Camera size={16} className="text-white" />
                <span className="text-[9px] text-white font-semibold mt-0.5">Change</span>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Upload profile photo file"
              />
            </div>

            {/* Photo management buttons */}
            <div className="flex items-start justify-end pt-2.5 gap-2 flex-wrap">
              <button
                type="button"
                id="change-photo-btn"
                onClick={() => avatarInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200
                           text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300
                           transition-all duration-150"
              >
                <Camera size={12} />
                Change Photo
              </button>
              <button
                type="button"
                id="upload-new-photo-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200
                           text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300
                           transition-all duration-150"
              >
                <Upload size={12} />
                Upload New
              </button>
              <button
                type="button"
                id="remove-photo-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100
                           text-[11px] font-semibold text-red-500 hover:bg-red-50 transition-all duration-150"
              >
                <X size={12} />
                Remove
              </button>
            </div>

            {/* Name + professional context */}
            <div className="ml-28 mt-0.5">
              <h2 className="text-[18px] font-bold text-slate-900 leading-snug">
                Dr. Sarah Chen
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <GraduationCap size={12} className="text-teal-500 flex-shrink-0" />
                  PGY3 · RACGP Candidate
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin size={12} className="text-teal-500 flex-shrink-0" />
                  Royal North Shore Hospital
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <BookOpen size={12} className="text-teal-500 flex-shrink-0" />
                  Preparing for AKT — August 2026
                </span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ══ FORM SECTIONS ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Account Information */}
          <FadeIn delay={0.1}>
            <PageCard>
              <CardHeader
                icon={<User size={15} />}
                title="Account Information"
                subtitle="Manage your personal login details"
              />
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel htmlFor="first-name">First Name</FieldLabel>
                    <TextInput id="first-name" defaultValue="Sarah" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
                    <TextInput id="last-name" defaultValue="Chen" />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="email">Professional Email</FieldLabel>
                  <TextInput id="email" type="email" defaultValue="sarah.chen@thegpledge.com" />
                </div>

                <div>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <TextInput id="password" type="password" defaultValue="••••••••" readOnly />
                    </div>
                    <button
                      type="button"
                      id="change-password-inline-btn"
                      className="flex-shrink-0 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold
                                 text-slate-700 hover:bg-slate-50 hover:border-slate-300
                                 transition-all duration-150 whitespace-nowrap shadow-sm"
                    >
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-1 border-t border-slate-50">
                  <SaveButton id="save-account-btn" />
                </div>
              </div>
            </PageCard>
          </FadeIn>

          {/* Medical Credentials */}
          <FadeIn delay={0.14}>
            <PageCard>
              <CardHeader
                icon={<Shield size={15} />}
                title="Medical Credentials"
                subtitle="Your professional registration and training details"
              />
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel htmlFor="racgp-number">RACGP Number</FieldLabel>
                    <TextInput id="racgp-number" defaultValue="RACGP-89241" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="ahpra-number">AHPRA Number</FieldLabel>
                    <TextInput id="ahpra-number" defaultValue="MED0001234567" />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="training-level">Current Training Level</FieldLabel>
                  <SelectInput
                    id="training-level"
                    defaultValue="PGY3"
                    options={[
                      { value: "PGY1", label: "PGY1 — Intern" },
                      { value: "PGY2", label: "PGY2 — Resident" },
                      { value: "PGY3", label: "PGY3 — Registrar" },
                      { value: "PGY4", label: "PGY4 — Senior Registrar" },
                      { value: "Fellow", label: "Fellow — FRACGP" },
                      { value: "Consultant", label: "Consultant — GP Principal" },
                    ]}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="practice-location">Primary Practice Location</FieldLabel>
                  <TextInput id="practice-location" defaultValue="Royal North Shore Hospital" />
                </div>

                <div className="flex justify-end pt-1 border-t border-slate-50">
                  <SaveButton id="save-credentials-btn" label="Save Credentials" />
                </div>
              </div>
            </PageCard>
          </FadeIn>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Exam Preparation */}
          <FadeIn delay={0.1}>
            <PageCard>
              <CardHeader
                icon={<Target size={15} />}
                title="Exam Preparation"
                subtitle="Customise your study plan and readiness tracking"
              />
              <div className="px-6 py-5 space-y-4">
                <div>
                  <FieldLabel htmlFor="target-exam">Primary Target Exam</FieldLabel>
                  <SelectInput
                    id="target-exam"
                    defaultValue="AKT"
                    options={[
                      { value: "AKT", label: "AKT (Applied Knowledge Test)" },
                      { value: "KFP", label: "KFP (Key Feature Problem)" },
                      { value: "Both", label: "AKT + KFP Combined" },
                      { value: "OSCE", label: "OSCE" },
                    ]}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="exam-date">Target Exam Date</FieldLabel>
                  <TextInput
                    id="exam-date"
                    defaultValue="August 2026"
                    icon={<Calendar size={14} />}
                  />
                </div>

                <div className="flex items-start gap-3 bg-teal-50 border border-teal-100 rounded-xl p-4">
                  <Info size={14} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-teal-800 leading-relaxed">
                    This helps us personalise your dashboard, study plan, and readiness tracking.
                  </p>
                </div>

                <div className="flex justify-end pt-1 border-t border-slate-50">
                  <SaveButton id="save-exam-btn" label="Save Preferences" />
                </div>
              </div>
            </PageCard>
          </FadeIn>

          {/* Security & Account */}
          <FadeIn delay={0.14}>
            <PageCard>
              <CardHeader
                icon={<Lock size={15} />}
                title="Security & Account"
                subtitle="Manage access and active sessions"
              />
              <div className="py-1">
                <ActionRow
                  id="security-change-password-btn"
                  icon={<Lock size={14} />}
                  label="Change Password"
                  sublabel="Update your account password"
                />
                <ActionRow
                  id="logout-all-devices-btn"
                  icon={<LogOut size={14} />}
                  label="Logout All Devices"
                  sublabel="Sign out from all active sessions"
                />
                <ActionRow
                  id="delete-account-btn"
                  icon={<Trash2 size={14} />}
                  label="Delete Account"
                  sublabel="Permanently delete your account and all data"
                  danger
                />
              </div>
            </PageCard>
          </FadeIn>
        </div>
      </div>

      {/* Privacy footer */}
      <FadeIn delay={0.22}>
        <p className="text-center text-xs text-slate-400 pb-2">
          Your data is private, encrypted, and never shared with third parties.{" "}
          <a
            href="#"
            className="text-teal-600 hover:text-teal-700 underline underline-offset-2 transition-colors"
          >
            Learn more in our Privacy Policy.
          </a>
        </p>
      </FadeIn>
    </div>
  );
}

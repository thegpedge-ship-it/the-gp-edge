"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/contexts/ProfileContext";
import {
  User,
  Shield,
  Lock,
  LogOut,
  Trash2,
  Calendar,
  Info,
  Target,
  Camera,
  Upload,
  X,
  ChevronRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import FadeIn from "@/components/ui/FadeIn";
import PageHeading from "@/components/ui/PageHeading";
import PageCard from "@/components/ui/PageCard";
import CardHeader from "@/components/ui/CardHeader";

// ─── Form primitives ────────────────────────────────────────────────────────────
function FieldLabel({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function TextInput({
  id, type = "text", defaultValue, placeholder, readOnly, icon, required, onClick
}: {
  id: string; type?: string; defaultValue?: string; placeholder?: string; readOnly?: boolean; icon?: React.ReactNode; required?: boolean; onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">{icon}</span>}
      <input
        id={id} type={type} defaultValue={defaultValue} placeholder={placeholder} readOnly={readOnly} required={required} onClick={onClick}
        className={`w-full ${icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2 rounded-lg border border-slate-200 bg-white
                   text-sm text-slate-800 placeholder-slate-400
                   focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
                   hover:border-slate-300 transition-all duration-150`}
      />
    </div>
  );
}

function SelectInput({
  id, defaultValue, options,
}: {
  id: string; defaultValue: string; options: { value: string; label: string }[];
}) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative select-none">
      <input type="hidden" id={id} name={id} value={value} />
      <button
        type="button" onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg border border-slate-200 bg-white
                   text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40
                   focus:border-teal-500 hover:border-slate-300 transition-all duration-150 text-left font-medium"
      >
        <span className="truncate">{selectedOption.label}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ml-2 shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 2 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto"
          >
            <div className="p-1">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button key={option.value} type="button"
                    onClick={() => { setValue(option.value); setIsOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-md transition-colors text-left ${
                      isSelected ? "bg-teal-50 text-teal-600 font-semibold" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-teal-500 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

function SaveButton({ id, label = "Save Changes", type = "button" }: { id: string; label?: string; type?: "button" | "submit" }) {
  return (
    <button type={type} id={id}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white
                 text-sm font-semibold rounded-lg transition-all duration-150 hover:shadow-md active:scale-[0.98]"
    >
      <CheckCircle2 size={13} />
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { user } = useUser();
  const profile = useProfile();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <FadeIn delay={0}>
        <div className="pt-4">
          <PageHeading title="Settings" subtitle="Manage your account and exam preparation preferences" />
        </div>
      </FadeIn>

      {/* ══ TWO-COLUMN GRID — columns stretch to equal height; the left      */}
      {/* (Account) card stays its natural size, the right column fills ════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">

        {/* ── Left column (natural height — drives the row) ────────────── */}
        <div className="flex flex-col gap-4 xl:self-start">

        {/* ── Account Information ───────────────────────────────────────── */}
        <FadeIn delay={0.04}>
          <PageCard className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <CardHeader icon={<User size={15} />} title="Account Information" subtitle="Login & personal details" />
            <form className="px-5 pb-5 pt-0 space-y-4" onSubmit={(e) => e.preventDefault()}>
              
              {/* Premium Header Banner */}
              <div className="h-32 w-full relative overflow-hidden rounded-xl flex-shrink-0">
                <Image
                  src="/assets/profile/banner.png"
                  alt="Profile Banner"
                  fill
                  sizes="(max-width: 1200px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                
                {/* Change Cover button */}
                <button
                  type="button"
                  className="absolute top-4 right-4 px-3 py-1.5 bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md text-white text-xs font-medium rounded-lg transition-colors border border-white/10 flex items-center gap-2"
                >
                  <ImageIcon size={13} />
                  Change Cover
                </button>
              </div>

              {/* Avatar row with horizontal centered overlapping avatar and upload button container below */}
              <div className="pb-3 border-b border-slate-100 relative">
                <div className="flex justify-center -mt-16 relative z-10 mb-3">
                  <div
                    className="relative z-10 w-32 h-32 rounded-full ring-4 ring-white bg-white overflow-hidden shadow-sm cursor-pointer"
                    onMouseEnter={() => setAvatarHovered(true)}
                    onMouseLeave={() => setAvatarHovered(false)}
                    onClick={() => avatarInputRef.current?.click()}
                    role="button" aria-label="Update profile photo"
                  >
                    <Image
                      src={user?.imageUrl || "/assets/logo.png"}
                      alt="Profile Photo"
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                    <div className={`absolute inset-0 bg-slate-900/50 flex items-center justify-center transition-opacity duration-200 ${avatarHovered ? "opacity-100" : "opacity-0"}`}>
                      <Camera size={14} className="text-white" />
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" />
                  </div>
                </div>

                <div className="flex flex-col items-center text-center gap-1">
                  <p className="text-sm font-semibold text-slate-800">Profile Photo</p>
                  <p className="text-[11px] text-slate-400">JPG, PNG or GIF. Max 2 MB</p>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="mt-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-all flex-shrink-0"
                  >
                    <Upload size={11} className="inline mr-1 -mt-0.5" />Upload Photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><FieldLabel htmlFor="first-name" required>First Name</FieldLabel><TextInput id="first-name" required defaultValue={user?.firstName || ''} /></div>
                <div><FieldLabel htmlFor="last-name" required>Last Name</FieldLabel><TextInput id="last-name" required defaultValue={user?.lastName || ''} /></div>
              </div>
              <div><FieldLabel htmlFor="email" required>Email</FieldLabel><TextInput id="email" type="email" required defaultValue={user?.primaryEmailAddress?.emailAddress || ''} /></div>
              <div>
                <FieldLabel htmlFor="password" required>Password</FieldLabel>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <TextInput id="password" type={showPassword ? "text" : "password"} required defaultValue="supersecret123" readOnly />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button type="button"
                    className="flex-shrink-0 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all whitespace-nowrap">
                    Change
                  </button>
                </div>
              </div>
              <div><FieldLabel htmlFor="practice-location">Practice Location</FieldLabel><TextInput id="practice-location" defaultValue={[profile.hospital, profile.location].filter(Boolean).join(", ")} placeholder="e.g. Royal North Shore Hospital, Sydney NSW" /></div>
              <div className="flex justify-end pt-1"><SaveButton id="save-account-btn" type="submit" /></div>
            </form>
          </PageCard>
        </FadeIn>

        </div>{/* /Left column */}

        {/* ── Right column (stretches to match the left column's height) ── */}
        <div className="flex flex-col gap-4 xl:h-full">

        {/* ── Exam Preparation ──────────────────────────────────────────── */}
        <FadeIn delay={0.08}>
          <PageCard>
            <CardHeader icon={<Target size={15} />} title="Exam Preparation" subtitle="Training, study plan & targets" />
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="target-exam">Target Exam</FieldLabel>
                  <SelectInput id="target-exam" defaultValue="AKT" options={[
                    { value: "AKT", label: "AKT (Applied Knowledge Test)" },
                    { value: "KFP", label: "KFP (Key Feature Problem)" },
                    { value: "Both", label: "AKT + KFP Combined" },
                    { value: "OSCE", label: "OSCE" },
                  ]} />
                </div>
                <div><FieldLabel htmlFor="exam-date">Exam Date</FieldLabel><TextInput id="exam-date" type="month" defaultValue="2026-08" icon={<Calendar size={13} />} onClick={(e) => { if (e.currentTarget.showPicker) e.currentTarget.showPicker(); }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="study-hours">Daily Study Goal</FieldLabel>
                  <SelectInput id="study-hours" defaultValue="3" options={[
                    { value: "1", label: "1 hour" }, { value: "2", label: "2 hours" },
                    { value: "3", label: "3 hours" }, { value: "4", label: "4 hours" },
                    { value: "5", label: "5+ hours" },
                  ]} />
                </div>
                <div>
                  <FieldLabel htmlFor="weak-areas">Focus Areas</FieldLabel>
                  <SelectInput id="weak-areas" defaultValue="auto" options={[
                    { value: "auto", label: "Auto-detect weak areas" },
                    { value: "cardiology", label: "Cardiology" },
                    { value: "respiratory", label: "Respiratory" },
                    { value: "gastro", label: "Gastroenterology" },
                    { value: "endo", label: "Endocrinology" },
                  ]} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="training-level">Training Level</FieldLabel>
                  <SelectInput id="training-level" defaultValue="GPY3" options={[
                    { value: "GPY1", label: "GPY1" },
                    { value: "GPY2", label: "GPY2" },
                    { value: "GPY3", label: "GPY3" },
                    { value: "GPY4", label: "GPY4" },
                    { value: "GPY5", label: "GPY5" },
                    { value: "GPY6", label: "GPY6" },
                    { value: "GPY7", label: "GPY7" },
                    { value: "GPY8", label: "GPY8" },
                    { value: "GPY9", label: "GPY9" },
                    { value: "GPY10", label: "GPY10" },
                    { value: "GPY11", label: "GPY11" },
                    { value: "GPY12", label: "GPY12" },
                    { value: "GPY13", label: "GPY13" },
                    { value: "GPY14", label: "GPY14" },
                    { value: "GPY15", label: "GPY15" },
                    { value: "GPY16", label: "GPY16" },
                    { value: "GPY17", label: "GPY17" },
                    { value: "GPY18", label: "GPY18" },
                    { value: "GPY19", label: "GPY19" },
                    { value: "GPY20", label: "GPY20" },
                  ]} />
                </div>
                <div><FieldLabel htmlFor="supervisor">Training Supervisor</FieldLabel><TextInput id="supervisor" placeholder="e.g. Dr. James Miller" /></div>
              </div>
              <div className="flex items-start gap-2.5 bg-teal-50 border border-teal-100 rounded-lg p-3">
                <Info size={13} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-teal-800 leading-relaxed">These settings personalise your dashboard and study plan.</p>
              </div>
              <div className="flex justify-end pt-1"><SaveButton id="save-exam-btn" label="Save Preferences" /></div>
            </div>
          </PageCard>
        </FadeIn>

        {/* ── Security & Account (grows to fill the column) ─────────────── */}
        <FadeIn delay={0.10} className="xl:flex xl:flex-1">
          <PageCard className="xl:h-full xl:flex xl:flex-col">
            <CardHeader icon={<Lock size={15} />} title="Security & Account" subtitle="Password & account actions" />
            <div className="px-5 py-4 space-y-4 xl:flex-1 xl:flex xl:flex-col">
              {/* Actions */}
              <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-100 dark:border-slate-800/80 rounded-lg overflow-hidden">
                {[
                  { id: "sec-pw", icon: <Lock size={14} />, label: "Change Password", desc: "Update your password" },
                  { id: "sec-2fa", icon: <Shield size={14} />, label: "Two-Factor Auth", desc: "Extra security layer" },
                  { id: "sec-logout", icon: <LogOut size={14} />, label: "Logout All Devices", desc: "End all sessions" },
                ].map((item) => (
                  <button key={item.id} type="button" id={item.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <span className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400">{item.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-150">{item.label}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Danger Zone — pinned to the bottom of the stretched card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-100 dark:border-red-950/40 bg-red-50/10 dark:bg-red-950/10 xl:mt-auto">
                <div className="flex gap-3 items-start">
                  <span className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 flex items-center justify-center flex-shrink-0 text-red-500 dark:text-red-400">
                    <Trash2 size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-red-650 dark:text-red-400">Delete Account</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Permanently delete account and all data. This action is irreversible.</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="delete-account-btn"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-lg transition-all duration-150 shadow-md shadow-red-650/10 active:scale-[0.98] cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </PageCard>
        </FadeIn>

        </div>{/* /Right column */}
      </div>

      <p className="text-center text-xs text-slate-400">
        Your data is private, encrypted, and never shared.{" "}
        <a href="#" className="text-teal-600 hover:text-teal-700 underline underline-offset-2 transition-colors">Privacy Policy</a>
      </p>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
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
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import FadeIn from "@/components/ui/FadeIn";
import PageHeading from "@/components/ui/PageHeading";
import PageCard from "@/components/ui/PageCard";
import CardHeader from "@/components/ui/CardHeader";
import ProfileBillingCard from "@/components/dashboard/ProfileBillingCard";
import PasswordManager from "./PasswordManager";
import DeleteAccountModal from "./DeleteAccountModal";
import { updateProfileInfo } from "./actions";

// Short label used when composing the stored "exam target" string.
const EXAM_SHORT: Record<string, string> = {
  AKT: "AKT",
  KFP: "KFP",
  Both: "AKT + KFP",
  OSCE: "OSCE",
};

// "2026-08" → "Aug 2026" (for composing the exam target). Empty input → "".
function monthLabel(value: string): string {
  if (!value) return "";
  const d = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-AU", { month: "short", year: "numeric" });
}

// Inline save feedback shown next to a card's Save button.
function SaveStatus({ status }: { status: { type: "ok" | "err"; text: string } | null }) {
  if (!status) return null;
  const ok = status.type === "ok";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${ok ? "text-teal-600" : "text-red-600"}`}>
      {ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      {status.text}
    </span>
  );
}

// ─── Form primitives ────────────────────────────────────────────────────────────
function FieldLabel({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
      {children}
      {required && <span className="text-rose-500 ml-1">*</span>}
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
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">{icon}</span>}
      <input
        id={id} name={id} type={type} defaultValue={defaultValue} placeholder={placeholder} readOnly={readOnly} required={required} onClick={onClick}
        aria-disabled={readOnly || undefined}
        className={`w-full ${icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5 rounded-xl border text-sm transition-all duration-150
                   ${readOnly
                     ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 cursor-not-allowed select-all focus:outline-none"
                     : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"}`}
      />
    </div>
  );
}

function SelectInput({
  id, defaultValue, options, dropUp = false,
}: {
  id: string; defaultValue: string; options: { value: string; label: string }[]; dropUp?: boolean;
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
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90
                   text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/40
                   focus:border-teal-500 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150 text-left font-medium cursor-pointer"
      >
        <span className="truncate">{selectedOption.label}</span>
        <svg className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ml-2 shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropUp ? 4 : -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: dropUp ? 4 : -4 }}
            transition={{ duration: 0.1 }}
            className={`absolute left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto ${
              dropUp ? "bottom-full mb-1" : "top-full mt-1"
            }`}
          >
            <div className="p-1.5">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button key={option.value} type="button"
                    onClick={() => { setValue(option.value); setIsOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${
                      isSelected ? "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 font-semibold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
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

function SaveButton({ id, label = "Save Changes", type = "button", loading = false }: { id: string; label?: string; type?: "button" | "submit"; loading?: boolean }) {
  return (
    <button type={type} id={id} disabled={loading}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white
                 text-sm font-semibold rounded-lg transition-all duration-150 hover:shadow-md active:scale-[0.98]"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type SaveState = { type: "ok" | "err"; text: string } | null;

export default function SettingsClient({
  accessInfo,
  hasCustomerProfile,
}: {
  accessInfo: any;
  hasCustomerProfile: boolean;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const profile = useProfile();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ── Log out of every device: revoke all of this user's sessions, then sign
  //    out the current one and bounce to the sign-in page ───────────────────
  async function handleLogoutAll() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const sessions = (await user?.getSessions()) ?? [];
      await Promise.all(sessions.map((s) => s.revoke().catch(() => undefined)));
    } catch {
      // Revoking remote sessions is best-effort; we still sign out locally below.
    } finally {
      await signOut({ redirectUrl: "/sign-in" });
    }
  }

  const [savingAccount, setSavingAccount] = useState(false);
  const [accountStatus, setAccountStatus] = useState<SaveState>(null);
  const [savingExam, setSavingExam] = useState(false);
  const [examStatus, setExamStatus] = useState<SaveState>(null);

  // ── Account Information: name → Clerk, practice location → our DB ─────────
  async function handleSaveAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAccountStatus(null);
    setSavingAccount(true);
    const fd = new FormData(e.currentTarget);
    const firstName = String(fd.get("first-name") ?? "").trim();
    const lastName = String(fd.get("last-name") ?? "").trim();
    const practice = String(fd.get("practice-location") ?? "").trim();

    // Practice location is one field; split "Hospital, City" → hospital + location.
    let hospital: string | null = null;
    let location: string | null = null;
    if (practice) {
      const i = practice.indexOf(",");
      if (i === -1) {
        hospital = practice;
      } else {
        hospital = practice.slice(0, i).trim() || null;
        location = practice.slice(i + 1).trim() || null;
      }
    }

    try {
      if (user && (firstName !== (user.firstName ?? "") || lastName !== (user.lastName ?? ""))) {
        await user.update({ firstName, lastName });
      }
      const res = await updateProfileInfo({ hospital, location });
      if (!res.ok) throw new Error(res.error);
      setAccountStatus({ type: "ok", text: "Saved." });
    } catch (err: unknown) {
      const e2 = err as { errors?: { message?: string }[]; message?: string };
      setAccountStatus({ type: "err", text: e2?.errors?.[0]?.message || e2?.message || "Could not save." });
    } finally {
      setSavingAccount(false);
    }
  }

  // ── Exam Preparation: compose exam target + training level into our DB ────
  async function handleSaveExam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setExamStatus(null);
    setSavingExam(true);
    const fd = new FormData(e.currentTarget);
    const targetExam = String(fd.get("target-exam") ?? "");
    const examDate = String(fd.get("exam-date") ?? "");
    const trainingLevel = String(fd.get("training-level") ?? "").trim();

    const short = EXAM_SHORT[targetExam] ?? targetExam;
    const when = monthLabel(examDate);
    const examTarget = [short, when].filter(Boolean).join(" — ");

    try {
      const res = await updateProfileInfo({
        examTarget: examTarget || null,
        roleTitle: trainingLevel || null,
      });
      if (!res.ok) throw new Error(res.error);
      setExamStatus({ type: "ok", text: "Preferences saved." });
    } catch (err: unknown) {
      const e2 = err as { message?: string };
      setExamStatus({ type: "err", text: e2?.message || "Could not save." });
    } finally {
      setSavingExam(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-7xl mx-auto w-full px-4 sm:px-6">
      <FadeIn delay={0}>
        <div className="pt-2 sm:pt-4">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Settings
          </h1>
        </div>
      </FadeIn>

      {/* ══ TWO-COLUMN GRID — Left column: Account Info, Right column: Exam Prep & Security ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <FadeIn delay={0.04} className="h-full">
            <PageCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs flex flex-col h-full overflow-hidden">
              <CardHeader icon={<User size={15} />} title="Account Information" subtitle="Login & personal details" />
              <form className="px-5 pb-5 pt-0 space-y-4 flex-1 flex flex-col justify-between" onSubmit={handleSaveAccount}>
                <div className="space-y-4">
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
                      className="absolute top-4 right-4 px-3 py-1.5 bg-slate-900/50 hover:bg-slate-900/70 backdrop-blur-md text-white text-xs font-medium rounded-lg transition-colors border border-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <ImageIcon size={13} />
                      Change Cover
                    </button>
                  </div>

                  {/* Avatar row */}
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800 relative">
                    <div className="flex justify-center -mt-16 relative z-10 mb-3">
                      <div
                        className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-white dark:ring-slate-900 bg-white dark:bg-slate-800 overflow-hidden shadow-sm cursor-pointer"
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
                          <Camera size={16} className="text-white" />
                        </div>
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center gap-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Profile Photo</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">JPG, PNG or GIF. Max 2 MB</p>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="mt-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Upload size={12} className="inline mr-1.5 -mt-0.5" />Upload Photo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div><FieldLabel htmlFor="first-name" required>First Name</FieldLabel><TextInput id="first-name" required defaultValue={user?.firstName || ''} /></div>
                    <div><FieldLabel htmlFor="last-name" required>Last Name</FieldLabel><TextInput id="last-name" required defaultValue={user?.lastName || ''} /></div>
                  </div>
                  <div>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <TextInput id="email" type="email" defaultValue={user?.primaryEmailAddress?.emailAddress || ''} readOnly icon={<Lock size={13} />} />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Email is tied to your sign-in and can&apos;t be changed here.</p>
                  </div>

                  {/* Password manager */}
                  <PasswordManager />

                  <div><FieldLabel htmlFor="practice-location">Practice Location</FieldLabel><TextInput id="practice-location" defaultValue={[profile.hospital, profile.location].filter(Boolean).join(", ")} placeholder="e.g. Royal North Shore Hospital, Sydney NSW" /></div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <SaveStatus status={accountStatus} />
                  <SaveButton id="save-account-btn" type="submit" loading={savingAccount} />
                </div>
              </form>
            </PageCard>
          </FadeIn>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:h-full justify-between">

          {/* ── Exam Preparation ──────────────────────────────────────────── */}
          <FadeIn delay={0.08} className="relative z-20">
            <PageCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs !overflow-visible">
              <CardHeader icon={<Target size={15} />} title="Exam Preparation" subtitle="Training, study plan & targets" />
              <form className="px-5 py-4 space-y-3.5" onSubmit={handleSaveExam}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <FieldLabel htmlFor="target-exam">Target Exam</FieldLabel>
                    <SelectInput id="target-exam" defaultValue="AKT" options={[
                      { value: "AKT", label: "AKT (Applied Knowledge Test)" },
                      { value: "KFP", label: "KFP (Key Feature Problem)" },
                      { value: "Both", label: "AKT + KFP Combined" },
                      { value: "OSCE", label: "OSCE" },
                    ]} />
                  </div>
                  <div><FieldLabel htmlFor="exam-date">Exam Date</FieldLabel><TextInput id="exam-date" type="month" defaultValue="2026-08" onClick={(e) => { if (e.currentTarget.showPicker) e.currentTarget.showPicker(); }} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                <div className="flex items-start gap-2.5 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 rounded-xl p-3">
                  <Info size={14} className="text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-teal-800 dark:text-teal-300 leading-relaxed">Target exam and training level are saved to your profile. Study goal, focus areas and supervisor are coming soon.</p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <SaveStatus status={examStatus} />
                  <SaveButton id="save-exam-btn" type="submit" label="Save Preferences" loading={savingExam} />
                </div>
              </form>
            </PageCard>
          </FadeIn>

          {/* ── Security & Account ────────────────────────────────────────── */}
          <FadeIn delay={0.10} className="flex-1 flex flex-col">
            <PageCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs flex flex-col flex-1 h-full">
              <CardHeader icon={<Lock size={15} />} title="Security & Account" subtitle="Password & account actions" />
              <div className="px-5 py-4 flex-1 flex flex-col justify-between gap-4">
                {/* Actions */}
                <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden">
                  {[
                    { id: "sec-logout", icon: <LogOut size={14} />, label: "Logout All Devices", desc: loggingOut ? "Signing out…" : "End every active session", onClick: handleLogoutAll },
                  ].map((item) => (
                    <button key={item.id} type="button" id={item.id} onClick={item.onClick} disabled={item.id === "sec-logout" && loggingOut}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-60 transition-colors group cursor-pointer">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400">{item.icon}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.desc}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </button>
                  ))}
                </div>

                {/* Danger Zone */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/40 dark:bg-rose-950/20 mt-2">
                  <div className="flex gap-3 items-start">
                    <span className="w-8 h-8 rounded-lg bg-rose-100/60 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400">
                      <Trash2 size={15} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Delete Account</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Permanently delete account and all data. This action is irreversible.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="delete-account-btn"
                    onClick={() => setDeleteOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-xl transition-all duration-150 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </PageCard>
          </FadeIn>

        </div>{/* /Right column */}
      </div>

      {/* ── Billing & Subscription ──────────────────────────────────────── */}
      <FadeIn delay={0.12}>
        <PageCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs">
          <ProfileBillingCard
            compact={true}
            accessLevel={accessInfo?.accessLevel ?? "FREE"}
            hasPaidAccess={accessInfo?.hasPaidAccess ?? false}
            isRegistrarActive={accessInfo?.isRegistrarActive ?? false}
            accessExpiresAt={accessInfo?.currentPeriodEnd ?? null}
            hasCustomerProfile={hasCustomerProfile}
            cancelAtPeriodEnd={accessInfo?.cancelAtPeriodEnd ?? false}
            isRecurring={accessInfo?.accessLevel === "FELLOWSHIP" || accessInfo?.accessLevel === "POST_REGISTRAR_UPGRADE"}
            showDownloadInvoice={true}
            showCancelSubscription={true}
            activePlanName={accessInfo?.planName}
          />
        </PageCard>
      </FadeIn>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
        Your data is private, encrypted, and never shared.{" "}
        <a href="#" className="text-teal-600 dark:text-teal-400 hover:underline underline-offset-2 transition-colors">Privacy Policy</a>
      </p>

      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
}

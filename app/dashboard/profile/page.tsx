"use client";

import { motion } from "framer-motion";
import {
  GraduationCap,
  MapPin,
  BookOpen,
  Hash,
  ShieldCheck,
  Target,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Award,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { user, badges, stats, examPaths } from "@/components/dashboard/data";

// ─── Animation helper ───────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, delay, ease: [0.22, 1, 0.36, 1] },
});

// ─── Professional neutral avatar (matches sidebar & settings) ───────────────────
function DefaultAvatar({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Default profile avatar"
    >
      <circle cx="48" cy="48" r="48" fill="#E2F0EE" />
      <circle cx="48" cy="33" r="15" fill="#8BBDB8" />
      <path d="M10 84c0-15.464 17.01-28 38-28s38 12.536 38 28" fill="#8BBDB8" />
    </svg>
  );
}

// ─── Info row used in credentials / details ─────────────────────────────────────
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Stat chip ──────────────────────────────────────────────────────────────────
function StatChip({
  value,
  label,
  accent = "teal",
}: {
  value: string;
  label: string;
  accent?: "teal" | "emerald" | "amber" | "slate";
}) {
  const colors: Record<string, string> = {
    teal:   "bg-teal-500/10 dark:bg-brand-500/10 border-teal-500/20 dark:border-brand-500/20 text-teal-600 dark:text-brand-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    amber:   "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    slate:   "glass border-slate-200/60 dark:border-slate-800/80 text-slate-700 dark:text-slate-300",
  };
  return (
    <div className={`flex flex-col items-center justify-center px-4 py-3.5 rounded-2xl border ${colors[accent]}`}>
      <span className="text-xl font-bold leading-none">{value}</span>
      <span className="text-[11px] font-medium mt-1 opacity-80 text-center leading-tight">{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 pb-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)}>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your professional identity and exam preparation overview
        </p>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          PROFILE HERO — banner + avatar + identity
         ══════════════════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.06)}>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Banner — dark clinical gradient matching sidebar */}
          <div className="relative h-40 overflow-hidden">
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
            {/* Diagonal line pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 900 160" preserveAspectRatio="none">
              {Array.from({ length: 18 }).map((_, i) => (
                <line key={i} x1={-50 + i * 58} y1="160" x2={i * 58 + 120} y2="0" stroke="white" strokeWidth="1" />
              ))}
            </svg>
            {/* GP Edge branding */}
            <div className="absolute bottom-4 right-6 flex items-center gap-1.5 opacity-30 select-none">
              <div className="w-5 h-5 rounded-[4px] bg-teal-500/50 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">GP</span>
              </div>
              <span className="text-teal-300 text-[10px] tracking-widest font-medium uppercase">The GP Edge</span>
            </div>
          </div>

          {/* Identity strip — avatar overlaps banner */}
          <div className="px-8 pb-7 relative">
            {/* Avatar */}
            <div className="absolute -top-14 left-8">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white shadow-xl bg-[#E2F0EE]">
                <DefaultAvatar className="w-full h-full" />
              </div>
            </div>

            {/* Edit profile button — top right */}
            <div className="flex justify-end pt-4">
              <Link
                href="/dashboard/settings"
                id="edit-profile-link"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200
                           text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300
                           transition-all duration-150"
              >
                Edit Profile
              </Link>
            </div>

            {/* Name + credentials — positioned to the right of the avatar */}
            <div className="ml-36 mt-1">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
                Dr. {user.firstName} {user.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                  <GraduationCap size={14} className="text-teal-500 flex-shrink-0" />
                  PGY3 · RACGP Candidate
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                  <MapPin size={14} className="text-teal-500 flex-shrink-0" />
                  {user.hospital}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                  <BookOpen size={14} className="text-teal-500 flex-shrink-0" />
                  Preparing for AKT · August 2026
                </span>
              </div>
            </div>

            {/* Joined date at bottom right */}
            <div className="absolute bottom-7 right-8 text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                Member Since
                <p className="text-sm font-bold text-slate-800 leading-none">
                  {user.joinedLabel.replace("Joined ", "")}
                </p>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS ROW — compact performance snapshot
         ══════════════════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.1)}>
        <div className="grid grid-cols-4 gap-4">
          <StatChip value={stats[0].value} label="Study Streak" accent="slate" />
          <StatChip value={stats[1].value} label="Avg Accuracy" accent="emerald" />
          <StatChip value={stats[2].value} label="Quiz Attempts" accent="slate" />
          <StatChip value={stats[3].value} label="Mock Exams" accent="teal" />
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          TWO-COLUMN: Credentials + Exam Readiness
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ── Medical Credentials ─────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.14)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-[14px] leading-tight">
                  Medical Credentials
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Professional registration details</p>
              </div>
            </div>
            <div className="px-6 py-1">
              <DetailRow label="RACGP Number"      value={user.contact.racgpId} />
              <DetailRow label="AHPRA Number"      value="MED0001234567" />
              <DetailRow label="Training Level"    value="PGY3 — Registrar" />
              <DetailRow label="Practice Location" value={`${user.hospital}, Sydney NSW`} />
            </div>
          </div>
        </motion.div>

        {/* ── Exam Readiness ───────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.14)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-[14px] leading-tight">
                  Exam Preparation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Active exam targets and readiness</p>
              </div>
            </div>
            <div className="px-6 py-3 space-y-4">
              {examPaths.map((exam) => {
                const pct = exam.readiness;
                return (
                  <div key={exam.code}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{exam.code}</p>
                        <p className="text-xs text-slate-500">{exam.name}</p>
                      </div>
                      <span className="text-sm font-bold text-teal-700">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {exam.mocksDone} / {exam.mocksTotal} mocks · Next: {exam.nextMilestone}
                    </p>
                  </div>
                );
              })}

              <div className="flex items-center gap-2 mt-2 p-3 rounded-xl bg-teal-50 border border-teal-100">
                <Calendar size={13} className="text-teal-600 flex-shrink-0" />
                <p className="text-[12px] font-semibold text-teal-800">{user.examTarget}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BADGES & ACHIEVEMENTS
         ══════════════════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.18)}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-[14px] leading-tight">
                  Achievements & Badges
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Earned milestones</p>
              </div>
            </div>
            <button type="button" className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              View all
            </button>
          </div>
          <div className="px-6 py-5">
            <div className="flex gap-6 flex-wrap">
              {badges.map((b, i) => (
                <motion.div
                  key={b.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + i * 0.06 }}
                  className="group flex flex-col items-center gap-1.5"
                  title={`${b.name} · Earned ${b.earned}`}
                >
                  <div className="relative w-14 h-14 transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-105">
                    <Image src={b.img} alt={b.name} fill sizes="56px" className="object-contain drop-shadow-md" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 text-center leading-tight">{b.name}</span>
                  <span className="text-[10px] text-slate-400">{b.earned}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick actions ─────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.22)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/settings"
            id="profile-goto-settings"
            className="flex items-center justify-between gap-4 px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm
                       hover:border-teal-500 hover:bg-teal-50/20 hover:scale-[1.01] hover:shadow-md transition-all duration-200 group"
          >
            <div>
              <p className="text-sm font-bold text-slate-800 group-hover:text-teal-600 transition-colors">Edit Settings</p>
              <p className="text-xs text-slate-500 mt-0.5">Update credentials</p>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
          </Link>

          <Link
            href="/dashboard"
            id="profile-goto-dashboard"
            className="flex items-center justify-between gap-4 px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm
                       hover:border-teal-500 hover:bg-teal-50/20 hover:scale-[1.01] hover:shadow-md transition-all duration-200 group"
          >
            <div>
              <p className="text-sm font-bold text-slate-800 group-hover:text-teal-600 transition-colors">Dashboard</p>
              <p className="text-xs text-slate-500 mt-0.5">View study cockpit</p>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
          </Link>
        </div>
      </motion.div>

    </div>
  );
}

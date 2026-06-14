import {
  GraduationCap,
  MapPin,
  BookOpen,
  Calendar,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { user as localUser, badges, stats, examPaths } from "@/components/dashboard/data";
import Avatar from "@/components/ui/Avatar";
import FadeIn from "@/components/ui/FadeIn";
import PageCard from "@/components/ui/PageCard";
import PageHeading from "@/components/ui/PageHeading";

// ─── Info row ────────────────────────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800/85 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1">
          {label}
        </p>
        <p className="font-sans text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default async function ProfilePage() {
  const user = await currentUser();

  return (
    <div className="flex flex-col gap-6 pb-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <PageHeading
          title="My Profile"
          subtitle="Your professional identity and exam preparation overview"
        />
      </FadeIn>

      {/* ── Main Layout Split (Horizontal Baseline Stretching) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (Sleek Profile Element & Telemetry) */}
        <div className="lg:col-span-4 w-full flex flex-col">
          <FadeIn delay={0.06} className="h-full flex flex-col flex-1">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between h-full shadow-sm text-slate-700 dark:text-slate-300">
              
              {/* Premium Header Banner */}
              <div className="h-32 w-full relative overflow-hidden rounded-t-2xl flex-shrink-0">
                <Image
                  src="/assets/profile/banner.png"
                  alt="Profile Banner"
                  fill
                  sizes="(max-width: 1200px) 100vw, 33vw"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Profile Identity Content */}
              <div className="px-5 pb-5 pt-0 flex flex-col flex-1 justify-between gap-4">
                
                <div className="flex flex-col items-center text-center">
                  {/* Overlapping Avatar with white border */}
                  <div className="-mt-12 relative z-10 mx-auto w-24 h-24 rounded-full ring-4 ring-white dark:ring-slate-900 bg-white dark:bg-slate-950 overflow-hidden shadow-sm flex-shrink-0">
                    <Image
                      src={user?.imageUrl || "/assets/logo.png"}
                      alt={user?.fullName || "User Avatar"}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <h2 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-50 mt-2">
                    {user?.fullName || "GP Candidate"}
                  </h2>
                  {user?.primaryEmailAddress?.emailAddress && (
                    <p className="font-sans text-xs text-slate-400 mt-1">
                      {user.primaryEmailAddress.emailAddress}
                    </p>
                  )}
                  <div className="flex flex-col gap-1 mt-2.5 font-sans text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center justify-center gap-1">
                      <GraduationCap size={12} className="text-teal-600 dark:text-teal-400" />
                      PGY3 · RACGP Candidate
                    </span>
                    <span className="flex items-center justify-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      {localUser.hospital}
                    </span>
                    <span className="flex items-center justify-center gap-1">
                      <BookOpen size={12} className="text-slate-400" />
                      Preparing for AKT · August 2026
                    </span>
                  </div>
                </div>

                {/* Refined Inner Telemetry Grid */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 text-center flex flex-col items-center justify-center"
                    >
                      <span className="font-sans text-xl font-semibold text-slate-900 dark:text-slate-50 leading-none">{stat.value}</span>
                      <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 mt-1.5 leading-tight">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Extra details (Hospital, Preparation tracker, Joined Date) */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/85 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Location:</span>
                    <span className="font-sans text-xs font-semibold text-slate-700 dark:text-slate-350 truncate max-w-[150px]">{localUser.hospital}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Target Track:</span>
                    <span className="font-sans text-xs font-semibold text-slate-700 dark:text-slate-300">AKT · Aug 2026</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Member Since:</span>
                    <span className="font-sans text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {localUser.joinedLabel.replace("Joined ", "")}
                    </span>
                  </div>
                </div>

                {/* Edit Profile Action Button */}
                <Link
                  href="/dashboard/settings"
                  id="edit-profile-link"
                  className="w-full text-center py-2.5 rounded-xl bg-teal-600 hover:bg-teal-505 font-sans font-semibold text-sm text-white transition-all duration-150 mt-1"
                >
                  Edit Profile
                </Link>

              </div>

            </div>
          </FadeIn>
        </div>

        {/* Right Column (2x2 Metrics Dashboard Grid) */}
        <div className="lg:col-span-8 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Medical Credentials */}
          <FadeIn delay={0.10}>
            <PageCard className="h-full">
              <div className="p-6 h-full flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100 mb-1">
                    Medical Credentials
                  </h3>
                  <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Professional registration details
                  </p>
                  
                  <div className="mt-4 space-y-1">
                    <DetailRow label="RACGP Number" value={localUser.contact.racgpId} />
                    <DetailRow label="AHPRA Number" value="MED0001234567" />
                    <DetailRow label="Training Level" value="PGY3 — Registrar" />
                    <DetailRow label="Practice Location" value={`${localUser.hospital}, Sydney NSW`} />
                  </div>
                </div>
              </div>
            </PageCard>
          </FadeIn>

          {/* Card 2: Exam Preparation */}
          <FadeIn delay={0.14}>
            <PageCard className="h-full">
              <div className="p-6 h-full flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100 mb-1">
                    Exam Preparation
                  </h3>
                  <p className="font-sans text-xs text-slate-550 dark:text-slate-400 mb-4">
                    Active exam targets and readiness
                  </p>
                  
                  <div className="mt-5 space-y-4">
                    {examPaths.map((exam) => {
                      const pct = exam.readiness;
                      return (
                        <div key={exam.code} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-sans text-sm font-semibold text-slate-800 dark:text-slate-200">{exam.code}</p>
                              <p className="font-sans text-[11px] text-slate-500 dark:text-slate-450 leading-none">{exam.name}</p>
                            </div>
                            <span className="font-sans text-sm font-bold text-teal-600 dark:text-teal-400">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="font-sans text-[11px] text-slate-500 dark:text-slate-450 leading-none">
                            {exam.mocksDone} / {exam.mocksTotal} mocks · Next: {exam.nextMilestone}
                          </p>
                        </div>
                      );
                    })}

                    {/* Active Track Highlight Banner */}
                    <div className="flex items-center gap-2 mt-2 p-2.5 rounded-xl bg-gradient-to-r from-teal-500/10 to-transparent border border-teal-500/20 text-teal-600 dark:text-teal-400">
                      <Calendar size={12} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      <p className="font-sans text-[11px] font-semibold">{localUser.examTarget}</p>
                    </div>
                  </div>
                </div>
              </div>
            </PageCard>
          </FadeIn>

          {/* Card 3: Achievements & Badges */}
          <FadeIn delay={0.18}>
            <PageCard className="h-full">
              <div className="p-6 h-full flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100">
                        Achievements & Badges
                      </h3>
                      <p className="font-sans text-xs text-slate-550 dark:text-slate-400">
                        Earned milestones
                      </p>
                    </div>
                    <button type="button" className="font-sans text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors">
                      View all
                    </button>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex gap-4 flex-wrap">
                      {badges.map((b) => (
                        <div
                          key={b.key}
                          className="group flex flex-col items-center gap-1.5"
                          title={`${b.name} · Earned ${b.earned}`}
                        >
                          <div className="relative w-12 h-12 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
                            <Image src={b.img} alt={b.name} fill sizes="48px" className="object-contain drop-shadow-sm" />
                          </div>
                          <span className="font-sans text-[10px] font-medium text-slate-650 dark:text-slate-350 text-center leading-tight max-w-[65px] truncate">{b.name}</span>
                          <span className="font-sans text-[9px] text-slate-500 dark:text-slate-450">{b.earned}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </PageCard>
          </FadeIn>

          {/* Card 4: Quick Actions */}
          <FadeIn delay={0.22}>
            <PageCard className="h-full">
              <div className="p-6 h-full flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100 mb-1">
                    Quick Actions
                  </h3>
                  <p className="font-sans text-xs text-slate-550 dark:text-slate-400 mb-4">
                    Navigate or update profile settings
                  </p>
                  
                  <div className="mt-5 flex flex-col gap-3">
                    {/* Settings Link */}
                    <Link
                      href="/dashboard/settings"
                      id="profile-goto-settings"
                      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-teal-500/10 bg-gradient-to-r from-teal-500/5 to-transparent hover:from-teal-500/10 hover:to-transparent transition-all duration-200 group shadow-sm"
                    >
                      <div>
                        <p className="font-sans text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition-colors">Edit Settings</p>
                        <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Update credentials</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-450 dark:text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                    </Link>

                    {/* Dashboard Link */}
                    <Link
                      href="/dashboard"
                      id="profile-goto-dashboard"
                      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-teal-500/10 bg-gradient-to-r from-teal-500/5 to-transparent hover:from-teal-500/10 hover:to-transparent transition-all duration-200 group shadow-sm"
                    >
                      <div>
                        <p className="font-sans text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition-colors">Dashboard</p>
                        <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">View study cockpit</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-455 dark:text-slate-450 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                    </Link>
                  </div>
                </div>
              </div>
            </PageCard>
          </FadeIn>

        </div>
      </div>

    </div>
  );
}

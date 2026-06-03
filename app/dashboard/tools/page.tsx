"use client";

import FadeIn from "@/components/ui/FadeIn";
import PageHeading from "@/components/ui/PageHeading";
import PageCard from "@/components/ui/PageCard";
import CardHeader from "@/components/ui/CardHeader";
import {
  Wrench,
  FileText,
  Calculator,
  ClipboardList,
  BookMarked,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// ─── Tool registry ────────────────────────────────────────────────────────────
const TOOLS = [
  {
    key: "mbs-billing",
    title: "MBS Billing Guide",
    description: "Look up item numbers, fee schedules, and billing rules for GP consultations.",
    icon: Calculator,
    href: "/dashboard/billing",
    badge: "1,924 items",
    color: "emerald" as const,
  },
  {
    key: "medical-library",
    title: "Medical Library",
    description: "Browse clinical guidelines, diagnostic criteria, and treatment summaries.",
    icon: BookMarked,
    href: "/dashboard/medical-library",
    badge: "318 entries",
    color: "teal" as const,
  },
  {
    key: "autofills",
    title: "Clinical Autofills",
    description: "Smart templates and macros for common GP documentation workflows.",
    icon: FileText,
    href: "/autofills",
    badge: "42 saved",
    color: "violet" as const,
  },
  {
    key: "case-library",
    title: "Case Library",
    description: "Browse and practise with curated clinical case scenarios.",
    icon: Stethoscope,
    href: "#",
    badge: "Coming soon",
    color: "amber" as const,
  },
  {
    key: "checklists",
    title: "Clinical Checklists",
    description: "Quick-reference checklists for assessments, handovers, and procedures.",
    icon: ClipboardList,
    href: "#",
    badge: "Coming soon",
    color: "sky" as const,
  },
  {
    key: "calculator",
    title: "Clinical Calculators",
    description: "BMI, GFR, Wells score, PHQ-9, GAD-7, and other validated tools.",
    icon: Wrench,
    href: "#",
    badge: "Coming soon",
    color: "rose" as const,
  },
];

const COLOR_CLASSES: Record<string, { bg: string; text: string; badge: string; border: string; dot: string }> = {
  emerald: { bg: "bg-emerald-50",   text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700 border-emerald-200/60", border: "hover:border-emerald-400", dot: "bg-emerald-500" },
  teal:    { bg: "bg-teal-50",      text: "text-teal-600",    badge: "bg-teal-100 text-teal-700 border-teal-200/60",    border: "hover:border-teal-400",    dot: "bg-teal-500" },
  violet:  { bg: "bg-violet-50",    text: "text-violet-600",  badge: "bg-violet-100 text-violet-700 border-violet-200/60", border: "hover:border-violet-400",  dot: "bg-violet-500" },
  amber:   { bg: "bg-amber-50",     text: "text-amber-600",   badge: "bg-amber-100 text-amber-700 border-amber-200/60",  border: "hover:border-amber-400",   dot: "bg-amber-500" },
  sky:     { bg: "bg-sky-50",       text: "text-sky-600",     badge: "bg-sky-100 text-sky-700 border-sky-200/60",      border: "hover:border-sky-400",     dot: "bg-sky-500" },
  rose:    { bg: "bg-rose-50",      text: "text-rose-600",    badge: "bg-rose-100 text-rose-700 border-rose-200/60",    border: "hover:border-rose-400",    dot: "bg-rose-500" },
};

// ─── Tool Card ────────────────────────────────────────────────────────────────
function ToolCard({ tool }: { tool: typeof TOOLS[0] }) {
  const c = COLOR_CLASSES[tool.color];
  const Icon = tool.icon;
  const isAvailable = !tool.badge.includes("Coming soon");

  return (
    <Link
      href={tool.href}
      id={`tool-card-${tool.key}`}
      className={`group relative flex flex-col gap-4 p-5 rounded-2xl bg-white border border-slate-200
                  shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200
                  ${c.border} ${!isAvailable ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} strokeWidth={1.8} />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-900 text-[14px] leading-snug group-hover:text-teal-700 transition-colors">
            {tool.title}
          </h3>
          <ChevronRight
            size={14}
            className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all duration-150 flex-shrink-0 mt-0.5"
          />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
      </div>

      {/* Badge */}
      <div className="mt-auto">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>
          {isAvailable && <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />}
          {tool.badge}
        </span>
      </div>

      {/* Hover underline */}
      <span className={`absolute bottom-0 left-0 right-0 h-[2px] w-0 group-hover:w-full ${c.dot} rounded-b-2xl transition-all duration-300`} />
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ToolsPage() {
  return (
    <div className="flex flex-col gap-6 pb-6">

      {/* Heading */}
      <FadeIn delay={0}>
        <PageHeading
          title="GP Tools"
          subtitle="Clinical tools, references, and resources for your GP practice"
        />
      </FadeIn>

      {/* Quick stat strip */}
      <FadeIn delay={0.04}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "MBS Items",    value: "1,924" },
            { label: "Conditions",   value: "318" },
            { label: "Autofills",    value: "42" },
            { label: "Calculators",  value: "Coming" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm text-center">
              <p className="font-bold text-slate-900 text-lg leading-none">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Tool grid */}
      <FadeIn delay={0.08}>
        <PageCard>
          <CardHeader
            title="Available Tools"
            subtitle="Click any tool to open it. Coming soon tools are greyed out."
          />
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.key} tool={tool} />
            ))}
          </div>
        </PageCard>
      </FadeIn>

      {/* Help banner */}
      <FadeIn delay={0.12}>
        <div className="rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
            <Stethoscope size={18} strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">More tools coming soon</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              The GP Edge toolkit is continuously expanding. Clinical calculators, case libraries, and procedure checklists are in development.
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

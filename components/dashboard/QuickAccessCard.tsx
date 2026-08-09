import { memo } from "react";
import Link from "next/link";
import { Receipt, FileEdit, BookOpen, ArrowRight, LucideIcon } from "lucide-react";
import { quickAccess as fallbackQuickAccess } from "./data";

type QuickAccessItem = {
  key: string;
  title: string;
  caption: string;
  accent?: string;
  badge?: string;
};

type ToolConfig = {
  icon: LucideIcon;
  href: string;
  bg: string;
  text: string;
  border: string;
};

const TOOL_CONFIG: Record<string, ToolConfig> = {
  mbs: {
    icon: Receipt,
    href: "/dashboard/billing",
    bg: "bg-emerald-50/90 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
  },
  autofills: {
    icon: FileEdit,
    href: "/dashboard/clinical-autofills",
    bg: "bg-teal-50/90 dark:bg-teal-950/40",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-200/60 dark:border-teal-800/40",
  },
  conditions: {
    icon: BookOpen,
    href: "/dashboard/medical-library",
    bg: "bg-sky-50/90 dark:bg-sky-950/40",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-200/60 dark:border-sky-800/40",
  },
};

const QuickAccessCard = memo(function QuickAccessCard({
  quickAccess = fallbackQuickAccess,
}: {
  quickAccess?: QuickAccessItem[];
}) {
  const items = quickAccess.filter((q) => q.key !== "notes" && TOOL_CONFIG[q.key]);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 shadow-sm p-6 sm:p-7">
      <div>
        <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500 mb-1">
          Quick access
        </p>
        <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">
          Clinical tools & shortcuts
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {items.map((q) => {
          const config = TOOL_CONFIG[q.key];
          if (!config) return null;
          const Icon = config.icon;

          return (
            <Link
              key={q.key}
              href={config.href}
              className="group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-700/70 hover:bg-white dark:hover:bg-slate-800/90 hover:border-emerald-300 dark:hover:border-emerald-600/60 hover:shadow-[0_4px_16px_-4px_rgba(16,185,129,0.12)] dark:hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200 ease-out"
            >
              <div className="flex items-center min-w-0 pr-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.text} border ${config.border} group-hover:scale-105 transition-transform duration-200 ease-out`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 pl-3.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors duration-200 leading-snug truncate">
                    {q.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal truncate">
                    {q.caption}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-100/80 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200 ease-out">
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
});

export default QuickAccessCard;

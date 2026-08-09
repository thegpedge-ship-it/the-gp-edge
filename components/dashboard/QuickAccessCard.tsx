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

const ITEM_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    href: string;
    bg: string;
    text: string;
    border: string;
  }
> = {
  mbs: {
    icon: Receipt,
    href: "/dashboard/billing",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-800/40",
  },
  autofills: {
    icon: FileEdit,
    href: "/dashboard/clinical-autofills",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-100 dark:border-teal-800/40",
  },
  conditions: {
    icon: BookOpen,
    href: "/dashboard/medical-library",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-100 dark:border-sky-800/40",
  },
};

const QuickAccessCard = memo(function QuickAccessCard({
  quickAccess = fallbackQuickAccess,
}: {
  quickAccess?: QuickAccessItem[];
}) {
  const visibleItems = quickAccess.filter((q) => q.key !== "notes" && ITEM_CONFIG[q.key]);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6 sm:p-7">
      <div className="mb-5">
        <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Quick access
        </p>
        <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">
          Clinical tools & shortcuts
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleItems.map((q) => {
          const config = ITEM_CONFIG[q.key];
          if (!config) return null;
          const Icon = config.icon;

          return (
            <Link
              key={q.key}
              href={config.href}
              className="group relative flex items-center justify-between p-4.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600/70 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-slate-900/40 hover:-translate-y-[2px] transition-all duration-200 ease-out"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.text} border ${config.border} group-hover:scale-105 transition-transform duration-200`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-200 truncate">
                    {q.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {q.caption}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-200">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
});

export default QuickAccessCard;

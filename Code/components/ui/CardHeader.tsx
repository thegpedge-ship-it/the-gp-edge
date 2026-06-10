/**
 * CardHeader — standardized section header for dashboard cards.
 * Used in Settings (SectionHeader), Profile, and future pages.
 * Accepts an optional icon, title, and subtitle.
 */
interface CardHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function CardHeader({ icon, title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-500">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-slate-900 text-[14px] leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

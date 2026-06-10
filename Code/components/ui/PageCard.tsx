/**
 * PageCard — the standard card primitive for all dashboard content sections.
 * Replaces the 10+ verbatim repetitions of:
 *   bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden
 */
interface PageCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageCard({ children, className = "" }: PageCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

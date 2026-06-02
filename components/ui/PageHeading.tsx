/**
 * PageHeading — standardized page-level h1 with consistent typography.
 * All dashboard pages use the same heading style.
 */
interface PageHeadingProps {
  title: string;
  subtitle?: string;
}

export default function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

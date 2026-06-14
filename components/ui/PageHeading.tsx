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
      <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
        {title}
      </h1>
      {subtitle && (
        <p className="font-sans text-base md:text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-400 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}


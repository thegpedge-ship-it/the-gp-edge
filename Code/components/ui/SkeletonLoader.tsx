/**
 * SkeletonLoader — skeleton loading states for dashboard content.
 * Provides predictable loading feedback with no blank screens.
 */

/** Single skeleton line */
function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-slate-200 animate-pulse ${className}`}
    />
  );
}

/** Card-shaped skeleton placeholder */
function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-white border border-slate-200 p-6 shadow-sm ${className}`}>
      <SkeletonLine className="h-4 w-1/3 mb-3" />
      <SkeletonLine className="h-8 w-1/2 mb-4" />
      <SkeletonLine className="h-3 w-full mb-2" />
      <SkeletonLine className="h-3 w-4/5" />
    </div>
  );
}

/** Full page skeleton for dashboard routes */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-6 animate-pulse">
      {/* Heading */}
      <div>
        <SkeletonLine className="h-8 w-48 mb-2" />
        <SkeletonLine className="h-4 w-72" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>
      {/* Main card */}
      <SkeletonCard className="h-64" />
      {/* Two-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
    </div>
  );
}

export { SkeletonLine, SkeletonCard };
export default SkeletonCard;

/**
 * SkeletonLoader — premium pulse-based loading states for dashboard content.
 *
 * Design principles:
 *   • Mimics the REAL layout — sidebar rail, heading, stat cards, content rows.
 *   • Staggered animationDelay on each cell gives a left-to-right ripple.
 *   • Uses bg-slate-200 / bg-slate-100 only — never coloured skeletons.
 *   • Server Component — no "use client" required (CSS-only animations).
 */

// ── Primitive ─────────────────────────────────────────────────────────────────
function Bone({
  className = "",
  delay = 0,
  style,
}: {
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-lg bg-slate-200 animate-pulse ${className}`}
      style={{ animationDelay: `${delay}ms`, ...style }}
    />
  );
}

// ── Stat Card Skeleton ────────────────────────────────────────────────────────
function StatCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
      <Bone className="w-10 h-10 rounded-xl" delay={delay} />
      <Bone className="h-7 w-20" delay={delay + 40} />
      <Bone className="h-3.5 w-28 bg-slate-100" delay={delay + 80} />
    </div>
  );
}

// ── Content Row Skeleton ──────────────────────────────────────────────────────
function ContentRowSkeleton({ delay = 0, width = "70%" }: { delay?: number; width?: string }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <Bone className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0" delay={delay} />
      <div className="flex-1">
        <Bone className="h-4 bg-slate-200 mb-1.5" style={{ width }} delay={delay + 30} />
        <Bone className="h-3 w-32 bg-slate-100" delay={delay + 60} />
      </div>
      <Bone className="h-6 w-16 rounded-full bg-slate-100 flex-shrink-0" delay={delay + 30} />
    </div>
  );
}

// ── Full Page Skeleton (used by app/dashboard/loading.tsx) ────────────────────
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* Sidebar rail skeleton — desktop only */}
      <aside className="hidden lg:flex flex-col items-center gap-3 fixed top-24 left-2 h-auto bg-white border border-slate-200 rounded-3xl py-4 px-2 shadow-sm w-[72px] z-40">
        <Bone className="w-9 h-9 rounded-full bg-slate-200" delay={0} />
        <div className="w-7 h-px bg-slate-100 my-1" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="w-9 h-9 rounded-xl bg-slate-100" delay={i * 50} />
        ))}
        <div className="w-7 h-px bg-slate-100 my-1" />
        <Bone className="w-9 h-9 rounded-xl bg-slate-100" delay={350} />
        <Bone className="w-9 h-9 rounded-xl bg-slate-100" delay={400} />
      </aside>

      {/* Main content */}
      <main
        className="flex-1 min-h-screen px-6 sm:px-8 pt-6 sm:pt-8 pb-12"
        style={{ marginLeft: "88px" }}
      >
        {/* Page heading */}
        <div className="mb-6">
          <Bone className="h-7 w-48 bg-slate-200 mb-2" delay={0} />
          <Bone className="h-4 w-80 bg-slate-100" delay={40} />
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <StatCardSkeleton delay={0} />
          <StatCardSkeleton delay={80} />
          <StatCardSkeleton delay={160} />
        </div>

        {/* Large content card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <Bone className="h-5 w-36 mb-2" delay={0} />
              <Bone className="h-3.5 w-52 bg-slate-100" delay={40} />
            </div>
            <Bone className="h-8 w-24 rounded-xl bg-slate-100" delay={60} />
          </div>
          <ContentRowSkeleton delay={80}  width="62%" />
          <ContentRowSkeleton delay={130} width="78%" />
          <ContentRowSkeleton delay={180} width="55%" />
          <ContentRowSkeleton delay={230} width="70%" />
        </div>

        {/* Two-column card row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <Bone className="h-5 w-32 mb-4" delay={200 + i * 80} />
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Bone className="w-7 h-7 rounded-lg bg-slate-100 flex-shrink-0" delay={250 + i * 80 + j * 40} />
                    <Bone
                      className="h-3.5 bg-slate-100 flex-1"
                      delay={270 + i * 80 + j * 40}
                      style={{ width: `${50 + j * 15}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export { Bone as SkeletonLine, StatCardSkeleton as SkeletonCard };
export default StatCardSkeleton;

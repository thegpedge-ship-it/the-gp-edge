export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Banner skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 lg:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-2.5">
          <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
          <div className="h-7 w-56 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-slate-50 dark:bg-slate-800/60 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-5 w-12 bg-slate-50 dark:bg-slate-800/60 rounded-md animate-pulse" />
            </div>
            <div className="h-7 w-20 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse mb-1" />
            <div className="h-3 w-28 bg-slate-50 dark:bg-slate-800/60 rounded-md animate-pulse" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm h-64 animate-pulse" />
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm h-64 animate-pulse" />
      </div>
    </div>
  );
}

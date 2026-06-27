export default function OnboardingLoading() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-500">Setting up your account…</p>
      </div>
    </main>
  );
}

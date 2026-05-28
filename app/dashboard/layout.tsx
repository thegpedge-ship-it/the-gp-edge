import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-200/30 dark:bg-teal-900/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-3xl" />
      </div>

      <Sidebar />

      <main className="lg:ml-[22rem] p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

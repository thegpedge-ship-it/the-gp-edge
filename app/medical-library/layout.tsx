import Header from "@/components/shared/Header";
import Sidebar from "@/components/dashboard/Sidebar";

export default function MedicalLibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 lg:grid lg:grid-cols-[22rem_1fr] font-sans">
      <Sidebar />

      <div className="relative min-h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
        {/* Premium ambient background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.08),transparent)] pointer-events-none" />

        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(226,232,240)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[size:24px_24px] opacity-60 pointer-events-none" />

        {/* Soft gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-200/30 dark:bg-teal-900/20 blur-3xl" />
          <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-3xl" />
        </div>

        <Header variant="static" />

        <main className="relative z-10 px-6 sm:px-8 pt-8 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}

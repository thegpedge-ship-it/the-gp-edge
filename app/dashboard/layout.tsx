import DashboardShell from "@/components/dashboard/DashboardShell";

/**
 * Dashboard layout — intentionally a Server Component.
 * All client-side context (SidebarProvider, motion, etc.) lives in
 * DashboardShell to avoid Next.js App Router provider/children boundary issues.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

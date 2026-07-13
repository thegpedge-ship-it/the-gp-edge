import DashboardShell from "@/components/dashboard/DashboardShell";

/* Exam-prep is a single non-scrolling screen. Override the shell's default
   `min-h-screen … pb-12` (which, stacked under the sticky header, always
   overflows the viewport) with min-h-0 and no bottom padding so the page fits
   in one view. */
export default function ExamPrepLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell className="!min-h-0 px-6 sm:px-8 pt-6 sm:pt-8 pb-0">
      {children}
    </DashboardShell>
  );
}

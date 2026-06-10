import {
  PageHeader,
  StatsRow,
  ActionCards,
  ReviewPastResults,
  GoalTracker,
  RecentActivity,
} from "@/components/exam-prep";

export default function ExamPrepDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 pt-6 space-y-6">
      <PageHeader />
      <StatsRow />
      <ActionCards />
      <ReviewPastResults />
      <GoalTracker />
      <RecentActivity />
    </div>
  );
}

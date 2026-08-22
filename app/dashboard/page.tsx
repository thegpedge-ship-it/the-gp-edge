import Topbar from "@/components/dashboard/Topbar";
import NewQuestionsNotificationCard from "@/components/dashboard/NewQuestionsNotificationCard";
import StatTile from "@/components/dashboard/StatTile";
import CountdownCard from "@/components/dashboard/CountdownCard";
import MasteryScoresSection from "@/components/dashboard/MasteryScoresSection";
import WeakStrongTopicsCard from "@/components/dashboard/WeakStrongTopicsCard";
import ActivityHeatmapCard from "@/components/dashboard/ActivityHeatmapCard";
import { getDashboardData } from "./actions";

// Always compute per-request — the dashboard is a live, per-user view.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data;
  try {
    data = await getDashboardData();
  } catch (err) {
    console.error("[DashboardPage] Error loading dashboard data:", err);
    data = null;
  }

  // Defensive checks: default to zero-state arrays if properties are missing
  const greeting = data?.greeting ?? {
    salutation: "Welcome!",
    title: "Your study",
    highlight: "cockpit",
    subtext: "Start your first practice set to light up your dashboard.",
  };

  const stats = data?.stats ?? [
    { key: "streak", label: "Study Streak", value: "0", unit: "days", delta: "Max streak: 0 days", trend: "flat", caption: "", spark: [0, 0] },
    { key: "accuracy", label: "Avg Accuracy", value: "0.0%", delta: "+0.0%", trend: "flat", caption: "vs prev 30 days", spark: [0, 0] },
    { key: "attempts", label: "Quiz Attempts", value: "0", delta: "+0", trend: "flat", caption: "this week", spark: [0, 0] },
    { key: "mocks", label: "Mock Exams", value: "0", unit: "done", delta: "+0", trend: "flat", caption: "this month", spark: [0, 0] },
  ];

  const studyActivity = data?.studyActivity ?? [];
  const upcomingExam = data?.upcomingExam ?? null;
  const performance = data?.performance ?? [];
  const mockScores = data?.mockScores ?? [];
  const subjectBreakdown = data?.subjectBreakdown ?? {};
  const weakTopics = data?.weakTopics ?? [];
  const strongTopics = data?.strongTopics ?? [];
  const quickAccess = data?.quickAccess ?? [
    { key: "mbs", title: "MBS Explorer", caption: "Search billing items", accent: "emerald", badge: "" },
    { key: "autofills", title: "Clinical Autofills", caption: "Templates & macros", accent: "violet", badge: "" },
    { key: "conditions", title: "Conditions Library", caption: "Reference & guidelines", accent: "cyan", badge: "" },
  ];

  return (
    <>
      <Topbar greeting={greeting} />

      <NewQuestionsNotificationCard />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <StatTile
            key={s.key}
            label={s.label}
            value={s.value}
            unit={s.unit}
            delta={s.delta}
            trend={s.trend}
            caption={s.caption}
            spark={s.spark}
          />
        ))}
      </section>

      {upcomingExam ? (
        <section className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-6">
          <div className="lg:col-span-3">
            <CountdownCard exam={upcomingExam} />
          </div>
          <div className="lg:col-span-7">
            <ActivityHeatmapCard studyActivity={studyActivity} />
          </div>
        </section>
      ) : (
        <section className="mb-6">
          <ActivityHeatmapCard studyActivity={studyActivity} />
        </section>
      )}

      <MasteryScoresSection
        performance={performance}
        mockScores={mockScores}
        subjectBreakdown={subjectBreakdown}
      />

      <section className="mb-6">
        <WeakStrongTopicsCard weakTopics={weakTopics} strongTopics={strongTopics} />
      </section>
    </>
  );
}

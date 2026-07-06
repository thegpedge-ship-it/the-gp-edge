import Topbar from "@/components/dashboard/Topbar";
import NewQuestionsNotificationCard from "@/components/dashboard/NewQuestionsNotificationCard";
import StatTile from "@/components/dashboard/StatTile";
import CountdownCard from "@/components/dashboard/CountdownCard";
import MasteryScoresSection from "@/components/dashboard/MasteryScoresSection";
import WeakStrongTopicsCard from "@/components/dashboard/WeakStrongTopicsCard";
import ActivityHeatmapCard from "@/components/dashboard/ActivityHeatmapCard";
import QuickAccessCard from "@/components/dashboard/QuickAccessCard";
import { getDashboardData } from "./actions";

// Always compute per-request — the dashboard is a live, per-user view.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <Topbar greeting={data.greeting} />

      <NewQuestionsNotificationCard />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {data.stats.map((s) => (
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

      <section className="mb-6">
        <ActivityHeatmapCard studyActivity={data.studyActivity} />
      </section>

      {data.upcomingExam && (
        <section className="mb-6">
          <CountdownCard exam={data.upcomingExam} />
        </section>
      )}

      <MasteryScoresSection
        performance={data.performance}
        mockScores={data.mockScores}
        subjectBreakdown={data.subjectBreakdown}
      />

      <section className="mb-6">
        <WeakStrongTopicsCard weakTopics={data.weakTopics} strongTopics={data.strongTopics} />
      </section>

      <section className="mb-6">
        <QuickAccessCard quickAccess={data.quickAccess} />
      </section>
    </>
  );
}

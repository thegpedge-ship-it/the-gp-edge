import Topbar from "@/components/dashboard/Topbar";
import NewQuestionsNotificationCard from "@/components/dashboard/NewQuestionsNotificationCard";
import StatTile from "@/components/dashboard/StatTile";
import CountdownCard from "@/components/dashboard/CountdownCard";
import MasteryScoresSection from "@/components/dashboard/MasteryScoresSection";
import WeakStrongTopicsCard from "@/components/dashboard/WeakStrongTopicsCard";
import ActivityHeatmapCard from "@/components/dashboard/ActivityHeatmapCard";
import QuickAccessCard from "@/components/dashboard/QuickAccessCard";
import { stats } from "@/components/dashboard/data";

export default function DashboardPage() {
  return (
    <>
      <Topbar />

      <NewQuestionsNotificationCard />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <StatTile
            key={s.key}
            label={s.label}
            value={s.value}
            unit={"unit" in s ? (s as { unit?: string }).unit : undefined}
            delta={s.delta}
            trend={s.trend}
            caption={s.caption}
            spark={s.spark}
          />
        ))}
      </section>

      <section className="mb-6">
        <ActivityHeatmapCard />
      </section>

      <section className="mb-6">
        <CountdownCard />
      </section>

      <MasteryScoresSection />

      <section className="mb-6">
        <WeakStrongTopicsCard />
      </section>

      <section className="mb-6">
        <QuickAccessCard />
      </section>
    </>
  );
}

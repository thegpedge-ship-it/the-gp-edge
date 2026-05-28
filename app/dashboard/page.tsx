import Topbar from "@/components/dashboard/Topbar";
import StatTile from "@/components/dashboard/StatTile";
import ContinueCard from "@/components/dashboard/ContinueCard";
import CountdownCard from "@/components/dashboard/CountdownCard";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";
import WeeklyProgressCard from "@/components/dashboard/WeeklyProgressCard";
import AccuracyTrendCard from "@/components/dashboard/AccuracyTrendCard";
import PerformanceCard from "@/components/dashboard/PerformanceCard";
import WeakStrongTopicsCard from "@/components/dashboard/WeakStrongTopicsCard";
import AIRecommendationsCard from "@/components/dashboard/AIRecommendationsCard";
import DailyPracticeCard from "@/components/dashboard/DailyPracticeCard";
import ExamPathsCard from "@/components/dashboard/ExamPathsCard";
import ActivityCard from "@/components/dashboard/ActivityCard";
import QuickAccessCard from "@/components/dashboard/QuickAccessCard";
import { stats } from "@/components/dashboard/data";

export default function DashboardPage() {
  return (
    <>
      <Topbar />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <StatTile
            key={s.key}
            label={s.label}
            value={s.value}
            delta={s.delta}
            trend={s.trend}
            accent={s.accent}
            caption={s.caption}
            delay={0.05 * i}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ContinueCard />
        </div>
        <CountdownCard />
      </section>

      <section className="mb-6">
        <QuickActionsCard />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <WeeklyProgressCard />
        </div>
        <AccuracyTrendCard />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <PerformanceCard />
        </div>
        <ExamPathsCard />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <WeakStrongTopicsCard />
        </div>
        <AIRecommendationsCard />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <DailyPracticeCard />
        <div className="lg:col-span-2">
          <ActivityCard />
        </div>
      </section>

      <section className="mb-6">
        <QuickAccessCard />
      </section>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { KPI_DEFINITIONS, KpiCard } from "@/features/admin/dashboard/KpiCard";
import {
  DashboardErrorCard,
  DashboardKpiSkeleton,
} from "@/features/admin/dashboard/DashboardStates";
import { RecentActivitiesCard } from "@/features/admin/dashboard/RecentActivitiesCard";
import { JlptDistributionCard } from "@/features/admin/dashboard/JlptDistributionCard";
import {
  loadDashboardData,
  type DashboardOutcome,
} from "@/features/admin/dashboard/dashboard.api";
import {
  buildJlptDistribution,
  type JlptBucket,
} from "@/features/admin/dashboard/dashboard.utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [outcome, setOutcome] = useState<DashboardOutcome | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadDashboardData();
      if (!cancelled) setOutcome(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const isLoading = outcome === null;
  const isError = outcome !== null && !outcome.ok;
  const data = outcome && outcome.ok ? outcome.data : null;

  // Keep the JLPT card populated even on error so retry UX is obvious.
  const jlptBuckets: JlptBucket[] = data?.jlptDistribution ?? buildJlptDistribution([]);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">
            Admin Dashboard
          </h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Monitor platform performance at a glance
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-secondary-col text-xs font-bold">
          <Activity className="w-3.5 h-3.5" />
          Live overview
        </div>
      </div>

      {/* Row 1: KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || !data ? (
          KPI_DEFINITIONS.map((d) => <DashboardKpiSkeleton key={d.key} />)
        ) : (
          <>
            <KpiCard
              definition={KPI_DEFINITIONS[0]}
              value={data.totalStudents}
            />
            <KpiCard
              definition={KPI_DEFINITIONS[1]}
              value={data.totalTeachers}
            />
            <KpiCard
              definition={KPI_DEFINITIONS[2]}
              value={data.totalClasses}
            />
            <KpiCard
              definition={KPI_DEFINITIONS[3]}
              value={data.completionRate}
              suffix="%"
            />
          </>
        )}
      </div>

      {/* Row 2: Activities (2/3) + JLPT (1/3) */}
      {isError ? (
        <DashboardErrorCard
          message={outcome && !outcome.ok ? outcome.error : ""}
          onRetry={() => setReloadKey((k) => k + 1)}
          height={380}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RecentActivitiesCard
              items={data?.recentActivities ?? []}
              loading={isLoading}
            />
          </div>
          <JlptDistributionCard
            buckets={jlptBuckets}
            loading={isLoading}
            totalClasses={data?.totalClasses ?? 0}
          />
        </div>
      )}
    </div>
  );
}

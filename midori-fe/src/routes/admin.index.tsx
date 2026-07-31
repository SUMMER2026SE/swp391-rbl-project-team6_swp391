import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { KPI_DEFINITIONS, KpiCard } from "@/features/admin/dashboard/KpiCard";
import {
  DashboardErrorCard,
  DashboardKpiSkeleton,
} from "@/features/admin/dashboard/DashboardStates";
import { RecentActivitiesCard } from "@/features/admin/dashboard/RecentActivitiesCard";
import { JlptDistributionCard } from "@/features/admin/dashboard/JlptDistributionCard";
import {
  loadDashboardData,
} from "@/features/admin/dashboard/dashboard.api";
import {
  buildJlptDistribution,
  type JlptBucket,
} from "@/features/admin/dashboard/dashboard.utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: outcome, isLoading: queryLoading, refetch } = useQuery({
    queryKey: ["adminDashboardData"],
    queryFn: loadDashboardData,
    staleTime: 5 * 60 * 1000,
    enabled: typeof window !== "undefined",
  });

  const isLoading = queryLoading;
  const isError = outcome && !outcome.ok;
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

      {/* Row 2: Activities (2/3) + JLPT (1/3).
          `lg:items-start` keeps the two cards at their natural heights instead
          of stretching whichever is taller. The Recent Activities card no
          longer scrolls internally (we cap at 10 rows) so it sits at its
          own intrinsic height, and the JLPT card keeps its `min-h-[380px]`. */}
      {isError ? (
        <DashboardErrorCard
          message={outcome && !outcome.ok ? outcome.error : ""}
          onRetry={() => refetch()}
          height={380}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:items-start gap-4">
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

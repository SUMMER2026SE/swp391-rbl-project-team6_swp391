import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, GraduationCap, ClipboardCheck, TrendingUp, Award, BookUser, Clock, ChevronRight, AlertTriangle, BookOpen, Bell } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect, useMemo } from "react";
import { adminApi, type AdminDashboardSummaryResponse, type JlptDistributionResponse, type RecentActivitiesResponse, type RecentActivity, type JlptLevelCount } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { EmptyState } from "@/components/page-ui";

const JLPT_COLORS: Record<string, string> = {
  N5: "oklch(0.62 0.18 270)",
  N4: "oklch(0.72 0.15 230)",
  N3: "oklch(0.72 0.18 340)",
  N2: "oklch(0.6 0.22 25)",
  N1: "oklch(0.6 0.2 25)",
};

function MetricCard({ label, value, icon, loading }: { label: string; value: string | number; icon: React.ElementType; loading?: boolean; }) {
  const Icon = icon;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-base p-4 flex flex-col min-h-[6rem]">
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-xl glass-surface flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold leading-tight">{label}</span>
      <div className="font-display font-black text-xl text-primary-col mt-auto pt-1">{loading ? "--" : value}</div>
    </motion.div>
  );
}

function formatRelativeTime(iso: string | undefined | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  if (diffMs < 0) return "just now";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week} week${week > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}

const ACTIVITY_ICON_MAP: Record<string, { Icon: React.ElementType; color: string }> = {
  class: { Icon: BookOpen, color: "text-primary" },
  exam: { Icon: ClipboardCheck, color: "text-[var(--status-pending)]" },
  notification: { Icon: Bell, color: "text-[oklch(0.72_0.15_230)]" },
  content: { Icon: BookOpen, color: "text-primary" },
  teacher: { Icon: GraduationCap, color: "text-[var(--status-teacher)]" },
  student: { Icon: Users, color: "text-[oklch(0.72_0.15_230)]" },
};

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const [summary, setSummary] = useState<AdminDashboardSummaryResponse | null>(null);
  const [jlpt, setJlpt] = useState<JlptDistributionResponse | null>(null);
  const [activities, setActivities] = useState<RecentActivitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    Promise.all([
      adminApi.getDashboardSummary(),
      adminApi.getJlptDistribution(),
      adminApi.getRecentActivities(10),
    ])
      .then(([summaryData, jlptData, activitiesData]) => {
        if (!isMounted) return;
        setSummary(summaryData);
        setJlpt(jlptData);
        setActivities(activitiesData);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof ApiError ? err.message : "Unable to load dashboard data");
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const totalActiveClasses = summary?.activeClasses ?? 0;
  const completionRate = summary?.learningCompletionRate ?? 0;
  const hasAnyJlptCount = useMemo(
    () => (jlpt?.levels ?? []).some((l) => l.count > 0),
    [jlpt],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Academic Dashboard</h1>
          <p className="text-sm text-secondary-col mt-0.5">Monitor platform performance and manage academic operations</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-secondary-col text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[var(--status-active)] shadow-sm shadow-[var(--status-active)]/50" />
          All systems operational
        </div>
      </div>

      {error && (
        <div className="card-base p-4 border border-[var(--status-rejected)]/30 text-sm text-[var(--status-rejected)]">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Students" value={(summary?.totalStudents ?? 0).toLocaleString()} icon={Users} loading={loading} />
        <MetricCard label="Total Teachers" value={(summary?.totalTeachers ?? 0).toLocaleString()} icon={GraduationCap} loading={loading} />
        <MetricCard label="Total Classes" value={totalActiveClasses.toLocaleString()} icon={BookUser} loading={loading} />
        <MetricCard label="Completion Rate" value={completionRate + "%"} icon={TrendingUp} loading={loading} />
      </div>

      <div className="grid lg:grid-cols-12 lg:grid-rows-1 gap-4">
        <div className="lg:col-span-8 lg:row-span-1 card-base p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="font-display font-bold text-xs text-primary-col flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Recent Activities
            </h2>
          </div>
          {loading ? (
            <div className="text-xs text-muted-col py-3 text-center">Loading...</div>
          ) : !activities || activities.activities.length === 0 ? (
            <EmptyState title="No recent activities" hint="Activity from teachers, students, exams and notifications will appear here." />
          ) : (
            <div className="flex-1 min-h-0 divide-y divide-white/5 overflow-y-auto">
              {activities.activities.map((activity: RecentActivity) => {
                const meta = ACTIVITY_ICON_MAP[activity.type] ?? ACTIVITY_ICON_MAP.class;
                const Icon = meta.Icon;
                return (
                  <div key={activity.id} className="flex items-center gap-2.5 py-2">
                    <div className="w-7 h-7 rounded-lg glass-surface flex items-center justify-center shrink-0">
                      <Icon className={"w-3.5 h-3.5 " + meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-primary-col truncate">{activity.action}</p>
                      <p className="text-[10px] text-muted-col truncate">{activity.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-col shrink-0">{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 lg:row-span-1 flex flex-col gap-4 h-full">
          <div className="card-base p-4 flex-1 min-h-0 flex flex-col">
            <h2 className="font-display font-bold text-xs text-primary-col mb-3 flex items-center gap-2 shrink-0">
              <Award className="w-3.5 h-3.5 text-primary" />
              Students by JLPT Level
            </h2>
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-col">Loading...</div>
            ) : !hasAnyJlptCount ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState title="No class data yet" hint="Create classes with JLPT levels to see the distribution here." />
              </div>
            ) : (
              <>
                <div className="h-[180px] w-full shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={jlpt?.levels ?? []} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="count" nameKey="level">
                        {(jlpt?.levels ?? []).map((entry) => (
                          <Cell key={entry.level} fill={JLPT_COLORS[entry.level] ?? "oklch(0.7 0.1 200)"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#F3F4F6", backdropFilter: "blur(12px)", fontSize: "12px" }}
                        formatter={(value, name) => [value + " classes", String(name ?? "")]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-nowrap justify-center gap-x-5 mt-2 shrink-0 overflow-x-auto">
                  {(jlpt?.levels ?? []).map((item: JlptLevelCount) => (
                    <div key={item.level} className="flex items-center gap-1.5 shrink-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: JLPT_COLORS[item.level] ?? "oklch(0.7 0.1 200)" }} />
                      <span className="text-secondary-col text-xs whitespace-nowrap">{item.level}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card-base p-4 flex-1 min-h-0 flex flex-col">
            <h2 className="font-display font-bold text-xs text-primary-col mb-3 flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--status-pending)]" />
              Pending Approvals
            </h2>
            <div className="flex-1 min-h-0 flex flex-col justify-center space-y-1.5">
              <Link to="/admin/teachers" className="flex items-center justify-between p-2 rounded-lg glass-surface hover:bg-[var(--accent)] transition group">
                <span className="text-xs font-semibold text-[var(--status-teacher)]">Teachers</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--status-pending)]">{loading ? "--" : (summary?.pendingTeachers ?? 0)}</span>
                  <ChevronRight className="w-3 h-3 text-muted-col group-hover:text-primary transition" />
                </div>
              </Link>
              <Link to="/admin/content-library" className="flex items-center justify-between p-2 rounded-lg glass-surface hover:bg-[var(--accent)] transition group">
                <span className="text-xs font-semibold text-primary">Content</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--status-pending)]">{loading ? "--" : (summary?.pendingContent ?? 0)}</span>
                  <ChevronRight className="w-3 h-3 text-muted-col group-hover:text-primary transition" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
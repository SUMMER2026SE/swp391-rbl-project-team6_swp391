import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/teacher/badges";
import type { JLPTLevel } from "@/data/teacher-data";
import { useQuery } from "@tanstack/react-query";
import { teacherDashboardApi } from "@/lib/api/teacherDashboard";
import { getNotifications as getLiveNotifications } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import {
  GraduationCap, Users, ClipboardList, FileText, ArrowRight, Clock,
} from "lucide-react";

export const Route = createFileRoute("/teacher/")({
  head: () => ({ meta: [{ title: "Dashboard — MIDORI Teacher Studio" }] }),
  component: Dashboard,
});

const JLPT_LEVELS: readonly JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

function toJlptLevel(value: unknown): JLPTLevel {
  return typeof value === "string" && (JLPT_LEVELS as readonly string[]).includes(value)
    ? (value as JLPTLevel)
    : "N5";
}

function Dashboard() {
  const { user, loaded } = useAuth();
  const teacherId = user?.id ?? "";

  const dashboardEnabled = loaded && !!teacherId;

  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ["teacherDashboard", teacherId],
    queryFn: () => teacherDashboardApi.getDashboard(teacherId),
    enabled: dashboardEnabled,
  });

  const { data: dbNotifications, isLoading: isNotificationsLoading } = useQuery({
    queryKey: ["teacherNotificationsDashboard"],
    queryFn: () => getLiveNotifications(),
    enabled: dashboardEnabled,
  });

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = dashboard?.stats ?? {
    activeClasses: 0,
    totalStudents: 0,
    homeworkDueSoon: 0,
    examsScheduled: 0,
    pendingGrading: 0,
  };
  const activeClasses = dashboard?.activeClassesList ?? [];
  const upcomingDeadlines = dashboard?.deadlines ?? [];

  const statsCards = [
    { label: "Active classes", value: stats.activeClasses, icon: GraduationCap, tone: "bg-primary/10 text-primary" },
    { label: "Total students", value: stats.totalStudents, icon: Users, tone: "bg-info/10 text-info" },
    { label: "Homework due soon", value: stats.homeworkDueSoon, icon: ClipboardList, tone: "bg-warning/15 text-foreground dark:text-warning" },
    { label: "Exams scheduled", value: stats.examsScheduled, icon: FileText, tone: "bg-success/10 text-success" },
    { label: "Pending grading", value: stats.pendingGrading, icon: Clock, tone: "bg-sakura/30 text-foreground" },
  ];

  const notifications = (dbNotifications?.notifications ?? [])
    .slice(0, 4)
    .map((n) => ({
      id: String(n.id),
      title: n.title,
      message: n.content ?? "",
      read: n.isRead,
      time: n.createdAt ? n.createdAt.split("T")[0] : "",
    }));

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const errorMessage =
    dashboardError instanceof ApiError
      ? dashboardError.message
      : dashboardError
        ? "Unable to load dashboard data"
        : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow={today}
        title={`おかえりなさい, ${user?.name ? user.name.split(" ")[0] : "Sensei"}`}
        subtitle="Here's what needs your attention today across your classes and students."
      />

      {errorMessage && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statsCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="overflow-hidden border-border/60">
              <CardContent className="p-4">
                <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${s.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-2xl font-bold leading-none">
                  {isDashboardLoading ? "--" : s.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">📚 System-managed lessons:</span>{" "}
        Class lessons are assigned automatically by the system based on the class level. Teachers manage students, homework, exams, and progress.
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Active Classes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/teacher/classes" search={{ q: "" }}>
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isDashboardLoading ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : activeClasses.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No active classes found.
              </div>
            ) : (
              activeClasses.map((c) => (
                <Link
                  key={c.id}
                  to="/teacher/classes/$classId"
                  params={{ classId: c.id }}
                  search={{ q: "" }}
                  className="flex items-center gap-4 rounded-lg border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold">
                    {c.level}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{c.name}</div>
                      <Badge variant="outline" className="shrink-0 text-success border-success/50">
                        {c.status}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {c.studentCount} student{c.studentCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Notifications</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/teacher/notifications" search={{ q: "" }}>
                All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isNotificationsLoading ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to="/teacher/notifications"
                  search={{ q: "" }}
                  className="block rounded-lg border border-border/60 p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{n.title}</div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">{n.message}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {n.time}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/teacher/homework" search={{ q: "" }}>
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
        <CardContent className="space-y-2">
          {isDashboardLoading ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              <Clock className="mx-auto mb-2 h-6 w-6 text-success" />
              No upcoming deadlines in the next 7 days.
            </div>
          ) : (
            upcomingDeadlines.map((d) => (
              <Link
                key={d.id}
                to="/teacher/classes/$classId/homework"
                params={{ classId: d.classId }}
                search={{ q: "" }}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-accent/40"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-warning/15 text-foreground dark:text-warning">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.className ?? "—"} · due {d.dueDate}
                  </div>
                </div>
                {d.classLevel && <LevelBadge level={toJlptLevel(d.classLevel)} />}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

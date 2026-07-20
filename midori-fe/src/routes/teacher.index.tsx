import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "@/components/teacher/badges";
import { useQuery } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { homeworkApi } from "@/lib/api/homework";
import { getNotifications as getLiveNotifications } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth";
import type { JLPTLevel } from "@/data/teacher-data";
import {
  GraduationCap,
  Users,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Clock,
  AlertTriangle,
  BookOpen,
  RefreshCw,
  Calendar,
  Inbox,
  CheckCircle2,
  FileText,
  BarChart2,
} from "lucide-react";

export const Route = createFileRoute("/teacher/")({
  head: () => ({ meta: [{ title: "Dashboard — MIDORI Teacher Studio" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const {
    data: dbClasses = [],
    isLoading: isLoadingClasses,
    isError: isClassesError,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ["teacherClassesDashboard"],
    queryFn: () => classesApi.getAllClasses(),
  });

  const {
    data: dbHomeworks = [],
    isLoading: isLoadingHomeworks,
    isError: isHomeworksError,
    refetch: refetchHomeworks,
  } = useQuery({
    queryKey: ["teacherHomeworksDashboard"],
    queryFn: () => homeworkApi.getTeacherHomeworks(),
  });

  const {
    data: dbNotifications,
    isLoading: isLoadingNotifications,
    isError: isNotificationsError,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["teacherNotificationsDashboard"],
    queryFn: () => getLiveNotifications(),
  });

  const classes = useMemo(() => {
    return dbClasses.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level || "N5",
      status: c.status === "ACTIVE" ? "Active" : "Archived",
      studentCount: c.studentCount ?? 0,
      homeworkCount: c.homeworkCount ?? 0,
      examCount: c.examCount ?? 0,
      upcomingExamCount: c.upcomingExamCount ?? 0,
      createdAt: c.createdAt,
    }));
  }, [dbClasses]);

  const hw = useMemo(() => {
    return dbHomeworks.map((h) => ({
      id: h.id,
      classId: h.classId,
      title: h.title,
      dueDate: h.dueDate ? h.dueDate.split("T")[0] : "",
      status: h.status === "ASSIGNED" ? "Assigned" : h.status === "CLOSED" ? "Closed" : "Draft",
    }));
  }, [dbHomeworks]);

  const notifs = useMemo(() => {
    if (!dbNotifications?.notifications) return [];
    return dbNotifications.notifications.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.content ?? "",
      read: n.isRead,
      time: n.createdAt ? n.createdAt.split("T")[0] : "",
      link: "/teacher/notifications",
    }));
  }, [dbNotifications]);

  const activeClasses = classes.filter((c) => c.status === "Active");
  const allClasses = classes;
  const totalActiveClasses = activeClasses.length;
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const totalHomeworkAssigned = hw.filter((h) => h.status === "Assigned").length;
  const totalHomeworkDraft = hw.filter((h) => h.status === "Draft").length;
  const totalHomeworkClosed = hw.filter((h) => h.status === "Closed").length;
  const upcomingExams = classes.reduce((sum, c) => sum + (c.upcomingExamCount ?? 0), 0);
  const dueSoon = hw.filter((h) => h.status === "Assigned");

  const stats = [
    {
      label: "Active classes",
      value: totalActiveClasses,
      icon: GraduationCap,
      tone: "bg-[var(--primary)]/10 text-[var(--primary)]",
    },
    {
      label: "Total students",
      value: totalStudents,
      icon: Users,
      tone: "bg-[var(--status-active)]/10 text-[var(--status-active)]",
    },
    {
      label: "Homework assigned",
      value: totalHomeworkAssigned,
      icon: ClipboardList,
      tone: "bg-[var(--status-pending)]/15 text-[var(--status-pending)]",
    },
    {
      label: "Upcoming exams",
      value: upcomingExams,
      icon: BookOpen,
      tone: "bg-[oklch(0.72_0.15_230)]/10 text-[oklch(0.72_0.15_230)]",
    },
  ];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const firstName = user?.name ? user.name.split(" ")[0] : "Sensei";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/8 via-[var(--primary)]/3 to-transparent p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[var(--status-active)]/8 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]">
              <Sparkles className="h-3 w-3" />
              {today}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--primary-col)] sm:text-3xl">
              おかえりなさい, {firstName}
            </h1>
            <p className="mt-1 text-sm text-[var(--secondary-col)]">
              Here's an overview of your classes, assignments and recent activity.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/teacher/classes">
                <GraduationCap className="mr-1.5 h-4 w-4" />
                My classes
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl">
              <Link to="/teacher/homework/create">
                <ClipboardList className="mr-1.5 h-4 w-4" />
                Assign homework
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold leading-none text-[var(--primary-col)]">{s.value}</div>
                  <div className="mt-1 truncate text-xs text-[var(--muted-col)]">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main content: Left 2/3 + Right 1/3 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: My Classes + Recent Activities */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* My Classes */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base text-[var(--primary-col)]">My classes</CardTitle>
                <p className="mt-0.5 text-xs text-[var(--muted-col)]">
                  Active classes you are teaching
                </p>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-lg">
                <Link to="/teacher/classes">
                  View all
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingClasses ? (
                <MyClassesSkeleton />
              ) : isClassesError ? (
                <WidgetError onRetry={() => refetchClasses()} message="Couldn't load your classes." />
              ) : activeClasses.length === 0 ? (
                <EmptyState
                  icon={<GraduationCap className="h-7 w-7" />}
                  title="No active classes yet"
                  description="Active classes assigned to you will appear here."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeClasses.slice(0, 4).map((c) => {
                    const ratio = c.studentCount > 0 ? Math.min(100, (c.studentCount / 30) * 100) : 0;
                    return (
                      <Link
                        key={c.id}
                        to="/teacher/classes/$classId"
                        params={{ classId: c.id }}
                        className="group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-[var(--primary-col)]">
                              {c.name}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--muted-col)]">
                              <Calendar className="h-3 w-3" />
                              {c.createdAt ? c.createdAt.split("T")[0] : "—"}
                            </div>
                          </div>
                          <LevelBadge level={toJlptLevel(c.level)} />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-[var(--secondary-col)]">
                            <Users className="h-3.5 w-3.5 text-[var(--status-active)]" />
                            <span className="font-semibold">{c.studentCount}</span>
                            <span className="text-[var(--muted-col)]">students</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[var(--secondary-col)]">
                            <ClipboardList className="h-3.5 w-3.5 text-[var(--status-pending)]" />
                            <span className="font-semibold">{c.homeworkCount}</span>
                            <span className="text-[var(--muted-col)]">homework</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-[var(--muted-col)]">
                            <span>Capacity</span>
                            <span>{Math.round(ratio)}%</span>
                          </div>
                          <Progress value={ratio} className="h-1" />
                        </div>
                        <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                          <ArrowRight className="h-4 w-4 text-[var(--primary)]" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base text-[var(--primary-col)]">Recent activity</CardTitle>
                <p className="mt-0.5 text-xs text-[var(--muted-col)]">Latest updates for you</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-lg">
                <Link to="/teacher/notifications">
                  All
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingNotifications ? (
                <ActivityListSkeleton />
              ) : isNotificationsError ? (
                <WidgetError onRetry={() => refetchNotifications()} message="Couldn't load activity." />
              ) : notifs.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="h-7 w-7" />}
                  title="No recent activity"
                  description="When something happens across your classes, it will show up here."
                />
              ) : (
                <ul className="space-y-2">
                  {notifs.map((n) => (
                    <li key={n.id}>
                      <Link
                        to={n.link}
                        className="group flex items-start gap-2.5 rounded-lg border border-border/60 p-3 transition-colors hover:bg-[var(--accent)]"
                      >
                        {!n.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-medium text-[var(--primary-col)]">
                              {n.title}
                            </div>
                            <span className="shrink-0 text-[10px] uppercase tracking-wider text-[var(--muted-col)]">
                              {n.time}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-[var(--secondary-col)]">{n.message}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Assignment Summary + Upcoming Deadlines */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Assignment Summary */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[var(--primary-col)]">Assignment summary</CardTitle>
              <p className="mt-0.5 text-xs text-[var(--muted-col)]">Homework overview</p>
            </CardHeader>
            <CardContent>
              {isLoadingHomeworks ? (
                <AssignmentSummarySkeleton />
              ) : isHomeworksError ? (
                <WidgetError onRetry={() => refetchHomeworks()} message="Couldn't load assignments." />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--status-pending)]/15 text-[var(--status-pending)]">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[var(--primary-col)]">
                          {totalHomeworkAssigned}
                        </div>
                        <div className="text-[10px] text-[var(--muted-col)]">Assigned</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--status-active)]/15 text-[var(--status-active)]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[var(--primary-col)]">
                          {totalHomeworkClosed}
                        </div>
                        <div className="text-[10px] text-[var(--muted-col)]">Completed</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-500/15 text-slate-500 dark:text-slate-400">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[var(--primary-col)]">
                          {totalHomeworkDraft}
                        </div>
                        <div className="text-[10px] text-[var(--muted-col)]">Draft</div>
                      </div>
                    </div>
                  </div>

                  {hw.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[var(--muted-col)]">
                        <span>Completion rate</span>
                        <span className="font-semibold text-[var(--status-active)]">
                          {Math.round((totalHomeworkClosed / hw.length) * 100)}%
                        </span>
                      </div>
                      <Progress value={(totalHomeworkClosed / hw.length) * 100} className="h-1.5" />
                    </div>
                  )}

                  <Button asChild size="sm" className="w-full rounded-xl">
                    <Link to="/teacher/homework">
                      <BarChart2 className="mr-1.5 h-4 w-4" />
                      View all homework
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base text-[var(--primary-col)]">Upcoming deadlines</CardTitle>
                <p className="mt-0.5 text-xs text-[var(--muted-col)]">Due soon</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-lg">
                <Link to="/teacher/homework">
                  All
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingHomeworks ? (
                <DeadlinesSkeleton />
              ) : isHomeworksError ? (
                <WidgetError onRetry={() => refetchHomeworks()} message="Couldn't load deadlines." />
              ) : dueSoon.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-7 w-7 text-[var(--status-active)]" />}
                  title="No pending homework"
                  description="You're all caught up. New assignments will appear here."
                />
              ) : (
                <ul className="space-y-2">
                  {dueSoon.slice(0, 5).map((d) => {
                    const cls = allClasses.find((c) => c.id === d.classId);
                    return (
                      <li key={d.id}>
                        <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-[var(--accent)]">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--status-pending)]/15 text-[var(--status-pending)]">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-[var(--primary-col)]">
                              {d.title}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--muted-col)]">
                              <span className="truncate">{cls?.name ?? "Class"}</span>
                              <span>·</span>
                              <span>due {d.dueDate || "—"}</span>
                            </div>
                          </div>
                          {cls && <LevelBadge level={toJlptLevel(cls.level)} />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helpers

function toJlptLevel(level: string | null | undefined): JLPTLevel {
  const allowed: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
  return allowed.includes(level as JLPTLevel) ? (level as JLPTLevel) : "N5";
}

// Reusable widgets

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 px-4 py-8 text-center">
      <div className="text-[var(--muted-col)] opacity-60">{icon}</div>
      <p className="text-sm font-semibold text-[var(--secondary-col)]">{title}</p>
      <p className="max-w-xs text-xs text-[var(--muted-col)]">{description}</p>
    </div>
  );
}

function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--status-rejected)]/30 bg-[var(--status-rejected)]/5 px-4 py-6 text-center">
      <AlertTriangle className="h-6 w-6 text-[var(--status-rejected)]" />
      <p className="text-sm font-semibold text-[var(--status-rejected)]">{message}</p>
      <Button
        onClick={onRetry}
        size="sm"
        variant="outline"
        className="mt-1 rounded-lg border-[var(--status-rejected)]/30 text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/10"
      >
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  );
}

function MyClassesSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="mt-3 h-1 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ActivityListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border/60 p-3">
          <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DeadlinesSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function AssignmentSummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <Skeleton className="h-8 w-full rounded-xl" />
    </div>
  );
}

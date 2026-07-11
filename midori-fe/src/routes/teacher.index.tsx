import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/teacher/badges";
import { useQuery } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { homeworkApi } from "@/lib/api/homework";
import { getNotifications as getLiveNotifications } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth";
import {
  GraduationCap, Users, ClipboardList, FileText, AlertTriangle, ArrowRight,
  Plus, HelpCircle, TrendingUp, CheckCircle2, Clock,
} from "lucide-react";

export const Route = createFileRoute("/teacher/")({
  head: () => ({ meta: [{ title: "Dashboard — MIDORI Teacher Studio" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data: dbClasses = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["teacherClassesDashboard"],
    queryFn: () => classesApi.getAllClasses(),
  });

  const { data: dbHomeworks = [], isLoading: isLoadingHomeworks } = useQuery({
    queryKey: ["teacherHomeworksDashboard"],
    queryFn: () => homeworkApi.getTeacherHomeworks(),
  });

  const { data: dbNotifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["teacherNotificationsDashboard"],
    queryFn: () => getLiveNotifications(),
  });

  const isLoading = isLoadingClasses || isLoadingHomeworks || isLoadingNotifications;

  const classes = useMemo(() => {
    return dbClasses.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level || "N5",
      status: c.status === "ACTIVE" ? "Active" : "Archived",
      studentCount: c.studentCount || 0,
      homeworkCount: c.homeworkCount || 0,
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
    return dbNotifications.notifications.slice(0, 4).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.content,
      read: n.isRead,
      time: n.createdAt ? n.createdAt.split("T")[0] : "",
      link: "/teacher/notifications",
    }));
  }, [dbNotifications]);

  const activeClasses = classes.filter((c) => c.status === "Active");
  const dueSoon = hw.filter((h) => h.status === "Assigned").slice(0, 4);
  const upcomingExams: any[] = [];
  const pendingGrading = 0;
  const atRisk: any[] = [];
  const attention: any[] = [];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);

  const stats = [
    {
      label: "Active classes",
      value: activeClasses.length,
      icon: GraduationCap,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Total students",
      value: totalStudents,
      icon: Users,
      tone: "bg-info/10 text-info",
    },
    {
      label: "Homework due soon",
      value: dueSoon.length,
      icon: ClipboardList,
      tone: "bg-warning/15 text-foreground dark:text-warning",
    },
    {
      label: "Exams scheduled",
      value: upcomingExams.length,
      icon: FileText,
      tone: "bg-success/10 text-success",
    },
    {
      label: "Pending grading",
      value: pendingGrading,
      icon: Clock,
      tone: "bg-sakura/30 text-foreground",
    },
    {
      label: "Students at risk",
      value: atRisk.length,
      icon: AlertTriangle,
      tone: "bg-destructive/10 text-destructive",
    },
  ];

  const quickActions = [
    { to: "/teacher/classes", label: "My Classes", icon: GraduationCap },
    { to: "/teacher/classes/create", label: "Create Class", icon: Plus },
    { to: "/teacher/homework/create", label: "Assign Homework", icon: ClipboardList },
    { to: "/teacher/exams/create", label: "Create Exam", icon: FileText },
    { to: "/teacher/progress", label: "View Progress", icon: TrendingUp },
    { to: "/teacher/reports", label: "Reports", icon: HelpCircle },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow={today}
        title={`おかえりなさい, ${user?.name ? user.name.split(" ")[0] : "Sensei"}`}
        subtitle="Here's what needs your attention today across your classes and students."
        actions={
          <>
            <Button asChild variant="outline"><Link to="/teacher/classes"><GraduationCap className="mr-2 h-4 w-4" />My classes</Link></Button>
            <Button asChild><Link to="/teacher/homework/create"><Plus className="mr-2 h-4 w-4" />Assign Homework</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden border-border/60">
            <CardContent className="p-4">
              <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold leading-none">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">📚 System-managed lessons:</span>{" "}
        Class lessons are assigned automatically by the system based on the class level. Teachers manage students, homework, exams, and progress.
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((a) => (
            <Button key={a.to} asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link to={a.to}>
                <a.icon className="h-5 w-5 text-primary" />
                <span className="text-xs">{a.label}</span>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Classes needing attention</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/teacher/classes">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {attention.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-success" />
                All classes are on track.
              </div>
            ) : (
              attention.map((c) => (
                <Link
                  key={c.id}
                  to="/teacher/classes/$classId"
                  params={{ classId: c.id }}
                  className="flex items-center gap-4 rounded-lg border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold">
                    {c.level}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{c.name}</div>
                      {c.attention > 0 && (
                        <Badge variant="destructive" className="shrink-0">
                          {c.attention} alerts
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{c.schedule}</div>
                    <Progress value={c.progress} className="mt-2 h-1.5" />
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
              <Link to="/teacher/notifications">
                All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifs.map((n) => (
              <Link
                key={n.id}
                to={n.link ?? "/teacher/notifications"}
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
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ...dueSoon,
              ...upcomingExams
                .slice(0, 2)
                .map((e) => ({
                  id: e.id,
                  classId: e.classId,
                  title: e.title,
                  dueDate: e.scheduledAt,
                  status: "Scheduled",
                })),
            ].map((d) => {
              const cls = classes.find((c) => c.id === d.classId);
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-warning/15 text-foreground dark:text-warning">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {cls?.name} · due {d.dueDate}
                    </div>
                  </div>
                  {cls && <LevelBadge level={cls.level} />}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Students at risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {atRisk.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-success" />
                No students currently at risk.
              </div>
            ) : (
              atRisk.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={s.avatar} alt={s.name} />
                    <AvatarFallback>{s.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Progress {s.progress}% · Weak: {s.weakSkill}
                    </div>
                  </div>
                  <LevelBadge level={s.level} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

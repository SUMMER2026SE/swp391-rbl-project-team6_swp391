import { createFileRoute, Link, Outlet, useRouterState, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge, StatusBadge } from "@/components/teacher/badges";
import { Progress } from "@/components/ui/progress";
import { getClassById, getStudentsByClass, getProgressByClass } from "@/data/teacher-data";
import { MOCK_CLASSES } from "@/data/teacher-classes";
import {
  Calendar, Users, BookOpen, ClipboardList, FileText, TrendingUp,
  UserPlus, Edit, Archive, ArrowLeft, PlusCircle, AlertTriangle, Clock, CheckCircle2
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog, InviteStudentsDialog } from "@/components/teacher/dialogs";

export const Route = createFileRoute("/teacher/classes/$classId")({
  loader: ({ params }) => {
    const cls = getClassById(params.classId);
    if (!cls) throw notFound();
    return { cls };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.cls.name ?? "Class"} — MIDORI Teacher` }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <h1 className="text-xl font-semibold">Class not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This class no longer exists or you don&apos;t have access.
      </p>
      <Button asChild className="mt-4">
        <Link to="/teacher/classes"><ArrowLeft className="mr-2 h-4 w-4" />Back to classes</Link>
      </Button>
    </div>
  ),
  component: ClassWorkspaceLayout,
});

// ─── Overview content component ───────────────────────────────────────────────

function ClassOverview({ classId, cls }: { classId: string; cls: ReturnType<typeof getClassById> }) {
  const students = getStudentsByClass(classId);
  const progressData = getProgressByClass(classId);
  const mockClass = MOCK_CLASSES.find((c) => c.id === classId);

  const recentActivity = mockClass?.recentActivity ?? [];
  const upcomingWork = mockClass?.upcomingWork ?? [];

  const hwCompletion =
    progressData && progressData.homeworkCompletion != null
      ? progressData.homeworkCompletion
      : 0;

  const atRiskStudents = students.filter((s) => s.status === "at-risk").slice(0, 5);

  const skillSnapshot = progressData?.skills ?? {
    Vocabulary: 0,
    Grammar: 0,
    Reading: 0,
    Listening: 0,
  };

  const skillLabelClass = (value: number) => {
    if (value >= 70) return "text-emerald-600";
    if (value >= 40) return "text-amber-600";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Students enrolled"
          value={String(students.length)}
          icon={Users}
          className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
          iconClass="text-blue-600 dark:text-blue-400"
        />
        <SummaryCard
          label="Avg progress"
          value={`${cls?.progress ?? 0}%`}
          icon={TrendingUp}
          className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
          iconClass="text-emerald-600 dark:text-emerald-400"
        />
        <SummaryCard
          label="Homework completion"
          value={`${hwCompletion}%`}
          icon={ClipboardList}
          className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30"
          iconClass="text-purple-600 dark:text-purple-400"
        />
        <SummaryCard
          label="Upcoming exams"
          value={String(cls?.upcomingExams ?? 0)}
          icon={FileText}
          className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
          iconClass="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ── 2. Quick actions ── */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/teacher/lessons/create" search={{ classId }}>
                <PlusCircle className="mr-1.5 h-4 w-4" />Create lesson
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/teacher/homework/create" search={{ classId }}>
                <PlusCircle className="mr-1.5 h-4 w-4" />Assign homework
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/teacher/exams/create" search={{ classId }}>
                <PlusCircle className="mr-1.5 h-4 w-4" />Create exam
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`/teacher/classes/${classId}/students`}>
                <UserPlus className="mr-1.5 h-4 w-4" />Invite students
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`/teacher/classes/${classId}/progress`}>
                <TrendingUp className="mr-1.5 h-4 w-4" />View progress
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Upcoming work ── */}
      {upcomingWork.length > 0 ? (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Upcoming Work
            </h3>
            <div className="space-y-2">
              {upcomingWork.map((work) => {
                const priorityColor =
                  work.priority === "High"
                    ? "text-red-600 dark:text-red-400"
                    : work.priority === "Medium"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground";
                return (
                  <div
                    key={work.id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{work.title}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {work.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-medium", priorityColor)}>
                        {work.priority}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />{work.due}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Upcoming Work
            </h3>
            <p className="text-sm text-muted-foreground">No upcoming work scheduled.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── 4. Recent activity ── */}
        {recentActivity.length > 0 ? (
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Recent Activity
              </h3>
              <div className="space-y-2">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="flex-1 text-muted-foreground">
                      {activity.text}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Recent Activity
              </h3>
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            </CardContent>
          </Card>
        )}

        {/* ── 5. At-risk / low progress students ── */}
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              At-Risk Students
            </h3>
            {atRiskStudents.length > 0 ? (
              <div className="space-y-2">
                {atRiskStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-md border p-2.5 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{student.name}</div>
                        {student.weakSkill ? (
                          <div className="text-xs text-muted-foreground">
                            Weak: {student.weakSkill}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Progress value={student.progress} className="h-1.5 w-12" />
                      <span className="text-xs font-semibold">{student.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                All students are on track.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 6. Skill snapshot ── */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Skill Snapshot
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.entries(skillSnapshot) as [string, number][]).map(([skill, value]) => (
              <div key={skill}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{skill}</span>
                  <span className={cn("text-sm font-semibold", skillLabelClass(value))}>
                    {value}%
                  </span>
                </div>
                <Progress
                  value={value}
                  className={cn(
                    "h-2",
                    value >= 70
                      ? "[&>div]:bg-emerald-500"
                      : value >= 40
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-red-500"
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Summary card helper ───────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  className,
  iconClass,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  iconClass?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("rounded-full bg-primary/10 p-2.5", iconClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main layout component ────────────────────────────────────────────────────

function ClassWorkspaceLayout() {
  const { cls } = Route.useLoaderData();
  const students = getStudentsByClass(cls.id);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [invite, setInvite] = useState(false);
  const [archive, setArchive] = useState(false);

  const base = `/teacher/classes/${cls.id}`;
  const tabs = [
    { to: base, label: "Overview", icon: TrendingUp, exact: true },
    { to: `${base}/students`, label: "Students", icon: Users },
    { to: `${base}/lessons`, label: "Lessons", icon: BookOpen },
    { to: `${base}/homework`, label: "Homework", icon: ClipboardList },
    { to: `${base}/exams`, label: "Exams", icon: FileText },
    { to: `${base}/progress`, label: "Progress", icon: TrendingUp },
  ];

  const isOverview = pathname === base;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
        >
          <Link to="/teacher/classes">
            <ArrowLeft className="mr-1 h-4 w-4" />All classes
          </Link>
        </Button>
        <PageHeader
          eyebrow={cls.jpName}
          title={cls.name}
          subtitle={cls.description}
          actions={
            <>
              <Button variant="outline" onClick={() => setInvite(true)}>
                <UserPlus className="mr-2 h-4 w-4" />Invite
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => toast.info("Opening class editor…")}>
                    <Edit className="mr-2 h-4 w-4" />Edit class
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setArchive(true)}>
                    <Archive className="mr-2 h-4 w-4" />Archive class
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-5 md:grid-cols-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Level
            </div>
            <div className="mt-1">
              <LevelBadge level={cls.level} />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Status
            </div>
            <div className="mt-1">
              <StatusBadge status={cls.status} />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />Schedule
            </div>
            <div className="mt-1 text-sm font-medium">{cls.schedule}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />Students
            </div>
            <div className="mt-1 text-sm font-medium">
              {students.length} / {cls.capacity}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Progress
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Progress value={cls.progress} className="h-1.5 flex-1" />
              <span className="text-xs font-semibold">{cls.progress}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 rounded-lg bg-muted/40 p-1">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {isOverview ? (
        <ClassOverview classId={cls.id} cls={cls} />
      ) : (
        <Outlet />
      )}

      <InviteStudentsDialog open={invite} onOpenChange={setInvite} className={cls.name} />
      <ConfirmDialog
        open={archive}
        onOpenChange={setArchive}
        title="Archive this class?"
        description="Students will lose access. You can restore later from archived classes."
        destructive
        confirmLabel="Archive class"
        onConfirm={() => toast.success(`${cls.name} archived`)}
      />
    </div>
  );
}

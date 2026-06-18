import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Users, BookOpen, TrendingUp, CheckCircle2, AlertTriangle,
  ClipboardList, GraduationCap, ArrowUpRight, Plus, Clock,
  FileText, Headphones, Download, Shield, BarChart3
} from "lucide-react";
import { Card, LevelBadge, EmptyState, Progress, PageHeader } from "@/components/page-ui";
import { MOCK_CLASSES, type StudentInvitation } from "@/data/teacher-classes";
import { cn } from "@/lib/utils";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function avg(arr: number[]) {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

const ACTIVE_CLASSES = MOCK_CLASSES.filter((c) => c.status === "Active");
const ALL_INVITATIONS = ACTIVE_CLASSES.flatMap((c) => (c.invitations ?? []));
const ACTIVE_STUDENTS = ALL_INVITATIONS.filter(
  (s): s is StudentInvitation & { progressDetails: NonNullable<StudentInvitation["progressDetails"]> } =>
    s.status === "Active" && s.progressDetails != null
);

const totalStudents = ACTIVE_STUDENTS.length;
const pendingInvitations = ALL_INVITATIONS.filter((s) => s.status === "Invited").length;
const openHomework = ACTIVE_CLASSES.reduce((s, c) => s + (c.homeworkList ?? []).filter((h) => h.status === "Open").length, 0);
const openExams = ACTIVE_CLASSES.reduce((s, c) => s + (c.examList ?? []).filter((e) => e.status === "Open").length, 0);
const lowProgressStudents = ACTIVE_STUDENTS.filter((s) => (s.progressDetails?.overallProgress ?? 0) < 50).length;

const allRecentActivity = ACTIVE_CLASSES.flatMap((c) =>
  (c.recentActivity ?? []).map((a) => ({ ...a, className: c.name }))
).sort((a, b) => a.id.localeCompare(b.id)).slice(0, 6);

/* ─── Main Component ──────────────────────────────────────────────────────── */

export const Route = createFileRoute("/teacher/")({ component: TeacherDashboard });

function TeacherDashboard() {
  const firstClass = ACTIVE_CLASSES[0];

  return (
    <div className="space-y-5">
      {/* ── A. Welcome ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Welcome back, Teacher"
        subtitle="Manage your classes, lessons, homework, exams and student progress."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/teacher/classes/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Class
            </Link>
            <Link
              to="/teacher/classes"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 shadow-sm transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              View My Classes
            </Link>
          </div>
        }
      />

      {/* ── B. Overview Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        {[
          { label: "Active Classes", value: ACTIVE_CLASSES.length, icon: <BookOpen className="w-4 h-4" />, accent: "primary" as const },
          { label: "Total Students", value: totalStudents, icon: <Users className="w-4 h-4" />, accent: "sky" as const },
          { label: "Pending Invites", value: pendingInvitations, icon: <Clock className="w-4 h-4" />, accent: "sakura" as const },
          { label: "Open Homework", value: openHomework, icon: <ClipboardList className="w-4 h-4" />, accent: "red" as const },
          { label: "Open Exams", value: openExams, icon: <FileText className="w-4 h-4" />, accent: "red" as const },
          { label: "At-Risk Students", value: lowProgressStudents, icon: <AlertTriangle className="w-4 h-4" />, accent: "red" as const },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-lg grid place-items-center ${
                stat.accent === "primary" ? "bg-primary/15 text-primary" :
                stat.accent === "sky"    ? "bg-sky-blue/20 text-sky-blue" :
                stat.accent === "sakura" ? "bg-sakura/40 text-jp-red" :
                                           "bg-[var(--jp-red)]/15 text-[var(--jp-red)]"
              }`}>{stat.icon}</div>
              <div className="font-display font-black text-sm leading-tight">{stat.value}</div>
              <div className="text-[9px] text-muted-col uppercase tracking-wider font-bold leading-tight">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── C. Recent Classes ──────────────────────────────────────────── */}
      <div>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          Recent Classes
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACTIVE_CLASSES.slice(0, 3).map((cls) => (
            <Card key={cls.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-bold text-sm text-foreground leading-snug">{cls.name}</p>
                  <p className="text-[10px] text-muted-col mt-0.5">{cls.description}</p>
                </div>
                <LevelBadge level={cls.level} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  cls.status === "Active" ? "bg-[var(--status-active)]/15 text-[var(--status-active)]" :
                  cls.status === "Draft"  ? "bg-[var(--status-pending)]/15 text-[var(--status-pending)]" :
                                            "bg-muted text-muted-col"
                }`}>{cls.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/20 rounded-lg py-1.5">
                  <div className="font-display font-black text-xs">{cls.students}</div>
                  <div className="text-[9px] text-muted-col">Students</div>
                </div>
                <div className="bg-muted/20 rounded-lg py-1.5">
                  <div className="font-display font-black text-xs">{cls.lessons}</div>
                  <div className="text-[9px] text-muted-col">Lessons</div>
                </div>
                <div className="bg-muted/20 rounded-lg py-1.5">
                  <div className="font-display font-black text-xs">{cls.averageProgress}%</div>
                  <div className="text-[9px] text-muted-col">Progress</div>
                </div>
              </div>
              <Link
                to={`/teacher/classes/${cls.id}`}
                className="mt-auto inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-[10px] font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
              >
                View Class <ArrowUpRight className="w-3 h-3" />
              </Link>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── D. Teaching Tasks ─────────────────────────────────────────── */}
        <Card>
          <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[var(--jp-red)]" />
            Teaching Tasks
          </h2>
          <div className="space-y-2">
            {(() => {
              const tasks: { label: string; count: number; to: string; icon: React.ReactNode; accent: string }[] = [];

              // Pending invitations
              const pendingCount = ALL_INVITATIONS.filter((s) => s.status === "Invited").length;
              if (pendingCount > 0 && firstClass) {
                tasks.push({
                  label: `${pendingCount} Pending invitation(s) need follow-up`,
                  count: pendingCount,
                  to: `/teacher/classes/${firstClass.id}/students`,
                  icon: <Users className="w-3.5 h-3.5" />,
                  accent: "bg-[var(--jp-red)]/15 text-[var(--jp-red)]",
                });
              }

              // Missing homework
              ACTIVE_CLASSES.forEach((cls) => {
                (cls.homeworkList ?? []).forEach((h) => {
                  if (h.missingCount > 0) {
                    tasks.push({
                      label: `${h.missingCount} missing submission(s) — ${h.title}`,
                      count: h.missingCount,
                      to: `/teacher/classes/${cls.id}/homework`,
                      icon: <ClipboardList className="w-3.5 h-3.5" />,
                      accent: "bg-[var(--jp-red)]/15 text-[var(--jp-red)]",
                    });
                  }
                });
              });

              // Open exams
              ACTIVE_CLASSES.forEach((cls) => {
                (cls.examList ?? []).forEach((e) => {
                  if (e.status === "Open") {
                    tasks.push({
                      label: `Open exam — ${e.title}`,
                      count: e.submittedCount ?? 0,
                      to: `/teacher/classes/${cls.id}/exams`,
                      icon: <FileText className="w-3.5 h-3.5" />,
                      accent: "bg-sky-blue/15 text-sky-blue",
                    });
                  }
                });
              });

              // Low progress
              const lowCount = ACTIVE_STUDENTS.filter((s) => (s.progressDetails?.overallProgress ?? 0) < 50).length;
              if (lowCount > 0 && firstClass) {
                tasks.push({
                  label: `${lowCount} student(s) with low progress`,
                  count: lowCount,
                  to: `/teacher/classes/${firstClass.id}/progress`,
                  icon: <TrendingUp className="w-3.5 h-3.5" />,
                  accent: "bg-[var(--status-pending)]/15 text-[var(--status-pending)]",
                });
              }

              // Draft lessons
              ACTIVE_CLASSES.forEach((cls) => {
                (cls.lessonList ?? []).forEach((l) => {
                  if (l.status === "Draft") {
                    tasks.push({
                      label: `Draft — ${l.title}`,
                      count: 0,
                      to: `/teacher/classes/${cls.id}/lessons`,
                      icon: <GraduationCap className="w-3.5 h-3.5" />,
                      accent: "bg-[var(--status-pending)]/15 text-[var(--status-pending)]",
                    });
                  }
                });
              });

              if (tasks.length === 0) {
                return <p className="text-xs text-muted-col">All clear — no attention needed.</p>;
              }

              return tasks.slice(0, 6).map((t) => (
                <Link
                  key={t.label}
                  to={t.to}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg grid place-items-center flex-shrink-0 ${t.accent}`}>{t.icon}</div>
                    <span className="text-xs text-foreground truncate">{t.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-col flex-shrink-0">
                    {t.count > 0 ? t.count : "→"}
                  </span>
                </Link>
              ));
            })()}
          </div>
        </Card>

        {/* ── E + G. Low Progress + Recent Activity ────────────────────── */}
        <div className="space-y-5">
          {/* Low Progress Students */}
          <Card>
            <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[var(--jp-red)]" />
              Low Progress Students
            </h2>
            {lowProgressStudents === 0 ? (
              <p className="text-xs text-muted-col">No students flagged.</p>
            ) : (
              <div className="space-y-2">
                {ACTIVE_STUDENTS
                  .filter((s) => (s.progressDetails?.overallProgress ?? 0) < 50)
                  .map((s) => {
                    const classInfo = ACTIVE_CLASSES.find((c) =>
                      (c.invitations ?? []).some((inv) => inv.id === s.id && inv.status === "Active")
                    );
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/30">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                          <p className="text-[10px] text-muted-col">{classInfo?.name ?? ""}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {(s.progressDetails?.warnings ?? []).map((w) => {
                            const cfg: Record<string, { label: string; cls: string }> = {
                              "Low progress":     { label: "Low Progress", cls: "bg-[var(--jp-red)]/10 text-[var(--jp-red)]" },
                              "Missing homework": { label: "Missing HW",   cls: "bg-[var(--status-pending)]/10 text-[var(--status-pending)]" },
                              "Weak listening":   { label: "Weak Listen",  cls: "bg-sky-blue/10 text-sky-blue" },
                              "Inactive":         { label: "Inactive",      cls: "bg-gray-100 dark:bg-gray-800 text-gray-500" },
                            };
                            const c = cfg[w] ?? { label: w, cls: "bg-muted text-muted-col" };
                            return (
                              <span key={w} className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${c.cls}`}>
                                {c.label}
                              </span>
                            );
                          })}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[10px] font-bold text-[var(--jp-red)]">{s.progressDetails?.overallProgress ?? 0}%</div>
                          <div className="text-[9px] text-muted-col">{s.lastActive}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card>
            <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {allRecentActivity.length === 0 ? (
                <p className="text-xs text-muted-col">No recent activity.</p>
              ) : (
                allRecentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground">{a.text}</p>
                      <p className="text-[10px] text-muted-col">{a.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── F. Quick Actions ───────────────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { label: "Create Class",      to: "/teacher/classes/create", icon: <Plus className="w-3.5 h-3.5" /> },
            { label: "Manage Classes",   to: "/teacher/classes",        icon: <BookOpen className="w-3.5 h-3.5" /> },
            { label: "Manage Lessons",    to: "/teacher/lessons",        icon: <GraduationCap className="w-3.5 h-3.5" /> },
            { label: "Assign Homework",  to: "/teacher/homework",       icon: <ClipboardList className="w-3.5 h-3.5" /> },
            { label: "Manage Exams",     to: "/teacher/exams",         icon: <FileText className="w-3.5 h-3.5" /> },
            { label: "View Progress",     to: "/teacher/progress",      icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { label: "Data Bank",        to: "/teacher/data-bank",     icon: <Download className="w-3.5 h-3.5" /> },
            { label: "Reports",          to: "/teacher/reports",       icon: <BarChart3 className="w-3.5 h-3.5" /> },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 hover:bg-muted/30 transition text-center"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary grid place-items-center">{action.icon}</div>
              <span className="text-[10px] font-semibold text-foreground leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* ── H. Rules / Info Card ──────────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          Teaching Rules
        </h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {[
            "Teacher manages only their own classes.",
            "Class level (N5–N1) is required when creating a class.",
            "Students must accept invitation before joining the class.",
            "Data Bank is managed by Admin; Teacher can use approved content.",
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                {i + 1}
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

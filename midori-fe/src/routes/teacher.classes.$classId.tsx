import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Users, BookOpenCheck, ClipboardList, ClipboardCheck,
  TrendingUp, Mail, Link2, ExternalLink, Clock, Shield,
  BookOpen, GraduationCap, Headphones, Mic, BarChart3, CheckCircle,
  ChevronRight, Plus, AlertTriangle, FileText
} from "lucide-react";
import { PageHeader, Card, LevelBadge, EmptyState, Progress } from "@/components/page-ui";
import { MOCK_CLASSES, type TeacherClass } from "@/data/teacher-classes";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: TeacherClass["status"] }) {
  const cfg: Record<string, { label: string; dot: string; text: string }> = {
    Active:   { label: "Active",   dot: "bg-[var(--status-active)]",   text: "text-[var(--status-active)]" },
    Draft:    { label: "Draft",    dot: "bg-[var(--status-pending)]",  text: "text-[var(--status-pending)]" },
    Archived: { label: "Archived", dot: "bg-gray-400",               text: "text-gray-400" },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    High:   { label: "High",   cls: "text-[var(--status-rejected)] bg-[var(--status-rejected)]/10 border-[var(--status-rejected)]/20" },
    Medium: { label: "Medium", cls: "text-[var(--status-pending)] bg-[var(--status-pending)]/10 border-[var(--status-pending)]/20" },
    Low:    { label: "Low",    cls: "text-[var(--status-active)] bg-[var(--status-active)]/10 border-[var(--status-active)]/20" },
  };
  const c = cfg[priority];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.cls}`}>{c.label}</span>
  );
}

const SECTION_ITEMS = [
  { to: "",                              icon: BookOpen,       label: "Overview",    desc: "Class overview, stats and quick actions." },
  { to: "students",                      icon: Users,          label: "Students",    desc: "Invite and manage class members by Gmail." },
  { to: "lessons",                       icon: GraduationCap,  label: "Lessons",     desc: "Create and manage lessons following class level." },
  { to: "homework",                      icon: ClipboardList,  label: "Homework",    desc: "Create and assign homework to this class." },
  { to: "exams",                         icon: ClipboardCheck, label: "Exams",       desc: "Create and manage exams for this class." },
  { to: "progress",                      icon: TrendingUp,     label: "Progress",    desc: "Track student learning progress in this class." },
] as const;

/* ─── Main Component ──────────────────────────────────────────────────────── */

export const Route = createFileRoute("/teacher/classes/$classId")({
  component: TeacherClassDetailPage,
});

function TeacherClassDetailPage() {
  const { classId } = Route.useParams();
  const location = useLocation();
  const cls = MOCK_CLASSES.find((c) => c.id === classId);

  // Not found state
  if (!cls) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            to="/teacher/classes"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Classes
          </Link>
        </div>
        <EmptyState
          title="Class not found"
          hint="The class you are looking for does not exist or has been removed."
          action={
            <Link
              to="/teacher/classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Classes
            </Link>
          }
        />
      </div>
    );
  }

  const basePath = `/teacher/classes/${classId}`;
  const tabBase = (tail: string) => `${basePath}/${tail}`;

  // If on a child route (students/lessons/homework/exams/progress),
  // render only the child page without the overview wrapper.
  if (location.pathname !== basePath) {
    return <Outlet />;
  }

  return (
    <div className="space-y-5">
      {/* ── A. Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title={cls.name}
        subtitle="You are teaching this class."
        action={
          <div className="flex items-center gap-2">
            <LevelBadge level={cls.level} />
            <StatusBadge status={cls.status} />
          </div>
        }
      />

      {/* Description + Schedule */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm space-y-2">
        <p className="text-sm text-muted-foreground">{cls.description}</p>
        {cls.schedule && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-primary/60" />
            <span className="font-semibold text-foreground">Schedule:</span> {cls.schedule}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { to: tabBase("students"),  icon: Mail,            label: "Invite Students" },
          { to: tabBase("lessons"),   icon: BookOpen,         label: "Create Lesson" },
          { to: tabBase("homework"),  icon: ClipboardList,    label: "Create Homework" },
          { to: tabBase("exams"),     icon: ClipboardCheck,   label: "Create Exam" },
          { to: tabBase("progress"),  icon: TrendingUp,       label: "View Progress" },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40 hover:text-primary transition"
          >
            <action.icon className="w-3.5 h-3.5" />
            {action.label}
            <ExternalLink className="w-3 h-3 text-muted-col" />
          </Link>
        ))}
      </div>

      {/* Child routes (students, lessons, homework, exams, progress) render here */}
      <Outlet />

      {/* ── B. Overview Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { label: "Students",   value: cls.students,        icon: <Users className="w-4 h-4" />,         accent: "primary" as const },
          { label: "Lessons",    value: cls.lessons,          icon: <BookOpenCheck className="w-4 h-4" />, accent: "sky" as const },
          { label: "Progress",   value: `${cls.averageProgress}%`, icon: <TrendingUp className="w-4 h-4" />, accent: "sakura" as const },
          { label: "Homework",   value: cls.openHomework,     icon: <ClipboardList className="w-4 h-4" />, accent: "primary" as const },
          { label: "Exams",      value: cls.openExams,        icon: <ClipboardCheck className="w-4 h-4" />, accent: "red" as const },
          { label: "Invitations",value: cls.pendingInvitations,icon: <Mail className="w-4 h-4" />,          accent: "sky" as const },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-lg grid place-items-center ${
                stat.accent === "primary" ? "bg-primary/15 text-primary" :
                stat.accent === "sakura"  ? "bg-sakura/40 text-jp-red" :
                stat.accent === "sky"     ? "bg-sky-blue/20 text-sky-blue" :
                stat.accent === "red"     ? "bg-[var(--jp-red)]/15 text-[var(--jp-red)]" :
                                           "bg-muted text-muted-foreground"
              }`}>
                {stat.icon}
              </div>
              <div className="font-display font-black text-lg">{stat.value}</div>
              <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── C. Class Level Notice ─────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Class level is {cls.level}.</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lessons, homework, exams and Data Bank content should follow this level.
          </p>
        </div>
      </div>

      {/* ── D. Section Navigation ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SECTION_ITEMS.map((section) => {
          const href = section.to ? tabBase(section.to) : basePath;
          return (
            <Link
              key={section.to}
              to={href}
              className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                <section.icon className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition">{section.label}</h3>
              <p className="text-[10px] text-muted-col mt-1 leading-relaxed">{section.desc}</p>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-primary mt-2 opacity-0 group-hover:opacity-100 transition">
                Open <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── E. Recent Activity & F. Upcoming Work ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <Card>
          <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            Recent Activity
          </h2>
          {cls.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {cls.recentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground">{act.text}</p>
                    <span className="text-[10px] text-muted-col">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-col">No recent activity.</p>
          )}
        </Card>

        {/* Upcoming Work */}
        <Card>
          <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[var(--jp-red)]" />
            Upcoming Work
          </h2>
          {cls.upcomingWork.length > 0 ? (
            <div className="space-y-2.5">
              {cls.upcomingWork.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">{item.title}</span>
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-col">
                      <FileText className="w-3 h-3" />
                      <span>{item.type}</span>
                      <span>·</span>
                      <span>{item.due}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-col">No upcoming work scheduled.</p>
          )}
        </Card>
      </div>

      {/* ── G. Teacher Rules ──────────────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          Class Rules
        </h2>
        <ul className="space-y-2">
          {[
            "You manage only this class. Students from other classes cannot access content here.",
            "Students must accept your invitation before joining and seeing lessons.",
            "Class level (N5–N1) controls which lessons, homework, exams and Data Bank content are available.",
            "Data Bank is managed by Admin. You can pick or random approved content from the bank — you cannot modify the bank directly.",
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

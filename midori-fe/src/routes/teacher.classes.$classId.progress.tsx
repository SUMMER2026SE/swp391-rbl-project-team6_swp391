import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, TrendingUp, Users, Search, Shield, CheckCircle2,
  Clock, XCircle, AlertTriangle, BookOpen, Download, GraduationCap,
  Headphones, Mic, ClipboardList, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { PageHeader, Card, LevelBadge, EmptyState, Progress } from "@/components/page-ui";
import { MOCK_CLASSES, type StudentInvitation } from "@/data/teacher-classes";
import { cn } from "@/lib/utils";

/* ─── Types ───────────────────────────────────────────────────────────────── */

type WarningType = StudentInvitation["progressDetails"] extends undefined
  ? never
  : StudentInvitation["progressDetails"]["warnings"][number];
type WarningFilter = "All" | WarningType | "None";
type ProgressRange = "All" | "80plus" | "50to79" | "below50";

const SKILLS = [
  { key: "vocabularyProgress",  label: "Vocabulary",  icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { key: "grammarProgress",     label: "Grammar",     icon: <FileText className="w-3.5 h-3.5" /> },
  { key: "listeningProgress",   label: "Listening",   icon: <Headphones className="w-3.5 h-3.5" /> },
  { key: "shadowingProgress",   label: "Shadowing",   icon: <Mic className="w-3.5 h-3.5" /> },
  { key: "homeworkProgress",    label: "Homework",    icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { key: "examProgress",        label: "Exam",        icon: <BookOpen className="w-3.5 h-3.5" /> },
] as const;

const WARNING_CONFIG: Record<string, { label: string; className: string }> = {
  "Low progress":     { label: "Low Progress",  className: "bg-[var(--jp-red)]/10 text-[var(--jp-red)] border-[var(--jp-red)]/20" },
  "Missing homework": { label: "Missing HW",    className: "bg-[var(--status-pending)]/10 text-[var(--status-pending)] border-[var(--status-pending)]/20" },
  "Weak listening":   { label: "Weak Listening", className: "bg-sky-blue/10 text-sky-blue border-sky-blue/20" },
  "Inactive":         { label: "Inactive",       className: "bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700" },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function StudentStatusBadge({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {warnings.map((w) => {
        const cfg = WARNING_CONFIG[w] ?? { label: w, className: "bg-gray-100 text-gray-500 border-gray-200" };
        return (
          <span key={w} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${cfg.className}`}>
            <AlertTriangle className="w-2.5 h-2.5" />
            {cfg.label}
          </span>
        );
      })}
    </div>
  );
}

function ProgressCell({ value, size = "sm" }: { value: number; size?: "sm" | "xs" }) {
  const color =
    value >= 80 ? "text-[var(--status-active)]" :
    value >= 50 ? "text-[var(--status-pending)]" :
                  "text-[var(--jp-red)]";
  return (
    <span className={cn("font-bold", color, size === "xs" ? "text-[10px]" : "text-xs")}>{value}%</span>
  );
}

function avg(arr: number[]) {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export const Route = createFileRoute("/teacher/classes/$classId/progress")({
  component: TeacherClassProgressPage,
});

function TeacherClassProgressPage() {
  const { classId } = Route.useParams();
  const cls = MOCK_CLASSES.find((c) => c.id === classId);

  const [search, setSearch] = useState("");
  const [warningFilter, setWarningFilter] = useState<WarningFilter>("All");
  const [progressFilter, setProgressFilter] = useState<ProgressRange>("All");
  const [showAtRisk, setShowAtRisk] = useState(false);

  const activeStudents = (cls?.invitations ?? []).filter(
    (s): s is StudentInvitation & { progressDetails: NonNullable<StudentInvitation["progressDetails"]> } =>
      s.status === "Active" && s.progressDetails != null
  );

  const filtered = useMemo(() => {
    return activeStudents.filter((s) => {
      const pd = s.progressDetails!;
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchWarning =
        warningFilter === "All" ||
        (warningFilter === "None" && pd.warnings.length === 0) ||
        pd.warnings.includes(warningFilter);
      const matchProgress =
        progressFilter === "All" ||
        (progressFilter === "80plus" && pd.overallProgress >= 80) ||
        (progressFilter === "50to79" && pd.overallProgress >= 50 && pd.overallProgress < 80) ||
        (progressFilter === "below50" && pd.overallProgress < 50);
      return matchSearch && matchWarning && matchProgress;
    });
  }, [activeStudents, search, warningFilter, progressFilter]);

  // Overview
  const allOverall = activeStudents.map((s) => s.progressDetails!.overallProgress);
  const allScores = activeStudents.map((s) => s.progressDetails!.averageScore).filter((v): v is number => v != null);
  const publishedLessons = (cls?.lessonList ?? []).filter((l) => l.status === "Published").length;
  const totalMissing = (cls?.homeworkList ?? []).reduce((s, h) => s + h.missingCount, 0);
  const lowProgressStudents = activeStudents.filter((s) => (s.progressDetails?.overallProgress ?? 0) < 50).length;

  // Weakest skill
  const skillAvgs = SKILLS.map((sk) => ({
    label: sk.label,
    avg: avg(activeStudents.map((s) => s.progressDetails?.[sk.key] ?? 0)),
  }));
  const weakestSkill = skillAvgs.reduce((min, s) => (s.avg < min.avg ? s : min), skillAvgs[0]);

  // At-risk students
  const atRiskStudents = activeStudents.filter((s) => (s.progressDetails?.warnings?.length ?? 0) > 0);

  // Not found
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

  return (
    <div className="space-y-5">
      {/* ── A. Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Class Progress"
        subtitle={`${cls.name} · Track learning progress of students in this class.`}
        action={
          <div className="flex items-center gap-2">
            <Link
              to={basePath}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export Progress
            </button>
          </div>
        }
      />

      {/* Class info bar */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm flex flex-wrap items-center gap-3">
        <LevelBadge level={cls.level} />
        <p className="text-sm text-muted-foreground">{cls.description}</p>
      </div>

      {/* ── B. Class Level Notice ─────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">This class level is {cls.level}.</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Progress is calculated from lessons, homework and exams assigned to this class.
          </p>
        </div>
      </div>

      {/* ── C. Overview Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        {[
          { label: "Avg Progress", value: `${avg(allOverall)}%`,   icon: <TrendingUp className="w-4 h-4" />,  accent: "primary" as const },
          { label: "Avg Score",    value: allScores.length > 0 ? `${avg(allScores)}/10` : "—", icon: <CheckCircle2 className="w-4 h-4" />, accent: "sakura" as const },
          { label: "Done Lessons", value: publishedLessons,         icon: <BookOpen className="w-4 h-4" />,   accent: "sky" as const },
          { label: "Missing HW",   value: totalMissing,             icon: <Clock className="w-4 h-4" />,      accent: "red" as const },
          { label: "At-Risk",      value: lowProgressStudents,      icon: <AlertTriangle className="w-4 h-4" />, accent: "red" as const },
          { label: "Weakest Skill",value: weakestSkill.label,       icon: <Users className="w-4 h-4" />,      accent: "sky" as const },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-lg grid place-items-center ${
                stat.accent === "primary" ? "bg-primary/15 text-primary" :
                stat.accent === "sakura"  ? "bg-sakura/40 text-jp-red" :
                stat.accent === "sky"     ? "bg-sky-blue/20 text-sky-blue" :
                                           "bg-[var(--jp-red)]/15 text-[var(--jp-red)]"
              }`}>{stat.icon}</div>
              <div className="font-display font-black text-sm leading-tight">{stat.value}</div>
              <div className="text-[9px] text-muted-col uppercase tracking-wider font-bold leading-tight">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── D. Skill Progress Section ────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          Skill Progress — {cls.name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SKILLS.map((sk) => {
            const classAvg = avg(activeStudents.map((s) => s.progressDetails?.[sk.key] ?? 0));
            const statusText =
              classAvg >= 80 ? "On track" :
              classAvg >= 50 ? "Needs practice" :
                               "Behind";
            return (
              <div key={sk.key} className="bg-muted/20 rounded-xl px-3 py-2.5 border border-border/30">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-col">{sk.icon}</span>
                    <span className="text-xs font-semibold text-foreground">{sk.label}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{classAvg}%</span>
                </div>
                  <Progress value={classAvg} />
                <p className="text-[10px] text-muted-col mt-1">{statusText} · avg across {activeStudents.length} students</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── G. At-Risk Students (toggle) ─────────────────────────────── */}
      {atRiskStudents.length > 0 && (
        <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowAtRisk((v) => !v)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--jp-red)]/10 text-[var(--jp-red)] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">At-Risk Students</p>
                <p className="text-[10px] text-muted-col">{atRiskStudents.length} student(s) with warnings</p>
              </div>
            </div>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--jp-red)]/10 text-[var(--jp-red)] text-xs font-bold">
              {atRiskStudents.length}
            </span>
          </button>
          {showAtRisk && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-2"
            >
              {atRiskStudents.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-muted/20 rounded-xl px-3 py-2 border border-border/30">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{s.name}</p>
                    <p className="text-[10px] text-muted-col">{s.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(s.progressDetails?.warnings ?? []).map((w) => {
                      const cfg = WARNING_CONFIG[w] ?? { label: w, className: "bg-gray-100 text-gray-500 border-gray-200" };
                      return (
                        <span key={w} className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* ── E. Student Progress Table ────────────────────────────────── */}
      {activeStudents.length > 0 ? (
      <Card>
        <div className="p-4 border-b border-border/30">
          <h2 className="font-display font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Student Progress
            <span className="text-[10px] text-muted-col font-normal">· Active students only</span>
          </h2>
        </div>

          {/* Filters */}
          <div className="p-4 border-b border-border/30 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-col pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-1.5">
                {(["All", "None", "Low progress", "Missing homework", "Weak listening", "Inactive"] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWarningFilter(w as WarningFilter)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all",
                      warningFilter === w
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
                    )}
                  >
                    {w === "None" ? "No Warnings" : w}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["All", "80plus", "50to79", "below50"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProgressFilter(p as ProgressRange)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all",
                      progressFilter === p
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
                    )}
                  >
                    {p === "All" ? "All" : p === "80plus" ? ">=80%" : p === "50to79" ? "50–79%" : "<50%"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 text-left">
                  <th className="px-4 py-2.5 font-semibold text-muted-col">Student</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-col text-center">Vocab</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-col text-center">Grammar</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-col text-center">Listening</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-col text-center">Shadowing</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-col text-center">HW</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-col text-center">Exam</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-col text-center">Overall</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-col text-center">Score</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-col">Active</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-col">Warnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((s) => {
                  const pd = s.progressDetails!;
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-muted/15 transition"
                    >
                      <td className="px-4 py-2.5">
                        <div>
                          <p className="font-semibold text-foreground">{s.name}</p>
                          <p className="text-[10px] text-muted-col">{s.email}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center"><ProgressCell value={pd.vocabularyProgress} /></td>
                      <td className="px-3 py-2.5 text-center"><ProgressCell value={pd.grammarProgress} /></td>
                      <td className="px-3 py-2.5 text-center"><ProgressCell value={pd.listeningProgress} /></td>
                      <td className="px-3 py-2.5 text-center"><ProgressCell value={pd.shadowingProgress} /></td>
                      <td className="px-3 py-2.5 text-center"><ProgressCell value={pd.homeworkProgress} /></td>
                      <td className="px-3 py-2.5 text-center"><ProgressCell value={pd.examProgress} /></td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn("font-bold", pd.overallProgress >= 80 ? "text-[var(--status-active)]" : pd.overallProgress >= 50 ? "text-[var(--status-pending)]" : "text-[var(--jp-red)]")}>
                          {pd.overallProgress}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-bold text-foreground">{pd.averageScore != null ? `${pd.averageScore}/10` : "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] text-muted-col">{pd.lastActive}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <StudentStatusBadge warnings={pd.warnings} />
                      </td>
                    </motion.tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-muted-col text-xs">
                      No students match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No active students"
          hint="Students must accept the class invitation to appear here."
        />
      )}

      {/* ── H. Recent Progress Activity ──────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          Recent Progress Activity
        </h2>
        <div className="space-y-3">
          {(cls.recentActivity ?? []).slice(0, 4).map((a) => (
            <div key={a.id} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground">{a.text}</p>
                <p className="text-[10px] text-muted-col">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── I. Rules / Info Card ──────────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          Progress Rules
        </h2>
        <ul className="space-y-2">
          {[
            "Teacher only sees progress of students in this class.",
            "Progress is based on lessons, homework and exams assigned by Teacher to this class.",
            "Student progress follows the class JLPT level.",
            "Admin sees system-wide reports; Teacher sees class-level progress only.",
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

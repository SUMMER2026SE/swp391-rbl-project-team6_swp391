import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, ClipboardList, Plus, Search, Shield, CheckCircle2,
  Clock, FileText, BookOpen, AlertTriangle
} from "lucide-react";
import { PageHeader, Card, LevelBadge, EmptyState } from "@/components/page-ui";
import { MOCK_CLASSES, type Homework } from "@/data/teacher-classes";
import { cn } from "@/lib/utils";

/* ─── Types & Config ──────────────────────────────────────────────────────── */

type HWType = Homework["type"];
type HWStatus = Homework["status"];

const HW_TYPES = ["Vocabulary", "Grammar", "Listening", "Mixed"] as const;
const HW_STATUSES = ["Draft", "Open", "Closed", "Graded"] as const;

const TYPE_CONFIG: Record<HWType, { label: string; color: string }> = {
  Vocabulary: { label: "Vocabulary", color: "text-[var(--status-student)] bg-[var(--status-student)]/10" },
  Grammar:    { label: "Grammar",    color: "text-[var(--status-teacher)] bg-[var(--status-teacher)]/10" },
  Listening:  { label: "Listening",  color: "text-[var(--status-announcement)] bg-[var(--status-announcement)]/10" },
  Mixed:      { label: "Mixed",      color: "text-[var(--jp-red)] bg-[var(--jp-red)]/10" },
};

const STATUS_CONFIG: Record<HWStatus, { label: string; dot: string; text: string }> = {
  Draft:   { label: "Draft",   dot: "bg-[var(--status-pending)]",  text: "text-[var(--status-pending)]" },
  Open:    { label: "Open",    dot: "bg-[var(--status-active)]",   text: "text-[var(--status-active)]" },
  Closed:  { label: "Closed",  dot: "bg-[var(--status-rejected)]", text: "text-[var(--status-rejected)]" },
  Graded:  { label: "Graded",  dot: "bg-[var(--status-teacher)]",  text: "text-[var(--status-teacher)]" },
};

function HWTypeBadge({ type }: { type: HWType }) {
  const c = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-current/10 ${c.color}`}>
      {type}
    </span>
  );
}

function HWStatusBadge({ status }: { status: HWStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

const TYPE_HINT: Record<HWType, string> = {
  Vocabulary: "Quiz / word practice",
  Grammar:    "Structure practice",
  Listening:  "Listen-and-answer / dictation",
  Mixed:      "Combined skills",
};

/* ─── Main Component ──────────────────────────────────────────────────────── */

export const Route = createFileRoute("/teacher/classes/$classId/homework")({
  component: TeacherClassHomeworkPage,
});

function TeacherClassHomeworkPage() {
  const { classId } = Route.useParams();
  const cls = MOCK_CLASSES.find((c) => c.id === classId);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<HWType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<HWStatus | "All">("All");
  const [lessonFilter, setLessonFilter] = useState<string>("All");

  const homeworkList = cls?.homeworkList ?? [];
  const lessons = cls?.lessonList ?? [];
  const uniqueLessonIds = Array.from(new Set(homeworkList.map((h) => h.lessonId)));

  const filtered = useMemo(() => {
    return homeworkList.filter((hw) => {
      const matchSearch =
        hw.title.toLowerCase().includes(search.toLowerCase()) ||
        hw.description.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "All" || hw.type === typeFilter;
      const matchStatus = statusFilter === "All" || hw.status === statusFilter;
      const matchLesson = lessonFilter === "All" || hw.lessonId === lessonFilter;
      return matchSearch && matchType && matchStatus && matchLesson;
    });
  }, [homeworkList, search, typeFilter, statusFilter, lessonFilter]);

  const total = homeworkList.length;
  const openCount = homeworkList.filter((h) => h.status === "Open").length;
  const closedCount = homeworkList.filter((h) => h.status === "Closed" || h.status === "Graded").length;
  const totalSubmitted = homeworkList.reduce((s, h) => s + h.submittedCount, 0);
  const totalMissing = homeworkList.reduce((s, h) => s + h.missingCount, 0);

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
        title="Class Homework"
        subtitle={`${cls.name} · Create and manage homework assigned to this class.`}
        action={
          <div className="flex items-center gap-2">
            <Link
              to={basePath}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
            <Link
              to={`/teacher/homework/create?classId=${classId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Homework for This Class
            </Link>
          </div>
        }
      />

      {/* Create homework CTA notice */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
          <Plus className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Create Homework for This Class
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Homework created here will be assigned to this class and one of its lessons. Follows {cls.level} level.
          </p>
        </div>
      </div>

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
            Homework content and questions should follow this level.
          </p>
        </div>
      </div>

      {/* ── C. Overview Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { label: "Total",       value: total,            icon: <ClipboardList className="w-4 h-4" />, accent: "primary" as const },
          { label: "Open",        value: openCount,        icon: <Clock className="w-4 h-4" />,        accent: "sky" as const },
          { label: "Closed/Graded", value: closedCount,    icon: <CheckCircle2 className="w-4 h-4" />,accent: "sakura" as const },
          { label: "Submitted",   value: totalSubmitted,   icon: <FileText className="w-4 h-4" />,    accent: "primary" as const },
          { label: "Missing",     value: totalMissing,     icon: <AlertTriangle className="w-4 h-4" />, accent: "red" as const },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-lg grid place-items-center ${
                stat.accent === "primary" ? "bg-primary/15 text-primary" :
                stat.accent === "sakura"  ? "bg-sakura/40 text-jp-red" :
                stat.accent === "sky"     ? "bg-sky-blue/20 text-sky-blue" :
                                           "bg-[var(--jp-red)]/15 text-[var(--jp-red)]"
              }`}>{stat.icon}</div>
              <div className="font-display font-black text-lg">{stat.value}</div>
              <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── D. Search / Filter ────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-col pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by homework title…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Type filter */}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setTypeFilter("All")} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all", typeFilter === "All" ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40")}>All</button>
            {HW_TYPES.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all", typeFilter === t ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40")}>{t}</button>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {(["All", "Draft", "Open", "Closed", "Graded"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s as HWStatus | "All")} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all", statusFilter === s ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40")}>{s}</button>
            ))}
          </div>
          {/* Lesson filter */}
          {lessons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setLessonFilter("All")} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all", lessonFilter === "All" ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40")}>All Lessons</button>
              {lessons.map((l) => (
                <button key={l.id} onClick={() => setLessonFilter(l.id)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all max-w-[200px] truncate", lessonFilter === l.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40")}>{l.title}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── E. Homework List ──────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((hw, idx) => (
            <motion.div
              key={hw.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              {/* Top: title + badges */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-display font-bold text-sm truncate">{hw.title}</h3>
                    <LevelBadge level={hw.level} />
                    <HWTypeBadge type={hw.type} />
                    <HWStatusBadge status={hw.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-col mb-1.5">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {hw.lessonTitle}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due: {hw.deadline}
                    </span>
                    <span className="italic">{TYPE_HINT[hw.type]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{hw.description}</p>
                </div>
              </div>

              {/* Submission stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                {[
                  { label: "Submitted", value: `${hw.submittedCount}/${hw.totalStudents}`, accent: "primary" },
                  { label: "Missing",   value: hw.missingCount, accent: "red" },
                  { label: "Avg Score", value: hw.averageScore !== null ? `${hw.averageScore.toFixed(1)}/10` : "—", accent: "sakura" },
                  { label: "Late",      value: hw.lateSubmissions, accent: "sky" },
                  { label: "Type",      value: hw.type, accent: "primary" },
                ].map((m) => (
                  <div key={m.label} className={cn("rounded-xl px-3 py-2 border border-transparent", m.accent === "primary" ? "bg-primary/5" : m.accent === "sakura" ? "bg-sakura/10" : m.accent === "sky" ? "bg-sky-blue/5" : "bg-[var(--jp-red)]/5")}>
                    <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{m.label}</div>
                    <div className="text-xs font-bold text-foreground">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar for submitted */}
              {hw.totalStudents > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-col font-semibold uppercase tracking-wider">Submission Progress</span>
                    <span className="text-[10px] font-bold text-foreground">
                      {hw.totalStudents > 0 ? Math.round((hw.submittedCount / hw.totalStudents) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-hero rounded-full"
                      style={{ width: `${(hw.submittedCount / hw.totalStudents) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/30">
                <button type="button" className={cn("px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all", "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40")}>View Submissions</button>
                <button type="button" className={cn("px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all", "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40")}>Edit</button>
                {hw.status === "Open" && (
                  <button type="button" className={cn("px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all", "bg-[var(--status-pending)]/10 text-[var(--status-pending)] border-[var(--status-pending)]/20 hover:bg-[var(--status-pending)]/20")}>Close</button>
                )}
                {hw.submittedCount > 0 && (
                  <button type="button" className={cn("px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all", "bg-[var(--status-teacher)]/10 text-[var(--status-teacher)] border-[var(--status-teacher)]/20 hover:bg-[var(--status-teacher)]/20")}>Grade</button>
                )}
                <button type="button" className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-col transition" title="Archive">
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No homework found"
          hint="Create homework for this class to get started."
          action={
            <Link
              to={`/teacher/homework/create?classId=${classId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition mt-4"
            >
              <Plus className="w-4 h-4" />
              Create Homework for This Class
            </Link>
          }
        />
      )}

      {/* ── H. Rules / Info Card ──────────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          Homework Rules
        </h2>
        <ul className="space-y-2">
          {[
            "Homework belongs to a class and follows its JLPT level.",
            "Homework can be linked to a lesson — content is drawn from that lesson.",
            "Student only sees homework after accepting the class invitation and joining.",
            "Teacher creates and assigns homework; Student submits it for grading.",
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">{i + 1}</span>
              {rule}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, ClipboardCheck, Plus, Search, Shield, CheckCircle2,
  Clock, FileText, GraduationCap, Headphones, Mic,
  BookOpen, Timer, Calendar, Gauge
} from "lucide-react";
import { PageHeader, Card, LevelBadge, EmptyState } from "@/components/page-ui";
import { MOCK_CLASSES, type Exam } from "@/data/teacher-classes";
import { cn } from "@/lib/utils";

/* ─── Types & Config ──────────────────────────────────────────────────────── */

type ExamSection = Exam["sections"][number];
type ExamStatus = Exam["status"];

const EXAM_STATUSES = ["Draft", "Scheduled", "Open", "Closed", "Graded"] as const;
const EXAM_SECTIONS = ["Vocabulary", "Grammar", "Listening", "Mixed"] as const;

const SECTION_CONFIG: Record<ExamSection, { icon: typeof GraduationCap; color: string }> = {
  Vocabulary: { icon: GraduationCap, color: "text-[var(--status-student)] bg-[var(--status-student)]/10" },
  Grammar:    { icon: FileText,      color: "text-[var(--status-teacher)] bg-[var(--status-teacher)]/10" },
  Listening:  { icon: Headphones,    color: "text-[var(--status-announcement)] bg-[var(--status-announcement)]/10" },
  Mixed:      { icon: Mic,           color: "text-[var(--jp-red)] bg-[var(--jp-red)]/10" },
};

const STATUS_CONFIG: Record<ExamStatus, { label: string; dot: string; text: string }> = {
  Draft:     { label: "Draft",     dot: "bg-[var(--status-pending)]",  text: "text-[var(--status-pending)]" },
  Scheduled: { label: "Scheduled", dot: "bg-sky-blue",                text: "text-sky-blue" },
  Open:      { label: "Open",      dot: "bg-[var(--status-active)]",   text: "text-[var(--status-active)]" },
  Closed:    { label: "Closed",    dot: "bg-[var(--status-rejected)]", text: "text-[var(--status-rejected)]" },
  Graded:    { label: "Graded",    dot: "bg-[var(--status-teacher)]",  text: "text-[var(--status-teacher)]" },
};

function ExamStatusBadge({ status }: { status: ExamStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export const Route = createFileRoute("/teacher/classes/$classId/exams")({
  component: TeacherClassExamsPage,
});

function TeacherClassExamsPage() {
  const { classId } = Route.useParams();
  const cls = MOCK_CLASSES.find((c) => c.id === classId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "All">("All");
  const [sectionFilter, setSectionFilter] = useState<ExamSection | "All">("All");
  const [lessonFilter, setLessonFilter] = useState<string>("All");

  const examList = cls?.examList ?? [];
  const lessons = cls?.lessonList ?? [];

  const filtered = useMemo(() => {
    return examList.filter((exam) => {
      const matchSearch =
        exam.title.toLowerCase().includes(search.toLowerCase()) ||
        exam.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || exam.status === statusFilter;
      const matchSection = sectionFilter === "All" || exam.sections.includes(sectionFilter);
      const matchLesson = lessonFilter === "All" || exam.lessonId === lessonFilter;
      return matchSearch && matchStatus && matchSection && matchLesson;
    });
  }, [examList, search, statusFilter, sectionFilter, lessonFilter]);

  const totalExams = examList.length;
  const scheduledCount = examList.filter((e) => e.status === "Scheduled").length;
  const openCount = examList.filter((e) => e.status === "Open").length;
  const closedCount = examList.filter((e) => e.status === "Closed" || e.status === "Graded").length;
  const avgScore =
    examList.length > 0 && examList.some((e) => e.averageScore !== null)
      ? Math.round(
          examList.reduce((s, e) => s + (e.averageScore ?? 0), 0) /
            examList.filter((e) => e.averageScore !== null).length
        )
      : 0;

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
        title="Class Exams"
        subtitle={`${cls.name} · Create and manage exams assigned to this class.`}
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
              to={`/teacher/exams/create?classId=${classId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Exam for This Class
            </Link>
          </div>
        }
      />

      {/* Create exam CTA notice */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
          <Plus className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Create Exam for This Class
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Exams created here will be assigned to this class and follow its level ({cls.level}). Must link to a lesson.
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
            Exam questions and Data Bank content should follow this level.
          </p>
        </div>
      </div>

      {/* ── C. Overview Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { label: "Total Exams", value: totalExams,       icon: <ClipboardCheck className="w-4 h-4" />,   accent: "primary" as const },
          { label: "Scheduled",  value: scheduledCount,    icon: <Calendar className="w-4 h-4" />,        accent: "sky" as const },
          { label: "Open",       value: openCount,         icon: <Clock className="w-4 h-4" />,           accent: "sakura" as const },
          { label: "Closed/Graded", value: closedCount,    icon: <CheckCircle2 className="w-4 h-4" />,   accent: "red" as const },
          { label: "Avg Score",  value: avgScore ? `${avgScore}/10` : "—", icon: <Gauge className="w-4 h-4" />, accent: "primary" as const },
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
            placeholder="Search by exam title…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {(["All", "Draft", "Scheduled", "Open", "Closed", "Graded"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as ExamStatus | "All")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  statusFilter === s
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Section filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSectionFilter("All")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                sectionFilter === "All"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
              )}
            >
              All Sections
            </button>
            {EXAM_SECTIONS.map((sec) => (
              <button
                key={sec}
                onClick={() => setSectionFilter(sec)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  sectionFilter === sec
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
                )}
              >
                {sec}
              </button>
            ))}
          </div>
          {/* Lesson filter */}
          {lessons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setLessonFilter("All")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  lessonFilter === "All"
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
                )}
              >
                All Lessons
              </button>
              {lessons.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLessonFilter(l.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all max-w-[200px] truncate",
                    lessonFilter === l.id
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
                  )}
                >
                  {l.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── E. Exam List ──────────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((exam, idx) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              {/* Top: title + badges */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-display font-bold text-sm truncate">{exam.title}</h3>
                    <LevelBadge level={exam.level} />
                    <ExamStatusBadge status={exam.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-col mb-1.5">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {exam.lessonTitle}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {exam.durationMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {exam.startTime} → {exam.endTime}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{exam.description}</p>
                </div>
              </div>

              {/* Section chips */}
              <div className="mb-4">
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-2">Exam Sections</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAM_SECTIONS.map((sec) => {
                    const cfg = SECTION_CONFIG[sec];
                    const Icon = cfg.icon;
                    const has = exam.sections.includes(sec);
                    return (
                      <span
                        key={sec}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-transparent transition",
                          has ? cfg.color + " border-current/10" : "text-muted-col bg-muted/40"
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {sec}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[
                  { label: "Submitted", value: `${exam.submittedCount}/${exam.totalStudents}`, accent: "primary" },
                  { label: "Avg Score", value: exam.averageScore !== null ? `${exam.averageScore.toFixed(1)}/10` : "—", accent: "sakura" },
                  { label: "Attempts",  value: `${exam.attemptLimit}`, accent: "sky" },
                  { label: "Status",    value: exam.status, accent: "primary" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className={cn(
                      "rounded-xl px-3 py-2 border border-transparent",
                      m.accent === "primary" ? "bg-primary/5" :
                      m.accent === "sakura"  ? "bg-sakura/10" :
                                              "bg-sky-blue/5"
                    )}
                  >
                    <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{m.label}</div>
                    <div className="text-xs font-bold text-foreground">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Exam notice */}
              <div className="bg-primary/5 border border-primary/10 rounded-xl px-3 py-2 mb-4 flex items-start gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-foreground/80">
                  Exam is for formal assessment. Limited time and attempt limit. Score contributes to class progress.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/30">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
                >
                  View Results
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
                >
                  Edit
                </button>
                {exam.status === "Scheduled" && (
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-[var(--status-active)]/10 text-[var(--status-active)] border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition"
                  >
                    Open
                  </button>
                )}
                {exam.status === "Open" && (
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-[var(--status-pending)]/10 text-[var(--status-pending)] border border-[var(--status-pending)]/20 hover:bg-[var(--status-pending)]/20 transition"
                  >
                    Close
                  </button>
                )}
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-col transition"
                  title="Archive"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No exams found"
          hint="Create an exam for this class to get started."
          action={
            <Link
              to={`/teacher/exams/create?classId=${classId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition mt-4"
            >
              <Plus className="w-4 h-4" />
              Create Exam for This Class
            </Link>
          }
        />
      )}

      {/* ── H. Rules / Info Card ──────────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          Exam Rules
        </h2>
        <ul className="space-y-2">
          {[
            "Exams belong to a class and follow its JLPT level.",
            "Exams can include Vocabulary, Grammar, Listening and Mixed sections.",
            "Student only sees exams after joining the class.",
            "Teacher creates and assigns exams; Student completes them within the time limit.",
            "Exam score contributes to class progress — unlike homework, exams are formal assessments.",
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

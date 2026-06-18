import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, BookOpenCheck, Plus, Search, Shield, CheckCircle2,
  Clock, FileText, ListChecks, Mic, Headphones, GraduationCap, ChevronRight, ExternalLink
} from "lucide-react";
import { PageHeader, Card, LevelBadge, EmptyState, Progress } from "@/components/page-ui";
import { MOCK_CLASSES, type Lesson } from "@/data/teacher-classes";
import { cn } from "@/lib/utils";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const SKILLS = ["Vocabulary", "Grammar", "Listening", "Shadowing"] as const;
type Skill = typeof SKILLS[number];
type LessonStatus = Lesson["status"];

const SKILL_CONFIG: Record<Skill, { icon: typeof FileText; label: string; color: string }> = {
  Vocabulary: { icon: ListChecks,    label: "Vocab",     color: "text-[var(--status-student)] bg-[var(--status-student)]/10" },
  Grammar:    { icon: GraduationCap, label: "Grammar",   color: "text-[var(--status-teacher)] bg-[var(--status-teacher)]/10" },
  Listening:  { icon: Headphones,   label: "Listening", color: "text-[var(--status-announcement)] bg-[var(--status-announcement)]/10" },
  Shadowing:  { icon: Mic,          label: "Shadowing", color: "text-[var(--jp-red)] bg-[var(--jp-red)]/10" },
};

const STATUS_CONFIG: Record<LessonStatus, { label: string; dot: string; text: string }> = {
  Published: { label: "Published", dot: "bg-[var(--status-active)]",   text: "text-[var(--status-active)]" },
  Draft:     { label: "Draft",     dot: "bg-[var(--status-pending)]",  text: "text-[var(--status-pending)]" },
  Archived:  { label: "Archived",  dot: "bg-gray-400",               text: "text-gray-400" },
};

function LessonStatusBadge({ status }: { status: LessonStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function SkillChips({ skills }: { skills: Skill[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SKILLS.map((sk) => {
        const cfg = SKILL_CONFIG[sk];
        const has = skills.includes(sk);
        const Icon = cfg.icon;
        return (
          <span
            key={sk}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-transparent transition",
              has ? cfg.color + " border-current/10" : "text-muted-col bg-muted/40"
            )}
          >
            <Icon className="w-3 h-3" />
            {cfg.label}
            {has && (
              <span className="ml-0.5 opacity-70">
                {sk === "Vocabulary" ? "" : ""}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export const Route = createFileRoute("/teacher/classes/$classId/lessons")({
  component: TeacherClassLessonsPage,
});

function TeacherClassLessonsPage() {
  const { classId } = Route.useParams();
  const cls = MOCK_CLASSES.find((c) => c.id === classId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LessonStatus | "All">("All");
  const [skillFilter, setSkillFilter] = useState<Skill | "All">("All");

  const lessons = cls?.lessonList ?? [];

  const filtered = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchSearch =
        lesson.title.toLowerCase().includes(search.toLowerCase()) ||
        lesson.topic.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || lesson.status === statusFilter;
      const matchSkill = skillFilter === "All" || lesson.skills.includes(skillFilter);
      return matchSearch && matchStatus && matchSkill;
    });
  }, [lessons, search, statusFilter, skillFilter]);

  const totalLessons = lessons.length;
  const publishedCount = lessons.filter((l) => l.status === "Published").length;
  const draftCount = lessons.filter((l) => l.status === "Draft").length;
  const avgCompletion = totalLessons > 0
    ? Math.round(lessons.reduce((s, l) => s + l.averageCompletion, 0) / totalLessons)
    : 0;
  const totalActivities = lessons.reduce(
    (s, l) => s + l.vocabularyCount + l.grammarCount + l.listeningCount + l.shadowingCount,
    0
  );

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

  return (
    <div className="space-y-5">
      {/* ── A. Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Class Lessons"
        subtitle={`${cls.name} · Manage lessons that belong to this class and follow the class level.`}
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
              to={`/teacher/lessons/create?classId=${classId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Lesson for This Class
            </Link>
          </div>
        }
      />

      {/* Create lesson CTA notice */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
          <Plus className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Create Lesson for This Class
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lessons created here will use this class level ({cls.level}). Content will be scoped to {cls.name}.
          </p>
        </div>
      </div>

      {/* Level badge + description */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm flex flex-wrap items-center gap-3">
        <LevelBadge level={cls.level} />
        <p className="text-sm text-muted-foreground">
          {cls.description}
        </p>
      </div>

      {/* ── B. Class Level Notice ─────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            This class level is {cls.level}.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            New lessons and Data Bank content should follow this level.
          </p>
        </div>
      </div>

      {/* ── C. Overview Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { label: "Total Lessons", value: totalLessons,   icon: <BookOpenCheck className="w-4 h-4" />,     accent: "primary" as const },
          { label: "Published",    value: publishedCount,  icon: <CheckCircle2 className="w-4 h-4" />,     accent: "sakura" as const },
          { label: "Draft",        value: draftCount,       icon: <Clock className="w-4 h-4" />,            accent: "sky" as const },
          { label: "Avg Complete", value: `${avgCompletion}%`, icon: <TrendingUp className="w-4 h-4" />,  accent: "primary" as const },
          { label: "Activities",   value: totalActivities,  icon: <ListChecks className="w-4 h-4" />,       accent: "primary" as const },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-lg grid place-items-center ${
                stat.accent === "primary" ? "bg-primary/15 text-primary" :
                stat.accent === "sakura"  ? "bg-sakura/40 text-jp-red" :
                "bg-sky-blue/20 text-sky-blue"
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
            placeholder="Search by lesson title or topic…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {(["All", "Draft", "Published", "Archived"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as LessonStatus | "All")}
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
          {/* Skill filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSkillFilter("All")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                skillFilter === "All"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
              )}
            >
              All Skills
            </button>
            {SKILLS.map((sk) => (
              <button
                key={sk}
                onClick={() => setSkillFilter(sk)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  skillFilter === sk
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
                )}
              >
                {sk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── E. Lesson List ────────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((lesson, idx) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              {/* Top row */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-display font-bold text-sm truncate">{lesson.title}</h3>
                    <LevelBadge level={lesson.level} />
                    <LessonStatusBadge status={lesson.status} />
                  </div>
                  <p className="text-xs text-muted-col mb-2">{lesson.topic}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
                </div>
              </div>

              {/* Skill structure breakdown */}
              <div className="mb-4">
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-2">Lesson Structure</p>
                <SkillChips skills={lesson.skills} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {[
                    { label: "Vocabulary",  count: lesson.vocabularyCount,  sub: "Word List · Flashcard · Quiz", icon: <ListChecks className="w-3.5 h-3.5" /> },
                    { label: "Grammar",     count: lesson.grammarCount,     sub: "Structures",                   icon: <GraduationCap className="w-3.5 h-3.5" /> },
                    { label: "Listening",   count: lesson.listeningCount,   sub: "Listen & Answer · Dictation",  icon: <Headphones className="w-3.5 h-3.5" /> },
                    { label: "Shadowing",   count: lesson.shadowingCount,   sub: "Practice script / audio",      icon: <Mic className="w-3.5 h-3.5" /> },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border border-transparent text-xs",
                        lesson.skills.includes(item.label as Skill)
                          ? "bg-muted/30"
                          : "bg-muted/10 opacity-50"
                      )}
                    >
                      <span className="text-muted-col">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-foreground">{item.count}</span>
                          <span className="text-muted-col text-[10px]">{item.label}</span>
                        </div>
                        <span className="text-[10px] text-muted-col truncate block">{item.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              {lesson.averageCompletion > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-col font-semibold uppercase tracking-wider">Completion</span>
                    <span className="text-[10px] font-bold text-foreground">{lesson.averageCompletion}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${lesson.averageCompletion}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.04 + 0.1 }}
                      className="h-full bg-gradient-hero rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Footer row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/30">
                <span className="text-[10px] text-muted-col">
                  Last updated: {lesson.lastUpdated}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-primary/40 transition"
                  >
                    Edit
                  </button>
                  {lesson.status === "Draft" && (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-[var(--status-active)]/10 text-[var(--status-active)] border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition"
                    >
                      Publish
                    </button>
                  )}
                  <Link
                    to={`${basePath}/lessons/${lesson.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition"
                  >
                    Manage
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-col transition"
                    title="Archive"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No lessons found"
          hint="Create a lesson for this class level to get started."
          action={
            <Link
              to={`/teacher/lessons/create?classId=${classId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition mt-4"
            >
              <Plus className="w-4 h-4" />
              Create Lesson for This Class
            </Link>
          }
        />
      )}

      {/* ── H. Rules / Info Card ──────────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          Lesson Rules
        </h2>
        <ul className="space-y-2">
          {[
            "Lessons belong to a class and follow its JLPT level automatically.",
            "Vocabulary includes Word List, Flashcard and Quiz sub-features.",
            "Grammar is lesson-based structure content — no separate grammar management needed.",
            "Listening covers listen-and-answer and dictation exercises.",
            "Shadowing provides practice script and audio for pronunciation.",
            "Homework and Exam are managed separately — they can be linked to lessons later.",
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

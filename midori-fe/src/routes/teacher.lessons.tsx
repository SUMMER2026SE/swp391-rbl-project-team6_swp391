import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search, BookOpen, ChevronRight, Plus, TrendingUp
} from "lucide-react";
import { PageHeader, Card, LevelBadge, EmptyState } from "@/components/page-ui";
import { MOCK_CLASSES, type Lesson } from "@/data/teacher-classes";

const LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"] as const;
const STATUSES = ["All", "Draft", "Published", "Archived"] as const;

const allLessons: (Lesson & { className: string; classId: string })[] = MOCK_CLASSES.flatMap(cls =>
  cls.lessonList.map(lesson => ({
    ...lesson,
    className: cls.name,
    classId: cls.id,
  }))
);

function SkillBadge({ skill }: { skill: string }) {
  const colors: Record<string, string> = {
    Vocabulary: "bg-blue-50 text-blue-600 dark:bg-blue-950/30",
    Grammar: "bg-purple-50 text-purple-600 dark:bg-purple-950/30",
    Listening: "bg-orange-50 text-orange-600 dark:bg-orange-950/30",
    Shadowing: "bg-green-50 text-green-600 dark:bg-green-950/30",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors[skill] || "bg-muted text-muted-foreground"}`}>
      {skill}
    </span>
  );
}

export const Route = createFileRoute("/teacher/lessons")({
  component: TeacherLessonsPage,
});

function TeacherLessonsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const classes = useMemo(() => ["All", ...MOCK_CLASSES.map(c => c.name)], []);
  const levels = LEVELS;
  const statuses = STATUSES;

  const lessonStats = useMemo(() => {
    return {
      total: allLessons.length,
      published: allLessons.filter(l => l.status === "Published").length,
      avgCompletion: allLessons.length > 0
        ? Math.round(allLessons.reduce((sum, l) => sum + l.averageCompletion, 0) / allLessons.length)
        : 0,
    };
  }, []);

  const filtered = useMemo(() => {
    return allLessons.filter(lesson => {
      const matchSearch = lesson.title.toLowerCase().includes(search.toLowerCase()) ||
        lesson.topic.toLowerCase().includes(search.toLowerCase());
      const matchClass = classFilter === "All" || lesson.className === classFilter;
      const matchLevel = levelFilter === "All" || lesson.level === levelFilter;
      const matchStatus = statusFilter === "All" || lesson.status === statusFilter;
      return matchSearch && matchClass && matchLevel && matchStatus;
    });
  }, [search, classFilter, levelFilter, statusFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lessons"
        subtitle="Manage lessons across your classes."
        action={
          <Link
            to="/teacher/lessons/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Lesson
          </Link>
        }
      />

      {/* Global overview notice */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Global Overview — All Classes
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This page shows lessons across all classes you teach. Each lesson is still assigned to a specific class and follows that class level.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <Card className="p-3.5 text-center">
          <div className="font-display font-black text-lg">{lessonStats.total}</div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Total Lessons</div>
        </Card>
        <Card className="p-3.5 text-center">
          <div className="font-display font-black text-lg">{lessonStats.published}</div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Published</div>
        </Card>
        <Card className="p-3.5 text-center">
          <div className="font-display font-black text-lg">{lessonStats.avgCompletion}%</div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Avg Completion</div>
        </Card>
        <Card className="p-3.5 text-center">
          <div className="font-display font-black text-lg">{MOCK_CLASSES.length}</div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Classes</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-col pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lessons..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {classes.map((cls) => (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  classFilter === cls
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40"
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {levels.map((lv) => (
            <button
              key={lv}
              onClick={() => setLevelFilter(lv)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                levelFilter === lv
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40"
              }`}
            >
              {lv}
            </button>
          ))}
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* Lesson list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[var(--primary)]/20 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display font-bold text-sm truncate">{lesson.title}</h3>
                    <LevelBadge level={lesson.level} />
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lesson.status === "Published"
                        ? "bg-green-50 text-green-600 dark:bg-green-950/30"
                        : lesson.status === "Draft"
                        ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-700"
                    }`}>
                      {lesson.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{lesson.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-col flex-wrap">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {lesson.className}
                    </span>
                    <span>·</span>
                    <span>Topic: {lesson.topic}</span>
                    <span>·</span>
                    <span>Updated: {lesson.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {lesson.skills.map(skill => (
                      <SkillBadge key={skill} skill={skill} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right mr-2">
                    <div className="text-xs font-bold">{lesson.averageCompletion}%</div>
                    <div className="text-[10px] text-muted-col">completion</div>
                  </div>
                  <Link
                    to={`/teacher/classes/${lesson.classId}/lessons`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)] transition"
                  >
                    View Class Lessons
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No lessons found"
          hint="Adjust your filters or create a new lesson."
        />
      )}
    </div>
  );
}

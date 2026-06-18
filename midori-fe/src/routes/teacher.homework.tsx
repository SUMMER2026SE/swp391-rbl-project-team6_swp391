import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search, ClipboardList, GraduationCap, Filter, ChevronRight, BookOpen, TrendingUp
} from "lucide-react";
import { PageHeader, Card, LevelBadge, EmptyState } from "@/components/page-ui";
import { MOCK_CLASSES, type Homework } from "@/data/teacher-classes";

const LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"] as const;
const STATUSES = ["All", "Draft", "Open", "Closed", "Graded"] as const;
const TYPES = ["All", "Vocabulary", "Grammar", "Listening", "Mixed"] as const;

const allHomework: (Homework & { className: string; classId: string })[] = MOCK_CLASSES.flatMap(cls =>
  cls.homeworkList.map(hw => ({
    ...hw,
    className: cls.name,
    classId: cls.id,
  }))
);

export const Route = createFileRoute("/teacher/homework")({
  component: TeacherHomeworkPage,
});

function TeacherHomeworkPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const classes = useMemo(() => ["All", ...MOCK_CLASSES.map(c => c.name)], []);

  const homeworkStats = useMemo(() => {
    const withScores = allHomework.filter(h => h.averageScore !== null);
    const avgScore = withScores.length > 0
      ? Math.round(withScores.reduce((sum, h) => sum + (h.averageScore || 0), 0) / withScores.length)
      : 0;
    return {
      total: allHomework.length,
      open: allHomework.filter(h => h.status === "Open").length,
      missing: allHomework.reduce((sum, h) => sum + h.missingCount, 0),
      avgScore,
    };
  }, []);

  const filtered = useMemo(() => {
    return allHomework.filter(hw => {
      const matchSearch = hw.title.toLowerCase().includes(search.toLowerCase()) ||
        hw.lessonTitle.toLowerCase().includes(search.toLowerCase());
      const matchClass = classFilter === "All" || hw.className === classFilter;
      const matchLevel = levelFilter === "All" || hw.level === levelFilter;
      const matchStatus = statusFilter === "All" || hw.status === statusFilter;
      const matchType = typeFilter === "All" || hw.type === typeFilter;
      return matchSearch && matchClass && matchLevel && matchStatus && matchType;
    });
  }, [search, classFilter, levelFilter, statusFilter, typeFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Homework"
        subtitle="Track homework assigned across your classes."
        action={
          <Link
            to="/teacher/homework/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            Create Homework
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
            This page tracks homework across all classes you teach. New homework must be assigned to a class and a related lesson.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <Card className="p-3.5 text-center">
          <div className="font-display font-black text-lg">{homeworkStats.total}</div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Total Homework</div>
        </Card>
        <Card className="p-3.5 text-center">
          <div className="font-display font-black text-lg">{homeworkStats.open}</div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Open</div>
        </Card>
        <Card className="p-3.5 text-center">
          <div className="font-display font-black text-lg">{homeworkStats.missing}</div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Missing</div>
        </Card>
        <Card className="p-3.5 text-center">
          <div className="font-display font-black text-lg">{homeworkStats.avgScore}</div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Avg Score</div>
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
              placeholder="Search homework..."
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
                    : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((lv) => (
            <button
              key={lv}
              onClick={() => setLevelFilter(lv)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                levelFilter === lv
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
              }`}
            >
              {lv}
            </button>
          ))}
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
              }`}
            >
              {s}
            </button>
          ))}
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                typeFilter === t
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* Homework list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((hw) => (
            <div
              key={hw.id}
              className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display font-bold text-sm truncate">{hw.title}</h3>
                    <LevelBadge level={hw.level} />
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      hw.status === "Open"
                        ? "bg-green-50 text-green-600 dark:bg-green-950/30"
                        : hw.status === "Graded"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30"
                        : hw.status === "Draft"
                        ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-700"
                    }`}>
                      {hw.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-muted-foreground">
                      {hw.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{hw.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-col flex-wrap">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {hw.className}
                    </span>
                    <span>·</span>
                    <span>Lesson: {hw.lessonTitle}</span>
                    <span>·</span>
                    <span>Deadline: {hw.deadline}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-col">
                    <span>Submitted: {hw.submittedCount}/{hw.totalStudents}</span>
                    {hw.missingCount > 0 && (
                      <span className="text-[var(--jp-red)]">Missing: {hw.missingCount}</span>
                    )}
                    {hw.lateSubmissions > 0 && (
                      <span className="text-yellow-600">Late: {hw.lateSubmissions}</span>
                    )}
                    {hw.averageScore !== null && (
                      <span>Avg: {hw.averageScore}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/teacher/classes/${hw.classId}/homework`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40 hover:text-primary transition"
                  >
                    View Class Homework
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No homework found"
          hint="Adjust your filters or create a new homework."
        />
      )}
    </div>
  );
}

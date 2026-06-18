import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Plus, Search, School, Users, BookOpenCheck, TrendingUp,
  ChevronRight, Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, StatCard, LevelBadge, EmptyState } from "@/components/page-ui";
import { MOCK_CLASSES, type TeacherClass } from "@/data/teacher-classes";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
const STATUSES = ["All", "Draft", "Active", "Archived"] as const;

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

function ClassCard({ cls, index }: { cls: TeacherClass; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
    >
      {/* Top row: name + badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-display font-bold text-sm truncate">{cls.name}</h3>
            <LevelBadge level={cls.level} />
            <StatusBadge status={cls.status} />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{cls.description}</p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5 text-primary/60" />
          <span className="font-semibold text-foreground">{cls.students}</span>
          <span>students</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpenCheck className="w-3.5 h-3.5 text-primary/60" />
          <span className="font-semibold text-foreground">{cls.lessons}</span>
          <span>lessons</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5 text-primary/60" />
          <span className="font-semibold text-foreground">{cls.averageProgress}%</span>
        </div>
        {cls.schedule && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-primary/60" />
            <span>{cls.schedule}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {cls.averageProgress > 0 && (
        <div className="mb-4">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cls.averageProgress}%` }}
              transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
              className="h-full bg-gradient-hero rounded-full"
            />
          </div>
        </div>
      )}

      {/* Action */}
      <Link
        to={`/teacher/classes/${cls.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        View Detail
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </motion.div>
  );
}

export const Route = createFileRoute("/teacher/classes")({
  component: TeacherClassesPage,
});

function TeacherClassesPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    return MOCK_CLASSES.filter((cls) => {
      const matchSearch = cls.name.toLowerCase().includes(search.toLowerCase());
      const matchLevel = levelFilter === "All" || cls.level === levelFilter;
      const matchStatus = statusFilter === "All" || cls.status === statusFilter;
      return matchSearch && matchLevel && matchStatus;
    });
  }, [search, levelFilter, statusFilter]);

  const totalClasses = MOCK_CLASSES.length;
  const activeClasses = MOCK_CLASSES.filter((c) => c.status === "Active").length;
  const totalStudents = MOCK_CLASSES.reduce((sum, c) => sum + c.students, 0);
  const avgProgress = totalClasses > 0
    ? Math.round(MOCK_CLASSES.reduce((sum, c) => sum + c.averageProgress, 0) / totalClasses)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="My Classes"
        subtitle="Manage the classes you are teaching."
        action={
          <Link
            to="/teacher/classes/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create New Class
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <StatCard label="Total Classes" value={totalClasses} icon={<School className="w-5 h-5" />} accent="primary" />
        <StatCard label="Active Classes" value={activeClasses} icon={<TrendingUp className="w-5 h-5" />} accent="sakura" />
        <StatCard label="Total Students" value={totalStudents} icon={<Users className="w-5 h-5" />} accent="sky" />
        <StatCard label="Avg Progress" value={`${avgProgress}%`} icon={<BookOpenCheck className="w-5 h-5" />} accent="primary" />
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-col pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by class name…"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm"
            />
          </div>

          {/* Level filter */}
          <div className="flex flex-wrap gap-1.5">
            {["All", ...LEVELS].map((lv) => (
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
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
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
          </div>
        </div>
      </div>

      {/* Class list */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cls, i) => (
            <ClassCard key={cls.id} cls={cls} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No classes found"
          hint="Adjust your filters or create a new class."
        />
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search, TrendingUp, Users, AlertTriangle, ChevronRight, School
} from "lucide-react";
import { PageHeader, Card, LevelBadge, EmptyState } from "@/components/page-ui";
import { MOCK_CLASSES } from "@/data/teacher-classes";

type WarningLevel = "none" | "warning" | "danger";

function getWarningLevel(warnings: string[]): WarningLevel {
  if (warnings.some(w => w.toLowerCase().includes("inactive") || w.toLowerCase().includes("missing"))) {
    return "danger";
  }
  if (warnings.length > 0) return "warning";
  return "none";
}

export const Route = createFileRoute("/teacher/progress")({
  component: TeacherProgressPage,
});

function TeacherProgressPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [warningFilter, setWarningFilter] = useState("All");

  const classes = useMemo(() => ["All", ...MOCK_CLASSES.map(c => c.name)], []);
  const levels = ["All", "N5", "N4", "N3", "N2", "N1"] as const;

  const studentRows = useMemo(() => {
    const rows: {
      id: string;
      name: string;
      className: string;
      classId: string;
      level: string;
      overallProgress: number;
      averageScore: number | null;
      warnings: string[];
      lastActive: string;
      warningLevel: WarningLevel;
    }[] = [];

    MOCK_CLASSES.forEach(cls => {
      cls.invitations.forEach(inv => {
        if (inv.status !== "Active") return;
        const pd = inv.progressDetails;
        if (!pd) return;
        rows.push({
          id: inv.id,
          name: inv.name,
          className: cls.name,
          classId: cls.id,
          level: cls.level,
          overallProgress: pd.overallProgress,
          averageScore: pd.averageScore,
          warnings: pd.warnings,
          lastActive: pd.lastActive,
          warningLevel: getWarningLevel(pd.warnings),
        });
      });
    });

    return rows;
  }, []);

  const filtered = useMemo(() => {
    return studentRows.filter(row => {
      const matchSearch = row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.className.toLowerCase().includes(search.toLowerCase());
      const matchClass = classFilter === "All" || row.className === classFilter;
      const matchLevel = levelFilter === "All" || row.level === levelFilter;
      const matchWarning = warningFilter === "All" ||
        (warningFilter === "Warning" && row.warningLevel === "warning") ||
        (warningFilter === "At-Risk" && row.warningLevel === "danger") ||
        (warningFilter === "Good" && row.warningLevel === "none");
      return matchSearch && matchClass && matchLevel && matchWarning;
    });
  }, [studentRows, search, classFilter, levelFilter, warningFilter]);

  const progressStats = useMemo(() => {
    const total = studentRows.length;
    const withScores = studentRows.filter(r => r.averageScore !== null);
    const avgScore = withScores.length > 0
      ? Math.round(withScores.reduce((sum, r) => sum + (r.averageScore || 0), 0) / withScores.length)
      : 0;
    return {
      totalStudents: total,
      atRisk: studentRows.filter(r => r.warningLevel === "danger").length,
      avgProgress: total > 0
        ? Math.round(studentRows.reduce((sum, r) => sum + r.overallProgress, 0) / total)
        : 0,
      avgScore,
    };
  }, [studentRows]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Progress"
        subtitle="Monitor student progress across your classes."
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
            This page summarizes student progress across all classes you teach. Open a class to review class-specific progress.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <Card className="p-3.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <School className="w-4 h-4 text-primary/60" />
            <div className="font-display font-black text-lg">{MOCK_CLASSES.length}</div>
          </div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Classes</div>
        </Card>
        <Card className="p-3.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4 text-primary/60" />
            <div className="font-display font-black text-lg">{progressStats.totalStudents}</div>
          </div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Active Students</div>
        </Card>
        <Card className="p-3.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary/60" />
            <div className="font-display font-black text-lg">{progressStats.avgProgress}%</div>
          </div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Average Progress</div>
        </Card>
        <Card className="p-3.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--jp-red)]" />
            <div className="font-display font-black text-lg">{progressStats.atRisk}</div>
          </div>
          <div className="text-[10px] text-muted-col uppercase tracking-wider font-bold">At-Risk Students</div>
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
              placeholder="Search student or class..."
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
          {levels.map((lv) => (
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
          {["All", "Good", "Warning", "At-Risk"].map((w) => (
            <button
              key={w}
              onClick={() => setWarningFilter(w)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                warningFilter === w
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/10 hover:border-primary/40"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </Card>

      {/* Student list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((row) => (
            <div
              key={row.id}
              className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display font-bold text-sm">{row.name}</h3>
                    <LevelBadge level={row.level} />
                    {row.warningLevel === "danger" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--jp-red)]/10 text-[var(--jp-red)] border border-[var(--jp-red)]/20">
                        At-Risk
                      </span>
                    )}
                    {row.warningLevel === "warning" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30">
                        Warning
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-col flex-wrap">
                    <span className="flex items-center gap-1">
                      <School className="w-3 h-3" />
                      {row.className}
                    </span>
                    <span>·</span>
                    <span>Progress: {row.overallProgress}%</span>
                    <span>·</span>
                    <span>Avg Score: {row.averageScore ?? "N/A"}</span>
                    <span>·</span>
                    <span>Last active: {row.lastActive}</span>
                  </div>
                  {row.warnings.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {row.warnings.map(w => (
                        <span key={w} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right mr-2">
                    <div className="text-xs font-bold">{row.overallProgress}%</div>
                    <div className="text-[10px] text-muted-col">progress</div>
                  </div>
                  <Link
                    to={`/teacher/classes/${row.classId}/progress`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-[var(--primary)]/40 hover:text-primary transition"
                  >
                    View Class Progress
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No students found"
          hint="Adjust your filters or invite students to your classes."
        />
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, StatCard, LevelBadge, Progress } from "@/components/page-ui";
import {
  Flame,
  ClipboardList,
  FileText,
  Clock,
  Loader2,
  BookOpen,
  Brain,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { studentProgressApi } from "@/lib/api/studentProgress";
import { classesApi } from "@/lib/api/classes";
import { homeworkApi } from "@/lib/api/homework";
import { useAuth } from "@/lib/auth";
import type { HomeworkResponse } from "@/lib/api/homework";
import type { GrammarLevel } from "@/lib/api/types";
import type { JLPTLevel } from "@/data/teacher-data";

export const Route = createFileRoute("/student/dashboard")({ component: StudentHome });

const JLPT_LEVELS: readonly JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

function isJlptLevel(value: unknown): value is JLPTLevel {
  return typeof value === "string" && (JLPT_LEVELS as readonly string[]).includes(value);
}

function toJlptLevel(value: unknown): JLPTLevel | null {
  return isJlptLevel(value) ? value : null;
}

function StudentHome() {
  const { user } = useAuth();

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["progress-stats", user?.id ?? "anon"],
    queryFn: () => studentProgressApi.getProgressStats(),
    staleTime: 0,
  });

  const {
    data: dbClasses = [],
    isLoading: isLoadingClasses,
    error: classesError,
  } = useQuery({
    queryKey: ["studentJoinedClassesDashboard"],
    queryFn: () => classesApi.getJoinedClasses(),
  });

  const {
    data: dbHomeworks = [],
    isLoading: isLoadingHomeworks,
    error: homeworksError,
  } = useQuery({
    queryKey: ["studentHomeworksDashboard"],
    queryFn: () => homeworkApi.getStudentHomeworks(),
  });

  const isLoading = isLoadingStats || isLoadingClasses || isLoadingHomeworks;
  const error = statsError || classesError || homeworksError;
  const errorMessage = "Failed to load dashboard data.";

  const streak = stats?.learningStreak ?? 0;
  const currentLevel = pickCurrentLevel(dbClasses);

  // Assignment Summary — counts derived from the classes the student actually joined.
  // `homeworkCount` and `upcomingExamCount` are server-computed fields on ClassResponse.
  const totalHomeworkCount = dbClasses.reduce((sum, c) => sum + (c.homeworkCount || 0), 0);
  const totalExamCount = dbClasses.reduce((sum, c) => sum + (c.upcomingExamCount || 0), 0);

  // Upcoming Deadlines — real homework items assigned to this student with future dueDate.
  const upcomingDeadlines = pickUpcomingDeadlines(dbHomeworks);

  // Learning Progress — all values come from ProgressStatsResponse fields already
  // exposed by the backend (vocabularyCompleted, grammarCompleted, learnedWords, etc.).
  const vocabPercent = clampPercent(stats?.vocabularyCompleted ?? null);
  const grammarPercent = clampPercent(stats?.grammarCompleted ?? null);
  const vocabLearnedCount = stats?.vocabularyLearned ?? stats?.learnedWords ?? 0;
  const vocabMasteredCount = stats?.vocabularyMastered ?? stats?.masteredWords ?? 0;
  const grammarLearnedCount = stats?.grammarLearned ?? 0;
  const grammarCompletedCount = stats?.grammarCompleted ?? 0;
  const completedLessonsCount = stats?.completedLessons ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        subtitle="Manage your learning modules, class homework, and keep your daily streak alive!"
      />

      {/* Row 1: Welcome Banner (full width) */}
      <Card className="bg-gradient-hero p-6 text-white border-none relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase opacity-70 tracking-widest font-semibold text-white/80">
              Welcome back
            </span>
            <h2 className="font-display font-black text-2xl mt-1 text-white">
              Xin chào {user?.name ?? "Student"}
            </h2>
            <p className="text-sm opacity-90 mt-2">
              Here's what needs your attention today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold opacity-90">Current Level:</span>
            {isLoadingClasses ? (
              <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-bold border border-white/20">
                …
              </span>
            ) : currentLevel ? (
              <LevelBadge level={currentLevel} />
            ) : (
              <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-bold border border-white/20">
                Not enrolled
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Row 2: Daily Streak + Assignment Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Daily Streak"
          value={isLoadingStats ? "…" : `${streak} days`}
          hint="Don't break the streak!"
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          accent="sakura"
        />
        <StatCard
          label="Homework Assignments"
          value={isLoadingClasses ? "…" : totalHomeworkCount.toLocaleString()}
          hint="Open assignments across all classes"
          icon={<ClipboardList className="w-5 h-5 text-blue-500" />}
          accent="sky"
        />
        <StatCard
          label="Upcoming Exams"
          value={isLoadingClasses ? "…" : totalExamCount.toLocaleString()}
          hint="Scheduled by your teachers"
          icon={<FileText className="w-5 h-5 text-emerald-500" />}
          accent="primary"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="text-center py-8 px-4">
          <p className="text-red-500 mb-2 font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Row 3: Upcoming Deadlines + Learning Progress */}
      {!isLoading && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5 h-full">
            <h3 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No upcoming deadlines.
                </div>
              ) : (
                upcomingDeadlines.map((dl) => (
                  <div
                    key={dl.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {dl.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Due {dl.dueDateLabel}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300">
                      {dl.daysLeft}d left
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <div className="md:col-span-2">
            <Card className="p-5 h-full">
              <h3 className="font-display font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Learning Progress
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <ProgressTile
                  name="Vocabulary"
                  percent={isLoadingStats ? null : vocabPercent}
                  count={`${vocabLearnedCount} learned · ${vocabMasteredCount} mastered`}
                  icon={<BookOpen className="w-4 h-4 text-primary" />}
                />
                <ProgressTile
                  name="Grammar"
                  percent={isLoadingStats ? null : grammarPercent}
                  count={`${grammarLearnedCount} learned · ${grammarCompletedCount} completed`}
                  icon={<Brain className="w-4 h-4 text-primary" />}
                />
                <ProgressTile
                  name="Completed Lessons"
                  percent={isLoadingStats ? null : clampPercent(completedLessonsCount > 0 ? 100 : 0)}
                  count={`${completedLessonsCount} lessons finished`}
                  icon={<ClipboardList className="w-4 h-4 text-primary" />}
                />
                <ProgressTile
                  name="Daily Streak"
                  percent={isLoadingStats ? null : clampPercent(streak * 5)}
                  count={`${streak}-day streak`}
                  icon={<Flame className="w-4 h-4 text-orange-400" />}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProgressTileProps {
  name: string;
  percent: number | null;
  count: string;
  icon: React.ReactNode;
}

function ProgressTile({ name, percent, count, icon }: ProgressTileProps) {
  return (
    <div className="p-4 rounded-xl border border-border/50 bg-card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm text-foreground flex items-center gap-2">
          {icon}
          {name}
        </span>
        <span className="text-xs font-bold text-primary">
          {percent === null ? "…" : `${percent}%`}
        </span>
      </div>
      <div className="mb-2">
        <Progress value={percent ?? 0} />
      </div>
      <div className="text-[11px] text-muted-foreground">{count}</div>
    </div>
  );
}

interface JoinedClassLite {
  level?: string | GrammarLevel | null;
  status?: string | null;
}

function pickCurrentLevel(classes: JoinedClassLite[]): JLPTLevel | null {
  const active = classes.filter((c) => (c.status ?? "").toUpperCase() === "ACTIVE");
  for (const c of active) {
    const lvl = toJlptLevel(c.level);
    if (lvl) return lvl;
  }
  for (const c of classes) {
    const lvl = toJlptLevel(c.level);
    if (lvl) return lvl;
  }
  return null;
}

function clampPercent(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

interface DeadlineItem {
  id: string;
  title: string;
  dueDateLabel: string;
  daysLeft: number;
}

function pickUpcomingDeadlines(homeworks: HomeworkResponse[]): DeadlineItem[] {
  const now = Date.now();
  return homeworks
    .filter((h) => (h.status ?? "").toUpperCase() === "ASSIGNED")
    .map((h) => {
      const due = new Date(h.dueDate);
      const dueMs = due.getTime();
      const daysLeft = Number.isFinite(dueMs)
        ? Math.max(0, Math.ceil((dueMs - now) / (24 * 60 * 60 * 1000)))
        : 0;
      return {
        id: h.id,
        title: h.title,
        dueDateLabel: Number.isFinite(dueMs) ? due.toISOString().split("T")[0] : "—",
        daysLeft,
      };
    })
    .filter((d) => d.daysLeft > 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6);
}
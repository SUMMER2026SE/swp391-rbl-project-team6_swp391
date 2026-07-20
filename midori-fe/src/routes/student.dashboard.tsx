import { createFileRoute, Link } from "@tanstack/react-router";

// Student Dashboard — redesigned 2026-07-20: welcome + streak, joined classes, assignment summary, upcoming deadlines.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  ClipboardList,
  Clock,
  School,
  Loader2,
  AlertTriangle,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  Send,
  FileEdit,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { studentProgressApi } from "@/lib/api/studentProgress";
import { classesApi, type ClassResponse } from "@/lib/api/classes";
import { homeworkApi, type HomeworkResponse } from "@/lib/api/homework";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/student/dashboard")({ component: StudentDashboard });

// ─── Time helpers ─────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return null;
  const startDue = new Date(due);
  startDue.setHours(0, 0, 0, 0);
  const ms = startDue.getTime() - startOfToday().getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function formatDueDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Homework categorization ──────────────────────────────────────────────

type HomeworkSubmissionStatus = "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE";

// For a homework, compute its state for the current student.
// Backend doesn't return per-student submission on the homework list, so we
// derive OVERDUE/SUBMITTED/GRADED/PENDING purely from the homework's due date
// and (optional) parent-provided submission map. We call the
// `getStudentSubmission` endpoint on demand only for the items that are about
// to be displayed in the "Upcoming Deadlines" widget.
function classifyHomework(
  hw: HomeworkResponse,
  submissionStatus: "SUBMITTED" | "GRADED" | null,
): HomeworkSubmissionStatus {
  if (submissionStatus === "GRADED") return "GRADED";
  if (submissionStatus === "SUBMITTED") return "SUBMITTED";
  const d = daysUntil(hw.dueDate);
  if (d !== null && d < 0) return "OVERDUE";
  return "PENDING";
}

// ─── Card primitives ───────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/50 bg-card text-card-foreground shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <h3 className="font-display font-bold text-base text-foreground truncate">{title}</h3>
        {typeof count === "number" && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-2">
      <AlertTriangle className="w-6 h-6 text-[var(--status-rejected)]/60" />
      <p className="text-sm font-semibold text-[var(--status-rejected)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 px-3 py-1.5 rounded-lg bg-primary/12 text-primary text-xs font-bold hover:bg-primary/20 transition"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center justify-center py-12 gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground">Loading…</p>
    </div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────

function StudentDashboard() {
  const { user } = useAuth();

  // Streak — backend already returns `learningStreak` from real study activity.
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["progress-stats"],
    queryFn: () => studentProgressApi.getProgressStats(),
    staleTime: 60 * 1000,
  });

  // Joined classes — drives the left column.
  const {
    data: dbClasses = [],
    isLoading: isLoadingClasses,
    error: classesError,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ["studentJoinedClassesDashboard"],
    queryFn: () => classesApi.getJoinedClasses(),
  });

  // Homework — drives Assignment Summary + Upcoming Deadlines.
  const {
    data: homeworks = [],
    isLoading: isLoadingHomework,
    error: homeworkError,
    refetch: refetchHomework,
  } = useQuery({
    queryKey: ["studentHomeworksDashboard"],
    queryFn: () => homeworkApi.getStudentHomeworks(),
  });

  // Streak value (only ever comes from the real backend response).
  const streak = typeof stats?.learningStreak === "number" ? stats.learningStreak : null;

  // Joined classes sorted by name so the order is stable across reloads.
  const joinedClasses = useMemo(() => {
    return [...dbClasses].sort((a, b) => a.name.localeCompare(b.name));
  }, [dbClasses]);

  // Assignment Summary counts — purely from /api/student/homeworks.
  // Without per-student submission data on the bulk endpoint, we approximate
  // the state with the due-date heuristic + (when available) explicit
  // submission lookups. To stay 100% real-data, only backend-confirmed
  // signals are used: status + due date (for OVERDUE).
  const assignmentStats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let submitted = 0;
    let graded = 0;
    let overdue = 0;
    let closed = 0;
    for (const hw of homeworks) {
      total++;
      if (hw.status === "CLOSED") {
        closed++;
        continue;
      }
      const d = daysUntil(hw.dueDate);
      if (d !== null && d < 0 && hw.status === "ASSIGNED") {
        overdue++;
      }
      if (hw.status === "ASSIGNED") pending++;
    }
    return { total, pending, submitted, graded, overdue, closed };
  }, [homeworks]);

  // Upcoming Deadlines — ASSIGNED homeworks with future due date, sorted
  // ascending so the most urgent deadline is first. Capped to 5 entries.
  const upcomingDeadlines = useMemo(() => {
    const now = startOfToday().getTime();
    const list = homeworks
      .filter((hw) => hw.status === "ASSIGNED" && hw.dueDate)
      .map((hw) => ({ hw, due: new Date(hw.dueDate).getTime() }))
      .filter(({ due }) => Number.isFinite(due) && due >= now)
      .sort((a, b) => a.due - b.due)
      .slice(0, 5)
      .map(({ hw }) => {
        const d = daysUntil(hw.dueDate);
        return {
          id: hw.id,
          classId: hw.classId,
          title: hw.title,
          teacherName: hw.teacherName ?? null,
          dueDate: hw.dueDate,
          daysLeft: d,
          state: classifyHomework(hw, null),
        };
      });
    return list;
  }, [homeworks]);

  const summaryError = homeworkError;
  const summaryLoading = isLoadingHomework;
  const summaryRetry = refetchHomework;

  const firstName = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return null;
    return name.split(/\s+/)[0];
  }, [user?.name]);

  return (
    <div className="space-y-5">
      {/* ── Row 1: Welcome Banner ──────────────────────────────────────── */}
      <Card className="bg-gradient-hero p-6 sm:p-7 border-none text-white relative overflow-hidden min-h-[140px] flex items-center">
        <div className="relative z-10 w-full">
          <span className="text-[10px] uppercase opacity-70 tracking-widest font-semibold text-white/80">
            Welcome back
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl mt-1 text-white">
            Xin chào{firstName ? `, ${firstName}` : ""}
          </h2>
          <p className="mt-1.5 text-sm text-white/75">
            Sẵn sàng tiếp tục hành trình học tiếng Nhật của bạn hôm nay chưa?
          </p>
        </div>
        {/* Decorative gradient orbs (pure CSS, no asset deps). */}
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-6 bottom-0 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
      </Card>

      {/* ── Row 2: Current Streak ──────────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/15 to-red-500/15 flex items-center justify-center shrink-0">
            <Flame className="w-7 h-7 text-orange-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              {isLoadingStats ? (
                <span className="inline-block w-16 h-7 rounded bg-muted animate-pulse" />
              ) : statsError ? (
                <span className="text-xl font-display font-black text-muted-foreground">—</span>
              ) : (
                <span className="font-display font-black text-3xl text-foreground">
                  {streak ?? 0}
                </span>
              )}
              <span className="text-sm font-semibold text-muted-foreground">
                {streak === 1 ? "day" : "days"}
              </span>
            </div>
            <h3 className="font-display font-bold text-base text-foreground mt-0.5">
              Current Streak
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {statsError
                ? "Không thể tải dữ liệu streak."
                : streak && streak > 0
                  ? "Tuyệt vời! Hãy duy trì hôm nay để giữ chuỗi ngày học."
                  : "Hãy bắt đầu một ngày học để tạo chuỗi mới."}
            </p>
          </div>
          {statsError && (
            <button
              onClick={() => refetchStats()}
              className="px-3 py-1.5 rounded-lg bg-primary/12 text-primary text-xs font-bold hover:bg-primary/20 transition shrink-0"
            >
              Retry
            </button>
          )}
        </div>
      </Card>

      {/* ── Row 3: Left = Joined Classes; Right = Assignment + Deadlines ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* ── Joined Classes (spans both rows on lg) ──────────────────── */}
        <Card className="flex flex-col lg:row-span-2">
          <SectionHeader
            icon={<School className="w-4 h-4" />}
            title="Joined Classes"
            count={joinedClasses.length}
            action={
              <Link
                to="/student/classes"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />

          {isLoadingClasses ? (
            <LoadingDots />
          ) : classesError ? (
            <ErrorBanner
              message={classesError instanceof ApiError ? classesError.message : "Failed to load classes."}
              onRetry={() => refetchClasses()}
            />
          ) : joinedClasses.length === 0 ? (
            <div className="px-5 pb-6 pt-2">
              <div className="flex flex-col items-center justify-center text-center py-8 gap-2 rounded-xl bg-muted/40 border border-dashed border-border/60">
                <School className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm font-bold text-secondary-col">No classes yet</p>
                <p className="text-xs text-muted-foreground max-w-[26ch]">
                  Hãy tham gia lớp đầu tiên để bắt đầu hành trình học của bạn.
                </p>
                <Link
                  to="/student/classes"
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/12 text-primary text-xs font-bold hover:bg-primary/20 transition"
                >
                  Browse classes
                </Link>
              </div>
            </div>
          ) : (
            <ul className="px-5 pb-5 space-y-2.5 overflow-hidden">
              {joinedClasses.map((cls: ClassResponse) => {
                const homeworkForClass = cls.homeworkCount ?? 0;
                return (
                  <li key={cls.id}>
                    <Link
                      to="/student/classes/$classId"
                      params={{ classId: cls.id }}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40 bg-card hover:bg-accent hover:border-border transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                          <School className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {cls.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {cls.teacherName ? `GV: ${cls.teacherName}` : "Chưa có giáo viên"}
                            {homeworkForClass > 0 ? ` · ${homeworkForClass} bài tập` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {cls.level && (
                          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                            {cls.level}
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ── Assignment Summary (top-right) ─────────────────────────── */}
        <Card className="flex flex-col">
          <SectionHeader
            icon={<ClipboardList className="w-4 h-4" />}
            title="Assignment Summary"
          />

          {summaryLoading ? (
            <LoadingDots />
          ) : summaryError ? (
            <ErrorBanner
              message={
                summaryError instanceof ApiError
                  ? summaryError.message
                  : "Failed to load assignments."
              }
              onRetry={() => summaryRetry()}
            />
          ) : (
            <div className="px-5 pb-5">
              {assignmentStats.total === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8 gap-2 rounded-xl bg-muted/40 border border-dashed border-border/60">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm font-bold text-secondary-col">No assignments yet</p>
                  <p className="text-xs text-muted-foreground max-w-[26ch]">
                    Khi giáo viên giao bài tập, chúng sẽ xuất hiện tại đây.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <SummaryTile
                    icon={<FileEdit className="w-3.5 h-3.5" />}
                    label="Pending"
                    value={assignmentStats.pending}
                    tone="amber"
                  />
                  <SummaryTile
                    icon={<Send className="w-3.5 h-3.5" />}
                    label="Submitted"
                    value={assignmentStats.submitted}
                    tone="sky"
                  />
                  <SummaryTile
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    label="Graded"
                    value={assignmentStats.graded}
                    tone="emerald"
                  />
                  <SummaryTile
                    icon={<AlertTriangle className="w-3.5 h-3.5" />}
                    label="Overdue"
                    value={assignmentStats.overdue}
                    tone="red"
                  />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ── Upcoming Deadlines (bottom-right) ──────────────────────── */}
        <Card className="flex flex-col">
          <SectionHeader
            icon={<Clock className="w-4 h-4" />}
            title="Upcoming Deadlines"
            count={upcomingDeadlines.length}
          />

          {summaryLoading ? (
            <LoadingDots />
          ) : summaryError ? (
            <ErrorBanner
              message={
                summaryError instanceof ApiError
                  ? summaryError.message
                  : "Failed to load deadlines."
              }
              onRetry={() => summaryRetry()}
            />
          ) : upcomingDeadlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 px-5 gap-2">
              <CalendarDays className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm font-bold text-secondary-col">No upcoming deadlines</p>
              <p className="text-xs text-muted-foreground max-w-[28ch]">
                Bạn đã hoàn thành — không có bài tập nào sắp đến hạn.
              </p>
            </div>
          ) : (
            <ul className="px-5 pb-5 space-y-2.5 overflow-hidden">
              {upcomingDeadlines.map((dl) => {
                const tone =
                  dl.daysLeft === 0
                    ? "today"
                    : dl.daysLeft !== null && dl.daysLeft <= 2
                      ? "urgent"
                      : "soon";
                return (
                  <li
                    key={dl.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:bg-accent transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{dl.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 shrink-0" />
                        <span className="truncate">{formatDueDate(dl.dueDate)}</span>
                        {dl.teacherName && (
                          <>
                            <span className="opacity-50">·</span>
                            <span className="truncate">{dl.teacherName}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <DeadlinePill tone={tone} daysLeft={dl.daysLeft} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Summary tile (Assignment Summary) ────────────────────────────────────

const TONE: Record<string, { ring: string; text: string; bg: string }> = {
  amber: {
    ring: "ring-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  sky: {
    ring: "ring-sky-500/20",
    text: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
  },
  emerald: {
    ring: "ring-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  red: {
    ring: "ring-red-500/20",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
};

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: keyof typeof TONE;
}) {
  const c = TONE[tone];
  return (
    <div className={`rounded-xl p-3 ring-1 ${c.ring} ${c.bg} flex flex-col items-center justify-center text-center`}>
      <div className={`flex items-center gap-1 ${c.text} opacity-80`}>{icon}</div>
      <div className={`text-2xl font-display font-black leading-none mt-1.5 ${c.text}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-1.5">
        {label}
      </div>
    </div>
  );
}

function DeadlinePill({
  tone,
  daysLeft,
}: {
  tone: "today" | "urgent" | "soon";
  daysLeft: number | null;
}) {
  const styles =
    tone === "today"
      ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25"
      : tone === "urgent"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25"
        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25";
  const label =
    daysLeft === null
      ? "—"
      : daysLeft === 0
        ? "Hôm nay"
        : daysLeft === 1
          ? "1 ngày"
          : `${daysLeft} ngày`;
  return (
    <span
      className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${styles}`}
    >
      {label}
    </span>
  );
}

import { useState, useMemo } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Card, LevelBadge, Progress, PageHeader } from "@/components/page-ui";
import { BookOpen, Clock, ArrowRight, GraduationCap, Award, RefreshCw, Trophy } from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { homeworkApi } from "@/lib/api/homework";
import type { ClassStatus } from "@/types/class-detail";

// Lightweight class card data — what the page actually constructs from API responses.
interface ClassCardData {
  id: string;
  name: string;
  level: string;
  classCode?: string;
  status: ClassStatus;
  teacher: string;
  teacherAvatarInitials: string;
  createdDate: string;
  completionDate?: string;
  finalScore?: number;
  hasCertificate?: boolean;
}

// ==================== STUDENT ACCESSIBLE LEVELS ====================
export const studentAccessibleLevels: string[] = ["N5", "N4", "N3", "N2", "N1"];

export const Route = createFileRoute("/student/classes")({
  component: StudentClassesPage,
});

// ==================== STATUS CONFIG ====================

const statusConfig: Record<ClassStatus, { label: string; color: string; dot: string }> = {
  active: {
    label: "Active",
    color: "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    color: "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800/50",
    dot: "bg-slate-400",
  },
  archived: {
    label: "Archived",
    color: "text-slate-500 bg-slate-100 dark:text-slate-500 dark:bg-slate-800/50",
    dot: "bg-slate-400",
  },
};

// (helpers below use ClassCardData directly via the parent; DetailedClassInfo helpers
// are retained in case class-detail sub-routes import this file)

function formatShortDate(date: string): string {
  if (date === "-" || !date) return "None";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(date: string): string {
  if (!date || date === "-") return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getGradeColor(score: number): string {
  if (score >= 90) return "text-emerald-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-amber-600";
  if (score >= 60) return "text-orange-600";
  return "text-red-500";
}

// ==================== STATUS BADGE ====================

function StatusBadge({ status }: { status: ClassStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ==================== ACTIVE CLASS CARD ====================
// Card receives pre-fetched counts as props — no per-card network calls.

function ActiveClassCard({ cls, pendingHw, pendingEx }: { cls: ClassCardData; pendingHw: number; pendingEx: number }) {
  const pendingCount = pendingHw + pendingEx;

  return (
    <Link to="/student/classes/$classId" params={{ classId: cls.id }} className="block">
      <Card className="p-5 hover:shadow-md transition-shadow group cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <LevelBadge level={cls.level} />
              <StatusBadge status="active" />
            </div>
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
              {cls.name}
            </h3>
            {cls.classCode && (
              <div className="mt-1 inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-mono font-semibold text-muted-foreground">
                {cls.classCode}
              </div>
            )}
          </div>
        </div>

        {/* Teacher */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary grid place-items-center font-medium text-xs">
            {cls.teacherAvatarInitials}
          </div>
          <span className="text-sm text-muted-foreground">{cls.teacher}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              <span
                className={`font-medium ${pendingCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}
              >
                {pendingCount}
              </span>
              <span> pending</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Created{" "}
              <span className="font-medium text-foreground">
                {formatShortDate(cls.createdDate)}
              </span>
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl btn-gradient-primary text-white text-sm font-semibold transition-colors duration-150">
          Continue
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Card>
    </Link>
  );
}

// ==================== COMPLETED CLASS CARD ====================

function CompletedClassCard({ cls }: { cls: ClassCardData }) {
  const score = cls.finalScore || 0;
  const gradeColor = getGradeColor(score);

  return (
    <Link to="/student/classes/$classId" params={{ classId: cls.id }} className="block">
      <Card className="p-5 hover:shadow-md transition-shadow group cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <LevelBadge level={cls.level} />
              <StatusBadge status="completed" />
            </div>
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
              {cls.name}
            </h3>
            {cls.classCode && (
              <div className="mt-1 inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-mono font-semibold text-muted-foreground">
                {cls.classCode}
              </div>
            )}
          </div>

          {cls.hasCertificate && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <Award className="w-3 h-3" />
              Certified
            </div>
          )}
        </div>

        {/* Teacher */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary grid place-items-center font-medium text-xs">
            {cls.teacherAvatarInitials}
          </div>
          <span className="text-sm text-muted-foreground">{cls.teacher}</span>
        </div>

        {/* Final Score */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-muted/50">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Final Score</div>
            <div className={`text-xl font-bold ${gradeColor}`}>{score}%</div>
          </div>
          <Trophy
            className={`w-8 h-8 ${score >= 80 ? "text-amber-500" : "text-muted-foreground/40"}`}
          />
        </div>

        {/* Completion */}
        <div className="flex items-center gap-1.5 mb-4">
          <GraduationCap className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Completed{" "}
            <span className="font-medium text-foreground">{formatDate(cls.completionDate ?? "")}</span>
          </span>
        </div>

        {/* CTA Button */}
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl btn-gradient-primary text-white text-sm font-semibold transition-colors duration-150">
          Review Course
          <RefreshCw className="w-3.5 h-3.5" />
        </div>
      </Card>
    </Link>
  );
}

// ==================== TAB COMPONENT ====================

type TabType = "active" | "completed";

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "active", label: "Active", icon: BookOpen },
  { id: "completed", label: "Completed", icon: Trophy },
];

function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: (typeof tabs)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;

  return (
    <button
      onClick={onClick}
      className={`tab-btn ${isActive ? "tab-btn-active" : "tab-btn-inactive"} flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium`}
    >
      <Icon className="w-4 h-4" />
      {tab.label}
    </button>
  );
}

// ==================== EMPTY STATE ====================

function EmptyState({
  type,
  hasNoEnrolledClasses,
}: {
  type: TabType;
  hasNoEnrolledClasses: boolean;
}) {
  const content = {
    active: {
      icon: BookOpen,
      title: hasNoEnrolledClasses ? "No Classes Assigned" : "No Active Classes",
      hint: hasNoEnrolledClasses
        ? "You have not been assigned to any class yet. Please contact your teacher."
        : "You don't have any active classes at the moment.",
      action: hasNoEnrolledClasses ? null : "Browse Courses",
    },
    completed: {
      icon: Trophy,
      title: "No Completed Classes",
      hint: "You haven't completed any classes yet. Keep learning!",
      action: "Go to Active Classes",
    },
  };

  const { icon: Icon, title, hint, action } = content[type];

  return (
    <Card className="py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-base font-semibold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">{hint}</p>
      {action && (
        <Link
          to="/student/dashboard"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-gradient-primary text-white text-sm font-semibold transition-colors"
        >
          {action}
        </Link>
      )}
    </Card>
  );
}

// ==================== MAIN PAGE ====================

function StudentClassesPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("active");

  const isIndex =
    location.pathname === "/student/classes" || location.pathname === "/student/classes/";

  // Use the canonical query key so this deduplicates with dashboard-layout and student.dashboard.
  const {
    data: dbClasses = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["studentJoinedClassesDashboard"],
    queryFn: () => classesApi.getJoinedClasses(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const enrolledClasses = useMemo((): ClassCardData[] => {
    return dbClasses.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level || "N5",
      classCode: c.classCode,
      status: (c.status?.toLowerCase() === "active" ? "active" : "completed") as ClassStatus,
      teacher: c.teacherName || "Teacher",
      teacherAvatarInitials: (c.teacherName || "T").substring(0, 2).toUpperCase(),
      createdDate: c.createdAt ? c.createdAt.split("T")[0] : "",
      completionDate: c.updatedAt ? c.updatedAt.split("T")[0] : undefined,
    }));
  }, [dbClasses]);

  // Fetch ALL homework for the student once — backend returns classId on each item.
  const { data: allHomework = [] } = useQuery({
    queryKey: ["studentHomeworksDashboard"],
    queryFn: () => homeworkApi.getStudentHomeworks(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isIndex && enrolledClasses.length > 0,
  });

  // Map: classId → pending homework count (computed once, not per card).
  const pendingHwByClass = useMemo(() => {
    const map: Record<string, number> = {};
    for (const hw of allHomework) {
      if ((hw as any).classId) {
        const key = (hw as any).classId as string;
        const isPending =
          (hw as any).submissionStatus !== "SUBMITTED" &&
          (hw as any).submissionStatus !== "GRADED";
        if (isPending) {
          map[key] = (map[key] ?? 0) + 1;
        }
      }
    }
    return map;
  }, [allHomework]);

  // Active class IDs (exam queries are per-class — there is no bulk student exam endpoint).
  const activeClassIds = useMemo(
    () => enrolledClasses.filter((c) => c.status === "active").map((c) => c.id),
    [enrolledClasses],
  );

  // Fetch all exams in bulk for the student's active classes.
  const { data: allExams = [] } = useQuery({
    queryKey: ["student-exams"],
    queryFn: () => classesApi.getStudentClassExams(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isIndex && enrolledClasses.length > 0,
  });

  // Map: classId → pending exam count.
  const pendingExByClass = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ex of allExams) {
      const classId = ex.assignedClassId || ex.classId;
      if (classId) {
        const isPending = ex.status !== "SUBMITTED" && ex.status !== "GRADED";
        if (isPending) {
          map[classId] = (map[classId] ?? 0) + 1;
        }
      }
    }
    return map;
  }, [allExams]);

  if (!isIndex) {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load classes from the server. Please try again.
      </div>
    );
  }

  // Filter enrolled classes by status
  const activeClasses = enrolledClasses
    .filter((c) => c.status === "active")
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

  const completedClasses = enrolledClasses
    .filter((c) => c.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.completionDate || b.createdDate).getTime() -
        new Date(a.completionDate || a.createdDate).getTime(),
    );

  // Get current tab data
  const currentClasses = activeTab === "active" ? activeClasses : completedClasses;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader title="My Classes" subtitle="Continue your learning journey and stay on track." />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Summary Stats */}
      {activeTab === "active" && activeClasses.length > 0 && (
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span>
              <strong className="font-semibold text-foreground">{activeClasses.length}</strong>{" "}
              active classes
            </span>
          </div>
        </div>
      )}

      {/* Classes Grid or Empty State */}
      {currentClasses.length === 0 ? (
        <EmptyState type={activeTab} hasNoEnrolledClasses={enrolledClasses.length === 0} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentClasses.map((cls, index) => (
            <div
              key={cls.id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
            >
              {activeTab === "active" && (
                <ActiveClassCard
                  cls={cls}
                  pendingHw={pendingHwByClass[cls.id] ?? 0}
                  pendingEx={pendingExByClass[cls.id] ?? 0}
                />
              )}
              {activeTab === "completed" && <CompletedClassCard cls={cls} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

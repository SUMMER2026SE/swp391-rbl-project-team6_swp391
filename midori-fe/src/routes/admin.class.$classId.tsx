import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  GraduationCap,
  Users,
  Calendar,
  ClipboardCheck,
  Loader2,
  TrendingUp,
  Clock,
  FileText,
  Settings as SettingsIcon,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  UserCheck,
  BookOpen,
  Award,
  Inbox,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi, type AdminClassResponse, type AdminClassStudentResponse } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { HomeworkResponse } from "@/lib/api/homework";
import type { ExamResponse } from "@/lib/api/exams";

type TabValue = "students" | "assignments" | "progress" | "settings";

function JLPTBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    N5: "bg-[oklch(0.62_0.18_270)]/12 text-[oklch(0.62_0.18_270)] border-[oklch(0.62_0.18_270)]/20",
    N4: "bg-[oklch(0.72_0.15_230)]/12 text-[oklch(0.72_0.15_230)] border-[oklch(0.72_0.15_230)]/20",
    N3: "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border-[var(--status-pending)]/20",
    N2: "bg-[oklch(0.6_0.22_25)]/12 text-[oklch(0.6_0.22_25)] border-[oklch(0.6_0.22_25)]/20",
    N1: "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border-[var(--status-rejected)]/20",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[level] || colors["N5"]}`}
    >
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: {
      label: "Active",
      color: "text-[var(--status-active)]",
      bg: "bg-[var(--status-active)]",
    },
    ARCHIVED: {
      label: "Archived",
      color: "text-[var(--status-suspended)]",
      bg: "bg-[var(--status-suspended)]",
    },
  };
  const cfg = configs[status] || configs["ACTIVE"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {cfg.label}
    </span>
  );
}

function HomeworkStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: {
      label: "Draft",
      color: "text-muted-col",
      bg: "bg-muted-col",
    },
    ASSIGNED: {
      label: "Assigned",
      color: "text-[var(--status-active)]",
      bg: "bg-[var(--status-active)]",
    },
    CLOSED: {
      label: "Closed",
      color: "text-[var(--status-suspended)]",
      bg: "bg-[var(--status-suspended)]",
    },
  };
  const cfg = configs[status] || configs["DRAFT"];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base p-10 flex flex-col items-center gap-3 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
        <Icon className="w-6 h-6 text-muted-col" />
      </div>
      <p className="text-sm font-bold text-primary-col">{title}</p>
      <p className="text-xs text-muted-col max-w-md">{description}</p>
    </motion.div>
  );
}

// Loading State Component
function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-xs text-muted-col">{message}</p>
    </div>
  );
}

// Error State Component
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="py-16 flex flex-col items-center gap-3">
      <AlertTriangle className="w-10 h-10 text-[var(--status-rejected)]/50" />
      <p className="text-sm font-bold text-[var(--status-rejected)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/12 text-primary text-xs font-bold hover:bg-primary/20 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

// Student Avatar Component
function StudentAvatar({
  name,
  avatar,
  size = "md",
}: {
  name: string | null;
  avatar: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-12 h-12 text-sm",
  };

  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name || "Student"}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold`}
    >
      {initials}
    </div>
  );
}

export const Route = createFileRoute("/admin/class/$classId")({
  component: ClassWorkspacePage,
});

function ClassWorkspacePage() {
  const { classId } = Route.useParams();
  const [activeTab, setActiveTab] = useState<TabValue>("students");

  // Class data state
  const [classData, setClassData] = useState<AdminClassResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Students data state
  const [students, setStudents] = useState<AdminClassStudentResponse[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  // Homework data state
  const [homeworks, setHomeworks] = useState<HomeworkResponse[]>([]);
  const [homeworksLoading, setHomeworksLoading] = useState(false);
  const [homeworksError, setHomeworksError] = useState<string | null>(null);

  // Exams data state
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examsError, setExamsError] = useState<string | null>(null);

  // Fetch class data
  const fetchClassData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAdminClassById(classId);
      setClassData(data);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load class.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  // Fetch students data
  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const data = await adminApi.getClassStudents(classId);
      setStudents(data);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load students.";
      setStudentsError(msg);
    } finally {
      setStudentsLoading(false);
    }
  }, [classId]);

  // Fetch homework data
  const fetchHomeworks = useCallback(async () => {
    setHomeworksLoading(true);
    setHomeworksError(null);
    try {
      const data = await adminApi.getClassHomeworks(classId);
      setHomeworks(data);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load homework.";
      setHomeworksError(msg);
    } finally {
      setHomeworksLoading(false);
    }
  }, [classId]);

  // Fetch exams data
  const fetchExams = useCallback(async () => {
    setExamsLoading(true);
    setExamsError(null);
    try {
      const data = await adminApi.getClassExams(classId);
      setExams(data);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load exams.";
      setExamsError(msg);
    } finally {
      setExamsLoading(false);
    }
  }, [classId]);

  // Initial load
  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (activeTab === "students" && students.length === 0 && !studentsLoading) {
      fetchStudents();
    } else if (activeTab === "assignments" && homeworks.length === 0 && !homeworksLoading) {
      fetchHomeworks();
      fetchExams();
    }
  }, [activeTab, fetchStudents, fetchHomeworks, fetchExams, students.length, homeworks.length, studentsLoading, homeworksLoading]);

  // Filter students by search
  const filteredStudents = students.filter((student) => {
    if (!studentSearch.trim()) return true;
    const searchLower = studentSearch.toLowerCase();
    return (
      (student.fullName?.toLowerCase().includes(searchLower) ?? false) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingState message="Loading class details..." />
      </div>
    );
  }

  // Error state
  if (error || !classData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-[var(--status-rejected)]/50" />
        <p className="text-primary-col font-bold">{error || "Class not found"}</p>
        <button
          onClick={fetchClassData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/class-management"
            className="p-2 rounded-xl bg-slate-100 text-secondary-col hover:text-primary-col hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary-col">{classData.name}</h1>
              <JLPTBadge level={classData.level} />
              <StatusBadge status={classData.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-secondary-col">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                {classData.teacher || "Unassigned"}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {classData.students} / {classData.maxStudents} students
              </span>
              {classData.classCode && (
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  Code: {classData.classCode}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
        <TabsList className="bg-card border border-border p-1 flex gap-1 w-full justify-start overflow-x-auto">
          {[
            { value: "students", label: "Students", icon: Users },
            { value: "assignments", label: "Assignments", icon: ClipboardCheck },
            { value: "progress", label: "Progress", icon: TrendingUp },
            { value: "settings", label: "Settings", icon: SettingsIcon },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === tab.value
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-primary hover:bg-accent"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-5 space-y-5">
          {/* Search and Stats */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-col" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl search-input text-sm"
              />
            </div>
            <div className="text-sm text-secondary-col">
              {filteredStudents.length} of {students.length} students
            </div>
          </div>

          {/* Loading State */}
          {studentsLoading && <LoadingState message="Loading students..." />}

          {/* Error State */}
          {studentsError && !studentsLoading && (
            <ErrorState message={studentsError} onRetry={fetchStudents} />
          )}

          {/* Empty State */}
          {!studentsLoading && !studentsError && students.length === 0 && (
            <EmptyState
              icon={Users}
              title="No students enrolled"
              description="This class doesn't have any enrolled students yet. Students will appear here once they join."
            />
          )}

          {/* Students List */}
          {!studentsLoading && !studentsError && students.length > 0 && (
            <>
              {filteredStudents.length === 0 && studentSearch && (
                <EmptyState
                  icon={Search}
                  title="No students found"
                  description={`No students match "${studentSearch}". Try a different search term.`}
                />
              )}

              {filteredStudents.length > 0 && (
                <div className="card-base overflow-hidden">
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
                      <div className="col-span-4">Student</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Progress</div>
                      <div className="col-span-2">Homework</div>
                      <div className="col-span-2">Last Active</div>
                    </div>

                    {/* Table Rows */}
                    <AnimatePresence>
                      {filteredStudents.map((student, index) => (
                        <motion.div
                          key={student.studentId}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="grid grid-cols-12 gap-3 px-5 py-4 border-b border-[var(--border)] hover:bg-accent transition items-center"
                        >
                          {/* Student Info */}
                          <div className="col-span-4 flex items-center gap-3">
                            <StudentAvatar
                              name={student.fullName}
                              avatar={student.avatar}
                              size="md"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {student.fullName || "Unnamed Student"}
                              </p>
                              <p className="text-xs text-muted-col truncate">{student.email}</p>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="col-span-2 flex items-center">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                                student.status === "ACTIVE"
                                  ? "bg-[var(--status-active)]/12 text-[var(--status-active)]"
                                  : "bg-muted text-muted-col"
                              }`}
                            >
                              <UserCheck className="w-3 h-3" />
                              {student.status === "ACTIVE" ? "Active" : student.status}
                            </span>
                          </div>

                          {/* Progress */}
                          <div className="col-span-2">
                            {student.progressPercent !== undefined ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${student.progressPercent}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-muted-col w-10 text-right">
                                  {student.progressPercent}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-col">—</span>
                            )}
                          </div>

                          {/* Homework */}
                          <div className="col-span-2 text-xs">
                            {student.submittedHomework !== undefined && student.totalHomework !== undefined ? (
                              <span className="text-secondary-col">
                                <span className="font-medium">{student.submittedHomework}</span>
                                <span className="text-muted-col">/{student.totalHomework}</span>
                              </span>
                            ) : (
                              <span className="text-muted-col">—</span>
                            )}
                          </div>

                          {/* Last Active */}
                          <div className="col-span-2 text-xs text-muted-col">
                            {student.lastActivityAt ? (
                              <span title={formatDateTime(student.lastActivityAt)}>
                                {formatRelativeTime(student.lastActivityAt)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-5 space-y-5">
          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-col mb-1 flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5" /> Homework
              </p>
              <p className="text-2xl font-bold text-foreground">
                {homeworks.length}
                <span className="text-base text-muted-col ml-1">total</span>
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-col mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Exams
              </p>
              <p className="text-2xl font-bold text-foreground">
                {exams.length}
                <span className="text-base text-muted-col ml-1">total</span>
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-col mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Assigned
              </p>
              <p className="text-2xl font-bold text-foreground">
                {homeworks.filter((h) => h.status === "ASSIGNED").length}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-col mb-1 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Closed
              </p>
              <p className="text-2xl font-bold text-foreground">
                {homeworks.filter((h) => h.status === "CLOSED").length}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {(homeworksLoading || examsLoading) && <LoadingState message="Loading assignments..." />}

          {/* Error State */}
          {(homeworksError || examsError) && !homeworksLoading && !examsLoading && (
            <ErrorState
              message={homeworksError || examsError || "Failed to load assignments"}
              onRetry={() => {
                fetchHomeworks();
                fetchExams();
              }}
            />
          )}

          {/* Empty State */}
          {!homeworksLoading && !examsLoading && !homeworksError && !examsError && homeworks.length === 0 && exams.length === 0 && (
            <EmptyState
              icon={ClipboardCheck}
              title="No assignments yet"
              description="This class doesn't have any homework or exams assigned. Assignments will appear here once the teacher creates them."
            />
          )}

          {/* Homework List */}
          {!homeworksLoading && !homeworksError && homeworks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" /> Homework ({homeworks.length})
              </h3>
              <div className="card-base overflow-hidden">
                <div className="overflow-x-auto">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
                    <div className="col-span-4">Title</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Due Date</div>
                    <div className="col-span-2">Submissions</div>
                    <div className="col-span-2">Max Score</div>
                  </div>

                  {/* Table Rows */}
                  <AnimatePresence>
                    {homeworks.map((homework, index) => (
                      <motion.div
                        key={homework.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="grid grid-cols-12 gap-3 px-5 py-4 border-b border-[var(--border)] hover:bg-accent transition items-center"
                      >
                        {/* Title */}
                        <div className="col-span-4 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {homework.title}
                          </p>
                          {homework.teacherName && (
                            <p className="text-xs text-muted-col truncate">
                              by {homework.teacherName}
                            </p>
                          )}
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <HomeworkStatusBadge status={homework.status} />
                        </div>

                        {/* Due Date */}
                        <div className="col-span-2 text-xs">
                          {homework.dueDate ? (
                            <span
                              className={
                                new Date(homework.dueDate) < new Date()
                                  ? "text-[var(--status-rejected)]"
                                  : "text-secondary-col"
                              }
                              title={formatDateTime(homework.dueDate)}
                            >
                              {formatDate(homework.dueDate)}
                            </span>
                          ) : (
                            <span className="text-muted-col">—</span>
                          )}
                        </div>

                        {/* Submissions */}
                        <div className="col-span-2 text-xs">
                          {homework.submissionCount !== undefined ? (
                            <span className="text-secondary-col">
                              <span className="font-medium">{homework.submissionCount}</span>
                              <span className="text-muted-col">
                                /{classData.students}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-col">—</span>
                          )}
                        </div>

                        {/* Max Score */}
                        <div className="col-span-2 text-xs">
                          <span className="text-secondary-col">{homework.maxScore}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {/* Exams List */}
          {!examsLoading && !examsError && exams.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4" /> Exams ({exams.length})
              </h3>
              <div className="card-base overflow-hidden">
                <div className="overflow-x-auto">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
                    <div className="col-span-5">Title</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Questions</div>
                    <div className="col-span-3">Time Limit</div>
                  </div>

                  {/* Table Rows */}
                  <AnimatePresence>
                    {exams.map((exam, index) => (
                      <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="grid grid-cols-12 gap-3 px-5 py-4 border-b border-[var(--border)] hover:bg-accent transition items-center"
                      >
                        {/* Title */}
                        <div className="col-span-5 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {exam.title}
                          </p>
                          {exam.className && (
                            <p className="text-xs text-muted-col truncate">{exam.className}</p>
                          )}
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                              exam.status === "PUBLISHED"
                                ? "bg-[var(--status-active)]/12 text-[var(--status-active)]"
                                : exam.status === "DRAFT"
                                  ? "bg-muted text-muted-col"
                                  : "bg-[var(--status-pending)]/12 text-[var(--status-pending)]"
                            }`}
                          >
                            {exam.status}
                          </span>
                        </div>

                        {/* Questions */}
                        <div className="col-span-2 text-xs text-secondary-col">
                          {exam.totalQuestions} questions
                        </div>

                        {/* Time Limit */}
                        <div className="col-span-3 text-xs text-muted-col">
                          {exam.timeLimit} minutes
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-5 space-y-5">
          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-col mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Total Students
              </p>
              <p className="text-2xl font-bold text-foreground">{classData.students}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-col mb-1 flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5" /> Active Homework
              </p>
              <p className="text-2xl font-bold text-foreground">
                {homeworks.filter((h) => h.status === "ASSIGNED").length}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-col mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Exams
              </p>
              <p className="text-2xl font-bold text-foreground">{exams.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-col mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Completion Rate
              </p>
              <p className="text-2xl font-bold text-foreground">
                {classData.students > 0 && homeworks.length > 0
                  ? Math.round(
                      (homeworks.reduce(
                        (sum, h) => sum + (h.submissionCount || 0),
                        0,
                      ) /
                        (classData.students * homeworks.length)) *
                        100,
                    )
                  : 0}
                <span className="text-base text-muted-col ml-1">%</span>
              </p>
            </div>
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--status-pending)]/12 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-[var(--status-pending)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Detailed Progress Tracking
                </h3>
                <p className="text-xs text-muted-col leading-relaxed">
                  Individual student progress and detailed analytics are available through the Teacher
                  role. Admin view provides high-level class statistics and enrollment data. For
                  in-depth student progress reports, please use a teacher account.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity Summary */}
          {!homeworksLoading && !homeworksError && homeworks.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Inbox className="w-4 h-4" /> Homework Overview
              </h3>
              <div className="space-y-3">
                {homeworks.slice(0, 5).map((homework) => {
                  const completionRate =
                    classData.students > 0
                      ? Math.round(((homework.submissionCount || 0) / classData.students) * 100)
                      : 0;
                  return (
                    <div key={homework.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[60%]">
                          {homework.title}
                        </span>
                        <span className="text-muted-col">
                          {homework.submissionCount || 0}/{classData.students} submitted (
                          {completionRate}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-5 space-y-5">
          {/* Class Information */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Class Information
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Class Name
                </p>
                <p className="text-sm font-medium text-foreground mt-1">{classData.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Class Code
                </p>
                <p className="text-sm font-mono font-medium text-foreground mt-1">
                  {classData.classCode || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  JLPT Level
                </p>
                <p className="mt-1">
                  <JLPTBadge level={classData.level} />
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Status
                </p>
                <p className="mt-1">
                  <StatusBadge status={classData.status} />
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Teacher
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {classData.teacher || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Maximum Students
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {classData.maxStudents}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Current Enrollment
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {classData.students} / {classData.maxStudents} students
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Capacity
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {Math.round((classData.students / classData.maxStudents) * 100)}%
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Description
                </p>
                <p className="text-sm text-foreground mt-1 leading-relaxed">
                  {classData.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Metadata
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Class ID
                </p>
                <p className="text-xs font-mono text-muted-col mt-1 break-all">{classData.id}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Teacher ID
                </p>
                <p className="text-xs font-mono text-muted-col mt-1 break-all">
                  {classData.teacherId || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Created
                </p>
                <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-col" />
                  {formatDate(classData.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="text-xs text-muted-col flex items-center gap-2 px-1">
            <SettingsIcon className="w-3.5 h-3.5" />
            Editing class settings requires the Teacher role. Contact the assigned teacher to modify
            class details.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

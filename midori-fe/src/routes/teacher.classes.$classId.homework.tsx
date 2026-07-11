import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { homeworkApi } from "@/lib/api/homework";
import { TeacherAssignmentsTab } from "@/components/teacher/class-detail/TeacherAssignmentsTab";
import { Card } from "@/components/page-ui";
import type { TeacherAssignment } from "@/types/teacher-class";

export const Route = createFileRoute("/teacher/classes/$classId/homework")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: ClassHomeworkPage,
});

function ClassHomeworkPage() {
  const { classId } = Route.useParams();
  const { q: urlQ } = Route.useSearch();

  // Fetch class details (for meta info: name, studentCount, etc.)
  const { data: classDetail, isLoading: isLoadingClass, isError } = useQuery({
    queryKey: ["teacherClassDetail", classId],
    queryFn: () => classesApi.getClassById(classId),
    enabled: !!classId,
  });

  // Fetch homework for this specific class from the real backend endpoint
  const { data: homeworkList = [], isLoading: isLoadingHomework } = useQuery({
    queryKey: ["teacherHomeworksByClass", classId],
    queryFn: () => homeworkApi.getHomeworksByClass(classId),
    enabled: !!classId,
  });

  const isLoading = isLoadingClass || isLoadingHomework;

  const classInfo = useMemo(() => {
    if (!classDetail) return undefined;

    const rawStudents = (classDetail as any).students ?? [];

    const students = rawStudents.map((s: any) => ({
      id: s.studentId,
      name: s.fullName ?? s.email.split("@")[0],
      email: s.email,
      avatar: s.fullName ? s.fullName[0].toUpperCase() : "U",
      joinedAt: classDetail.createdAt ? classDetail.createdAt.split("T")[0] : "",
      status: s.status || "active",
      progress: 0,
      grammarProgress: 0,
      vocabularyProgress: 0,
      listeningProgress: 0,
      performance: "stable",
      atRisk: false,
    }));

    // Map HomeworkResponse → TeacherAssignment for the tab component
    const assignments: TeacherAssignment[] = homeworkList.map((h) => ({
      id: h.id,
      title: h.title,
      moduleType: "Vocabulary" as const,  // generic fallback; backend doesn't provide module type yet
      assignedDate: h.createdAt ? h.createdAt.split("T")[0] : "",
      deadline: h.dueDate ? h.dueDate.split("T")[0] : "",
      totalSubmissions: h.submissionCount ?? 0,
      notSubmittedCount: 0,
      avgScore: 0,
      status: h.status === "ASSIGNED" ? "Active" : h.status === "CLOSED" ? "Closed" : "Upcoming",
    }));

    return {
      id: classDetail.id,
      name: classDetail.name,
      level: classDetail.level || "N5",
      teacher: "Teacher",
      teacherAvatarInitials: "T",
      members: classDetail.studentCount ?? rawStudents.length,
      // Use live homework count from the fetched list — real-time accurate
      assignmentCount: homeworkList.length,
      avgScore: 0,
      nextDeadline: homeworkList.length > 0
        ? homeworkList
            .filter((h) => h.dueDate)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate?.split("T")[0] ?? "-"
        : "-",
      createdDate: classDetail.createdAt ? classDetail.createdAt.split("T")[0] : "",
      students,
      assignments,
      exams: [],
    };
  }, [classDetail, homeworkList]);

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
        Failed to load class details from the server. Please try again.
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/classes"
            className="p-2 rounded-xl border border-slate-200/70 bg-white/70 shadow-sm text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-extrabold font-display">Class Not Found</h1>
        </div>
        <Card className="p-8 text-center max-w-lg mx-auto">
          <p className="text-sm text-muted-foreground">The requested class could not be found.</p>
          <Link
            to="/teacher/classes"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
          >
            Back to Classes
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section with back button */}
      <div className="flex items-center gap-4">
        <Link
          to="/teacher/classes/$classId"
          params={{ classId: classInfo.id }}
          className="p-2 rounded-xl border border-slate-200/70 bg-white/70 shadow-sm text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-white/10 transition-all shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black font-display text-foreground dark:text-white leading-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Homework Management — {classInfo.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {classInfo.assignmentCount} assignment{classInfo.assignmentCount !== 1 ? "s" : ""} assigned to this class.
          </p>
        </div>
      </div>

      {/* Render the core tab component with live homework data */}
      <TeacherAssignmentsTab classInfo={classInfo} urlQ={urlQ} />
    </div>
  );
}

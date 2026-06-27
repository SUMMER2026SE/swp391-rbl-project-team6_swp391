import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { mockTeacherClasses } from "@/mock/teacherClasses";
import { getClassById } from "@/data/teacher-data";
import { TeacherAssignmentsTab } from "@/components/teacher/class-detail/TeacherAssignmentsTab";
import { Card } from "@/components/page-ui";

export const Route = createFileRoute("/teacher/classes/$classId/homework")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: ClassHomeworkPage,
});

function ClassHomeworkPage() {
  const { classId } = Route.useParams();
  const { q: urlQ } = Route.useSearch();
  
  // Find mock class detail or construct one from base class metadata
  let classInfo = mockTeacherClasses.find((c) => c.id === classId);
  
  if (!classInfo) {
    const baseClass = getClassById(classId);
    if (baseClass) {
      const template = baseClass.level === "N4" ? (mockTeacherClasses[1] || mockTeacherClasses[0]) : mockTeacherClasses[0];
      classInfo = {
        ...template,
        id: baseClass.id,
        name: baseClass.name,
        level: baseClass.level,
        members: baseClass.studentCount,
        assignmentCount: baseClass.openHomework,
        avgScore: baseClass.progress / 10 + 2,
        nextDeadline: baseClass.startDate,
        createdDate: baseClass.startDate,
      };
    }
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
            Manage assignments, review submissions and grade student answers.
          </p>
        </div>
      </div>

      {/* Render the core tab component */}
      <TeacherAssignmentsTab classInfo={classInfo} urlQ={urlQ} />
    </div>
  );
}

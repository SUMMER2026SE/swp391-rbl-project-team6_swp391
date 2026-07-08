import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard, ClipboardList, Users, Award, Loader2 } from "lucide-react";
import { Card } from "@/components/page-ui";
import { useQuery } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { homeworkApi } from "@/lib/api/homework";
import { examsApi } from "@/lib/api/exams";

// Tab Sub-Components
import { TeacherDashboardTab } from "@/components/teacher/class-detail/TeacherDashboardTab";
import { TeacherAssignmentsTab } from "@/components/teacher/class-detail/TeacherAssignmentsTab";
import { TeacherStudentsTab } from "@/components/teacher/class-detail/TeacherStudentsTab";
import { TeacherClassExamsTab } from "@/components/teacher/class-detail/TeacherClassExamsTab";

export const Route = createFileRoute("/teacher/classes/$classId")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: TeacherClassDetailPage,
});

function TeacherClassDetailPage() {
  const { classId } = Route.useParams();
  const { q: urlQ } = Route.useSearch();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: classDetail, isLoading } = useQuery({
    queryKey: ["teacherClassDetail", classId],
    queryFn: () => classesApi.getClassById(classId),
    enabled: !!classId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["classStudents", classId],
    queryFn: () => classesApi.getClassStudents(classId),
    enabled: !!classId,
  });

  const { data: allHomeworks = [] } = useQuery({
    queryKey: ["teacherAllHomeworks"],
    queryFn: () => homeworkApi.getTeacherHomeworks(),
  });

  const { data: classExams = [] } = useQuery({
    queryKey: ["classExams", classId],
    queryFn: () => examsApi.getExamsByClass(classId),
    enabled: !!classId,
  });

  const classInfo = useMemo(() => {
    if (!classDetail) return null;

    const mappedHomeworks = allHomeworks.filter(h => h.classId === classDetail.id);

    return {
      id: classDetail.id,
      name: classDetail.name,
      level: classDetail.level,
      members: classDetail.maxStudents,
      teacher: "Instructor",
      teacherAvatarInitials: "JP",
      assignmentCount: mappedHomeworks.length,
      avgScore: 0,
      nextDeadline: "-",
      createdDate: new Date(classDetail.createdAt).toLocaleDateString(),
      students: students.map(s => ({
        id: s.studentId,
        name: s.fullName || "Pending Accept",
        email: s.email,
        avatar: s.avatar || "",
        avgScore: 0,
        completionRate: 0,
        currentStreak: 0,
        lastActivity: "-",
      })),
      assignments: mappedHomeworks.map(h => ({
        id: h.id,
        title: h.title,
        moduleType: "Grammar" as const,
        assignedDate: h.createdAt ? h.createdAt.slice(0, 10) : "",
        deadline: h.dueDate ? h.dueDate.slice(0, 10) : "",
        totalSubmissions: 0,
        notSubmittedCount: 0,
        avgScore: 0,
        status: h.status === "ASSIGNED" ? "Active" as const : h.status === "CLOSED" ? "Closed" as const : "Upcoming" as const,
      })),
      activities: [],
      materials: [
        { id: "vocabulary", moduleName: "Vocabulary", totalLessons: 0, publishedCount: 0, draftCount: 0 },
        { id: "grammar", moduleName: "Grammar", totalLessons: 0, publishedCount: 0, draftCount: 0 },
        { id: "listening", moduleName: "Listening", totalLessons: 0, publishedCount: 0, draftCount: 0 },
        { id: "reading", moduleName: "Reading", totalLessons: 0, publishedCount: 0, draftCount: 0 },
        { id: "shadowing", moduleName: "Shadowing", totalLessons: 0, publishedCount: 0, draftCount: 0 },
        { id: "writing", moduleName: "Writing", totalLessons: 0, publishedCount: 0, draftCount: 0 },
      ] as any[],
      announcements: [],
      analytics: {
        avgScore: 0,
        submissionRate: 0,
        topStudents: [],
        weakestTopics: [],
        mostDifficultAssignments: [],
        progressByModule: {
          vocabulary: 0,
          grammar: 0,
          listening: 0,
          reading: 0,
          shadowing: 0,
          writing: 0,
        },
      },
      calendarEvents: [
        ...mappedHomeworks.map(h => ({
          id: `hw-${h.id}`,
          title: `${h.title} (HW Deadline)`,
          date: h.dueDate ? h.dueDate.slice(0, 10) : "",
          type: "deadline" as const,
        })),
        ...classExams.map(e => ({
          id: `exam-${e.id}`,
          title: `${e.title} (Exam Scheduled)`,
          date: e.createdAt ? e.createdAt.slice(0, 10) : "",
          type: "event" as const,
        })),
      ],
    };
  }, [classDetail, students, allHomeworks, classExams]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      {/* Large Class Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/teacher/classes"
            className="p-2 rounded-xl border border-slate-200/70 bg-white/70 shadow-sm text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-white/10 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black font-display text-foreground dark:text-white leading-tight">
                {classInfo.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/20 text-primary border border-primary/30">
                Level {classInfo.level}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-[10px]">
                {classInfo.teacherAvatarInitials}
              </div>
              <span>Teacher: {classInfo.teacher}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          {[
            { label: "Students", value: classInfo.members },
            { label: "Assignments", value: classInfo.assignmentCount },
            { label: "Avg Score", value: `${classInfo.avgScore}/10` },
            { label: "Next Deadline", value: classInfo.nextDeadline },
            { label: "Created Date", value: classInfo.createdDate },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-white/5 p-2 rounded-xl min-w-[90px]"
            >
              <div className="text-xs font-black text-foreground dark:text-white">{stat.value}</div>
              <div className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Tab Navigation Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
        {[
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "students", label: "Students", icon: Users },
          { id: "homework", label: "Homework", icon: ClipboardList },
          { id: "exams", label: "Exams", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render Active Tab Component */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <TeacherDashboardTab classInfo={classInfo} classExams={classExams} onSelectTab={setActiveTab} />
        )}
        {activeTab === "students" && (
          <TeacherStudentsTab classInfo={classInfo} onSelectTab={setActiveTab} urlQ={urlQ} />
        )}
        {activeTab === "homework" && (
          <TeacherAssignmentsTab classInfo={classInfo} urlQ={urlQ} />
        )}
        {activeTab === "exams" && (
          <TeacherClassExamsTab classId={classInfo.id} urlQ={urlQ} />
        )}
      </div>
    </div>
  );
}

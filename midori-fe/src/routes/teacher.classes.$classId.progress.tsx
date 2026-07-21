import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { TrendingUp, Users, BookOpen, Award, Clock, CheckCircle2, Circle, PlayCircle, Target, TrendingUpIcon, Trophy, TargetIcon, BarChart3, BookText } from "lucide-react";
import { Card } from "@/components/page-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { progressApi } from "@/lib/api/studentProgress";
import { classesApi } from "@/lib/api/classes";

export const Route = createFileRoute("/teacher/classes/$classId/progress")({
  component: TeacherClassProgressPage,
});

export function TeacherClassProgressPage() {
  const { classId } = useParams({ strict: false });

  const { data: classDetail, isLoading: isLoadingClass } = useQuery({
    queryKey: ["teacherClassDetail", classId],
    queryFn: () => classesApi.getClassById(classId),
    enabled: !!classId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["classStudents", classId],
    queryFn: () => classesApi.getClassStudents(classId),
    enabled: !!classId,
  });

  const avgScore = useMemo(() => {
    if (!students || students.length === 0) return "-";
    const studentsWithScore = students.filter((s: any) => s.averageScore !== undefined && s.averageScore !== null && s.averageScore > 0);
    if (studentsWithScore.length === 0) return "-";
    const sum = studentsWithScore.reduce((acc: number, s: any) => acc + s.averageScore, 0);
    return `${(sum / studentsWithScore.length).toFixed(1)}%`;
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Class Overview Header */}
      <Card className="p-6">
        <h3 className="font-display font-black text-sm text-foreground dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Class Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-black text-primary">{classDetail?.studentCount || 0}</div>
            <div className="text-xs text-muted-foreground">Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-green-600">{classDetail?.homeworkCount || 0}</div>
            <div className="text-xs text-muted-foreground">Homework</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-blue-600">{classDetail?.examCount || 0}</div>
            <div className="text-xs text-muted-foreground">Exams</div>
          </div>
        </div>
      </Card>

      {/* Learning Progress Distribution */}
      <Card className="p-6">
        <h3 className="font-display font-black text-sm text-foreground dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Student Progress Distribution
        </h3>
        <ProgressDistribution classId={classId} />
      </Card>

      {/* Recent Learning Activity */}
      <Card className="p-6">
        <h3 className="font-display font-black text-sm text-foreground dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Top Performing Students
        </h3>
        <TopStudents classId={classId} />
      </Card>

      {/* Learning Milestones */}
      <Card className="p-6">
        <h3 className="font-display font-black text-sm text-foreground dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Class Learning Milestones
        </h3>
        <ClassMilestones classId={classId} />
      </Card>
    </div>
  );
}

function ProgressDistribution({ classId }: { classId: string }) {
  const { data: students, isLoading } = useQuery({
    queryKey: ["classStudents", classId],
    queryFn: () => classesApi.getClassStudents(classId),
    enabled: !!classId,
  });

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-muted-foreground">No students in this class yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {students.slice(0, 5).map((student: any) => (
        <div key={student.id} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {student.displayName?.substring(0, 2).toUpperCase() || "??"}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{student.displayName || student.email}</span>
              <span className="text-xs text-muted-foreground">
                {student.submittedHomework || 0}/{student.totalHomework || 0} homework
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${student.progressPercent || 0}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopStudents({ classId }: { classId: string }) {
  const { data: students, isLoading } = useQuery({
    queryKey: ["classStudents", classId],
    queryFn: () => classesApi.getClassStudents(classId),
    enabled: !!classId,
  });

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-muted-foreground">No student data available</p>
      </div>
    );
  }

  const sortedStudents = [...(students || [])].sort(
    (a: any, b: any) => (b.progressPercent || 0) - (a.progressPercent || 0)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sortedStudents.slice(0, 3).map((student: any, index: number) => (
        <div
          key={student.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0
                ? "bg-yellow-100 text-yellow-700"
                : index === 1
                ? "bg-slate-200 text-slate-600"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            #{index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{student.displayName || student.email}</div>
            <div className="text-xs text-muted-foreground">
              {student.progressPercent || 0}% progress
            </div>
          </div>
        </div>
      ))}
      {sortedStudents.length === 0 && (
        <div className="col-span-3 text-center py-4">
          <p className="text-sm text-muted-foreground">No students found</p>
        </div>
      )}
    </div>
  );
}

function ClassMilestones({ classId }: { classId: string }) {
  const { data: students, isLoading } = useQuery({
    queryKey: ["classStudents", classId],
    queryFn: () => classesApi.getClassStudents(classId),
    enabled: !!classId,
  });

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  const completedHomework = (students || []).filter((s: any) => s.progressPercent === 100).length;
  const activeStudents = (students || []).filter((s: any) => s.progressPercent && s.progressPercent > 0).length;

  const milestones = [
    {
      icon: BookText,
      title: "Learning Content",
      status: (students?.length || 0) > 0 ? "Active" : "Pending",
      active: (students?.length || 0) > 0,
    },
    {
      icon: CheckCircle2,
      title: "Homework Completion",
      status: `${completedHomework}/${students?.length || 0} completed`,
      active: completedHomework > 0,
    },
    {
      icon: Award,
      title: "Exam Participation",
      status: `${activeStudents}/${students?.length || 0} active`,
      active: activeStudents > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {milestones.map((milestone, index) => {
        const Icon = milestone.icon;
        return (
          <div
            key={index}
            className={`p-4 rounded-xl border ${
              milestone.active
                ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${milestone.active ? "text-green-600" : "text-slate-400"}`} />
              <span className="text-sm font-medium">{milestone.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{milestone.status}</p>
          </div>
        );
      })}
    </div>
  );
}

export function TeacherProgressTabSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-32 w-full" />
        </Card>
      ))}
    </div>
  );
}

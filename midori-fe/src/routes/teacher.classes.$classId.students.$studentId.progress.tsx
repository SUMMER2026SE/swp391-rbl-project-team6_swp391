import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/page-ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudentProgress } from "@/hooks/useStudentProgress";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  GraduationCap,
  Trophy,
  BookOpen,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";

export const Route = createFileRoute("/teacher/classes/$classId/students/$studentId/progress")({
  component: StudentProgressPage,
});

function StudentProgressPage() {
  const { classId, studentId } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useStudentProgress(classId, studentId);

  const handleBack = () => {
    navigate({
      to: "/teacher/classes/$classId/students",
      params: { classId },
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
        </div>
        <Card className="p-12 text-center">
          <p className="text-destructive">Failed to load student progress.</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
        </Card>
      </div>
    );
  }

  const { student, overallProgress, learningSummary, recentActivities } = data;

  const progressValue = overallProgress.progressPercent ?? 0;
  const displayProgress = progressValue > 0 ? progressValue : "--";

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "HOMEWORK":
        return <ClipboardList className="w-4 h-4 text-blue-500" />;
      case "EXAM":
        return <FileText className="w-4 h-4 text-purple-500" />;
      case "VOCABULARY":
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case "GRAMMAR":
        return <GraduationCap className="w-4 h-4 text-orange-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-lg">
            {student.avatar && student.avatar.length > 0 ? (
              <img
                src={student.avatar}
                alt={student.fullName}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              student.fullName?.[0]?.toUpperCase() || <User className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{student.fullName}</h1>
            <p className="text-sm text-muted-foreground">{student.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Class: <span className="font-semibold">{student.className}</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          Overall Progress
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-muted-foreground">Overall Progress</span>
            <span className="text-2xl font-black text-primary">{displayProgress}%</span>
          </div>
          <Progress value={progressValue} className="h-3" />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-black">
                {learningSummary.homeworkCompleted ?? 0}
                {learningSummary.totalHomework > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /{learningSummary.totalHomework}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">Homework Completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-black">
                {learningSummary.examsCompleted ?? 0}
                {learningSummary.totalExams > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /{learningSummary.totalExams}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">Exams Completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-black">
                {learningSummary.averageScore > 0 ? learningSummary.averageScore.toFixed(1) : "--"}
                {learningSummary.averageScore > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">/10</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">Average Score</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Activities
        </h2>
        {recentActivities && recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto opacity-20 mb-2" />
            <p className="text-sm">No learning progress available yet.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

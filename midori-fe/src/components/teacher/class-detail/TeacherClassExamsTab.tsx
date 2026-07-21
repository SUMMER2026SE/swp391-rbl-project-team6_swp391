import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/page-ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { examsApi, mapExamUiStatus, type ExamResponse } from "@/lib/api/exams";
import type { TeacherExamView, JLPTLevel } from "@/types/teacher-exam";
import { ConfirmDialog } from "@/components/teacher/dialogs";
import {
  Plus,
  MoreVertical,
  Edit,
  Archive,
  Eye,
  ClipboardCheck,
  Loader2,
  Award,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ExamEditDialog } from "@/components/teacher/exam-edit-dialog";
import { ExamAssignDialog } from "@/components/teacher/exam-assign-dialog";
import { ExamGradeDrawer } from "@/components/teacher/exam-grade-drawer";
import { ViewHomeworkDialog } from "../homework-detail-dialog";

export interface TeacherClassExamsTabProps {
  classId: string;
  urlQ?: string;
  isArchived?: boolean;
}

function mapApiExamToView(e: ExamResponse, classId: string): TeacherExamView {
  const uiStatus = mapExamUiStatus(e.status);
  const source = e.category || "question-bank";

  return {
    id: e.id,
    classId,
    title: e.title,
    level: e.level as JLPTLevel,
    status: uiStatus === "published" ? "Scheduled" : uiStatus === "pending" ? "Archived" : "Draft",
    totalQuestions: e.totalQuestions,
    duration: e.timeLimit,
    scheduledAt: e.createdAt ? e.createdAt.split("T")[0] : "—",
    source,
    attempts: 1,
  };
}

export function TeacherClassExamsTab({ classId, urlQ, isArchived }: TeacherClassExamsTabProps) {
  const queryClient = useQueryClient();

  const { data: rawList = [], isLoading } = useQuery({
    queryKey: ["examsByClass", classId],
    queryFn: () => examsApi.getExamsByClass(classId),
    enabled: !!classId,
  });

  // Fetch results by class to calculate real submission counts
  const { data: examResults = [] } = useQuery({
    queryKey: ["examResultsByClass", classId],
    queryFn: () => examsApi.getStudentExamResultsByClass(classId),
    enabled: !!classId,
  });

  const list = useMemo((): TeacherExamView[] => {
    return rawList.map((e) => mapApiExamToView(e, classId));
  }, [rawList, classId]);

  // Filter & Sort state (matching Homework page)
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("deadline");

  const [openViewId, setOpenViewId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [editExam, setEditExam] = useState<string | null>(null);
  const [assignExam, setAssignExam] = useState<string | null>(null);
  const [gradeExam, setGradeExam] = useState<string | null>(null);

  const filters = ["All", "Active", "Completed"];

  // Process list with filter and sort
  const processedList = useMemo(() => {
    let result = [...list];

    if (urlQ) {
      const q = urlQ.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.status.toLowerCase().includes(q) ||
          e.level.toLowerCase().includes(q) ||
          e.source.toLowerCase().includes(q)
      );
    }

    if (filter !== "All") {
      result = result.filter((e) => {
        if (filter === "Active") {
          return e.status === "Scheduled" || e.status === "Draft";
        }
        if (filter === "Completed") {
          return e.status === "Archived";
        }
        return true;
      });
    }

    result.sort((a, b) => {
      if (sort === "deadline") {
        return (a.duration || 0) - (b.duration || 0);
      }
      if (sort === "created") {
        return b.scheduledAt.localeCompare(a.scheduledAt);
      }
      return 0;
    });

    return result;
  }, [list, urlQ, filter, sort]);

  const handleExamSave = (_updated: TeacherExamView) => {
    void queryClient.invalidateQueries({ queryKey: ["examsByClass", classId] });
  };

  const handleExamAssign = (_classId?: string) => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["examsByClass", classId] }),
      queryClient.invalidateQueries({ queryKey: ["classExams", classId] }),
      queryClient.invalidateQueries({ queryKey: ["teacherClassExams", classId] }),
      queryClient.invalidateQueries({ queryKey: ["exams"] }),
      queryClient.invalidateQueries({ queryKey: ["teacherExams"] }),
    ]);
  };

  const handleExamGrade = () => {
    void queryClient.invalidateQueries({ queryKey: ["examResultsByClass", classId] });
  };

  const handleExamRemind = () => {
    toast.success("Reminder sent to students");
  };

  const handleArchiveExam = async (id: string) => {
    try {
      await examsApi.deleteExam(id);
      toast.success("Exam archived successfully");
      await queryClient.invalidateQueries({ queryKey: ["examsByClass", classId] });
      await queryClient.invalidateQueries({ queryKey: ["classExams", classId] });
      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      setArchiving(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to archive exam.";
      toast.error(message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Scheduled":
      case "Active":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-500/30">
            Active
          </span>
        );
      case "Archived":
      case "Completed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border-slate-200">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/30">
            Draft
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading exams...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar matching Homework page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Class Exams ({processedList.length} Exams)
          </h2>
        </div>
        {!isArchived && (
          <Button
            asChild
            className="rounded-xl shadow-md font-bold text-sm bg-primary hover:bg-primary/90"
          >
            <Link
              to="/teacher/exams/create"
              search={{
                classId,
                source: undefined,
                topicId: undefined,
                jlptSetId: undefined,
                mode: undefined,
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              + ASSIGN EXAM
            </Link>
          </Button>
        )}
      </div>

      {/* Filter and Sort Bar matching Homework page */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 p-3 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm backdrop-blur-md">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                filter === f
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <option value="deadline">Nearest Duration</option>
            <option value="created">Latest Created</option>
          </select>
        </div>
      </div>

      {/* Exams Grid Cards */}
      {processedList.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-white/40 dark:bg-slate-900/40">
          <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {list.length === 0
              ? "No exams created for this class yet."
              : `No exams found matching "${urlQ || filter}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {processedList.map((e) => {
            // Count total submissions for this exam
            const submittedCount = examResults.filter((r: any) => r.examId === e.id || r.id === e.id).length;

            return (
              <Card
                key={e.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                        {e.level} EXAM
                      </span>
                      {getStatusBadge(e.status)}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onSelect={() => setOpenViewId(e.id)}>
                          <Eye className="mr-2 h-4 w-4 text-blue-500" />
                          Preview Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setGradeExam(e.id)}>
                          <ClipboardCheck className="mr-2 h-4 w-4 text-emerald-500" />
                          View Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditExam(e.id)}>
                          <Edit className="mr-2 h-4 w-4 text-amber-500" />
                          Edit Exam
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setArchiving(e.id)}>
                          <Archive className="mr-2 h-4 w-4 text-rose-500" />
                          Archive Exam
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Exam Title */}
                  <h3
                    onClick={() => setOpenViewId(e.id)}
                    className="text-base font-black text-slate-800 dark:text-white mb-4 line-clamp-2 hover:text-primary transition-colors cursor-pointer"
                  >
                    {e.title}
                  </h3>

                  {/* Details Meta Rows */}
                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 mb-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Assigned:</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {e.scheduledAt}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Duration / Limit:</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {e.duration} mins ({e.totalQuestions} Qs)
                    </div>
                  </div>
                </div>

                {/* Bottom View Submissions Button matching Homework page */}
                <Button
                  variant="secondary"
                  className="w-full rounded-2xl bg-primary/10 hover:bg-primary hover:text-white text-primary font-extrabold text-xs h-10 border border-primary/20 transition-all duration-200"
                  onClick={() => setGradeExam(e.id)}
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  VIEW SUBMISSIONS
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Homework Detail / Exam View Dialog */}
      <ViewHomeworkDialog
        open={!!openViewId}
        onOpenChange={(o) => !o && setOpenViewId(null)}
        homeworkId={openViewId}
      />

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(o) => !o && setArchiving(null)}
        title="Archive exam?"
        description="Archived exams will be hidden from students."
        confirmLabel="Archive"
        onConfirm={() => archiving && handleArchiveExam(archiving)}
      />

      <ExamEditDialog
        open={!!editExam}
        onOpenChange={(o) => !o && setEditExam(null)}
        exam={editExam ? (list.find((e) => e.id === editExam) ?? null) : null}
        onSave={handleExamSave}
      />

      <ExamAssignDialog
        open={!!assignExam}
        onOpenChange={(o) => !o && setAssignExam(null)}
        exam={assignExam ? (list.find((e) => e.id === assignExam) ?? null) : null}
        onSuccess={handleExamAssign}
      />

      <ExamGradeDrawer
        open={!!gradeExam}
        onOpenChange={(o) => !o && setGradeExam(null)}
        exam={gradeExam ? (list.find((e) => e.id === gradeExam) ?? null) : null}
        classId={classId}
        onGrade={handleExamGrade}
        onRemind={handleExamRemind}
      />
    </div>
  );
}

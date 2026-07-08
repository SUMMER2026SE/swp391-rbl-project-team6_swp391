import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { examsApi, mapExamUiStatus, type ExamResponse } from "@/lib/api/exams";
import type { TeacherExamView, JLPTLevel } from "@/types/teacher-exam";
import { LevelBadge, StatusBadge } from "@/components/teacher/badges";
import { PreviewSheet, ConfirmDialog } from "@/components/teacher/dialogs";
import { Plus, MoreVertical, Edit, Archive, Eye, ClipboardCheck, Loader2 } from "lucide-react";
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

export interface TeacherClassExamsTabProps {
  classId: string;
  urlQ?: string;
}

function mapApiExamToView(e: ExamResponse, classId: string): TeacherExamView {
  const uiStatus = mapExamUiStatus(e.status);
  const source = e.category || "question-bank";

  return {
    id: e.id,
    classId,
    title: e.title,
    level: e.level as JLPTLevel,
    status:
      uiStatus === "published"
        ? "Scheduled"
        : uiStatus === "pending"
          ? "Archived"
          : "Draft",
    totalQuestions: e.totalQuestions,
    duration: e.timeLimit,
    scheduledAt: e.createdAt
      ? new Date(e.createdAt).toLocaleDateString()
      : "—",
    source,
    attempts: 1,
  };
}

export function TeacherClassExamsTab({ classId, urlQ }: TeacherClassExamsTabProps) {
  const queryClient = useQueryClient();

  const { data: rawList = [], isLoading } = useQuery({
    queryKey: ["examsByClass", classId],
    queryFn: () => examsApi.getExamsByClass(classId),
    enabled: !!classId,
  });

  const list = useMemo((): TeacherExamView[] => {
    return rawList.map((e) => mapApiExamToView(e, classId));
  }, [rawList, classId]);

  const [open, setOpen] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [editExam, setEditExam] = useState<string | null>(null);
  const [assignExam, setAssignExam] = useState<string | null>(null);
  const [gradeExam, setGradeExam] = useState<string | null>(null);

  const filteredList = useMemo(() => {
    if (!urlQ) return list;
    const q = urlQ.toLowerCase();
    return list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q) ||
        e.level.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q),
    );
  }, [list, urlQ]);

  const sel = filteredList.find((e) => e.id === open);

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
    toast.success("Reminder sent");
  };

  const handleArchiveExam = async (id: string) => {
    try {
      await examsApi.deleteExam(id);
      toast.success("Exam archived");
      await queryClient.invalidateQueries({ queryKey: ["examsByClass", classId] });
      await queryClient.invalidateQueries({ queryKey: ["classExams", classId] });
      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      setArchiving(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to archive exam.";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading exams…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{filteredList.length} exams</h2>
        <Button asChild>
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
            <Plus className="mr-2 h-4 w-4" />
            New exam
          </Link>
        </Button>
      </div>

      {filteredList.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-3xl">
          <p className="text-sm text-muted-foreground">
            {list.length === 0
              ? "No exams for this class yet. Create one to get started."
              : `No exams found matching "${urlQ}".`}
          </p>
        </div>
      ) : (
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredList.map((e) => (
          <Card key={e.id}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <LevelBadge level={e.level} />
                    <StatusBadge status={e.status} />
                  </div>
                  <button
                    onClick={() => setOpen(e.id)}
                    className="block truncate text-left font-semibold hover:text-primary"
                  >
                    {e.title}
                  </button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setOpen(e.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setGradeExam(e.id)}>
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Grade / review
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setEditExam(e.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setArchiving(e.id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-muted-foreground">Questions</div>
                  <div className="font-bold">{e.totalQuestions}</div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-muted-foreground">Duration</div>
                  <div className="font-bold">{e.duration}m</div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-muted-foreground">Avg score</div>
                  <div className="font-bold">{e.averageScore ?? "—"}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {e.scheduledAt} · {e.source.replace("-", " ")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      <PreviewSheet open={!!sel} onOpenChange={(o) => !o && setOpen(null)} title={sel?.title ?? ""}>
        {sel && (
          <div className="space-y-3 text-sm">
            <p>
              {sel.totalQuestions} questions · {sel.duration} min · {sel.attempts} attempt(s)
            </p>
            <p>Source: {sel.source.replace("-", " ")}</p>
            {sel.averageScore !== undefined && (
              <p>
                Class average: <b>{sel.averageScore}%</b>
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => setAssignExam(sel.id)}>
                Assign to students
              </Button>
              <Button variant="outline" onClick={() => setGradeExam(sel.id)}>
                <ClipboardCheck className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </PreviewSheet>

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(o) => !o && setArchiving(null)}
        title="Archive exam?"
        description="Archived exams are hidden from students."
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

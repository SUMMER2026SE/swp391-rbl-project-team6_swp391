import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getExamsByClass, type Exam } from "@/data/teacher-data";
import { LevelBadge, StatusBadge } from "@/components/teacher/badges";
import { PreviewSheet, ConfirmDialog } from "@/components/teacher/dialogs";
import { Plus, MoreVertical, Edit, Archive, Eye, ClipboardCheck } from "lucide-react";
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

export function TeacherClassExamsTab({ classId, urlQ }: TeacherClassExamsTabProps) {
  const list = getExamsByClass(classId);
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
        e.type.toLowerCase().includes(q),
    );
  }, [list, urlQ]);

  const sel = filteredList.find((e) => e.id === open);

  const handleExamSave = (_updated: Exam) => {
    toast.success("Exam updated");
  };
  const handleExamAssign = () => {
    toast.success("Exam assigned");
  };
  const handleExamGrade = () => {
    toast.success("Grade saved");
  };
  const handleExamRemind = () => {
    toast.success("Reminder sent");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{filteredList.length} exams</h2>
        <Button asChild>
          <Link to={`/teacher/exams/create?classId=${classId}`}>
            <Plus className="mr-2 h-4 w-4" />
            New exam
          </Link>
        </Button>
      </div>

      {filteredList.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-3xl">
          <p className="text-sm text-muted-foreground">No exams found matching "{urlQ}".</p>
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
        onConfirm={() => toast.success("Exam archived")}
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
        onAssign={handleExamAssign}
      />

      <ExamGradeDrawer
        open={!!gradeExam}
        onOpenChange={(o) => !o && setGradeExam(null)}
        exam={gradeExam ? (list.find((e) => e.id === gradeExam) ?? null) : null}
        onGrade={handleExamGrade}
        onRemind={handleExamRemind}
      />
    </div>
  );
}

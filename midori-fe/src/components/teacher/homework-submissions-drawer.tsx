import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Homework } from "@/data/teacher-data";
import { getAllStudents } from "@/data/teacher-data";

interface HomeworkSubmissionsDrawerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  homework: Homework | null;
  onGrade: (studentId: string, score: number) => void;
  onRemind: (studentId: string) => void;
}

interface MockSubmission {
  student: ReturnType<typeof getAllStudents>[number];
  submitted: boolean;
  score: number | null;
  submittedAt: string | null;
}

export function HomeworkSubmissionsDrawer({
  open,
  onOpenChange,
  homework,
  onGrade,
  onRemind,
}: HomeworkSubmissionsDrawerProps) {
  const [submissions, setSubmissions] = useState<MockSubmission[]>([]);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MockSubmission | null>(null);
  const [gradeInput, setGradeInput] = useState(0);

  useEffect(() => {
    if (homework && open) {
      const students = getAllStudents().filter((s) => s.id.startsWith(homework.classId + "-"));
      const submittedCount = Math.floor(students.length * 0.6);
      const mockSubs: MockSubmission[] = students.map((s, i) => ({
        student: s,
        submitted: i < submittedCount,
        score: i < submittedCount ? Math.floor(Math.random() * 30) + 70 : null,
        submittedAt: i < submittedCount ? `2026-06-${20 + i}` : null,
      }));
      setSubmissions(mockSubs);
    }
  }, [homework, open]);

  const submittedCount = submissions.filter((s) => s.submitted).length;
  const totalCount = submissions.length;
  const submissionRate = totalCount > 0 ? (submittedCount / totalCount) * 100 : 0;

  const handleOpenGradeDialog = (submission: MockSubmission) => {
    setSelectedStudent(submission);
    setGradeInput(submission.score ?? 0);
    setGradeDialogOpen(true);
  };

  const handleSaveGrade = () => {
    if (!selectedStudent) return;
    const studentName = selectedStudent.student.name.split(" ")[0];
    onGrade(selectedStudent.student.id, gradeInput);
    setSubmissions((prev) =>
      prev.map((s) =>
        s.student.id === selectedStudent.student.id ? { ...s, score: gradeInput } : s,
      ),
    );
    toast.success(`Grade saved for ${studentName}`);
    setGradeDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleSendReminder = (studentId: string) => {
    const student = submissions.find((s) => s.student.id === studentId);
    if (!student) return;
    const studentName = student.student.name.split(" ")[0];
    onRemind(studentId);
    toast.success(`Reminder sent to ${studentName}`);
  };

  const getAvatarInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Submissions
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {submittedCount} / {totalCount} submitted
              </span>
              <span className="font-medium">{Math.round(submissionRate)}%</span>
            </div>
            <Progress value={submissionRate} className="h-2" />
          </div>

          <div className="mt-5 flex-1 overflow-y-auto space-y-3 pr-1">
            {submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ClipboardCheck className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No students found for this class.</p>
              </div>
            ) : (
              submissions.map((submission) => {
                const student = submission.student;
                const initials = getAvatarInitial(student.name);
                const isSubmitted = submission.submitted;
                const hasScore = submission.score !== null;
                const isPendingGrading =
                  isSubmitted && (submission.score ?? 0) < (homework?.maxScore ?? 100);

                return (
                  <div
                    key={student.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                      isSubmitted
                        ? "bg-card"
                        : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30",
                    )}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{student.name}</span>
                        {isSubmitted ? (
                          hasScore ? (
                            <span
                              className={cn(
                                "shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full",
                                isPendingGrading
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
                              )}
                            >
                              {submission.score} / {homework?.maxScore ?? 100}
                            </span>
                          ) : (
                            <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                              Submitted
                            </span>
                          )
                        ) : (
                          <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                            Missing
                          </span>
                        )}
                      </div>
                      {isSubmitted && submission.submittedAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Submitted {submission.submittedAt}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSubmitted ? (
                        hasScore ? (
                          <Button
                            size="sm"
                            variant={isPendingGrading ? "default" : "outline"}
                            onClick={() => handleOpenGradeDialog(submission)}
                          >
                            {isPendingGrading ? "Grade" : "Edit"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleOpenGradeDialog(submission)}
                          >
                            Grade
                          </Button>
                        )
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/30"
                          onClick={() => handleSendReminder(student.id)}
                        >
                          <Bell className="w-3.5 h-3.5 mr-1" />
                          Remind
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade — {selectedStudent?.student.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                  {selectedStudent ? getAvatarInitial(selectedStudent.student.name) : ""}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{selectedStudent?.student.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedStudent?.submittedAt
                    ? `Submitted ${selectedStudent.submittedAt}`
                    : "No submission"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="grade-score">
                Score (out of {homework?.maxScore ?? 100})
              </label>
              <Input
                id="grade-score"
                type="number"
                min={0}
                max={homework?.maxScore ?? 100}
                value={gradeInput}
                onChange={(e) => setGradeInput(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGrade}>Save Grade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

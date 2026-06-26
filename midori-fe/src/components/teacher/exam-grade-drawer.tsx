import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Bell,
  TrendingUp,
  TrendingDown,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getAllStudents, type Exam, type Student } from "@/data/teacher-data";
import { cn } from "@/lib/utils";

interface ExamGradeDrawerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exam: Exam | null;
  onGrade: (studentId: string, score: number) => void;
  onRemind: (studentId: string) => void;
}

interface ExamAttempt {
  studentId: string;
  studentName: string;
  score: number | null;
  submitted: boolean;
  submittedAt: string | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function generateMockAttempts(exam: Exam | null, allStudents: Student[]): ExamAttempt[] {
  if (!exam) return [];

  const classStudents = allStudents.filter((s) => s.id.startsWith(exam.classId + "-"));

  if (classStudents.length === 0) {
    return [];
  }

  const baseAvg = exam.averageScore ?? 65;
  const poolSize = classStudents.length;
  const submittedCount = Math.max(1, Math.floor(poolSize * 0.75));

  return classStudents.map((s, i) => {
    const isSubmitted = i < submittedCount;
    const score = isSubmitted ? Math.max(0, Math.min(100, baseAvg + (i % 7) * 5 - 15)) : null;

    const daysAgo = Math.floor(Math.random() * 3) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const submittedAt = isSubmitted ? date.toISOString().split("T")[0] : null;

    return {
      studentId: s.id,
      studentName: s.name,
      score,
      submitted: isSubmitted,
      submittedAt,
    };
  });
}

export function ExamGradeDrawer({
  open,
  onOpenChange,
  exam,
  onGrade,
  onRemind,
}: ExamGradeDrawerProps) {
  const allStudents = getAllStudents();
  const [gradeStudentId, setGradeStudentId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [submittedScores, setSubmittedScores] = useState<Record<string, number>>({});

  const attempts = useMemo(() => generateMockAttempts(exam, allStudents), [exam, allStudents]);

  const stats = useMemo(() => {
    const submitted = attempts.filter((a) => a.submitted);
    const scored = attempts.filter((a) => a.score !== null);
    const scores = scored.map((a) => a.score as number);

    const avg =
      scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;
    const pending = attempts.filter((a) => !a.submitted).length;

    return {
      total: attempts.length,
      submitted: submitted.length,
      scored: scored.length,
      pending,
      avg,
      highest,
      lowest,
    };
  }, [attempts]);

  const gradeStudent = attempts.find((a) => a.studentId === gradeStudentId);

  const handleOpenGrade = (studentId: string) => {
    const attempt = attempts.find((a) => a.studentId === studentId);
    setGradeStudentId(studentId);
    setGradeScore(attempt && attempt.score !== null ? String(attempt.score) : "");
  };

  const handleSubmitScore = () => {
    if (!gradeStudentId || gradeScore === "") return;
    const score = parseInt(gradeScore, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }

    const student = attempts.find((a) => a.studentId === gradeStudentId);
    const name = student?.studentName ?? gradeStudentId;

    setSubmittedScores((prev) => ({ ...prev, [gradeStudentId]: score }));
    onGrade(gradeStudentId, score);
    toast.success(`Score saved for ${name}`);
    setGradeStudentId(null);
    setGradeScore("");
  };

  const handleRemind = (studentId: string) => {
    const student = attempts.find((a) => a.studentId === studentId);
    const name = student?.studentName ?? studentId;
    onRemind(studentId);
    toast.success(`Reminder sent to ${name}`);
  };

  const handleGradeCancel = () => {
    setGradeStudentId(null);
    setGradeScore("");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-lg">
              {exam ? `Grade: ${exam.title}` : "Grade Exam Submissions"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Submitted
                </div>
                <div className="text-xl font-bold">
                  {stats.submitted}
                  <span className="text-sm font-normal text-muted-foreground">/{stats.total}</span>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Average
                </div>
                <div className="text-xl font-bold">{stats.avg}</div>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  Highest
                </div>
                <div className="text-xl font-bold text-success">{stats.highest}</div>
              </div>

              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  Lowest
                </div>
                <div className="text-xl font-bold text-destructive">{stats.lowest}</div>
              </div>
            </div>

            {stats.pending > 0 && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 flex items-start gap-3">
                <Clock className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning-foreground">
                    {stats.pending} student{stats.pending !== 1 ? "s" : ""} have not submitted
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Send reminders to encourage completion.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Student Submissions</h3>
                <span className="text-xs text-muted-foreground">
                  {stats.scored} graded / {stats.total} total
                </span>
              </div>

              {attempts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <ClipboardCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No students found for this exam.</p>
                </div>
              ) : (
                <div className="divide-y rounded-lg border">
                  {attempts.map((attempt) => {
                    const displayScore =
                      submittedScores[attempt.studentId] ??
                      (attempt.score !== null ? attempt.score : null);

                    return (
                      <div
                        key={attempt.studentId}
                        className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(attempt.studentName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attempt.studentName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {attempt.submitted ? (
                              <>
                                {displayScore !== null ? (
                                  <>
                                    <span
                                      className={cn(
                                        "text-xs font-semibold",
                                        displayScore >= 80
                                          ? "text-success"
                                          : displayScore >= 60
                                            ? "text-warning"
                                            : "text-destructive",
                                      )}
                                    >
                                      {displayScore}/100
                                    </span>
                                    <Progress value={displayScore} className="h-1.5 w-20" />
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    Ungraded
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Not submitted
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {attempt.submitted && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenGrade(attempt.studentId)}
                            >
                              {displayScore !== null ? "Edit" : "Grade"}
                            </Button>
                          )}
                          {!attempt.submitted && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-warning border-warning/40 hover:bg-warning/10"
                              onClick={() => handleRemind(attempt.studentId)}
                            >
                              <Bell className="h-3.5 w-3.5 mr-1" />
                              Remind
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={gradeStudentId !== null}
        onOpenChange={(o) => {
          if (!o) handleGradeCancel();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Exam</DialogTitle>
            <DialogDescription>
              Enter the score for{" "}
              <span className="font-medium text-foreground">{gradeStudent?.studentName ?? ""}</span>
              . Score is out of 100 points.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="grade-score">Score (0–100)</Label>
              <Input
                id="grade-score"
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 85"
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitScore();
                }}
              />
            </div>
            {gradeScore !== "" && !isNaN(parseInt(gradeScore, 10)) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Grade preview</span>
                  <span>{gradeScore}/100</span>
                </div>
                <Progress
                  value={Math.max(0, Math.min(100, parseInt(gradeScore, 10)))}
                  className="h-2"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Fail</span>
                  <span>Pass</span>
                  <span>Excellent</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleGradeCancel}>
              Cancel
            </Button>
            <Button
              disabled={gradeScore === "" || isNaN(parseInt(gradeScore, 10))}
              onClick={handleSubmitScore}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Submit Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

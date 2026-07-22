import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Bell,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Loader2,
  Calendar,
  Users,
} from "lucide-react";
import { classesApi } from "@/lib/api/classes";
import { examsApi } from "@/lib/api/exams";
import type { TeacherExamView } from "@/types/teacher-exam";
import { cn } from "@/lib/utils";

interface ExamGradeDrawerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exam: TeacherExamView | null;
  classId: string;
  onGrade: (studentId: string, score: number) => void;
  onRemind: (studentId: string) => void;
}

interface ExamAttempt {
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number | null;
  submitted: boolean;
  submittedAt: string | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ExamGradeDrawer({
  open,
  onOpenChange,
  exam,
  classId,
  onGrade,
  onRemind,
}: ExamGradeDrawerProps) {
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["classStudents", classId],
    queryFn: () => classesApi.getClassStudents(classId),
    enabled: open && !!classId,
  });

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["examResultsByClass", classId],
    queryFn: () => examsApi.getStudentExamResultsByClass(classId),
    enabled: open && !!classId,
  });

  const [subFilter, setSubFilter] = useState("All");
  const [gradeStudentId, setGradeStudentId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [submittedScores, setSubmittedScores] = useState<Record<string, number>>({});

  const attempts = useMemo((): ExamAttempt[] => {
    if (!exam) return [];

    const examResults = results.filter((r) => r.examId === exam.id);
    const resultByStudent = new Map(examResults.map((r) => [r.studentId, r]));

    return students.map((s) => {
      const result = resultByStudent.get(s.studentId);
      const submitted =
        result?.status === "SUBMITTED" || result?.status === "GRADED" || !!result?.submittedAt;
      const score =
        result?.percentage != null
          ? Math.round(result.percentage)
          : result?.score != null && result?.totalPoints
            ? Math.round((result.score / result.totalPoints) * 100)
            : null;

      return {
        studentId: s.studentId,
        studentName: s.fullName || s.email,
        studentEmail: s.email ?? "",
        score: submitted ? score : null,
        submitted,
        submittedAt: result?.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : null,
      };
    });
  }, [exam, results, students]);

  const isLoading = studentsLoading || resultsLoading;

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

  const filteredAttempts = useMemo(() => {
    if (subFilter === "Submitted") {
      return attempts.filter((a) => a.submitted);
    }
    if (subFilter === "Pending") {
      return attempts.filter((a) => !a.submitted);
    }
    return attempts;
  }, [attempts, subFilter]);

  const gradeStudent = attempts.find((a) => a.studentId === gradeStudentId);

  const handleOpenGrade = (studentId: string) => {
    const attempt = attempts.find((a) => a.studentId === studentId);
    setGradeStudentId(studentId);
    setGradeScore(attempt && attempt.score !== null ? String(attempt.score) : "");
  };

  const handleSubmitScore = async () => {
    if (!gradeStudentId || gradeScore === "") return;
    const score = parseInt(gradeScore, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }

    const examResults = results.filter((r) => r.examId === exam?.id);
    const studentResult = examResults.find((r) => r.studentId === gradeStudentId);
    const studentExamId = studentResult?.id;

    if (!studentExamId) {
      toast.error("No active student exam session found to grade.");
      return;
    }

    try {
      await examsApi.gradeStudentExam(studentExamId, score);
      setSubmittedScores((prev) => ({ ...prev, [gradeStudentId]: score }));
      onGrade(gradeStudentId, score);
      toast.success("Score updated successfully!");
      setGradeStudentId(null);
      setGradeScore("");
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Failed to grade exam.";
      toast.error(msg);
    }
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
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading submissions…
              </div>
            ) : (
              <>
                {/* Brief Stats & Header Card */}
                <div className="p-6 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-widest text-primary">
                        JLPT {exam?.level || "N/A"} Exam
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[9px] font-black border border-slate-200/50 dark:border-white/5 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {exam?.status || "Active"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold font-display text-foreground dark:text-white mt-1 leading-tight">
                      {exam?.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Scheduled:{" "}
                        <strong className="text-foreground dark:text-slate-300">
                          {exam?.scheduledAt ? new Date(exam.scheduledAt).toLocaleDateString() : "N/A"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-[85px]">
                      <div className="text-sm font-black text-foreground dark:text-white">
                        {stats.submitted}/{stats.total}
                      </div>
                      <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                        Submitted
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-[85px]">
                      <div className="text-sm font-black text-primary">{stats.avg}</div>
                      <div className="text-[8px] text-primary font-bold uppercase tracking-wider mt-0.5">
                        Average
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-[85px]">
                      <div className="text-sm font-black text-emerald-500">{stats.highest}</div>
                      <div className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">
                        Highest
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-[85px]">
                      <div className="text-sm font-black text-rose-500">{stats.lowest}</div>
                      <div className="text-[8px] text-rose-500 font-bold uppercase tracking-wider mt-0.5">
                        Lowest
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-3">
                  {[
                    { id: "All", label: "All" },
                    { id: "Submitted", label: "Đã làm" },
                    { id: "Pending", label: "Chưa làm" },
                  ].map((tab) => {
                    const isActive = subFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSubFilter(tab.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Student Submissions</h3>
                    <span className="text-xs text-muted-foreground">
                      {stats.scored} graded / {stats.total} total
                    </span>
                  </div>

                  {filteredAttempts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-3xl border-border/40 bg-slate-50/50 dark:bg-white/[0.01]">
                      <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground font-semibold">
                        No student submissions match this status.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {filteredAttempts.map((attempt) => {
                        const displayScore =
                          submittedScores[attempt.studentId] ??
                          (attempt.score !== null ? attempt.score : null);

                        return (
                          <Card
                            key={attempt.studentId}
                            className={cn(
                              "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all hover:border-slate-300 dark:hover:border-white/10",
                              attempt.submitted && displayScore === null && "border-amber-500/15 bg-amber-500/[0.005]"
                            )}
                          >
                            {/* Profile info */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-xs shrink-0">
                                {getInitials(attempt.studentName)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-display font-bold text-sm text-foreground dark:text-white truncate">
                                  {attempt.studentName}
                                </h4>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {attempt.studentEmail}
                                </p>
                              </div>
                            </div>

                            {/* Stats & Badges */}
                            <div className="flex items-center gap-8 self-start sm:self-center">
                              <div className="w-28 flex flex-col justify-center">
                                <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">
                                  Status
                                </div>
                                {attempt.submitted ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-1 w-fit">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Graded
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20 dark:hover:bg-blue-500/20 flex items-center gap-1 w-fit">
                                    <Clock className="w-3.5 h-3.5" /> Pending
                                  </span>
                                )}
                              </div>

                              <div className="w-36">
                                <div>
                                  <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">
                                    Submitted at
                                  </div>
                                  <div className="text-[10px] font-semibold text-foreground dark:text-slate-300 truncate">
                                    {attempt.submittedAt || (
                                      <span className="text-muted-foreground italic">No submission</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="w-16 text-center">
                                <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">
                                  Score
                                </div>
                                <div className="text-xs font-black text-foreground dark:text-white">
                                  {displayScore !== null ? (
                                    <span className="text-emerald-500 font-bold">{displayScore}/100</span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions column */}
                            <div className="self-end sm:self-center shrink-0">
                              {attempt.submitted && (
                                <Button
                                  variant="outline"
                                  onClick={() => handleOpenGrade(attempt.studentId)}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 font-display"
                                >
                                  Grade
                                </Button>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Grade Dialog */}
      <Dialog open={gradeStudentId !== null} onOpenChange={(o) => !o && handleGradeCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grade Exam</DialogTitle>
            <DialogDescription>
              Enter score out of 100 for {gradeStudent?.studentName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="score">Score (0-100)</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={100}
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                placeholder="e.g. 85"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleGradeCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmitScore}>Submit Score</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Calendar, Award, Clock, HelpCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { homeworkApi } from "@/lib/api/homework";

interface ViewHomeworkDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  homeworkId: string | null;
}

export function ViewHomeworkDialog({ open, onOpenChange, homeworkId }: ViewHomeworkDialogProps) {
  const { data: homework, isLoading } = useQuery({
    queryKey: ["homeworkDetails", homeworkId],
    queryFn: () => homeworkApi.getTeacherHomeworkById(homeworkId!),
    enabled: !!homeworkId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Homework Details
          </DialogTitle>
          <DialogDescription>View instructions and questions for this homework.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading homework details...</span>
          </div>
        ) : !homework ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Could not load homework details.
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-3 mt-4">
            <div className="space-y-6">
              {/* Header Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-4 rounded-2xl border border-border/55">
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Due Date
                  </div>
                  <div className="mt-1 text-xs font-bold text-foreground">
                    {homework.dueDate ? homework.dueDate.slice(0, 10) : "No deadline"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-muted-foreground flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-500" /> Max Score
                  </div>
                  <div className="mt-1 text-xs font-bold text-foreground">
                    {homework.maxScore} pts
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Time Limit
                  </div>
                  <div className="mt-1 text-xs font-bold text-foreground">
                    {homework.timeLimit && homework.timeLimit > 0
                      ? `${homework.timeLimit} mins`
                      : "Unlimited"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Questions
                  </div>
                  <div className="mt-1 text-xs font-bold text-foreground">
                    {homework.questions?.length ?? homework.totalQuestions ?? 0}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Instructions
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 p-4 rounded-xl border">
                  {homework.instructions || "No instructions provided."}
                </p>
              </div>

              {/* Questions List */}
              {homework.questions && homework.questions.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Questions list
                  </h4>
                  <div className="space-y-3">
                    {homework.questions.map((q: any, idx: number) => (
                      <div
                        key={`${q.id || ""}-${idx}`}
                        className="p-4 rounded-xl border border-border bg-card space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-bold text-primary">Question {idx + 1}</span>
                          {q.points !== undefined && (
                            <span className="text-[10px] font-black bg-muted px-2 py-0.5 rounded-full text-muted-foreground uppercase">
                              {q.points} pt{q.points !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-foreground">{q.prompt}</div>
                        {q.jpPrompt && (
                          <div className="text-sm font-medium text-muted-foreground font-jp">
                            {q.jpPrompt}
                          </div>
                        )}

                        {/* Options */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mt-2">
                            {q.options.map((opt: string, oIdx: number) => {
                              const isCorrect = oIdx === q.correctAnswerIndex;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2.5 rounded-lg border text-xs font-medium transition ${
                                    isCorrect
                                      ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-400"
                                      : "bg-muted/40 border-border text-muted-foreground"
                                  }`}
                                >
                                  <span className="font-bold mr-1">
                                    {String.fromCharCode(65 + oIdx)}.
                                  </span>{" "}
                                  {opt}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="text-xs text-muted-foreground mt-2 bg-muted/20 p-2.5 rounded-lg border-l-2 border-primary">
                            <strong className="text-foreground">Explanation:</strong>{" "}
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

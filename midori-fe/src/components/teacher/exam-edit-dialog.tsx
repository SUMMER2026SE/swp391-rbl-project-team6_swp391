import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Trash2, Check, Loader2 } from "lucide-react";
import { examsApi } from "@/lib/api/exams";
import type { TeacherExamView, JLPTLevel } from "@/types/teacher-exam";

interface ExamEditDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exam: TeacherExamView | null;
  onSave: (updated: TeacherExamView) => void;
}

interface QuestionLocal {
  id?: string;
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
  points: number;
}

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export function ExamEditDialog({ open, onOpenChange, exam, onSave }: ExamEditDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");

  // Basic info states
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<JLPTLevel>("N5");
  const [duration, setDuration] = useState(60);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [scheduledAt, setScheduledAt] = useState("");

  // Questions state
  const [questions, setQuestions] = useState<QuestionLocal[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch full exam details with questions
  const { data: fullExam, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["examEditDetails", exam?.id],
    queryFn: () => examsApi.getExamById(exam!.id),
    enabled: !!exam?.id && open,
  });

  useEffect(() => {
    if (open) {
      setActiveTab("basic");
    }
  }, [open]);

  useEffect(() => {
    if (fullExam) {
      setTitle(fullExam.title);
      setLevel(fullExam.level as JLPTLevel);
      setDuration(fullExam.timeLimit);
      setStatus(fullExam.status);
      setScheduledAt(exam?.scheduledAt || "");

      const loadedQs = (fullExam.questions || []).map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: [...q.options],
        correctAnswerIndex: q.correctAnswerIndex,
        points: q.points ?? 1,
      }));
      setQuestions(loadedQs);
    }
  }, [fullExam]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        prompt: "New Question",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswerIndex: 0,
        points: 1,
      },
    ]);
  };

  const handleDeleteQuestion = (qIndex: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionChange = (qIndex: number, field: keyof QuestionLocal, value: any) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === qIndex ? { ...q, [field]: value } : q)));
  };

  const handleOptionChange = (qIndex: number, oIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx === qIndex) {
          const updatedOptions = [...q.options];
          updatedOptions[oIndex] = val;
          return { ...q, options: updatedOptions };
        }
        return q;
      }),
    );
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx === qIndex) {
          return {
            ...q,
            options: [...q.options, `New Option ${String.fromCharCode(65 + q.options.length)}`],
          };
        }
        return q;
      }),
    );
  };

  const handleDeleteOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx === qIndex) {
          const updatedOptions = q.options.filter((_, oIdx) => oIdx !== oIndex);
          // adjust correct answer index if needed
          let correct = q.correctAnswerIndex;
          if (correct >= updatedOptions.length) {
            correct = 0;
          }
          return { ...q, options: updatedOptions, correctAnswerIndex: correct };
        }
        return q;
      }),
    );
  };

  const handleSave = async () => {
    if (!exam) return;
    if (!title.trim()) {
      toast.error("Please enter an exam title");
      return;
    }
    if (duration <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update basic info and status
      await examsApi.updateExam(exam.id, {
        title: title.trim(),
        level,
        timeLimit: duration,
        status,
        totalQuestions: questions.length,
      });

      // 2. Update questions and options
      await examsApi.updateExamQuestions(exam.id, {
        questions: questions.map((q, index) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          points: q.points,
          displayOrder: index + 1,
        })),
      });

      toast.success("Exam updated successfully!");
      onSave({
        ...exam,
        title: title.trim(),
        level,
        duration,
        totalQuestions: questions.length,
        status: status === "PUBLISHED" ? "Scheduled" : status === "ARCHIVED" ? "Archived" : "Draft",
        scheduledAt,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update exam");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Edit Exam</DialogTitle>
          <DialogDescription>Modify exam settings, questions, and status below.</DialogDescription>
        </DialogHeader>

        {isLoadingDetails ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading exam details...</span>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0 mt-2"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info & Status</TabsTrigger>
              <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 py-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="exam-title">Title</Label>
                <Input
                  id="exam-title"
                  placeholder="e.g. N5 Mid-term Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exam-level">Level</Label>
                  <Select value={level} onValueChange={(v) => setLevel(v as JLPTLevel)}>
                    <SelectTrigger id="exam-level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {JLPT_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exam-status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                    <SelectTrigger id="exam-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exam-duration">Duration (minutes)</Label>
                  <Input
                    id="exam-duration"
                    type="number"
                    min={1}
                    max={300}
                    placeholder="60"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exam-scheduled">Scheduled Date</Label>
                  <Input
                    id="exam-scheduled"
                    type="date"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions" className="flex-1 flex flex-col min-h-0 py-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-muted-foreground">
                  Manage exam questions & options
                </span>
                <Button size="sm" onClick={handleAddQuestion} className="h-8 gap-1">
                  <Plus className="w-4 h-4" /> Add Question
                </Button>
              </div>

              <ScrollArea className="flex-1 pr-3">
                <div className="space-y-4">
                  {questions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      className="p-4 rounded-xl border border-border bg-card space-y-4"
                    >
                      {/* Question Header */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-primary">Question {qIdx + 1}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <Label
                              htmlFor={`q-${qIdx}-pts`}
                              className="text-[10px] font-bold text-muted-foreground uppercase"
                            >
                              Points
                            </Label>
                            <Input
                              id={`q-${qIdx}-pts`}
                              type="number"
                              className="w-14 h-7 text-xs"
                              value={q.points}
                              onChange={(e) =>
                                handleQuestionChange(qIdx, "points", parseInt(e.target.value) || 1)
                              }
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteQuestion(qIdx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`q-${qIdx}-prompt`}
                          className="text-[10px] font-bold text-muted-foreground uppercase"
                        >
                          Question Prompt
                        </Label>
                        <Input
                          id={`q-${qIdx}-prompt`}
                          value={q.prompt}
                          onChange={(e) => handleQuestionChange(qIdx, "prompt", e.target.value)}
                        />
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                            Options (Select correct option)
                          </Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddOption(qIdx)}
                            className="h-6 text-[10px] gap-0.5"
                          >
                            <Plus className="w-3 h-3" /> Add Option
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = q.correctAnswerIndex === oIdx;
                            return (
                              <div key={oIdx} className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={`h-7 w-7 border shrink-0 rounded-full ${
                                    isCorrect
                                      ? "bg-emerald-500 border-emerald-600 text-white"
                                      : "border-border text-muted-foreground"
                                  }`}
                                  onClick={() =>
                                    handleQuestionChange(qIdx, "correctAnswerIndex", oIdx)
                                  }
                                >
                                  {isCorrect ? (
                                    <Check className="w-3.5 h-3.5" />
                                  ) : (
                                    String.fromCharCode(65 + oIdx)
                                  )}
                                </Button>
                                <Input
                                  value={opt}
                                  onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                  className="h-8 text-xs"
                                />
                                {q.options.length > 2 && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                    onClick={() => handleDeleteOption(qIdx, oIdx)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-4 pt-4 border-t gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoadingDetails}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

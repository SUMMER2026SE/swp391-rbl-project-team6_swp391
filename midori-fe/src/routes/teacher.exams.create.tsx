import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { examsApi } from "@/lib/api/exams";
import { AiPdfImportWorkflow } from "@/components/admin/AiPdfImportWorkflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { teacherQuestionsApi, type TeacherQuestionResponse } from "@/lib/api/teacherQuestions";
import { SuccessBanner } from "@/components/teacher/dialogs";
import type { ImportedQuestion } from "@/components/admin/pdf-import/QuestionEditor";
import { QuestionEditor } from "@/components/question-builder/QuestionEditor";
import { QuestionPreview } from "@/components/question-builder/QuestionPreview";
import type { BuilderQuestion } from "@/types/question";
import {
  mapTeacherQuestionResponsesToBuilderQuestions,
  mapBuilderQuestionToRequest,
  normalizeImportedQuestionType,
} from "@/lib/teacherHomeworkMapping";
import {
  ArrowLeft,
  Copy,
  Trash2,
  FileText,
  HelpCircle,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Plus,
  Save,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ClassLockNotice } from "@/components/teacher/ClassLockNotice";
import { TeacherMethodLayout } from "@/components/teacher/TeacherMethodLayout";

type Method = "ai-pdf" | "question-bank";

export const Route = createFileRoute("/teacher/exams/create")({
  validateSearch: (s: Record<string, unknown>) => ({
    classId: typeof s.classId === "string" ? s.classId : undefined,
    source: s.source === "question-bank" ? ("question-bank" as const) : undefined,
    topicId: typeof s.topicId === "string" ? s.topicId : undefined,
  }),
  component: CreateExam,
});

function CreateExam() {
  const { classId, source, topicId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });
  const lockedClass = classId ? classes.find((c) => c.id === classId) : null;
  const init: Method | null = (source as Method) ?? null;
  const [method, setMethod] = useState<Method | null>(init);
  const [done, setDone] = useState<string | null>(null);
  const [createdClassId, setCreatedClassId] = useState<string | null>(null);

  const handleBack = () => {
    if (classId) {
      navigate({ to: `/teacher/classes/${classId}` });
    } else {
      navigate({ to: "/teacher/exams" });
    }
  };

  const handleDone = (title: string, assignedClassId: string) => {
    setCreatedClassId(assignedClassId);
    setDone(title);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <SuccessBanner title="Exam published">{done} is now scheduled for the class.</SuccessBanner>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setMethod(null);
              setDone(null);
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Create another
          </Button>
          {createdClassId && (
            <Button asChild variant="outline">
              <Link
                to="/teacher/classes/$classId/homework"
                params={{ classId: createdClassId }}
                search={{ q: "" }}
              >
                View class exams
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/teacher/exams">Back to exams</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!method) {
    return (
      <TeacherMethodLayout
        eyebrow="New exam"
        title="How do you want to create this exam?"
        subtitle="Pick the source of the questions and content."
        showBack={true}
        onBack={handleBack}
        lockedClass={lockedClass}
      >
        <div className="grid gap-5 md:grid-cols-2 w-full max-w-4xl mx-auto">
          <MethodCard
            icon={Sparkles}
            title="AI PDF Exam"
            desc="Upload a PDF and let AI generate exam questions automatically."
            onClick={() => setMethod("ai-pdf")}
          />
          <MethodCard
            icon={HelpCircle}
            title="From Question Bank"
            desc="Generate exam questions by selecting topics and difficulty."
            onClick={() => setMethod("question-bank")}
          />
        </div>
      </TeacherMethodLayout>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => setMethod(null)} className="-ml-2">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Change method
      </Button>
      {method === "ai-pdf" && (
        <ExamAiPdf
          lockedClass={lockedClass}
          onDone={handleDone}
        />
      )}
      {method === "ai-generate" && <AiExamGenerate lockedClass={lockedClass} onDone={handleDone} />}
      {method === "question-bank" && (
        <QuestionBankExam lockedClass={lockedClass} topicId={topicId} onDone={handleDone} />
      )}
    </div>
  );
}

function MethodCard({
  icon: Icon,
  title,
  desc,
  badge,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border bg-card p-5 text-left transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        {badge && (
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function QuestionBankExam({
  lockedClass,
  onDone,
}: {
  lockedClass: any | null;
  topicId?: string;
  onDone: (t: string, classId: string) => void;
}) {
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });

  const [step, setStep] = useState<number>(1);
  const [level, setLevel] = useState<string>("");
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [totalQuestionsInput, setTotalQuestionsInput] = useState<number>(30);
  const [difficultyPercent, setDifficultyPercent] = useState({ easy: 40, medium: 40, hard: 20 });

  const [metadata, setMetadata] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: "",
    dueDate: "",
    duration: 60,
    attempts: 1,
    maxScore: 100,
  });

  useEffect(() => {
    if (!metadata.classId) {
      const targetId = lockedClass?.id ?? classes[0]?.id;
      if (targetId) {
        setMetadata((prev) => ({ ...prev, classId: targetId }));
      }
    }
  }, [lockedClass, classes, metadata.classId]);

  const [preview, setPreview] = useState<TeacherQuestionResponse[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Editable preview state (BuilderQuestions)
  const [editableQuestions, setEditableQuestions] = useState<BuilderQuestion[]>([]);
  const [showQuestionPreview, setShowQuestionPreview] = useState(false);

  const {
    data: availableSkills = [],
    error: skillsError,
    refetch: refetchSkills,
  } = useQuery({
    queryKey: ["questionBankSkills"],
    queryFn: async () => {
      const res = await teacherQuestionsApi.getQuestionBankSkills();
      return res;
    },
  });

  const {
    data: lessons = [],
    isLoading: isLoadingLessons,
    error: lessonsError,
    refetch: refetchLessons,
  } = useQuery({
    queryKey: ["questionBankLessonsByLevel", level],
    queryFn: async () => {
      if (!level) return [];
      const res = await teacherQuestionsApi.getQuestionBankLessons(level, [
        "VOCABULARY",
        "GRAMMAR",
        "READING",
      ]);
      return res;
    },
    enabled: !!level,
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    setSelectedLessons([]);
    setSelectedSkills([]);
    setPreview(null);
    setBackendError(null);
    setStep(2);
  };

  const handleLessonToggle = (lessonId: number) => {
    setSelectedLessons((prev) => {
      const updated = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      setSelectedSkills([]);
      setPreview(null);
      setBackendError(null);
      return updated;
    });
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) => {
      const updated = prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill];
      setPreview(null);
      setBackendError(null);
      return updated;
    });
  };

  // ─── Question Editing Handlers ───────────────────────────────────────────────

  const handleUpdateQuestion = (idx: number, updated: Partial<BuilderQuestion>) => {
    setEditableQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...updated } : q)));
  };

  const handleDeleteQuestion = (idx: number) => {
    setEditableQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDuplicateQuestion = (idx: number) => {
    const q = editableQuestions[idx];
    const dup: BuilderQuestion = {
      ...q,
      id: `bank-q-dup-${Date.now()}`,
      content: q.content + " (copy)",
    };
    setEditableQuestions((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next;
    });
  };

  const handleMoveQuestion = (idx: number, direction: "up" | "down") => {
    setEditableQuestions((prev) => {
      const next = [...prev];
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const easyCount = Math.round((difficultyPercent.easy * totalQuestionsInput) / 100);
  const mediumCount = Math.round((difficultyPercent.medium * totalQuestionsInput) / 100);
  const hardCount = Math.max(0, totalQuestionsInput - (easyCount + mediumCount));

  const percentSum = difficultyPercent.easy + difficultyPercent.medium + difficultyPercent.hard;
  const isValidDistribution = percentSum === 100;

  const handleGeneratePreview = async () => {
    if (selectedLessons.length === 0 || selectedSkills.length === 0) {
      toast.error("Please complete steps 2 and 3 first.");
      return;
    }

    if (!isValidDistribution) {
      toast.error("Difficulty distribution must equal exactly 100%.");
      return;
    }

    setIsGenerating(true);
    setBackendError(null);
    try {
      const res = await teacherQuestionsApi.generatePreview({
        level,
        skills: selectedSkills,
        lessonIds: selectedLessons,
        difficulty: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount,
        },
      });
      setPreview(res);
      // Convert to editable BuilderQuestions
      setEditableQuestions(mapTeacherQuestionResponsesToBuilderQuestions(res));
      setStep(5);
      toast.success(`Generated ${res.length} questions. Review and edit before saving.`);
    } catch (err: any) {
      const errMsg = err?.message || "Failed to generate randomized questions.";
      setBackendError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAssign = async () => {
    if (editableQuestions.length === 0) return;
    if (!metadata.classId || !metadata.dueDate || !metadata.title) {
      toast.error("Please fill in target class, title, and due date.");
      return;
    }
    if (new Date(metadata.dueDate).getTime() < new Date().getTime()) {
      toast.error("Due date cannot be in the past.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save editable questions to the teacher question bank
      const batchQuestions = editableQuestions.map((q) =>
        mapBuilderQuestionToRequest(q, level, "EXAM")
      );
      const batchRes = await teacherQuestionsApi.createQuestionsBatch({
        questions: batchQuestions,
      });
      const savedQuestionIds = batchRes.savedQuestions.map((q) => q.id);

      // 2. Create exam with saved question IDs
      await examsApi.createExam({
        title: metadata.title,
        level: level,
        totalQuestions: savedQuestionIds.length,
        timeLimit: metadata.duration,
        classIds: metadata.classId ? [metadata.classId] : [],
        questionIds: savedQuestionIds,
        status: "PUBLISHED",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["exams"] }),
        queryClient.invalidateQueries({ queryKey: ["teacherQuestions"] }),
        ...(metadata.classId
          ? [
              queryClient.invalidateQueries({ queryKey: ["examsByClass", metadata.classId] }),
              queryClient.invalidateQueries({ queryKey: ["classExams", metadata.classId] }),
            ]
          : []),
      ]);

      toast.success("Exam published successfully!");
      onDone(metadata.title, metadata.classId);
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish exam.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (editableQuestions.length === 0) return;
    if (!metadata.title) {
      toast.error("Please enter a title before saving as draft.");
      return;
    }

    setIsSavingDraft(true);
    try {
      const batchQuestions = editableQuestions.map((q) =>
        mapBuilderQuestionToRequest(q, level, "EXAM")
      );
      await teacherQuestionsApi.createQuestionsBatch({ questions: batchQuestions });

      await queryClient.invalidateQueries({ queryKey: ["teacherQuestions"] });

      toast.success("Draft saved to question bank!");
      onDone(metadata.title, metadata.classId);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="From Question Bank · Refactored Workflow"
        title="Generate practice exam"
        subtitle="Generate custom exam sets directly from the Admin Question Bank."
      />

      <div className="grid grid-cols-6 gap-2 border-b pb-4">
        {[
          { num: 1, label: "JLPT Level", active: step >= 1 },
          { num: 2, label: "Lessons", active: step >= 2 },
          { num: 3, label: "Skills", active: step >= 3 },
          { num: 4, label: "Configure", active: step >= 4 },
          { num: 5, label: "Preview", active: step >= 5 },
          { num: 6, label: "Exam Info", active: step >= 6 },
        ].map((s) => (
          <button
            key={s.num}
            disabled={
              (s.num === 2 && !level) ||
              (s.num === 3 && selectedLessons.length === 0) ||
              (s.num === 4 && selectedSkills.length === 0) ||
              (s.num === 5 && !preview) ||
              (s.num === 6 && !preview)
            }
            onClick={() => setStep(s.num)}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-center border-b-2 text-xs font-bold transition-all",
              step === s.num
                ? "border-primary text-primary"
                : s.active
                  ? "border-primary/40 text-primary/70"
                  : "border-transparent text-muted-foreground opacity-50",
            )}
          >
            <span>Step {s.num}</span>
            <span className="hidden md:inline text-[10px]">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {step === 1 && (
            <Card className="overflow-hidden border-[var(--border)] bg-card shadow-sm">
              <CardHeader className="bg-[var(--accent)]/10 pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    1
                  </span>
                  Select JLPT Level
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {["N5", "N4", "N3", "N2", "N1"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleLevelChange(lvl)}
                      className={cn(
                        "px-6 py-4 rounded-xl border text-base font-bold transition-all duration-200",
                        level === lvl
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-[var(--border)] hover:border-primary/50 text-secondary-col",
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="overflow-hidden border-[var(--border)] bg-card shadow-sm">
              <CardHeader className="bg-[var(--accent)]/10 pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    2
                  </span>
                  Select Lessons (Level {level})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoadingLessons ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : lessonsError ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-destructive font-semibold mb-2">
                      Failed to load lessons.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => refetchLessons()}>
                      Retry
                    </Button>
                  </div>
                ) : lessons.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-xl p-4">
                    No questions available.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {lessons.map((les) => (
                      <button
                        key={les.id}
                        onClick={() => handleLessonToggle(les.id)}
                        type="button"
                        className={cn(
                          "rounded-xl border p-3.5 text-left transition-all duration-200",
                          selectedLessons.includes(les.id)
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-[var(--border)] hover:border-primary/40 bg-card",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-bold text-primary-col">
                            {les.name || (les as any).lessonName || `Lesson ${les.id}`}
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedLessons.includes(les.id)}
                            readOnly
                            className="rounded border-[var(--border)] text-primary focus:ring-primary h-4 w-4 mt-0.5"
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground font-semibold">
                          <span>Easy: {les.easy ?? 0}</span>
                          <span>•</span>
                          <span>Medium: {les.medium ?? 0}</span>
                          <span>•</span>
                          <span>Hard: {les.hard ?? 0}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex justify-between mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button disabled={selectedLessons.length === 0} onClick={() => setStep(3)}>
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="overflow-hidden border-[var(--border)] bg-card shadow-sm">
              <CardHeader className="bg-[var(--accent)]/10 pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    3
                  </span>
                  Select Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {skillsError ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-destructive font-semibold mb-2">
                      Failed to load skills.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => refetchSkills()}>
                      Retry
                    </Button>
                  </div>
                ) : availableSkills.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No skills available.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {availableSkills.map((skill) => (
                      <label
                        key={skill}
                        className={cn(
                          "flex items-center gap-2 px-5 py-4 rounded-xl border cursor-pointer select-none transition-all duration-200",
                          selectedSkills.includes(skill)
                            ? "border-primary bg-primary/5 text-primary-col"
                            : "border-[var(--border)] hover:border-primary/40 text-secondary-col",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-[var(--border)] text-primary focus:ring-primary h-4 w-4"
                          checked={selectedSkills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                        />
                        <span className="text-sm font-semibold capitalize">
                          {skill.toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button disabled={selectedSkills.length === 0} onClick={() => setStep(4)}>
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="overflow-hidden border-[var(--border)] bg-card shadow-sm">
              <CardHeader className="bg-[var(--accent)]/10 pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    4
                  </span>
                  Configure Question Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-col uppercase">
                    Total Questions
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm font-bold"
                    value={totalQuestionsInput === 0 ? "" : totalQuestionsInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setTotalQuestionsInput(0);
                      } else {
                        const parsed = parseInt(val, 10);
                        setTotalQuestionsInput(isNaN(parsed) ? 0 : Math.max(0, parsed));
                      }
                      setBackendError(null);
                    }}
                    onBlur={() => {
                      if (totalQuestionsInput < 1) setTotalQuestionsInput(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-col uppercase block mb-1">
                    Difficulty Distribution (%)
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-col">Easy (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-center font-bold"
                        value={difficultyPercent.easy === 0 ? "" : difficultyPercent.easy}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = val === "" ? 0 : parseInt(val, 10);
                          const num = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
                          setDifficultyPercent({
                            ...difficultyPercent,
                            easy: num,
                          });
                          setBackendError(null);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-col">Medium (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-center font-bold"
                        value={difficultyPercent.medium === 0 ? "" : difficultyPercent.medium}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = val === "" ? 0 : parseInt(val, 10);
                          const num = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
                          setDifficultyPercent({
                            ...difficultyPercent,
                            medium: num,
                          });
                          setBackendError(null);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-col">Hard (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-center font-bold"
                        value={difficultyPercent.hard === 0 ? "" : difficultyPercent.hard}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = val === "" ? 0 : parseInt(val, 10);
                          const num = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
                          setDifficultyPercent({
                            ...difficultyPercent,
                            hard: num,
                          });
                          setBackendError(null);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-2 text-xs font-bold">
                  <div className="flex justify-between">
                    <span>Distribution Sum:</span>
                    <span
                      className={cn(isValidDistribution ? "text-green-600" : "text-destructive")}
                    >
                      {percentSum}% / 100% {isValidDistribution ? "✓" : "✗"}
                    </span>
                  </div>
                  {!isValidDistribution && (
                    <p className="text-[10px] text-destructive font-semibold">
                      Error: The sum of Easy, Medium, and Hard percentages must equal exactly 100%.
                    </p>
                  )}
                  <div className="border-t border-[var(--border)] pt-2 space-y-1 text-muted-col font-medium">
                    <div className="flex justify-between">
                      <span>Easy:</span>
                      <span>
                        {easyCount} question(s) ({difficultyPercent.easy}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium:</span>
                      <span>
                        {mediumCount} question(s) ({difficultyPercent.medium}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hard:</span>
                      <span>
                        {hardCount} question(s) ({difficultyPercent.hard}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button
                    disabled={!isValidDistribution || totalQuestionsInput <= 0 || isGenerating}
                    onClick={handleGeneratePreview}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      "Generate Preview"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Edit Generated Questions */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 bg-[var(--accent)]/50 p-4 rounded-xl border border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="font-display font-bold text-primary-col">
                      {editableQuestions.length} Questions Ready to Edit
                    </h3>
                  </div>
                  <p className="text-xs text-muted-col mt-0.5">
                    Review, edit, reorder, duplicate, or delete questions before publishing.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuestionPreview(true)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isGenerating}
                    onClick={handleGeneratePreview}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                  <Button size="sm" onClick={() => setStep(6)}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {editableQuestions.map((q, idx) => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    index={idx}
                    totalQuestions={editableQuestions.length}
                    onUpdateQuestion={handleUpdateQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onDuplicateQuestion={handleDuplicateQuestion}
                    onMoveQuestion={handleMoveQuestion}
                  />
                ))}
              </div>
            </div>
          )}

          {showQuestionPreview && (
            <div
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowQuestionPreview(false)}
            >
              <div
                className="bg-background rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">
                    {metadata.title || "Exam Preview"}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowQuestionPreview(false)}>
                    Close
                  </Button>
                </div>
                <div className="p-6">
                  <QuestionPreview questions={editableQuestions} />
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <Card className="border-[var(--border)] bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    6
                  </span>
                  Exam Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                    Target class
                  </Label>
                  {lockedClass ? (
                    <div className="flex items-center gap-2 rounded-lg border bg-[var(--accent)]/50 p-2.5">
                      <LevelBadge level={lockedClass.level} />
                      <span className="text-sm font-semibold">{lockedClass.name}</span>
                      <span className="ml-auto text-[10px] font-bold uppercase text-muted-col bg-muted border px-1.5 py-0.5 rounded">
                        Locked
                      </span>
                    </div>
                  ) : (
                    <Select
                      value={metadata.classId}
                      onValueChange={(v: string) => setMetadata({ ...metadata, classId: v })}
                    >
                      <SelectTrigger className="w-full rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                    Title
                  </Label>
                  <Input
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    placeholder="E.g., N5 Grammar Assessment"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                      Due date
                    </Label>
                    <Input
                      type="datetime-local"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                      value={metadata.dueDate}
                      onChange={(e) => setMetadata({ ...metadata, dueDate: e.target.value })}
                      min={(() => {
                        const now = new Date();
                        const tzOffset = now.getTimezoneOffset() * 60000;
                        return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
                      })()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                      Duration (min)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                      value={metadata.duration}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          duration: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                      Max score
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                      value={metadata.maxScore}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          maxScore: Math.max(1, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>

                </div>

                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(5)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Questions
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={editableQuestions.length === 0 || isSavingDraft}
                      onClick={handleSaveDraft}
                    >
                      {isSavingDraft ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isSavingDraft ? "Saving..." : "Save Draft"}
                    </Button>
                    <Button
                      className="flex items-center gap-1.5"
                      disabled={editableQuestions.length === 0 || isSaving}
                      onClick={handleAssign}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isSaving ? "Publishing..." : "Publish Exam"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {backendError && (
            <div className="p-4 rounded-xl bg-[var(--status-rejected)]/10 border border-[var(--status-rejected)]/20 text-[var(--status-rejected)] text-sm flex flex-col gap-2 shadow-sm">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Randomization Failed</span>
              </div>
              <p className="whitespace-pre-line text-xs font-semibold leading-relaxed pl-7">
                {backendError}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="border-[var(--border)] bg-card shadow-sm p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-secondary-col mb-3">
              Exam Configuration
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">JLPT Level:</span>
                <span className="font-bold">{level || "Not selected"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lessons Selected:</span>
                <span className="font-bold">{selectedLessons.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skills:</span>
                <span className="font-bold">
                  {selectedSkills.length > 0 ? selectedSkills.join(", ") : "None"}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground font-bold">Generated Questions:</span>
                <span className="font-extrabold text-primary">{preview ? preview.length : 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ExamAiPdf({
  lockedClass,
  onDone,
}: {
  lockedClass: { id: string; name: string; level: string } | null;
  onDone: (t: string, classId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });

  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [metadata, setMetadata] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: "",
    dueDate: "",
    duration: 60,
  });
  const [submitting, setSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    if (!metadata.classId) {
      const targetId = lockedClass?.id ?? classes[0]?.id;
      if (targetId) {
        setMetadata((prev) => ({ ...prev, classId: targetId }));
      }
    }
  }, [lockedClass, classes, metadata.classId]);

  const selectedClass =
    lockedClass ?? classes.find((c) => c.id === metadata.classId) ?? null;
  const targetLevel = selectedClass?.level || "N5";

  const [savedQuestionIds, setSavedQuestionIds] = useState<string[]>([]);
  const [savingQuestions, setSavingQuestions] = useState(false);

  const persistQuestionsToBank = async (items: ImportedQuestion[]): Promise<string[]> => {
    if (items.length === 0) throw new Error("No questions to save.");

    const hasUnresolved = items.some(
      (q) => q.answers.findIndex((a) => a.isCorrect) === -1
    );
    if (hasUnresolved) {
      toast({
        title: "Validation Error",
        description: "One or more questions are missing a correct answer. Please resolve them first.",
        variant: "destructive",
      });
      throw new Error("Unresolved correct answers");
    }

    const savedIds: string[] = [];
    for (const q of items) {
      const correctIndex = q.answers.findIndex((a) => a.isCorrect);
      const res = await teacherQuestionsApi.createQuestion({
        prompt: q.content,
        options: q.answers.map((a) => a.content),
        correctAnswerIndex: correctIndex,
        points: 1,
        questionType: normalizeImportedQuestionType(q.type),
        difficulty: q.difficulty as "EASY" | "MEDIUM" | "HARD",
        explanation: q.explanation || "",
        level: targetLevel,
        skill: (q.category || "Vocabulary").toUpperCase(),
        source: "EXAM",
      });
      savedIds.push(res.id);
    }
    return savedIds;
  };

  const handleCreateQuestions = async (items: ImportedQuestion[]) => {
    setQuestions(items);
    setAssignError(null);
    setSavingQuestions(true);
    try {
      const ids = await persistQuestionsToBank(items);
      setSavedQuestionIds(ids);
      toast.success(`Saved ${items.length} questions to your question bank.`);
    } catch (err: any) {
      setAssignError(
        err?.message || "Failed to save questions to your question bank."
      );
      toast.error(err?.message || "Failed to save questions to your question bank.");
      setSavedQuestionIds([]);
    } finally {
      setSavingQuestions(false);
    }
  };

  const handleAssign = async () => {
    setAssignError(null);
    let idsToUse = savedQuestionIds;

    if (idsToUse.length === 0 && questions.length > 0) {
      setSavingQuestions(true);
      try {
        idsToUse = await persistQuestionsToBank(questions);
        setSavedQuestionIds(idsToUse);
      } catch (err: any) {
        setSavingQuestions(false);
        setAssignError(
          err?.message || "Failed to save questions to your question bank."
        );
        toast.error(err?.message || "Failed to save questions to your question bank.");
        return;
      }
      setSavingQuestions(false);
    }

    if (idsToUse.length === 0) {
      const msg = "Generate and save at least one question before assigning.";
      setAssignError(msg);
      toast.error(msg);
      return;
    }

    if (!metadata.classId || !metadata.title || !metadata.dueDate) {
      const msg = "Please fill in target class, title, and due date before assigning.";
      setAssignError(msg);
      toast.error(msg);
      return;
    }
    if (new Date(metadata.dueDate).getTime() < new Date().getTime()) {
      const msg = "Due date cannot be in the past.";
      setAssignError(msg);
      toast.error(msg);
      return;
    }

    if (questions.length === 0) {
      toast.error("No questions to assign.");
      return;
    }

    const hasUnresolved = questions.some((q) => q.answers.findIndex((ans) => ans.isCorrect) === -1);
    if (hasUnresolved) {
      toast.error("One or more questions are missing a correct answer. Please resolve them first.");
      return;
    }

    const selectedClass = lockedClass || classes.find((c) => c.id === metadata.classId);
    const targetLevel = selectedClass?.level || "N5";

    setSubmitting(true);
    try {
      const examTitle =
        metadata.title || `AI PDF Exam - ${idsToUse.length} questions`;
      const savedExam = await examsApi.createExam({
        title: examTitle,
        level: targetLevel,
        totalQuestions: idsToUse.length,
        timeLimit: metadata.duration,
        classIds: metadata.classId ? [metadata.classId] : [],
        questionIds: idsToUse,
        status: "PUBLISHED",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["exams"] }),
        queryClient.invalidateQueries({ queryKey: ["teacherExams"] }),
        ...(metadata.classId
          ? [
              queryClient.invalidateQueries({ queryKey: ["examsByClass", metadata.classId] }),
              queryClient.invalidateQueries({ queryKey: ["classExams", metadata.classId] }),
            ]
          : []),
      ]);

      toast.success("Exam published successfully!");
      onDone(examTitle, savedExam.id);
    } catch (err: any) {
      setAssignError(err?.message || "Failed to publish exam.");
      toast.error(err?.message || "Failed to publish exam.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI PDF Exam · Refactored Workflow"
        title="Generate exam from a PDF"
        subtitle="Upload any PDF (vocabulary lists, grammar notes, reading passages) and let AI generate exam questions."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <AiPdfImportWorkflow
            onCreate={async (items) => {
              await handleCreateQuestions(items);
            }}
            title="AI PDF Exam"
            subtitle="Upload a PDF and let AI generate exam questions automatically."
            backHref="/teacher/exams"
            backLabel="Back to exams"
            enabled={true}
            disabledReason=""
          />

          {questions.length > 0 && (
            <div className="card-base p-4 border border-[var(--border)]">
              <p className="text-xs text-muted-foreground">
                Saved <strong>{questions.length}</strong> questions to the teacher question bank.
                Configure the exam details and click <strong>Publish Exam</strong> to go live.
              </p>
            </div>
          )}
        </div>

        <Card className="border-[var(--border)] bg-card shadow-sm p-4 space-y-4 h-fit">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-secondary-col">
            Exam Settings
          </h3>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-secondary-col">
              Target class
            </Label>
            {lockedClass ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-sm">
                <span>{lockedClass.name}</span>
                <span className="ml-auto text-[10px] uppercase text-muted-foreground">Locked</span>
              </div>
            ) : (
              <Select
                value={metadata.classId}
                onValueChange={(v) => setMetadata({ ...metadata, classId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-secondary-col">
              Title
            </Label>
            <Input
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              placeholder="E.g., N5 Midterm Exam"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-secondary-col">
                Due date
              </Label>
              <Input
                type="date"
                value={metadata.dueDate}
                onChange={(e) => setMetadata({ ...metadata, dueDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-secondary-col">
                Duration (min)
              </Label>
              <Input
                type="number"
                value={metadata.duration}
                onChange={(e) =>
                  setMetadata({ ...metadata, duration: Number(e.target.value) || 60 })
                }
              />
            </div>
          </div>

          {assignError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
              {assignError}
            </div>
          )}

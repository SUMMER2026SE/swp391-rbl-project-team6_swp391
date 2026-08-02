import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { examsApi } from "@/lib/api/exams";
import { AiExamGenerate } from "@/components/teacher/AiExamGenerate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { teacherQuestionsApi, type TeacherQuestionResponse } from "@/lib/api/teacherQuestions";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import { SuccessBanner } from "@/components/teacher/dialogs";
import { QuestionEditor, ImportedQuestion } from "@/components/admin/pdf-import/QuestionEditor";
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  ArrowRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Method = "ai-pdf" | "question-bank" | "ai-generate";

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
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="New exam"
          title="How do you want to create this exam?"
          subtitle="Pick the source of the questions and content."
          showBack={true}
          onBack={handleBack}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <MethodCard
            icon={Sparkles}
            title="AI PDF Exam"
            desc="Upload a PDF and let AI generate exam questions automatically."
            badge="AI Generator"
            onClick={() => setMethod("ai-pdf")}
          />
          <MethodCard
            icon={Sparkles}
            title="AI Generate Exam"
            desc="Select a lesson and AI will generate exam questions from the content library."
            badge="AI · Smart"
            onClick={() => setMethod("ai-generate")}
          />
          <MethodCard
            icon={HelpCircle}
            title="From Question Bank"
            desc="Generate exam questions by selecting topics and difficulty."
            badge="Generator"
            onClick={() => setMethod("question-bank")}
          />
        </div>
        {lockedClass && (
          <p className="text-center text-xs text-muted-foreground">
            Class locked: <b>{lockedClass.name}</b>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => setMethod(null)} className="-ml-2">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Change method
      </Button>
      {method === "ai-pdf" && <ExamAiPdfFlow lockedClass={lockedClass} onDone={handleDone} />}
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
  badge: string;
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
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {badge}
        </span>
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

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
      setStep(5);
      toast.success(`Generated preview of ${res.length} questions successfully!`);
    } catch (err: any) {
      const errMsg = err?.message || "Failed to generate randomized questions.";
      setBackendError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAssign = async () => {
    if (!preview || preview.length === 0) return;
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
      const questionIds = preview.map((q) => q.id);

      await examsApi.createExam({
        title: metadata.title,
        level: level,
        totalQuestions: preview.length,
        timeLimit: metadata.duration,
        classIds: metadata.classId ? [metadata.classId] : [],
        questionIds: questionIds,
        status: "PUBLISHED",
      });

      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      if (metadata.classId) {
        await queryClient.invalidateQueries({ queryKey: ["examsByClass", metadata.classId] });
        await queryClient.invalidateQueries({ queryKey: ["classExams", metadata.classId] });
      }

      toast.success("Exam published successfully!");
      onDone(metadata.title, metadata.classId);
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign exam.");
    } finally {
      setIsSaving(false);
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

          {step === 5 && preview && (
            <Card className="border-[var(--border)] bg-card shadow-sm">
              <CardHeader className="bg-[var(--accent)]/10 pb-3 border-b border-[var(--border)] flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Generated Preview ({preview.length} Questions)
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs flex items-center gap-1"
                  disabled={isGenerating}
                  onClick={handleGeneratePreview}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Again
                </Button>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-[var(--border)]">
                {preview.map((q, i) => (
                  <div
                    key={q.id}
                    className="p-4 flex items-start gap-4 transition-all hover:bg-[var(--accent)]/10"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {q.skill}
                        </span>
                        <DifficultyBadge
                          d={
                            q.difficulty === "EASY"
                              ? "Easy"
                              : q.difficulty === "HARD"
                                ? "Hard"
                                : "Medium"
                          }
                        />
                        <span className="ml-auto text-xs text-muted-col font-bold">
                          {q.points || 1} pt(s)
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-primary-col leading-relaxed">
                        {q.prompt}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <div className="grid gap-1.5 sm:grid-cols-2 mt-2 pl-2 border-l-2 border-[var(--border)]">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={cn(
                                "text-xs px-2.5 py-1.5 rounded-md border",
                                optIdx === q.correctAnswerIndex
                                  ? "bg-green-500/10 border-green-500/30 text-green-700 font-bold"
                                  : "bg-[var(--accent)] border-[var(--border)] text-secondary-col",
                              )}
                            >
                              <span className="font-bold mr-1.5">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between p-4 border-t">
                  <Button variant="outline" onClick={() => setStep(4)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(6)}>Next</Button>
                </div>
              </CardContent>
            </Card>
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
                    Back
                  </Button>
                  <Button
                    className="flex items-center gap-1.5"
                    disabled={!preview || isSaving}
                    onClick={handleAssign}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Publish Exam
                      </>
                    )}
                  </Button>
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

function ExamAiPdfFlow({
  lockedClass,
  onDone,
}: {
  lockedClass: any | null;
  onDone: (t: string, classId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });

  const [step, setStep] = useState<"upload" | "preview" | "assign">("upload");
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const [metadata, setMetadata] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: "",
    dueDate: "",
    duration: 60,
  });

  const handleUpdateQuestion = (idx: number, updatedFields: Partial<ImportedQuestion>) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updatedFields };
      return copy;
    });
  };

  const handleDeleteQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDuplicateQuestion = (idx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const target = copy[idx];
      const duplicated = {
        ...target,
        id: `extracted-${Date.now()}-dup`,
        content: `${target.content} (Copy)`,
        answers: target.answers.map((ans: { content: string; isCorrect: boolean }) => ({ ...ans })),
      };
      copy.splice(idx + 1, 0, duplicated);
      return copy;
    });
  };

  const handleMoveQuestion = (idx: number, direction: "up" | "down") => {
    setQuestions((prev) => {
      const copy = [...prev];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleReAnalyze = (_idx: number) => {
    // Disabled (Coming Soon)
  };

  const handleAddQuestion = () => {
    const newQuestion: ImportedQuestion = {
      id: `extracted-${Date.now()}-manual`,
      type: "MULTIPLE_CHOICE",
      content: "",
      difficulty: "MEDIUM",
      explanation: "",
      answers: [
        { content: "", isCorrect: true },
        { content: "", isCorrect: false },
      ],
      category: "Vocabulary",
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleFileUpload = () => {
    // Simulate AI parsing with sample questions
    const sampleQuestions: ImportedQuestion[] = [
      {
        id: "sample-1",
        type: "MULTIPLE_CHOICE",
        content: "What is the meaning of 学校 (がっこう)?",
        difficulty: "EASY",
        explanation: "School in Japanese",
        answers: [
          { content: "School", isCorrect: true },
          { content: "Hospital", isCorrect: false },
          { content: "Library", isCorrect: false },
          { content: "Park", isCorrect: false },
        ],
        category: "Vocabulary",
      },
      {
        id: "sample-2",
        type: "MULTIPLE_CHOICE",
        content: "Which particle is used to mark the topic of a sentence?",
        difficulty: "MEDIUM",
        explanation: "は (wa) is the topic marker particle",
        answers: [
          { content: "は (wa)", isCorrect: true },
          { content: "を (wo)", isCorrect: false },
          { content: "で (de)", isCorrect: false },
          { content: "に (ni)", isCorrect: false },
        ],
        category: "Grammar",
      },
      {
        id: "sample-3",
        type: "MULTIPLE_CHOICE",
        content: "Choose the correct reading for 山 (mountain):",
        difficulty: "EASY",
        explanation: "The kanji 山 can be read as やま (yama) or さん (san)",
        answers: [
          { content: "やま (yama)", isCorrect: true },
          { content: "かわ (kawa)", isCorrect: false },
          { content: "そら (sora)", isCorrect: false },
          { content: "うみ (umi)", isCorrect: false },
        ],
        category: "Vocabulary",
      },
    ];
    setFileName("sample-jlpt-n5.pdf");
    setQuestions(sampleQuestions);
    setStep("preview");
  };

  const handleAssign = async () => {
    if (!metadata.classId || !metadata.title || !metadata.dueDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (new Date(metadata.dueDate).getTime() < new Date().getTime()) {
      toast.error("Due date cannot be in the past.");
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
      const savedQuestionIds: string[] = [];
      for (const q of questions) {
        const correctIndex = q.answers.findIndex((ans) => ans.isCorrect);
        const res = await teacherQuestionsApi.createQuestion({
          prompt: q.content,
          options: q.answers.map((ans) => ans.content),
          correctAnswerIndex: correctIndex,
          points: 1,
          questionType: "MULTIPLE_CHOICE",
          difficulty: q.difficulty as "EASY" | "MEDIUM" | "HARD",
          explanation: q.explanation || "",
          level: targetLevel,
          skill: q.category?.toUpperCase() || "VOCABULARY",
          source: "EXAM",
        });
        savedQuestionIds.push(res.id);
      }

      await examsApi.createExam({
        title: metadata.title,
        level: targetLevel,
        totalQuestions: questions.length,
        timeLimit: metadata.duration,
        classIds: metadata.classId ? [metadata.classId] : [],
        questionIds: savedQuestionIds,
        status: "PUBLISHED",
      });

      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      if (metadata.classId) {
        await queryClient.invalidateQueries({ queryKey: ["examsByClass", metadata.classId] });
        await queryClient.invalidateQueries({ queryKey: ["classExams", metadata.classId] });
      }

      toast.success("Exam published successfully!");
      onDone(metadata.title, metadata.classId);
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign exam.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepItems = [
    { num: 1, label: "Upload PDF" },
    { num: 2, label: "Preview & Edit" },
    { num: 3, label: "Assign" },
  ];
  const currentStepNum = step === "upload" ? 1 : step === "preview" ? 2 : 3;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI PDF Exam Generator"
        title="Create exam from PDF"
        subtitle="Upload a PDF and let AI generate exam questions automatically."
      />

      {/* Stepper UI */}
      <div className="flex items-center justify-between max-w-xl mx-auto px-4">
        {stepItems.map((s, idx, arr) => (
          <div key={s.num} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display border",
                  currentStepNum === s.num
                    ? "bg-primary border-primary text-primary-foreground"
                    : currentStepNum > s.num
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-background border-[var(--border)] text-muted-foreground",
                )}
              >
                {currentStepNum > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {s.label}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <div
                className={cn(
                  "h-[2px] flex-1 -mx-2 -mt-4",
                  currentStepNum > s.num ? "bg-green-500" : "bg-[var(--border)]",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Upload View */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="card-base p-12 border-2 border-dashed text-center transition border-[var(--border)] hover:border-primary/50">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg text-primary-col mb-1">
              Upload PDF File
            </h3>
            <p className="text-sm text-secondary-col mb-6">
              Drag and drop your PDF here, or click to browse.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supported: PDF files with text content
            </p>
            <Button onClick={handleFileUpload} className="px-6 py-2.5 rounded-xl font-bold">
              <Upload className="w-4 h-4 mr-2" />
              Choose PDF File
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Preview View */}
      {step === "preview" && (
        <div className="space-y-6">
          {/* Header bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-[var(--accent)]/50 p-4 rounded-xl border border-[var(--border)] sticky top-0 z-30 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-display font-bold text-primary-col">
                  {questions.length} Questions Extracted
                </h3>
              </div>
              <p className="text-xs text-muted-col mt-0.5">From: {fileName || "PDF Document"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setQuestions([]);
                }}
              >
                Upload Another
              </Button>
              <Button onClick={() => setStep("assign")}>
                Continue to Assign
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Add Question Button */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleAddQuestion} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <QuestionEditor
                key={q.id}
                question={q}
                index={idx}
                totalQuestions={questions.length}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onDuplicateQuestion={handleDuplicateQuestion}
                onMoveQuestion={handleMoveQuestion}
                onReAnalyze={handleReAnalyze}
                isReAnalyzing={false}
              />
            ))}
          </div>

          {questions.length === 0 && (
            <div className="card-base p-12 text-center border border-[var(--border)]">
              <p className="text-sm text-muted-foreground">
                No questions yet. Click "Add Question" to start.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Assign View */}
      {step === "assign" && (
        <div className="space-y-6">
          <Card className="border-[var(--border)] bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {questions.length} Questions Ready
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                  Target class <span className="text-red-500">*</span>
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
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  placeholder="E.g., N5 Grammar Assessment"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                    Due date <span className="text-red-500">*</span>
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
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep("preview")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex items-center gap-1.5"
                  disabled={submitting}
                  onClick={handleAssign}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Publish Exam
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Questions Preview */}
          <Card className="border-[var(--border)] bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col">
                Questions Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-[var(--border)]">
              {questions.slice(0, 5).map((q, i) => (
                <div key={q.id || i} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-semibold text-primary-col">
                        {q.content || "(Empty question)"}
                      </p>
                      <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                        {q.category || "Vocabulary"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {questions.length > 5 && (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  +{questions.length - 5} more questions
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

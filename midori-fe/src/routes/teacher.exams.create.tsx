import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { examsApi } from "@/lib/api/exams";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { teacherQuestionsApi, type TeacherQuestionResponse } from "@/lib/api/teacherQuestions";
import { JLPTLevel } from "@/types/teacher-exam";
import {
  mapImportedQuestionToBankRequest,
  findUnresolvedQuestions,
} from "@/lib/teacherQuestionMapping";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import { SuccessBanner } from "@/components/teacher/dialogs";
import { AiPdfImportWorkflow } from "@/components/admin/AiPdfImportWorkflow";
import type { ImportedQuestion } from "@/components/admin/pdf-import/QuestionEditor";
import { AiExamGenerate } from "@/components/teacher/AiExamGenerate";
import {
  ArrowLeft,
  HelpCircle,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Library,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Method = "ai-pdf" | "question-bank";
type AiSubMode = "ai-generate" | "ai-pdf";

export const Route = createFileRoute("/teacher/exams/create")({
  validateSearch: (s: Record<string, unknown>) => ({
    classId: typeof s.classId === "string" ? s.classId : undefined,
    source:
      s.source === "question-bank"
        ? ("question-bank" as const)
        : s.source === "ai-pdf"
          ? ("ai-pdf" as const)
          : undefined,
    topicId: typeof s.topicId === "string" ? s.topicId : undefined,
  }),
  component: CreateExam,
});

/**
 * Canonical Exam creation wizard.
 *
 * The outer screen shows TWO method cards per current product spec:
 *   1. AI Exam            -> method = "ai-pdf"  (opens an AI sub-screen)
 *   2. From Question Bank -> method = "question-bank"
 *
 * The AI sub-screen itself shows TWO inner cards so that the original
 * three Exam creation flows remain accessible without bloating the outer
 * pick-list:
 *   1a. Generate from Content       -> renders <AiExamGenerate />
 *       (lesson-library AI via POST /teacher/exams/ai-generate)
 *   1b. Import Existing Questions   -> renders <AiPdfImportWorkflow />
 *       (PDF upload/import via POST /ai/exams/import)
 *
 * Selecting a different inner card clears any in-flight AI draft so the
 * teacher does not see a half-built exam from a previous flow.
 *
 * Questions are persisted in two phases for the PDF flow:
 *   1. `handleCreateQuestions` saves them to the teacher's question
 *      bank (TeacherQuestion) immediately when the workflow's "Create"
 *      button fires. We keep the IDs in parent state.
 *   2. `handleAssign` posts the Exam metadata plus the saved IDs to
 *      `/exams`. The exact same questions are reused, so they cannot
 *      be lost between steps.
 *
 * The lesson-library flow is self-contained inside <AiExamGenerate />
 * which calls `examsApi.createExam()` and then `onDone(title, examId)`
 * — we just route that back to `handleDone` for the success banner.
 *
 * Question type is preserved end-to-end (no MULTIPLE_CHOICE coercion).
 * Skill/category is normalized to PascalCase to match what the
 * Question Bank UI already displays.
 */
function CreateExam() {
  const { classId, source, topicId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });
  const lockedClass = classId ? classes.find((c) => c.id === classId) : null;
  const lockedClassLite: { id: string; name: string; level: string } | null = lockedClass
    ? { id: lockedClass.id, name: lockedClass.name, level: lockedClass.level }
    : null;
  const init: Method | null = (source as Method) ?? null;
  const [method, setMethod] = useState<Method | null>(init);
  const [done, setDone] = useState<string | null>(null);
  const [createdClassId, setCreatedClassId] = useState<string | null>(null);

  // AI Exam flow state. Owned by the parent so questions persist between
  // the AI workflow's preview step and the Exam settings step.
  // `aiSubMode` selects which of the two inner AI modes is active:
  //   - "ai-generate"  -> <AiExamGenerate />        (lesson-library)
  //   - "ai-pdf"       -> <AiPdfImportWorkflow />   (PDF upload/import)
  // It starts as null so the outer AI sub-screen is shown first.
  const [aiSubMode, setAiSubMode] = useState<AiSubMode | null>(null);
  const [aiQuestions, setAiQuestions] = useState<ImportedQuestion[]>([]);
  const [savedQuestionIds, setSavedQuestionIds] = useState<string[]>([]);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [aiExamMetadata, setAiExamMetadata] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: "",
    dueDate: "",
    duration: 60,
  });

  const handleBack = () => {
    if (classId) {
      navigate({ to: `/teacher/classes/${classId}` });
    } else {
      navigate({ to: "/teacher/exams" });
    }
  };

  const handleDone = (title: string, examIdOrClassId?: string) => {
    // `handleDone` is called from three flows with slightly different
    // payloads:
    //   - QuestionBankExam + ExamAiPdfFlow pass `(title, classId)`
    //   - AiExamGenerate (lesson-library) passes `(title, examId)`
    // For the success banner we just need the title; the second arg is
    // optional context that we stash as `createdClassId` when present
    // (so the "View class" button still works after lesson-library flow
    // we still try to derive the class from the locked/selected one).
    setCreatedClassId(examIdOrClassId ?? lockedClass?.id ?? null);
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
              setAiSubMode(null);
              setDone(null);
              setAiQuestions([]);
              setSavedQuestionIds([]);
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Create another
          </Button>
          {createdClassId && (
            <Button asChild variant="outline">
              <Link
                to="/teacher/classes/$classId"
                params={{ classId: createdClassId }}
                search={{ q: "" }}
              >
                View class
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
            title="AI Exam"
            desc="Upload a PDF and let AI generate or extract exam questions automatically."
            badge="AI Generator"
            onClick={() => setMethod("ai-pdf")}
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

  const resetAiDraft = () => {
    // Switching AI sub-mode or leaving the AI flow entirely must clear any
    // half-built AI draft so the teacher does not see stale questions.
    setAiQuestions([]);
    setSavedQuestionIds([]);
    setAssignError(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {!(method === "ai-pdf" && aiSubMode !== null) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Changing method intentionally drops the in-flight AI draft so
            // the teacher does not see a half-built exam from the previous
            // flow.
            setMethod(null);
            setAiSubMode(null);
            resetAiDraft();
          }}
          className="-ml-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Change method
        </Button>
      )}
      {method === "ai-pdf" && aiSubMode === null && (
        <AiSubModeSelector
          onSelect={(mode) => {
            resetAiDraft();
            setAiSubMode(mode);
          }}
          lockedClass={lockedClassLite}
        />
      )}
      {method === "ai-pdf" && aiSubMode === "ai-generate" && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Returning to the AI sub-mode selector clears any draft from
              // the previous inner flow so we never leak questions across
              // unrelated flows.
              setAiSubMode(null);
              resetAiDraft();
            }}
            className="-ml-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Change method
          </Button>
          <AiExamGenerate lockedClass={lockedClassLite} onDone={handleDone} />
        </>
      )}
      {method === "ai-pdf" && aiSubMode === "ai-pdf" && (
        <ExamAiPdfFlow
          classes={classes}
          lockedClass={lockedClassLite}
          questions={aiQuestions}
          setQuestions={setAiQuestions}
          savedQuestionIds={savedQuestionIds}
          setSavedQuestionIds={setSavedQuestionIds}
          savingQuestions={savingQuestions}
          setSavingQuestions={setSavingQuestions}
          submitting={submitting}
          setSubmitting={setSubmitting}
          assignError={assignError}
          setAssignError={setAssignError}
          metadata={aiExamMetadata}
          setMetadata={setAiExamMetadata}
          onDone={handleDone}
          onChangeInnerMode={() => {
            setAiSubMode(null);
            resetAiDraft();
          }}
        />
      )}
      {method === "question-bank" && (
        <QuestionBankExam lockedClass={lockedClassLite} topicId={topicId} onDone={handleDone} />
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
      data-testid={`exam-create-method-${title.toLowerCase().replace(/\s+/g, "-")}`}
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

/**
 * Inner AI sub-mode selector. Shown once the teacher clicks the outer
 * "AI Exam" card. Offers two options that together cover the three
 * original Exam creation flows:
 *   1. Generate from Content      -> AiExamGenerate (lesson library)
 *   2. Import Existing Questions  -> AiPdfImportWorkflow (PDF)
 *
 * Picking one clears any in-flight AI draft so questions cannot leak
 * between unrelated flows.
 */
function AiSubModeSelector({
  onSelect,
  lockedClass,
}: {
  onSelect: (mode: AiSubMode) => void;
  lockedClass: { id: string; name: string; level: string } | null;
}) {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="AI Exam"
        title="How should AI build your exam?"
        subtitle={
          lockedClass
            ? `Class locked: ${lockedClass.name}. Pick an AI source below.`
            : "Pick an AI source below. You can switch later."
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        <MethodCard
          icon={Library}
          title="Generate from Content"
          desc="Pick a lesson from the content library. AI will draft exam questions from it."
          badge="AI · Library"
          onClick={() => onSelect("ai-generate")}
        />
        <MethodCard
          icon={Sparkles}
          title="Import Existing Questions"
          desc="Upload a PDF. AI will either generate new questions from it or extract the ones already inside."
          badge="AI · PDF"
          onClick={() => onSelect("ai-pdf")}
        />
      </div>
    </div>
  );
}

function ExamAiPdfFlow({
  classes,
  lockedClass,
  questions,
  setQuestions,
  savedQuestionIds,
  setSavedQuestionIds,
  savingQuestions,
  setSavingQuestions,
  submitting,
  setSubmitting,
  assignError,
  setAssignError,
  metadata,
  setMetadata,
  onDone,
  onChangeInnerMode,
}: {
  classes: { id: string; name: string; level: string }[];
  lockedClass: { id: string; name: string; level: string } | null;
  questions: ImportedQuestion[];
  setQuestions: (q: ImportedQuestion[]) => void;
  savedQuestionIds: string[];
  setSavedQuestionIds: (ids: string[]) => void;
  savingQuestions: boolean;
  setSavingQuestions: (b: boolean) => void;
  submitting: boolean;
  setSubmitting: (b: boolean) => void;
  assignError: string | null;
  setAssignError: (s: string | null) => void;
  metadata: { classId: string; title: string; dueDate: string; duration: number };
  setMetadata: (m: { classId: string; title: string; dueDate: string; duration: number }) => void;
  onDone: (title: string, classId: string) => void;
  onChangeInnerMode?: () => void;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!metadata.classId) {
      const targetId = lockedClass?.id ?? classes[0]?.id;
      if (targetId) {
        setMetadata({ ...metadata, classId: targetId });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedClass, classes]);

  const selectedClass = lockedClass ?? classes.find((c) => c.id === metadata.classId) ?? null;
  const targetLevel = selectedClass?.level || "N5";

  /**
   * Persist the AI workflow's questions to the teacher's question bank.
   * Returns the saved IDs in the same order as the input array so the
   * caller can persist them onto an Exam in preview order.
   *
   * This intentionally runs BEFORE the teacher fills in exam metadata so
   * the questions are durable even if the teacher refreshes mid-way.
   */
  const persistQuestionsToBank = async (items: ImportedQuestion[]): Promise<string[]> => {
    if (items.length === 0) {
      throw new Error("No questions to save.");
    }

    const unresolved = findUnresolvedQuestions(items);
    if (unresolved.length > 0) {
      throw new Error(
        "One or more questions are missing a correct answer or have a blank text answer. Please resolve them first.",
      );
    }

    const savedIds: string[] = [];
    // Sequential to preserve preview order — the backend list sorts by
    // createdAt DESC, so parallel inserts with the same timestamp can
    // surface the LAST inserted question first.
    for (const q of items) {
      const req = mapImportedQuestionToBankRequest(q, targetLevel);
      const res = await teacherQuestionsApi.createQuestion(req);
      savedIds.push(res.id);
    }
    return savedIds;
  };

  const handleCreateQuestions = async (items: ImportedQuestion[]) => {
    // Cache the items so they survive even if the bank save fails (the
    // teacher can retry Create without re-uploading the PDF).
    setQuestions(items);
    setAssignError(null);
    setSavingQuestions(true);
    try {
      const ids = await persistQuestionsToBank(items);
      setSavedQuestionIds(ids);
      toast.success(`Saved ${items.length} questions to your question bank.`);
    } catch (err: any) {
      setAssignError(err?.message || "Failed to save questions to your question bank.");
      toast.error(err?.message || "Failed to save questions to your question bank.");
      setSavedQuestionIds([]);
    } finally {
      setSavingQuestions(false);
    }
  };

  const handleAssign = async () => {
    setAssignError(null);
    let idsToUse = savedQuestionIds;

    // Lazy save: if the teacher skipped straight to Assign without going
    // through the AI workflow's Create, persist first.
    if (idsToUse.length === 0 && questions.length > 0) {
      setSavingQuestions(true);
      try {
        idsToUse = await persistQuestionsToBank(questions);
        setSavedQuestionIds(idsToUse);
      } catch (err: any) {
        setSavingQuestions(false);
        setAssignError(err?.message || "Failed to save questions to your question bank.");
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

    setSubmitting(true);
    try {
      const examTitle = metadata.title || `AI Exam - ${idsToUse.length} questions`;
      await examsApi.createExam({
        title: examTitle,
        level: targetLevel,
        totalQuestions: idsToUse.length,
        timeLimit: metadata.duration,
        classIds: metadata.classId ? [metadata.classId] : [],
        questionIds: idsToUse,
        status: "PUBLISHED",
      });

      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      if (metadata.classId) {
        await queryClient.invalidateQueries({ queryKey: ["examsByClass", metadata.classId] });
        await queryClient.invalidateQueries({ queryKey: ["classExams", metadata.classId] });
      }

      toast.success("Exam published successfully!");
      onDone(examTitle, metadata.classId);
    } catch (err: any) {
      setAssignError(err?.message || "Failed to assign exam.");
      toast.error(err?.message || "Failed to assign exam.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {onChangeInnerMode && (
        <Button variant="ghost" size="sm" onClick={onChangeInnerMode} className="-ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to AI mode selection
        </Button>
      )}
      <PageHeader
        eyebrow="AI Exam · Unified Workflow"
        title="Create exam from PDF"
        subtitle="Upload a PDF and let AI generate or extract exam questions automatically."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <AiPdfImportWorkflow
            onCreate={async (items) => {
              await handleCreateQuestions(items);
            }}
            title="AI Exam"
            subtitle="Choose how AI should process your PDF."
            backHref="/teacher/exams"
            backLabel="Back to Exam Selection"
            enabled={true}
            disabledReason=""
            defaultMode="IMPORT_EXISTING_QUESTIONS"
          />

          {questions.length > 0 && (
            <div className="card-base p-4 border border-[var(--border)]">
              <p className="text-xs text-muted-foreground">
                {savedQuestionIds.length > 0 ? (
                  <>
                    Saved <strong>{questions.length}</strong> question
                    {questions.length === 1 ? "" : "s"} to the teacher's question bank. Configure
                    the exam details below and click <strong>Publish Exam</strong> to schedule it
                    for the class.
                  </>
                ) : (
                  <>
                    Generated <strong>{questions.length}</strong> question
                    {questions.length === 1 ? "" : "s"} from the PDF. Click <strong>Create</strong>{" "}
                    in the workflow above to save them to your question bank before publishing.
                  </>
                )}
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
                <LevelBadge level={lockedClass.level as JLPTLevel} />
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
              placeholder="E.g., N5 Grammar Assessment"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-secondary-col">
                Due date
              </Label>
              <Input
                type="datetime-local"
                value={metadata.dueDate}
                onChange={(e) => setMetadata({ ...metadata, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-secondary-col">
                Duration (min)
              </Label>
              <Input
                type="number"
                min={0}
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

          {assignError && (
            <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {assignError}
            </div>
          )}

          <Button
            disabled={
              submitting ||
              savingQuestions ||
              questions.length === 0 ||
              savedQuestionIds.length === 0
            }
            className="w-full"
            data-testid="ai-pdf-publish-button"
            onClick={handleAssign}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Publish Exam
              </>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Questions are persisted as EXAM items in your teacher question bank before being
            scheduled for the selected class.
          </p>
        </Card>
      </div>
    </div>
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
                    value={totalQuestionsInput}
                    onChange={(e) => {
                      setTotalQuestionsInput(Math.max(1, Number(e.target.value) || 0));
                      setBackendError(null);
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
                        value={difficultyPercent.easy}
                        onChange={(e) => {
                          setDifficultyPercent({
                            ...difficultyPercent,
                            easy: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
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
                        value={difficultyPercent.medium}
                        onChange={(e) => {
                          setDifficultyPercent({
                            ...difficultyPercent,
                            medium: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
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
                        value={difficultyPercent.hard}
                        onChange={(e) => {
                          setDifficultyPercent({
                            ...difficultyPercent,
                            hard: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
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
                      <LevelBadge level={lockedClass.level as JLPTLevel} />
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                      Due date
                    </Label>
                    <Input
                      type="datetime-local"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                      value={metadata.dueDate}
                      onChange={(e) => setMetadata({ ...metadata, dueDate: e.target.value })}
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
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                      Attempts
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                      value={metadata.attempts}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          attempts: Math.max(1, Number(e.target.value) || 1),
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

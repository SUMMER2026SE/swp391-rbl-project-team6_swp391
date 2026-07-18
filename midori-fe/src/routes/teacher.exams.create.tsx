import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { examsApi } from "@/lib/api/exams";
import { ApiError } from "@/lib/api/client";
import { teacherQuestionsApi } from "@/lib/api/teacherQuestions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildTopicsFromQuestions,
  getAggregatedTopicCounts,
  getTopicById,
  mapApiQuestion,
  pickRandomQuestions,
  type BankQuestionView,
} from "@/lib/exam/questionBank";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import { DifficultyDistribution, isDistValid } from "@/components/teacher/difficulty-distribution";
import { PreviewSheet, SuccessBanner } from "@/components/teacher/dialogs";
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  FileBadge,
  Sparkles,
  Save,
  Send,
  Eye,
  Shuffle,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Method = "manual" | "question-bank" | "jlpt-bank";

export const Route = createFileRoute("/teacher/exams/create")({
  validateSearch: (s: Record<string, unknown>) => ({
    classId: typeof s.classId === "string" ? s.classId : undefined,
    examId: typeof s.examId === "string" ? s.examId : undefined,
    source:
      s.source === "question-bank" || s.source === "jlpt-bank"
        ? (s.source as "question-bank" | "jlpt-bank")
        : undefined,
    topicId: typeof s.topicId === "string" ? s.topicId : undefined,
    jlptSetId: typeof s.jlptSetId === "string" ? s.jlptSetId : undefined,
    mode: s.mode === "random" ? "random" : undefined,
  }),
  component: CreateExam,
});

function CreateExam() {
  const { classId, examId, source, topicId, jlptSetId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });
  const { data: existingExam } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => (examId ? examsApi.getExamById(examId) : Promise.resolve(null)),
    enabled: !!examId,
  });
  const lockedClass = classId ? classes.find((c) => c.id === classId) : null;
  const init: Method | null = (source as Method) ?? null;
  const [method, setMethod] = useState<Method | null>(init);
  const [done, setDone] = useState<string | null>(null);
  const [doneExamId, setDoneExamId] = useState<string | null>(null);

  const handleBack = () => {
    if (classId) {
      navigate({ to: `/teacher/classes/${classId}` });
    } else {
      navigate({ to: "/teacher/exams" });
    }
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
          title="Choose how to build your exam"
          subtitle="Each method has a different workflow — pick what fits this assessment."
          showBack={true}
          onBack={handleBack}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <BigMethodCard
            icon={Pencil}
            title="Manual Exam Builder"
            desc="Write your own questions with full control. Best for custom assessments."
            badge="Builder · Editor"
            gradient="from-primary to-success"
            onClick={() => setMethod("manual")}
          />
          <BigMethodCard
            icon={HelpCircle}
            title="Random from Question Bank"
            desc="Auto-generate by choosing topics and difficulty distribution."
            badge="Generator · Randomizer"
            gradient="from-info to-primary"
            onClick={() => setMethod("question-bank")}
          />
          <BigMethodCard
            icon={FileBadge}
            title="Use JLPT Exam Bank"
            desc="Use a complete official-style exam set from the Center library."
            badge="Picker · Ready-made"
            gradient="from-sakura to-warning"
            onClick={() => setMethod("jlpt-bank")}
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
      {method === "manual" && (
        <ManualExam
          lockedClass={lockedClass}
          examId={examId}
          existingExam={existingExam}
          onDone={(title, savedExamId) => {
            setDone(title);
            setDoneExamId(savedExamId ?? null);
          }}
        />
      )}
      {method === "question-bank" && (
        <RandomExam lockedClass={lockedClass} topicId={topicId} onDone={setDone} />
      )}
      {method === "jlpt-bank" && (
        <JlptExam lockedClass={lockedClass} jlptSetId={jlptSetId} onDone={setDone} />
      )}
    </div>
  );
}

function BigMethodCard({
  icon: Icon,
  title,
  desc,
  badge,
  gradient,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  badge: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border bg-card text-left transition-all hover:border-primary/50 hover:shadow-lg"
    >
      <div className={cn("h-2 bg-gradient-to-r", gradient)} />
      <div className="p-6">
        <div
          className={cn(
            "mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-primary-foreground",
            gradient,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {badge}
        </div>
        <h3 className="mt-1 font-display text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

// ─── MANUAL BUILDER ──────────────────────────────────────────────────────

interface ManualQ {
  id: string;
  text: string;
  options: string[];
  correct: number;
  points: number;
}

type ExamAction = "DRAFT" | "PUBLISHED";
type SubmitState = { status: ExamAction } | null;

function validateDraft(form: { title: string }, questions: ManualQ[]): string | null {
  if (!form.title.trim()) return "Please enter an exam title.";
  return null;
}

function validatePublish(
  form: { title: string; duration: number },
  questions: ManualQ[],
): string | null {
  const draftErr = validateDraft(form, questions);
  if (draftErr) return draftErr;
  if (questions.length === 0) return "Please add at least one question.";
  if (form.duration <= 0) return "Duration must be greater than 0.";
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.text.trim()) return `Question ${i + 1} has an empty question prompt.`;
    if (!q.options || q.options.length < 2)
      return `Question ${i + 1} must have at least 2 options.`;
    if (q.options.some((o) => !o.trim()))
      return `Please fill out all options for Question ${i + 1}.`;
    if (q.correct < 0 || q.correct >= q.options.length)
      return `Question ${i + 1} needs a correct answer selected.`;
    if (q.points <= 0) return `Question ${i + 1} needs a positive score.`;
  }
  return null;
}

function ManualExam({
  lockedClass,
  examId,
  existingExam,
  onDone,
}: {
  lockedClass: any | null;
  examId?: string;
  existingExam?: any;
  onDone: (title: string, examId?: string) => void;
}) {
  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });

  const initForm = {
    classId:
      existingExam?.assignedClassId ??
      existingExam?.classId ??
      lockedClass?.id ??
      classes[0]?.id ??
      "",
    title: existingExam?.title ?? "",
    level: existingExam?.level ?? lockedClass?.level ?? "N5",
    duration: existingExam?.timeLimit ?? 60,
    attempts: existingExam?.attempts ?? 1,
  };

  const [form, setForm] = useState(initForm);
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState<SubmitState>(null);
  const [questions, setQuestions] = useState<ManualQ[]>(
    existingExam?.questions?.length
      ? existingExam.questions.map((q: any) => ({
          id: q.id,
          text: q.prompt ?? q.questionText ?? "",
          options: Array.isArray(q.options) && q.options.length > 0
            ? q.options
            : ["", "", "", ""],
          correct: typeof q.correctAnswerIndex === "number"
            ? q.correctAnswerIndex
            : 0,
          points: typeof q.points === "number" ? q.points : 2,
        }))
      : [{ id: "q1", text: "", options: ["", "", "", ""], correct: 0, points: 2 }],
  );
  const [editIdx, setEditIdx] = useState<number | null>(
    existingExam?.questions?.length ? null : 0,
  );
  const [preview, setPreview] = useState(false);

  const submitExam = useCallback(
    async (status: ExamAction) => {
      if (submitting) return;

      const validationError =
        status === "DRAFT"
          ? validateDraft(form, questions)
          : validatePublish(form, questions);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setSubmitting({ status });
      let savedExamId: string | undefined;

      try {
        if (examId) {
          // ── EDIT path: update the existing exam metadata + questions ──────────
          await examsApi.updateExam(examId, {
            title: form.title.trim(),
            level: form.level,
            timeLimit: form.duration,
            totalQuestions: questions.length,
            classIds: form.classId ? [form.classId] : [],
            status,
          });
          savedExamId = examId;

          // Sync questions: backend returns the same shape on this endpoint,
          // so we can map straight from ManualQ. existing questions keep their
          // UUID, new ones omit `id` so backend inserts them.
          const payload = questions.map((q, idx) => {
            const isExistingUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q.id);
            return {
              ...(isExistingUuid ? { id: q.id } : {}),
              prompt: q.text,
              options: q.options.map((o) => o ?? ""),
              correctAnswerIndex: q.correct,
              points: q.points,
              displayOrder: idx + 1,
            };
          });
          await examsApi.updateExamQuestions(examId, { questions: payload });
        } else {
          // ── CREATE path: parallel question creation + rollback on failure ──────
          const createResults = await Promise.allSettled(
            questions.map((q) =>
              teacherQuestionsApi.createQuestion({
                prompt: q.text,
                options: q.options,
                correctAnswerIndex: q.correct,
                points: q.points,
                questionType: "MULTIPLE_CHOICE",
                difficulty: "MEDIUM",
                explanation: "Exam manual question",
              }),
            ),
          );

          // Collect successes; surface first failure without orphan cleanup
          const successes: { id: string }[] = [];
          for (let i = 0; i < createResults.length; i++) {
            const result = createResults[i];
            if (result.status === "fulfilled") {
              successes.push(result.value);
            } else {
              // Rollback already-saved questions before surfacing the error
              await Promise.allSettled(
                successes.map((s) => teacherQuestionsApi.deleteQuestion(s.id)),
              );
              const reason = result.reason;
              const msg =
                reason instanceof ApiError
                  ? reason.message
                  : reason?.message ?? "Failed to save question.";
              toast.error(`Question ${i + 1}: ${msg}`);
              return; // exits without touching submitting state — finally handles it
            }
          }

          const savedExam = await examsApi.createExam({
            title: form.title.trim(),
            level: form.level,
            totalQuestions: questions.length,
            timeLimit: form.duration,
            classIds: form.classId ? [form.classId] : [],
            questionIds: successes.map((s) => s.id),
            status,
          });
          savedExamId = savedExam.id;
        }

        // ── React Query: invalidate all exam lists in parallel ──────────────────
        const invalidations = [
          queryClient.invalidateQueries({ queryKey: ["exams"] }),
          queryClient.invalidateQueries({ queryKey: ["teacherExams"] }),
          ...(form.classId
            ? [
                queryClient.invalidateQueries({ queryKey: ["examsByClass", form.classId] }),
                queryClient.invalidateQueries({ queryKey: ["classExams", form.classId] }),
                queryClient.invalidateQueries({
                  queryKey: ["teacherClassExams", form.classId],
                }),
              ]
            : []),
          ...(savedExamId
            ? [queryClient.invalidateQueries({ queryKey: ["exam", savedExamId] })]
            : []),
        ];
        await Promise.all(invalidations);

        // ── UX ────────────────────────────────────────────────────────────────
        if (status === "PUBLISHED") {
          toast.success("Exam published successfully.");
          onDone(form.title, savedExamId);
        } else {
          toast.success("Draft saved. You can keep editing.");
        }
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        const message =
          apiErr?.message ??
          (status === "DRAFT" ? "Failed to save draft." : "Failed to publish exam.");
        toast.error(message);
      } finally {
        setSubmitting(null);
      }
    },
    [submitting, form, questions, examId, queryClient, onDone],
  );

  const isPending = submitting !== null;
  const isSavingDraft = submitting?.status === "DRAFT";
  const isPublishing = submitting?.status === "PUBLISHED";

  const totalPoints = questions.reduce((s, q) => s + q.points, 0);
  const valid = !!(
    form.title &&
    questions.length > 0 &&
    questions.every((q) => q.text && q.options.every((o) => o.trim()))
  );

  const addQ = () => {
    const id = `q${questions.length + 1}-${Date.now()}`;
    setQuestions((q) => [...q, { id, text: "", options: ["", "", "", ""], correct: 0, points: 2 }]);
    setEditIdx(questions.length);
  };
  const updQ = (i: number, patch: Partial<ManualQ>) =>
    setQuestions((q) => q.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const delQ = (i: number) => {
    setQuestions((q) => q.filter((_, idx) => idx !== i));
    setEditIdx(null);
  };
  const editing = editIdx !== null ? questions[editIdx] : null;

  return (
    <div>
      <PageHeader
        eyebrow="Manual exam builder"
        title="Build your exam"
        subtitle="Builder layout — add and edit questions, review the list, publish when ready."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Exam settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. N5 Mid-term Assessment"
                />
              </div>
              <div className="space-y-2">
                <Label>Target class</Label>
                {lockedClass ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                    <LevelBadge level={lockedClass.level} />
                    <span className="text-sm">{lockedClass.name}</span>
                  </div>
                ) : (
                  <Select
                    value={form.classId}
                    onValueChange={(v) => setForm({ ...form, classId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Attempts</Label>
                <Input
                  type="number"
                  value={form.attempts}
                  onChange={(e) => setForm({ ...form, attempts: Number(e.target.value) || 1 })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">
                Questions ({questions.length}) · {totalPoints} pts
              </CardTitle>
              <Button size="sm" onClick={addQ}>
                <Plus className="mr-1 h-4 w-4" />
                Add question
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    editIdx === i && "border-primary bg-primary/5",
                  )}
                >
                  <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                  <div className="min-w-0 flex-1 truncate text-sm">
                    {q.text || <em className="text-muted-foreground">Empty question</em>}
                  </div>
                  <span className="text-xs text-muted-foreground">{q.points} pts</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditIdx(i)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => delQ(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {editing && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Edit question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Question text</Label>
                  <Textarea
                    rows={3}
                    value={editing.text}
                    onChange={(e) => updQ(editIdx!, { text: e.target.value })}
                    placeholder="Type the question (Japanese OK)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Options (select the correct answer)</Label>
                  {editing.options.map((o, oi) => {
                    const handleOptionChange = (val: string) =>
                      updQ(editIdx!, {
                        options: editing.options.map((x, idx) => (idx === oi ? val : x)),
                      });
                    return (
                      <label
                        key={oi}
                        className={cn(
                          "flex items-center gap-2 rounded-md border p-2",
                          editing.correct === oi && "border-success bg-success/5",
                        )}
                      >
                        <input
                          type="radio"
                          checked={editing.correct === oi}
                          onChange={() => updQ(editIdx!, { correct: oi })}
                        />
                        <Input
                          value={o}
                          onChange={(e) => handleOptionChange(e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          className="h-8"
                        />
                      </label>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={editing.points}
                    onChange={(e) => updQ(editIdx!, { points: Number(e.target.value) || 1 })}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          <div className="space-y-2">
            <Button className="w-full" variant="outline" onClick={() => setPreview(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview exam
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={isPending}
              onClick={() => submitExam("DRAFT")}
            >
              {isSavingDraft ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSavingDraft ? "Saving draft..." : "Save draft"}
            </Button>
            <Button
              className="w-full"
              disabled={isPending}
              onClick={() => submitExam("PUBLISHED")}
            >
              {isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isPublishing ? "Publishing..." : "Publish & assign"}
            </Button>
          </div>
        </div>
      </div>

      <PreviewSheet
        open={preview}
        onOpenChange={setPreview}
        title={form.title || "Exam preview"}
        description={`${questions.length} questions · ${totalPoints} pts · ${form.duration} min`}
      >
        <ol className="space-y-3 text-sm">
          {questions.map((q, i) => (
            <li key={q.id} className="rounded-lg border p-3">
              <div className="mb-2 font-medium">
                Q{i + 1}. {q.text}
              </div>
              <ul className="space-y-1 pl-4 text-muted-foreground">
                {q.options.map((o, oi) => (
                  <li key={oi} className={oi === q.correct ? "text-success" : ""}>
                    • {o || <em>—</em>}
                    {oi === q.correct && " ✓"}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </PreviewSheet>
    </div>
  );
}

// ─── RANDOM FROM QUESTION BANK ─────────────────────────────────────────

function RandomExam({
  lockedClass,
  topicId,
  onDone,
}: {
  lockedClass: any | null;
  topicId?: string;
  onDone: (t: string) => void;
}) {
  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });
  const { data: bankQuestions = [], isLoading: bankLoading } = useQuery({
    queryKey: ["teacherQuestions"],
    queryFn: () => teacherQuestionsApi.getQuestions(),
  });
  const topics = useMemo(() => buildTopicsFromQuestions(bankQuestions), [bankQuestions]);
  const questionPool = useMemo(
    () => bankQuestions.map(mapApiQuestion),
    [bankQuestions],
  );
  const init = topicId ? getTopicById(topics, topicId) : null;
  if (topicId && !init) toast.warning("Topic not found in Question Bank");

  const [form, setForm] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: init ? `${init.name} Assessment` : "Random Generated Exam",
    level: init?.level ?? lockedClass?.level ?? "N5",
    total: 30,
    duration: 60,
    dist: { easy: 40, medium: 40, hard: 20 },
  });
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(init ? [init.id] : []);
  const [generated, setGenerated] = useState<BankQuestionView[] | null>(null);
  const [locked, setLocked] = useState<Set<string>>(new Set());

  const handleSave = async (shouldPublish = false) => {
    if (!generated) return;
    setIsSaving(true);
    try {
      const savedQuestionIds: string[] = [];
      for (const q of generated) {
        const res = await teacherQuestionsApi.createQuestion({
          prompt: q.prompt,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          points: q.points,
          questionType: "MULTIPLE_CHOICE",
          difficulty: q.difficulty.toUpperCase(),
          explanation: "Exam random question",
        });
        savedQuestionIds.push(res.id);
      }

      await examsApi.createExam({
        title: form.title,
        level: form.level,
        totalQuestions: form.total,
        timeLimit: form.duration,
        classIds: form.classId ? [form.classId] : [],
        questionIds: savedQuestionIds,
        status: shouldPublish ? "PUBLISHED" : "DRAFT",
      });

      if (shouldPublish) {
        toast.success("Exam published & assigned successfully!");
      } else {
        toast.success("Draft saved successfully!");
      }

      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      if (form.classId) {
        await queryClient.invalidateQueries({ queryKey: ["examsByClass", form.classId] });
        await queryClient.invalidateQueries({ queryKey: ["classExams", form.classId] });
      }

      onDone(form.title);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save exam.");
    } finally {
      setIsSaving(false);
    }
  };

  const available = useMemo(
    () => getAggregatedTopicCounts(topics, selectedTopics),
    [topics, selectedTopics],
  );
  const distOk = isDistValid(form.dist, form.total, available);
  const canGen = selectedTopics.length > 0 && distOk;

  const generate = (keepLocked = false) => {
    const lockedQs = keepLocked && generated ? generated.filter((q) => locked.has(q.id)) : [];
    const need = form.total - lockedQs.length;
    if (need <= 0) {
      setGenerated(lockedQs.slice(0, form.total));
      return;
    }
    const fresh = getQuestionsForRandomGeneration({
      topicIds: selectedTopics,
      total: need,
      easyPct: form.dist.easy,
      mediumPct: form.dist.medium,
      hardPct: form.dist.hard,
    });
    setGenerated([...lockedQs, ...fresh]);
    toast.success(
      keepLocked
        ? `Re-randomized ${fresh.length} questions (${lockedQs.length} locked)`
        : `Generated ${fresh.length} questions`,
    );
  };

  const toggleLock = (id: string) =>
    setLocked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const replaceQ = (id: string) => {
    if (!generated) return;
    const old = generated.find((q) => q.id === id);
    if (!old) return;
    const pool = getQuestionsForRandomGeneration({
      topicIds: selectedTopics,
      total: 50,
      easyPct: 100,
      mediumPct: 0,
      hardPct: 0,
    });
    const candidates = pool.filter((q) => q.id !== id && q.difficulty === old.difficulty);
    const next = candidates[Math.floor(Math.random() * candidates.length)] ?? old;
    setGenerated(generated.map((q) => (q.id === id ? next : q)));
    toast.success("Question replaced");
  };
  const toggleTopic = (id: string) =>
    setSelectedTopics((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div>
      <PageHeader
        eyebrow="Question Bank · Randomizer"
        title="Generate exam from the Question Bank"
        subtitle="Configure topics and difficulty mix, then review and refine each generated question."
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Target class</Label>
                {lockedClass ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                    <LevelBadge level={lockedClass.level} />
                    <span className="text-sm">{lockedClass.name}</span>
                  </div>
                ) : (
                  <Select
                    value={form.classId}
                    onValueChange={(v) => setForm({ ...form, classId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={form.level}
                    onValueChange={(v) => {
                      setForm({ ...form, level: v });
                      setSelectedTopics([]);
                      setGenerated(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total questions</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.total}
                  onChange={(e) =>
                    setForm({ ...form, total: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Select topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topics
                .filter((t) => t.level === form.level)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTopic(t.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border p-2 text-left text-sm",
                      selectedTopics.includes(t.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/40",
                    )}
                  >
                    <input type="checkbox" checked={selectedTopics.includes(t.id)} readOnly />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {t.totalQuestions} questions
                      </div>
                    </div>
                  </button>
                ))}
              {topics.filter((t) => t.level === form.level).length === 0 && (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  No topics at this level.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
              <Stat label="Topics" value={selectedTopics.length} />
              <Stat label="Available" value={available.total} />
              <Stat label="Target" value={form.total} />
              <Stat label="Generated" value={generated?.length ?? 0} />
            </CardContent>
          </Card>

          <DifficultyDistribution
            value={form.dist}
            onChange={(v) => setForm({ ...form, dist: v })}
            total={form.total}
            available={available}
          />

          <div className="flex flex-wrap gap-2">
            <Button disabled={!canGen} onClick={() => generate(false)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate
            </Button>
            <Button variant="outline" disabled={!generated} onClick={() => generate(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Randomize again (keep locked)
            </Button>
            <Button
              variant="outline"
              disabled={!generated || isSaving}
              onClick={() => handleSave(false)}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save draft"}
            </Button>
            <Button
              disabled={!generated || isSaving}
              onClick={() => handleSave(true)}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSaving ? "Publishing..." : "Publish & assign"}
            </Button>
          </div>

          {generated && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Generated questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {generated.map((q, i) => (
                  <div
                    key={q.id + i}
                    className={cn(
                      "rounded-lg border p-3",
                      locked.has(q.id) && "border-warning/40 bg-warning/5",
                    )}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                      <DifficultyBadge d={q.difficulty} />
                      <span className="ml-auto text-xs text-muted-foreground">{q.points} pts</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => toggleLock(q.id)}
                      >
                        {locked.has(q.id) ? (
                          <>
                            <Lock className="mr-1 h-3 w-3" />
                            Locked
                          </>
                        ) : (
                          <>
                            <Unlock className="mr-1 h-3 w-3" />
                            Lock
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        disabled={locked.has(q.id)}
                        onClick={() => replaceQ(q.id)}
                      >
                        <Shuffle className="mr-1 h-3 w-3" />
                        Replace
                      </Button>
                    </div>
                    <div className="text-sm font-medium">{q.questionText ?? q.prompt}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-bold">{value}</div>
    </div>
  );
}

// ─── JLPT EXAM BANK ────────────────────────────────────────────────────

function mapSectionFromPrompt(prompt: string): { cleanPrompt: string; section: "Vocabulary" | "Grammar" | "Reading" | "Listening" } {
  if (prompt.startsWith("[Vocabulary] ")) {
    return { cleanPrompt: prompt.substring(13), section: "Vocabulary" };
  }
  if (prompt.startsWith("[Grammar] ")) {
    return { cleanPrompt: prompt.substring(10), section: "Grammar" };
  }
  if (prompt.startsWith("[Reading] ")) {
    return { cleanPrompt: prompt.substring(10), section: "Reading" };
  }
  if (prompt.startsWith("[Listening] ")) {
    return { cleanPrompt: prompt.substring(12), section: "Listening" };
  }
  return { cleanPrompt: prompt, section: "Vocabulary" };
}

function JlptExam({
  lockedClass,
  jlptSetId,
  onDone,
}: {
  lockedClass: any | null;
  jlptSetId?: string;
  onDone: (t: string) => void;
}) {
  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });

  const { data: rawExams = [], isLoading: isExamsLoading } = useQuery({
    queryKey: ["exam-bank"],
    queryFn: () => examsApi.getAllExams(),
  });

  const sets = rawExams.filter(e => e.category === "JLPT" && e.status === "PUBLISHED");

  const [selectedId, setSelectedId] = useState<string | null>(jlptSetId ?? null);

  const { data: selectedSet } = useQuery({
    queryKey: ["exam", selectedId],
    queryFn: () => examsApi.getExamById(selectedId!),
    enabled: !!selectedId,
  });

  const [form, setForm] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: "",
    instructions: "Bring writing materials. The exam will run for the full duration.",
    dueDate: "",
  });

  useEffect(() => {
    if (selectedSet) {
      setForm((f) => ({ ...f, title: f.title || selectedSet.title }));
    }
  }, [selectedSet]);

  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSave = async (shouldPublish = false) => {
    if (!selectedSet) return;
    setIsSaving(true);
    try {
      const newExam = await examsApi.createExam({
        title: form.title,
        level: selectedSet.level,
        totalQuestions: selectedSet.totalQuestions ?? selectedSet.questions?.length ?? 0,
        timeLimit: selectedSet.timeLimit,
        classIds: form.classId ? [form.classId] : [],
        category: "JLPT",
        difficultyEasy: selectedSet.difficultyEasy,
        difficultyMedium: selectedSet.difficultyMedium,
        difficultyHard: selectedSet.difficultyHard,
        status: shouldPublish ? "PUBLISHED" : "DRAFT",
      });

      if (!newExam?.id) {
        throw new Error("Failed to create class exam shell");
      }

      if (selectedSet.questions && selectedSet.questions.length > 0) {
        await examsApi.updateExamQuestions(newExam.id, {
          questions: selectedSet.questions.map((q, index) => ({
            prompt: q.prompt,
            options: q.options || [],
            correctAnswerIndex: q.correctAnswerIndex,
            points: q.points || 1,
            displayOrder: q.displayOrder || (index + 1),
          })),
        });
      }

      if (shouldPublish) {
        toast.success("Exam published & assigned successfully!");
      } else {
        toast.success("Draft saved successfully!");
      }

      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      if (form.classId) {
        await queryClient.invalidateQueries({ queryKey: ["examsByClass", form.classId] });
        await queryClient.invalidateQueries({ queryKey: ["classExams", form.classId] });
      }

      onDone(form.title);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save exam.");
    } finally {
      setIsSaving(false);
    }
  };

  const getExamStats = (exam: any) => {
    const qs = exam.questions || [];
    const vocab = qs.filter((q: any) => mapSectionFromPrompt(q.prompt).section === "Vocabulary").length;
    const grammar = qs.filter((q: any) => mapSectionFromPrompt(q.prompt).section === "Grammar").length;
    const reading = qs.filter((q: any) => mapSectionFromPrompt(q.prompt).section === "Reading").length;
    const listening = qs.filter((q: any) => mapSectionFromPrompt(q.prompt).section === "Listening").length;

    const sections = [
      { name: "Vocabulary", questions: vocab },
      { name: "Grammar", questions: grammar },
      { name: "Reading", questions: reading },
      { name: "Listening", questions: listening }
    ].filter(sec => sec.questions > 0);

    const easyCount = exam.difficultyEasy ?? 0;
    const mediumCount = exam.difficultyMedium ?? 0;
    const hardCount = exam.difficultyHard ?? 0;
    const tot = easyCount + mediumCount + hardCount;
    // Only compute percentages when the backend provides at least one non-zero value.
    // Never fabricate difficulty data.
    const mix =
      tot > 0
        ? {
            easy: Math.round((easyCount / tot) * 100),
            medium: Math.round((mediumCount / tot) * 100),
            hard: Math.round((hardCount / tot) * 100),
          }
        : null;

    return {
      sections,
      mix,
      year: exam.createdAt ? new Date(exam.createdAt).getFullYear() : new Date().getFullYear(),
      description: exam.category === "JLPT" ? `Official JLPT-style exam prepared by the Admin.` : ""
    };
  };

  const valid = !!(selectedSet && form.title && form.dueDate);
  const stats = selectedSet ? getExamStats(selectedSet) : null;

  return (
    <div>
      <PageHeader
        eyebrow="JLPT Exam Bank · Picker"
        title="Use a JLPT exam set"
        subtitle="Pick a Center-managed full exam, configure assignment and publish."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Choose a JLPT set</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {isExamsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              sets.map((s) => {
                const sStats = getExamStats(s);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedId(s.id);
                      setForm((f) => ({ ...f, title: s.title }));
                    }}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      selectedId === s.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "hover:border-primary/40",
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <LevelBadge level={s.level} />
                      <span className="text-xs text-muted-foreground">{sStats.year}</span>
                    </div>
                    <div className="font-display text-base font-semibold">{s.title}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{sStats.description}</p>
                    <div className={`mt-3 grid gap-2 text-[10px] ${sStats.mix ? "grid-cols-4" : "grid-cols-3"}`}>
                      <div className="rounded-md bg-muted/40 p-1.5">
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-bold">{s.timeLimit}m</div>
                      </div>
                      <div className="rounded-md bg-muted/40 p-1.5">
                        <div className="text-muted-foreground">Questions</div>
                        <div className="font-bold">{s.totalQuestions ?? s.questions?.length ?? 0}</div>
                      </div>
                      <div className="rounded-md bg-muted/40 p-1.5">
                        <div className="text-muted-foreground">Sections</div>
                        <div className="font-bold">{sStats.sections.length}</div>
                      </div>
                      {sStats.mix && (
                        <div className="rounded-md bg-muted/40 p-1.5">
                          <div className="text-muted-foreground">Mix E/M/H</div>
                          <div className="font-bold">
                            {sStats.mix.easy}/{sStats.mix.medium}/{sStats.mix.hard}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedSet && stats ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Selected set</div>
                  <div className="font-medium">{selectedSet.title}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Level {selectedSet.level} · {selectedSet.timeLimit} min · {selectedSet.totalQuestions ?? selectedSet.questions?.length ?? 0} questions ·
                    difficulty mix already balanced
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Select a set to continue
                </div>
              )}
              <div className="space-y-2">
                <Label>Target class</Label>
                {lockedClass ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                    <LevelBadge level={lockedClass.level} />
                    <span className="text-sm">{lockedClass.name}</span>
                  </div>
                ) : (
                  <Select
                    value={form.classId}
                    onValueChange={(v) => setForm({ ...form, classId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              <div className="space-y-2">
                <Label>Exam title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Schedule date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea
                  rows={3}
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            <Button
              className="w-full"
              variant="outline"
              disabled={!selectedSet}
              onClick={() => setPreview(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview set
            </Button>
             <Button
                className="w-full"
                variant="outline"
                disabled={!valid || isSaving}
                onClick={() => handleSave(false)}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save draft"}
              </Button>
              <Button
                className="w-full"
                disabled={!valid || isSaving}
                onClick={() => handleSave(true)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isSaving ? "Publishing..." : "Use this set & publish"}
              </Button>
          </div>
        </div>
      </div>

      <PreviewSheet
        open={preview}
        onOpenChange={setPreview}
        title={selectedSet?.title ?? ""}
        description={
          selectedSet ? `Level ${selectedSet.level} · ${selectedSet.timeLimit} min · ${selectedSet.totalQuestions ?? selectedSet.questions?.length ?? 0} questions` : ""
        }
      >
            {selectedSet && stats && (
              <div className="space-y-3 text-sm">
                <p>{stats.description}</p>
                <div>
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">Sections</div>
                  <ul className="space-y-1">
                    {stats.sections.map((s) => (
                      <li key={s.name} className="flex justify-between rounded-md border p-2">
                        <span>{s.name}</span>
                        <span className="text-muted-foreground">{s.questions} questions</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {stats.mix && (
                  <div>
                    <div className="mb-1 text-xs font-semibold text-muted-foreground">Difficulty mix</div>
                    <div className="flex gap-2">
                      <DifficultyBadge d="Easy" /> {stats.mix.easy}%{" "}
                      <DifficultyBadge d="Medium" /> {stats.mix.medium}%{" "}
                      <DifficultyBadge d="Hard" /> {stats.mix.hard}%
                    </div>
                  </div>
                )}
              </div>
            )}
      </PreviewSheet>
    </div>
  );
}

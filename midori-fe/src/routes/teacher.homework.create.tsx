import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";
import { homeworkApi } from "@/lib/api/homework";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getQuestionTopics,
  getQuestionTopicById,
  getQuestionsForRandomGeneration,
  getAggregatedTopicCounts,
  type Question,
} from "@/data/teacher-data";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import { PreviewSheet, SuccessBanner } from "@/components/teacher/dialogs";
import { DifficultyDistribution, isDistValid } from "@/components/teacher/difficulty-distribution";
import {
  ArrowLeft, ClipboardList, HelpCircle, Save, Send, Eye, Sparkles, Shuffle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Method = "manual" | "question-bank";

export const Route = createFileRoute("/teacher/homework/create")({
  validateSearch: (s: Record<string, unknown>) => ({
    classId: typeof s.classId === "string" ? s.classId : undefined,
    source: s.source === "question-bank" ? ("question-bank" as const) : undefined,
    resourceId: typeof s.resourceId === "string" ? s.resourceId : undefined,
    topicId: typeof s.topicId === "string" ? s.topicId : undefined,
  }),
  component: CreateHomework,
});

function CreateHomework() {
  const { classId, source, resourceId, topicId } = Route.useSearch();
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
      navigate({ to: "/teacher/homework" });
    }
  };

  const handleDone = (title: string, assignedClassId: string) => {
    setCreatedClassId(assignedClassId);
    setDone(title);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <SuccessBanner title="Homework assigned">
          {done} has been assigned to the class.
        </SuccessBanner>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setMethod(null);
              setDone(null);
            }}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Assign another
          </Button>
          {createdClassId && (
            <Button asChild variant="outline">
              <Link to="/teacher/classes/$classId/homework" params={{ classId: createdClassId }}>
                View class homework
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/teacher/homework">Back to homework</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!method) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="New homework"
          title="How do you want to create this homework?"
          subtitle="Pick the source of the questions and content."
          showBack={true}
          onBack={handleBack}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <MethodCard icon={ClipboardList} title="Manual" desc="Write the homework yourself." badge="Editor" onClick={() => setMethod("manual")} />
          <MethodCard icon={HelpCircle} title="From Question Bank" desc="Generate practice questions by difficulty." badge="Generator" onClick={() => setMethod("question-bank")} />
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
      {method === "manual" && <ManualHW lockedClass={lockedClass} onDone={handleDone} />}
      {method === "question-bank" && <QuestionBankHW lockedClass={lockedClass} topicId={topicId} onDone={handleDone} />}
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

function CommonFields({
  form,
  set,
  classes,
  lockedClass,
}: {
  form: Record<string, unknown>;
  set: (v: Record<string, unknown>) => void;
  classes: { id: string; name: string; level: string }[];
  lockedClass: { id: string; name: string; level: string } | null;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Target class</Label>
        {lockedClass ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
            <LevelBadge level={lockedClass.level} />
            <span className="text-sm">{lockedClass.name}</span>
            <span className="ml-auto text-[10px] uppercase text-muted-foreground">Locked</span>
          </div>
        ) : (
          <Select
            value={form.classId as string}
            onValueChange={(v: string) => set({ ...form, classId: v })}
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Due date</Label>
          <Input
            type="date"
            value={form.dueDate as string}
            onChange={(e) => set({ ...form, dueDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Duration (min)</Label>
          <Input
            type="number"
            value={form.duration as number}
            onChange={(e) => set({ ...form, duration: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max score</Label>
          <Input
            type="number"
            value={form.maxScore as number}
            onChange={(e) => set({ ...form, maxScore: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Attempts</Label>
          <Input
            type="number"
            value={form.attempts as number}
            onChange={(e) => set({ ...form, attempts: Number(e.target.value) || 1 })}
          />
        </div>
      </div>
    </>
  );
}

function ManualHW({
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
  const [form, setForm] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: "",
    instructions: "",
    dueDate: "",
    maxScore: 100,
    attempts: 2,
    duration: 60,
  });
  const [preview, setPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const valid = !!(form.title && form.instructions && form.dueDate && form.classId);

  const handleAssign = async () => {
    if (!valid) return;
    setIsSaving(true);
    try {
      await homeworkApi.createHomework({
        classId: form.classId,
        title: form.title,
        instructions: form.instructions,
        dueDate: new Date(form.dueDate).toISOString(),
        maxScore: form.maxScore,
        attempts: form.attempts,
      });
      // Invalidate all related queries so class homework tab refreshes immediately
      await queryClient.invalidateQueries({ queryKey: ["teacherHomeworksByClass", form.classId] });
      await queryClient.invalidateQueries({ queryKey: ["teacherClassDetail", form.classId] });
      await queryClient.invalidateQueries({ queryKey: ["teacherClasses"] });
      toast.success("Homework assigned successfully!");
      onDone(form.title, form.classId);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to assign homework. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!valid) return;
    setIsSaving(true);
    try {
      await homeworkApi.createHomework({
        classId: form.classId,
        title: form.title,
        instructions: form.instructions,
        dueDate: new Date(form.dueDate).toISOString(),
        maxScore: form.maxScore,
        attempts: form.attempts,
      });
      await queryClient.invalidateQueries({ queryKey: ["teacherHomeworksByClass", form.classId] });
      await queryClient.invalidateQueries({ queryKey: ["teacherClassDetail", form.classId] });
      toast.success("Draft saved!");
      onDone(form.title, form.classId);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Manual homework" title="Write your homework" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Te-form Practice"
              />
            </div>
            <div className="space-y-2">
              <Label>Instructions *</Label>
              <Textarea
                rows={8}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Complete exercises 1–10. Submit your audio recording…"
              />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CommonFields form={form} set={setForm} classes={classes} lockedClass={lockedClass} />
            </CardContent>
          </Card>
          <div className="space-y-2">
            <Button className="w-full" variant="outline" onClick={() => setPreview(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={!valid || isSaving}
              onClick={handleSaveDraft}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save draft"}
            </Button>
            <Button
              className="w-full"
              disabled={!valid || isSaving}
              onClick={handleAssign}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSaving ? "Assigning..." : "Assign homework"}
            </Button>
          </div>
        </div>
      </div>
      <PreviewSheet
        open={preview}
        onOpenChange={setPreview}
        title={form.title || "Homework preview"}
      >
        <p className="whitespace-pre-wrap text-sm">
          {form.instructions || (
            <em className="text-muted-foreground">Add instructions to preview.</em>
          )}
        </p>
      </PreviewSheet>
    </div>
  );
}

function QuestionBankHW({
  lockedClass,
  topicId,
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
  const topics = getQuestionTopics();
  const init = topicId ? getQuestionTopicById(topicId) : null;
  if (topicId && !init) toast.warning("Topic not found in Question Bank");

  const [selectedTopics, setSelectedTopics] = useState<string[]>(init ? [init.id] : []);
  const [form, setForm] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: init ? `${init.name} — Practice` : "Question Bank Homework",
    level: init?.level ?? lockedClass?.level ?? "N5",
    total: 20,
    dist: { easy: 50, medium: 30, hard: 20 },
    dueDate: "",
    maxScore: 100,
    attempts: 2,
    duration: 45,
  });
  const [preview, setPreview] = useState<Question[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const available = useMemo(() => getAggregatedTopicCounts(selectedTopics), [selectedTopics]);
  const distOk = isDistValid(form.dist, form.total, available);
  const canGenerate = selectedTopics.length > 0 && distOk;
  const canAssign = canGenerate && !!form.dueDate && !!form.classId;

  const toggleTopic = (id: string) =>
    setSelectedTopics((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const generate = () => {
    const qs = getQuestionsForRandomGeneration({
      topicIds: selectedTopics,
      total: form.total,
      easyPct: form.dist.easy,
      mediumPct: form.dist.medium,
      hardPct: form.dist.hard,
    });
    setPreview(qs);
    toast.success(`Generated ${qs.length} questions`);
  };

  const handleAssign = async () => {
    if (!canAssign) return;
    setIsSaving(true);
    try {
      await homeworkApi.createHomework({
        classId: form.classId,
        title: form.title as string,
        instructions: `Question Bank homework: ${selectedTopics.join(", ")}. ${form.total} questions.`,
        dueDate: new Date(form.dueDate).toISOString(),
        maxScore: form.maxScore,
        attempts: form.attempts,
      });
      // Invalidate all related queries so class homework tab refreshes immediately
      await queryClient.invalidateQueries({ queryKey: ["teacherHomeworksByClass", form.classId] });
      await queryClient.invalidateQueries({ queryKey: ["teacherClassDetail", form.classId] });
      await queryClient.invalidateQueries({ queryKey: ["teacherClasses"] });
      toast.success("Homework assigned successfully!");
      onDone(form.title as string, form.classId);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to assign homework. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="From Question Bank · Generator"
        title="Generate practice homework"
        subtitle="Choose topics and the difficulty mix — we'll randomize from the Question Bank."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Topics from the Question Bank</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {topics
                .filter((t) => t.level === form.level)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTopic(t.id)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-all",
                      selectedTopics.includes(t.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/40",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <LevelBadge level={t.level} />
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {t.skill}
                      </span>
                    </div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="font-jp text-xs text-muted-foreground">{t.jpName}</div>
                    <div className="mt-2 flex gap-2 text-[10px]">
                      <DifficultyBadge d="Easy" />
                      <span>{t.easy}</span>
                      <DifficultyBadge d="Medium" />
                      <span>{t.medium}</span>
                      <DifficultyBadge d="Hard" />
                      <span>{t.hard}</span>
                    </div>
                  </button>
                ))}
              {topics.filter((t) => t.level === form.level).length === 0 && (
                <div className="col-span-2 rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No topics for this level. Pick another level.
                </div>
              )}
            </CardContent>
          </Card>

          <DifficultyDistribution
            value={form.dist}
            onChange={(v) => setForm({ ...form, dist: v })}
            total={form.total}
            available={available}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CommonFields
                form={form}
                set={setForm as (v: Record<string, unknown>) => void}
                classes={classes}
                lockedClass={lockedClass}
              />
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title as string}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={form.level as string}
                    onValueChange={(v) => {
                      setForm({ ...form, level: v });
                      setSelectedTopics([]);
                      setPreview(null);
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
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button className="w-full" variant="outline" disabled={!canGenerate} onClick={generate}>
              <Shuffle className="mr-2 h-4 w-4" />
              Generate preview
            </Button>
            <Button className="w-full" variant="outline" disabled={!preview} onClick={generate}>
              <Sparkles className="mr-2 h-4 w-4" />
              Randomize again
            </Button>
            <Button
              className="w-full"
              disabled={!canAssign || isSaving}
              onClick={handleAssign}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSaving ? "Assigning..." : "Assign homework"}
            </Button>
          </div>
        </div>
      </div>

      {preview && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Generated questions ({preview.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {preview.map((q, i) => (
              <div key={q.id + i} className="rounded-lg border p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                  <DifficultyBadge d={q.difficulty} />
                  <span className="ml-auto text-xs text-muted-foreground">{q.points} pts</span>
                </div>
                <div className="font-medium">{q.prompt}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

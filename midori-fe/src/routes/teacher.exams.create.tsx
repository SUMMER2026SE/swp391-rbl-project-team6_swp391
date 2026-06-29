import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/teacher/teacher-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getClasses,
  getQuestionTopics,
  getQuestionTopicById,
  getQuestionsForRandomGeneration,
  getAggregatedTopicCounts,
  getJlptExamSets,
  getJlptSetById,
  type Question,
} from "@/data/teacher-data";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Method = "manual" | "question-bank" | "jlpt-bank";

export const Route = createFileRoute("/teacher/exams/create")({
  validateSearch: (s: Record<string, unknown>) => ({
    classId: typeof s.classId === "string" ? s.classId : undefined,
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
  const { classId, source, topicId, jlptSetId } = Route.useSearch();
  const navigate = useNavigate();
  const classes = getClasses();
  const lockedClass = classId ? classes.find((c) => c.id === classId) : null;
  const init: Method | null = (source as Method) ?? null;
  const [method, setMethod] = useState<Method | null>(init);
  const [done, setDone] = useState<string | null>(null);

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
      {method === "manual" && <ManualExam lockedClass={lockedClass} onDone={setDone} />}
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

function ManualExam({
  lockedClass,
  onDone,
}: {
  lockedClass: ReturnType<typeof getClasses>[number] | null;
  onDone: (t: string) => void;
}) {
  const classes = getClasses();
  const [form, setForm] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: "",
    level: lockedClass?.level ?? "N5",
    duration: 60,
    attempts: 1,
  });
  const [questions, setQuestions] = useState<ManualQ[]>([
    { id: "q1", text: "", options: ["", "", "", ""], correct: 0, points: 2 },
  ]);
  const [editIdx, setEditIdx] = useState<number | null>(0);
  const [preview, setPreview] = useState(false);

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
              disabled={!valid}
              onClick={() => {
                toast.success("Draft saved");
                onDone(form.title);
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Save draft
            </Button>
            <Button
              className="w-full"
              disabled={!valid}
              onClick={() => {
                toast.success("Exam published");
                onDone(form.title);
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Publish & assign
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
  lockedClass: ReturnType<typeof getClasses>[number] | null;
  topicId?: string;
  onDone: (t: string) => void;
}) {
  const classes = getClasses();
  const topics = getQuestionTopics();
  const init = topicId ? getQuestionTopicById(topicId) : null;
  if (topicId && !init) toast.warning("Topic not found in Question Bank");

  const [form, setForm] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: init ? `${init.name} Assessment` : "Random Generated Exam",
    level: init?.level ?? lockedClass?.level ?? "N5",
    total: 30,
    duration: 60,
    dist: { easy: 40, medium: 40, hard: 20 },
  });
  const [selectedTopics, setSelectedTopics] = useState<string[]>(init ? [init.id] : []);
  const [generated, setGenerated] = useState<Question[] | null>(null);
  const [locked, setLocked] = useState<Set<string>>(new Set());

  const available = useMemo(() => getAggregatedTopicCounts(selectedTopics), [selectedTopics]);
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
              disabled={!generated}
              onClick={() => {
                toast.success("Draft saved");
                onDone(form.title);
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Save draft
            </Button>
            <Button
              disabled={!generated}
              onClick={() => {
                toast.success("Exam published");
                onDone(form.title);
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Publish & assign
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
                    <div className="text-sm font-medium">{q.prompt}</div>
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

function JlptExam({
  lockedClass,
  jlptSetId,
  onDone,
}: {
  lockedClass: ReturnType<typeof getClasses>[number] | null;
  jlptSetId?: string;
  onDone: (t: string) => void;
}) {
  const classes = getClasses();
  const sets = getJlptExamSets();
  const init = jlptSetId ? getJlptSetById(jlptSetId) : null;
  if (jlptSetId && !init) toast.warning("JLPT set not found");
  const [selectedId, setSelectedId] = useState<string | null>(init?.id ?? null);
  const set = sets.find((s) => s.id === selectedId);
  const [form, setForm] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: set?.title ?? "",
    instructions: "Bring writing materials. The exam will run for the full duration.",
    dueDate: "",
  });
  const [preview, setPreview] = useState(false);

  const valid = !!(set && form.title && form.dueDate);

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
            {sets.map((s) => (
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
                  <span className="text-xs text-muted-foreground">{s.year}</span>
                </div>
                <div className="font-display text-base font-semibold">{s.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
                  <div className="rounded-md bg-muted/40 p-1.5">
                    <div className="text-muted-foreground">Duration</div>
                    <div className="font-bold">{s.duration}m</div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-1.5">
                    <div className="text-muted-foreground">Questions</div>
                    <div className="font-bold">{s.totalQuestions}</div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-1.5">
                    <div className="text-muted-foreground">Sections</div>
                    <div className="font-bold">{s.sections.length}</div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-1.5">
                    <div className="text-muted-foreground">Mix E/M/H</div>
                    <div className="font-bold">
                      {s.mix.easy}/{s.mix.medium}/{s.mix.hard}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {set ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Selected set</div>
                  <div className="font-medium">{set.title}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Level {set.level} · {set.duration} min · {set.totalQuestions} questions ·
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
              disabled={!set}
              onClick={() => setPreview(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview set
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={!valid}
              onClick={() => {
                toast.success("Draft saved");
                onDone(form.title);
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Save draft
            </Button>
            <Button
              className="w-full"
              disabled={!valid}
              onClick={() => {
                toast.success("Exam published");
                onDone(form.title);
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Use this set & publish
            </Button>
          </div>
        </div>
      </div>

      <PreviewSheet
        open={preview}
        onOpenChange={setPreview}
        title={set?.title ?? ""}
        description={
          set ? `Level ${set.level} · ${set.duration} min · ${set.totalQuestions} questions` : ""
        }
      >
        {set && (
          <div className="space-y-3 text-sm">
            <p>{set.description}</p>
            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">Sections</div>
              <ul className="space-y-1">
                {set.sections.map((s) => (
                  <li key={s.name} className="flex justify-between rounded-md border p-2">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground">{s.questions} questions</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">Difficulty mix</div>
              <div className="flex gap-2">
                <DifficultyBadge d="Easy" /> {set.mix.easy}% <DifficultyBadge d="Medium" />{" "}
                {set.mix.medium}% <DifficultyBadge d="Hard" /> {set.mix.hard}%
              </div>
            </div>
          </div>
        )}
      </PreviewSheet>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { teacherQuestionsApi, type TeacherQuestionResponse } from "@/lib/api/teacherQuestions";
import { LevelBadge, DifficultyBadge } from "@/components/teacher/badges";
import { PreviewSheet, SuccessBanner } from "@/components/teacher/dialogs";
import { DifficultyDistribution, isDistValid } from "@/components/teacher/difficulty-distribution";
import {
  ArrowLeft, ClipboardList, HelpCircle, Save, Send, Eye, Sparkles, Shuffle, Plus, AlertCircle, CheckCircle, Loader2, Upload
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Method = "ai-pdf" | "question-bank";

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
          <MethodCard icon={Sparkles} title="AI PDF Homework" desc="Upload a PDF and let AI generate homework questions automatically." badge="AI Generator" onClick={() => setMethod("ai-pdf")} />
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
      {method === "ai-pdf" && <HomeworkAiPdfPlaceholder />}
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



function QuestionBankHW({
  lockedClass,
  onDone,
}: {
  lockedClass: any | null;
  topicId?: string;
  onDone: (t: string, classId: string) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });

  // Flow State
  const [level, setLevel] = useState<string>(lockedClass?.level ?? "N5");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [totalQuestions, setTotalQuestions] = useState<number>(20);
  const [dist, setDist] = useState({ easy: 40, medium: 40, hard: 20 });

  // Metadata Form State
  const [metadata, setMetadata] = useState({
    classId: lockedClass?.id ?? classes[0]?.id ?? "",
    title: "Question Bank Homework",
    dueDate: "",
    duration: 45,
    attempts: 2,
    maxScore: 100,
  });

  const [preview, setPreview] = useState<TeacherQuestionResponse[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // 1. Fetch skills from backend
  const { data: availableSkills = [] } = useQuery({
    queryKey: ["questionBankSkills"],
    queryFn: async () => {
      const res = await teacherQuestionsApi.getQuestionBankSkills();
      return res;
    },
  });

  // 2. Fetch lessons by JLPT Level and Skills
  const { data: lessons = [], isLoading: isLoadingLessons } = useQuery({
    queryKey: ["questionBankLessonsGenerator", level, selectedSkills],
    queryFn: async () => {
      if (!level || selectedSkills.length === 0) return [];
      const res = await teacherQuestionsApi.getQuestionBankLessons(level, selectedSkills);
      return res;
    },
    enabled: !!level && selectedSkills.length > 0,
    placeholderData: (prev) => prev,
  });

  // Selection Reset: Keep only lessons that still exist in the new response
  useEffect(() => {
    if (lessons.length > 0 && selectedLessons.length > 0) {
      const validIds = new Set(lessons.map((les) => les.id));
      setSelectedLessons((prev) => prev.filter((id) => validIds.has(id)));
    } else if (lessons.length === 0 || selectedSkills.length === 0) {
      setSelectedLessons([]);
    }
  }, [lessons, selectedSkills]);

  // Reset lessons selection when level changes
  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    setSelectedLessons([]);
    setPreview(null);
    setBackendError(null);
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) => {
      const updated = prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill];
      setPreview(null);
      setBackendError(null);
      return updated;
    });
  };

  const handleLessonToggle = (lessonId: number) => {
    setSelectedLessons((prev) => {
      const updated = prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId];
      setPreview(null);
      setBackendError(null);
      return updated;
    });
  };

  // Calculate live availability & needed counts
  const { needed, available, isAvailable } = useMemo(() => {
    // 1. Calculate needed counts exactly as backend does
    let easyNeeded = Math.round((dist.easy * totalQuestions) / 100.0);
    let mediumNeeded = Math.round((dist.medium * totalQuestions) / 100.0);
    let hardNeeded = Math.round((dist.hard * totalQuestions) / 100.0);

    const diff = totalQuestions - (easyNeeded + mediumNeeded + hardNeeded);
    if (diff !== 0) {
      const maxRatio = Math.max(dist.easy, Math.max(dist.medium, dist.hard));
      if (maxRatio === dist.easy) {
        easyNeeded += diff;
      } else if (maxRatio === dist.medium) {
        mediumNeeded += diff;
      } else {
        hardNeeded += diff;
      }
    }

    // 2. Sum up available counts from selected lessons
    let easyAvail = 0;
    let mediumAvail = 0;
    let hardAvail = 0;

    selectedLessons.forEach((lId) => {
      const l = lessons.find((les) => les.id === lId);
      if (l) {
        easyAvail += l.easy;
        mediumAvail += l.medium;
        hardAvail += l.hard;
      }
    });

    const meetsEasy = easyAvail >= easyNeeded;
    const meetsMedium = mediumAvail >= mediumNeeded;
    const meetsHard = hardAvail >= hardNeeded;

    return {
      needed: { easy: easyNeeded, medium: mediumNeeded, hard: hardNeeded },
      available: { easy: easyAvail, medium: mediumAvail, hard: hardAvail },
      isAvailable: meetsEasy && meetsMedium && meetsHard && (dist.easy + dist.medium + dist.hard === 100),
    };
  }, [selectedLessons, lessons, dist, totalQuestions]);

  const handleGeneratePreview = async () => {
    if (selectedLessons.length === 0) {
      toast.error("Please select at least one lesson.");
      return;
    }
    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill.");
      return;
    }
    if (dist.easy + dist.medium + dist.hard !== 100) {
      toast.error("Difficulty distribution must equal 100%.");
      return;
    }

    setIsGenerating(true);
    setBackendError(null);
    try {
      const res = await teacherQuestionsApi.randomizeQuestions({
        level,
        skills: selectedSkills,
        lessonIds: selectedLessons,
        difficulty: dist,
        questionCount: totalQuestions,
      });
      setPreview(res);
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
      await homeworkApi.createHomework({
        classId: metadata.classId,
        title: metadata.title,
        instructions: `Generated from Question Bank (${level}). Skills: ${selectedSkills.join(", ")}.`,
        dueDate: new Date(metadata.dueDate).toISOString(),
        maxScore: metadata.maxScore,
        attempts: metadata.attempts,
        timeLimit: metadata.duration,
        questionIds: questionIds,
      });

      await queryClient.invalidateQueries({ queryKey: ["teacherHomeworksByClass", metadata.classId] });
      await queryClient.invalidateQueries({ queryKey: ["teacherClassDetail", metadata.classId] });
      await queryClient.invalidateQueries({ queryKey: ["teacherClasses"] });

      toast.success("Homework assigned successfully!");
      onDone(metadata.title, metadata.classId);
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign homework.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="From Question Bank · Generator"
        title="Generate practice homework"
        subtitle="Step-by-step selection to generate custom homework from Admin Question Bank."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column: Step Selection */}
        <div className="space-y-6">
          {/* Step 1: Select JLPT Level */}
          <Card className="overflow-hidden border-[var(--border)] bg-card shadow-sm">
            <CardHeader className="bg-[var(--accent)]/10 pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
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
                      "px-4 py-2.5 rounded-xl border text-sm font-bold transition-all duration-200",
                      level === lvl
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-[var(--border)] hover:border-primary/50 text-secondary-col"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Select Skills */}
          <Card className="overflow-hidden border-[var(--border)] bg-card shadow-sm">
            <CardHeader className="bg-[var(--accent)]/10 pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                Select Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3">
                {availableSkills.map((skill) => (
                  <label
                    key={skill}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer select-none transition-all duration-200",
                      selectedSkills.includes(skill)
                        ? "border-primary bg-primary/5 text-primary-col"
                        : "border-[var(--border)] hover:border-primary/40 text-secondary-col"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-[var(--border)] text-primary focus:ring-primary h-4 w-4"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => handleSkillToggle(skill)}
                    />
                    <span className="text-sm font-semibold capitalize">{skill.toLowerCase()}</span>
                  </label>
                ))}
                {availableSkills.length === 0 && (
                  <div className="text-xs text-muted-col py-2">Loading skills...</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Choose Lessons */}
          <Card className="overflow-hidden border-[var(--border)] bg-card shadow-sm">
            <CardHeader className="bg-[var(--accent)]/10 pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                Select Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {selectedSkills.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-muted-col">
                  Please select at least one skill in Step 2 to load lessons.
                </div>
              ) : isLoadingLessons ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="rounded-xl border border-[var(--border)] p-3.5 bg-card animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="flex gap-2">
                        <div className="h-3 bg-muted rounded w-12"></div>
                        <div className="h-3 bg-muted rounded w-12"></div>
                        <div className="h-3 bg-muted rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : lessons.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--status-rejected)] bg-[var(--status-rejected)]/5 font-semibold">
                  No lessons containing active questions were found for the selected skills.
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
                          : "border-[var(--border)] hover:border-primary/40 bg-card"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-bold text-primary-col line-clamp-1">{les.name}</span>
                        <input
                          type="checkbox"
                          checked={selectedLessons.includes(les.id)}
                          readOnly
                          className="rounded border-[var(--border)] text-primary focus:ring-primary h-4 w-4 mt-0.5"
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] text-muted-col font-medium">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--accent)] border border-[var(--border)] text-[var(--status-draft)] font-semibold">Easy: {les.easy}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--accent)] border border-[var(--border)] text-[var(--status-review)] font-semibold">Medium: {les.medium}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--accent)] border border-[var(--border)] text-[var(--status-rejected)] font-semibold">Hard: {les.hard}</span>
                        <span className="ml-auto font-bold text-primary-col">Total: {les.questionCount}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Form configurations & live count & Preview actions */}
        <div className="space-y-4">
          {/* Step 4: Assignment Configurations */}
          <Card className="border-[var(--border)] bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                Homework Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Target class</Label>
                {lockedClass ? (
                  <div className="flex items-center gap-2 rounded-lg border bg-[var(--accent)]/50 p-2.5">
                    <LevelBadge level={lockedClass.level} />
                    <span className="text-sm font-semibold">{lockedClass.name}</span>
                    <span className="ml-auto text-[10px] font-bold uppercase text-muted-col bg-muted border px-1.5 py-0.5 rounded">Locked</span>
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
                <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Title</Label>
                <Input
                  className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  placeholder="E.g., Kanji N5 Lesson 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Due date</Label>
                  <Input
                    type="datetime-local"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                    value={metadata.dueDate}
                    onChange={(e) => setMetadata({ ...metadata, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Duration (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                    value={metadata.duration}
                    onChange={(e) => setMetadata({ ...metadata, duration: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Max score</Label>
                  <Input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                    value={metadata.maxScore}
                    onChange={(e) => setMetadata({ ...metadata, maxScore: Math.max(1, Number(e.target.value) || 0) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Attempts</Label>
                  <Input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                    value={metadata.attempts}
                    onChange={(e) => setMetadata({ ...metadata, attempts: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Total Questions</Label>
                <Input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 5: Difficulty Distribution */}
          <Card className="border-[var(--border)] bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">5</span>
                Difficulty Mix (%)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-col uppercase">Easy %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-center"
                    value={dist.easy}
                    onChange={(e) => setDist({ ...dist, easy: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-col uppercase">Medium %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-center"
                    value={dist.medium}
                    onChange={(e) => setDist({ ...dist, medium: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-col uppercase">Hard %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-center"
                    value={dist.hard}
                    onChange={(e) => setDist({ ...dist, hard: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                  />
                </div>
              </div>

              {dist.easy + dist.medium + dist.hard !== 100 && (
                <div className="text-[10px] text-[var(--status-rejected)] font-bold bg-[var(--status-rejected)]/10 p-2 rounded-lg flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Sum of percentages must equal 100% (currently {dist.easy + dist.medium + dist.hard}%).</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Question Availability status */}
          <Card className="border-[var(--border)] bg-card shadow-sm">
            <CardHeader className="pb-2 border-b border-[var(--border)]">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-secondary-col">
                Live Question Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold pb-1 border-b">
                  <span className="text-left text-muted-col">Difficulty</span>
                  <span className="text-primary-col">Need</span>
                  <span className="text-secondary-col">Available</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <span className="text-left font-bold text-[var(--status-draft)]">Easy</span>
                  <span className="font-bold">{needed.easy}</span>
                  <span className={cn("font-bold", available.easy >= needed.easy ? "text-green-600" : "text-[var(--status-rejected)]")}>
                    {available.easy}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <span className="text-left font-bold text-[var(--status-review)]">Medium</span>
                  <span className="font-bold">{needed.medium}</span>
                  <span className={cn("font-bold", available.medium >= needed.medium ? "text-green-600" : "text-[var(--status-rejected)]")}>
                    {available.medium}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs border-b pb-2">
                  <span className="text-left font-bold text-[var(--status-rejected)]">Hard</span>
                  <span className="font-bold">{needed.hard}</span>
                  <span className={cn("font-bold", available.hard >= needed.hard ? "text-green-600" : "text-[var(--status-rejected)]")}>
                    {available.hard}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold pt-1">
                  <span className="text-left text-primary-col">Total</span>
                  <span>{totalQuestions}</span>
                  <span>{available.easy + available.medium + available.hard}</span>
                </div>
              </div>

              {!isAvailable && selectedLessons.length > 0 && (
                <div className="mt-3 text-[10px] text-[var(--status-rejected)] font-bold bg-[var(--status-rejected)]/10 p-2 rounded-lg flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Not enough questions available. Please reduce total questions, adjust difficulty mix, or select more lessons.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generator buttons */}
          <div className="space-y-2 pt-2">
            <Button
              className="w-full flex items-center justify-center gap-1.5"
              variant="outline"
              disabled={selectedLessons.length === 0 || selectedSkills.length === 0 || !isAvailable || isGenerating}
              onClick={handleGeneratePreview}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Generating...
                </>
              ) : (
                <>
                  <Shuffle className="w-4 h-4" />
                  Generate Preview
                </>
              )}
            </Button>
            <Button
              className="w-full flex items-center justify-center gap-1.5"
              disabled={!preview || isSaving}
              onClick={handleAssign}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Assign Homework
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Backend API Error Display */}
      {backendError && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--status-rejected)]/10 border border-[var(--status-rejected)]/20 text-[var(--status-rejected)] text-sm flex flex-col gap-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Randomization Failed</span>
          </div>
          <p className="whitespace-pre-line text-xs font-semibold leading-relaxed pl-7">{backendError}</p>
        </div>
      )}

      {/* Generated Preview questions */}
      {preview && (
        <Card className="border-[var(--border)] bg-card shadow-sm mt-6">
          <CardHeader className="bg-[var(--accent)]/10 pb-3 border-b border-[var(--border)] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-col flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Generated questions preview ({preview.length})
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
              <div key={q.id} className="p-4 flex items-start gap-4 transition-all hover:bg-[var(--accent)]/10">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-xs font-bold">
                  {i + 1}
                </span>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {q.skill}
                    </span>
                    <DifficultyBadge d={q.difficulty === "EASY" ? "Easy" : q.difficulty === "HARD" ? "Hard" : "Medium"} />
                    <span className="ml-auto text-xs text-muted-col font-bold">
                      {q.points || 1} pt(s)
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary-col leading-relaxed">
                    {q.prompt}
                  </p>
                  {q.jpPrompt && (
                    <p className="font-jp text-xs text-secondary-col">
                      {q.jpPrompt}
                    </p>
                  )}
                  {q.options && q.options.length > 0 && (
                    <div className="grid gap-1.5 sm:grid-cols-2 mt-2 pl-2 border-l-2 border-[var(--border)]">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={cn(
                            "text-xs px-2.5 py-1.5 rounded-md border",
                            optIdx === q.correctAnswerIndex
                              ? "bg-green-500/10 border-green-500/30 text-green-700 font-bold"
                              : "bg-[var(--accent)] border-[var(--border)] text-secondary-col"
                          )}
                        >
                          <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HomeworkAiPdfPlaceholder() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="card-base p-6 border border-[var(--border)] bg-card rounded-2xl shadow-sm text-center">
        <h2 className="font-display font-black text-2xl text-primary-col mb-2">
          AI PDF Homework Generator
        </h2>
        <p className="text-sm text-secondary-col">
          Generate homework automatically by uploading a course syllabus, exam paper, or study material PDF.
        </p>
      </div>

      {/* Stepper UI */}
      <div className="flex items-center justify-between max-w-xl mx-auto px-4">
        {[
          { step: 1, label: "Upload PDF" },
          { step: 2, label: "AI Parsing" },
          { step: 3, label: "Preview & Edit" },
          { step: 4, label: "Assign" },
        ].map((s, idx, arr) => (
          <div key={s.step} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display border",
                s.step === 1 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "bg-background border-[var(--border)] text-muted-foreground"
              )}>
                {s.step}
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {s.label}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <div className="h-[2px] bg-[var(--border)] flex-1 -mx-2 -mt-4" />
            )}
          </div>
        ))}
      </div>

      {/* Upload area UI */}
      <div className="card-base p-12 border-2 border-dashed border-[var(--border)] text-center bg-card/50 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display font-bold text-lg text-primary-col mb-1">
          Upload PDF File
        </h3>
        <p className="text-sm text-secondary-col mb-6">
          Drag and drop your PDF here, or click to browse.
        </p>
        <Button disabled variant="outline" className="px-6 py-2.5 rounded-xl font-bold">
          Choose PDF File
        </Button>
      </div>

      {/* Empty Preview area UI */}
      <div className="card-base p-8 border border-[var(--border)] bg-card/30 rounded-2xl text-center">
        <p className="text-sm text-muted-col italic">
          No questions generated yet. Upload a PDF above to preview questions.
        </p>
      </div>

      {/* Action footer */}
      <div className="flex justify-end pt-4 border-t border-[var(--border)]">
        <Button disabled size="lg" className="px-8 py-3 font-bold rounded-xl bg-muted text-muted-foreground border border-[var(--border)]">
          AI PDF Homework Coming Soon
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { classesApi, type ClassResponse } from "@/lib/api/classes";
import { teacherQuestionsApi } from "@/lib/api/teacherQuestions";
import {
  questionBankAssignApi,
  type AssignExamFromBankRequest,
  type AssignHomeworkFromBankRequest,
} from "@/lib/api/questionBankAssign";

/* ---------- shared types ---------- */

export interface QuestionBankTopicInfo {
  id: string;
  name: string;
  level: string;
  skill: string;
  questionCount: number;
}

/* ---------- date helpers ---------- */

function combineDateTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  const iso = new Date(`${date}T${time}:00`).toISOString();
  return iso;
}

function defaultDueDate(): { date: string; time: string } {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000 * 2); // +2 days
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: "23:59" };
}

/* ---------- homework modal ---------- */

const homeworkSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  instructions: z.string().optional(),
  classIds: z.array(z.string()).min(1, "Select at least one class"),
  dueDate: z.string().min(1, "Due date is required"),
  dueTime: z.string().min(1, "Due time is required"),
  maxScore: z
    .number({ message: "Max score is required" })
    .int()
    .positive("Max score must be greater than 0"),
});

type HomeworkFormValues = z.infer<typeof homeworkSchema>;

export function AssignHomeworkModal({
  open,
  onOpenChange,
  topic,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  topic: QuestionBankTopicInfo | null;
}) {
  const queryClient = useQueryClient();
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["teacherClassesSelectable"],
    queryFn: () => classesApi.getSelectableClasses(),
    enabled: open,
  });

  const defaults = useMemo(() => defaultDueDate(), []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HomeworkFormValues>({
    resolver: zodResolver(homeworkSchema),
    defaultValues: {
      title: topic?.name ?? "",
      instructions: "",
      classIds: [],
      dueDate: defaults.date,
      dueTime: defaults.time,
      maxScore: 100,
    },
  });

  useEffect(() => {
    if (open && topic) {
      reset({
        title: topic.name,
        instructions: "",
        classIds: [],
        dueDate: defaults.date,
        dueTime: defaults.time,
        maxScore: 100,
      });
    }
  }, [open, topic, reset, defaults.date, defaults.time]);

  const mutation = useMutation({
    mutationFn: (body: AssignHomeworkFromBankRequest) =>
      questionBankAssignApi.assignHomework(topic!.id, body),
    onSuccess: (res) => {
      toast.success(`Homework assigned to ${res.created} class${res.created === 1 ? "" : "es"}.`);
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      queryClient.invalidateQueries({ queryKey: ["teacherHomeworks"] });
      queryClient.invalidateQueries({ queryKey: ["classHomework"] });
      queryClient.invalidateQueries({ queryKey: ["examsByClass"] });
      queryClient.invalidateQueries({ queryKey: ["teacherClassDetail"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to assign homework.");
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (!topic) return;
    const dueDate = combineDateTime(values.dueDate, values.dueTime);
    if (!dueDate) {
      toast.error("Please select a valid due date and time.");
      return;
    }
    mutation.mutate({
      title: values.title,
      instructions: values.instructions || undefined,
      classIds: values.classIds,
      dueDate,
      maxScore: values.maxScore,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Homework</DialogTitle>
          <DialogDescription>
            Assign questions from this topic to one or more classes. Students will see it
            immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="hw-title">Homework title</Label>
            <Input id="hw-title" {...register("title")} placeholder="e.g. Grammar Practice 1" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hw-instructions">Instructions</Label>
            <Textarea
              id="hw-instructions"
              {...register("instructions")}
              placeholder="Optional instructions for students"
              rows={2}
            />
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selected Topic</span>
              <span className="font-medium">{topic ? `${topic.skill} — ${topic.name}` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selected Questions</span>
              <span className="font-medium">{topic?.questionCount ?? 0} questions</span>
            </div>
          </div>

          <Controller
            control={control}
            name="classIds"
            render={({ field }) => (
              <ClassMultiSelect
                label="Assign To Classes"
                required
                classes={classes}
                loading={classesLoading}
                value={field.value ?? []}
                onChange={field.onChange}
                error={errors.classIds?.message}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="hw-due-date">Due Date</Label>
              <Input id="hw-due-date" type="date" {...register("dueDate")} />
              {errors.dueDate && (
                <p className="text-xs text-destructive">{errors.dueDate.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hw-due-time">Time</Label>
              <Input id="hw-due-time" type="time" {...register("dueTime")} />
              {errors.dueTime && (
                <p className="text-xs text-destructive">{errors.dueTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hw-max">Maximum Score</Label>
            <Input
              id="hw-max"
              type="number"
              min={1}
              {...register("maxScore", { valueAsNumber: true })}
            />
            {errors.maxScore && (
              <p className="text-xs text-destructive">{errors.maxScore.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || isSubmitting}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Homework
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- exam modal ---------- */

const examSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  instructions: z.string().optional(),
  additionalTopicIds: z.array(z.string()),
  classIds: z.array(z.string()).min(1, "Select at least one class"),
  dueDate: z.string().min(1, "Due date is required"),
  dueTime: z.string().min(1, "Due time is required"),
  durationMinutes: z
    .number({ message: "Duration is required" })
    .int()
    .positive("Duration must be greater than 0"),
  maxScore: z
    .number({ message: "Max score is required" })
    .int()
    .positive("Max score must be greater than 0"),
});

type ExamFormValues = z.infer<typeof examSchema>;

export function AssignExamModal({
  open,
  onOpenChange,
  topic,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  topic: QuestionBankTopicInfo | null;
}) {
  const queryClient = useQueryClient();
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["teacherClassesSelectable"],
    queryFn: () => classesApi.getSelectableClasses(),
    enabled: open,
  });
  const { data: allQuestions = [] } = useQuery({
    queryKey: ["teacherQuestions"],
    queryFn: () => teacherQuestionsApi.getQuestions(),
    enabled: open,
  });

  const additionalTopics = useMemo(() => {
    if (!topic) return [] as { id: string; name: string; count: number }[];
    const groups: Record<string, { count: number; skill: string }> = {};
    for (const q of allQuestions) {
      if (!q.topicId || q.status !== "ACTIVE") continue;
      if (q.topicId === topic.id) continue;
      if (q.level !== topic.level) continue;
      const k = `${q.topicId}`;
      if (!groups[k]) {
        groups[k] = { count: 0, skill: q.skill ?? "" };
      }
      groups[k].count++;
    }
    return Object.entries(groups)
      .map(([id, v]) => ({
        id,
        name: `${v.skill} — ${id.replace(/_/g, " / ")}`,
        count: v.count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allQuestions, topic]);

  const defaults = useMemo(() => defaultDueDate(), []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: topic?.name ?? "",
      instructions: "",
      additionalTopicIds: [],
      classIds: [],
      dueDate: defaults.date,
      dueTime: defaults.time,
      durationMinutes: 60,
      maxScore: 100,
    },
  });

  useEffect(() => {
    if (open && topic) {
      reset({
        title: topic.name,
        instructions: "",
        additionalTopicIds: [],
        classIds: [],
        dueDate: defaults.date,
        dueTime: defaults.time,
        durationMinutes: 60,
        maxScore: 100,
      });
    }
  }, [open, topic, reset, defaults.date, defaults.time]);

  const additionalSelected = watch("additionalTopicIds") ?? [];
  const totalCount = useMemo(() => {
    let n = topic?.questionCount ?? 0;
    for (const t of additionalTopics) {
      if (additionalSelected.includes(t.id)) n += t.count;
    }
    return n;
  }, [topic, additionalTopics, additionalSelected]);

  const mutation = useMutation({
    mutationFn: (body: AssignExamFromBankRequest) =>
      questionBankAssignApi.assignExam(topic!.id, body),
    onSuccess: (res) => {
      toast.success(`Exam assigned to ${res.created} class${res.created === 1 ? "" : "es"}.`);
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["teacherExams"] });
      queryClient.invalidateQueries({ queryKey: ["examsByClass"] });
      queryClient.invalidateQueries({ queryKey: ["teacherClassDetail"] });
      queryClient.invalidateQueries({ queryKey: ["classExams"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to assign exam.");
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (!topic) return;
    const dueDate = combineDateTime(values.dueDate, values.dueTime);
    if (!dueDate) {
      toast.error("Please select a valid due date and time.");
      return;
    }
    mutation.mutate({
      title: values.title,
      instructions: values.instructions || undefined,
      additionalTopicIds: values.additionalTopicIds,
      classIds: values.classIds,
      dueDate,
      durationMinutes: values.durationMinutes,
      maxScore: values.maxScore,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Exam</DialogTitle>
          <DialogDescription>
            Build an exam from this topic, optionally add more topics, then assign to classes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="ex-title">Exam title</Label>
            <Input id="ex-title" {...register("title")} placeholder="e.g. Unit Test" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ex-instructions">Instructions</Label>
            <Textarea
              id="ex-instructions"
              {...register("instructions")}
              placeholder="Optional instructions for students"
              rows={2}
            />
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Topic</span>
              <span className="font-medium">
                {topic ? `${topic.skill} ${topic.level} — ${topic.name}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selected Question Count</span>
              <span className="font-medium">{totalCount} Questions</span>
            </div>
          </div>

          <Controller
            control={control}
            name="additionalTopicIds"
            render={({ field }) => (
              <TopicMultiSelect
                label="Additional Question Sets"
                helper="Tick to merge questions from these topics into the exam."
                topics={additionalTopics}
                value={field.value ?? []}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="classIds"
            render={({ field }) => (
              <ClassMultiSelect
                label="Assign To Classes"
                required
                classes={classes}
                loading={classesLoading}
                value={field.value ?? []}
                onChange={field.onChange}
                error={errors.classIds?.message}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ex-due-date">Due Date</Label>
              <Input id="ex-due-date" type="date" {...register("dueDate")} />
              {errors.dueDate && (
                <p className="text-xs text-destructive">{errors.dueDate.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ex-due-time">Time</Label>
              <Input id="ex-due-time" type="time" {...register("dueTime")} />
              {errors.dueTime && (
                <p className="text-xs text-destructive">{errors.dueTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ex-duration">Duration (minutes)</Label>
              <Input
                id="ex-duration"
                type="number"
                min={1}
                {...register("durationMinutes", { valueAsNumber: true })}
              />
              {errors.durationMinutes && (
                <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ex-max">Maximum Score</Label>
              <Input
                id="ex-max"
                type="number"
                min={1}
                {...register("maxScore", { valueAsNumber: true })}
              />
              {errors.maxScore && (
                <p className="text-xs text-destructive">{errors.maxScore.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || isSubmitting}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Exam
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- shared subcomponents ---------- */

function ClassMultiSelect({
  label,
  required,
  classes,
  loading,
  value,
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  classes: ClassResponse[];
  loading?: boolean;
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  };

  return (
    <div className="grid gap-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="rounded-md border p-3 max-h-40 overflow-y-auto space-y-2 bg-background">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading classes…
          </div>
        ) : classes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No classes available.</p>
        ) : (
          classes.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/40 px-1 py-1 rounded"
            >
              <Checkbox checked={value.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">({c.level})</span>
            </label>
          ))
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function TopicMultiSelect({
  label,
  helper,
  topics,
  value,
  onChange,
}: {
  label: string;
  helper?: string;
  topics: { id: string; name: string; count: number }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  };

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="rounded-md border p-3 max-h-40 overflow-y-auto space-y-2 bg-background">
        {topics.length === 0 ? (
          <p className="text-xs text-muted-foreground">No additional topics available.</p>
        ) : (
          topics.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/40 px-1 py-1 rounded"
            >
              <Checkbox checked={value.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
              <span className="font-medium">{t.name}</span>
              <span className="text-xs text-muted-foreground">({t.count} q)</span>
            </label>
          ))
        )}
      </div>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

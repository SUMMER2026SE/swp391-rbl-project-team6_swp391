import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QuestionPreview } from "@/components/question-builder/QuestionPreview";
import { QuestionEditor } from "@/components/question-builder/QuestionEditor";
import { BuilderQuestion, QuestionDifficulty } from "@/types/question";
import {
  QuestionSkill,
  SKILL_TO_BACKEND,
} from "@/services/questionBank.types";
import { Loader2, Sparkles, Save, Send, Eye, ArrowLeft } from "lucide-react";
import { classesApi } from "@/lib/api/classes";
import { teacherQuestionsApi } from "@/lib/api/teacherQuestions";

type Step = "configure" | "preview";

export interface AiGenerateConfig {
  title: string;
  subtitle: string;
  generateApi: (req: {
    level: string;
    lessonId: number;
    skills: string[];
    difficulty: string;
    questionCount: number;
    questionFormat: string;  // MULTIPLE_CHOICE | TRUE_FALSE | FILL_BLANK | SHORT_ANSWER — non-WRITING
    writingMode?: string;    // MIXED_WRITING | ... — WRITING only
  }) => Promise<AiQuestionResponse>;
  onSave: (params: {
    questions: BuilderQuestion[];
    classId: string;
    title: string;
    level: string;
    shouldPublish: boolean;
    metadata: Record<string, unknown>;
    createQuestion: (q: Partial<BuilderQuestion>) => Promise<{ id: string }>;
    createQuestionsBatch: (qs: Partial<BuilderQuestion>[]) => Promise<{ savedQuestions: { id: string }[] }>;
    queryClient: ReturnType<typeof useQueryClient>;
  }) => Promise<void>;
  metadataFields?: {
    key: string;
    label: string;
    type: "text" | "number" | "datetime-local" | "select";
    options?: { value: string; label: string }[];
    defaultValue?: unknown;
  }[];
  onDone?: (title: string, ...args: string[]) => void;
}

export interface AiQuestionResponse {
  title?: string;
  description?: string;
  questions: {
    type?: string;
    content?: string;
    difficulty?: string;
    explanation?: string;
    category?: string;
    answers?: { content?: string; isCorrect?: boolean }[];
    translationMetadata?: {
      direction?: string;
      sourceText?: string;
      referenceAnswer?: string;
      acceptedAnswers?: string[];
      sourceLanguage?: string;
      targetLanguage?: string;
    };
    sentenceWritingMetadata?: {
      requiredVocabulary?: string[];
      requiredGrammar?: string[];
      referenceAnswer?: string;
      acceptedAnswers?: string[];
      rubric?: string;
      prompt?: string;
    };
    errorCorrectionMetadata?: {
      incorrectText?: string;
      correctedText?: string;
      explanation?: string;
      errorType?: string;
    };
    matchingMetadata?: {
      leftItems?: string[];
      rightItems?: string[];
      correctPairs?: { leftIndex: number; rightIndex: number }[];
    };
  }[];
}

interface GenerationForm {
  classId: string;
  title: string;
  level: string;
  lessonId: number;
  skills: QuestionSkill[];
  difficulty: string;
  questionCount: number;
  duration: number;
  questionFormat: string;  // MULTIPLE_CHOICE | TRUE_FALSE | FILL_BLANK | SHORT_ANSWER — non-WRITING
  writingMode: string;     // MIXED_WRITING | ... — WRITING only
  metadata: Record<string, unknown>;
}

// Question type options for non-WRITING skills (Vocabulary, Grammar, Reading)
const QUESTION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE",      label: "True/False" },
  { value: "FILL_BLANK",      label: "Fill in Blank" },
  { value: "SHORT_ANSWER",    label: "Short Answer" },
];

// Writing mode options — shown only when WRITING is selected
const WRITING_MODE_OPTIONS: { value: string; label: string }[] = [
  { value: "MIXED_WRITING",        label: "Mixed Writing Exercises" },
  { value: "JA_TO_VI_TRANSLATION", label: "Japanese → Vietnamese Translation" },
  { value: "VI_TO_JA_TRANSLATION", label: "Vietnamese → Japanese Translation" },
  { value: "SENTENCE_REORDER",     label: "Sentence Reordering" },
];

// Difficulty distribution for generation
interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

const DEFAULT_DIFFICULTY = "MEDIUM";

// All available skills
const SKILL_OPTIONS: { value: QuestionSkill; label: string }[] = [
  { value: "Vocabulary", label: "Vocabulary" },
  { value: "Grammar", label: "Grammar" },
  { value: "Reading", label: "Reading" },
  { value: "Writing", label: "Writing" },
];

const mapResponseToQuestions = (
  response: AiQuestionResponse
): BuilderQuestion[] => {
  return (response.questions || []).map((q, idx): BuilderQuestion => {
    const correctIdx = q.answers?.findIndex((a) => a.isCorrect) ?? 0;
    const questionType = (q.type as BuilderQuestion["type"]) || "MULTIPLE_CHOICE";

    return {
      id: `ai-q-${Date.now()}-${idx}`,
      type: questionType,
      content: q.content || "",
      difficulty:
        (q.difficulty?.toUpperCase() as QuestionDifficulty) || "MEDIUM",
      explanation: q.explanation,
      skill: (q.category as BuilderQuestion["skill"]) || "Vocabulary",
      points: 2,
      answers: (q.answers || []).map((a, i) => ({
        content: a.content || "",
        isCorrect: i === correctIdx,
      })),
      needsReview: !q.answers || q.answers.length === 0,
      // Format-specific metadata with proper type casting
      translationMetadata: q.translationMetadata?.direction
        ? {
            direction: (q.translationMetadata.direction as "JA_TO_VI" | "VI_TO_JA") || "JA_TO_VI",
            sourceText: q.translationMetadata.sourceText || "",
            referenceAnswer: q.translationMetadata.referenceAnswer || "",
            acceptedAnswers: q.translationMetadata.acceptedAnswers,
            sourceLanguage: q.translationMetadata.sourceLanguage || "Japanese",
            targetLanguage: q.translationMetadata.targetLanguage || "Vietnamese",
          }
        : undefined,
      sentenceWritingMetadata: q.sentenceWritingMetadata?.prompt
        ? {
            requiredVocabulary: q.sentenceWritingMetadata.requiredVocabulary,
            requiredGrammar: q.sentenceWritingMetadata.requiredGrammar,
            referenceAnswer: q.sentenceWritingMetadata.referenceAnswer,
            acceptedAnswers: q.sentenceWritingMetadata.acceptedAnswers,
            rubric: q.sentenceWritingMetadata.rubric,
            prompt: q.sentenceWritingMetadata.prompt || "",
          }
        : undefined,
      errorCorrectionMetadata: q.errorCorrectionMetadata?.incorrectText
        ? {
            incorrectText: q.errorCorrectionMetadata.incorrectText,
            correctedText: q.errorCorrectionMetadata.correctedText || "",
            explanation: q.errorCorrectionMetadata.explanation || "",
            errorType: q.errorCorrectionMetadata.errorType,
          }
        : undefined,
      matchingMetadata: q.matchingMetadata?.leftItems
        ? {
            leftItems: q.matchingMetadata.leftItems || [],
            rightItems: q.matchingMetadata.rightItems || [],
            correctPairs: (q.matchingMetadata.correctPairs || []).map(p => ({
              leftIndex: p.leftIndex ?? 0,
              rightIndex: p.rightIndex ?? 0,
            })),
          }
        : undefined,
    };
  });
};

const buildDefaultForm = (
  lockedClass: { id: string; name: string; level: string } | null | undefined,
  config: AiGenerateConfig
): GenerationForm => {
  const metadata: Record<string, unknown> = {};
  if (config.metadataFields) {
    for (const field of config.metadataFields) {
      metadata[field.key] = field.defaultValue ?? "";
    }
  }
  return {
    classId: lockedClass?.id ?? "",
    title: "",
    level: lockedClass?.level ?? "N5",
    lessonId: 0,
    skills: [],
    difficulty: DEFAULT_DIFFICULTY,
    questionCount: 10,
    duration: 60,
    questionFormat: "MULTIPLE_CHOICE",
    writingMode: "MIXED_WRITING",
    metadata,
  };
};

// Calculate difficulty distribution based on selected difficulty
const calculateDistribution = (difficulty: string, total: number): DifficultyDistribution => {
  switch (difficulty.toUpperCase()) {
    case "EASY":
      return { easy: Math.round(total * 0.5), medium: Math.round(total * 0.3), hard: Math.round(total * 0.2) };
    case "HARD":
      return { easy: Math.round(total * 0.2), medium: Math.round(total * 0.3), hard: Math.round(total * 0.5) };
    default: // MEDIUM
      return { easy: Math.round(total * 0.3), medium: Math.round(total * 0.4), hard: Math.round(total * 0.3) };
  }
};

export const AiContentGenerate: React.FC<{
  config: AiGenerateConfig;
  lockedClass?: { id: string; name: string; level: string } | null;
}> = ({ config, lockedClass }) => {
  const [form, setForm] = useState<GenerationForm>(() =>
    buildDefaultForm(lockedClass, config)
  );
  const [step, setStep] = useState<Step>("configure");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<BuilderQuestion[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: classes = [] } = useQuery({
    queryKey: ["teacherAllClasses"],
    queryFn: () => classesApi.getSelectableClasses(),
  });

  const { data: allLessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["questionBankLessons", "ALL"],
    queryFn: () => teacherQuestionsApi.getLessons().then((res) => res),
    staleTime: 1000 * 60 * 60,
  });

  const lessons = useMemo(() => {
    if (!form.level) return [];
    return allLessons.filter((l: any) => l.level === form.level.toUpperCase());
  }, [allLessons, form.level]);

  const queryClient = useQueryClient();

  const isWritingOnly = useMemo(
    () => form.skills.length === 1 && form.skills[0] === "Writing",
    [form.skills]
  );

  const toggleSkill = useCallback((skill: QuestionSkill) => {
    setForm((prev) => {
      let newSkills: QuestionSkill[];

      if (skill === "Writing") {
        newSkills = prev.skills.includes("Writing")
          ? prev.skills.filter((s) => s !== "Writing")
          : ["Writing"];
        return {
          ...prev,
          skills: newSkills,
          questionFormat: "MULTIPLE_CHOICE",
          writingMode: "MIXED_WRITING",
        };
      } else {
        newSkills = prev.skills.includes(skill)
          ? prev.skills.filter((s) => s !== skill && s !== "Writing")
          : [...prev.skills.filter((s) => s !== "Writing"), skill];
        return {
          ...prev,
          skills: newSkills,
          questionFormat: "MULTIPLE_CHOICE",
          writingMode: "MIXED_WRITING",
        };
      }
    });
  }, []);

  const handleGenerating = useCallback(async () => {
    if (!form.lessonId) {
      toast.error("Please select a lesson.");
      return;
    }
    if (form.skills.length === 0) {
      toast.error("Please select at least one skill.");
      return;
    }

    setIsGenerating(true);
    try {
      const backendSkills = form.skills.map((s) => SKILL_TO_BACKEND[s]);
      const isWritingOnly = form.skills.length === 1 && form.skills[0] === "Writing";

      const response = await config.generateApi({
        level: form.level,
        lessonId: form.lessonId,
        skills: backendSkills,
        difficulty: form.difficulty,
        questionCount: form.questionCount,
        questionFormat: isWritingOnly ? undefined : form.questionFormat,
        writingMode: isWritingOnly ? form.writingMode : undefined,
      });

      const generated = mapResponseToQuestions(response);

      if (generated.length === 0) {
        toast.error("AI generated 0 valid questions. Please retry.");
        return;
      }

      setQuestions(generated);
      setStep("preview");
      toast.success(
        `Generated ${generated.length} questions. Review and edit before saving.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [form, config]);

  const handleUpdateQuestion = useCallback(
    (idx: number, updated: Partial<BuilderQuestion>) => {
      setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...updated } : q)));
    },
    []
  );

  const handleDeleteQuestion = useCallback((idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setEditIdx(null);
  }, []);

  const handleDuplicateQuestion = useCallback((idx: number) => {
    const q = questions[idx];
    const dup: BuilderQuestion = { ...q, id: `ai-q-${Date.now()}`, content: q.content + " (copy)" };
    setQuestions((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next;
    });
  }, [questions]);

  const handleMoveQuestion = useCallback((idx: number, direction: "up" | "down") => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const handleSave = useCallback(
    async (shouldPublish = false) => {
      if (questions.length === 0) {
        toast.error("No questions to save.");
        return;
      }

      setIsSaving(true);
      try {
        await config.onSave({
          questions,
          classId: form.classId,
          title: form.title,
          level: form.level,
          shouldPublish,
          metadata: { ...form.metadata, duration: form.duration },
          createQuestion: async (q) => {
            const correctIdx = q.answers?.findIndex((a) => a.isCorrect) ?? 0;
            return teacherQuestionsApi.createQuestion({
              prompt: q.content || "",
              options: (q.answers || []).map((a) => a.content || ""),
              correctAnswerIndex: correctIdx >= 0 ? correctIdx : 0,
              points: q.points ?? 2,
              questionType: q.type || "MULTIPLE_CHOICE",
              difficulty: q.difficulty || "MEDIUM",
              explanation: q.explanation || "",
            });
          },
          createQuestionsBatch: async (qs) => {
            const batchQuestions = qs.map((q) => {
              const correctIdx = q.answers?.findIndex((a) => a.isCorrect) ?? 0;
              return {
                prompt: q.content || "",
                options: (q.answers || []).map((a) => a.content || ""),
                correctAnswerIndex: correctIdx >= 0 ? correctIdx : 0,
                points: q.points ?? 2,
                questionType: q.type || "MULTIPLE_CHOICE",
                difficulty: q.difficulty || "MEDIUM",
                explanation: q.explanation || "",
              };
            });
            const res = await teacherQuestionsApi.createQuestionsBatch({ questions: batchQuestions });
            return {
              savedQuestions: res.savedQuestions.map((sq) => ({ id: sq.id.toString() })),
            };
          },
          queryClient,
        });

        if (shouldPublish) {
          toast.success("Published successfully!");
        } else {
          toast.success("Draft saved successfully!");
        }

        if (config.onDone) {
          config.onDone(form.title || config.title, form.classId);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to save.");
      } finally {
        setIsSaving(false);
      }
    },
    [questions, form, config, queryClient]
  );

  const editing = editIdx !== null ? questions[editIdx] : null;
  const totalPoints = questions.reduce((s, q) => s + (q.points ?? 2), 0);

  // Calculate difficulty distribution display
  const distribution = calculateDistribution(form.difficulty, form.questionCount);

  if (step === "preview") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setStep("configure")}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to configuration
          </Button>
          <div className="text-sm text-muted-foreground">
            {questions.length} questions - {totalPoints} pts
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
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
              />
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Assignment settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. N5 Mid-term Assessment"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target class</Label>
                  {lockedClass ? (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-sm">
                      <span className="font-medium">{lockedClass.name}</span>
                    </div>
                  ) : (
                    <Select
                      value={form.classId}
                      onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
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
                      onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}
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
                      onChange={(e) =>
                        setForm((f) => ({ ...f, duration: Number(e.target.value) || 60 }))
                      }
                    />
                  </div>
                </div>

                {config.metadataFields?.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    {field.type === "select" && field.options ? (
                      <Select
                        value={String(form.metadata[field.key] ?? "")}
                        onValueChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            metadata: { ...f.metadata, [field.key]: v },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === "number" ? "number" : "text"}
                        value={String(form.metadata[field.key] ?? "")}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            metadata: {
                              ...f.metadata,
                              [field.key]:
                                field.type === "number"
                                  ? Number(e.target.value) || 0
                                  : e.target.value,
                            },
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setPreview(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                className="w-full"
                variant="outline"
                disabled={isSaving || questions.length === 0}
                onClick={() => handleSave(false)}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save draft"}
              </Button>
              <Button
                className="w-full"
                disabled={isSaving || questions.length === 0}
                onClick={() => handleSave(true)}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSaving ? "Publishing..." : "Publish & assign"}
              </Button>
            </div>
          </div>
        </div>

        {preview && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setPreview(false)}
          >
            <div
              className="bg-background rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold">
                    {form.title || config.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {questions.length} questions - {totalPoints} pts -{" "}
                    {form.duration} min
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPreview(false)}>
                  Close
                </Button>
              </div>
              <div className="p-6">
                <QuestionPreview questions={questions} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-success text-primary-foreground mb-4">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="font-display text-2xl font-bold">{config.title}</h2>
        <p className="text-sm text-muted-foreground">{config.subtitle}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select
                value={form.level}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, level: v, lessonId: 0 }))
                }
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
              <Label>Question Count</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.questionCount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    questionCount: Math.max(
                      1,
                      Math.min(50, Number(e.target.value) || 10)
                    ),
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lesson</Label>
            {lessonsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading lessons...
              </div>
            ) : (
              <Select
                value={form.lessonId ? String(form.lessonId) : ""}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, lessonId: Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lesson" />
                </SelectTrigger>
                <SelectContent>
                  {lessons.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No lessons found for {form.level}
                    </div>
                  ) : (
                    lessons.map((l: any) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        Lesson {l.lessonNumber} - {l.lessonName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Target Skills (select one or more)</Label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill.value}
                  type="button"
                  onClick={() => toggleSkill(skill.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                    form.skills.includes(skill.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {skill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Type — shown for non-WRITING skills */}
          {!isWritingOnly && (
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={form.questionFormat}
                onValueChange={(v) => setForm((f) => ({ ...f, questionFormat: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Writing Mode — shown only when WRITING is the only selected skill */}
          {isWritingOnly && (
            <div className="space-y-2">
              <Label>Writing Mode</Label>
              <Select
                value={form.writingMode}
                onValueChange={(v) => setForm((f) => ({ ...f, writingMode: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WRITING_MODE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Difficulty
              <span className="text-xs text-muted-foreground ml-2">
                (Distribution: Easy {distribution.easy}, Medium {distribution.medium}, Hard {distribution.hard})
              </span>
            </Label>
            <div className="flex gap-2">
              {["EASY", "MEDIUM", "HARD"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, difficulty: d }))}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
                    form.difficulty === d
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {d.charAt(0) + d.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={
              isGenerating ||
              !form.lessonId ||
              form.skills.length === 0
            }
            onClick={handleGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating questions...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Questions
              </>
            )}
          </Button>

          {/* Validation messages */}
          {form.skills.length === 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Select at least one target skill to enable format selection
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  GrammarDetailResponse,
  GrammarLessonRequest,
  GrammarLessonWithContentsRequest,
  GrammarContentRequest,
} from "@/lib/api/grammarContent";

interface GrammarLessonFormProps {
  isOpen: boolean;
  mode: "create" | "edit";
  lesson?: GrammarDetailResponse;
  suggestedLessonNumber?: number;
  jlptLevel?: string;
  onClose: () => void;
  onSave: (data: GrammarLessonWithContentsRequest) => void;
  saving?: boolean;
}

const EMPTY_FORM = {
  jlptLevel: "N5",
  lessonNumber: 1,
  title: "",
  description: "",
  estimatedMinutes: null as number | null,
  difficulty: "",
  isActive: true,
};

export function GrammarLessonForm({
  isOpen,
  mode,
  lesson,
  suggestedLessonNumber = 1,
  jlptLevel = "N5",
  onClose,
  onSave,
  saving = false,
}: GrammarLessonFormProps) {
  const [jlptLevelState, setJlptLevel] = useState(jlptLevel);
  const [lessonNumber, setLessonNumber] = useState(suggestedLessonNumber);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && lesson) {
        setJlptLevel(lesson.jlptLevel);
        setLessonNumber(lesson.lessonNumber);
        setTitle(lesson.title);
        setDescription(lesson.description ?? "");
        setEstimatedMinutes(lesson.estimatedMinutes ?? null);
        setDifficulty(lesson.difficulty ?? "");
        setIsActive(lesson.isActive);
      } else {
        setJlptLevel(jlptLevel.toUpperCase());
        setLessonNumber(suggestedLessonNumber);
        setTitle("");
        setDescription("");
        setEstimatedMinutes(null);
        setDifficulty("");
        setIsActive(true);
      }
    }
  }, [isOpen, mode, lesson, suggestedLessonNumber, jlptLevel]);

  const handleSave = () => {
    const lessonData: GrammarLessonRequest = {
      jlptLevel: jlptLevelState,
      lessonNumber,
      title: title.trim(),
      description: description.trim() || undefined,
      estimatedMinutes: estimatedMinutes ?? undefined,
      difficulty: difficulty || undefined,
      isActive,
    };

    const data: GrammarLessonWithContentsRequest = { lesson: lessonData };
    onSave(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              {mode === "create" ? "Create Grammar Lesson" : "Edit Grammar Lesson"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {mode === "create"
                ? "Add a new grammar lesson to this level"
                : "Update lesson information"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* JLPT Level & Lesson Number & Title Row */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">JLPT Level</label>
              <select
                value={jlptLevelState}
                onChange={(e) => setJlptLevel(e.target.value)}
                disabled={mode === "edit"}
                className={cn(
                  "w-full rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  mode === "edit" && "opacity-70 cursor-not-allowed"
                )}
              >
                {["N5", "N4", "N3", "N2", "N1"].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                Lesson Number
              </label>
              <input
                type="number"
                value={lessonNumber || ""}
                onChange={(e) => setLessonNumber(Number(e.target.value) || 0)}
                min={1}
                className={cn(
                  "w-full rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Basic sentence patterns"
                className={cn(
                  "w-full rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this lesson"
              rows={2}
              className={cn(
                "w-full resize-y rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              )}
            />
          </div>

          {/* Estimated Minutes & Difficulty Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                Estimated Minutes
              </label>
              <input
                type="number"
                value={estimatedMinutes ?? ""}
                onChange={(e) =>
                  setEstimatedMinutes(
                    e.target.value === "" ? null : Number(e.target.value) || null
                  )
                }
                placeholder="Optional"
                min={1}
                className={cn(
                  "w-full rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              >
                <option value="">Not set</option>
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>

          {/* Publish Toggle */}
          <label className="flex items-center gap-3 rounded-xl border border-border/50 p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Publish lesson
              </span>
              <span className="text-xs text-muted-foreground">
                Published lessons appear in the Learning Journey.
              </span>
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim() || !lessonNumber}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-hero px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Lesson" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

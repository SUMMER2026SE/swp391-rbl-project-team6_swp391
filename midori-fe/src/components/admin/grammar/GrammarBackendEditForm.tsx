"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  GrammarDetailResponse,
  GrammarContentResponse,
  GrammarContentRequest,
  GrammarExampleRequest,
} from "@/lib/api/grammarContent";

interface GrammarBackendEditFormProps {
  open: boolean;
  mode: "create" | "edit" | "view" | undefined;
  lesson: GrammarDetailResponse | null;
  onSave: (data: Partial<GrammarDetailResponse> & { contents?: GrammarContentRequest[] }) => void;
  onCancel: () => void;
  isSaving?: boolean;
  isLoading?: boolean;
}

interface GrammarPointForm {
  id?: string;
  contentOrder: number;
  pattern: string;
  meaning: string;
  structure: string;
  usage: string;
  examples: ExampleFormValue[];
  isExpanded: boolean;
}

interface ExampleFormValue {
  id?: string;
  japanese: string;
  vietnameseMeaning: string;
}

const EMPTY_EXAMPLE: ExampleFormValue = { japanese: "", vietnameseMeaning: "" };

export function GrammarBackendEditForm({
  open,
  mode,
  lesson,
  onSave,
  onCancel,
  isSaving = false,
  isLoading = false,
}: GrammarBackendEditFormProps) {
  if (!open) return null;

  const isViewMode = mode === "view";

  const [form, setForm] = useState<{
    lessonNumber: number;
    title: string;
    description: string;
    estimatedMinutes: number | null;
    difficulty: string;
    isActive: boolean;
    contents: GrammarPointForm[];
  }>(() => ({
    lessonNumber: lesson?.lessonNumber || 1,
    title: lesson?.title || "",
    description: lesson?.description || "",
    estimatedMinutes: lesson?.estimatedMinutes ?? null,
    difficulty: lesson?.difficulty || "EASY",
    isActive: lesson?.isActive ?? true,
    contents: [],
  }));

  useEffect(() => {
    if (!lesson) return;
    setForm({
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      description: lesson.description ?? "",
      estimatedMinutes: lesson.estimatedMinutes ?? null,
      difficulty: lesson.difficulty || "EASY",
      isActive: lesson.isActive,
      contents: lesson.contents.map((c) => ({
        id: c.id,
        contentOrder: c.contentOrder,
        pattern: c.pattern ?? "",
        meaning: c.meaning ?? "",
        structure: c.structure ?? "",
        usage: c.usage ?? "",
        examples: c.examples.length > 0
          ? c.examples.map((ex) => ({
              id: ex.id,
              japanese: ex.japanese,
              vietnameseMeaning: ex.vietnameseMeaning ?? "",
            }))
          : [EMPTY_EXAMPLE],
        isExpanded: true,
      })),
    });
  }, [lesson]);

  const addGrammarPoint = () => {
    const newPoint: GrammarPointForm = {
      contentOrder: form.contents.length + 1,
      pattern: "",
      meaning: "",
      structure: "",
      usage: "",
      examples: [{ ...EMPTY_EXAMPLE }],
      isExpanded: true,
    };
    setForm((f) => ({ ...f, contents: [...f.contents, newPoint] }));
  };

  const updatePoint = (index: number, patch: Partial<GrammarPointForm>) => {
    setForm((f) => ({
      ...f,
      contents: f.contents.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  };

  const removePoint = (index: number) => {
    setForm((f) => ({
      ...f,
      contents: f.contents
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, contentOrder: i + 1 })),
    }));
  };

  const togglePointExpanded = (index: number) => {
    setForm((f) => ({
      ...f,
      contents: f.contents.map((p, i) =>
        i === index ? { ...p, isExpanded: !p.isExpanded } : p
      ),
    }));
  };

  const addExample = (pointIndex: number) => {
    updatePoint(pointIndex, {
      examples: [...form.contents[pointIndex].examples, { ...EMPTY_EXAMPLE }],
    });
  };

  const updateExample = (
    pointIndex: number,
    exIndex: number,
    patch: Partial<ExampleFormValue>
  ) => {
    setForm((f) => ({
      ...f,
      contents: f.contents.map((p, pi) =>
        pi === pointIndex
          ? {
              ...p,
              examples: p.examples.map((ex, ei) =>
                ei === exIndex ? { ...ex, ...patch } : ex
              ),
            }
          : p
      ),
    }));
  };

  const removeExample = (pointIndex: number, exIndex: number) => {
    setForm((f) => ({
      ...f,
      contents: f.contents.map((p, pi) =>
        pi === pointIndex
          ? { ...p, examples: p.examples.filter((_, ei) => ei !== exIndex) }
          : p
      ),
    }));
  };

  const handleSave = () => {
    const contents: GrammarContentRequest[] = form.contents
      .filter((p) => p.pattern.trim())
      .map((p, idx) => {
        const validExamples: GrammarExampleRequest[] = p.examples
          .filter((ex) => ex.japanese.trim())
          .map((ex, exIdx) => ({
            id: ex.id,
            exampleOrder: exIdx + 1,
            japanese: ex.japanese.trim(),
            vietnameseMeaning: ex.vietnameseMeaning.trim() || undefined,
          }));

        return {
          id: p.id,
          contentOrder: idx + 1,
          pattern: p.pattern.trim() || undefined,
          meaning: p.meaning.trim() || undefined,
          structure: p.structure.trim() || undefined,
          usage: p.usage.trim() || undefined,
          examples: validExamples.length > 0 ? validExamples : undefined,
        };
      });

    onSave({
      ...form,
      contents,
    } as Partial<GrammarDetailResponse> & { contents: GrammarContentRequest[] });
  };

  const hasValidContent = form.title.trim() && form.lessonNumber > 0;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-4xl glass-modal rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-muted-col">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-4xl glass-modal rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator shrink-0">
          <div>
            <h2 className="font-display font-bold text-primary-col text-base">
              {mode === "create"
                ? "Create Grammar Lesson"
                : mode === "edit"
                  ? "Edit Grammar Lesson"
                  : "Grammar Lesson Detail"}
            </h2>
            <p className="text-xs text-muted-col mt-0.5">
              {mode === "create"
                ? "Add a new grammar lesson to this level"
                : "Update lesson information and grammar points"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-6">
          {/* Lesson Info Section - Simplified to 2 fields only */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                  Lesson Number
                </label>
                <input
                  type="number"
                  value={form.lessonNumber || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      lessonNumber: Number(e.target.value) || 0,
                    }))
                  }
                  disabled={isViewMode}
                  min={1}
                  className={cn(
                    "w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-primary-col",
                    "focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30",
                    isViewMode && "opacity-50 cursor-not-allowed"
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  disabled={isViewMode}
                  placeholder="e.g. Basic sentence patterns"
                  className={cn(
                    "w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-primary-col placeholder:text-muted-col",
                    "focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30",
                    isViewMode && "opacity-50 cursor-not-allowed"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Grammar Points Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                Grammar Points
              </h3>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={addGrammarPoint}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-lavender hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Grammar Point
                </button>
              )}
            </div>

            {form.contents.length === 0 ? (
              <div className="text-center py-8 rounded-xl border-2 border-dashed border-[var(--border)]">
                <p className="text-sm text-muted-col">
                  No grammar points yet.{" "}
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={addGrammarPoint}
                      className="text-lavender hover:underline"
                    >
                      Add your first grammar point
                    </button>
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {form.contents.map((point, pointIndex) => (
                  <div
                    key={point.id || pointIndex}
                    className={cn(
                      "glass-card p-4 space-y-3",
                      point.isExpanded && "border-l-4 border-lavender"
                    )}
                  >
                    {/* Point Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-lavender/15 text-lavender text-xs font-bold flex items-center justify-center">
                          {point.contentOrder}
                        </span>
                        <span className="text-xs font-semibold text-muted-col">
                          Grammar Point {point.contentOrder}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => togglePointExpanded(pointIndex)}
                          className="p-1.5 rounded-lg text-muted-col hover:text-primary-col hover:bg-[var(--accent)] transition"
                        >
                          {point.isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        {!isViewMode && (
                          <button
                            type="button"
                            onClick={() => removePoint(pointIndex)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Point Content (Collapsible) */}
                    {point.isExpanded && (
                      <div className="space-y-3 pt-2">
                        {/* Pattern */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                            Pattern
                          </label>
                          <input
                            type="text"
                            value={point.pattern}
                            onChange={(e) =>
                              updatePoint(pointIndex, { pattern: e.target.value })
                            }
                            disabled={isViewMode}
                            placeholder="e.g. 〜てしまう"
                            className={cn(
                              "w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-primary-col placeholder:text-muted-col",
                              "focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30",
                              isViewMode && "opacity-50 cursor-not-allowed"
                            )}
                            style={{ fontFamily: "var(--font-japanese, serif)" }}
                          />
                        </div>

                        {/* Meaning */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                            Meaning
                          </label>
                          <input
                            type="text"
                            value={point.meaning}
                            onChange={(e) =>
                              updatePoint(pointIndex, { meaning: e.target.value })
                            }
                            disabled={isViewMode}
                            placeholder="Meaning in Vietnamese"
                            className={cn(
                              "w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-primary-col placeholder:text-muted-col",
                              "focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30",
                              isViewMode && "opacity-50 cursor-not-allowed"
                            )}
                          />
                        </div>

                        {/* Structure */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                            Structure
                          </label>
                          <textarea
                            value={point.structure}
                            onChange={(e) =>
                              updatePoint(pointIndex, { structure: e.target.value })
                            }
                            disabled={isViewMode}
                            placeholder="Grammar structure explanation"
                            rows={2}
                            className={cn(
                              "w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-primary-col placeholder:text-muted-col",
                              "focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30",
                              isViewMode && "opacity-50 cursor-not-allowed"
                            )}
                          />
                        </div>

                        {/* Usage */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                            Usage & Explanation
                          </label>
                          <textarea
                            value={point.usage}
                            onChange={(e) =>
                              updatePoint(pointIndex, { usage: e.target.value })
                            }
                            disabled={isViewMode}
                            placeholder="How and when to use this grammar"
                            rows={2}
                            className={cn(
                              "w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-primary-col placeholder:text-muted-col",
                              "focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30",
                              isViewMode && "opacity-50 cursor-not-allowed"
                            )}
                          />
                        </div>

                        {/* Examples */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-muted-col uppercase tracking-wide">
                              Examples
                            </label>
                            {!isViewMode && (
                              <button
                                type="button"
                                onClick={() => addExample(pointIndex)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-lavender hover:underline"
                              >
                                <Plus className="h-3 w-3" />
                                Add Example
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {point.examples.map((example, exIndex) => (
                              <div key={exIndex} className="flex gap-2">
                                <div className="grid grid-cols-2 flex-1 gap-2">
                                  <input
                                    type="text"
                                    value={example.japanese}
                                    onChange={(e) =>
                                      updateExample(
                                        pointIndex,
                                        exIndex,
                                        { japanese: e.target.value }
                                      )
                                    }
                                    disabled={isViewMode}
                                    placeholder="Japanese sentence"
                                    className={cn(
                                      "rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-primary-col placeholder:text-muted-col",
                                      "focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30",
                                      isViewMode && "opacity-50 cursor-not-allowed"
                                    )}
                                    style={{ fontFamily: "var(--font-japanese, serif)" }}
                                  />
                                  <div className="flex gap-1">
                                    <input
                                      type="text"
                                      value={example.vietnameseMeaning}
                                      onChange={(e) =>
                                        updateExample(
                                          pointIndex,
                                          exIndex,
                                          { vietnameseMeaning: e.target.value }
                                        )
                                      }
                                      disabled={isViewMode}
                                      placeholder="Meaning"
                                      className={cn(
                                        "flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-primary-col placeholder:text-muted-col",
                                        "focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30",
                                        isViewMode && "opacity-50 cursor-not-allowed"
                                      )}
                                    />
                                    {!isViewMode && point.examples.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeExample(pointIndex, exIndex)
                                        }
                                        className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t separator glass-surface shrink-0">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            {isViewMode ? "Close" : "Cancel"}
          </button>
          {!isViewMode && (
            <button
              onClick={handleSave}
              disabled={isSaving || !hasValidContent}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "create" ? "Create Lesson" : "Save Changes"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  GrammarContentResponse,
  GrammarExampleResponse,
  GrammarContentRequest,
  GrammarExampleRequest,
} from "@/lib/api/grammarContent";

interface GrammarPointEditorProps {
  isOpen: boolean;
  mode: "create" | "edit";
  content?: GrammarContentResponse;
  index: number;
  onClose: () => void;
  onSave: (data: GrammarContentRequest) => void;
  saving?: boolean;
}

interface ExampleFormValue {
  id?: string;
  japanese: string;
  vietnameseMeaning: string;
}

const EMPTY_EXAMPLE: ExampleFormValue = { japanese: "", vietnameseMeaning: "" };

export function GrammarPointEditor({
  isOpen,
  mode,
  content,
  index,
  onClose,
  onSave,
  saving = false,
}: GrammarPointEditorProps) {
  const [pattern, setPattern] = useState("");
  const [meaning, setMeaning] = useState("");
  const [structure, setStructure] = useState("");
  const [usage, setUsage] = useState("");
  const [examples, setExamples] = useState<ExampleFormValue[]>([EMPTY_EXAMPLE]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && content) {
        setPattern(content.pattern ?? "");
        setMeaning(content.meaning ?? "");
        setStructure(content.structure ?? "");
        setUsage(content.usage ?? "");
        setExamples(
          content.examples.length > 0
            ? content.examples.map((ex) => ({
                id: ex.id,
                japanese: ex.japanese,
                vietnameseMeaning: ex.vietnameseMeaning ?? "",
              }))
            : [EMPTY_EXAMPLE]
        );
      } else {
        setPattern("");
        setMeaning("");
        setStructure("");
        setUsage("");
        setExamples([EMPTY_EXAMPLE]);
      }
    }
  }, [isOpen, mode, content]);

  const handleAddExample = () => {
    setExamples((prev) => [...prev, EMPTY_EXAMPLE]);
  };

  const handleRemoveExample = (exIndex: number) => {
    setExamples((prev) => prev.filter((_, i) => i !== exIndex));
  };

  const handleExampleChange = (
    exIndex: number,
    field: keyof ExampleFormValue,
    value: string
  ) => {
    setExamples((prev) =>
      prev.map((ex, i) => (i === exIndex ? { ...ex, [field]: value } : ex))
    );
  };

  const handleSave = () => {
    const validExamples: GrammarExampleRequest[] = examples
      .filter((ex) => ex.japanese.trim())
      .map((ex, idx) => ({
        exampleOrder: idx + 1,
        japanese: ex.japanese.trim(),
        vietnameseMeaning: ex.vietnameseMeaning.trim() || undefined,
      }));

    const data: GrammarContentRequest = {
      contentOrder: index + 1,
      pattern: pattern.trim() || undefined,
      meaning: meaning.trim() || undefined,
      structure: structure.trim() || undefined,
      usage: usage.trim() || undefined,
      examples: validExamples.length > 0 ? validExamples : undefined,
    };

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
              {mode === "create" ? "Add Grammar Point" : "Edit Grammar Point"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Grammar {index + 1}
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
          {/* Pattern */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Pattern
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. 〜てしまう"
              className={cn(
                "w-full rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              )}
              style={{ fontFamily: "var(--font-japanese, serif)" }}
            />
          </div>

          {/* Meaning */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Meaning
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Meaning in Vietnamese"
              className={cn(
                "w-full rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              )}
            />
          </div>

          {/* Structure */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Structure
            </label>
            <textarea
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              placeholder="Grammar structure explanation"
              rows={2}
              className={cn(
                "w-full resize-y rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              )}
            />
          </div>

          {/* Usage */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Usage & Explanation
            </label>
            <textarea
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              placeholder="How and when to use this grammar"
              rows={3}
              className={cn(
                "w-full resize-y rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              )}
            />
          </div>

          {/* Examples */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Examples
              </label>
              <button
                type="button"
                onClick={handleAddExample}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Example
              </button>
            </div>

            <div className="space-y-2">
              {examples.map((example, exIndex) => (
                <div
                  key={exIndex}
                  className="grid gap-2 rounded-lg bg-muted/50 p-3 md:grid-cols-2"
                >
                  <input
                    type="text"
                    value={example.japanese}
                    onChange={(e) =>
                      handleExampleChange(exIndex, "japanese", e.target.value)
                    }
                    placeholder="Japanese sentence"
                    className={cn(
                      "rounded-lg border border-border/50 bg-card px-3 py-2 text-sm",
                      "placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    )}
                    style={{ fontFamily: "var(--font-japanese, serif)" }}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={example.vietnameseMeaning}
                      onChange={(e) =>
                        handleExampleChange(
                          exIndex,
                          "vietnameseMeaning",
                          e.target.value
                        )
                      }
                      placeholder="Meaning"
                      className={cn(
                        "min-w-0 flex-1 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm",
                        "placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      )}
                    />
                    {examples.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExample(exIndex)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            disabled={saving || !pattern.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-hero px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

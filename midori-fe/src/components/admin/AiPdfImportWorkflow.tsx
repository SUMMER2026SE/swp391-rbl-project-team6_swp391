import React, { useState, useCallback } from "react";
import { Upload, Loader2, AlertCircle, Plus, CheckCircle } from "lucide-react";
import { QuestionEditor, ImportedQuestion } from "./pdf-import/QuestionEditor";

interface AiPdfImportWorkflowProps {
  onCreate: (questions: ImportedQuestion[]) => Promise<void>;
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
}

export const AiPdfImportWorkflow: React.FC<AiPdfImportWorkflowProps> = ({
  onCreate,
  title,
  subtitle,
  backHref,
  backLabel,
}) => {
  const [step, setStep] = useState<"upload" | "loading" | "preview">("upload");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reAnalyzingIndexes] = useState<Record<number, boolean>>({});

  const handleUpdateQuestion = useCallback(
    (idx: number, updatedFields: Partial<ImportedQuestion>) => {
      setQuestions((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updatedFields };
        return copy;
      });
    },
    [],
  );

  const handleDeleteQuestion = useCallback((idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleDuplicateQuestion = useCallback((idx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const target = copy[idx];
      const duplicated = {
        ...target,
        id: `extracted-${Date.now()}-dup`,
        content: `${target.content} (Copy)`,
        answers: target.answers.map((ans) => ({ ...ans })),
      };
      copy.splice(idx + 1, 0, duplicated);
      return copy;
    });
  }, []);

  const handleMoveQuestion = useCallback((idx: number, direction: "up" | "down") => {
    setQuestions((prev) => {
      const copy = [...prev];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  }, []);

  const handleReAnalyze = useCallback((_idx: number) => {
    // Disabled (Coming Soon)
  }, []);

  const handleAddQuestion = () => {
    const newQuestion: ImportedQuestion = {
      id: `extracted-${Date.now()}-manual`,
      type: "MULTIPLE_CHOICE",
      content: "",
      difficulty: "MEDIUM",
      explanation: "",
      answers: [
        { content: "", isCorrect: true },
        { content: "", isCorrect: false },
      ],
      category: "Vocabulary",
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleCreate = async () => {
    // Validate all questions
    const invalidQuestions = questions.filter((q) => {
      if (!q.content.trim()) return true;
      if (q.answers.length < 2) return true;
      const correctCount = q.answers.filter((a) => a.isCorrect).length;
      return correctCount !== 1;
    });

    if (invalidQuestions.length > 0) {
      setError("Please fix all validation errors before creating.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCreate(questions);
    } catch (err: any) {
      setError(err.message || "Failed to finalize creation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload View */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="card-base p-12 border-2 border-dashed text-center transition border-[var(--border)] opacity-60 cursor-not-allowed">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg text-primary-col mb-1">
              AI PDF Import (Coming Soon)
            </h3>
            <p className="text-sm text-secondary-col mb-4">
              AI PDF import is temporarily disabled and will be available in a future update.
            </p>
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-bold border border-[var(--border)] cursor-not-allowed"
            >
              Select PDF File (Coming Soon)
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Loading View */}
      {step === "loading" && (
        <div className="card-base p-12 text-center flex flex-col items-center justify-center space-y-4 border border-[var(--border)]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <h3 className="font-display font-bold text-lg text-primary-col">Processing PDF</h3>
          <p className="text-sm text-secondary-col max-w-md">{loadingMessage}</p>
        </div>
      )}

      {/* Preview View */}
      {step === "preview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 bg-[var(--accent)]/50 p-4 rounded-xl border border-[var(--border)] sticky top-0 z-30 backdrop-blur-md">
            <div>
              <h3 className="font-display font-bold text-primary-col">
                Extracted Questions Preview
              </h3>
              <p className="text-xs text-muted-col">
                {questions.length} questions extracted. Edit, duplicate, or reorder before saving.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border)] text-primary-col text-sm font-bold hover:bg-[var(--accent)] transition"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Create
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                onReAnalyze={handleReAnalyze}
                isReAnalyzing={!!reAnalyzingIndexes[idx]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

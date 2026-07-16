import React, { useState, useRef, useCallback } from "react";
import { Upload, Loader2, AlertCircle, Plus, CheckCircle, Sparkles } from "lucide-react";
import { examsApi } from "../../lib/api/exams";
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
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reAnalyzingIndexes, setReAnalyzingIndexes] = useState<Record<number, boolean>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParsePdf = async (file: File) => {
    setError(null);
    setStep("loading");
    setLoadingMessage("Uploading PDF...");

    try {
      setLoadingMessage("Extracting text and analyzing questions with AI...");
      const response = await examsApi.parsePdf(file);
      
      if (!response || !response.questions || response.questions.length === 0) {
        throw new Error("AI did not extract any questions from the PDF. Please try a different document.");
      }

      const mapped: ImportedQuestion[] = response.questions.map((q, idx) => {
        // Map types carefully
        let type = q.type || "MULTIPLE_CHOICE";
        if (type === "MULTIPLE_CHOICE" && q.answers && q.answers.length === 2 && 
            q.answers.some(a => a.content.toLowerCase() === "true") && 
            q.answers.some(a => a.content.toLowerCase() === "false")) {
          type = "TRUE_FALSE";
        }

        const hasCorrect = q.answers && q.answers.some(a => a.isCorrect);
        
        return {
          id: `extracted-${Date.now()}-${idx}`,
          type,
          content: q.content || "",
          difficulty: q.difficulty || "MEDIUM",
          explanation: q.explanation || "",
          answers: q.answers || [],
          category: q.type || "Vocabulary", // Map section appropriately
          needsReview: !q.content || !q.answers || q.answers.length < 2 || !hasCorrect,
        };
      });

      setQuestions(mapped);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Failed to process PDF file. Please try again.");
      setStep("upload");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleParsePdf(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith(".pdf")) {
      handleParsePdf(file);
    } else {
      setError("Only PDF files are supported");
    }
  };

  const handleUpdateQuestion = useCallback((idx: number, updatedFields: Partial<ImportedQuestion>) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updatedFields };
      return copy;
    });
  }, []);

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
        answers: target.answers.map(ans => ({ ...ans })),
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

  const handleReAnalyze = useCallback(async (idx: number) => {
    const question = questions[idx];
    if (!question.content.trim()) return;

    setReAnalyzingIndexes(prev => ({ ...prev, [idx]: true }));
    try {
      const response = await examsApi.reAnalyzeQuestion(question.content);
      if (response) {
        handleUpdateQuestion(idx, {
          type: response.type || "MULTIPLE_CHOICE",
          content: response.content || question.content,
          difficulty: response.difficulty || "MEDIUM",
          explanation: response.explanation || "",
          answers: response.answers || [],
          needsReview: false,
        });
      }
    } catch (err: any) {
      alert(`Re-analyze failed: ${err.message || "Unknown error"}`);
    } finally {
      setReAnalyzingIndexes(prev => ({ ...prev, [idx]: false }));
    }
  }, [questions, handleUpdateQuestion]);

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
    setQuestions(prev => [...prev, newQuestion]);
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
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`card-base p-12 border-2 border-dashed cursor-pointer text-center transition ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-[var(--border)] hover:border-primary/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg text-primary-col mb-1">
              Upload Exam PDF
            </h3>
            <p className="text-sm text-secondary-col mb-4">
              Select or drag and drop any exam PDF file. AI will parse the structure.
            </p>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              Select PDF File
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
          <p className="text-sm text-secondary-col max-w-md">
            {loadingMessage}
          </p>
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

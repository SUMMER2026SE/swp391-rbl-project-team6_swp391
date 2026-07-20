import React, { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Loader2, AlertCircle, Plus, CheckCircle, FileText, Sparkles } from "lucide-react";
import { QuestionEditor, ImportedQuestion } from "./pdf-import/QuestionEditor";
import { aiApi, type PdfImportMode, type TargetSkill } from "@/lib/api/ai";
import { toast } from "sonner";

interface AiPdfImportWorkflowProps {
  onCreate: (questions: ImportedQuestion[]) => Promise<void>;
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  enabled?: boolean;
  disabledReason?: string;
}

export const AiPdfImportWorkflow: React.FC<AiPdfImportWorkflowProps> = ({
  onCreate,
  title,
  subtitle,
  backHref,
  backLabel,
  enabled = false,
  disabledReason = "This feature is not available yet",
}) => {
  const [step, setStep] = useState<"select-mode" | "configure" | "upload" | "loading" | "preview">("select-mode");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reAnalyzingIndexes] = useState<Record<number, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation options state
  const [selectedMode, setSelectedMode] = useState<PdfImportMode | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [questionType, setQuestionType] = useState("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [level, setLevel] = useState("");
  const [targetSkills, setTargetSkills] = useState<TargetSkill[]>([]);

  const AVAILABLE_SKILLS: TargetSkill[] = ["VOCABULARY", "GRAMMAR", "READING"];

  const handleSkillToggle = (skill: TargetSkill) => {
    setTargetSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
    // Clear stale preview whenever the user toggles a skill — the existing
    // questions were produced for a different skill filter and would mislead
    // the teacher if shown next to the new selection.
    setQuestions([]);
    setError(null);
    setWarning(null);
  };

  // Whenever the selected mode changes, drop any preview/questions that were
  // produced under a different mode — they are not valid for the new mode.
  useEffect(() => {
    setQuestions([]);
    setError(null);
    setWarning(null);
  }, [selectedMode]);

  const isSkillSelected = (skill: TargetSkill) => targetSkills.includes(skill);

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

  const handleSelectMode = (mode: PdfImportMode) => {
    setSelectedMode(mode);
    setStep("configure");
    setError(null);
    setWarning(null);
    setQuestions([]);
    setSelectedFile(null);
  };

  const handleBackToModeSelection = () => {
    setStep("select-mode");
    setSelectedMode(null);
    setError(null);
    setQuestions([]);
    setSelectedFile(null);
  };

  const handleStartUpload = () => {
    if (targetSkills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }
    setError(null);
    setStep("upload");
  };

  const handleSelectFile = useCallback((file: File) => {
    if (!enabled || !selectedMode) {
      setError("This feature is currently disabled.");
      return;
    }

    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (targetSkills.length === 0) {
      const msg = "Please select at least one skill before uploading a PDF.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setQuestions([]);
    setError(null);
    setWarning(null);
    setSelectedFile(file);
  }, [enabled, selectedMode, targetSkills]);

  const handleGenerate = useCallback(async () => {
    if (!selectedFile || !selectedMode) {
      setError("Please select a PDF file before generating questions.");
      return;
    }

    const file = selectedFile;
    setQuestions([]);
    setError(null);
    setWarning(null);
    setStep("loading");
    setLoadingMessage("Extracting text from PDF...");

    try {
      const response = await aiApi.generateQuestionsFromPdf({
        file,
        mode: selectedMode,
        level: level || undefined,
        count: selectedMode === "GENERATE_FROM_CONTENT" ? questionCount : undefined,
        questionType: selectedMode === "GENERATE_FROM_CONTENT" ? questionType : undefined,
        difficulty: selectedMode === "GENERATE_FROM_CONTENT" ? difficulty : undefined,
        targetSkills: targetSkills.length > 0 ? targetSkills : undefined,
      });

      setLoadingMessage("AI is analyzing questions...");
      await new Promise(resolve => setTimeout(resolve, 500));

      if (response.errorMessage) {
        setError(response.errorMessage);
        setStep("upload");
        toast.error(response.errorMessage);
        return;
      }

      const rawQuestions = Array.isArray(response.questions) ? response.questions : [];
      if (rawQuestions.length === 0) {
        const fallback =
          "No questions could be extracted from this PDF. Please check that the file contains readable learning content and try again.";
        setError(fallback);
        setStep("upload");
        toast.error(fallback);
        return;
      }

      const importedQuestions: ImportedQuestion[] = rawQuestions.map((q, idx) => {
        const rawAnswers = Array.isArray(q.answers) ? q.answers : [];
        const correctIndex = rawAnswers.findIndex(a => a && a.isCorrect);
        const mappedCategory = mapCategory(q.category, q.content);
        return {
          id: `extracted-${Date.now()}-${idx}`,
          type: q.type === "TRUE_FALSE" ? "TRUE_FALSE" : "MULTIPLE_CHOICE",
          content: q.content || "",
          difficulty: q.difficulty?.toUpperCase() || "MEDIUM",
          explanation: q.explanation || "",
          answers: rawAnswers.map((a, aIdx) => ({
            content: a?.content || "",
            isCorrect: aIdx === correctIndex || (correctIndex === -1 && aIdx === 0),
          })),
          category: mappedCategory,
          needsReview: false,
        };
      });

      setQuestions(importedQuestions);
      setStep("preview");
      toast.success(`Generated ${importedQuestions.length} questions from PDF`);

      if (response.warning) {
        setWarning(response.warning);
        toast.warning(response.warning);
      }
    } catch (err: any) {
      const raw = err?.message || "Failed to process PDF. Please try again.";
      const friendly = raw.includes("aiResult") || raw.includes("Cannot invoke")
        ? "AI could not generate questions from this PDF. Please try a different file."
        : raw;
      setError(friendly);
      setStep("upload");
      toast.error(friendly);
    }
  }, [selectedFile, selectedMode, questionCount, questionType, difficulty, level, targetSkills]);

  /** Valid Question Bank category values (canonical PascalCase). */
  const VALID_CATEGORIES = ["Vocabulary", "Grammar", "Reading", "Listening"];

  /**
   * Normalize any category string (PascalCase / UPPER / lower / blank) to the
   * canonical PascalCase form used in the DB and the Question Bank UI.
   *
   * Returns null when the value cannot be recognized, so callers can decide
   * whether to fall back or surface an error instead of silently coercing to
   * "Vocabulary" (the previous behaviour that hid real BE issues).
   */
  const normalizeCategory = (cat: string | undefined | null): string | null => {
    if (!cat) return null;
    const trimmed = String(cat).trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (lower === "vocabulary") return "Vocabulary";
    if (lower === "grammar") return "Grammar";
    if (lower === "reading") return "Reading";
    if (lower === "listening") return "Listening";
    return null;
  };

  /** Check if a string is a valid Question Bank category (case-insensitive). */
  const isValidCategory = (cat: string | undefined | null): boolean => {
    return normalizeCategory(cat) !== null;
  };

  /**
   * Map AI response fields to ImportedQuestion category.
   *
   * Priority:
   *   1. Backend-provided category (already canonical PascalCase after sanitize).
   *   2. Backend-inferred category from content (call inferCategory locally —
   *      we don't have access to BE's content-based inference, so we fall back
   *      to selectedSkills[0] ONLY when the user picked a single skill).
   *
   * Critically: we do NOT silently coerce to "Vocabulary" — that's the bug that
   * caused every Grammar question in a mixed PDF to be tagged VOCABULARY when
   * the user picked VOCABULARY + GRAMMAR.
   */
  const mapCategory = (
    aiCategory: string | undefined | null,
    questionContent: string | undefined | null,
  ): string => {
    const normalized = normalizeCategory(aiCategory);
    if (normalized) return normalized;

    // No backend category. Prefer a content-based heuristic so we don't lose
    // the grammar/reading signal just because the AI omitted the field.
    const lc = (questionContent || "").toLowerCase();
    const looksLikeGrammar =
      /particle|grammar pattern|sentence ending|sentence pattern|grammar|trợ từ|ngữ pháp|mẫu câu|cấu trúc|chức năng|biểu thị|used to|how to use|usage of|what does the particle|what does the sentence ending/i.test(
        lc,
      );
    const looksLikeReading =
      /read the passage|according to the passage|based on the text|main idea|reading comprehension|đọc đoạn văn|đọc bài đọc|đọc hiểu|theo bài đọc|đoạn văn|bài đọc/i.test(
        lc,
      );
    if (looksLikeGrammar && !looksLikeReading) return "Grammar";
    if (looksLikeReading) return "Reading";

    // Single-skill selection — every question belongs to that skill.
    if (targetSkills.length === 1) {
      return normalizeCategory(targetSkills[0]) ?? "Vocabulary";
    }
    // Multi-skill selection with no category signal: keep the first selected
    // skill (preserves the user's primary intent) — DO NOT force Vocabulary.
    return normalizeCategory(targetSkills[0]) ?? "Vocabulary";
  };

  const handleAddQuestion = () => {
    const defaultCategory =
      normalizeCategory(targetSkills[0]) ?? "Vocabulary";
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
      category: defaultCategory,
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleCreate = async () => {
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

    // Validate that all questions match selected skills
    if (targetSkills.length > 0) {
      const nonMatchingQuestions = questions.filter((q) => {
        if (!q.category) return false;
        const cat = q.category.toUpperCase();
        return !targetSkills.some((skill) => {
          const upper = skill.toUpperCase();
          const titleCase =
            skill.substring(0, 1).toUpperCase() + skill.substring(1).toLowerCase();
          return cat === upper || cat === titleCase;
        });
      });

      if (nonMatchingQuestions.length > 0) {
        setError("All imported questions must match the selected skills.");
        return;
      }
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

  // Disabled state
  if (!enabled) {
    return (
      <div className="space-y-6">
        <div
          className="card-base p-12 border-2 border-dashed text-center transition border-[var(--border)] opacity-60 cursor-not-allowed"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-lg text-primary-col mb-1">
            AI PDF Import (Coming Soon)
          </h3>
          <p className="text-sm text-secondary-col mb-4">
            {disabledReason}
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection View */}
      {step === "select-mode" && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="font-display font-bold text-lg text-primary-col mb-1">
              Choose Import Mode
            </h3>
            <p className="text-sm text-secondary-col">
              Select how you want AI to process your PDF
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Generate from Content Mode */}
            <button
              type="button"
              onClick={() => handleSelectMode("GENERATE_FROM_CONTENT")}
              className="card-base p-6 border-2 border-primary/20 hover:border-primary/50 transition text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-primary-col mb-1 group-hover:text-primary transition">
                    Generate from Learning Content
                  </h4>
                  <p className="text-sm text-secondary-col">
                    Use when PDF is vocabulary lists, grammar explanations, reading passages, or study materials. AI will create new questions from the content.
                  </p>
                </div>
              </div>
            </button>

            {/* Import Existing Questions Mode */}
            <button
              type="button"
              onClick={() => handleSelectMode("IMPORT_EXISTING_QUESTIONS")}
              className="card-base p-6 border-2 border-primary/20 hover:border-primary/50 transition text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-primary-col mb-1 group-hover:text-primary transition">
                    Import Existing Questions
                  </h4>
                  <p className="text-sm text-secondary-col">
                    Use when PDF already has exam questions with options and answers. AI will extract and standardize the questions.
                  </p>
                </div>
              </div>
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

      {/* Configuration View */}
      {step === "configure" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToModeSelection}
              className="text-sm text-muted-col hover:text-primary-col transition"
            >
              ← Back to mode selection
            </button>
          </div>

          {selectedMode === "GENERATE_FROM_CONTENT" && (
            <div className="card-base p-6 border border-[var(--border)] space-y-4">
              <h4 className="font-display font-bold text-primary-col mb-3">
                Configure Question Generation
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                    JLPT Level (Optional)
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
                  >
                    <option value="">Any Level</option>
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                    Question Type
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                    <option value="FILL_BLANK">Fill in Blank</option>
                    <option value="MIXED">Mixed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all-skills"
                      checked={targetSkills.length === AVAILABLE_SKILLS.length}
                      onChange={() => {
                        if (targetSkills.length === AVAILABLE_SKILLS.length) {
                          setTargetSkills([]);
                        } else {
                          setTargetSkills([...AVAILABLE_SKILLS]);
                        }
                      }}
                      className="w-4 h-4 rounded border-[var(--border)] text-primary focus:ring-primary"
                    />
                    <label htmlFor="select-all-skills" className="text-xs font-bold text-secondary-col uppercase tracking-wider cursor-pointer">
                      Target Skills
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3 pl-6">
                    {AVAILABLE_SKILLS.map((skill) => (
                      <label
                        key={skill}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition ${
                          isSkillSelected(skill)
                            ? "bg-primary/10 border-primary text-primary-col"
                            : "bg-[var(--accent)] border-[var(--border)] text-secondary-col hover:border-primary/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSkillSelected(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          className="sr-only"
                        />
                        <span className="text-xs font-semibold">{skill}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-col pl-6">
                    AI will only extract or generate questions for the selected skills.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleStartUpload}
                  className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
                >
                  Continue to Upload PDF
                </button>
              </div>
            </div>
          )}

          {selectedMode === "IMPORT_EXISTING_QUESTIONS" && (
            <div className="card-base p-6 border border-[var(--border)] space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-primary-col mb-1">
                    Import Existing Questions
                  </h4>
                  <p className="text-sm text-secondary-col mb-4">
                    AI will extract questions from your PDF. The number of questions depends on the content of your PDF.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all-skills-import"
                    checked={targetSkills.length === AVAILABLE_SKILLS.length}
                    onChange={() => {
                      if (targetSkills.length === AVAILABLE_SKILLS.length) {
                        setTargetSkills([]);
                      } else {
                        setTargetSkills([...AVAILABLE_SKILLS]);
                      }
                    }}
                    className="w-4 h-4 rounded border-[var(--border)] text-primary focus:ring-primary"
                  />
                  <label htmlFor="select-all-skills-import" className="text-xs font-bold text-secondary-col uppercase tracking-wider cursor-pointer">
                    Target Skills
                  </label>
                </div>
                <div className="flex flex-wrap gap-3 pl-6">
                  {AVAILABLE_SKILLS.map((skill) => (
                    <label
                      key={skill}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition ${
                        isSkillSelected(skill)
                          ? "bg-primary/10 border-primary text-primary-col"
                          : "bg-[var(--accent)] border-[var(--border)] text-secondary-col hover:border-primary/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSkillSelected(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        className="sr-only"
                      />
                      <span className="text-xs font-semibold">{skill}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-col pl-6">
                  AI will only extract or generate questions for the selected skills.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartUpload}
                  className="px-6 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
                >
                  Continue to Upload PDF
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Upload View */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToModeSelection}
              className="text-sm text-muted-col hover:text-primary-col transition"
            >
              ← Back to mode selection
            </button>
          </div>

          {/* Selected Skills Summary */}
          <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-primary-col text-xs uppercase tracking-wider">Selected Skills:</span>
              {targetSkills.map(skill => (
                <span key={skill} className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary-col text-xs font-semibold">
                  {skill}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-col mt-1">
              AI will only extract questions for these skills.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)]/40 p-4 text-sm text-secondary-col space-y-1">
            {selectedMode === "IMPORT_EXISTING_QUESTIONS" ? (
              <>
                <p className="text-primary-col font-bold">PDF does not need a fixed template.</p>
                <p>
                  For best results, include clear questions, answer options (A/B/C/D or a/b/c/d), and the correct answer.
                  Labels like <span className="font-semibold">Answer</span>, <span className="font-semibold">Correct answer</span>,
                  <span className="font-semibold"> Đáp án</span>, <span className="font-semibold">Giải thích</span> are recognized when clearly written.
                </p>
                <p className="text-muted-col">Scanned image-only PDFs or PDFs with broken table layouts may not be readable.</p>
              </>
            ) : (
              <>
                <p className="text-primary-col font-bold">Upload lesson content such as vocabulary, grammar, or reading notes.</p>
                <p>
                  AI will generate new questions from the content — your PDF does not need to already contain questions.
                </p>
              </>
            )}
          </div>

          <div
            className={`card-base p-12 border-2 text-center transition ${
              targetSkills.length === 0
                ? "border-dashed border-muted cursor-not-allowed opacity-60"
                : "border-dashed border-[var(--border)] hover:border-primary/50 cursor-pointer"
            }`}
            onClick={() => {
              if (targetSkills.length === 0) {
                toast.error("Please select at least one skill before uploading a PDF.");
                return;
              }
              fileInputRef.current?.click();
            }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (targetSkills.length === 0) {
                toast.error("Please select at least one skill before uploading a PDF.");
                return;
              }
              const file = e.dataTransfer.files[0];
              if (file) handleSelectFile(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSelectFile(file);
              }}
            />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
              targetSkills.length === 0 ? "bg-muted" : "bg-primary/10"
            }`}>
              <Upload className={`w-8 h-8 ${targetSkills.length === 0 ? "text-muted-foreground" : "text-primary"}`} />
            </div>
            <h3 className="font-display font-bold text-lg text-primary-col mb-1">
              Upload PDF to Extract Questions
            </h3>
            <p className="text-sm text-secondary-col mb-4">
              Drag and drop your PDF here, or click to browse
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (targetSkills.length === 0) {
                  toast.error("Please select at least one skill before uploading a PDF.");
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={targetSkills.length === 0}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition ${
                targetSkills.length === 0
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-hero text-white hover:opacity-90"
              }`}
            >
              Select PDF File
            </button>
            {targetSkills.length === 0 && (
              <p className="text-xs text-[var(--status-rejected)] mt-3">
                Please select at least one skill above before uploading.
              </p>
            )}
          </div>

          {selectedFile && (
            <div className="px-4 py-3 rounded-xl bg-primary/10 text-primary text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>Selected: {selectedFile.name}</span>
              <span className="text-xs text-primary/70">
                ({Math.round(selectedFile.size / 1024)} KB)
              </span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="ml-auto text-xs font-semibold text-primary hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedFile}
              data-testid="ai-pdf-generate-button"
              className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition ${
                !selectedFile
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-hero text-white hover:opacity-90"
              }`}
            >
              Generate Questions
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
              <p className="text-xs text-muted-col mt-1" data-testid="analyzed-file">
                <span className="font-semibold">Analyzed file:</span>{" "}
                <span className="font-mono">{selectedFile?.name ?? "(unknown)"}</span>
                {selectedFile ? (
                  <span className="ml-2 text-muted-col">({selectedFile.size} bytes)</span>
                ) : null}
              </p>
              <p className="text-xs text-muted-col mt-1">
                <span className="font-semibold">Mode:</span>{" "}
                {selectedMode === "IMPORT_EXISTING_QUESTIONS" ? "Import Existing Questions" : "Generate from Content"}
                {" · "}
                <span className="font-semibold">Skills:</span>{" "}
                {targetSkills.join(", ") || "(none)"}
              </p>
              {selectedMode === "IMPORT_EXISTING_QUESTIONS" && (
                <p className="text-xs text-muted-col mt-1">
                  <span className="font-semibold">Note:</span> All valid questions from the PDF were extracted. The requested count applies only to Generate from Content mode.
                </p>
              )}
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

          {warning && !error && (
            <div className="px-4 py-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2 border border-amber-500/30">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{warning}</span>
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
                selectedSkills={targetSkills}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

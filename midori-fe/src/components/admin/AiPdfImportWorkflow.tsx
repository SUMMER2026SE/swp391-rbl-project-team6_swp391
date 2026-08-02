import React, { useState, useCallback, useRef, useEffect } from "react";
import { useEvent } from "./useEvent";
import { Upload, Loader2, AlertCircle, Plus, CheckCircle, FileText, Sparkles, RefreshCw } from "lucide-react";
import { QuestionEditor, ImportedQuestion } from "./pdf-import/QuestionEditor";
import { aiApi, type PdfImportMode, type TargetSkill, type PdfImportQuestionType, type DifficultyPercentages, type WritingMode } from "@/lib/api/ai";
import { toast } from "sonner";

interface AiPdfImportWorkflowProps {
  onCreate: (questions: ImportedQuestion[]) => Promise<void>;
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  enabled?: boolean;
  disabledReason?: string;
  /**
   * When provided, the workflow skips the mode-selection screen and locks the
   * caller into the specified mode. Each wrapper MUST declare its mode
   * explicitly so we never silently fall back to IMPORT_EXISTING_QUESTIONS:
   *
   * - Question Bank PDF AI: omit defaultMode (user selects explicitly)
   *
   * <p>For Homework + Exam flows we now want the user to pick a mode first,
   * so {@code defaultMode} should NOT be set on those wrappers.
   */
  defaultMode?: PdfImportMode;
}

const mapErrorCodeToMessage = (
  code: string | undefined | null,
  fallbackMsg: string,
  generatedCount?: number,
  requestedCount?: number
): string => {
  if (!code) return fallbackMsg;
  switch (code) {
    case "AI_QUOTA_EXHAUSTED":
      return "AI quota is temporarily exhausted. Please try again later.";
    case "AI_RATE_LIMITED":
      return "AI providers are temporarily rate-limited. Please try again later.";
    case "AI_PROVIDER_TIMEOUT":
      return "The AI provider took too long to respond. Please try again.";
    case "AI_REQUEST_TIMEOUT":
      return "The request exceeded the maximum processing time. Please try again.";
    case "AI_PROVIDER_UNAVAILABLE":
      return "AI providers are temporarily unavailable due to quota limits or provider timeout. Please try again later.";
    case "AI_INVALID_RESPONSE":
      return "AI service returned an invalid response. Please retry.";
    case "AI_INVALID_API_KEY":
    case "AI_PROVIDER_FORBIDDEN":
    case "AI_PROVIDER_CALL_LIMIT_REACHED":
      return "AI service is temporarily unavailable. Please try again later.";
    case "PDF_UNREADABLE":
      return "No questions could be extracted from this PDF. Please check that the file contains readable learning content and try again.";
    case "AI_PARTIAL_RESULT":
      if (generatedCount !== undefined && requestedCount !== undefined) {
        return `${generatedCount} of ${requestedCount} questions were generated. Please try again.`;
      }
      return fallbackMsg;
    default:
      return fallbackMsg;
  }
};

export const AiPdfImportWorkflow: React.FC<AiPdfImportWorkflowProps> = ({
  onCreate,
  title,
  subtitle,
  backHref,
  backLabel,
  enabled = false,
  disabledReason = "This feature is not available yet",
  defaultMode,
}) => {
  const [step, setStep] = useState<"select-mode" | "configure" | "upload" | "loading" | "preview">(() => {
    if (defaultMode === "IMPORT_EXISTING_QUESTIONS") return "upload";
    if (defaultMode === "GENERATE_FROM_CONTENT") return "configure";
    return "select-mode";
  });
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reAnalyzingIndexes] = useState<Record<number, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Guards against duplicate requests (StrictMode double-mount, double onChange,
  // double drop, etc). The string is a stable request key.
  const inFlightKeyRef = useRef<string | null>(null);

  // Stable handle for the (re-created on every config change)
  // handleGenerateInternal function. handleSelectFile — declared further
  // down — invokes THIS ref rather than the inline function so that
  // handleSelectFile's identity never changes when configuration state
  // (skills, question count, etc.) changes. Without this indirection we
  // get a stale closure warning OR an infinite re-render loop.
  const handleGenerateInternalRef = useRef<(file: File) => Promise<void>>(
    async () => {},
  );

  // Generation options state
  const [selectedMode, setSelectedMode] = useState<PdfImportMode | null>(
    defaultMode ?? null,
  );
  const [questionCount, setQuestionCount] = useState(10);
  const [questionType, setQuestionType] = useState<PdfImportQuestionType>("MULTIPLE_CHOICE");
  const [questionFormats, setQuestionFormats] = useState<PdfImportQuestionType[]>(["AUTO_DETECT"]);
  const SKILL_FORMAT_COMPATIBILITY: Record<string, string[]> = {
    VOCABULARY: ["MULTIPLE_CHOICE", "FILL_BLANK", "SHORT_ANSWER", "MATCHING", "TRANSLATION", "SENTENCE_WRITING"],
    GRAMMAR: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER", "SENTENCE_WRITING", "ERROR_CORRECTION", "TRANSLATION"],
    READING: ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "FILL_BLANK", "TRANSLATION"],
    WRITING: ["TRANSLATION", "SENTENCE_WRITING", "SHORT_ANSWER", "ERROR_CORRECTION"]
  };

  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [level, setLevel] = useState("");
  const [targetSkills, setTargetSkills] = useState<TargetSkill[]>([]);
  const [writingMode, setWritingMode] = useState<WritingMode>("MIXED_WRITING");
  const [difficultyPercent, setDifficultyPercent] = useState<DifficultyPercentages>({
    easy: 30,
    medium: 50,
    hard: 20,
  });

  const getCompatibleFormats = (): PdfImportQuestionType[] => {
    const allFormats: PdfImportQuestionType[] = [
      "MULTIPLE_CHOICE",
      "TRUE_FALSE",
      "FILL_BLANK",
      "SHORT_ANSWER",
      "MATCHING",
      "TRANSLATION",
      "SENTENCE_WRITING",
      "ERROR_CORRECTION"
    ];
    if (!targetSkills || targetSkills.length === 0) {
      return allFormats;
    }
    const compatible = new Set<string>();
    targetSkills.forEach(skill => {
      const formatsForSkill = SKILL_FORMAT_COMPATIBILITY[skill.toUpperCase()];
      if (formatsForSkill) {
        formatsForSkill.forEach(f => compatible.add(f));
      }
    });
    return allFormats.filter(f => compatible.has(f));
  };

  const getFirstCompatibleFormat = (): PdfImportQuestionType | null => {
    const comp = getCompatibleFormats();
    return comp.length > 0 ? comp[0] : null;
  };

  // Derive isWritingOnly from targetSkills
  const isWritingOnly = targetSkills.length === 1 && targetSkills[0] === "WRITING";

  // Adjust selected formats and reset questionType/writingMode when skills change
  useEffect(() => {
    if (selectedMode === "IMPORT_EXISTING_QUESTIONS") {
      const compatible = getCompatibleFormats();
      setQuestionFormats((prev) => {
        if (prev.includes("AUTO_DETECT")) return prev;
        const next = prev.filter((f) => compatible.includes(f));
        return next.length > 0 ? next : ["AUTO_DETECT"];
      });
    }
    if (isWritingOnly) {
      setQuestionType("MULTIPLE_CHOICE");
    }
  }, [targetSkills, selectedMode, isWritingOnly]);

  // Derive single questionFormat for backward compatibility (takes first element)
  const questionFormat = questionFormats[0] || "AUTO_DETECT";

  // Toggle format selection (only for IMPORT mode)
  const handleFormatToggle = (format: PdfImportQuestionType) => {
    if (selectedMode === "IMPORT_EXISTING_QUESTIONS") {
      setQuestionFormats((prev) => {
        if (format === "AUTO_DETECT") {
          if (prev.includes("AUTO_DETECT")) {
            const firstCompatible = getFirstCompatibleFormat();
            return firstCompatible ? [firstCompatible] : ["AUTO_DETECT"];
          } else {
            return ["AUTO_DETECT"];
          }
        }
        const withoutAutoDetect = prev.filter((f) => f !== "AUTO_DETECT");
        if (withoutAutoDetect.includes(format)) {
          const remaining = withoutAutoDetect.filter((f) => f !== format);
          return remaining.length > 0 ? remaining : ["AUTO_DETECT"];
        } else {
          return [...withoutAutoDetect, format];
        }
      });
    }
  };

  const isFormatDisabled = (format: PdfImportQuestionType) => {
    if (selectedMode !== "IMPORT_EXISTING_QUESTIONS") return true;
    if (format === "AUTO_DETECT") return false;
    if (questionFormats.includes("AUTO_DETECT")) return true;
    const compatible = getCompatibleFormats();
    if (!compatible.includes(format)) return true;
    return false;
  };

  // Question Bank skills only - LISTENING and KANJI excluded
  const AVAILABLE_SKILLS: TargetSkill[] = ["VOCABULARY", "GRAMMAR", "READING", "WRITING"];

  const isSkillRequired = selectedMode === "GENERATE_FROM_CONTENT";
  const disableUpload = isSkillRequired && targetSkills.length === 0;

  const handleSkillToggle = (skill: TargetSkill) => {
    setTargetSkills((prev) => {
      if (skill === "WRITING") {
        return prev.includes("WRITING") ? [] : ["WRITING"];
      } else {
        const withoutWriting = prev.filter((s) => s !== "WRITING");
        if (withoutWriting.includes(skill)) {
          return withoutWriting.filter((s) => s !== skill);
        } else {
          return [...withoutWriting, skill];
        }
      }
    });
    setQuestionType("MULTIPLE_CHOICE");
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
    // Reset the file input so the user can re-pick the same file later
    // (browsers silently skip onChange otherwise).
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Reset the in-flight guard so a fresh upload can fire after switching modes.
    inFlightKeyRef.current = null;
  };

  const handleBackToModeSelection = () => {
    // When defaultMode is supplied by the wrapper, the user cannot switch modes.
    if (defaultMode) return;
    setStep("select-mode");
    setSelectedMode(null);
    setError(null);
    setWarning(null);
    setQuestions([]);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    inFlightKeyRef.current = null;
  };

  const handleStartUpload = () => {
    if (disableUpload) {
      setError("Please select at least one skill.");
      return;
    }
    if (selectedMode === "GENERATE_FROM_CONTENT") {
      const total =
        difficultyPercent.easy + difficultyPercent.medium + difficultyPercent.hard;
      if (total !== 100) {
        setError("Difficulty percentages must sum to exactly 100%.");
        return;
      }
      if (questionCount < 1 || questionCount > 100) {
        setError("Number of Questions must be between 1 and 100.");
        return;
      }
    }
    setError(null);
    setStep("upload");
  };

  const handleSelectFile = useEvent((file: File) => {
    if (!enabled) {
      setError("This feature is currently disabled.");
      return;
    }

    if (!selectedMode) {
      const msg = "Please choose an import mode before uploading a PDF.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (disableUpload) {
      const msg = "Please select at least one skill before uploading a PDF.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setQuestions([]);
    setError(null);
    setWarning(null);
    setSelectedFile(file);

    // STEP 5 fix: Auto-generate immediately after selecting a valid PDF.
    // No need for a separate "Generate" button click.
    // handleGenerateInternal reads from closure — call it directly so it uses the new file.
    handleGenerateInternalRef.current(file);
  });

  // Shared internal generation logic that accepts the File directly so it
  // always uses the freshly-selected file (not a stale closure snapshot).
  const handleGenerateInternal = useCallback(async (file: File) => {
    // Hard guard: refuse to call without an explicit mode. No hidden fallback.
    if (!selectedMode) {
      const msg = "Please choose an import mode before generating questions.";
      setError(msg);
      toast.error(msg);
      setStep("select-mode");
      return;
    }

    // De-dupe: same file + same mode cannot trigger two parallel requests.
    // This guards against React StrictMode double-mount, double onChange,
    // double drop events, and any other re-entry that would otherwise fire
    // the backend twice for a single user upload.
    const requestKey = `${file.name}:${file.size}:${file.lastModified}:${selectedMode}`;
    if (inFlightKeyRef.current === requestKey) {
      return;
    }
    inFlightKeyRef.current = requestKey;

    setError(null);
    setWarning(null);
    setStep("loading");
    setLoadingMessage("Processing PDF and generating questions...");
    setIsGenerating(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 180000); // 180 seconds (3 minutes) — safety net; backend enforces 90s deadline and returns before this fires

    let success = false;
    try {
      const response = await aiApi.generateQuestionsFromPdf({
        file,
        mode: selectedMode,
        level: level || undefined,
        count: selectedMode === "GENERATE_FROM_CONTENT" ? questionCount : undefined,
        questionType: selectedMode === "GENERATE_FROM_CONTENT" ? (targetSkills.includes("WRITING") ? "SHORT_ANSWER" as PdfImportQuestionType : questionType) : undefined,
        writingMode: selectedMode === "GENERATE_FROM_CONTENT" && targetSkills.includes("WRITING") ? writingMode : undefined,
        difficulty: selectedMode === "GENERATE_FROM_CONTENT" ? difficulty : undefined,
        difficultyPercent:
          selectedMode === "GENERATE_FROM_CONTENT" ? difficultyPercent : undefined,
        targetSkills: targetSkills.length > 0 ? targetSkills : undefined,
        // For IMPORT mode, pass the format filter
        // questionFormats array (supports multiple formats)
        // AUTO_DETECT means no filter
        questionFormats: selectedMode === "IMPORT_EXISTING_QUESTIONS" ? questionFormats : undefined,
      }, controller.signal);

      clearTimeout(timeoutId);

      if (response.success === false || response.errorMessage) {
        const rawQuestions = Array.isArray(response.questions) ? response.questions : [];
        if (rawQuestions.length === 0) {
          const userMsg = mapErrorCodeToMessage(response.code, response.errorMessage || "Failed to process PDF.", response.generatedCount, response.requestedCount);
          setError(userMsg);
          setStep("upload");
          toast.error(userMsg);
          return;
        } else {
          const userMsg = mapErrorCodeToMessage(response.code, response.errorMessage || "Some questions could not be generated.", response.generatedCount, response.requestedCount);
          setWarning(userMsg);
          toast.warning(userMsg);
        }
      }

      const rawQuestions = Array.isArray(response.questions) ? response.questions : [];
      if (rawQuestions.length === 0) {
        const fallback = response.code === "PDF_UNREADABLE"
          ? "No questions could be extracted from this PDF. Please check that the file contains readable learning content and try again."
          : (response.errorMessage || "Failed to generate questions from this PDF. Please try again.");
        setError(fallback);
        setStep("upload");
        toast.error(fallback);
        return;
      }

      let importedQuestions: ImportedQuestion[] = rawQuestions.map((q, idx) => {
        const rawAnswers = Array.isArray(q.answers) ? q.answers : [];
        const correctIndex = rawAnswers.findIndex(a => a && a.isCorrect);
        const mappedCategory = mapCategory(q.category, q.content);
        let resolvedType = normalizePreviewType(q.type);
        let mappedAnswers: { content: string; isCorrect: boolean }[];
        const isTextType =
          resolvedType === "FILL_BLANK" ||
          resolvedType === "SHORT_ANSWER" ||
          resolvedType === "TRANSLATION" ||
          resolvedType === "SENTENCE_WRITING" ||
          resolvedType === "ERROR_CORRECTION" ||
          resolvedType === "SENTENCE_REORDER";

        if (isTextType) {
          // For text-only questions the BE may return zero or many options;
          // collapse them to a single text answer the editor can render.
          const firstAnswer = rawAnswers[0];
          mappedAnswers = [{ content: firstAnswer?.content ?? "", isCorrect: true }];
        } else {
          mappedAnswers = rawAnswers.map((a, aIdx) => ({
            content: a?.content || "",
            isCorrect: aIdx === correctIndex || (correctIndex === -1 && aIdx === 0),
          }));
        }

        let transMeta = q.translationMetadata;
        let sentenceMeta = q.sentenceWritingMetadata;

        // Apply WRITING mode rules
        if (targetSkills.includes("WRITING") || mappedCategory === "Writing") {
          if (writingMode === "JA_TO_VI_TRANSLATION") {
            resolvedType = "TRANSLATION";
            transMeta = {
              direction: "JA_TO_VI",
              sourceText: q.translationMetadata?.sourceText || q.content,
              referenceAnswer: q.translationMetadata?.referenceAnswer || rawAnswers[0]?.content || "",
              acceptedAnswers: q.translationMetadata?.acceptedAnswers || rawAnswers.map(a => a.content),
              ...q.translationMetadata
            };
          } else if (writingMode === "VI_TO_JA_TRANSLATION") {
            resolvedType = "TRANSLATION";
            transMeta = {
              direction: "VI_TO_JA",
              sourceText: q.translationMetadata?.sourceText || q.content,
              referenceAnswer: q.translationMetadata?.referenceAnswer || rawAnswers[0]?.content || "",
              acceptedAnswers: q.translationMetadata?.acceptedAnswers || rawAnswers.map(a => a.content),
              ...q.translationMetadata
            };
          } else if (writingMode === "SENTENCE_REORDER") {
            resolvedType = "SENTENCE_WRITING";
            sentenceMeta = {
              wordTokens: q.sentenceWritingMetadata?.wordTokens || [],
              orderedAnswer: q.sentenceWritingMetadata?.orderedAnswer || rawAnswers[0]?.content || "",
              ...q.sentenceWritingMetadata
            };
          } else if (writingMode === "MIXED_WRITING") {
            if (resolvedType === "TRANSLATION") {
              transMeta = {
                direction: q.translationMetadata?.direction || "JA_TO_VI",
                sourceText: q.translationMetadata?.sourceText || q.content,
                referenceAnswer: q.translationMetadata?.referenceAnswer || rawAnswers[0]?.content || "",
                acceptedAnswers: q.translationMetadata?.acceptedAnswers || rawAnswers.map(a => a.content),
                ...q.translationMetadata
              };
            } else if (resolvedType === "SENTENCE_WRITING") {
              sentenceMeta = {
                wordTokens: q.sentenceWritingMetadata?.wordTokens || [],
                orderedAnswer: q.sentenceWritingMetadata?.orderedAnswer || rawAnswers[0]?.content || "",
                ...q.sentenceWritingMetadata
              };
            } else {
              resolvedType = "SHORT_ANSWER";
            }
          }
        }

        return {
          id: `extracted-${Date.now()}-${idx}`,
          type: resolvedType,
          content: q.content || "",
          difficulty: q.difficulty?.toUpperCase() || "MEDIUM",
          explanation: q.explanation || "",
          answers: mappedAnswers,
          category: mappedCategory,
          needsReview: false,
          translationMetadata: transMeta,
          sentenceWritingMetadata: sentenceMeta,
          errorCorrectionMetadata: q.errorCorrectionMetadata,
          matchingMetadata: q.matchingMetadata,
        };
      });

      // Filter by selected questionFormats client-side if not AUTO_DETECT
      if (selectedMode === "IMPORT_EXISTING_QUESTIONS" && !questionFormats.includes("AUTO_DETECT")) {
        importedQuestions = importedQuestions.filter(q => questionFormats.includes(q.type));
      }

      const expectedCount = selectedMode === "GENERATE_FROM_CONTENT" ? questionCount : null;
      const isShortfall = expectedCount !== null && importedQuestions.length < expectedCount;

      const beWarning = response.warning || response.errorMessage;
      if (beWarning) {
        const userWarning = mapErrorCodeToMessage(response.code, beWarning, response.generatedCount, response.requestedCount);
        setWarning(userWarning);
        toast.warning(userWarning);
      } else if (isShortfall) {
        const shortMsg = `${importedQuestions.length} of ${expectedCount} questions were generated. Please try again.`;
        setWarning(shortMsg);
        toast.warning(shortMsg);
      }

      setQuestions(importedQuestions);
      setStep("preview");
      if (!isShortfall) {
        toast.success(`Generated ${importedQuestions.length} questions from PDF`);
      }
      success = true;
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Sanitize: prefer structured code+message from the BE, then fall back to safe defaults.
      // Never surface raw err.message (which can contain raw provider payloads).
      let friendly: string;
      const errCode = err?.response?.data?.code;
      const errMsg = err?.response?.data?.errorMessage || err?.response?.data?.message;
      if (errCode || errMsg) {
        friendly = mapErrorCodeToMessage(errCode, errMsg || "Failed to process PDF. Please try again.");
      } else if (err?.name === "AbortError" || (err instanceof DOMException && err.name === "AbortError")) {
        friendly = "The request exceeded the maximum processing time. Please try again.";
      } else {
        friendly = "Failed to process PDF. Please try again.";
      }
      setError(friendly);
      setStep("upload");
      toast.error(friendly);
    } finally {
      setIsGenerating(false);
      // Release the in-flight guard so Retry / Generate Again / re-selecting the
      // same file after a reset can re-trigger generation.
      inFlightKeyRef.current = null;
      if (!success) {
        setStep("upload");
      }
    }
  }, [selectedMode, questionCount, questionType, difficulty, level, targetSkills, difficultyPercent, questionFormats]);

  // Stable ref that always points at the LATEST handleGenerateInternal.
  // handleSelectFile (a useEvent) reads through this ref so it does NOT
  // need to declare handleGenerateInternal as a dependency — that would
  // create a loop where handleSelectFile's identity changes every time
  // the configuration state changes, which would re-render every
  // consumer. Reading through a ref gives us "always the newest closure,
  // never a stale one, never a render storm".
  useEffect(() => {
    handleGenerateInternalRef.current = handleGenerateInternal;
  }, [handleGenerateInternal]);

  // Legacy button-triggered generation — kept for retry / "Generate Again" use cases.
  const handleGenerate = useCallback(async () => {
    if (!selectedFile || !selectedMode) {
      setError("Please select a PDF file before generating questions.");
      return;
    }
    await handleGenerateInternal(selectedFile);
  }, [selectedFile, selectedMode, handleGenerateInternal]);

  /** Valid Question Bank category values (canonical PascalCase) - LISTENING and KANJI excluded */
  const VALID_CATEGORIES = ["Vocabulary", "Grammar", "Reading", "Writing"];

  /**
   * Normalize a free-form question type string from the BE preview response
   * to the canonical value the FE {@link QuestionEditor} can render.
   * Falls back to SHORT_ANSWER so the editor can handle unknown formats.
   */
  const normalizePreviewType = (raw: string | undefined | null): PdfImportQuestionType => {
    if (!raw) return "MULTIPLE_CHOICE";
    const norm = raw.trim().toUpperCase().replace(/-/g, "_");
    switch (norm) {
      case "TRUE_FALSE":
      case "TRUEFALSE":
      case "TF":
        return "TRUE_FALSE";
      case "FILL_BLANK":
      case "FILL_IN_BLANK":
      case "FILLINTHEBLANK":
      case "FILL":
      case "BLANK":
        return "FILL_BLANK";
      case "SHORT_ANSWER":
      case "SHORTANSWER":
      case "ESSAY":
      case "WRITING":
        return "SHORT_ANSWER";
      case "MATCHING":
        return "MATCHING";
      case "TRANSLATION":
        return "TRANSLATION";
      case "SENTENCE_WRITING":
      case "SENTENCEWRITING":
      case "SENTENCE_REORDER":
      case "SENTENCEREORDER":
        return "SENTENCE_WRITING";
      case "ERROR_CORRECTION":
      case "ERRORCORRECTION":
      case "ERROR_CORRECT":
      case "CORRECT_THE_ERROR":
        return "ERROR_CORRECTION";
      case "MULTIPLE_CHOICE":
      case "MCQ":
      case "MC":
      default:
        return "MULTIPLE_CHOICE";
    }
  };

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
    if (lower === "writing") return "Writing";
    // LISTENING and KANJI are not supported by Question Bank
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
      const isTextOnly =
        q.type === "FILL_BLANK" ||
        q.type === "SHORT_ANSWER" ||
        q.type === "TRANSLATION" ||
        q.type === "SENTENCE_WRITING" ||
        q.type === "ERROR_CORRECTION" ||
        q.type === "SENTENCE_REORDER";
      if (isTextOnly) {
        // Text-only questions need exactly one non-blank answer slot.
        if (q.answers.length !== 1) return true;
        if (!q.answers[0].content || !q.answers[0].content.trim()) return true;
        return false;
      }
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
              data-testid="mode-generate-from-content"
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
              data-testid="mode-import-existing-questions"
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
          {!defaultMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToModeSelection}
                className="text-sm text-muted-col hover:text-primary-col transition"
              >
                ← Back to mode selection
              </button>
            </div>
          )}

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
                    {targetSkills.includes("WRITING") ? "Writing Mode" : "Question Type"}
                  </label>
                  {targetSkills.includes("WRITING") ? (
                    <select
                      value={writingMode}
                      onChange={(e) => setWritingMode(e.target.value as WritingMode)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
                    >
                      <option value="MIXED_WRITING">Mixed Writing Exercises</option>
                      <option value="JA_TO_VI_TRANSLATION">Japanese → Vietnamese Translation</option>
                      <option value="VI_TO_JA_TRANSLATION">Vietnamese → Japanese Translation</option>
                      <option value="SENTENCE_REORDER">Sentence Reordering</option>
                    </select>
                  ) : (
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value as PdfImportQuestionType)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
                    >
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="TRUE_FALSE">True/False</option>
                      <option value="FILL_BLANK">Fill in Blank</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                    </select>
                  )}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                    Difficulty Distribution (must total 100%)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-secondary-col">Easy %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={difficultyPercent.easy}
                        data-testid="difficulty-easy"
                        onChange={(e) =>
                          setDifficultyPercent({
                            ...difficultyPercent,
                            easy: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-center text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-secondary-col">Medium %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={difficultyPercent.medium}
                        data-testid="difficulty-medium"
                        onChange={(e) =>
                          setDifficultyPercent({
                            ...difficultyPercent,
                            medium: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-center text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-secondary-col">Hard %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={difficultyPercent.hard}
                        data-testid="difficulty-hard"
                        onChange={(e) =>
                          setDifficultyPercent({
                            ...difficultyPercent,
                            hard: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-center text-primary-col focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                      />
                    </div>
                  </div>
                  {(() => {
                    const total = difficultyPercent.easy + difficultyPercent.medium + difficultyPercent.hard;
                    const valid = total === 100;
                    return (
                      <p
                        data-testid="difficulty-total"
                        className={
                          "text-[11px] font-semibold " +
                          (valid ? "text-emerald-600" : "text-[var(--status-rejected)]")
                        }
                      >
                        Total: {total}% {valid ? "✓" : "(must equal 100%)"}
                      </p>
                    );
                  })()}
                  {(() => {
                    const easy = Math.round((difficultyPercent.easy * questionCount) / 100);
                    const medium = Math.round((difficultyPercent.medium * questionCount) / 100);
                    const hard = Math.max(0, questionCount - easy - medium);
                    return (
                      <p className="text-[11px] text-muted-col">
                        Planned split: Easy {easy} • Medium {medium} • Hard {hard}
                      </p>
                    );
                  })()}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all-skills"
                      checked={["VOCABULARY", "GRAMMAR", "READING"].every(s => targetSkills.includes(s as TargetSkill))}
                      onChange={() => {
                        if (["VOCABULARY", "GRAMMAR", "READING"].every(s => targetSkills.includes(s as TargetSkill))) {
                          setTargetSkills([]);
                        } else {
                          setTargetSkills(["VOCABULARY", "GRAMMAR", "READING"]);
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
                    AI will extract and classify questions from your PDF. The number of questions depends on the content of your PDF.
                  </p>
                </div>
              </div>

              {/* Target Skills */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all-skills-import"
                    checked={["VOCABULARY", "GRAMMAR", "READING"].every((s) => targetSkills.includes(s as TargetSkill))}
                    onChange={() => {
                      if (["VOCABULARY", "GRAMMAR", "READING"].every((s) => targetSkills.includes(s as TargetSkill))) {
                        setTargetSkills([]);
                      } else {
                        setTargetSkills(["VOCABULARY", "GRAMMAR", "READING"]);
                      }
                    }}
                    className="w-4 h-4 rounded border-[var(--border)] text-primary focus:ring-primary"
                  />
                  <label htmlFor="select-all-skills-import" className="text-xs font-bold text-secondary-col uppercase tracking-wider cursor-pointer">
                    Target Skills (Optional Filter)
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
                  Leave empty to import all skills. Select specific skills to filter questions by category.
                </p>
              </div>

              {/* Writing Mode — shown only when WRITING is the only selected skill */}
              {isWritingOnly && (
                <div className="space-y-1.5 border-t border-[var(--border)] pt-4">
                  <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                    Writing Mode
                  </label>
                  <select
                    value={writingMode}
                    onChange={(e) => setWritingMode(e.target.value as WritingMode)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none cursor-pointer"
                  >
                    <option value="MIXED_WRITING">Mixed Writing Exercises</option>
                    <option value="JA_TO_VI_TRANSLATION">Japanese → Vietnamese Translation</option>
                    <option value="VI_TO_JA_TRANSLATION">Vietnamese → Japanese Translation</option>
                    <option value="SENTENCE_REORDER">Sentence Reordering</option>
                  </select>
                </div>
              )}

              {/* Question Format — hidden when WRITING is selected */}
              {!isWritingOnly && (
                <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                      Question Format
                    </label>
                    <p className="text-xs text-muted-col mb-2">
                      Select formats to filter imported questions. Leave Auto Detect to import all formats.
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-[var(--accent)]/30 rounded-lg p-2 transition">
                        <input
                          type="checkbox"
                          checked={questionFormats.includes("AUTO_DETECT")}
                          onChange={() => handleFormatToggle("AUTO_DETECT")}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary-col)] focus:ring-[var(--primary-col)]"
                          disabled={selectedMode !== "IMPORT_EXISTING_QUESTIONS"}
                        />
                        <span className="text-sm text-primary-col">Auto Detect (Recommended)</span>
                      </label>
                      <div className="pl-6 space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-[var(--accent)]/30 rounded-lg p-2 transition">
                          <input
                            type="checkbox"
                            checked={questionFormats.includes("MULTIPLE_CHOICE")}
                            onChange={() => handleFormatToggle("MULTIPLE_CHOICE")}
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary-col)] focus:ring-[var(--primary-col)]"
                            disabled={isFormatDisabled("MULTIPLE_CHOICE")}
                          />
                          <span className="text-sm text-primary-col">Multiple Choice</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-[var(--accent)]/30 rounded-lg p-2 transition">
                          <input
                            type="checkbox"
                            checked={questionFormats.includes("TRUE_FALSE")}
                            onChange={() => handleFormatToggle("TRUE_FALSE")}
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary-col)] focus:ring-[var(--primary-col)]"
                            disabled={isFormatDisabled("TRUE_FALSE")}
                          />
                          <span className="text-sm text-primary-col">True / False</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-[var(--accent)]/30 rounded-lg p-2 transition">
                          <input
                            type="checkbox"
                            checked={questionFormats.includes("FILL_BLANK")}
                            onChange={() => handleFormatToggle("FILL_BLANK")}
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary-col)] focus:ring-[var(--primary-col)]"
                            disabled={isFormatDisabled("FILL_BLANK")}
                          />
                          <span className="text-sm text-primary-col">Fill in the Blank</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-[var(--accent)]/30 rounded-lg p-2 transition">
                          <input
                            type="checkbox"
                            checked={questionFormats.includes("SHORT_ANSWER")}
                            onChange={() => handleFormatToggle("SHORT_ANSWER")}
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary-col)] focus:ring-[var(--primary-col)]"
                            disabled={isFormatDisabled("SHORT_ANSWER")}
                          />
                          <span className="text-sm text-primary-col">Short Answer</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-col mt-2">
                    {questionFormats.includes("AUTO_DETECT")
                      ? "AI will automatically detect the original format of each question from the PDF."
                      : `Selected formats: ${questionFormats.map((f) => f.replace(/_/g, " ")).join(", ") || "None"}`}
                  </p>
                </div>
              )}

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
          {!defaultMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToModeSelection}
                className="text-sm text-muted-col hover:text-primary-col transition"
              >
                ← Back to mode selection
              </button>
            </div>
          )}

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
              disableUpload
                ? "border-dashed border-muted cursor-not-allowed opacity-60"
                : "border-dashed border-[var(--border)] hover:border-primary/50 cursor-pointer"
            }`}
            onClick={() => {
              if (disableUpload) {
                toast.error("Please select at least one skill before uploading a PDF.");
                return;
              }
              fileInputRef.current?.click();
            }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (disableUpload) {
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
              data-testid="pdf-file-input"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                // Reset the input so the user can re-select the same file later
                // (e.g. after a Retry or Generate Again). Without this, browsers
                // silently skip the onChange when the same file is picked twice.
                if (e.target) e.target.value = "";
                if (file) handleSelectFile(file);
              }}
            />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
              disableUpload ? "bg-muted" : "bg-primary/10"
            }`}>
              <Upload className={`w-8 h-8 ${disableUpload ? "text-muted-foreground" : "text-primary"}`} />
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
                if (disableUpload) {
                  toast.error("Please select at least one skill before uploading a PDF.");
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={disableUpload}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition ${
                disableUpload
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-hero text-white hover:opacity-90"
              }`}
            >
              Select PDF File
            </button>
            {disableUpload && (
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
              disabled={!selectedFile || isGenerating}
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
            <div className="flex flex-col gap-3">
              <div className="px-4 py-3 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left">{error}</span>
              </div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition flex items-center justify-center gap-2 self-start"
                  data-testid="ai-pdf-retry-button"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Generation
                </button>
              )}
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

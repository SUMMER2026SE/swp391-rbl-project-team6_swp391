/**
 * Mapping helpers for converting an {@link ImportedQuestion} (as
 * produced by `AiPdfImportWorkflow`) into the request payload expected
 * by the backend's TeacherQuestion creation endpoint.
 *
 * Extracted into its own module so the mapping can be exercised
 * directly by `tsx`-based tests (no React/DOM required).
 */

export type BackendDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface MappedBankRequest {
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
  questionType: string;
  difficulty: BackendDifficulty;
  explanation: string;
  level: string;
  skill: string;
  source: string;
}

export interface ImportedQuestionLike {
  type: string;
  content: string;
  difficulty?: string;
  explanation?: string;
  answers: Array<{ content?: string; isCorrect?: boolean }>;
  category?: string;
}

/**
 * Map a free-form category string to the canonical PascalCase form the
 * Question Bank UI expects (Vocabulary, Grammar, Reading, Listening).
 * Falls back to "Vocabulary" only when the value is genuinely missing.
 */
export function normalizeSkill(category: string | undefined | null): string {
  if (!category) return "Vocabulary";
  const lower = String(category).trim().toLowerCase();
  if (lower === "vocabulary") return "Vocabulary";
  if (lower === "grammar") return "Grammar";
  if (lower === "reading") return "Reading";
  if (lower === "writing") return "Writing";
  if (lower === "listening") return "Listening";
  return "Vocabulary";
}

/**
 * Convert an AI-produced question into the teacher-question-bank request
 * DTO. Preserves the AI-provided `type` verbatim so MULTIPLE_CHOICE,
 * TRUE_FALSE, FILL_BLANK and SHORT_ANSWER all flow through without
 * being silently coerced to MULTIPLE_CHOICE (the regression that
 * motivated this fix).
 *
 * For text-only questions (FILL_BLANK / SHORT_ANSWER) the backend
 * requires a non-empty `options` array (`@NotEmpty` on the DTO), so we
 * emit the actual answer text as the single option and put the same
 * text in `explanation` for the rendering layer. This is NOT a fake
 * multiple-choice option — it is the real answer reused to satisfy
 * the backend's schema constraint. MCQ and TRUE_FALSE keep their full
 * option list and correctAnswerIndex.
 */
export function mapImportedQuestionToBankRequest(
  q: ImportedQuestionLike,
  targetLevel: string,
): MappedBankRequest {
  const textOnly = q.type === "FILL_BLANK" || q.type === "SHORT_ANSWER";
  const correctIndex = q.answers.findIndex((a) => a && a.isCorrect);

  const difficulty = (q.difficulty || "MEDIUM").toUpperCase() as BackendDifficulty;

  if (textOnly) {
    const text = (q.answers[0]?.content ?? "").trim();
    return {
      prompt: q.content,
      options: text ? [text] : [""],
      correctAnswerIndex: 0,
      questionType: q.type,
      difficulty,
      explanation: text,
      level: targetLevel,
      skill: normalizeSkill(q.category),
      source: "EXAM",
    };
  }

  const options = q.answers.map((a) => a?.content ?? "");
  const paddedOptions = options.length >= 2 ? options : [...options, "", ""].slice(0, 2);

  return {
    prompt: q.content,
    options: paddedOptions,
    correctAnswerIndex: correctIndex >= 0 ? correctIndex : 0,
    questionType: q.type || "MULTIPLE_CHOICE",
    difficulty,
    explanation: q.explanation || "",
    level: targetLevel,
    skill: normalizeSkill(q.category),
    source: "EXAM",
  };
}

/**
 * Validate that all questions have a marked correct answer. Used by the
 * Exam AI flow before saving.
 *
 * For text-only questions (FILL_BLANK / SHORT_ANSWER) we additionally
 * require the answer text to be non-blank — an empty string answer is
 * functionally the same as "no correct answer".
 */
export function findUnresolvedQuestions(questions: ImportedQuestionLike[]): ImportedQuestionLike[] {
  return questions.filter((q) => {
    const correctIndex = q.answers.findIndex((a) => a && a.isCorrect);
    if (correctIndex === -1) return true;
    const textOnly = q.type === "FILL_BLANK" || q.type === "SHORT_ANSWER";
    if (textOnly) {
      const text = (q.answers[correctIndex]?.content ?? "").trim();
      return text === "";
    }
    return false;
  });
}

/**
 * Mapping helpers for converting between AI-generated question formats
 * and the Teacher Question Bank / Homework DTOs.
 *
 * This module is extracted so the mapping can be reused across
 * AiHomeworkGenerate and the QuestionBankHW flow.
 */

import type { BuilderQuestion, QuestionAnswerOption } from "@/types/question";
import type {
  TeacherQuestionResponse,
} from "@/lib/api/teacherQuestions";
import type { BatchCreateQuestionsRequest } from "@/lib/api/teacherQuestions";

// ─── Question type validation ───────────────────────────────────────────────────

/** All question types that the backend question bank accepts. */
export const ALLOWED_QUESTION_TYPES = new Set([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_BLANK",
  "SHORT_ANSWER",
  "TRANSLATION",
  "SENTENCE_WRITING",
  "ERROR_CORRECTION",
  "MATCHING",
] as const);

export type AllowedQuestionType = typeof ALLOWED_QUESTION_TYPES extends Set<infer T> ? T : never;

/**
 * Normalize and validate an AI-generated question type before persisting to the
 * question bank. Throws a descriptive error if the type is missing or unrecognised
 * so that bad data fails loudly instead of being silently saved as MULTIPLE_CHOICE.
 *
 * @param rawType - the `type` field from the AI-generated question DTO
 * @returns the validated, upper-cased question type string
 * @throws Error if rawType is absent or not in the allowed set
 */
export function normalizeImportedQuestionType(rawType: string | undefined | null): AllowedQuestionType {
  if (!rawType || rawType.trim() === "") {
    throw new Error(
      `Cannot persist question: question type is missing. ` +
      `Expected one of: ${[...ALLOWED_QUESTION_TYPES].join(", ")}.`
    );
  }
  const upper = rawType.trim().toUpperCase() as AllowedQuestionType;
  if (!ALLOWED_QUESTION_TYPES.has(upper)) {
    throw new Error(
      `Cannot persist question: unrecognised question type "${rawType}". ` +
      `Expected one of: ${[...ALLOWED_QUESTION_TYPES].join(", ")}.`
    );
  }
  return upper;
}

// ─── AI response → BuilderQuestion ─────────────────────────────────────────────

/** Convert an AI-generated question response to a BuilderQuestion */
export function mapAiQuestionToBuilderQuestion(
  q: {
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
  },
  index: number
): BuilderQuestion {
  const correctIdx = q.answers?.findIndex((a) => a.isCorrect) ?? 0;
  const questionType = (q.type as BuilderQuestion["type"]) || "MULTIPLE_CHOICE";

  return {
    id: `ai-q-${Date.now()}-${index}`,
    type: questionType,
    content: q.content || "",
    difficulty:
      (q.difficulty?.toUpperCase() as BuilderQuestion["difficulty"]) || "MEDIUM",
    explanation: q.explanation,
    skill: (q.category as BuilderQuestion["skill"]) || "Vocabulary",
    points: 2,
    answers: (q.answers || []).map((a, i): QuestionAnswerOption => ({
      content: a.content || "",
      isCorrect: i === correctIdx,
    })),
    needsReview: (() => {
      const type = (q.type || "MULTIPLE_CHOICE").toUpperCase();
      if (type === "TRANSLATION") return !q.translationMetadata?.referenceAnswer;
      if (type === "SENTENCE_WRITING") return !q.sentenceWritingMetadata?.referenceAnswer;
      if (type === "ERROR_CORRECTION") return !q.errorCorrectionMetadata?.correctedText;
      if (type === "MATCHING") return !q.matchingMetadata?.correctPairs || q.matchingMetadata.correctPairs.length === 0;
      return !q.answers || q.answers.length === 0;
    })(),
    translationMetadata: q.translationMetadata?.direction
      ? {
          direction: (q.translationMetadata.direction as "JA_TO_VI" | "VI_TO_JA") ||
            "JA_TO_VI",
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
}

// ─── AI response → BuilderQuestion ─────────────────────────────────────────────

type AiQuestionInput = {
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
};

/** Map a list of AI questions to BuilderQuestions */
export function mapAiQuestionsToBuilderQuestions(
  questions: AiQuestionInput[]
): BuilderQuestion[] {
  return questions.map((q, idx) => mapAiQuestionToBuilderQuestion(q, idx));
}

// ─── BuilderQuestion → Backend request ─────────────────────────────────────────

/** Convert a BuilderQuestion to the backend CreateTeacherQuestionRequest shape */
export function mapBuilderQuestionToRequest(
  q: BuilderQuestion,
  level: string,
  source = "HOMEWORK"
) {
  const correctIdx = q.answers?.findIndex((a) => a.isCorrect) ?? 0;
  return {
    prompt: q.content || "",
    options: (q.answers || []).map((a) => a.content || ""),
    correctAnswerIndex: correctIdx >= 0 ? correctIdx : 0,
    points: q.points ?? 2,
    questionType: q.type || "MULTIPLE_CHOICE",
    difficulty: (q.difficulty || "MEDIUM").toUpperCase(),
    explanation: q.explanation || "",
    level,
    source,
    skill: (q.skill || "Vocabulary").toUpperCase(),
    translationMetadata: q.translationMetadata as unknown as Record<string, unknown>,
    sentenceWritingMetadata: q.sentenceWritingMetadata as unknown as Record<string, unknown>,
    errorCorrectionMetadata: q.errorCorrectionMetadata as unknown as Record<string, unknown>,
    matchingMetadata: q.matchingMetadata as unknown as Record<string, unknown>,
  };
}

// ─── TeacherQuestionResponse → BuilderQuestion ───────────────────────────────────

/**
 * Map a TeacherQuestionResponse (from Question Bank randomize/generate preview)
 * to a BuilderQuestion for use in the QuestionEditor.
 * Includes format-specific metadata when available.
 */
export function mapTeacherQuestionResponseToBuilderQuestion(
  q: TeacherQuestionResponse,
  index: number
): BuilderQuestion {
  const answers: QuestionAnswerOption[] = (q.options || []).map((opt, i) => ({
    content: opt,
    isCorrect: i === q.correctAnswerIndex,
  }));

  return {
    id: `bank-q-${q.id || index}`,
    type: (q.questionType as BuilderQuestion["type"]) || "MULTIPLE_CHOICE",
    content: q.prompt || "",
    difficulty: (q.difficulty?.toUpperCase() as BuilderQuestion["difficulty"]) || "MEDIUM",
    explanation: q.explanation,
    skill: (q.skill as BuilderQuestion["skill"]) || "Vocabulary",
    points: q.points ?? 2,
    answers,
    needsReview: false,
    // Restore format-specific metadata from the response
    translationMetadata: q.translationMetadata as BuilderQuestion["translationMetadata"],
    sentenceWritingMetadata: q.sentenceWritingMetadata as BuilderQuestion["sentenceWritingMetadata"],
    errorCorrectionMetadata: q.errorCorrectionMetadata as BuilderQuestion["errorCorrectionMetadata"],
    matchingMetadata: q.matchingMetadata as BuilderQuestion["matchingMetadata"],
  };
}

/** Map a list of TeacherQuestionResponse to BuilderQuestions */
export function mapTeacherQuestionResponsesToBuilderQuestions(
  questions: TeacherQuestionResponse[]
): BuilderQuestion[] {
  return questions.map((q, idx) =>
    mapTeacherQuestionResponseToBuilderQuestion(q, idx)
  );
}

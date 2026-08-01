// Shared types for Question Bank
// These types are used across Question Bank components

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

// Question formats (how questions are presented)
export type QuestionFormat =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "MATCHING"
  | "TRANSLATION"
  | "SENTENCE_WRITING"
  | "ERROR_CORRECTION";

// Question Bank skills (only these 4 skills are supported by the Question Bank)
// LISTENING and KANJI are excluded - other modules may use them but NOT the Question Bank
export type QuestionSkill =
  | "Vocabulary"
  | "Grammar"
  | "Reading"
  | "Writing";

// QuestionType is kept for backward compatibility with existing code
// For Question Bank, use QuestionSkill instead
export type QuestionType = QuestionSkill | "Listening";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Lesson {
  id: number;
  lessonNumber: number;
  lessonName: string;
  status: "Active" | "Draft";
  questionCount: number;
  createdAt: string;
}

// Format-specific metadata interfaces
export interface TranslationMetadata {
  direction: "JA_TO_VI" | "VI_TO_JA";
  sourceText: string;
  referenceAnswer: string;
  acceptedAnswers?: string[];
  sourceLanguage: string;
  targetLanguage: string;
}

export interface SentenceWritingMetadata {
  requiredVocabulary?: string[];
  requiredGrammar?: string[];
  referenceAnswer?: string;
  acceptedAnswers?: string[];
  rubric?: string;
  prompt: string;
}

export interface ErrorCorrectionMetadata {
  incorrectText: string;
  correctedText: string;
  explanation: string;
  errorType?: string;
}

export interface MatchingPair {
  leftIndex: number;
  rightIndex: number;
}

export interface MatchingMetadata {
  leftItems: string[];
  rightItems: string[];
  correctPairs: MatchingPair[];
}

// Base question interface
export interface QuestionBase {
  id: string;
  level: JLPTLevel;
  lesson: number;
  type: QuestionType; // Allow Listening for compatibility
  format: QuestionFormat; // Question presentation format (MULTIPLE_CHOICE, etc.)
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  createdAt: string;
  points?: number;
  // Format-specific metadata
  translationMetadata?: TranslationMetadata;
  sentenceWritingMetadata?: SentenceWritingMetadata;
  errorCorrectionMetadata?: ErrorCorrectionMetadata;
  matchingMetadata?: MatchingMetadata;
}

// Listening-specific audio fields (kept for compatibility)
export interface ListeningAudio {
  audioUrl: string;
  audioFileName: string;
  audioDuration: number; // in seconds
}

// Listening question extends base with audio (kept for compatibility)
export interface ListeningQuestion extends QuestionBase {
  type: "Listening";
  audio: ListeningAudio;
}

// Standard question (Vocabulary, Grammar, Reading, Writing)
export interface StandardQuestion extends QuestionBase {
  type: QuestionSkill;
}

// Union type for all questions
export type Question = StandardQuestion | ListeningQuestion;

// Audio library item (NOT used in Question Bank)
export interface AudioItem {
  id: string;
  fileName: string;
  url: string;
  duration: number; // in seconds
  size: number; // in bytes
  uploadedAt: string;
}

// Format display labels

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Skill-Format compatibility matrix for Question Bank
// Only VOCABULARY, GRAMMAR, READING, WRITING are supported
export const SKILL_FORMAT_COMPATIBILITY: Record<QuestionSkill, QuestionFormat[]> = {
  Vocabulary: ["MULTIPLE_CHOICE", "FILL_BLANK", "SHORT_ANSWER", "MATCHING", "TRANSLATION", "SENTENCE_WRITING"],
  Grammar: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER", "SENTENCE_WRITING", "ERROR_CORRECTION", "TRANSLATION"],
  Reading: ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "FILL_BLANK", "TRANSLATION"],
  Writing: ["TRANSLATION", "SENTENCE_WRITING", "SHORT_ANSWER", "ERROR_CORRECTION"],
};

// Get compatible formats for selected skills (union of all selected)
export function getCompatibleFormats(skills: QuestionSkill[]): QuestionFormat[] {
  const formatSet = new Set<QuestionFormat>();
  for (const skill of skills) {
    for (const format of SKILL_FORMAT_COMPATIBILITY[skill] || []) {
      formatSet.add(format);
    }
  }
  return Array.from(formatSet);
}

// Format display labels
export const FORMAT_LABELS: Record<QuestionFormat, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE: "True / False",
  FILL_BLANK: "Fill in the Blank",
  SHORT_ANSWER: "Short Answer",
  MATCHING: "Matching",
  TRANSLATION: "Translation",
  SENTENCE_WRITING: "Sentence Writing",
  ERROR_CORRECTION: "Error Correction",
};

// Skill display labels
export const SKILL_LABELS: Record<QuestionSkill, string> = {
  Vocabulary: "Vocabulary",
  Grammar: "Grammar",
  Reading: "Reading",
  Writing: "Writing",
};

// Backend skill name mapping (frontend display -> backend enum)
export const SKILL_TO_BACKEND: Record<QuestionSkill, string> = {
  Vocabulary: "VOCABULARY",
  Grammar: "GRAMMAR",
  Reading: "READING",
  Writing: "WRITING",
};

// Backend format name mapping (frontend enum -> backend enum)
export const FORMAT_TO_BACKEND: Record<QuestionFormat, string> = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  FILL_BLANK: "FILL_BLANK",
  SHORT_ANSWER: "SHORT_ANSWER",
  MATCHING: "MATCHING",
  TRANSLATION: "TRANSLATION",
  SENTENCE_WRITING: "SENTENCE_WRITING",
  ERROR_CORRECTION: "ERROR_CORRECTION",
};

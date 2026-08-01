export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "MATCHING"
  | "TRANSLATION"
  | "SENTENCE_WRITING"
  | "ERROR_CORRECTION";

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

// Question Bank skills (only these 4 skills are supported)
// LISTENING and KANJI are excluded from Question Bank
export type QuestionSkill =
  | "Vocabulary"
  | "Grammar"
  | "Reading"
  | "Writing";

export interface QuestionAnswerOption {
  content: string;
  isCorrect: boolean;
}

// Format-specific metadata for new question types
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

export interface BuilderQuestion {
  id: string;
  type: QuestionType;
  content: string;
  difficulty: QuestionDifficulty;
  explanation?: string;
  answers: QuestionAnswerOption[];
  skill?: QuestionSkill;
  points?: number;
  imageUrl?: string;
  needsReview?: boolean;
  // Format-specific metadata
  translationMetadata?: TranslationMetadata;
  sentenceWritingMetadata?: SentenceWritingMetadata;
  errorCorrectionMetadata?: ErrorCorrectionMetadata;
  matchingMetadata?: MatchingMetadata;
}

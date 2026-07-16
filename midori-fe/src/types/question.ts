export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "MATCHING";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionSkill = "Vocabulary" | "Grammar" | "Reading" | "Listening" | "Kanji";

export interface QuestionAnswerOption {
  content: string;
  isCorrect: boolean;
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
}

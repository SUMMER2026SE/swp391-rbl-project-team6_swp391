// ─── Content Library Types ────────────────────────────────────────────────────

// JLPT Level
export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

// ─── Grammar ──────────────────────────────────────────────────────────────────
export interface GrammarItem {
  id: string;
  grammarStructure: string; // JLPT pattern like "～は～です"
  meaning: string;
  exampleSentences: {
    sentence: string;
    meaning: string;
  }[];
  jlptLevel: JLPTLevel;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Vocabulary ──────────────────────────────────────────────────────────────
export interface VocabularyItem {
  id: string;
  word: string; // Kanji
  hiragana: string;
  meaning: string;
  exampleSentence: {
    sentence: string;
    meaning: string;
  };
  lessonId: string;
  jlptLevel: JLPTLevel;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Listening ────────────────────────────────────────────────────────────────
export interface ListeningQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ListeningItem {
  id: string;
  title: string;
  audioUrl: string;
  transcript: string;
  questions: ListeningQuestion[];
  jlptLevel: JLPTLevel;
  tags: string[];
  duration: number; // in seconds
  createdAt: string;
  updatedAt: string;
}

// ─── Reading ─────────────────────────────────────────────────────────────────
export interface ReadingQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ReadingItem {
  id: string;
  title: string;
  passageText: string;
  comprehensionQuestions: ReadingQuestion[];
  jlptLevel: JLPTLevel;
  tags: string[];
  estimatedTime: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

// ─── Shadowing ───────────────────────────────────────────────────────────────
export interface ShadowingSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
  pitchAccent?: string;
}

export interface ShadowingItem {
  id: string;
  title: string;
  audioUrl: string;
  script: ShadowingSegment[];
  practiceSegments: {
    segmentId: string;
    repetitions: number;
    speed: number; // 0.5, 0.75, 1.0
  }[];
  jlptLevel: JLPTLevel;
  tags: string[];
  duration: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Flashcard ───────────────────────────────────────────────────────────────
export interface Flashcard {
  id: string;
  front: string; // word / question
  back: string; // meaning / answer
  jlptLevel: JLPTLevel;
  tags: string[]; // grammar, vocab, reading support, etc.
  audioUrl?: string;
  exampleSentence?: {
    sentence: string;
    meaning: string;
  };
  difficulty: "easy" | "medium" | "hard";
  createdAt: string;
  updatedAt: string;
}

// ─── Content Library State ────────────────────────────────────────────────────
export interface ContentLibraryState {
  grammar: GrammarItem[];
  vocabulary: VocabularyItem[];
  listening: ListeningItem[];
  reading: ReadingItem[];
  shadowing: ShadowingItem[];
  flashcards: Flashcard[];
}

// ─── Filter Types ────────────────────────────────────────────────────────────
export interface ContentFilter {
  level?: JLPTLevel;
  search?: string;
  tags?: string[];
}

// ─── API Response Types ────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

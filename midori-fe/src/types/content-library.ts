export interface AdminReadingLesson {
  id: string;
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  passage: string;
  vietnameseTranslation: string | null;
  estimatedMinutes: number | null;
  difficulty: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  questions: ReadingQuestion[];
  passages?: AdminReadingPassage[];
}

export interface AdminReadingPassage {
  id: string;
  title: string;
  passage: string;
  translationVietnamese: string;
  questions: ReadingQuestion[];
}

export interface ReadingQuestion {
  id: string;
  readingPassageId?: string;
  question: string;
  options: string[];
  correctAnswer: number | string;
  explanation?: string;
}

// ─── Listening Types (matching backend ListeningLesson → ListeningItem) ───────

export interface AdminListeningLesson {
  id: string;
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  transcript: string | null;
  estimatedMinutes: number | null;
  difficulty: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  listeningItems: ListeningItem[];
}

export interface ListeningItem {
  id: string;
  questionOrder: number;
  audioUrl: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
}

export interface ListeningLessonRequest {
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description?: string;
  transcript?: string;
  estimatedMinutes?: number;
  difficulty?: string;
  isActive?: boolean;
}

export interface ListeningItemRequest {
  id?: string;
  questionOrder: number;
  audioUrl: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string | null;
}

export interface ListeningLessonWithItemsRequest {
  lesson: ListeningLessonRequest;
  items: ListeningItemRequest[];
}

// ─── Vocabulary Types (matching backend VocabularyLesson → VocabularyItem) ───────

export interface AdminVocabularyLesson {
  id: string;
  lessonId: string | null;
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  estimatedMinutes: number | null;
  difficulty: string | null;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  items: AdminVocabularyItem[];
}

export interface AdminVocabularyItem {
  id: string;
  itemOrder: number;
  japanese: string;
  furigana: string | null;
  romaji: string | null;
  meaning: string;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  partOfSpeech: string | null;
}
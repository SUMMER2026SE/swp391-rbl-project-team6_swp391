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
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// ─── Listening Types (matching backend ListeningLesson → ListeningQuestion) ───────

export interface AdminListeningLesson {
  id: string;
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  audioUrl: string | null;
  transcript: string | null;
  estimatedMinutes: number | null;
  difficulty: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  questions: ListeningQuestion[];
}

export interface ListeningQuestion {
  id: string;
  questionOrder: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  questionType: string;
}

export interface ListeningLessonRequest {
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description?: string;
  audioUrl?: string;
  transcript?: string;
  estimatedMinutes?: number;
  difficulty?: string;
  isActive?: boolean;
}

export interface ListeningQuestionRequest {
  questionOrder: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
  questionType?: string;
}

export interface ListeningLessonWithQuestionsRequest {
  lesson: ListeningLessonRequest;
  questions: ListeningQuestionRequest[];
}

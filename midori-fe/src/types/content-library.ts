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

import { api } from "./client";

// ============================================================
// TypeScript Interfaces for Reading API
// ============================================================

export interface ReadingLessonResponse {
  id: string;
  lessonId: string | null;
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
}

export interface ReadingPassageResponse {
  id: string;
  readingLessonId: string;
  title?: string | null;
  passageOrder: number;
  passage: string;
  vietnameseTranslation: string | null;
  /**
   * Questions belonging to this passage. The student endpoint may or may not
   * populate this field depending on the underlying data, so consumers must
   * treat it as optional and fall back to the lesson-level `questions` list.
   */
  questions?: ReadingQuestionResponse[];
}

export interface ReadingQuestionResponse {
  id: string;
  readingLessonId: string;
  /**
   * Populated by the backend mapper on `toQuestionResponse(...)`. Legacy data
   * (questions created before passages existed) may have this set to null.
   */
  readingPassageId?: string | null;
  questionOrder: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingDetailResponse extends ReadingLessonResponse {
  passages: ReadingPassageResponse[];
  questions: ReadingQuestionResponse[];
}

export interface ReadingLessonRequest {
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description?: string;
  passage: string;
  vietnameseTranslation?: string;
  estimatedMinutes?: number;
  difficulty?: string;
  isActive?: boolean;
}

export interface ReadingPassageRequest {
  id?: string;
  passageOrder?: number;
  passage: string;
  vietnameseTranslation?: string;
  questions?: ReadingQuestionRequest[];
}

export interface ReadingQuestionRequest {
  id?: string;
  questionOrder: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
}

export interface ReadingLessonWithQuestionsRequest {
  lesson: ReadingLessonRequest;
  passages?: ReadingPassageRequest[];
}

// ============================================================
// Student Reading – Submit (server-graded)
// ============================================================

export interface ReadingSubmitAnswer {
  questionId: string;
  selectedAnswer: string | null;
}

export interface ReadingSubmitRequest {
  passageId?: string | null;
  answers: ReadingSubmitAnswer[];
}

export interface ReadingSubmitAnswerResult {
  questionId: string;
  questionOrder: number | null;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  /** Letter the student picked (A/B/C/D) or null if skipped. */
  userAnswer: string | null;
  /** Letter of the correct option. */
  correctAnswer: string | null;
  userAnswerText: string | null;
  correctAnswerText: string | null;
  isCorrect: boolean;
  explanation: string | null;
}

export interface ReadingSubmitResponse {
  readingLessonId: string;
  passageId: string | null;
  /** Legacy scalar – same as percentage rounded down. */
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  /** 0–100, one decimal place. */
  percentage: number;
  answers: ReadingSubmitAnswerResult[];
  submittedAt: string;
}

// ============================================================
// Student Reading API
// ============================================================

export const studentReadingApi = {
  /**
   * GET /api/student/reading
   * Lists active reading lessons.
   * Supports optional query param: level.
   */
  getReadingLessons: async (params?: { level?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    const qs = searchParams.toString();
    return api.get<ReadingLessonResponse[]>(`/student/reading${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /api/student/reading/{id}
   * Returns active reading lesson detail with questions.
   */
  getReadingLesson: async (id: string) => {
    return api.get<ReadingDetailResponse>(`/student/reading/${id}`);
  },

  /**
   * GET /api/student/reading/level/{jlptLevel}
   * Lists active reading lessons filtered by JLPT level.
   */
  getReadingLessonsByLevel: async (level: string) => {
    return api.get<ReadingLessonResponse[]>(`/student/reading/level/${level}`);
  },

  /**
   * POST /api/student/reading/{id}/submit
   * Grades a Reading attempt on the server and returns the per-question breakdown.
   */
  submitReadingAnswers: (lessonId: string, payload: ReadingSubmitRequest) =>
    api.post<ReadingSubmitResponse>(`/student/reading/${lessonId}/submit`, payload),
};

// ============================================================
// Admin Reading API
// ============================================================

export const adminReadingApi = {
  /**
   * GET /api/admin/reading
   * Lists all reading lessons.
   * Supports optional query params: level, difficulty, isActive.
   */
  getAdminReadingLessons: async (params?: {
    level?: string;
    difficulty?: string;
    isActive?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.difficulty) searchParams.set("difficulty", params.difficulty);
    if (params?.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
    const qs = searchParams.toString();
    return api.get<ReadingLessonResponse[]>(`/admin/reading${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /api/admin/reading/{id}
   * Returns reading lesson detail with questions.
   */
  getAdminReadingLesson: async (id: string) => {
    return api.get<ReadingDetailResponse>(`/admin/reading/${id}`);
  },

  /**
   * POST /api/admin/reading
   * Creates a new reading lesson with questions.
   */
  createReadingLesson: async (data: ReadingLessonWithQuestionsRequest) => {
    return api.post<ReadingDetailResponse>("/admin/reading", data);
  },

  /**
   * PUT /api/admin/reading/{id}
   * Updates an existing reading lesson with questions.
   */
  updateReadingLesson: async (id: string, data: ReadingLessonWithQuestionsRequest) => {
    return api.put<ReadingDetailResponse>(`/admin/reading/${id}`, data);
  },

  /**
   * DELETE /api/admin/reading/{id}
   * Deletes a reading lesson.
   */
  deleteReadingLesson: (id: string) => api.delete<void>(`/admin/reading/${id}`),

  /**
   * PATCH /api/admin/reading/{id}/publish
   * Publishes a reading lesson.
   */
  publishReadingLesson: (id: string) =>
    api.patch<ReadingLessonResponse>(`/admin/reading/${id}/publish`),

  /**
   * PATCH /api/admin/reading/{id}/unpublish
   * Unpublishes a reading lesson.
   */
  unpublishReadingLesson: (id: string) =>
    api.patch<ReadingLessonResponse>(`/admin/reading/${id}/unpublish`),
};

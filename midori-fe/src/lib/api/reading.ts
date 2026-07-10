import { api } from "./client";

// ============================================================
// TypeScript Interfaces for Reading API
// ============================================================

export interface ReadingLessonResponse {
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
}

export interface ReadingPassageResponse {
  id: string;
  readingLessonId: string;
  passageOrder: number;
  passage: string;
  vietnameseTranslation: string | null;
}

export interface ReadingQuestionResponse {
  id: string;
  readingLessonId: string;
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
  passageOrder?: number;
  passage: string;
  vietnameseTranslation?: string;
}

export interface ReadingQuestionRequest {
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
  questions: ReadingQuestionRequest[];
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

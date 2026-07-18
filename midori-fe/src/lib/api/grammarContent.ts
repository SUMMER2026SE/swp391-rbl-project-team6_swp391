import { api } from "./client";

// ============================================================
// TypeScript Interfaces for Grammar API
// Mirrors the Reading API structure
// ============================================================

export interface GrammarLessonResponse {
  id: string;
  lessonId: string | null;
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  estimatedMinutes: number | null;
  difficulty: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GrammarExampleResponse {
  id: string;
  grammarContentId: string;
  exampleOrder: number;
  japanese: string;
  vietnameseMeaning: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrammarContentResponse {
  id: string;
  grammarLessonId: string;
  contentOrder: number;
  pattern: string | null;
  meaning: string | null;
  structure: string | null;
  usage: string | null;
  examples: GrammarExampleResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface GrammarDetailResponse extends GrammarLessonResponse {
  contents: GrammarContentResponse[];
}

export interface GrammarLessonRequest {
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  difficulty?: string;
  isActive?: boolean;
}

export interface GrammarExampleRequest {
  id?: string;
  exampleOrder: number;
  japanese: string;
  vietnameseMeaning?: string;
}

export interface GrammarContentRequest {
  id?: string;
  contentOrder: number;
  pattern?: string;
  meaning?: string;
  structure?: string;
  usage?: string;
  examples?: GrammarExampleRequest[];
}

export interface GrammarLessonWithContentsRequest {
  lesson: GrammarLessonRequest;
  contents?: GrammarContentRequest[];
}

// ============================================================
// Student Grammar API
// ============================================================

export const studentGrammarApi = {
  /**
   * GET /api/student/grammar
   * Lists active grammar lessons.
   * Supports optional query param: level.
   */
  getGrammarLessons: async (params?: { level?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    const qs = searchParams.toString();
    return api.get<GrammarLessonResponse[]>(`/student/grammar${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /api/student/grammar/{id}
   * Returns active grammar lesson detail with contents (each with examples).
   */
  getGrammarLesson: async (id: string) => {
    return api.get<GrammarDetailResponse>(`/student/grammar/${id}`);
  },

  /**
   * GET /api/student/grammar/level/{jlptLevel}
   * Lists active grammar lessons filtered by JLPT level.
   */
  getGrammarLessonsByLevel: async (level: string) => {
    return api.get<GrammarLessonResponse[]>(`/student/grammar/level/${level}`);
  },
};

// ============================================================
// Admin Grammar API
// ============================================================

export const adminGrammarApi = {
  /**
   * GET /api/admin/grammar
   * Lists all grammar lessons.
   * Supports optional query params: level, difficulty, isActive.
   */
  getAdminGrammarLessons: async (params?: {
    level?: string;
    difficulty?: string;
    isActive?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.difficulty) searchParams.set("difficulty", params.difficulty);
    if (params?.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
    const qs = searchParams.toString();
    return api.get<GrammarLessonResponse[]>(`/admin/grammar${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /api/admin/grammar/{id}
   * Returns grammar lesson detail with contents (each with examples).
   */
  getAdminGrammarLesson: async (id: string) => {
    return api.get<GrammarDetailResponse>(`/admin/grammar/${id}`);
  },

  /**
   * POST /api/admin/grammar
   * Creates a new grammar lesson with multiple contents and nested examples.
   */
  createGrammarLesson: async (data: GrammarLessonWithContentsRequest) => {
    return api.post<GrammarDetailResponse>("/admin/grammar", data);
  },

  /**
   * PUT /api/admin/grammar/{id}
   * Updates an existing grammar lesson with multiple contents and nested examples.
   */
  updateGrammarLesson: async (id: string, data: GrammarLessonWithContentsRequest) => {
    return api.put<GrammarDetailResponse>(`/admin/grammar/${id}`, data);
  },

  /**
   * DELETE /api/admin/grammar/{id}
   * Deletes a grammar lesson.
   */
  deleteGrammarLesson: (id: string) => api.delete<void>(`/admin/grammar/${id}`),

  /**
   * PATCH /api/admin/grammar/{id}/publish
   * Publishes a grammar lesson.
   */
  publishGrammarLesson: (id: string) =>
    api.patch<GrammarLessonResponse>(`/admin/grammar/${id}/publish`),

  /**
   * PATCH /api/admin/grammar/{id}/unpublish
   * Unpublishes a grammar lesson.
   */
  unpublishGrammarLesson: (id: string) =>
    api.patch<GrammarLessonResponse>(`/admin/grammar/${id}/unpublish`),
};
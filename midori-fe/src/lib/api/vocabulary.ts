import { api } from "./client";

// ============================================================
// TypeScript Interfaces for Vocabulary API
// Mirrors the Reading API structure
// ============================================================

export interface VocabularyLessonResponse {
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

export interface VocabularyItemResponse {
  id: string;
  vocabularyLessonId: string;
  itemOrder: number;
  japanese: string;
  furigana: string | null;
  romaji: string | null;
  meaning: string;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  partOfSpeech: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyDetailResponse extends VocabularyLessonResponse {
  items: VocabularyItemResponse[];
}

export interface VocabularyLessonRequest {
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  difficulty?: string;
  isActive?: boolean;
}

export interface VocabularyItemRequest {
  itemOrder: number;
  japanese: string;
  furigana?: string;
  romaji?: string;
  meaning: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  partOfSpeech?: string;
}

export interface VocabularyLessonWithItemsRequest {
  lesson: VocabularyLessonRequest;
  items?: VocabularyItemRequest[];
}

// ============================================================
// Student Vocabulary API
// ============================================================

export const studentVocabularyApi = {
  /**
   * GET /api/student/vocabulary
   * Lists active vocabulary lessons.
   * Supports optional query param: level.
   */
  getVocabularyLessons: async (params?: { level?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    const qs = searchParams.toString();
    return api.get<VocabularyLessonResponse[]>(`/student/vocabulary${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /api/student/vocabulary/{id}
   * Returns active vocabulary lesson detail with items.
   */
  getVocabularyLesson: async (id: string) => {
    return api.get<VocabularyDetailResponse>(`/student/vocabulary/${id}`);
  },

  /**
   * GET /api/student/vocabulary/level/{jlptLevel}
   * Lists active vocabulary lessons filtered by JLPT level.
   */
  getVocabularyLessonsByLevel: async (level: string) => {
    return api.get<VocabularyLessonResponse[]>(`/student/vocabulary/level/${level}`);
  },
};

// ============================================================
// Admin Vocabulary API
// ============================================================

export const adminVocabularyApi = {
  /**
   * GET /api/admin/vocabulary
   * Lists all vocabulary lessons.
   * Supports optional query params: level, difficulty, isActive.
   */
  getAdminVocabularyLessons: async (params?: {
    level?: string;
    difficulty?: string;
    isActive?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.difficulty) searchParams.set("difficulty", params.difficulty);
    if (params?.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
    const qs = searchParams.toString();
    return api.get<VocabularyLessonResponse[]>(`/admin/vocabulary${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /api/admin/vocabulary/{id}
   * Returns vocabulary lesson detail with items.
   */
  getAdminVocabularyLesson: async (id: string) => {
    return api.get<VocabularyDetailResponse>(`/admin/vocabulary/${id}`);
  },

  /**
   * POST /api/admin/vocabulary
   * Creates a new vocabulary lesson with multiple items.
   */
  createVocabularyLesson: async (data: VocabularyLessonWithItemsRequest) => {
    return api.post<VocabularyDetailResponse>("/admin/vocabulary", data);
  },

  /**
   * PUT /api/admin/vocabulary/{id}
   * Updates an existing vocabulary lesson with multiple items.
   */
  updateVocabularyLesson: async (id: string, data: VocabularyLessonWithItemsRequest) => {
    return api.put<VocabularyDetailResponse>(`/admin/vocabulary/${id}`, data);
  },

  /**
   * DELETE /api/admin/vocabulary/{id}
   * Deletes a vocabulary lesson.
   */
  deleteVocabularyLesson: (id: string) => api.delete<void>(`/admin/vocabulary/${id}`),

  /**
   * PATCH /api/admin/vocabulary/{id}/publish
   * Publishes a vocabulary lesson.
   */
  publishVocabularyLesson: (id: string) =>
    api.patch<VocabularyLessonResponse>(`/admin/vocabulary/${id}/publish`),

  /**
   * PATCH /api/admin/vocabulary/{id}/unpublish
   * Unpublishes a vocabulary lesson.
   */
  unpublishVocabularyLesson: (id: string) =>
    api.patch<VocabularyLessonResponse>(`/admin/vocabulary/${id}/unpublish`),
};
import { api } from "./client";

// ─── Lesson Types ─────────────────────────────────────────────────────────────

export interface VocabularyLessonResponse {
  id: string;
  title: string;
  description?: string;
  level?: string;
  topic?: string;
  estimatedMinutes?: number;
  wordCount: number;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyWordResponse {
  id: string;
  lessonId: string;
  word: string;
  furigana?: string;
  romaji?: string;
  meaning: string;
  exampleJapanese?: string;
  exampleMeaning?: string;
  audioUrl?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyLessonDetailResponse extends VocabularyLessonResponse {
  words: VocabularyWordResponse[];
}

export interface VocabularyLessonCreateRequest {
  title: string;
  description?: string;
  level: string;
  topic?: string;
  estimatedMinutes?: number;
  isPublished?: boolean;
}

export interface VocabularyLessonUpdateRequest {
  title?: string;
  description?: string;
  level?: string;
  topic?: string;
  estimatedMinutes?: number;
  isPublished?: boolean;
}

export interface VocabularyWordCreateRequest {
  word: string;
  furigana?: string;
  romaji?: string;
  meaning: string;
  exampleJapanese?: string;
  exampleMeaning?: string;
  audioUrl?: string;
  displayOrder?: number;
}

export interface VocabularyWordUpdateRequest {
  word?: string;
  furigana?: string;
  romaji?: string;
  meaning?: string;
  exampleJapanese?: string;
  exampleMeaning?: string;
  audioUrl?: string;
  displayOrder?: number;
}

export interface LessonListParams {
  level?: string;
  topic?: string;
  search?: string;
}

// ─── Lesson API ────────────────────────────────────────────────────────────────

export const teacherVocabularyApi = {
  /**
   * GET /api/teacher/vocabulary/lessons
   * Lists lessons for the authenticated teacher.
   * Supports optional query params: level, topic, search.
   */
  getTeacherLessons: (params?: LessonListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.topic) searchParams.set("topic", params.topic);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    return api.get<VocabularyLessonResponse[]>(
      `/teacher/vocabulary/lessons${qs ? `?${qs}` : ""}`
    );
  },

  /**
   * GET /api/teacher/vocabulary/lessons/{lessonId}
   * Returns lesson detail including its words list.
   */
  getTeacherLessonDetail: (lessonId: string) =>
    api.get<VocabularyLessonDetailResponse>(
      `/teacher/vocabulary/lessons/${lessonId}`
    ),

  /**
   * POST /api/teacher/vocabulary/lessons
   * Creates a new vocabulary lesson.
   */
  createLesson: (data: VocabularyLessonCreateRequest) =>
    api.post<VocabularyLessonResponse>("/teacher/vocabulary/lessons", data),

  /**
   * PUT /api/teacher/vocabulary/lessons/{lessonId}
   * Updates an existing lesson.
   */
  updateLesson: (lessonId: string, data: VocabularyLessonUpdateRequest) =>
    api.put<VocabularyLessonResponse>(
      `/teacher/vocabulary/lessons/${lessonId}`,
      data
    ),

  /**
   * DELETE /api/teacher/vocabulary/lessons/{lessonId}
   * Deletes a lesson and all its words.
   */
  deleteLesson: (lessonId: string) =>
    api.delete<void>(`/teacher/vocabulary/lessons/${lessonId}`),

  /**
   * PATCH /api/teacher/vocabulary/lessons/{lessonId}/publish
   * Publishes a lesson so students can access it.
   */
  publishLesson: (lessonId: string) =>
    api.patch<VocabularyLessonResponse>(
      `/teacher/vocabulary/lessons/${lessonId}/publish`
    ),

  /**
   * PATCH /api/teacher/vocabulary/lessons/{lessonId}/unpublish
   * Unpublishes a lesson.
   */
  unpublishLesson: (lessonId: string) =>
    api.patch<VocabularyLessonResponse>(
      `/teacher/vocabulary/lessons/${lessonId}/unpublish`
    ),

  // ─── Word API ──────────────────────────────────────────────────────────────

  /**
   * POST /api/teacher/vocabulary/lessons/{lessonId}/words
   * Adds a new word to a lesson.
   */
  addWord: (lessonId: string, data: VocabularyWordCreateRequest) =>
    api.post<VocabularyWordResponse>(
      `/teacher/vocabulary/lessons/${lessonId}/words`,
      data
    ),

  /**
   * PUT /api/teacher/vocabulary/words/{wordId}
   * Updates an existing word.
   */
  updateWord: (wordId: string, data: VocabularyWordUpdateRequest) =>
    api.put<VocabularyWordResponse>(`/teacher/vocabulary/words/${wordId}`, data),

  /**
   * DELETE /api/teacher/vocabulary/words/{wordId}
   * Deletes a word.
   */
  deleteWord: (wordId: string) =>
    api.delete<void>(`/teacher/vocabulary/words/${wordId}`),
};

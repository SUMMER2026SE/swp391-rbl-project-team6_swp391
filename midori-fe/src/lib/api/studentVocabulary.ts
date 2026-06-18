import { api } from "./client";
import {
  type VocabularyLessonResponse,
  type VocabularyLessonDetailResponse,
  type LessonListParams,
  type VocabularyWordResponse,
  normalizeLesson,
  normalizeLessonDetail,
} from "./vocabularyMappers";

// Re-export shared types and mappers for consumers
export type {
  VocabularyLessonResponse,
  VocabularyLessonDetailResponse,
  LessonListParams,
  VocabularyWordResponse,
};
export { normalizeLesson, normalizeLessonDetail };

// ─── Student Vocabulary API ───────────────────────────────────────────────────────

export const studentVocabularyApi = {
  /**
   * GET /api/vocabulary/lessons
   * Lists all published lessons available for students.
   * Supports optional query params: level, topic, search.
   */
  getPublishedLessons: async (params?: LessonListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.topic) searchParams.set("topic", params.topic);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const lessons = await api.get<VocabularyLessonResponse[]>(
      `/vocabulary/lessons${qs ? `?${qs}` : ""}`
    );
    return lessons.map(normalizeLesson);
  },

  /**
   * GET /api/vocabulary/lessons/{lessonId}
   * Returns published lesson detail including its words list.
   */
  getPublishedLessonDetail: async (lessonId: string) => {
    const lesson = await api.get<VocabularyLessonDetailResponse>(
      `/vocabulary/lessons/${lessonId}`
    );
    return normalizeLessonDetail(lesson);
  },
};

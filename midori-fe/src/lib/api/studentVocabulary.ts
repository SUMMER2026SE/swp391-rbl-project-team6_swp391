import { api } from "./client";

// Re-use types from teacher vocabulary API
export type {
  VocabularyLessonResponse,
  VocabularyLessonDetailResponse,
} from "./teacherVocabulary";

export interface LessonListParams {
  level?: string;
  topic?: string;
  search?: string;
}

// ─── Student Vocabulary API ───────────────────────────────────────────────────

export const studentVocabularyApi = {
  /**
   * GET /api/vocabulary/lessons
   * Lists all published lessons available for students.
   * Supports optional query params: level, topic, search.
   */
  getPublishedLessons: (params?: LessonListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.topic) searchParams.set("topic", params.topic);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    return api.get<import("./teacherVocabulary").VocabularyLessonResponse[]>(
      `/vocabulary/lessons${qs ? `?${qs}` : ""}`
    );
  },

  /**
   * GET /api/vocabulary/lessons/{lessonId}
   * Returns published lesson detail including its words list.
   */
  getPublishedLessonDetail: (lessonId: string) =>
    api.get<import("./teacherVocabulary").VocabularyLessonDetailResponse>(
      `/vocabulary/lessons/${lessonId}`
    ),
};

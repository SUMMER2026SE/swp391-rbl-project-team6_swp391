import { api } from "./client";
import {
  type VocabularyLessonResponse,
  type VocabularyWordResponse,
  type VocabularyLessonDetailResponse,
  type VocabularyWordCreateRequest,
  type VocabularyLessonCreateRequest,
  type VocabularyLessonUpdateRequest,
  type VocabularyWordUpdateRequest,
  type LessonListParams,
  normalizeLesson,
  normalizeLessonDetail,
  normalizeWord,
} from "./vocabularyMappers";

export type {
  VocabularyLessonResponse,
  VocabularyWordResponse,
  VocabularyLessonDetailResponse,
  VocabularyWordCreateRequest,
  VocabularyLessonCreateRequest,
  VocabularyLessonUpdateRequest,
  VocabularyWordUpdateRequest,
  LessonListParams,
};

export { normalizeLesson, normalizeLessonDetail };

// ─── Payload Normalizers (teacher-only, not shared) ─────────────────────────────

function normalizeCreateWordPayload(
  word: VocabularyWordCreateRequest,
): VocabularyWordCreateRequest {
  const japanese = word.japanese ?? word.word;
  const vietnamese = word.vietnamese ?? word.meaning;
  const reading = word.reading ?? word.furigana;
  const exampleJapanese = word.exampleJapanese ?? word.example_japanese;
  const exampleVietnamese =
    word.exampleVietnamese ?? word.exampleMeaning ?? word.example_vietnamese;
  const audioUrl = word.audioUrl ?? word.audio_url;
  const displayOrder = word.displayOrder ?? word.display_order;

  return {
    word: japanese,
    japanese: japanese,
    reading: reading,
    romaji: word.romaji,
    meaning: vietnamese,
    vietnamese: vietnamese,
    exampleJapanese: exampleJapanese,
    example_japanese: exampleJapanese,
    exampleMeaning: exampleVietnamese,
    exampleVietnamese: exampleVietnamese,
    example_vietnamese: exampleVietnamese,
    audioUrl: audioUrl,
    audio_url: audioUrl,
    displayOrder: displayOrder,
    display_order: displayOrder,
  };
}

function normalizeCreateLessonPayload(
  data: VocabularyLessonCreateRequest,
): VocabularyLessonCreateRequest {
  return {
    title: data.title,
    description: data.description,
    level: data.level,
    topic: data.topic,
    estimatedMinutes: data.estimatedMinutes ?? data.estimated_minutes,
    estimated_minutes: data.estimatedMinutes ?? data.estimated_minutes,
    isPublished: data.isPublished ?? data.is_published,
    is_published: data.isPublished ?? data.is_published,
    words: data.words?.map(normalizeCreateWordPayload) ?? [],
  };
}

function normalizeUpdateLessonPayload(
  data: VocabularyLessonUpdateRequest,
): VocabularyLessonUpdateRequest {
  return {
    ...data,
    estimatedMinutes: data.estimatedMinutes ?? data.estimated_minutes,
    estimated_minutes: data.estimatedMinutes ?? data.estimated_minutes,
    isPublished: data.isPublished ?? data.is_published,
    is_published: data.isPublished ?? data.is_published,
  };
}

function normalizeUpdateWordPayload(
  data: VocabularyWordUpdateRequest,
): VocabularyWordUpdateRequest {
  return normalizeCreateWordPayload(data);
}

// ─── Teacher Vocabulary API ──────────────────────────────────────────────────────

export const teacherVocabularyApi = {
  /**
   * GET /api/teacher/vocabulary/lessons
   * Lists lessons for the authenticated teacher.
   * Supports optional query params: level, topic, search.
   */
  getTeacherLessons: async (params?: LessonListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.topic) searchParams.set("topic", params.topic);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const lessons = await api.get<VocabularyLessonResponse[]>(
      `/teacher/vocabulary/lessons${qs ? `?${qs}` : ""}`,
    );
    return lessons.map(normalizeLesson);
  },

  /**
   * GET /api/teacher/vocabulary/lessons/{lessonId}
   * Returns lesson detail including its words list.
   */
  getTeacherLessonDetail: async (lessonId: string) => {
    const lesson = await api.get<VocabularyLessonDetailResponse>(
      `/teacher/vocabulary/lessons/${lessonId}`,
    );
    return normalizeLessonDetail(lesson);
  },

  /**
   * POST /api/teacher/vocabulary/lessons
   * Creates a new vocabulary lesson.
   */
  createLesson: async (data: VocabularyLessonCreateRequest) => {
    const payload = normalizeCreateLessonPayload(data);
    const lesson = await api.post<VocabularyLessonResponse>("/teacher/vocabulary/lessons", payload);
    return normalizeLesson(lesson);
  },

  /**
   * PUT /api/teacher/vocabulary/lessons/{lessonId}
   * Updates an existing lesson.
   */
  updateLesson: async (lessonId: string, data: VocabularyLessonUpdateRequest) => {
    const lesson = await api.put<VocabularyLessonResponse>(
      `/teacher/vocabulary/lessons/${lessonId}`,
      normalizeUpdateLessonPayload(data),
    );
    return normalizeLesson(lesson);
  },

  /**
   * DELETE /api/teacher/vocabulary/lessons/{lessonId}
   * Deletes a lesson and all its words.
   */
  deleteLesson: (lessonId: string) => api.delete<void>(`/teacher/vocabulary/lessons/${lessonId}`),

  // ─── Word API ──────────────────────────────────────────────────────────────

  /**
   * POST /api/teacher/vocabulary/lessons/{lessonId}/words
   * Adds a new word to a lesson.
   */
  addWord: async (lessonId: string, data: VocabularyWordCreateRequest) => {
    const word = await api.post<VocabularyWordResponse>(
      `/teacher/vocabulary/lessons/${lessonId}/words`,
      normalizeCreateWordPayload(data),
    );
    return normalizeWord(word);
  },

  /**
   * PUT /api/teacher/vocabulary/words/{wordId}
   * Updates an existing word.
   */
  updateWord: async (wordId: string, data: VocabularyWordUpdateRequest) => {
    const word = await api.put<VocabularyWordResponse>(
      `/teacher/vocabulary/words/${wordId}`,
      normalizeUpdateWordPayload(data),
    );
    return normalizeWord(word);
  },

  /**
   * DELETE /api/teacher/vocabulary/words/{wordId}
   * Deletes a word.
   */
  deleteWord: (wordId: string) => api.delete<void>(`/teacher/vocabulary/words/${wordId}`),

  /**
   * PATCH /api/teacher/vocabulary/lessons/{lessonId}/publish
   * Publishes a lesson, making it visible to students.
   */
  publishLesson: async (lessonId: string) => {
    const lesson = await api.patch<VocabularyLessonResponse>(
      `/teacher/vocabulary/lessons/${lessonId}/publish`,
    );
    return normalizeLesson(lesson);
  },

  /**
   * PATCH /api/teacher/vocabulary/lessons/{lessonId}/unpublish
   * Unpublishes a lesson, hiding it from students.
   */
  unpublishLesson: async (lessonId: string) => {
    const lesson = await api.patch<VocabularyLessonResponse>(
      `/teacher/vocabulary/lessons/${lessonId}/unpublish`,
    );
    return normalizeLesson(lesson);
  },
};

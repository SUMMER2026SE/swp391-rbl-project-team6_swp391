import { api } from "./client";

export interface VocabularyLessonResponse {
  id: string;
  title: string;
  description?: string;
  level?: string;
  topic?: string;
  estimatedMinutes?: number;
  estimated_minutes?: number;
  wordCount: number;
  word_count?: number;
  isPublished: boolean;
  is_published?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyWordResponse {
  id: string;
  lessonId: string;
  lesson_id?: string;
  word: string;
  japanese?: string;
  furigana?: string;
  reading?: string;
  romaji?: string;
  meaning: string;
  vietnamese?: string;
  exampleJapanese?: string;
  example_japanese?: string;
  exampleMeaning?: string;
  exampleVietnamese?: string;
  example_vietnamese?: string;
  audioUrl?: string;
  audio_url?: string;
  displayOrder: number;
  display_order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyLessonDetailResponse extends VocabularyLessonResponse {
  words: VocabularyWordResponse[];
}

export interface VocabularyWordCreateRequest {
  word?: string;
  japanese?: string;
  furigana?: string;
  reading?: string;
  romaji?: string;
  meaning?: string;
  vietnamese?: string;
  exampleJapanese?: string;
  example_japanese?: string;
  exampleMeaning?: string;
  exampleVietnamese?: string;
  example_vietnamese?: string;
  audioUrl?: string;
  audio_url?: string;
  displayOrder?: number;
  display_order?: number;
}

export interface VocabularyLessonCreateRequest {
  title: string;
  description?: string;
  level: string;
  topic?: string;
  estimatedMinutes?: number;
  estimated_minutes?: number;
  isPublished?: boolean;
  is_published?: boolean;
  words?: VocabularyWordCreateRequest[];
}

export interface VocabularyLessonUpdateRequest {
  title?: string;
  description?: string;
  level?: string;
  topic?: string;
  estimatedMinutes?: number;
  estimated_minutes?: number;
  isPublished?: boolean;
  is_published?: boolean;
}

export interface VocabularyWordUpdateRequest {
  word?: string;
  japanese?: string;
  furigana?: string;
  reading?: string;
  romaji?: string;
  meaning?: string;
  vietnamese?: string;
  exampleJapanese?: string;
  example_japanese?: string;
  exampleMeaning?: string;
  exampleVietnamese?: string;
  example_vietnamese?: string;
  audioUrl?: string;
  audio_url?: string;
  displayOrder?: number;
  display_order?: number;
}

export interface LessonListParams {
  level?: string;
  topic?: string;
  search?: string;
}

function normalizeWord(word: VocabularyWordResponse): VocabularyWordResponse {
  return {
    ...word,
    lessonId: word.lessonId ?? word.lesson_id ?? "",
    word: word.word ?? word.japanese ?? "",
    japanese: word.japanese ?? word.word ?? "",
    furigana: word.furigana ?? word.reading,
    reading: word.reading ?? word.furigana,
    meaning: word.meaning ?? word.vietnamese ?? "",
    vietnamese: word.vietnamese ?? word.meaning ?? "",
    exampleJapanese: word.exampleJapanese ?? word.example_japanese,
    exampleMeaning: word.exampleMeaning ?? word.exampleVietnamese ?? word.example_vietnamese,
    exampleVietnamese: word.exampleVietnamese ?? word.exampleMeaning ?? word.example_vietnamese,
    audioUrl: word.audioUrl ?? word.audio_url,
    displayOrder: word.displayOrder ?? word.display_order ?? 0,
  };
}

function normalizeLesson<T extends VocabularyLessonResponse>(lesson: T): T {
  return {
    ...lesson,
    estimatedMinutes: lesson.estimatedMinutes ?? lesson.estimated_minutes,
    wordCount: lesson.wordCount ?? lesson.word_count ?? 0,
    isPublished: lesson.isPublished ?? lesson.is_published ?? false,
  };
}

function normalizeLessonDetail(lesson: VocabularyLessonDetailResponse): VocabularyLessonDetailResponse {
  const normalizedLesson = normalizeLesson(lesson);
  return {
    ...normalizedLesson,
    words: Array.isArray(lesson.words) ? lesson.words.map(normalizeWord) : [],
  };
}

function normalizeCreateWordPayload(word: VocabularyWordCreateRequest): VocabularyWordCreateRequest {
  const japanese = word.japanese ?? word.word;
  const vietnamese = word.vietnamese ?? word.meaning;
  const reading = word.reading ?? word.furigana;
  const exampleJapanese = word.exampleJapanese ?? word.example_japanese;
  const exampleVietnamese = word.exampleVietnamese ?? word.exampleMeaning ?? word.example_vietnamese;
  const audioUrl = word.audioUrl ?? word.audio_url;
  const displayOrder = word.displayOrder ?? word.display_order;

  return {
    word: japanese,
    japanese,
    furigana: reading,
    reading,
    romaji: word.romaji,
    meaning: vietnamese,
    vietnamese,
    exampleJapanese,
    example_japanese: exampleJapanese,
    exampleMeaning: exampleVietnamese,
    exampleVietnamese,
    example_vietnamese: exampleVietnamese,
    audioUrl,
    audio_url: audioUrl,
    displayOrder,
    display_order: displayOrder,
  };
}

function normalizeCreateLessonPayload(data: VocabularyLessonCreateRequest): VocabularyLessonCreateRequest {
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

function normalizeUpdateLessonPayload(data: VocabularyLessonUpdateRequest): VocabularyLessonUpdateRequest {
  return {
    ...data,
    estimatedMinutes: data.estimatedMinutes ?? data.estimated_minutes,
    estimated_minutes: data.estimatedMinutes ?? data.estimated_minutes,
    isPublished: data.isPublished ?? data.is_published,
    is_published: data.isPublished ?? data.is_published,
  };
}

function normalizeUpdateWordPayload(data: VocabularyWordUpdateRequest): VocabularyWordUpdateRequest {
  return normalizeCreateWordPayload(data);
}

// ─── Lesson API ────────────────────────────────────────────────────────────────

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
      `/teacher/vocabulary/lessons${qs ? `?${qs}` : ""}`
    );
    return lessons.map(normalizeLesson);
  },

  /**
   * GET /api/teacher/vocabulary/lessons/{lessonId}
   * Returns lesson detail including its words list.
   */
  getTeacherLessonDetail: async (lessonId: string) => {
    const lesson = await api.get<VocabularyLessonDetailResponse>(
      `/teacher/vocabulary/lessons/${lessonId}`
    );
    return normalizeLessonDetail(lesson);
  },

  /**
   * POST /api/teacher/vocabulary/lessons
   * Creates a new vocabulary lesson.
   */
  createLesson: async (data: VocabularyLessonCreateRequest) => {
    const payload = normalizeCreateLessonPayload(data);
    console.log("[teacherVocabularyApi] POST createLesson body:", payload);
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
      normalizeUpdateLessonPayload(data)
    );
    return normalizeLesson(lesson);
  },

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
  publishLesson: async (lessonId: string) => {
    const lesson = await api.patch<VocabularyLessonResponse>(
      `/teacher/vocabulary/lessons/${lessonId}/publish`
    );
    return normalizeLesson(lesson);
  },

  /**
   * PATCH /api/teacher/vocabulary/lessons/{lessonId}/unpublish
   * Unpublishes a lesson.
   */
  unpublishLesson: async (lessonId: string) => {
    const lesson = await api.patch<VocabularyLessonResponse>(
      `/teacher/vocabulary/lessons/${lessonId}/unpublish`
    );
    return normalizeLesson(lesson);
  },

  // ─── Word API ──────────────────────────────────────────────────────────────

  /**
   * POST /api/teacher/vocabulary/lessons/{lessonId}/words
   * Adds a new word to a lesson.
   */
  addWord: async (lessonId: string, data: VocabularyWordCreateRequest) => {
    const word = await api.post<VocabularyWordResponse>(
      `/teacher/vocabulary/lessons/${lessonId}/words`,
      normalizeCreateWordPayload(data)
    );
    return normalizeWord(word);
  },

  /**
   * PUT /api/teacher/vocabulary/words/{wordId}
   * Updates an existing word.
   */
  updateWord: async (wordId: string, data: VocabularyWordUpdateRequest) => {
    const word = await api.put<VocabularyWordResponse>(`/teacher/vocabulary/words/${wordId}`, normalizeUpdateWordPayload(data));
    return normalizeWord(word);
  },

  /**
   * DELETE /api/teacher/vocabulary/words/{wordId}
   * Deletes a word.
   */
  deleteWord: (wordId: string) =>
    api.delete<void>(`/teacher/vocabulary/words/${wordId}`),
};

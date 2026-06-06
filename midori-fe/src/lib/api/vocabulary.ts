import { api } from "./client";

// ============================================================
// TypeScript Interfaces for Vocabulary API
// ============================================================

export interface VocabularyLesson {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  topic: string | null;
  estimatedMinutes: number | null;
  wordCount: number;
  isPublished: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyWord {
  id: string;
  lessonId: string;
  word: string;
  furigana: string | null;
  romaji: string | null;
  meaning: string;
  exampleJapanese: string | null;
  exampleMeaning: string | null;
  audioUrl: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Vocabulary API Functions
// ============================================================

/**
 * Fetches all published vocabulary lessons.
 * Endpoint: GET /api/vocabulary/lessons
 * @returns Promise resolving to an array of VocabularyLesson objects.
 */
export const vocabularyApi = {
  getVocabularyLessons: () =>
    api.get<VocabularyLesson[]>("/vocabulary/lessons"),

  /**
   * Fetches a single vocabulary lesson with its words included.
   * Endpoint: GET /api/vocabulary/lessons/{lessonId}
   * Note: words are returned directly inside the detail response, not via a separate endpoint.
   * @param lessonId - The UUID of the vocabulary lesson.
   * @returns Promise resolving to a VocabularyLessonDetail object.
   */
  getVocabularyLesson: (lessonId: string) =>
    api.get<VocabularyLessonDetail>(`/vocabulary/lessons/${lessonId}`),
};

/**
 * Extended lesson response that includes words.
 * Matches VocabularyLessonDetailResponse from the backend.
 */
export interface VocabularyLessonDetail extends VocabularyLesson {
  words: VocabularyWord[];
}

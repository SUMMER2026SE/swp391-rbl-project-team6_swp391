/**
 * Shared vocabulary mappers.
 * Contains types and normalize functions used by both teacher and student vocabulary APIs.
 */

import { api } from "./client";

// ─── Shared Types ──────────────────────────────────────────────────────────────

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
  created_by?: string;
  teacherName?: string;
  teacher_name?: string;
  createdByName?: string;
  created_by_name?: string;
  createdByUsername?: string;
  created_by_username?: string;
  teacherUsername?: string;
  teacher_username?: string;
  ownedByMe?: boolean;
  owned_by_me?: boolean;
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

export interface LessonListParams {
  level?: string;
  topic?: string;
  search?: string;
}

// ─── Normalize Functions ───────────────────────────────────────────────────────

export function normalizeWord(word: VocabularyWordResponse): VocabularyWordResponse {
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

export function normalizeLesson<T extends VocabularyLessonResponse>(lesson: T): T {
  return {
    ...lesson,
    estimatedMinutes: lesson.estimatedMinutes ?? lesson.estimated_minutes,
    wordCount: lesson.wordCount ?? lesson.word_count ?? ((lesson as T & { words?: unknown[] }).words?.length ?? 0),
    isPublished: lesson.isPublished ?? lesson.is_published ?? false,
    teacherName:
      lesson.teacherName ??
      lesson.teacher_name ??
      lesson.createdByName ??
      lesson.created_by_name ??
      lesson.createdByUsername ??
      lesson.created_by_username ??
      lesson.teacherUsername ??
      lesson.teacher_username ??
      "MIDORI",
    ownedByMe: lesson.ownedByMe ?? lesson.owned_by_me ?? false,
  };
}

export function normalizeLessonDetail(
  lesson: VocabularyLessonDetailResponse
): VocabularyLessonDetailResponse {
  const normalizedLesson = normalizeLesson(lesson);
  return {
    ...normalizedLesson,
    words: Array.isArray(lesson.words) ? lesson.words.map(normalizeWord) : [],
  };
}

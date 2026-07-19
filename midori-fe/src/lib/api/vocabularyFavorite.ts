import { api } from "./client";

export interface VocabularyFavoriteResponse {
  id: string;
  vocabularyItemId: string;
  japanese: string;
  furigana: string | null;
  romaji: string | null;
  meaning: string;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  partOfSpeech: string | null;
  itemOrder: number;
  lessonId: string;
  lessonTitle: string;
  createdAt: string;
}

export const vocabularyFavoriteApi = {
  /**
   * GET /api/student/vocabulary/favorites
   * Get all favorites for the current student
   */
  getFavorites: async (): Promise<VocabularyFavoriteResponse[]> => {
    return api.get<VocabularyFavoriteResponse[]>("/student/vocabulary/favorites");
  },

  /**
   * GET /api/student/vocabulary/favorites/ids
   * Get all favorite vocabulary item IDs
   */
  getFavoriteIds: async (): Promise<string[]> => {
    return api.get<string[]>("/student/vocabulary/favorites/ids");
  },

  /**
   * GET /api/student/vocabulary/favorites/lesson/{lessonId}
   * Get all favorites for a specific lesson
   */
  getLessonFavorites: async (lessonId: string): Promise<VocabularyFavoriteResponse[]> => {
    return api.get<VocabularyFavoriteResponse[]>(`/student/vocabulary/favorites/lesson/${lessonId}`);
  },

  /**
   * GET /api/student/vocabulary/favorites/lesson/{lessonId}/ids
   * Get only the IDs of favorites for a specific lesson
   */
  getLessonFavoriteIds: async (lessonId: string): Promise<string[]> => {
    return api.get<string[]>(`/student/vocabulary/favorites/lesson/${lessonId}/ids`);
  },

  /**
   * POST /api/student/vocabulary/favorites/{vocabularyItemId}
   * Add a vocabulary item to favorites
   */
  addFavorite: async (vocabularyItemId: string): Promise<VocabularyFavoriteResponse> => {
    return api.post<VocabularyFavoriteResponse>(`/student/vocabulary/favorites/${vocabularyItemId}`);
  },

  /**
   * DELETE /api/student/vocabulary/favorites/{vocabularyItemId}
   * Remove a vocabulary item from favorites
   */
  removeFavorite: async (vocabularyItemId: string): Promise<void> => {
    return api.delete<void>(`/student/vocabulary/favorites/${vocabularyItemId}`);
  },

  /**
   * GET /api/student/vocabulary/favorites/check/{vocabularyItemId}
   * Check if a vocabulary item is favorited
   */
  checkFavorite: async (vocabularyItemId: string): Promise<boolean> => {
    return api.get<boolean>(`/student/vocabulary/favorites/check/${vocabularyItemId}`);
  },

  /**
   * POST /api/student/vocabulary/favorites/{vocabularyItemId}/toggle
   * Toggle favorite status
   */
  toggleFavorite: async (vocabularyItemId: string): Promise<VocabularyFavoriteResponse | null> => {
    return api.post<VocabularyFavoriteResponse | null>(`/student/vocabulary/favorites/${vocabularyItemId}/toggle`);
  },
};

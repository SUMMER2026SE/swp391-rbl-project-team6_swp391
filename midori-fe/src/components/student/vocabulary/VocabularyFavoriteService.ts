/**
 * VocabularyFavoriteService
 * 
 * Abstraction layer for managing vocabulary favorites.
 * Currently uses localStorage, but can be easily replaced with API calls in the future.
 */

const STORAGE_KEY = "midori_vocabulary_favorites";

export interface FavoriteStorage {
  [lessonId: string]: string[]; // lessonId -> array of word IDs
}

/**
 * Get all favorites for a lesson
 */
export function getFavorites(lessonId: string): string[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const data: FavoriteStorage = JSON.parse(stored);
    return data[lessonId] || [];
  } catch {
    return [];
  }
}

/**
 * Check if a word is favorited
 */
export function isFavorite(lessonId: string, wordId: string): boolean {
  const favorites = getFavorites(lessonId);
  return favorites.includes(wordId);
}

/**
 * Toggle favorite status for a word
 */
export function toggleFavorite(lessonId: string, wordId: string): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: FavoriteStorage = stored ? JSON.parse(stored) : {};
    
    if (!data[lessonId]) {
      data[lessonId] = [];
    }
    
    const index = data[lessonId].indexOf(wordId);
    const isNowFavorite: boolean = index === -1;
    
    if (isNowFavorite) {
      data[lessonId].push(wordId);
    } else {
      data[lessonId].splice(index, 1);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return isNowFavorite;
  } catch {
    return false;
  }
}

/**
 * Add a word to favorites
 */
export function addFavorite(lessonId: string, wordId: string): void {
  if (typeof window === "undefined") return;
  
  const favorites = getFavorites(lessonId);
  if (!favorites.includes(wordId)) {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: FavoriteStorage = stored ? JSON.parse(stored) : {};
    
    if (!data[lessonId]) {
      data[lessonId] = [];
    }
    data[lessonId].push(wordId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

/**
 * Remove a word from favorites
 */
export function removeFavorite(lessonId: string, wordId: string): void {
  if (typeof window === "undefined") return;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  
  try {
    const data: FavoriteStorage = JSON.parse(stored);
    if (data[lessonId]) {
      const index = data[lessonId].indexOf(wordId);
      if (index !== -1) {
        data[lessonId].splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Clear all favorites for a lesson
 */
export function clearFavorites(lessonId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const data: FavoriteStorage = JSON.parse(stored);
    delete data[lessonId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore errors
  }
}

/**
 * Get favorite count for a lesson
 */
export function getFavoriteCount(lessonId: string): number {
  return getFavorites(lessonId).length;
}

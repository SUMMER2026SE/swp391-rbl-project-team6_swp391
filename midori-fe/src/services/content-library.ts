// ─── Content Library Service Layer ─────────────────────────────────────────────
// Supports both real API and mock data fallback

import type {
  GrammarItem,
  VocabularyItem,
  ListeningItem,
  ReadingItem,
  ShadowingItem,
  Flashcard,
  JLPTLevel,
  ApiResponse,
  PaginatedResponse,
} from "../types/content-library";

// ─── API Configuration ──────────────────────────────────────────────────────────
// Set API_BASE_URL to enable real API integration
// Leave empty to use mock data
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const isApiEnabled = !!API_BASE_URL;

// ─── API Helper ────────────────────────────────────────────────────────────────
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  if (!isApiEnabled) {
    throw new Error("API not configured, use mock data instead");
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.warn("API request failed, falling back to mock data:", error);
    throw error;
  }
}

// ─── Grammar Service ────────────────────────────────────────────────────────────
export const grammarService = {
  async getAll(level?: JLPTLevel): Promise<GrammarItem[]> {
    if (!isApiEnabled) {
      throw new Error("API not configured. Please set VITE_API_BASE_URL environment variable.");
    }

    try {
      const params = level ? `?level=${level}` : "";
      const response = await apiFetch<GrammarItem[]>(`/grammar${params}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch grammar items:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<GrammarItem | null> {
    if (!isApiEnabled) {
      throw new Error("API not configured. Please set VITE_API_BASE_URL environment variable.");
    }

    try {
      const response = await apiFetch<GrammarItem>(`/grammar/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch grammar item:", error);
      throw error;
    }
  },

  async search(query: string): Promise<GrammarItem[]> {
    if (!isApiEnabled) {
      throw new Error("API not configured. Please set VITE_API_BASE_URL environment variable.");
    }

    try {
      const response = await apiFetch<GrammarItem[]>(
        `/grammar/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to search grammar items:", error);
      throw error;
    }
  },

  async create(
    item: Omit<GrammarItem, "id" | "createdAt" | "updatedAt">
  ): Promise<GrammarItem> {
    if (!isApiEnabled) {
      throw new Error("API not configured. Please set VITE_API_BASE_URL environment variable.");
    }

    const response = await apiFetch<GrammarItem>("/grammar", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return response.data;
  },

  async update(
    id: string,
    updates: Partial<GrammarItem>
  ): Promise<GrammarItem> {
    if (!isApiEnabled) {
      throw new Error("API not configured. Please set VITE_API_BASE_URL environment variable.");
    }

    const response = await apiFetch<GrammarItem>(`/grammar/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    if (!isApiEnabled) {
      throw new Error("API not configured. Please set VITE_API_BASE_URL environment variable.");
    }

    await apiFetch(`/grammar/${id}`, { method: "DELETE" });
  },
};

// ─── Vocabulary Service ─────────────────────────────────────────────────────────
export const vocabularyService = {
  async getAll(level?: JLPTLevel): Promise<VocabularyItem[]> {
    if (!isApiEnabled) {
      const { mockVocabulary } = await import("../mock/vocabulary");
      return level
        ? mockVocabulary.filter((v) => v.jlptLevel === level)
        : mockVocabulary;
    }

    try {
      const params = level ? `?level=${level}` : "";
      const response = await apiFetch<VocabularyItem[]>(`/vocabulary${params}`);
      return response.data;
    } catch {
      const { mockVocabulary } = await import("../mock/vocabulary");
      return level
        ? mockVocabulary.filter((v) => v.jlptLevel === level)
        : mockVocabulary;
    }
  },

  async getById(id: string): Promise<VocabularyItem | null> {
    if (!isApiEnabled) {
      const { getVocabularyById } = await import("../mock/vocabulary");
      return getVocabularyById(id) || null;
    }

    try {
      const response = await apiFetch<VocabularyItem>(`/vocabulary/${id}`);
      return response.data;
    } catch {
      const { getVocabularyById } = await import("../mock/vocabulary");
      return getVocabularyById(id) || null;
    }
  },

  async getByLesson(lessonId: string): Promise<VocabularyItem[]> {
    if (!isApiEnabled) {
      const { getVocabularyByLesson } = await import("../mock/vocabulary");
      return getVocabularyByLesson(lessonId);
    }

    try {
      const response = await apiFetch<VocabularyItem[]>(
        `/vocabulary/lesson/${lessonId}`
      );
      return response.data;
    } catch {
      const { getVocabularyByLesson } = await import("../mock/vocabulary");
      return getVocabularyByLesson(lessonId);
    }
  },

  async search(query: string): Promise<VocabularyItem[]> {
    if (!isApiEnabled) {
      const { searchVocabulary } = await import("../mock/vocabulary");
      return searchVocabulary(query);
    }

    try {
      const response = await apiFetch<VocabularyItem[]>(
        `/vocabulary/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch {
      const { searchVocabulary } = await import("../mock/vocabulary");
      return searchVocabulary(query);
    }
  },

  async create(
    item: Omit<VocabularyItem, "id" | "createdAt" | "updatedAt">
  ): Promise<VocabularyItem> {
    if (!isApiEnabled) {
      const { mockVocabulary } = await import("../mock/vocabulary");
      const newItem: VocabularyItem = {
        ...item,
        id: `vocab-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      mockVocabulary.unshift(newItem);
      return newItem;
    }

    const response = await apiFetch<VocabularyItem>("/vocabulary", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    if (!isApiEnabled) {
      const { mockVocabulary } = await import("../mock/vocabulary");
      const index = mockVocabulary.findIndex((v) => v.id === id);
      if (index !== -1) {
        mockVocabulary.splice(index, 1);
      }
      return;
    }

    await apiFetch(`/vocabulary/${id}`, { method: "DELETE" });
  },
};

// ─── Listening Service ──────────────────────────────────────────────────────────
export const listeningService = {
  async getAll(level?: JLPTLevel): Promise<ListeningItem[]> {
    if (!isApiEnabled) {
      const { mockListening } = await import("../mock/listening");
      return level
        ? mockListening.filter((l) => l.jlptLevel === level)
        : mockListening;
    }

    try {
      const params = level ? `?level=${level}` : "";
      const response = await apiFetch<ListeningItem[]>(`/listening${params}`);
      return response.data;
    } catch {
      const { mockListening } = await import("../mock/listening");
      return level
        ? mockListening.filter((l) => l.jlptLevel === level)
        : mockListening;
    }
  },

  async getById(id: string): Promise<ListeningItem | null> {
    if (!isApiEnabled) {
      const { getListeningById } = await import("../mock/listening");
      return getListeningById(id) || null;
    }

    try {
      const response = await apiFetch<ListeningItem>(`/listening/${id}`);
      return response.data;
    } catch {
      const { getListeningById } = await import("../mock/listening");
      return getListeningById(id) || null;
    }
  },

  async search(query: string): Promise<ListeningItem[]> {
    if (!isApiEnabled) {
      const { searchListening } = await import("../mock/listening");
      return searchListening(query);
    }

    try {
      const response = await apiFetch<ListeningItem[]>(
        `/listening/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch {
      const { searchListening } = await import("../mock/listening");
      return searchListening(query);
    }
  },

  async create(
    item: Omit<ListeningItem, "id" | "createdAt" | "updatedAt">
  ): Promise<ListeningItem> {
    if (!isApiEnabled) {
      const { mockListening } = await import("../mock/listening");
      const newItem: ListeningItem = {
        ...item,
        id: `listen-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      mockListening.unshift(newItem);
      return newItem;
    }

    const response = await apiFetch<ListeningItem>("/listening", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    if (!isApiEnabled) {
      const { mockListening } = await import("../mock/listening");
      const index = mockListening.findIndex((l) => l.id === id);
      if (index !== -1) {
        mockListening.splice(index, 1);
      }
      return;
    }

    await apiFetch(`/listening/${id}`, { method: "DELETE" });
  },
};

// ─── Reading Service ───────────────────────────────────────────────────────────
export const readingService = {
  async getAll(level?: JLPTLevel): Promise<ReadingItem[]> {
    if (!isApiEnabled) {
      const { mockReading } = await import("../mock/reading");
      return level
        ? mockReading.filter((r) => r.jlptLevel === level)
        : mockReading;
    }

    try {
      const params = level ? `?level=${level}` : "";
      const response = await apiFetch<ReadingItem[]>(`/reading${params}`);
      return response.data;
    } catch {
      const { mockReading } = await import("../mock/reading");
      return level
        ? mockReading.filter((r) => r.jlptLevel === level)
        : mockReading;
    }
  },

  async getById(id: string): Promise<ReadingItem | null> {
    if (!isApiEnabled) {
      const { getReadingById } = await import("../mock/reading");
      return getReadingById(id) || null;
    }

    try {
      const response = await apiFetch<ReadingItem>(`/reading/${id}`);
      return response.data;
    } catch {
      const { getReadingById } = await import("../mock/reading");
      return getReadingById(id) || null;
    }
  },

  async search(query: string): Promise<ReadingItem[]> {
    if (!isApiEnabled) {
      const { searchReading } = await import("../mock/reading");
      return searchReading(query);
    }

    try {
      const response = await apiFetch<ReadingItem[]>(
        `/reading/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch {
      const { searchReading } = await import("../mock/reading");
      return searchReading(query);
    }
  },

  async create(
    item: Omit<ReadingItem, "id" | "createdAt" | "updatedAt">
  ): Promise<ReadingItem> {
    if (!isApiEnabled) {
      const { mockReading } = await import("../mock/reading");
      const newItem: ReadingItem = {
        ...item,
        id: `read-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      mockReading.unshift(newItem);
      return newItem;
    }

    const response = await apiFetch<ReadingItem>("/reading", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    if (!isApiEnabled) {
      const { mockReading } = await import("../mock/reading");
      const index = mockReading.findIndex((r) => r.id === id);
      if (index !== -1) {
        mockReading.splice(index, 1);
      }
      return;
    }

    await apiFetch(`/reading/${id}`, { method: "DELETE" });
  },
};

// ─── Shadowing Service ─────────────────────────────────────────────────────────
export const shadowingService = {
  async getAll(level?: JLPTLevel): Promise<ShadowingItem[]> {
    if (!isApiEnabled) {
      const { mockShadowing } = await import("../mock/shadowing");
      return level
        ? mockShadowing.filter((s) => s.jlptLevel === level)
        : mockShadowing;
    }

    try {
      const params = level ? `?level=${level}` : "";
      const response = await apiFetch<ShadowingItem[]>(`/shadowing${params}`);
      return response.data;
    } catch {
      const { mockShadowing } = await import("../mock/shadowing");
      return level
        ? mockShadowing.filter((s) => s.jlptLevel === level)
        : mockShadowing;
    }
  },

  async getById(id: string): Promise<ShadowingItem | null> {
    if (!isApiEnabled) {
      const { getShadowingById } = await import("../mock/shadowing");
      return getShadowingById(id) || null;
    }

    try {
      const response = await apiFetch<ShadowingItem>(`/shadowing/${id}`);
      return response.data;
    } catch {
      const { getShadowingById } = await import("../mock/shadowing");
      return getShadowingById(id) || null;
    }
  },

  async search(query: string): Promise<ShadowingItem[]> {
    if (!isApiEnabled) {
      const { searchShadowing } = await import("../mock/shadowing");
      return searchShadowing(query);
    }

    try {
      const response = await apiFetch<ShadowingItem[]>(
        `/shadowing/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch {
      const { searchShadowing } = await import("../mock/shadowing");
      return searchShadowing(query);
    }
  },

  async create(
    item: Omit<ShadowingItem, "id" | "createdAt" | "updatedAt">
  ): Promise<ShadowingItem> {
    if (!isApiEnabled) {
      const { mockShadowing } = await import("../mock/shadowing");
      const newItem: ShadowingItem = {
        ...item,
        id: `shadow-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      mockShadowing.unshift(newItem);
      return newItem;
    }

    const response = await apiFetch<ShadowingItem>("/shadowing", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    if (!isApiEnabled) {
      const { mockShadowing } = await import("../mock/shadowing");
      const index = mockShadowing.findIndex((s) => s.id === id);
      if (index !== -1) {
        mockShadowing.splice(index, 1);
      }
      return;
    }

    await apiFetch(`/shadowing/${id}`, { method: "DELETE" });
  },
};

// ─── Flashcard Service ─────────────────────────────────────────────────────────
export const flashcardService = {
  async getAll(level?: JLPTLevel): Promise<Flashcard[]> {
    if (!isApiEnabled) {
      const { mockFlashcards } = await import("../mock/flashcards");
      return level
        ? mockFlashcards.filter((f) => f.jlptLevel === level)
        : mockFlashcards;
    }

    try {
      const params = level ? `?level=${level}` : "";
      const response = await apiFetch<Flashcard[]>(`/flashcards${params}`);
      return response.data;
    } catch {
      const { mockFlashcards } = await import("../mock/flashcards");
      return level
        ? mockFlashcards.filter((f) => f.jlptLevel === level)
        : mockFlashcards;
    }
  },

  async getById(id: string): Promise<Flashcard | null> {
    if (!isApiEnabled) {
      const { getFlashcardsById } = await import("../mock/flashcards");
      return getFlashcardsById(id) || null;
    }

    try {
      const response = await apiFetch<Flashcard>(`/flashcards/${id}`);
      return response.data;
    } catch {
      const { getFlashcardsById } = await import("../mock/flashcards");
      return getFlashcardsById(id) || null;
    }
  },

  async getByTags(tags: string[]): Promise<Flashcard[]> {
    if (!isApiEnabled) {
      const { getFlashcardsByTags } = await import("../mock/flashcards");
      return getFlashcardsByTags(tags);
    }

    try {
      const params = tags.map((t) => `tags=${encodeURIComponent(t)}`).join("&");
      const response = await apiFetch<Flashcard[]>(`/flashcards?${params}`);
      return response.data;
    } catch {
      const { getFlashcardsByTags } = await import("../mock/flashcards");
      return getFlashcardsByTags(tags);
    }
  },

  async search(query: string): Promise<Flashcard[]> {
    if (!isApiEnabled) {
      const { searchFlashcards } = await import("../mock/flashcards");
      return searchFlashcards(query);
    }

    try {
      const response = await apiFetch<Flashcard[]>(
        `/flashcards/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch {
      const { searchFlashcards } = await import("../mock/flashcards");
      return searchFlashcards(query);
    }
  },

  async create(item: Omit<Flashcard, "id" | "createdAt" | "updatedAt">): Promise<Flashcard> {
    if (!isApiEnabled) {
      const { mockFlashcards } = await import("../mock/flashcards");
      const newItem: Flashcard = {
        ...item,
        id: `fc-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      mockFlashcards.unshift(newItem);
      return newItem;
    }

    const response = await apiFetch<Flashcard>("/flashcards", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return response.data;
  },

  async update(id: string, updates: Partial<Flashcard>): Promise<Flashcard> {
    if (!isApiEnabled) {
      const { mockFlashcards } = await import("../mock/flashcards");
      const index = mockFlashcards.findIndex((f) => f.id === id);
      if (index !== -1) {
        mockFlashcards[index] = {
          ...mockFlashcards[index],
          ...updates,
          updatedAt: new Date().toISOString().split("T")[0],
        };
        return mockFlashcards[index];
      }
      throw new Error("Flashcard not found");
    }

    const response = await apiFetch<Flashcard>(`/flashcards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    if (!isApiEnabled) {
      const { mockFlashcards } = await import("../mock/flashcards");
      const index = mockFlashcards.findIndex((f) => f.id === id);
      if (index !== -1) {
        mockFlashcards.splice(index, 1);
      }
      return;
    }

    await apiFetch(`/flashcards/${id}`, { method: "DELETE" });
  },
};

// ─── Export API Status ─────────────────────────────────────────────────────────
export const isUsingMockData = !isApiEnabled;

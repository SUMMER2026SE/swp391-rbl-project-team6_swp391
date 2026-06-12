import { api } from "./client";
import {
  type FlashcardSetResponse,
  type FlashcardSetDetailResponse,
  type FlashcardCardResponse,
  type FlashcardSetCreateRequest,
  type FlashcardSetUpdateRequest,
  type FlashcardCardCreateRequest,
  type FlashcardCardUpdateRequest,
  type FlashcardSetListParams,
  normalizeFlashcardSet,
  normalizeFlashcardSetDetail,
  normalizeCreateSetPayload,
  normalizeUpdateSetPayload,
  normalizeCreateCardPayload,
  normalizeUpdateCardPayload,
} from "./flashcardMappers";

// ─── Re-export types ───────────────────────────────────────────────────────────

export type {
  FlashcardSetResponse,
  FlashcardSetDetailResponse,
  FlashcardCardResponse,
  FlashcardSetCreateRequest,
  FlashcardSetUpdateRequest,
  FlashcardCardCreateRequest,
  FlashcardCardUpdateRequest,
  FlashcardSetListParams,
};

export { normalizeFlashcardSet, normalizeFlashcardSetDetail };

// ─── Teacher Flashcard API ──────────────────────────────────────────────────────

export const teacherFlashcardApi = {
  // ─── Set Management ──────────────────────────────────────────────────────────

  /**
   * GET /api/teacher/flashcard-sets
   * Lists flashcard sets owned by the authenticated teacher.
   * Supports optional query params: level, search.
   */
  getFlashcardSets: async (params?: FlashcardSetListParams): Promise<FlashcardSetResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const sets = await api.get<FlashcardSetResponse[]>(
      `/teacher/flashcard-sets${qs ? `?${qs}` : ""}`
    );
    return sets.map(normalizeFlashcardSet);
  },

  /**
   * GET /api/teacher/flashcard-sets/{setId}
   * Returns complete set information including cards.
   */
  getFlashcardSetDetail: async (setId: string): Promise<FlashcardSetDetailResponse> => {
    const set = await api.get<FlashcardSetDetailResponse>(`/teacher/flashcard-sets/${setId}`);
    return normalizeFlashcardSetDetail(set);
  },

  /**
   * POST /api/teacher/flashcard-sets
   * Creates a new flashcard set.
   */
  createFlashcardSet: async (data: FlashcardSetCreateRequest): Promise<FlashcardSetResponse> => {
    const set = await api.post<FlashcardSetResponse>(
      "/teacher/flashcard-sets",
      normalizeCreateSetPayload(data)
    );
    return normalizeFlashcardSet(set);
  },

  /**
   * PUT /api/teacher/flashcard-sets/{setId}
   * Updates an existing flashcard set.
   */
  updateFlashcardSet: async (
    setId: string,
    data: FlashcardSetUpdateRequest
  ): Promise<FlashcardSetResponse> => {
    const set = await api.put<FlashcardSetResponse>(
      `/teacher/flashcard-sets/${setId}`,
      normalizeUpdateSetPayload(data)
    );
    return normalizeFlashcardSet(set);
  },

  /**
   * DELETE /api/teacher/flashcard-sets/{setId}
   * Deletes a flashcard set.
   */
  deleteFlashcardSet: (setId: string): Promise<void> =>
    api.delete<void>(`/teacher/flashcard-sets/${setId}`),

  /**
   * POST /api/teacher/flashcard-sets/{setId}/submit
   * Submits the set for approval workflow (DRAFT → PENDING).
   */
  submitFlashcardSet: async (setId: string): Promise<FlashcardSetResponse> => {
    const set = await api.post<FlashcardSetResponse>(
      `/teacher/flashcard-sets/${setId}/submit`
    );
    return normalizeFlashcardSet(set);
  },

  // ─── Card Management ─────────────────────────────────────────────────────────

  /**
   * POST /api/teacher/flashcard-sets/{setId}/cards
   * Adds a new card to a flashcard set.
   */
  createCard: async (
    setId: string,
    data: FlashcardCardCreateRequest
  ): Promise<FlashcardCardResponse> => {
    const card = await api.post<FlashcardCardResponse>(
      `/teacher/flashcard-sets/${setId}/cards`,
      normalizeCreateCardPayload(data)
    );
    return card;
  },

  /**
   * PUT /api/teacher/flashcard-cards/{cardId}
   * Updates an existing flashcard card.
   */
  updateCard: async (
    cardId: string,
    data: FlashcardCardUpdateRequest
  ): Promise<FlashcardCardResponse> => {
    const card = await api.put<FlashcardCardResponse>(
      `/teacher/flashcard-cards/${cardId}`,
      normalizeUpdateCardPayload(data)
    );
    return card;
  },

  /**
   * DELETE /api/teacher/flashcard-cards/{cardId}
   * Deletes a flashcard card.
   */
  deleteCard: (cardId: string): Promise<void> =>
    api.delete<void>(`/teacher/flashcard-cards/${cardId}`),
};

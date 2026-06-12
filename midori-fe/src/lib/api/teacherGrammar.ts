import { api } from "./client";
import {
  type GrammarResponse,
  type GrammarCreateRequest,
  type GrammarUpdateRequest,
  type GrammarListParams,
  type GrammarStatus,
  type GrammarStatsResponse,
  normalizeGrammar,
} from "./grammarMappers";

export type {
  GrammarResponse,
  GrammarCreateRequest,
  GrammarUpdateRequest,
  GrammarListParams,
  GrammarStatus,
  GrammarStatsResponse,
};

export { normalizeGrammar };

// ─── Teacher Grammar API ─────────────────────────────────────────────────────────

export const teacherGrammarApi = {
  /**
   * GET /api/teacher/grammar
   * Lists grammar lessons for the authenticated teacher.
   * Supports optional query params: level, search, status.
   */
  getGrammarList: async (params?: GrammarListParams): Promise<GrammarResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    const qs = searchParams.toString();
    const grammars = await api.get<GrammarResponse[]>(`/teacher/grammar${qs ? `?${qs}` : ""}`);
    return grammars.map(normalizeGrammar);
  },

  /**
   * GET /api/teacher/grammar/{grammarId}
   * Returns a single grammar lesson detail.
   */
  getGrammarDetail: async (grammarId: string): Promise<GrammarResponse> => {
    const grammar = await api.get<GrammarResponse>(`/teacher/grammar/${grammarId}`);
    return normalizeGrammar(grammar);
  },

  /**
   * POST /api/teacher/grammar
   * Creates a new grammar lesson.
   */
  createGrammar: async (data: GrammarCreateRequest): Promise<GrammarResponse> => {
    const grammar = await api.post<GrammarResponse>("/teacher/grammar", data);
    return normalizeGrammar(grammar);
  },

  /**
   * PUT /api/teacher/grammar/{grammarId}
   * Updates an existing grammar lesson.
   */
  updateGrammar: async (
    grammarId: string,
    data: GrammarUpdateRequest,
  ): Promise<GrammarResponse> => {
    const grammar = await api.put<GrammarResponse>(`/teacher/grammar/${grammarId}`, data);
    return normalizeGrammar(grammar);
  },

  /**
   * DELETE /api/teacher/grammar/{grammarId}
   * Deletes a grammar lesson.
   */
  deleteGrammar: (grammarId: string): Promise<void> =>
    api.delete<void>(`/teacher/grammar/${grammarId}`),

  /**
   * POST /api/teacher/grammar/{grammarId}/submit
   * Submits a grammar lesson for review (workflow transition from DRAFT → PENDING).
   */
  submitGrammar: async (grammarId: string): Promise<GrammarResponse> => {
    const grammar = await api.post<GrammarResponse>(`/teacher/grammar/${grammarId}/submit`);
    return normalizeGrammar(grammar);
  },

  /**
   * GET /api/teacher/grammar/{grammarId}/stats
   * Returns student engagement statistics for a grammar lesson.
   */
  getGrammarStats: async (grammarId: string): Promise<GrammarStatsResponse> => {
    const stats = await api.get<GrammarStatsResponse>(`/teacher/grammar/${grammarId}/stats`);
    return stats;
  },
};

import { api } from "./client";
import type {
  GrammarResponse,
  GrammarListParams,
  GrammarLevel,
} from "./types";

// Re-export types for consumers
export type { GrammarResponse, GrammarListParams, GrammarLevel };

// ─── Student Grammar API ─────────────────────────────────────────────────────────

export const studentGrammarApi = {
  /**
   * GET /api/student/grammar
   * Lists all approved grammars available for students.
   * Supports optional query params: level, search.
   */
  getGrammars: async (params?: GrammarListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    return api.get<GrammarResponse[]>(
      `/student/grammar${qs ? `?${qs}` : ""}`
    );
  },

  /**
   * GET /api/student/grammar/{grammarId}
   * Returns approved grammar detail.
   */
  getGrammarById: async (grammarId: string) => {
    return api.get<GrammarResponse>(`/student/grammar/${grammarId}`);
  },

  /**
   * Convenience wrapper: get all grammars filtered by level.
   */
  getGrammarsByLevel: async (level: GrammarLevel) => {
    return studentGrammarApi.getGrammars({ level });
  },

  /**
   * Convenience wrapper: search grammars by keyword.
   */
  searchGrammars: async (keyword: string) => {
    return studentGrammarApi.getGrammars({ search: keyword });
  },
};

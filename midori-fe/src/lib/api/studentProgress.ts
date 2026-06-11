import { api } from "./client";
import type {
  ProgressResponse,
  ProgressStatsResponse,
  ProgressUpdateRequest,
  ProgressListParams,
  ProgressContentType,
} from "./types";

// Re-export types for consumers
export type {
  ProgressResponse,
  ProgressStatsResponse,
  ProgressUpdateRequest,
  ProgressListParams,
  ProgressContentType,
};

// ─── Helper ────────────────────────────────────────────────────────────────────────

function buildProgressQuery(params: ProgressListParams): string {
  const searchParams = new URLSearchParams();
  if (params.contentType) searchParams.set("contentType", params.contentType);
  if (params.contentId) searchParams.set("contentId", params.contentId);
  if (params.isLearned !== undefined) searchParams.set("isLearned", String(params.isLearned));
  if (params.isMastered !== undefined) searchParams.set("isMastered", String(params.isMastered));
  if (params.isFavorite !== undefined) searchParams.set("isFavorite", String(params.isFavorite));
  if (params.isCompleted !== undefined) searchParams.set("isCompleted", String(params.isCompleted));
  return searchParams.toString();
}

// ─── Student Progress API ──────────────────────────────────────────────────────────

export const studentProgressApi = {
  /**
   * GET /api/student/progress
   * Lists progress records for the authenticated student.
   * Supports optional query params: contentType, contentId, isLearned, isMastered, isFavorite, isCompleted.
   */
  getProgress: async (params?: ProgressListParams) => {
    const qs = params ? buildProgressQuery(params) : "";
    return api.get<ProgressResponse[]>(
      `/student/progress${qs ? `?${qs}` : ""}`
    );
  },

  /**
   * GET /api/student/progress/stats
   * Returns aggregated progress statistics for the authenticated student.
   */
  getStats: async () => {
    return api.get<ProgressStatsResponse>("/student/progress/stats");
  },

  /**
   * PUT /api/student/progress/{contentType}/{contentId}
   * Updates progress for a specific content item.
   */
  updateProgress: async (
    contentType: ProgressContentType,
    contentId: string,
    data: ProgressUpdateRequest
  ) => {
    return api.put<ProgressResponse>(
      `/student/progress/${contentType}/${contentId}`,
      data
    );
  },

  /**
   * POST /api/student/progress/{contentType}/{contentId}/learned
   * Marks a content item as learned.
   */
  markAsLearned: async (contentType: ProgressContentType, contentId: string) => {
    return api.post<ProgressResponse>(
      `/student/progress/${contentType}/${contentId}/learned`
    );
  },

  /**
   * POST /api/student/progress/{contentType}/{contentId}/mastered
   * Marks a content item as mastered.
   */
  markAsMastered: async (contentType: ProgressContentType, contentId: string) => {
    return api.post<ProgressResponse>(
      `/student/progress/${contentType}/${contentId}/mastered`
    );
  },

  /**
   * POST /api/student/progress/{contentType}/{contentId}/favorite
   * Toggles favorite status for a content item.
   */
  toggleFavorite: async (contentType: ProgressContentType, contentId: string) => {
    return api.post<ProgressResponse>(
      `/student/progress/${contentType}/${contentId}/favorite`
    );
  },

  /**
   * POST /api/student/progress/{contentType}/{contentId}/complete
   * Marks a content item as completed.
   */
  markAsCompleted: async (contentType: ProgressContentType, contentId: string) => {
    return api.post<ProgressResponse>(
      `/student/progress/${contentType}/${contentId}/complete`
    );
  },
};

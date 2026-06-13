import { api } from "./client";
import type {
  ContentType,
  ProgressResponse,
  ProgressStatsResponse,
  ProgressListParams,
} from "./types";

// Re-export shared types for consumers
export type { ContentType, ProgressResponse, ProgressStatsResponse, ProgressListParams };

// ─── Student Progress API ─────────────────────────────────────────────────────────

export const studentProgressApi = {
  /**
   * GET /api/student/progress
   * Lists all progress entries for the current user.
   * Supports optional contentType filter.
   */
  getProgress: async (params?: ProgressListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.contentType) searchParams.set("contentType", params.contentType);
    const qs = searchParams.toString();
    return api.get<ProgressResponse[]>(
      `/student/progress${qs ? `?${qs}` : ""}`
    );
  },

  /**
   * GET /api/student/progress/stats
   * Returns progress statistics for the current user.
   */
  getProgressStats: async () => {
    return api.get<ProgressStatsResponse>("/student/progress/stats");
  },

  /**
   * POST /api/student/progress/{contentType}/{contentId}/learned
   * Marks content as learned.
   */
  markAsLearned: async (contentType: ContentType, contentId: string) => {
    return api.post<ProgressResponse>(
      `/student/progress/${contentType}/${encodeURIComponent(contentId)}/learned`
    );
  },

  /**
   * DELETE /api/student/progress/{contentType}/{contentId}/learned
   * Unmarks content as learned (sets learned=false, mastered=false).
   */
  unmarkAsLearned: async (contentType: ContentType, contentId: string) => {
    return api.delete<ProgressResponse>(
      `/student/progress/${contentType}/${encodeURIComponent(contentId)}/learned`
    );
  },

  /**
   * POST /api/student/progress/{contentType}/{contentId}/mastered
   * Marks content as mastered.
   */
  markAsMastered: async (contentType: ContentType, contentId: string) => {
    return api.post<ProgressResponse>(
      `/student/progress/${contentType}/${encodeURIComponent(contentId)}/mastered`
    );
  },

  /**
   * DELETE /api/student/progress/{contentType}/{contentId}/mastered
   * Unmarks content as mastered (sets mastered=false, learned=true).
   */
  unmarkAsMastered: async (contentType: ContentType, contentId: string) => {
    return api.delete<ProgressResponse>(
      `/student/progress/${contentType}/${encodeURIComponent(contentId)}/mastered`
    );
  },

  /**
   * POST /api/student/progress/{contentType}/{contentId}/favorite
   * Toggles favorite status for content.
   */
  toggleFavorite: async (contentType: ContentType, contentId: string) => {
    return api.post<ProgressResponse>(
      `/student/progress/${contentType}/${encodeURIComponent(contentId)}/favorite`
    );
  },

  /**
   * POST /api/student/progress/{contentType}/{contentId}/complete
   * Marks lesson as completed.
   */
  markAsCompleted: async (contentType: ContentType, contentId: string) => {
    return api.post<ProgressResponse>(
      `/student/progress/${contentType}/${encodeURIComponent(contentId)}/complete`
    );
  },

  /**
   * DELETE /api/student/progress/{contentType}/{contentId}/complete
   * Unmarks lesson as completed (sets completed=false).
   */
  unmarkAsCompleted: async (contentType: ContentType, contentId: string) => {
    return api.delete<ProgressResponse>(
      `/student/progress/${contentType}/${encodeURIComponent(contentId)}/complete`
    );
  },
};

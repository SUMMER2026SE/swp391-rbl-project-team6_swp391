import { api } from "./client";
import {
  type ListeningLessonResponse,
  type ListeningDetailResponse,
  type ListeningItemResponse,
} from "./listening";

// ─── Teacher Listening API ──────────────────────────────────────────────────────

export const listeningApi = {
  /**
   * GET /api/admin/listening
   * Lists all listening lessons for teacher management.
   */
  getTeacherListenings: async () => {
    return api.get<ListeningLessonResponse[]>("/admin/listening");
  },

  /**
   * GET /api/admin/listening/{id}
   * Returns listening lesson detail with all listening items.
   */
  getListeningById: async (id: string) => {
    return api.get<ListeningDetailResponse>(`/admin/listening/${id}`);
  },

  /**
   * POST /api/admin/listening
   * Creates a new listening lesson with its items.
   */
  createListening: async (data: unknown) => {
    return api.post<ListeningDetailResponse>("/admin/listening", data);
  },

  /**
   * PUT /api/admin/listening/{id}
   * Updates an existing listening lesson with its items.
   */
  updateListening: async (id: string, data: unknown) => {
    return api.put<ListeningDetailResponse>(`/admin/listening/${id}`, data);
  },

  /**
   * DELETE /api/admin/listening/{id}
   * Deletes a listening lesson.
   */
  deleteListening: (id: string) => api.delete<void>(`/admin/listening/${id}`),

  /**
   * GET /api/admin/listening/{id}/items
   */
  getItems: (id: string) =>
    api.get<ListeningItemResponse[]>(`/admin/listening/${id}/items`),

  /**
   * POST /api/admin/listening/{id}/items
   */
  createItem: (id: string, data: unknown) =>
    api.post<ListeningItemResponse>(`/admin/listening/${id}/items`, data),

  /**
   * PUT /api/admin/listening/{id}/items/{itemId}
   */
  updateItem: (id: string, itemId: string, data: unknown) =>
    api.put<ListeningItemResponse>(`/admin/listening/${id}/items/${itemId}`, data),

  /**
   * DELETE /api/admin/listening/{id}/items/{itemId}
   */
  deleteItem: (id: string, itemId: string) =>
    api.delete<void>(`/admin/listening/${id}/items/${itemId}`),
};
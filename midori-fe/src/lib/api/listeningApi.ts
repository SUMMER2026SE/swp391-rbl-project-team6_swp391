import { api } from "./client";
import {
  type ListeningLessonWithQuestionsRequest,
  type ListeningQuestionResponse,
  type ListeningLessonResponse,
  type ListeningDetailResponse,
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
   * Returns listening lesson detail with questions.
   */
  getListeningById: async (id: string) => {
    return api.get<ListeningDetailResponse>(`/admin/listening/${id}`);
  },

  /**
   * POST /api/admin/listening
   * Creates a new listening lesson with questions.
   */
  createListening: async (data: ListeningLessonWithQuestionsRequest) => {
    return api.post<ListeningDetailResponse>("/admin/listening", data);
  },

  /**
   * PUT /api/admin/listening/{id}
   * Updates an existing listening lesson with questions.
   */
  updateListening: async (id: string, data: ListeningLessonWithQuestionsRequest) => {
    return api.put<ListeningDetailResponse>(`/admin/listening/${id}`, data);
  },

  /**
   * DELETE /api/admin/listening/{id}
   * Deletes a listening lesson.
   */
  deleteListening: (id: string) => api.delete<void>(`/admin/listening/${id}`),
};

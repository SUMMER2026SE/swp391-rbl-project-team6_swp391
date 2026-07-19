import { api } from "./client";

// ─── Listening Item DTOs (mirroring backend ListeningItem) ──────────────────────

export interface ListeningItemResponse {
  id: string;
  listeningLessonId: string;
  questionOrder: number;
  audioUrl: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListeningLessonResponse {
  id: string;
  lessonId: string | null;
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  transcript: string | null;
  estimatedMinutes: number | null;
  difficulty: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListeningDetailResponse extends ListeningLessonResponse {
  listeningItems: ListeningItemResponse[];
}

// ─── Student Listening API ─────────────────────────────────────────────────────

export const studentListeningApi = {
  /**
   * GET /api/student/listening
   * Lists active listening lessons.
   * Supports optional query param: level.
   */
  getListeningLessons: async (params?: { level?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    const qs = searchParams.toString();
    return api.get<ListeningLessonResponse[]>(`/student/listening${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /api/student/listening/{id}
   * Returns active listening lesson detail with all listening items.
   */
  getListeningLesson: async (id: string) => {
    return api.get<ListeningDetailResponse>(`/student/listening/${id}`);
  },

  /**
   * GET /api/student/listening/level/{jlptLevel}
   * Lists active listening lessons filtered by JLPT level.
   */
  getListeningLessonsByLevel: async (level: string) => {
    return api.get<ListeningLessonResponse[]>(`/student/listening/level/${level}`);
  },
};

// ─── Admin Listening API ───────────────────────────────────────────────────────

export const adminListeningApi = {
  /**
   * GET /api/admin/listening
   * Lists all listening lessons.
   */
  getAdminListeningLessons: async (params?: {
    level?: string;
    isActive?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
    const qs = searchParams.toString();
    return api.get<ListeningLessonResponse[]>(`/admin/listening${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /api/admin/listening/{id}
   * Returns listening lesson detail with all listening items.
   */
  getAdminListeningLesson: async (id: string) => {
    return api.get<ListeningDetailResponse>(`/admin/listening/${id}`);
  },

  /**
   * POST /api/admin/listening
   * Creates a new listening lesson with its items.
   */
  createListeningLesson: async (data: unknown) => {
    return api.post<ListeningDetailResponse>("/admin/listening", data);
  },

  /**
   * PUT /api/admin/listening/{id}
   * Updates an existing listening lesson with its items.
   */
  updateListeningLesson: async (id: string, data: unknown) => {
    return api.put<ListeningDetailResponse>(`/admin/listening/${id}`, data);
  },

  /**
   * DELETE /api/admin/listening/{id}
   * Deletes a listening lesson.
   */
  deleteListeningLesson: (id: string) => api.delete<void>(`/admin/listening/${id}`),

  /**
   * PATCH /api/admin/listening/{id}/publish
   */
  publishListeningLesson: (id: string) =>
    api.patch<ListeningLessonResponse>(`/admin/listening/${id}/publish`),

  /**
   * PATCH /api/admin/listening/{id}/unpublish
   */
  unpublishListeningLesson: (id: string) =>
    api.patch<ListeningLessonResponse>(`/admin/listening/${id}/unpublish`),

  /**
   * POST /api/admin/listening/{id}/items
   * Adds a single listening item to a lesson.
   */
  createListeningItem: (lessonId: string, data: unknown) =>
    api.post<ListeningItemResponse>(`/admin/listening/${lessonId}/items`, data),

  /**
   * PUT /api/admin/listening/{id}/items/{itemId}
   * Updates a single listening item.
   */
  updateListeningItem: (lessonId: string, itemId: string, data: unknown) =>
    api.put<ListeningItemResponse>(`/admin/listening/${lessonId}/items/${itemId}`, data),

  /**
   * DELETE /api/admin/listening/{id}/items/{itemId}
   * Deletes a single listening item.
   */
  deleteListeningItem: (lessonId: string, itemId: string) =>
    api.delete<void>(`/admin/listening/${lessonId}/items/${itemId}`),
};

// ─── Admin File Upload (used by AudioUploader) ──────────────────────────────

export const adminUploadApi = {
  /**
   * POST /api/admin/uploads/audio (multipart/form-data)
   * Uploads a single audio file to Supabase storage and returns
   * its public URL. The returned URL should be stored as the
   * `audioUrl` field on a listening item.
   */
  uploadAudio: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.uploadFile<string>("/admin/uploads/audio", formData, onProgress);
  },
};
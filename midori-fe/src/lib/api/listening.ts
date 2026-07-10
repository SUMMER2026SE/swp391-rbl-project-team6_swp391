import { api } from "./client";
import {
  type ListeningLessonWithQuestionsRequest,
  type ListeningQuestionRequest,
} from "@/types/content-library";

// ─── Listening Question DTOs (mirroring backend) ─────────────────────────────────

export interface ListeningQuestionResponse {
  id: string;
  listeningLessonId: string;
  questionOrder: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  questionType: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListeningLessonResponse {
  id: string;
  jlptLevel: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  audioUrl: string | null;
  transcript: string | null;
  estimatedMinutes: number | null;
  difficulty: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListeningDetailResponse extends ListeningLessonResponse {
  questions: ListeningQuestionResponse[];
}

// ─── Student Listening API ─────────────────────────────────────────────────────

export const studentListeningApi = {
  /**
   * GET /api/student/listenings
   * Lists active listening lessons.
   * Supports optional query param: level.
   */
  getListeningLessons: async (params?: { level?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    const qs = searchParams.toString();
    return api.get<ListeningLessonResponse[]>(`/student/listenings${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /api/student/listenings/{id}
   * Returns active listening lesson detail with questions.
   */
  getListeningLesson: async (id: string) => {
    return api.get<ListeningDetailResponse>(`/student/listenings/${id}`);
  },

  /**
   * GET /api/student/listenings/level/{jlptLevel}
   * Lists active listening lessons filtered by JLPT level.
   */
  getListeningLessonsByLevel: async (level: string) => {
    return api.get<ListeningLessonResponse[]>(`/student/listenings/level/${level}`);
  },
};

// ─── Admin Listening API ───────────────────────────────────────────────────────

export const adminListeningApi = {
  /**
   * GET /api/admin/listening
   * Lists all listening lessons.
   * Supports optional query params: level, difficulty, isActive.
   */
  getAdminListeningLessons: async (params?: {
    level?: string;
    difficulty?: string;
    isActive?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.difficulty) searchParams.set("difficulty", params.difficulty);
    if (params?.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
    const qs = searchParams.toString();
    return api.get<ListeningLessonResponse[]>(`/admin/listening${qs ? `?${qs}` : ""}`);
  },

  /**
   * GET /api/admin/listening/{id}
   * Returns listening lesson detail with questions.
   */
  getAdminListeningLesson: async (id: string) => {
    return api.get<ListeningDetailResponse>(`/admin/listening/${id}`);
  },

  /**
   * POST /api/admin/listening
   * Creates a new listening lesson with questions.
   */
  createListeningLesson: async (data: ListeningLessonWithQuestionsRequest) => {
    return api.post<ListeningDetailResponse>("/admin/listening", data);
  },

  /**
   * PUT /api/admin/listening/{id}
   * Updates an existing listening lesson with questions.
   */
  updateListeningLesson: async (id: string, data: ListeningLessonWithQuestionsRequest) => {
    return api.put<ListeningDetailResponse>(`/admin/listening/${id}`, data);
  },

  /**
   * DELETE /api/admin/listening/{id}
   * Deletes a listening lesson.
   */
  deleteListeningLesson: (id: string) => api.delete<void>(`/admin/listening/${id}`),

  /**
   * PATCH /api/admin/listening/{id}/publish
   * Publishes a listening lesson.
   */
  publishListeningLesson: (id: string) =>
    api.patch<ListeningLessonResponse>(`/admin/listening/${id}/publish`),

  /**
   * PATCH /api/admin/listening/{id}/unpublish
   * Unpublishes a listening lesson.
   */
  unpublishListeningLesson: (id: string) =>
    api.patch<ListeningLessonResponse>(`/admin/listening/${id}/unpublish`),
};

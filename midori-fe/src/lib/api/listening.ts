import { api } from "./client";

export interface ListeningResponse {
  id: string;
  level: string;
  teacherId: string;
  teacherName: string;
  title: string;
  audioUrl?: string | null;
  audioFileName?: string | null;
  audioType?: string | null;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  topic?: string | null;
}

export interface ListeningDetailResponse extends ListeningResponse {
  answerKey?: string | null;
  transcript?: string | null;
}

export interface CreateListeningPayload {
  level: string;
  title: string;
  audioFile?: File | null;
  answerKey?: string;
  transcript?: string;
  topic?: string;
}

export interface UpdateListeningPayload {
  level?: string;
  title?: string;
  audioFile?: File | null;
  audioUrl?: string;
  audioFileName?: string;
  audioType?: string;
  answerKey?: string;
  transcript?: string;
  status?: string;
  topic?: string;
}

export interface LevelResponse {
  id: string;
  name: string;
}

export const listeningApi = {
  // Teacher APIs
  getTeacherListenings: (params?: { level?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    if (params?.status) searchParams.set("status", params.status);
    const qs = searchParams.toString();
    return api.get<ListeningResponse[]>(`/teacher/listenings${qs ? `?${qs}` : ""}`);
  },

  getListeningById: (id: string) =>
    api.get<ListeningDetailResponse>(`/teacher/listenings/${id}`),

  createListening: (payload: CreateListeningPayload) => {
    const formData = new FormData();
    formData.append("level", payload.level);
    formData.append("title", payload.title);
    if (payload.audioFile) {
      formData.append("audioFile", payload.audioFile);
    }
    if (payload.answerKey !== undefined) {
      formData.append("answerKey", payload.answerKey);
    }
    if (payload.transcript !== undefined) {
      formData.append("transcript", payload.transcript);
    }
    if (payload.topic !== undefined) {
      formData.append("topic", payload.topic);
    }
    return api.post<ListeningDetailResponse>("/teacher/listenings", formData);
  },

  updateListening: (id: string, payload: UpdateListeningPayload) => {
    const formData = new FormData();
    if (payload.level) formData.append("level", payload.level);
    if (payload.title) formData.append("title", payload.title);
    if (payload.audioFile) {
      formData.append("audioFile", payload.audioFile);
    } else {
      if (payload.audioUrl) formData.append("audioUrl", payload.audioUrl);
      if (payload.audioFileName) formData.append("audioFileName", payload.audioFileName);
      if (payload.audioType) formData.append("audioType", payload.audioType);
    }
    if (payload.answerKey !== undefined) {
      formData.append("answerKey", payload.answerKey);
    }
    if (payload.transcript !== undefined) {
      formData.append("transcript", payload.transcript);
    }
    if (payload.status) formData.append("status", payload.status);
    if (payload.topic !== undefined) {
      formData.append("topic", payload.topic);
    }
    return api.put<ListeningDetailResponse>(`/teacher/listenings/${id}`, formData);
  },

  deleteListening: (id: string) =>
    api.delete<void>(`/teacher/listenings/${id}`),

  // Student APIs (prepare for API-12)
  getStudentListenings: (params?: { level?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    const qs = searchParams.toString();
    return api.get<ListeningResponse[]>(`/student/listenings${qs ? `?${qs}` : ""}`);
  },

  getStudentListeningById: (id: string) =>
    api.get<ListeningDetailResponse>(`/student/listenings/${id}`),
};

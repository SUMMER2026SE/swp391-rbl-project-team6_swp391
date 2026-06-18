import { api } from "./client";
import { mockListening } from "@/mock/listening";

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
  meaning?: string | null;
  transcript?: string | null;
  topic?: string | null;
  exerciseType?: "DICTATION" | "BLANK_FILL" | "MULTIPLE_CHOICE" | string;
  mode?: "dictation" | "quiz" | "both";
  questions?: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }[];
}

export interface ListeningDetailResponse extends ListeningResponse {
  meaning?: string | null;
  transcript?: string | null;
}

export interface CreateListeningPayload {
  level: string;
  title: string;
  type: string;
  exerciseType?: "DICTATION" | "BLANK_FILL" | string;
  audioFile?: File | null;
  meaning?: string;
  transcript?: string;
  topic?: string;
}

export interface UpdateListeningPayload {
  level?: string;
  title?: string;
  type?: string;
  exerciseType?: "DICTATION" | "BLANK_FILL" | string;
  audioFile?: File | null;
  audioUrl?: string;
  audioFileName?: string;
  audioType?: string;
  meaning?: string;
  transcript?: string;
  topic?: string;
}

export interface LevelResponse {
  id: string;
  name: string;
}

const mapTypeToBackend = (type?: string): string => {
  if (!type) return "DICTATION";
  const upper = type.trim().toUpperCase();
  if (upper === "BLANK FILL" || upper === "BLANK_FILL") return "BLANK_FILL";
  if (upper === "MULTIPLE CHOICE" || upper === "MULTIPLE_CHOICE") return "MULTIPLE_CHOICE";
  return "DICTATION";
};

// Convert mock data to API format
const mockToApi = (mock: typeof mockListening[number]): ListeningResponse => {
  return {
    id: mock.id,
    level: mock.jlptLevel,
    teacherId: "mock-teacher",
    teacherName: "Mock Teacher",
    title: mock.title,
    audioUrl: mock.audioUrl,
    audioFileName: mock.audioUrl?.split("/").pop() || null,
    audioType: "audio/mpeg",
    status: "published",
    approvedBy: "mock-admin",
    approvedAt: mock.updatedAt,
    createdAt: mock.createdAt,
    updatedAt: mock.updatedAt,
    meaning: JSON.stringify({
      text: "",
      type: mock.mode === "quiz" ? "Multiple Choice" : "Dictation",
      blankWords: []
    }),
    transcript: typeof mock.transcript === "string" ? mock.transcript : mock.transcript?.raw || "",
    topic: mock.tags[0] || "General",
    exerciseType: mock.mode === "quiz" ? "MULTIPLE_CHOICE" : mock.mode === "dictation" ? "DICTATION" : "DICTATION",
    mode: mock.mode || "dictation",
    questions: mock.questions,
  };
};

export const listeningApi = {
  // Teacher APIs
  getTeacherListenings: (params?: { level?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.level) searchParams.set("level", params.level);
    const qs = searchParams.toString();
    return api.get<ListeningResponse[]>(`/teacher/listenings${qs ? `?${qs}` : ""}`);
  },

  getListeningById: (id: string) =>
    api.get<ListeningDetailResponse>(`/teacher/listenings/${id}`),

  createListening: (payload: CreateListeningPayload) => {
    const formData = new FormData();
    formData.append("level", payload.level);
    formData.append("title", payload.title);
    formData.append("exerciseType", payload.exerciseType ?? mapTypeToBackend(payload.type));
    if (payload.audioFile) {
      formData.append("audioFile", payload.audioFile);
    }
    if (payload.meaning !== undefined) {
      formData.append("meaning", payload.meaning);
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
    if (payload.type || payload.exerciseType) {
      formData.append("exerciseType", payload.exerciseType ?? mapTypeToBackend(payload.type));
    }
    if (payload.audioFile) {
      formData.append("audioFile", payload.audioFile);
    } else {
      if (payload.audioUrl) formData.append("audioUrl", payload.audioUrl);
      if (payload.audioFileName) formData.append("audioFileName", payload.audioFileName);
      if (payload.audioType) formData.append("audioType", payload.audioType);
    }
    if (payload.meaning !== undefined) {
      formData.append("meaning", payload.meaning);
    }
    if (payload.transcript !== undefined) {
      formData.append("transcript", payload.transcript);
    }
    if (payload.topic !== undefined) {
      formData.append("topic", payload.topic);
    }
    return api.put<ListeningDetailResponse>(`/teacher/listenings/${id}`, formData);
  },

  deleteListening: (id: string) =>
    api.delete<void>(`/teacher/listenings/${id}`),

  // Student APIs with mock data fallback
  getStudentListenings: async (params?: { level?: string }): Promise<ListeningResponse[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.level) searchParams.set("level", params.level);
      const qs = searchParams.toString();
      const response = await api.get<ListeningResponse[]>(`/student/listenings${qs ? `?${qs}` : ""}`);
      // If API returns empty, null, or undefined, fallback to mock
      if (!response || (Array.isArray(response) && response.length === 0)) {
        let filtered = mockListening;
        if (params?.level) {
          filtered = mockListening.filter(item => item.jlptLevel === params.level);
        }
        return filtered.map(mockToApi);
      }
      return response;
    } catch (error) {
      console.warn("API unavailable, using mock data:", error);
      // Fallback to mock data - always use mock for student view
      let filtered = mockListening;
      if (params?.level) {
        filtered = mockListening.filter(item => item.jlptLevel === params.level);
      }
      return filtered.map(mockToApi);
    }
  },

  getStudentListeningById: async (id: string): Promise<ListeningDetailResponse> => {
    try {
      const response = await api.get<ListeningDetailResponse>(`/student/listenings/${id}`);
      return response;
    } catch (error) {
      console.warn("API unavailable, using mock data:", error);
      // Fallback to mock data - check mock data first
      const mockItem = mockListening.find(item => item.id === id);
      if (mockItem) {
        return {
          ...mockToApi(mockItem),
          meaning: mockItem.transcript?.toString() || "",
          transcript: typeof mockItem.transcript === "string" ? mockItem.transcript : mockItem.transcript?.raw || "",
        };
      }
      throw new Error("Listening not found");
    }
  },
};

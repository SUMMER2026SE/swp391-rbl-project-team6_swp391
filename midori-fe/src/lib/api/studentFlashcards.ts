import { api } from "./client";

export interface FlashcardCardResponse {
  id: string;
  frontText: string;
  backText: string;
  example?: string;
  hint?: string;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlashcardSetResponse {
  id: string;
  title: string;
  description?: string;
  level: string;
  status: string;
  rejectReason?: string;
  teacherId?: string;
  teacherName?: string;
  ownedByMe?: boolean;
  cardCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlashcardSetDetailResponse {
  id: string;
  title: string;
  description?: string;
  level: string;
  status: string;
  rejectReason?: string;
  teacherId?: string;
  teacherName?: string;
  ownedByMe?: boolean;
  cardCount: number;
  cards: FlashcardCardResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgressResponse {
  id: string;
  contentType: string;
  contentId: string;
  learned: boolean;
  mastered: boolean;
  favorite: boolean;
  completed: boolean;
  progressPercent: number;
  lastStudiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentFlashcardsParams {
  level?: string;
  search?: string;
}

export const studentFlashcardsApi = {
  listFlashcardSets: async (params?: StudentFlashcardsParams): Promise<FlashcardSetResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params?.level && params.level !== "All") {
      searchParams.set("level", params.level);
    }
    if (params?.search) {
      searchParams.set("search", params.search);
    }
    const qs = searchParams.toString();
    return api.get<FlashcardSetResponse[]>(`/student/flashcard-sets${qs ? `?${qs}` : ""}`);
  },

  getFlashcardSet: async (setId: string): Promise<FlashcardSetDetailResponse> => {
    return api.get<FlashcardSetDetailResponse>(`/student/flashcard-sets/${setId}`);
  },

  getProgressList: async (): Promise<ProgressResponse[]> => {
    return api.get<ProgressResponse[]>("/student/progress?contentType=FLASHCARD");
  },

  markCardMastered: async (cardId: string): Promise<ProgressResponse> => {
    return api.post<ProgressResponse>(`/student/progress/FLASHCARD/${cardId}/mastered`);
  },

  unmarkCardMastered: async (cardId: string): Promise<ProgressResponse> => {
    return api.put<ProgressResponse>(`/student/progress/FLASHCARD/${cardId}`, {
      mastered: false,
      learned: false,
      progressPercent: 0,
    });
  },
};

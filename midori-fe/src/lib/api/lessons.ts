import { api } from "./client";

export type SkillStatus = "AVAILABLE" | "COMING_SOON";

export type SkillType = "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";

export interface LessonResponse {
  id: string;
  level: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export const lessonsApi = {
  /**
   * GET /api/lessons
   * Single source of truth list of all lessons across skills.
   */
  getAllLessons: async () => {
    return api.get<LessonResponse[]>("/lessons");
  },

  /**
   * GET /api/lessons?level=N5
   * Optional level filter for lesson list.
   */
  getLessonsByLevel: async (level: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set("level", level);
    return api.get<LessonResponse[]>(`/lessons?${searchParams.toString()}`);
  },
};
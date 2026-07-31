import { api } from "./client";

export interface TeacherQuestionResponse {
  id: string;
  teacherId: string;
  topicId?: string;
  level?: string;
  skill?: string;
  lessonId?: number;
  prompt: string;
  source?: string; // "HOMEWORK" | "EXAM"
  jpPrompt?: string;
  questionType: string;
  difficulty: string;
  correctAnswerIndex: number;
  explanation?: string;
  tags?: string;
  status: string;
  points: number;
  options: string[];
  audioUrl?: string;
  audioFileName?: string;
  audioDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherQuestionRequest {
  topicId?: string;
  level?: string;
  skill?: string;
  lessonId?: number;
  source?: string; // "HOMEWORK" | "EXAM"
  prompt: string;
  jpPrompt?: string;
  questionType: string;
  difficulty?: string;
  correctAnswerIndex: number;
  explanation?: string;
  tags?: string;
  points?: number;
  options: string[];
  audioUrl?: string;
  audioFileName?: string;
  audioDuration?: number;
}

export interface UpdateTeacherQuestionRequest {
  topicId?: string;
  level?: string;
  skill?: string;
  lessonId?: number;
  prompt: string;
  jpPrompt?: string;
  questionType: string;
  difficulty?: string;
  correctAnswerIndex: number;
  explanation?: string;
  tags?: string;
  points?: number;
  status?: string;
  options: string[];
  audioUrl?: string;
  audioFileName?: string;
  audioDuration?: number;
}

export interface QuestionBankLessonResponse {
  id: number;
  level: string;
  lessonNumber: number;
  lessonName: string;
  status: string;
  createdAt: string;
}

export interface QuestionBankGeneratorLessonResponse {
  id: number;
  name: string;
  level: string;
  easy: number;
  medium: number;
  hard: number;
  questionCount: number;
}

export const teacherQuestionsApi = {
  createQuestion: (req: CreateTeacherQuestionRequest) =>
    api.post<TeacherQuestionResponse>("/teacher/questions", req),
  updateQuestion: (id: string, req: UpdateTeacherQuestionRequest) =>
    api.put<TeacherQuestionResponse>(`/teacher/questions/${id}`, req),
  deleteQuestion: (id: string) => api.delete<void>(`/teacher/questions/${id}`),
  getQuestions: (level?: string) => api.get<TeacherQuestionResponse[]>(level ? `/teacher/questions?level=${level}` : "/teacher/questions"),
  getQuestionById: (id: string) => api.get<TeacherQuestionResponse>(`/teacher/questions/${id}`),

  // Lessons
  getLessons: (level?: string) =>
    api.get<QuestionBankLessonResponse[]>(level ? `/teacher/questions/lessons?level=${level}` : `/teacher/questions/lessons`),
  createLesson: (lesson: Omit<QuestionBankLessonResponse, "id" | "createdAt">) =>
    api.post<QuestionBankLessonResponse>("/teacher/questions/lessons", lesson),
  updateLesson: (id: number, lessonName: string, lessonNumber?: number, status?: string) =>
    api.put<QuestionBankLessonResponse>(`/teacher/questions/lessons/${id}`, {
      lessonName,
      lessonNumber,
      status,
    }),
  deleteLesson: (id: number) => api.delete<void>(`/teacher/questions/lessons/${id}`),

  // Question Bank Integration
  getQuestionBankLevels: () => api.get<string[]>("/question-bank/levels"),
  getQuestionBankSkills: () => api.get<string[]>("/question-bank/skills"),
  getQuestionBankLessons: (level: string, skills: string[]) =>
    api.get<QuestionBankGeneratorLessonResponse[]>(
      `/question-bank/lessons?level=${level}&${skills.map((s) => `skills=${s}`).join("&")}`,
    ),
  getLessonsByLevel: (level: string) =>
    api.get<QuestionBankLessonResponse[]>(`/question-bank/levels/${level}/lessons`),
  randomizeQuestions: (req: {
    level: string;
    skills: string[];
    lessonIds: number[];
    difficulty: { easy: number; medium: number; hard: number };
    questionCount: number;
  }) => api.post<TeacherQuestionResponse[]>("/question-bank/randomize", req),
  generatePreview: (req: {
    level: string;
    lessonIds: number[];
    skills: string[];
    difficulty: { easy: number; medium: number; hard: number };
  }) => api.post<TeacherQuestionResponse[]>("/homework/question-bank/generate-preview", req),
};

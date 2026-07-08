import { api } from "./client";

export interface TeacherQuestionResponse {
  id: string;
  teacherId: string;
  topicId?: string;
  prompt: string;
  jpPrompt?: string;
  questionType: string;
  difficulty: string;
  correctAnswerIndex: number;
  explanation?: string;
  tags?: string;
  status: string;
  points: number;
  options: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherQuestionRequest {
  topicId?: string;
  prompt: string;
  jpPrompt?: string;
  questionType: string;
  difficulty?: string;
  correctAnswerIndex: number;
  explanation?: string;
  tags?: string;
  points?: number;
  options: string[];
}

export interface UpdateTeacherQuestionRequest {
  topicId?: string;
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
}

export const teacherQuestionsApi = {
  createQuestion: (req: CreateTeacherQuestionRequest) =>
    api.post<TeacherQuestionResponse>("/teacher/questions", req),
  updateQuestion: (id: string, req: UpdateTeacherQuestionRequest) =>
    api.put<TeacherQuestionResponse>(`/teacher/questions/${id}`, req),
  deleteQuestion: (id: string) =>
    api.delete<void>(`/teacher/questions/${id}`),
  getQuestions: () =>
    api.get<TeacherQuestionResponse[]>("/teacher/questions"),
  getQuestionById: (id: string) =>
    api.get<TeacherQuestionResponse>(`/teacher/questions/${id}`),
};
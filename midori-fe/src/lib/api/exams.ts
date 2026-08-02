import { api } from "./client";

export interface CreateExamRequest {
  title: string;
  level: string;
  totalQuestions: number;
  timeLimit: number;
  examMode?: string;
  questionReuse?: string;
  randomizeAnswers?: boolean;
  lessonIds?: string[];
  category?: string;
  difficultyEasy?: number;
  difficultyMedium?: number;
  difficultyHard?: number;
  classIds?: string[];
  questionIds?: string[];
  status?: string;
}

export function mapExamUiStatus(status: string): "draft" | "published" | "pending" {
  switch (status?.toUpperCase()) {
    case "PUBLISHED":
      return "published";
    case "ARCHIVED":
      return "pending";
    default:
      return "draft";
  }
}

export interface ExamQuestionResponse {
  id: string;
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
  points: number;
  displayOrder?: number;
}

export interface ExamResponse {
  id: string;
  title: string;
  level: string;
  totalQuestions: number;
  timeLimit: number;
  examMode: string;
  questionReuse: string;
  randomizeAnswers: boolean;
  category?: string;
  difficultyEasy: number;
  difficultyMedium: number;
  difficultyHard: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt?: string;
  updatedAt?: string;
  classId?: string;
  className?: string;
  assignedClassId?: string;
  questions?: ExamQuestionResponse[];
}

export interface UpdateExamQuestionsPayloadItem {
  id?: string;
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
  points?: number;
  displayOrder?: number;
}

export interface UpdateExamQuestionsPayload {
  questions: UpdateExamQuestionsPayloadItem[];
}

export const examsApi = {
  getAllExams: () => api.get<ExamResponse[]>("/exams"),

  createExam: (req: CreateExamRequest) => api.post<ExamResponse>("/exams", req),

  publishExam: (id: string) => api.post<ExamResponse>(`/exams/${id}/publish`),

  assignExamToClass: (id: string, classId: string) =>
    api.post<ExamResponse>(`/exams/${id}/assign/${classId}`),

  deleteExam: (id: string) => api.delete<void>(`/exams/${id}`),

  getExamsByClass: (classId: string) => api.get<ExamResponse[]>(`/exams/class/${classId}`),

  getStudentExams: (studentId: string) =>
    api.get<any[]>(`/exams/student-exams/student/${studentId}`),

  startExam: (id: string, studentId: string) =>
    api.post<any>(`/exams/${id}/start?studentId=${studentId}`),

  submitExam: (studentExamId: string, req: { answers: (number | null)[]; textAnswers?: any[] }) =>
    api.post<any>(`/exams/student-exams/${studentExamId}/submit`, req),

  getExamsByTeacher: (teacherId: string) => api.get<ExamResponse[]>(`/exams/teacher/${teacherId}`),

  getExamById: (id: string) => api.get<ExamResponse>(`/exams/${id}`),

  updateExam: (id: string, req: Partial<CreateExamRequest>) =>
    api.put<ExamResponse>(`/exams/${id}`, req),

  generateExamFromQuestionBank: (req: {
    examTitle: string;
    description: string;
    jlptLevel: string;
    skills: string[];
    easyCount: number;
    mediumCount: number;
    hardCount: number;
  }) => api.post<ExamResponse>("/teacher/exams/generate-from-question-bank", req),

  previewGeneration: (req: {
    jlptLevel: string;
    skills: string[];
    easyCount: number;
    mediumCount: number;
    hardCount: number;
    questionSource: string;
  }) => api.post<any[]>("/teacher/exams/preview-generation", req),

  getQuestionStats: (level: string, source: string) =>
    api.get<Record<string, Record<string, number>>>(
      `/teacher/exams/questions-stats?level=${level}&source=${source}`,
    ),

  getSkills: () => api.get<string[]>("/teacher/exams/skills"),

  updateExamQuestions: (id: string, req: UpdateExamQuestionsPayload) =>
    api.put<ExamResponse>(`/exams/${id}/questions`, req),

  getStudentExamResultsByClass: (classId: string) =>
    api.get<StudentExamResponse[]>(`/exams/class/${classId}/results`),

  generateAiExam: (req: AiExamGenerateRequest) =>
    api.post<AiExamGenerateResponse>("/teacher/exams/ai-generate", req),
};

export interface StudentExamResponse {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  status: string;
  startedAt?: string;
  submittedAt?: string;
  score?: number;
  totalPoints?: number;
  percentage?: number;
}

export interface AiExamGenerateRequest {
  level: string;
  lessonId: number;
  skills: string[];
  difficulty: string;
  questionCount: number;
  /** Writing mode (only used when WRITING is the only skill).
   *  One of: MIXED_WRITING | JA_TO_VI_TRANSLATION | VI_TO_JA_TRANSLATION | SENTENCE_REORDER */
  writingMode?: string;
  /** Question type/format to generate. Null means MULTIPLE_CHOICE (backward-compatible). */
  questionFormat?: string;
}

export interface AiQuestionDto {
  type?: string;
  content?: string;
  difficulty?: string;
  explanation?: string;
  category?: string;
  answers?: { content?: string; isCorrect?: boolean }[];
}

export interface AiExamGenerateResponse {
  title?: string;
  description?: string;
  questions: AiQuestionDto[];
}

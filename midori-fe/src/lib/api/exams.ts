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

export function mapExamUiStatus(
  status: string,
): "draft" | "published" | "pending" {
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
  createExam: (req: CreateExamRequest) =>
    api.post<ExamResponse>("/exams", req),

  publishExam: (id: string) =>
    api.post<ExamResponse>(`/exams/${id}/publish`),

  assignExamToClass: (id: string, classId: string) =>
    api.post<ExamResponse>(`/exams/${id}/assign/${classId}`),

  deleteExam: (id: string) =>
    api.delete<void>(`/exams/${id}`),

  getExamsByClass: (classId: string) =>
    api.get<ExamResponse[]>(`/exams/class/${classId}`),

  getStudentExams: (studentId: string) =>
    api.get<any[]>(`/exams/student-exams/student/${studentId}`),

  startExam: (id: string, studentId: string) =>
    api.post<any>(`/exams/${id}/start?studentId=${studentId}`),

  submitExam: (studentExamId: string, req: { answers: Record<string, number> }) =>
    api.post<any>(`/exams/student-exams/${studentExamId}/submit`, req),

  getExamsByTeacher: (teacherId: string) =>
    api.get<ExamResponse[]>(`/exams/teacher/${teacherId}`),

  getExamById: (id: string) =>
    api.get<ExamResponse>(`/exams/${id}`),

  updateExam: (id: string, req: Partial<CreateExamRequest>) =>
    api.put<ExamResponse>(`/exams/${id}`, req),

  updateExamQuestions: (id: string, req: UpdateExamQuestionsPayload) =>
    api.put<ExamResponse>(`/exams/${id}/questions`, req),

  getStudentExamResultsByClass: (classId: string) =>
    api.get<StudentExamResponse[]>(`/exams/class/${classId}/results`),

  importExamFromPdf: (file: File, classId: string, level?: string, status?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("classId", classId);
    if (level) formData.append("level", level);
    if (status) formData.append("status", status);
    return api.post<{ jobId: string; status: string; message: string }>("/ai/exams/import", formData);
  },

  getImportStatus: (jobId: string) =>
    api.get<{ jobId: string; status: string; message: string; examId?: string }>(`/ai/exams/import/${jobId}`),
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

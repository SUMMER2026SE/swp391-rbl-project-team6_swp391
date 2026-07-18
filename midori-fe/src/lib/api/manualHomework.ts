import { api } from "./client";

export interface ManualHomeworkQuestionResponse {
  id: string;
  questionOrder: number;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "MATCHING";
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  skill?: "Vocabulary" | "Grammar" | "Reading" | "Listening" | "Kanji";
  imageUrl?: string;
}

export interface ManualHomeworkResponse {
  id: string;
  title: string;
  description?: string;
  level: string;
  type: "VOCABULARY" | "GRAMMAR" | "LISTENING" | "READING" | "KANJI" | "MIXED";
  status: "DRAFT" | "PUBLISHED";
  duration: number;
  teacherId: string;
  teacherName?: string;
  questionCount: number;
  version: number;
  questions?: ManualHomeworkQuestionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ManualHomeworkRequest {
  title: string;
  description?: string;
  level: string;
  type: "VOCABULARY" | "GRAMMAR" | "LISTENING" | "READING" | "KANJI" | "MIXED";
  status?: "DRAFT" | "PUBLISHED";
  duration: number;
  classId?: string;
  dueDate?: string;
  questions: Array<{
    id?: string | null;
    questionOrder: number;
    questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "MATCHING";
    content: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    points: number;
    skill?: "Vocabulary" | "Grammar" | "Reading" | "Listening" | "Kanji";
    imageUrl?: string;
  }>;
}

export interface AssignClassRequest {
  classId: string;
  dueDate: string;
}

export const manualHomeworkApi = {
  getManualHomeworks: () =>
    api.get<ManualHomeworkResponse[]>("/teacher/manual-homeworks"),
  getManualHomeworkById: (id: string) =>
    api.get<ManualHomeworkResponse>(`/teacher/manual-homeworks/${id}`),
  createManualHomework: (req: ManualHomeworkRequest) =>
    api.post<ManualHomeworkResponse>("/teacher/manual-homeworks", req),
  updateManualHomework: (id: string, req: ManualHomeworkRequest) =>
    api.put<ManualHomeworkResponse>(`/teacher/manual-homeworks/${id}`, req),
  deleteManualHomework: (id: string) =>
    api.delete<void>(`/teacher/manual-homeworks/${id}`),
  publishManualHomework: (id: string, req?: AssignClassRequest) =>
    api.post<ManualHomeworkResponse>(`/teacher/manual-homeworks/${id}/publish`, req),
  draftManualHomework: (id: string) =>
    api.patch<ManualHomeworkResponse>(`/teacher/manual-homeworks/${id}/draft`),
  duplicateManualHomework: (id: string) =>
    api.post<ManualHomeworkResponse>(`/teacher/manual-homeworks/${id}/duplicate`),
  assignManualHomework: (id: string, req: AssignClassRequest) =>
    api.post<void>(`/teacher/manual-homeworks/${id}/assign`, req),
};

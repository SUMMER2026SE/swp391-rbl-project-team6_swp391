import { api } from "./client";
import { TeacherQuestionResponse } from "./teacherQuestions";

export interface HomeworkResponse {
  id: string;
  classId: string;
  lessonId?: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  attempts: number;
  remainingAttempts?: number;
  timeLimit?: number;
  teacherName?: string;
  status: "DRAFT" | "ASSIGNED" | "CLOSED";
  totalQuestions?: number;
  submissionCount?: number;
  createdAt: string;
  updatedAt: string;
  questions?: TeacherQuestionResponse[];
}

export interface HomeworkSubmissionResponse {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submissionText?: string;
  attachmentUrl?: string;
  score?: number;
  feedback?: string;
  status: "SUBMITTED" | "GRADED";
  submittedAt: string;
  gradedAt?: string;
  gradedById?: string;
}

export interface CreateHomeworkRequest {
  classId: string;
  lessonId?: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  attempts?: number;
  timeLimit?: number;
  questionIds?: string[];
}

export interface UpdateHomeworkRequest {
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  attempts?: number;
  status: "DRAFT" | "ASSIGNED" | "CLOSED";
  timeLimit?: number;
  questionIds?: string[];
}

export interface GradeHomeworkRequest {
  score: number;
  feedback?: string;
}

export interface SubmitHomeworkRequest {
  submissionText?: string;
  attachmentUrl?: string;
  answers?: Record<string, number>;
}

export const homeworkApi = {
  // Teacher APIs
  createHomework: (req: CreateHomeworkRequest) =>
    api.post<HomeworkResponse>("/teacher/homeworks", req),
  updateHomework: (id: string, req: UpdateHomeworkRequest) =>
    api.put<HomeworkResponse>(`/teacher/homeworks/${id}`, req),
  deleteHomework: (id: string) => api.delete<void>(`/teacher/homeworks/${id}`),
  getTeacherHomeworks: () => api.get<HomeworkResponse[]>("/teacher/homeworks"),
  getTeacherHomeworkById: (id: string) => api.get<HomeworkResponse>(`/teacher/homeworks/${id}`),
  // Class-specific teacher query — powers the Homework tab inside Class Detail
  getHomeworksByClass: (classId: string) =>
    api.get<HomeworkResponse[]>(`/teacher/homeworks/class/${classId}`),
  getHomeworkSubmissions: (id: string) =>
    api.get<HomeworkSubmissionResponse[]>(`/teacher/homeworks/${id}/submissions`),
  gradeSubmission: (submissionId: string, req: GradeHomeworkRequest) =>
    api.put<HomeworkSubmissionResponse>(
      `/teacher/homeworks/submissions/${submissionId}/grade`,
      req,
    ),

  // Student APIs
  getStudentHomeworks: () => api.get<HomeworkResponse[]>("/student/homeworks"),
  getStudentHomeworksByClass: (classId: string) =>
    api.get<HomeworkResponse[]>(`/student/homeworks/class/${classId}`),
  getStudentHomeworkById: (id: string) => api.get<HomeworkResponse>(`/student/homeworks/${id}`),
  submitHomework: (id: string, req: SubmitHomeworkRequest) =>
    api.post<HomeworkSubmissionResponse>(`/student/homeworks/${id}/submit`, req),
  getStudentSubmission: (id: string) =>
    api.get<HomeworkSubmissionResponse | null>(`/student/homeworks/${id}/submission`),
};

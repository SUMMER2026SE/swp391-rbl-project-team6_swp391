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
  /**
   * Average score across every graded submission of this homework, in the
   * same unit as `maxScore`. Null when there are no graded submissions
   * yet; the UI renders "N/A" so the row is unambiguous.
   */
  averageScore?: number | null;
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
  /**
   * Backend-computed correct-answer count for an auto-graded homework attempt.
   * Used together with `totalQuestions` so the percentage displayed in the Student
   * View Result and the Teacher "View Submission" page is identical.
   */
  correctCount?: number;
  totalQuestions?: number;
  /** Rounded percentage = round(correctCount / totalQuestions * 100). */
  correctPercentage?: number;
  /** Anti-cheat / focus / window-blur / tab-switch violation count from the student attempt. */
  focusViolationCount?: number;
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
  textAnswers?: any[];
  focusViolationCount?: number;
}

// AI Homework Generation
export interface AiHomeworkGenerateRequest {
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

export interface AiHomeworkQuestionDto {
  type?: string;
  content?: string;
  difficulty?: string;
  explanation?: string;
  category?: string;
  answers?: { content?: string; isCorrect?: boolean }[];
}

export interface AiHomeworkGenerateResponse {
  title?: string;
  description?: string;
  questions: AiHomeworkQuestionDto[];
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

  generateAiHomework: (req: AiHomeworkGenerateRequest) =>
    api.post<AiHomeworkGenerateResponse>("/teacher/homework/ai-generate", req),

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

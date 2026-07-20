import { api } from "./client";
import type { HomeworkResponse } from "./homework";
import type { ExamResponse } from "./exams";

// Align with backend UserStatus enum
export type AdminUserStatus =
  | "PENDING"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "BANNED";

export type RejectTeacherPayload = {
  reason: string;
};

// Align with backend Role enum
export type AdminRole = "STUDENT" | "TEACHER" | "ADMIN";

// Lowercase display type used in UI components
export type UiRole = "student" | "teacher" | "admin";

// Lowercase display type used in UI components
export type UiStatus =
  | "active"
  | "suspended"
  | "banned"
  | "pending"
  | "pending_approval"
  | "rejected";

export interface AdminUserResponse {
  id: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  users: AdminUserResponse[];
}

export interface AdminTeacherCertificateResponse {
  id: string;
  title: string;
  issuer: string;
  issuedDate?: string | null;
  certificateUrl?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Admin view of a teacher — includes profile data from UserProfile
export interface AdminTeacherResponse {
  id: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  emailVerified: boolean;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  dateOfBirth?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Pagination wrapper returned by Spring Data Page
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface BanUserPayload {
  reason: string;
}

export interface GetAllUsersParams {
  role?: string;
  status?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface AdminDashboardSummaryResponse {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalActiveUsers: number;
  pendingTeachers: number;
  pendingContent: number;
  totalVocabularyLessons: number;
  totalGrammar: number;
  pendingGrammar: number;
  approvedGrammar: number;
  totalFlashcardSets: number;
  totalListeningLessons: number;
  pendingFlashcardSets: number;
  approvedFlashcardSets: number;
  pendingListeningLessons: number;
  approvedListeningLessons: number;
  publishedVocabularyLessons: number;
  totalProgressRecords: number;
}

/**
 * Activity types returned by the real backend API.
 */
export type ActivityKind =
  | "STUDENT_REGISTERED"
  | "TEACHER_REGISTERED"
  | "CLASS_CREATED"
  | "STUDENT_ENROLLED"
  | "HOMEWORK_SUBMITTED"
  | "EXAM_COMPLETED"
  | "CONTENT_APPROVED"
  | "NOTIFICATION_SENT";

/**
 * A single activity entry from the real backend.
 */
export interface AdminRecentActivity {
  id: string;
  type: ActivityKind;
  title: string;
  detail: string;
  timestamp: string;
  actorEmail?: string | null;
  entityId?: string | null;
}

export interface AdminRecentActivitiesResponse {
  activities: AdminRecentActivity[];
  total: number;
}

export const adminApi = {
  getPendingTeachers: () => api.get<AdminTeacherResponse[]>("/admin/users/teachers/pending"),

  getDashboardSummary: () => api.get<AdminDashboardSummaryResponse>("/admin/dashboard/summary"),

  getRecentActivities: (limit = 20) =>
    api.get<AdminRecentActivitiesResponse>(`/admin/dashboard/activities?limit=${limit}`),

  approveTeacher: (userId: string) =>
    api.put<AdminTeacherResponse>(`/admin/users/${userId}/approve`),

  /**
   * Reject a pending teacher application.
   */
  rejectTeacher: (userId: string, payload: RejectTeacherPayload) =>
    api.put<AdminTeacherResponse>(`/admin/users/${userId}/reject`, payload),

  /**
   * Suspend (ban) an approved teacher.
   */
  suspendTeacher: (userId: string) =>
    api.put<AdminTeacherResponse>(`/admin/users/${userId}/suspend`),

  /**
   * Activate (unban) a suspended teacher.
   */
  activateTeacher: (userId: string) =>
    api.put<AdminTeacherResponse>(`/admin/users/${userId}/activate`),

  getActiveTeachers: () => api.get<AdminTeacherResponse[]>("/admin/users/teachers/active"),

  getTeacherCertificates: (userId: string) =>
    api.get<AdminTeacherCertificateResponse[]>(`/admin/users/${userId}/certificates`),

  /**
   * Find a single teacher by id by searching across pending, active and
   * the full teacher list (covers PENDING_APPROVAL, ACTIVE, SUSPENDED,
   * REJECTED, BANNED). The backend does not expose a dedicated
   * `GET /admin/users/{id}` endpoint, so we aggregate existing list calls.
   */
  getTeacherById: async (userId: string): Promise<AdminTeacherResponse | null> => {
    const tryMatch = (list: AdminTeacherResponse[]) =>
      list.find((t) => t.id === userId) ?? null;
    try {
      const [pending, active, pageAll] = await Promise.all([
        adminApi.getPendingTeachers().catch(() => [] as AdminTeacherResponse[]),
        adminApi.getActiveTeachers().catch(() => [] as AdminTeacherResponse[]),
        adminApi
          .getAllUsers({ role: "TEACHER", size: 100 })
          .catch(() => ({ content: [] as AdminTeacherResponse[] })),
      ]);
      return (
        tryMatch(pending) ??
        tryMatch(active) ??
        tryMatch(pageAll.content ?? [])
      );
    } catch {
      return null;
    }
  },

  /**
   * Get all users with pagination and optional filters.
   * Query params are built manually because client.ts does not support them natively.
   */
  getAllUsers: (params: GetAllUsersParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.role) searchParams.set("role", params.role);
    if (params.status) searchParams.set("status", params.status);
    if (params.keyword) searchParams.set("keyword", params.keyword);
    if (params.page !== undefined) searchParams.set("page", String(params.page));
    if (params.size !== undefined) searchParams.set("size", String(params.size));
    const query = searchParams.toString();
    const path = "/admin/users" + (query ? `?${query}` : "");
    return api.get<Page<AdminTeacherResponse>>(path);
  },

  /**
   * Permanently ban a user.
   */
  banUser: (userId: string, payload: BanUserPayload) =>
    api.put<AdminTeacherResponse>(`/admin/users/${userId}/ban`, payload),

  /**
   * Restore a banned or suspended user.
   */
  restoreUser: (userId: string) => api.put<AdminTeacherResponse>(`/admin/users/${userId}/restore`),

  // ─── Question Bank Lessons (Admin) ──────────────────────────────────────────

  /**
   * Get all lessons for a level (admin view includes Draft/Archived/Inactive).
   */
  getQuestionBankLessons: (level: string) =>
    api.get<AdminQuestionBankLesson[]>(`/admin/question-bank/lessons?level=${level}`),

  /**
   * Get all classes (admin view).
   * Backed by `GET /api/admin/classes` which returns the full class list with
   * teacher info, student counts, JLPT level, status, and timestamps.
   */
  getAdminClasses: () => api.get<AdminClassResponse[]>("/admin/classes"),

  /**
   * Get a single class by id (admin view).
   */
  getAdminClassById: (id: string) => api.get<AdminClassResponse>(`/admin/classes/${id}`),

  /**
   * Get students of a specific class (admin view).
   */
  getClassStudents: (classId: string) =>
    api.get<AdminClassStudentResponse[]>(`/admin/classes/${classId}/students`),

  /**
   * Get homework assignments for a specific class (admin view).
   */
  getClassHomeworks: (classId: string) =>
    api.get<HomeworkResponse[]>(`/admin/classes/${classId}/homeworks`),

  /**
   * Get exams for a specific class (admin view).
   */
  getClassExams: (classId: string) =>
    api.get<ExamResponse[]>(`/admin/classes/${classId}/exams`),
};

export interface AdminQuestionBankLesson {
  id: number;
  level: string;
  lessonNumber: number;
  lessonName: string;
  status: string;
  createdAt: string;
}

// ============================================================
// Admin Class Management types
// ============================================================

/**
 * Mirrors backend `com.midori.dto.classdto.AdminClassResponse`.
 * Used by the admin class management page; data comes from
 * `GET /api/admin/classes`.
 */
export interface AdminClassResponse {
  id: string;
  name: string;
  teacher: string;
  teacherId: string | null;
  level: string;
  students: number;
  maxStudents: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  description: string | null;
  classCode?: string;
}

// Admin-specific student response for class detail view
export interface AdminClassStudentResponse {
  studentId: string;
  fullName: string | null;
  email: string;
  avatar: string | null;
  status: string;
  progressPercent?: number;
  submittedHomework?: number;
  totalHomework?: number;
  completedExams?: number;
  totalExams?: number;
  averageScore?: number;
  lastActivityAt?: string;
  joinedAt?: string;
}

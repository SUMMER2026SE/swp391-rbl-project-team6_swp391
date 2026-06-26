import { api } from "./client";

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

export const adminApi = {
  getPendingTeachers: () => api.get<AdminTeacherResponse[]>("/admin/users/teachers/pending"),

  getDashboardSummary: () => api.get<AdminDashboardSummaryResponse>("/admin/dashboard/summary"),

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
};

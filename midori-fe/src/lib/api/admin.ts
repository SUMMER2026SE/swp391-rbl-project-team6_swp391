import { api } from "./client";

// Response shape of /api/admin/classes (used to compute per-teacher stats)

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
  /** Number of classes this teacher owns. Backend-computed. */
  totalClasses?: number | null;
  /** Total distinct students enrolled in any of this teacher's classes. */
  totalStudents?: number | null;
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
  activeClasses: number;
  learningCompletionRate: number;
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

export interface JlptLevelCount {
  level: string;
  count: number;
  percentage: number;
}

export interface JlptDistributionResponse {
  totalClasses: number;
  levels: JlptLevelCount[];
}

export interface RecentActivity {
  id: string;
  type: string;
  action: string;
  detail: string;
  actor: string;
  timestamp: string;
}

export interface RecentActivitiesResponse {
  activities: RecentActivity[];
}

/**
 * Aggregated KPI counters returned by the admin Teacher Management page.
 * Every field is computed server-side from the database.
 */
export interface AdminTeacherStatsResponse {
  pendingTeachers: number;
  pendingTeachersToday: number;
  pendingTeachersThisWeek: number;
  pendingTeachersCertified: number;
  totalTeachers: number;
  activeTeachers: number;
  totalClasses: number;
  totalStudents: number;
}

export const adminApi = {
  getPendingTeachers: () => api.get<AdminTeacherResponse[]>("/admin/users/teachers/pending"),

  getDashboardSummary: () => api.get<AdminDashboardSummaryResponse>("/admin/dashboard/summary"),

  getJlptDistribution: () =>
    api.get<JlptDistributionResponse>("/admin/dashboard/jlpt-distribution"),

  getRecentActivities: (limit: number = 10) =>
    api.get<RecentActivitiesResponse>(
      `/admin/dashboard/recent-activities?limit=${limit}`,
    ),

  /**
   * Aggregated statistics for the Teacher Management KPI cards. All counters
   * are computed server-side; the frontend must not recompute them.
   */
  getTeacherStats: () => api.get<AdminTeacherStatsResponse>("/admin/users/teachers/stats"),

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
    console.log("[DEBUG] adminApi.getAllUsers -> GET", path);
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

/**
 * Lightweight client for the admin classes endpoint, which is needed to compute
 * per-teacher class/student counts on the Teacher Management page.
 */
export interface AdminClassResponse {
  id: string;
  name: string;
  teacher: string;
  teacherId: string;
  level: string;
  students: number;
  maxStudents: number;
  status: "ACTIVE" | "ARCHIVED" | string;
  createdAt: string;
  description?: string;
}

export interface CreateClassRequest {
  name: string;
  level: string;
  maxStudents: number;
  teacherId: string;
  description?: string;
}

export interface UpdateClassRequest {
  name: string;
  level: string;
  maxStudents: number;
  teacherId: string;
  description?: string;
}

export const adminClassesApi = {
  /**
   * Fetch all classes (GET /api/admin/classes).
   */
  getAdminClasses: (params: { teacherId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.teacherId) searchParams.set("teacherId", params.teacherId);
    const query = searchParams.toString();
    const path = "/admin/classes" + (query ? `?${query}` : "");
    return api.get<AdminClassResponse[]>(path);
  },

  /**
   * Create a new class (POST /api/admin/classes).
   */
  createAdminClass: (data: CreateClassRequest) => {
    return api.post<AdminClassResponse>("/admin/classes", data);
  },

  /**
   * Update an existing class (PUT /api/admin/classes/{id}).
   */
  updateAdminClass: (id: string, data: UpdateClassRequest) => {
    return api.put<AdminClassResponse>(`/admin/classes/${id}`, data);
  },

  /**
   * Archive a class (PUT /api/admin/classes/{id}/archive).
   */
  archiveAdminClass: (id: string) => {
    return api.put<AdminClassResponse>(`/admin/classes/${id}/archive`);
  },

  /**
   * Restore an archived class (PUT /api/admin/classes/{id}/restore).
   */
  restoreAdminClass: (id: string) => {
    return api.put<AdminClassResponse>(`/admin/classes/${id}/restore`);
  },

  /**
   * Get students in a class (GET /api/admin/classes/{id}/students).
   */
  getClassStudents: (classId: string) => {
    return api.get<AdminStudentResponse[]>(`/admin/classes/${classId}/students`);
  },
};

export interface AdminStudentResponse {
  studentId: string;
  fullName: string | null;
  email: string;
  avatar: string | null;
  status: string;
};

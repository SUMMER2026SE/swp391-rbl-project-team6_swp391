import { api } from "./client";

// Align with backend UserStatus enum
export type AdminUserStatus = "PENDING" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "BANNED";

export type RejectTeacherPayload = {
  reason: string;
};

// Align with backend Role enum
export type AdminRole = "STUDENT" | "TEACHER" | "ADMIN";

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

export const adminApi = {
  getPendingTeachers: () =>
    api.get<AdminTeacherResponse[]>("/admin/users/teachers/pending"),

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

  getActiveTeachers: () =>
    api.get<AdminTeacherResponse[]>("/admin/users/teachers/active"),

  getTeacherCertificates: (userId: string) =>
    api.get<AdminTeacherCertificateResponse[]>(`/admin/users/${userId}/certificates`),
};

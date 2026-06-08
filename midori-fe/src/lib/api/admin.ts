import { api } from "./client";

// Align with backend UserStatus enum
export type AdminUserStatus = "PENDING" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "BANNED";

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

export const adminApi = {
  getPendingTeachers: () =>
    api.get<AdminUserResponse[]>("/admin/users/teachers/pending"),

  approveTeacher: (userId: string) =>
    api.put<AdminUserResponse>(`/admin/users/${userId}/approve`),

  /**
   * Backend only provides suspendUser. No dedicated rejectTeacher endpoint exists.
   * Calling this will suspend the teacher account.
   */
  rejectTeacher: (userId: string) =>
    api.put<AdminUserResponse>(`/admin/users/${userId}/suspend`),
};

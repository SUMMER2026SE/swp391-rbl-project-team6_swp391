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
   * Reject a pending teacher application by suspending the account.
   */
  rejectTeacher: (userId: string) =>
    api.put<AdminUserResponse>(`/admin/users/${userId}/suspend`),

  /**
   * Suspend (ban) an approved teacher.
   */
  suspendTeacher: (userId: string) =>
    api.put<AdminUserResponse>(`/admin/users/${userId}/suspend`),

  /**
   * Activate (unban) a suspended teacher.
   */
  activateTeacher: (userId: string) =>
    api.put<AdminUserResponse>(`/admin/users/${userId}/activate`),

  getActiveTeachers: () =>
    api.get<AdminUserResponse[]>("/admin/users/teachers/active"),
};

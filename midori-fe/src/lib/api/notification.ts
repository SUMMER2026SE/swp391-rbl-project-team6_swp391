import { api } from "./client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationType = "SYSTEM" | "EXAM" | "CLASS" | "MAINTENANCE";
export type TargetAudience = "ALL" | "TEACHERS" | "STUDENTS" | "SPECIFIC_CLASS";
export type NotificationStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target: TargetAudience;
  status: NotificationStatus;
  scheduledDate?: string;
  createdAt: string;
  sentAt?: string;
  classId?: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: NotificationType;
  target: TargetAudience;
  scheduledDate?: string;
  classId?: string;
}

export interface UpdateNotificationRequest extends Partial<CreateNotificationRequest> {
  id: string;
  status?: NotificationStatus;
}

export interface NotificationStats {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const notificationApi = {
  // Get all notifications
  getNotifications: (params?: {
    type?: NotificationType;
    status?: NotificationStatus;
    target?: TargetAudience;
    page?: number;
    size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.target) searchParams.set("target", params.target);
    if (params?.page !== undefined) searchParams.set("page", String(params.page));
    if (params?.size !== undefined) searchParams.set("size", String(params.size));
    const query = searchParams.toString();
    return api.get<Notification[]>(`/admin/notifications${query ? `?${query}` : ""}`);
  },

  // Get notification by ID
  getNotificationById: (notificationId: string) =>
    api.get<Notification>(`/admin/notifications/${notificationId}`),

  // Get notification statistics
  getStats: () => api.get<NotificationStats>("/admin/notifications/stats"),

  // Create notification
  createNotification: (data: CreateNotificationRequest) =>
    api.post<Notification>("/admin/notifications", data),

  // Update notification
  updateNotification: (data: UpdateNotificationRequest) =>
    api.put<Notification>(`/admin/notifications/${data.id}`, data),

  // Delete notification
  deleteNotification: (notificationId: string) =>
    api.delete(`/admin/notifications/${notificationId}`),

  // Send notification immediately
  sendNotification: (notificationId: string) =>
    api.post<Notification>(`/admin/notifications/${notificationId}/send`),

  // Schedule notification
  scheduleNotification: (notificationId: string, scheduledDate: string) =>
    api.put<Notification>(`/admin/notifications/${notificationId}/schedule`, { scheduledDate }),

  // Cancel scheduled notification
  cancelScheduled: (notificationId: string) =>
    api.put<Notification>(`/admin/notifications/${notificationId}/cancel-schedule`),

  // Publish draft notification
  publishNotification: (notificationId: string) =>
    api.put<Notification>(`/admin/notifications/${notificationId}/publish`),

  // Get notification history
  getHistory: (notificationId: string) =>
    api.get<{ sentAt: string; recipientCount: number }[]>(
      `/admin/notifications/${notificationId}/history`,
    ),
};

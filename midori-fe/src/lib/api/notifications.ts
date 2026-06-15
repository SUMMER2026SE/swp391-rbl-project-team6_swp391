import { api } from "./client";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NotificationResponse {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  unreadCount: number;
}

export interface MarkReadResponse {
  notificationId: number | null;
  isRead: boolean;
  message: string;
}

// ─── API Functions ─────────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<NotificationListResponse> {
  return api.get<NotificationListResponse>("/notifications");
}

export async function markAsRead(notificationId: number): Promise<MarkReadResponse> {
  return api.put<MarkReadResponse>(`/notifications/${notificationId}/read`);
}

export async function markAllAsRead(): Promise<MarkReadResponse> {
  return api.put<MarkReadResponse>("/notifications/read-all");
}

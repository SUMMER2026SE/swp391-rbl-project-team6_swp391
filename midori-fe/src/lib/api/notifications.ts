import { api } from "./client";
import type { NotificationType } from "@/types/notification";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NotificationResponse {
  id: number;
  title: string;
  /**
   * Notification body. The backend treats this as nullable (matches the DB
   * column), so consumers should fall back to an empty string when missing.
   */
  content: string | null;
  /**
   * Notification category from the canonical set
   * {@link NotificationType} (LESSON, CONTEXT, EXAM, APPROVED, SYSTEM).
   * Kept as the union for compile-time safety in the inbox UI.
   */
  type: NotificationType;
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

import { api } from "./client";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NotificationResponse {
  id: number;
  title: string;
  /**
   * Notification body. The backend treats this as nullable (matches the DB
   * column), so consumers should fall back to an empty string when missing.
   */
  content: string | null;
  type: string;
  isRead: boolean;
  /**
   * The instant this notification was delivered to the current user
   * (i.e. user_notification.created_at), NOT the instant the admin
   * created the draft.  This drives the relative-time display ("Just now",
   * "5m ago", …) so that a notification sent today is never shown as
   * "1 day ago" just because its Draft was created yesterday.
   *
   * Backend may serialize this as:
   * - ISO string: "2026-07-17T07:40:54.141Z" (with JavaTimeModule)
   * - ISO string with microseconds: "2026-07-17T07:40:54.141517Z"
   * - Epoch milliseconds as number: 1752733254141
   *
   * The normalizeTimestamp() / relativeTime() functions handle all formats.
   */
  receivedAt: string | number;
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

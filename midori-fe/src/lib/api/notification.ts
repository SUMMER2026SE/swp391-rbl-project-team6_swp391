import { api } from "./client";
import {
  type NotificationType,
  type NotificationStatus,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUSES,
  TARGET_AUDIENCE,
  NOTIFICATION_TYPE_LIST,
  NOTIFICATION_STATUS_LIST,
  TARGET_AUDIENCE_LIST,
  getNotificationTypeConfig,
  getNotificationStatusConfig,
  type TargetAudience,
} from "@/types/notification";

// Re-export for convenience
export {
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUSES,
  TARGET_AUDIENCE,
  NOTIFICATION_TYPE_LIST,
  NOTIFICATION_STATUS_LIST,
  TARGET_AUDIENCE_LIST,
  getNotificationTypeConfig,
  getNotificationStatusConfig,
};
export type { NotificationType, NotificationStatus, TargetAudience };

// Spring Page wrapper - backend returns Page<T> not plain array
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AdminNotificationResponse {
  id: number;
  title: string;
  content: string;
  type: NotificationType;
  scheduledAt: string | null;
  targetType: string | null;
  targetRole: string | null;
  targetClassId: string | null;
  displayStatus: string;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  recipientCount: number;
}

export interface AdminNotificationDetailResponse {
  id: number;
  title: string;
  content: string;
  type: NotificationType;
  scheduledAt: string | null;
  targetType: string | null;
  targetRole: string | null;
  targetClassId: string | null;
  displayStatus: string;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  recipientCount: number;
}

export interface CreateNotificationRequest {
  title: string;
  content: string;
  type: NotificationType;
  scheduledAt?: string;
  targetType?: TargetAudience;
  targetRole?: "TEACHER" | "STUDENT";
  targetClassId?: string;
}

export interface UpdateNotificationRequest {
  title: string;
  content: string;
  type: NotificationType;
  scheduledAt?: string;
  targetType?: TargetAudience;
  targetRole?: "TEACHER" | "STUDENT";
  targetClassId?: string;
}

export interface ClassLookupResponse {
  id: string;
  name: string;
  level: string | null;
  maxStudents: number | null;
  studentCount: number | null;
  teacherId: string | null;
  teacherName: string | null;
  status: string | null;
}

export interface NotificationListParams {
  type?: NotificationType;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface SendNotificationRequest {
  targetType: "ALL" | "ROLE" | "CLASS";
  role?: "TEACHER" | "STUDENT";
  classId?: string;
}

export interface SendNotificationResponse {
  success: boolean;
  notificationId: number;
  status: string;
  sentAt: string | null;
  recipientCount: number;
}

export const notificationApi = {
  getNotifications: async (
    params?: NotificationListParams,
  ): Promise<AdminNotificationResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.keyword) searchParams.set("keyword", params.keyword);
    if (params?.page !== undefined) searchParams.set("page", String(params.page));
    if (params?.size !== undefined) searchParams.set("size", String(params.size));
    const query = searchParams.toString();
    // Backend returns Spring Page<AdminNotificationResponse>, not plain array
    const page = await api.get<SpringPage<AdminNotificationResponse>>(
      `/admin/notifications${query ? `?${query}` : ""}`,
    );
    return page?.content ?? [];
  },

  getNotificationById: (notificationId: number) =>
    api.get<AdminNotificationDetailResponse>(`/admin/notifications/${notificationId}`),

  createNotification: (data: CreateNotificationRequest) =>
    api.post<AdminNotificationDetailResponse>("/admin/notifications", data),

  updateNotification: (notificationId: number, data: UpdateNotificationRequest) =>
    api.put<AdminNotificationDetailResponse>(`/admin/notifications/${notificationId}`, data),

  deleteNotification: (notificationId: number) =>
    api.delete<void>(`/admin/notifications/${notificationId}`),

  sendNotification: (notificationId: number, data: SendNotificationRequest) =>
    api.post<SendNotificationResponse>(`/admin/notifications/${notificationId}/send`, data),

  lookupClass: (classCode: string) =>
    api.get<ClassLookupResponse>(
      `/admin/notifications/classes/lookup?classCode=${encodeURIComponent(classCode)}`,
    ),
};

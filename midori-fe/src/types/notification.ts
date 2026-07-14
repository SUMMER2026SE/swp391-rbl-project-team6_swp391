import type { LucideIcon } from "lucide-react";
import {
  Megaphone,
  BookOpen,
  ClipboardCheck,
  UserCog,
  Settings,
  Bell,
  Send,
  FileText,
  Calendar,
} from "lucide-react";

/**
 * Notification Types - centralized constants to avoid hardcoding.
 * Types describe notification categories, not processing status.
 * Approval/Rejection are surfaced via the notification Title/Message.
 */
export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT: "ANNOUNCEMENT",
  LEARNING: "LEARNING",
  CONTENT_REVIEW: "CONTENT_REVIEW",
  ACCOUNT: "ACCOUNT",
  SYSTEM: "SYSTEM",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_TYPE_LIST: { value: NotificationType; label: string; icon: LucideIcon; color: string }[] = [
  {
    value: NOTIFICATION_TYPES.ANNOUNCEMENT,
    label: "Announcement",
    icon: Megaphone,
    color: "blue",
  },
  {
    value: NOTIFICATION_TYPES.LEARNING,
    label: "Learning",
    icon: BookOpen,
    color: "emerald",
  },
  {
    value: NOTIFICATION_TYPES.CONTENT_REVIEW,
    label: "Content Review",
    icon: ClipboardCheck,
    color: "amber",
  },
  {
    value: NOTIFICATION_TYPES.ACCOUNT,
    label: "Account",
    icon: UserCog,
    color: "violet",
  },
  {
    value: NOTIFICATION_TYPES.SYSTEM,
    label: "System",
    icon: Settings,
    color: "slate",
  },
];

/**
 * Get notification type config by value
 */
export function getNotificationTypeConfig(type: NotificationType) {
  return NOTIFICATION_TYPE_LIST.find((t) => t.value === type) ?? {
    value: type,
    label: type,
    icon: Bell,
    color: "gray",
  };
}

/**
 * Notification Statuses - centralized constants to avoid hardcoding
 */
export const NOTIFICATION_STATUSES = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  SCHEDULED: "SCHEDULED",
} as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES];

export const NOTIFICATION_STATUS_LIST: { value: NotificationStatus; label: string; icon: LucideIcon; color: string }[] = [
  {
    value: NOTIFICATION_STATUSES.DRAFT,
    label: "Draft",
    icon: FileText,
    color: "yellow",
  },
  {
    value: NOTIFICATION_STATUSES.PUBLISHED,
    label: "Published",
    icon: Send,
    color: "green",
  },
  {
    value: NOTIFICATION_STATUSES.SCHEDULED,
    label: "Scheduled",
    icon: Calendar,
    color: "blue",
  },
];

/**
 * Get notification status config by value
 */
export function getNotificationStatusConfig(status: NotificationStatus) {
  return NOTIFICATION_STATUS_LIST.find((s) => s.value === status) ?? {
    value: status,
    label: status,
    icon: Bell,
    color: "gray",
  };
}

/**
 * Target Audience Types
 */
export const TARGET_AUDIENCE = {
  ALL: "ALL",
  TEACHERS: "TEACHERS",
  STUDENTS: "STUDENTS",
  SPECIFIC_CLASS: "SPECIFIC_CLASS",
} as const;

export type TargetAudience = (typeof TARGET_AUDIENCE)[keyof typeof TARGET_AUDIENCE];

export const TARGET_AUDIENCE_LIST: { value: TargetAudience; label: string }[] = [
  { value: TARGET_AUDIENCE.ALL, label: "All Users" },
  { value: TARGET_AUDIENCE.TEACHERS, label: "Teachers" },
  { value: TARGET_AUDIENCE.STUDENTS, label: "Students" },
  { value: TARGET_AUDIENCE.SPECIFIC_CLASS, label: "Specific Class" },
];

/**
 * User notification model
 */
export type Notification = {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: LucideIcon;
  type: NotificationType;
};

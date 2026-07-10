import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Settings,
  Bell,
  ClipboardList,
  FileText,
  User,
} from "lucide-react";

import { NOTIFICATION_TYPES, type NotificationType } from "@/types/notification";

/**
 * Unified icon/color registry used by both Teacher and Student notification
 * views. The previous implementation had two divergent maps that used
 * different icons for the same type (LESSON → ClipboardList vs GraduationCap,
 * CONTENT_APPROVED → FileText vs CheckCircle, ...). Centralising here removes
 * the visual drift between roles while keeping the role-agnostic type names
 * declared in `types/notification.ts` as the single source of truth.
 */
export type NotificationTypeVisual = {
  type: NotificationType;
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for the avatar swatch (light + dark variants). */
  badgeClass: string;
  /** Tailwind classes for the icon glyph itself. */
  iconClass: string;
};

export const NOTIFICATION_TYPE_VISUALS: NotificationTypeVisual[] = [
  {
    type: NOTIFICATION_TYPES.LESSON,
    label: "Lesson",
    icon: BookOpen,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    iconClass: "text-emerald-600 dark:text-emerald-300",
  },
  {
    type: NOTIFICATION_TYPES.CONTENT_APPROVED,
    label: "Content Approved",
    icon: CheckCircle,
    badgeClass: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-300",
    iconClass: "text-green-600 dark:text-green-300",
  },
  {
    type: NOTIFICATION_TYPES.CONTENT_REJECTED,
    label: "Content Rejected",
    icon: XCircle,
    badgeClass: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300",
    iconClass: "text-red-600 dark:text-red-300",
  },
  {
    type: NOTIFICATION_TYPES.TEACHER_APPROVED,
    label: "Teacher Approved",
    icon: UserCheck,
    badgeClass: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-300",
    iconClass: "text-green-600 dark:text-green-300",
  },
  {
    type: NOTIFICATION_TYPES.TEACHER_REJECTED,
    label: "Teacher Rejected",
    icon: UserX,
    badgeClass: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300",
    iconClass: "text-red-600 dark:text-red-300",
  },
  {
    type: NOTIFICATION_TYPES.SYSTEM,
    label: "System",
    icon: Settings,
    badgeClass: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
    iconClass: "text-slate-600 dark:text-slate-300",
  },
];

const FALLBACK_VISUAL: NotificationTypeVisual = {
  type: "SYSTEM" as NotificationType,
  label: "Notification",
  icon: Bell,
  badgeClass: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  iconClass: "text-slate-600 dark:text-slate-300",
};

/**
 * Resolve the icon/color swatch for a notification type. Falls back to a
 * neutral "bell" swatch when the backend sends a type the front-end doesn't
 * know about yet (this keeps the UI consistent even when the backend rolls
 * out new categories).
 */
export function getNotificationTypeVisual(
  type: NotificationType | string | undefined,
): NotificationTypeVisual {
  if (!type) return FALLBACK_VISUAL;
  const match = NOTIFICATION_TYPE_VISUALS.find((v) => v.type === type);
  return match ?? FALLBACK_VISUAL;
}

/**
 * Legacy alias kept so older imports keep working. New code should prefer
 * {@link getNotificationTypeVisual}.
 *
 * @deprecated use getNotificationTypeVisual instead.
 */
export function getNotificationTypeVisualLegacy(type: NotificationType | string | undefined) {
  switch (type) {
    case "LESSON":
      return { Icon: ClipboardList, colorClass: "bg-warning/10 text-warning" };
    case "CONTENT_APPROVED":
      return { Icon: FileText, colorClass: "bg-green-500/10 text-green-600" };
    case "CONTENT_REJECTED":
      return { Icon: User, colorClass: "bg-red-500/10 text-red-600" };
    case "TEACHER_APPROVED":
      return { Icon: CheckCircle, colorClass: "bg-green-500/10 text-green-600" };
    case "TEACHER_REJECTED":
      return { Icon: User, colorClass: "bg-red-500/10 text-red-600" };
    case "SYSTEM":
    default:
      return { Icon: Settings, colorClass: "bg-muted text-muted-foreground" };
  }
}

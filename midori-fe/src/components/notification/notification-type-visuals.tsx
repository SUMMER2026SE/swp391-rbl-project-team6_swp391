import type { LucideIcon } from "lucide-react";
import {
  Megaphone,
  BookOpen,
  ClipboardCheck,
  UserCog,
  Settings,
  Bell,
  ClipboardList,
  FileText,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { NOTIFICATION_TYPES, type NotificationType } from "@/types/notification";

/**
 * Unified icon/color registry for the 5 grouped notification categories.
 * Centralised here so the inbox card and preview sheet stay visually
 * consistent across Teacher/Student/Admin roles.
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
    type: NOTIFICATION_TYPES.ANNOUNCEMENT,
    label: "Announcement",
    icon: Megaphone,
    badgeClass: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
    iconClass: "text-blue-600 dark:text-blue-300",
  },
  {
    type: NOTIFICATION_TYPES.LEARNING,
    label: "Learning",
    icon: BookOpen,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    iconClass: "text-emerald-600 dark:text-emerald-300",
  },
  {
    type: NOTIFICATION_TYPES.CONTENT_REVIEW,
    label: "Content Review",
    icon: ClipboardCheck,
    badgeClass: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
    iconClass: "text-amber-600 dark:text-amber-300",
  },
  {
    type: NOTIFICATION_TYPES.ACCOUNT,
    label: "Account",
    icon: UserCog,
    badgeClass: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
    iconClass: "text-violet-600 dark:text-violet-300",
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
  type: NOTIFICATION_TYPES.SYSTEM,
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
    case "ANNOUNCEMENT":
      return { Icon: Megaphone, colorClass: "bg-blue-500/10 text-blue-600" };
    case "LEARNING":
      return { Icon: ClipboardList, colorClass: "bg-warning/10 text-warning" };
    case "CONTENT_REVIEW":
      return { Icon: FileText, colorClass: "bg-amber-500/10 text-amber-600" };
    case "ACCOUNT":
      return { Icon: User, colorClass: "bg-violet-500/10 text-violet-600" };
    case "SYSTEM":
    default:
      return { Icon: Settings, colorClass: "bg-muted text-muted-foreground" };
  }
}

// Re-export from the registry so that any module importing the legacy icons
// still has a handle on the modern equivalents if it ever needs them.
export { CheckCircle, XCircle };

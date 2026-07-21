import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CheckCircle,
  ClipboardList,
  Settings,
  Bell,
  ScrollText,
} from "lucide-react";

import {
  NOTIFICATION_TYPES,
  LEGACY_NOTIFICATION_TYPE_LABELS,
  type NotificationType,
} from "@/types/notification";

/**
 * Unified icon/color registry used by both Teacher and Student notification
 * views. The previous implementation had two divergent maps that used
 * different icons for the same type. Centralising here removes the visual
 * drift between roles while keeping the role-agnostic type names declared
 * in `types/notification.ts` as the single source of truth.
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
    type: NOTIFICATION_TYPES.CONTEXT,
    label: "Context",
    icon: ScrollText,
    badgeClass: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
    iconClass: "text-orange-600 dark:text-orange-300",
  },
  {
    type: NOTIFICATION_TYPES.EXAM,
    label: "Exam",
    icon: ClipboardList,
    badgeClass: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
    iconClass: "text-violet-600 dark:text-violet-300",
  },
  {
    type: NOTIFICATION_TYPES.APPROVED,
    label: "Approved",
    icon: CheckCircle,
    badgeClass: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-300",
    iconClass: "text-green-600 dark:text-green-300",
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
 *
 * Legacy values that may still appear on cached responses (CONTENT_*,
 * TEACHER_*) are mapped to their canonical visual via
 * {@link LEGACY_NOTIFICATION_TYPE_LABELS}.
 */
export function getNotificationTypeVisual(
  type: NotificationType | string | undefined,
): NotificationTypeVisual {
  if (!type) return FALLBACK_VISUAL;
  const match = NOTIFICATION_TYPE_VISUALS.find((v) => v.type === type);
  if (match) return match;

  const legacyLabel = LEGACY_NOTIFICATION_TYPE_LABELS[type];
  if (legacyLabel) {
    const canonical = NOTIFICATION_TYPE_VISUALS.find((v) => v.label === legacyLabel);
    if (canonical) return canonical;
  }

  return FALLBACK_VISUAL;
}

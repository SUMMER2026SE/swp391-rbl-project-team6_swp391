import { memo, useMemo } from "react";

import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";
import { formatNotificationDate } from "@/lib/time-ago";
import { getNotificationTypeVisual } from "./notification-type-visuals";

interface NotificationTableRowProps {
  notification: Notification;
  onPreview: (notification: Notification) => void;
  onMarkRead: (notification: Notification) => void;
}

/**
 * Role-scoped table row used **only** by the Student and Teacher inboxes.
 *
 * <p>The Admin inbox uses its own bespoke table layout defined inline in
 * {@link /routes/admin.notification.tsx} and therefore does not import this
 * component. Any visual change here is guaranteed not to leak into the
 * Admin UI.</p>
 *
 * <p>Column ratios are pinned to {@code 45 / 20 / 20 / 15} so the
 * header row and every body row align perfectly.</p>
 *
 * Grid template columns (4 columns, see `style` below):
 *   1. Notification (45%) — rounded icon swatch + title + desc preview
 *   2. Type         (20%) — pill badge with the notification type
 *   3. Sent Date    (20%)
 *   4. Received     (15%) — relative time ("5m ago")
 */
function NotificationTableRowImpl({ notification, onPreview, onMarkRead }: NotificationTableRowProps) {
  const visual = useMemo(() => getNotificationTypeVisual(notification.type), [notification.type]);
  const Icon = visual.icon;

  const handleClick = () => {
    onPreview(notification);
    if (notification.unread) {
      onMarkRead(notification);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  const sentDate = formatNotificationDate(notification.receivedAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={notification.title}
      style={{ gridTemplateColumns: "45% 20% 20% 15%" }}
      className={cn(
        "grid w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200",
        "border-border bg-card shadow-sm",
        "hover:-translate-y-px hover:shadow-md",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        notification.unread &&
          "border-l-[3px] border-l-primary bg-primary/[0.04] hover:bg-primary/[0.06]",
      )}
    >
      {/* 1. Notification (icon + title + desc) — 45% */}
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "inline-block h-2 w-2 shrink-0 rounded-full",
            notification.unread ? "bg-primary" : "bg-transparent",
          )}
        />
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
            visual.badgeClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "truncate text-sm leading-tight",
              notification.unread
                ? "font-semibold text-foreground"
                : "font-medium text-foreground/80",
            )}
          >
            {notification.title}
          </h3>
          {notification.desc && (
            <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground">
              {notification.desc}
            </p>
          )}
        </div>
      </div>

      {/* 2. Type — 20% */}
      <div className="min-w-0">
        <span
          className={cn(
            "inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[11px] font-medium",
            visual.badgeClass,
          )}
          title={visual.label}
        >
          {visual.label}
        </span>
      </div>

      {/* 3. Sent Date — 20% */}
      <div className="truncate text-xs text-muted-foreground">
        {sentDate || <span className="opacity-60">—</span>}
      </div>

      {/* 4. Received — 15% */}
      <div className="truncate text-xs font-medium text-muted-foreground">{notification.time}</div>
    </div>
  );
}

export const NotificationTableRow = memo(NotificationTableRowImpl);
NotificationTableRow.displayName = "NotificationTableRow";
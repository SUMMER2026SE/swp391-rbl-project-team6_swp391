import { memo, useMemo } from "react";

import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";
import { getNotificationTypeVisual } from "./notification-type-visuals";

interface NotificationCardProps {
  notification: Notification;
  onPreview: (notification: Notification) => void;
  onMarkRead: (notification: Notification) => void;
}

/**
 * Shared notification row used by every role (teacher, student, future
 * roles). Renders identically between roles so the inbox experience is
 * consistent. All interaction effects (mark-read, preview) are delegated
 * up to the caller so the same component works inside the standalone inbox
 * page and the bell dropdown alike.
 */
function NotificationCardImpl({ notification, onPreview, onMarkRead }: NotificationCardProps) {
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={notification.title}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
        "border-border bg-card shadow-sm",
        "hover:-translate-y-px hover:shadow-md",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        notification.unread &&
          "border-l-[3px] border-l-primary bg-primary/[0.04] hover:bg-primary/[0.06]",
      )}
    >
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
          visual.badgeClass,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
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
            {notification.unread && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
            )}
          </div>

          <span className="shrink-0 whitespace-nowrap text-[11px] font-medium text-muted-foreground">
            {notification.time}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {notification.desc}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 font-medium",
              visual.badgeClass,
            )}
          >
            {visual.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export const NotificationCard = memo(NotificationCardImpl);
NotificationCard.displayName = "NotificationCard";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/context/notification-context";
import type { Notification } from "@/types/notification";

import { NotificationCard } from "./notification-card";
import { NotificationEmptyState } from "./notification-empty-state";
import { NotificationErrorState } from "./notification-error-state";
import { NotificationLoadingState } from "./notification-loading-state";
import { NotificationPageHeader } from "./notification-page-header";
import { NotificationPreviewSheet } from "./notification-preview-sheet";

interface NotificationListViewProps {
  /**
   * Subtitle override shown in the page header. When `undefined` the header
   * composes its own copy from the unread count, matching the behaviour
   * that both roles had prior to the refactor.
   */
  subtitle?: string;
  /**
   * Optional class applied to the outer wrapper so the calling route can
   * constrain the inbox width without the shared component caring about
   * layout details.
   */
  className?: string;
  /**
   * When `true` the inbox does not render its own page header. Useful when
   * a route embeds the inbox inside a parent page that already supplies
   * its own header (kept here for future reuse, not currently used).
   */
  hideHeader?: boolean;
  /**
   * Optional notification ID that the inbox should immediately open in
   * the preview drawer. Used when arriving from the bell dropdown so the
   * user lands directly on the detail view of the notification they
   * clicked. Passing `null`/`undefined` keeps the drawer closed.
   */
  initialPreviewId?: number | null;
  /**
   * Callback fired once the inbox has consumed the `initialPreviewId`.
   * The parent route uses this to clear its search-param so the drawer
   * does not re-open on subsequent re-renders.
   */
  onInitialPreviewConsumed?: () => void;
}

/**
 * Canonical, role-agnostic inbox. Both `/teacher/notifications` and
 * `/student/notifications` render through this component so the layout,
 * behaviour and copy remain identical across roles. Differences allowed by
 * the business logic (e.g. tabs visible to each role) are surfaced via
 * props rather than separate render trees.
 */
export function NotificationListView({
  subtitle,
  className,
  hideHeader = false,
  initialPreviewId,
  onInitialPreviewConsumed,
}: NotificationListViewProps) {
  const { notifications, unreadCount, loading, error, refresh, markRead, markAllRead } =
    useNotifications();

  const [previewNotification, setPreviewNotification] = useState<Notification | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Whenever the underlying list swaps (e.g. after a refresh following a
  // mark-read round-trip) the previous preview target may no longer exist.
  // Drop the stale reference so the sheet closes cleanly.
  useEffect(() => {
    if (!previewNotification) return;
    const stillExists = notifications.some((n) => n.id === previewNotification.id);
    if (!stillExists) {
      setPreviewNotification(null);
      setPreviewOpen(false);
    }
  }, [notifications, previewNotification]);

  // When arriving from the bell dropdown with a notification id in the URL,
  // open the detail drawer for that notification as soon as it is loaded.
  // We deliberately ignore the inbox-level filter UI (which has been
  // removed) so the only way to land on a detail view is by arriving via
  // this prop or by clicking a card in the list below.
  useEffect(() => {
    if (initialPreviewId == null) return;
    if (notifications.length === 0) return;

    const target = notifications.find((n) => n.id === initialPreviewId);
    if (target) {
      setPreviewNotification(target);
      setPreviewOpen(true);
      onInitialPreviewConsumed?.();
    }
  }, [initialPreviewId, notifications, onInitialPreviewConsumed]);

  const handlePreview = useCallback((notification: Notification) => {
    setPreviewNotification(notification);
    setPreviewOpen(true);
  }, []);

  const handleMarkRead = useCallback(
    async (notification: Notification) => {
      if (!notification.unread) return;
      try {
        await markRead(notification.id);
      } catch {
        toast.error("Failed to mark notification as read");
      }
    },
    [markRead],
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllRead();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  }, [markAllRead]);

  const computedSubtitle = useMemo(() => {
    if (subtitle) return subtitle;
    if (loading && notifications.length === 0) return "Loading…";
    if (unreadCount > 0) return `${unreadCount} unread`;
    return "All caught up";
  }, [subtitle, loading, notifications.length, unreadCount]);

  return (
    <section className={cn("w-full", className)}>
      {!hideHeader && (
        <NotificationPageHeader
          subtitle={computedSubtitle}
          loading={loading && notifications.length === 0}
          showMarkAllRead={unreadCount > 0 && !loading}
          onMarkAllRead={handleMarkAllRead}
        />
      )}

      <div aria-live="polite" aria-busy={loading} className="space-y-3">
        {loading && notifications.length === 0 ? (
          <NotificationLoadingState />
        ) : error ? (
          <NotificationErrorState message={error} onRetry={refresh} />
        ) : notifications.length === 0 ? (
          <NotificationEmptyState description="You're all caught up!" />
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onPreview={handlePreview}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </div>

      <NotificationPreviewSheet
        notification={previewNotification}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onMarkRead={handleMarkRead}
      />
    </section>
  );
}

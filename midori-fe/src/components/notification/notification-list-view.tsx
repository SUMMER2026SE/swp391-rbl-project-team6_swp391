import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
   * When provided, the detail drawer is opened automatically with the
   * notification that has this id. Used by the bell dropdown to jump
   * directly into a notification's detail after navigating here.
   * After the drawer opens the caller is responsible for clearing the
   * `open` search param so a refresh / back does not re-open the drawer.
   */
  autoOpenId?: number;
  /**
   * Called after the drawer has been opened (or attempted) in response
   * to `autoOpenId`. Gives the caller a chance to clean the URL param.
   */
  onDrawerOpened?: () => void;
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
  autoOpenId,
  onDrawerOpened,
}: NotificationListViewProps) {
  const { notifications, unreadCount, loading, error, refresh, markRead, markAllRead } =
    useNotifications();

  const [previewNotification, setPreviewNotification] = useState<Notification | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Tracks which autoOpenId has already been handled so the drawer opens
  // exactly once even when notifications refreshes or loading toggles.
  const openedIdRef = useRef<number | undefined>(undefined);

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

  // When the bell dropdown navigates here with `?open=<id>`, find the
  // notification in the already-loaded list and open its detail drawer.
  // Runs after `notifications` is populated so the notification exists.
  useEffect(() => {
    // If autoOpenId is absent, nothing to do.
    if (autoOpenId === undefined) return;

    // If drawer already opened for this id (guard against effect re-firing
    // due to loading or notifications changes), skip silently.
    if (openedIdRef.current === autoOpenId) return;

    // If data is still loading, bail out and wait. The effect will re-fire
    // when loading resolves (notifications dependency change).
    if (loading) return;

    const target = notifications.find((n) => n.id === autoOpenId);
    if (!target) {
      // If the list has been hydrated (not loading, has notifications) but
      // we still can't find the target, the notification id from the URL
      // is no longer present on the server. Mark it as handled so we
      // don't loop, and clean the URL via onDrawerOpened.
      if (notifications.length > 0) {
        openedIdRef.current = autoOpenId;
        onDrawerOpened?.();
      }
      return;
    }

    // Mark this id as handled.
    openedIdRef.current = autoOpenId;

    // Defer the open() call to the next microtask. Two reasons:
    //   1. `<NotificationPreviewSheet>` mounts on the same render where we
    //      set the state. Without the defer, Radix Dialog sees `open=true`
    //      on its very first commit and skips the enter transition, which
    //      in some Radix versions means the content stays hidden.
    //   2. Any synchronous state updates from sibling code paths (the
    //      optimistic mark-read swap invoked by the bell click handler)
    //      settle before we read `notifications` again.
    const scheduleOpen = (cb: () => void) => {
      if (typeof queueMicrotask === "function") {
        queueMicrotask(cb);
      } else {
        setTimeout(cb, 0);
      }
    };

    scheduleOpen(() => {
      // Re-read in case the optimistic mark-read swap replaced the row
      // with a newer reference after we found `target` above.
      const latest = notifications.find((n) => n.id === autoOpenId) ?? target;
      setPreviewNotification(latest);
      setPreviewOpen(true);
    });

    // Mark as read if unread (fire-and-forget, failures are silently ignored).
    if (target.unread) {
      markRead(target.id).catch(() => {});
    }

    // Notify the caller so it can clean the search param.
    onDrawerOpened?.();
  }, [autoOpenId, notifications, loading, markRead, onDrawerOpened]);

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

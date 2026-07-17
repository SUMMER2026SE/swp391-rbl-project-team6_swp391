import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/context/notification-context";
import type { Notification } from "@/types/notification";

import { NotificationEmptyState } from "./notification-empty-state";
import { NotificationErrorState } from "./notification-error-state";
import { NotificationLoadingState } from "./notification-loading-state";
import { NotificationPageHeader } from "./notification-page-header";
import { NotificationPreviewModal } from "./notification-preview-modal";
import { NotificationTableRow } from "./notification-table-row";

interface NotificationTableViewProps {
  /**
   * Subtitle override shown in the page header. When `undefined` the header
   * composes its own copy from the unread count.
   */
  subtitle?: string;
  /**
   * Optional class applied to the outer wrapper so the calling route can
   * constrain the inbox width without the shared component caring about
   * layout details.
   */
  className?: string;
  /**
   * When `true` the inbox does not render its own page header.
   */
  hideHeader?: boolean;
  /**
   * When provided, the detail drawer is opened automatically with the
   * notification that has this id. Used by the bell dropdown to jump
   * directly into a notification's detail after navigating here.
   */
  autoOpenId?: number;
  /**
   * Called after the drawer has been opened (or attempted) in response
   * to `autoOpenId`. Gives the caller a chance to clean the URL param.
   */
  onDrawerOpened?: () => void;
}

/**
 * Table-layout inbox used **only** by the Student and Teacher roles.
 *
 * <p>This component mirrors the behaviour of {@link NotificationListView}
 * but renders each notification as a row inside a table with a fixed
 * column header. The column ratios are
 * {@code Notification 45% / Type 20% / Sent Date 20% / Received 15%}
 * and are applied identically to the header and every row
 * so they line up regardless of viewport.</p>
 *
 * <p>All behavioural wiring (mark-read, auto-open, drawer, mark-all-read,
 * toasts) is reused unchanged so nothing in the business logic shifts.</p>
 *
 * <p>The Admin inbox uses an entirely separate code path (see
 * {@link /routes/admin.notification.tsx}); this component never reaches it.
 * </p>
 */
export function NotificationTableView({
  subtitle,
  className,
  hideHeader = false,
  autoOpenId,
  onDrawerOpened,
}: NotificationTableViewProps) {
  const { notifications, unreadCount, loading, error, refresh, markRead, markAllRead } =
    useNotifications();

  const [previewNotification, setPreviewNotification] = useState<Notification | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const openedIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!previewNotification) return;
    const stillExists = notifications.some((n) => n.id === previewNotification.id);
    if (!stillExists) {
      setPreviewNotification(null);
      setPreviewOpen(false);
    }
  }, [notifications, previewNotification]);

  useEffect(() => {
    if (autoOpenId === undefined) return;
    if (openedIdRef.current === autoOpenId) return;
    if (loading) return;

    const target = notifications.find((n) => n.id === autoOpenId);
    if (!target) {
      if (notifications.length > 0) {
        openedIdRef.current = autoOpenId;
        onDrawerOpened?.();
      }
      return;
    }

    openedIdRef.current = autoOpenId;

    const scheduleOpen = (cb: () => void) => {
      if (typeof queueMicrotask === "function") {
        queueMicrotask(cb);
      } else {
        setTimeout(cb, 0);
      }
    };

    scheduleOpen(() => {
      const latest = notifications.find((n) => n.id === autoOpenId) ?? target;
      setPreviewNotification(latest);
      setPreviewOpen(true);
    });

    if (target.unread) {
      markRead(target.id).catch(() => {});
    }

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

      {/* Table column header — pinned to the same 45/20/20/15 grid as the rows */}
      <div
        aria-hidden
        className="hidden border-b border-border pb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:block"
        style={{ display: "grid", gridTemplateColumns: "45% 20% 20% 15%" }}
      >
        <span className="px-1">Notification</span>
        <span className="px-1">Type</span>
        <span className="px-1">Sent Date</span>
        <span className="px-1">Received</span>
      </div>

      <div aria-live="polite" aria-busy={loading} className="mt-3 space-y-3">
        {loading && notifications.length === 0 ? (
          <NotificationLoadingState />
        ) : error ? (
          <NotificationErrorState message={error} onRetry={refresh} />
        ) : notifications.length === 0 ? (
          <NotificationEmptyState description="You're all caught up!" />
        ) : (
          notifications.map((notification) => (
            <NotificationTableRow
              key={notification.id}
              notification={notification}
              onPreview={handlePreview}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </div>

      <NotificationPreviewModal
        notification={previewNotification}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onMarkRead={handleMarkRead}
      />
    </section>
  );
}
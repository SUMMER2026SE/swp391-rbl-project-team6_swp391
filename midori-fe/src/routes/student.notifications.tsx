import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { NotificationListView } from "@/components/notification";

export const Route = createFileRoute("/student/notifications")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    id:
      typeof search.id === "string" && search.id.length > 0
        ? Number.parseInt(search.id, 10)
        : null,
  }),
  component: StudentNotificationsPage,
});

/**
 * Student notification inbox. After the UI/UX consolidation the page is a
 * thin shell around the shared {@link NotificationListView} so that
 * Teacher and Student render the exact same inbox. We deliberately do not
 * keep role-specific layouts (custom card, expand-on-click, etc.) here so
 * future divergence cannot creep back in.
 *
 * The inbox no longer surfaces the per-type tabs (All / Unread / Lesson /
 * Approved / Rejected / Teacher Approved / Teacher Rejected / System);
 * the listing shows every notification in chronological order and
 * selection is delegated to the detail drawer.
 *
 * When the URL carries `?id=<notificationId>` (e.g. coming from the bell
 * dropdown in the dashboard header) the page opens the detail drawer for
 * that notification and then strips the param so a page reload does not
 * keep re-opening the same drawer.
 */
function StudentNotificationsPage() {
  const { id: previewId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const clearPreviewId = useCallback(() => {
    navigate({
      search: ((prev: { q: string; id: number | null }) => ({
        q: prev.q,
        id: undefined,
      })) as never,
      replace: true,
    });
  }, [navigate]);

  return (
    <NotificationListView
      initialPreviewId={previewId}
      onInitialPreviewConsumed={clearPreviewId}
    />
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";

import { NotificationListView } from "@/components/notification";

export const Route = createFileRoute("/teacher/notifications")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    id:
      typeof search.id === "string" && search.id.length > 0
        ? Number.parseInt(search.id, 10)
        : null,
  }),
  component: TeacherNotificationsPage,
});

/**
 * Teacher notification inbox. The visual rendering, interactions and state
 * machinery are now shared with the Student route via the canonical
 * {@link NotificationListView} component; this file only keeps the URL
 * search-param bookkeeping the teacher-shell expects (the `?q=` query is
 * used by the global search bar across every teacher page).
 *
 * The inbox no longer surfaces the per-type tabs (All / Unread / Lesson /
 * Approved / Rejected / Teacher Approved / Teacher Rejected / System);
 * the listing shows every notification in chronological order and
 * selection is delegated to the detail drawer.
 *
 * When the URL carries `?id=<notificationId>` (e.g. coming from the bell
 * dropdown in the teacher shell header) the page opens the detail drawer
 * for that notification and then strips the param so a page reload does
 * not keep re-opening the same drawer.
 */
function TeacherNotificationsPage() {
  const { q: urlQ, id: previewId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Strip a stray empty `?q=` so it never reaches the local search predicate.
  // The teacher shell also performs this cleanup, but doing it here too keeps
  // the page idempotent when mounted directly with ?q=.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (urlQ !== "") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("q")) {
      params.delete("q");
      const base = window.location.pathname;
      const newSearch = params.toString();
      const newUrl = newSearch ? `${base}?${newSearch}` : base;
      window.history.replaceState(null, "", newUrl);
    }
  }, [urlQ]);

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

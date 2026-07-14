import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";

import { NotificationListView } from "@/components/notification";

export const Route = createFileRoute("/teacher/notifications")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    // `open` is the notification id that should be auto-opened in the
    // detail drawer after navigating from the bell dropdown. When the
    // user lands on this page via the sidebar / "View all" link the
    // param is absent and the drawer stays closed.
    //
    // TanStack Router already decodes `?open=110` into a numeric value, so
    // we must accept both shapes (string from a hand-written URL, number
    // from the typed router) and coerce both into a finite number.
    open:
      typeof search.open === "number" && Number.isFinite(search.open)
        ? search.open
        : typeof search.open === "string" && search.open.length > 0
          ? Number(search.open)
          : undefined,
  }),
  component: TeacherNotificationsPage,
});

/**
 * Teacher notification inbox. The visual rendering, interactions and state
 * machinery are now shared with the Student route via the canonical
 * {@link NotificationListView} component; this file only keeps the URL
 * search-param bookkeeping the teacher-shell expects (the `?q=` query is
 * used by the global search bar across every teacher page).
 */
function TeacherNotificationsPage() {
  const { q: urlQ, open: urlOpen } = Route.useSearch();

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

  // After the drawer has opened and the notification is displayed, clean the
  // `open` param from the URL so a refresh / back navigation does not
  // re-trigger the auto-open behaviour.
  const handleDrawerOpened = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("open")) {
      params.delete("open");
      const base = window.location.pathname;
      const newSearch = params.toString();
      const newUrl = newSearch ? `${base}?${newSearch}` : base;
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  return <NotificationListView autoOpenId={urlOpen} onDrawerOpened={handleDrawerOpened} />;
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { NotificationListView } from "@/components/notification";

export const Route = createFileRoute("/teacher/notifications")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
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
  const { q: urlQ } = Route.useSearch();

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

  return <NotificationListView />;
}

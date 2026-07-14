import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

import { NotificationListView } from "@/components/notification";

export const Route = createFileRoute("/student/notifications")({
  validateSearch: (search: Record<string, unknown>) => ({
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
  component: StudentNotificationsPage,
});

/**
 * Student notification inbox. After the UI/UX consolidation the page is a
 * thin shell around the shared {@link NotificationListView} so that
 * Teacher and Student render the exact same inbox. We deliberately do not
 * keep role-specific layouts (custom card, expand-on-click, etc.) here so
 * future divergence cannot creep back in.
 */
function StudentNotificationsPage() {
  const { open: urlOpen } = Route.useSearch();

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

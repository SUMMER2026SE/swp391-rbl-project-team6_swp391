import { createFileRoute } from "@tanstack/react-router";

import { NotificationListView } from "@/components/notification";

export const Route = createFileRoute("/student/notifications")({
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
  return <NotificationListView />;
}

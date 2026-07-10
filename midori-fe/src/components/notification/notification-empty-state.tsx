import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";

interface NotificationEmptyStateProps {
  /**
   * Optional short message shown beneath the heading. We keep the default
   * ("You're all caught up") consistent with the previous Student wording so
   * the message feels familiar to both audiences.
   */
  description?: string;
  heading?: string;
  className?: string;
}

/**
 * Shared empty placeholder rendered when the inbox has no notifications (or
 * when an active tab filter excludes every row). Replacing the two ad-hoc
 * variants with a single component guarantees that the empty-state copy and
 * visual treatment are identical between Teacher and Student.
 */
export function NotificationEmptyState({
  description = "You're all caught up!",
  heading = "No notifications",
  className,
}: NotificationEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-16 text-center",
        className,
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted">
        <Bell className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

import type { ReactNode } from "react";

import { CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationPageHeaderProps {
  /** Highlight shown under the title (e.g. "3 unread"). */
  subtitle?: string;
  /** Subtitle used while the inbox is loading. Falls back to a neutral copy. */
  loading?: boolean;
  /** Whether there is at least one unread row. Controls "Mark all read" CTA. */
  showMarkAllRead?: boolean;
  onMarkAllRead?: () => void;
  /** Optional extra nodes rendered on the right of the header (filters etc). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Shared header rendered at the top of the notification inbox. Replaces the
 * two ad-hoc headers (Teacher's `PageHeader` block vs Student's custom
 * title + Back link) with a single canonical shape so the title, subtitle
 * and "Mark all read" CTA always line up between roles.
 */
export function NotificationPageHeader({
  subtitle,
  loading,
  showMarkAllRead,
  onMarkAllRead,
  actions,
  className,
}: NotificationPageHeaderProps) {
  const resolvedSubtitle =
    subtitle ?? (loading ? "Loading…" : "Stay updated with your latest activity.");

  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">{resolvedSubtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {showMarkAllRead && onMarkAllRead && (
          <Button variant="outline" size="sm" onClick={onMarkAllRead}>
            <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden />
            Mark all read
          </Button>
        )}
      </div>
    </div>
  );
}

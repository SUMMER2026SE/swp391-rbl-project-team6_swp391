import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Full-bleed placeholder shown while the inbox is fetching its first batch.
 * Teacher and Student previously rendered different skeletons (RefreshCw
 * spinner vs pulsing bell); this component is the single shared variant.
 */
export function NotificationLoadingState({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center",
        className,
      )}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
        <Bell className="h-6 w-6 animate-pulse text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Loading notifications…</p>
    </div>
  );
}

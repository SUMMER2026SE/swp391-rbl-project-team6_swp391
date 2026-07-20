// Loading / Error / Empty state primitives used by the Admin Dashboard.
// All three share the same card shape so the layout never jumps when
// the underlying data state changes.

import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";

export function DashboardCardSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="card-base p-5 flex flex-col" style={{ minHeight: height }}>
      <div className="h-4 w-32 rounded-md bg-white/40 dark:bg-white/5 animate-pulse" />
      <div className="flex-1 mt-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-col animate-spin" />
      </div>
    </div>
  );
}

export function DashboardErrorCard({
  message,
  onRetry,
  height = 220,
}: {
  message: string;
  onRetry?: () => void;
  height?: number;
}) {
  return (
    <div
      className="card-base p-5 flex flex-col items-center justify-center text-center"
      style={{ minHeight: height }}
    >
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-primary-col">Something went wrong</p>
      <p className="text-xs text-muted-col mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-surface text-xs font-semibold text-primary hover:bg-white/30 dark:hover:bg-white/10 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}

export function DashboardEmptyState({
  title = "No data yet",
  description = "There is nothing to display for this section.",
  height = 220,
}: {
  title?: string;
  description?: string;
  height?: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ minHeight: height }}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/40 dark:bg-white/5 flex items-center justify-center mb-3">
        <Inbox className="w-6 h-6 text-muted-col" />
      </div>
      <p className="text-sm font-semibold text-primary-col">{title}</p>
      <p className="text-xs text-muted-col mt-1 max-w-xs">{description}</p>
    </div>
  );
}

export function DashboardKpiSkeleton() {
  return (
    <div className="card-base p-4 min-h-[6.5rem] flex flex-col animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-white/40 dark:bg-white/5" />
      </div>
      <div className="h-3 w-20 rounded bg-white/40 dark:bg-white/5" />
      <div className="h-6 w-24 rounded bg-white/40 dark:bg-white/5 mt-auto" />
    </div>
  );
}

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationErrorStateProps {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  className?: string;
}

/**
 * Shared error placeholder used when the notification fetch fails. The two
 * prior pages rendered different shapes (red card with text + button vs
 * plain text with a link); the unified version uses the same visual
 * language as the loading/empty states so the inbox feels cohesive.
 */
export function NotificationErrorState({
  message,
  onRetry,
  retrying,
  className,
}: NotificationErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/[0.04] py-12 text-center",
        className,
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" aria-hidden />
      </div>
      <p className="max-w-sm px-4 text-sm font-medium text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
        {retrying ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}

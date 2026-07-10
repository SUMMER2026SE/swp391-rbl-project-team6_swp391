import { useMemo } from "react";

import { CalendarClock, CheckCheck, Clock, Hash, Mail, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";
import { getNotificationTypeVisual } from "./notification-type-visuals";

interface NotificationPreviewSheetProps {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkRead?: (notification: Notification) => void;
}

/**
 * Shared detail drawer used by both Teacher and Student inboxes.
 *
 * <p>Layout structure (mirrors the rest of Midori so the inbox feels native
 * to the product):
 *
 * <ol>
 *   <li><strong>Hero header</strong> — gradient surface with the type icon,
 *       category label and the unread dot. Provides a focal point and keeps
 *       the close button visually grouped.</li>
 *   <li><strong>Title + meta row</strong> — large title with the timestamp
 *       underneath; respects dark/light theming.</li>
 *   <li><strong>Meta grid</strong> — three glass-surface cards (Status,
 *       Type, Received) so the user can scan the metadata without having
 *       to read the body text.</li>
 *   <li><strong>Scrollable body</strong> — large, well-spaced prose area
 *       capped at a sensible height so long messages never break the
 *       layout.</li>
 *   <li><strong>Action footer</strong> — "Mark as read" + "Close" so the
 *       primary action sits where users expect (right-hand side of drawer).</li>
 * </ol>
 *
 * Closing the drawer after the user has acknowledged the message marks
 * the row as read, matching the click-to-dismiss behaviour Student had
 * before the refactor.
 */
export function NotificationPreviewSheet({
  notification,
  open,
  onOpenChange,
  onMarkRead,
}: NotificationPreviewSheetProps) {
  const visual = useMemo(() => getNotificationTypeVisual(notification?.type), [notification?.type]);
  const Icon = visual.icon;

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next && notification?.unread && onMarkRead) {
      onMarkRead(notification);
    }
  };

  const handleClose = () => handleOpenChange(false);
  const handleMarkRead = () => {
    if (notification?.unread && onMarkRead) onMarkRead(notification);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="[&>button:first-of-type]:hidden flex w-full flex-col gap-0 overflow-hidden border-l border-white/10 bg-background p-0 sm:max-w-lg"
      >
        {notification ? (
          <>
            {/* ── Hero header ─────────────────────────────────────── */}
            <div
              className={cn(
                "relative overflow-hidden border-b border-border px-6 pb-6 pt-6",
                "bg-gradient-to-br from-primary/20 via-primary/8 to-transparent",
              )}
            >
              {/* Decorative background blobs — subtle and on-brand */}
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl opacity-60",
                  visual.badgeClass,
                )}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
              />

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "grid h-16 w-16 shrink-0 place-items-center rounded-2xl shadow-lg ring-2 ring-white/15",
                      visual.badgeClass,
                    )}
                  >
                    <Icon className="h-8 w-8" aria-hidden />
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm",
                          visual.badgeClass,
                        )}
                      >
                        <Tag className="h-3 w-3" aria-hidden />
                        {visual.label}
                      </span>
                      {notification.unread && (
                        <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                          New
                        </span>
                      )}
                    </div>

                    <SheetTitle className="mt-3 font-display text-2xl font-extrabold leading-tight text-foreground">
                      {notification.title}
                    </SheetTitle>

                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      <time>{notification.time}</time>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close notification"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-background/70 text-muted-foreground shadow-sm backdrop-blur transition-all hover:scale-105 hover:bg-background hover:text-foreground hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            {/* ── Meta cards grid ─────────────────────────────────── */}
            <div className="px-6 pt-5">
              <div className="grid grid-cols-2 gap-3">
                <MetaCard
                  icon={<CheckCheck className="h-3.5 w-3.5" aria-hidden />}
                  label="Status"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full",
                          notification.unread
                            ? "bg-primary shadow-[0_0_8px] shadow-primary/50"
                            : "bg-muted-foreground",
                        )}
                        aria-hidden
                      />
                      {notification.unread ? "Unread" : "Read"}
                    </span>
                  }
                />
                <MetaCard
                  icon={<Hash className="h-3.5 w-3.5" aria-hidden />}
                  label="Type"
                  value={visual.label}
                />
                <MetaCard
                  icon={<CalendarClock className="h-3.5 w-3.5" aria-hidden />}
                  label="Received"
                  value={notification.time}
                  className="col-span-2"
                />
              </div>
            </div>

            <Separator className="mx-6 mt-5 bg-border/60" />

            {/* ── Scrollable message body ─────────────────────────── */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                Message
              </div>
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-5 shadow-md backdrop-blur-sm">
                {notification.desc ? (
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground">
                    {notification.desc}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No additional message provided.
                  </p>
                )}
              </div>

              {/* Footer hint inside scroll area, useful on long messages */}
              <p className="mt-4 text-center text-[11px] text-muted-foreground/80">
                Notification ID: #{notification.id.toString().padStart(4, "0")}
              </p>
            </div>

            {/* ── Action footer ───────────────────────────────────── */}
            <div className="flex shrink-0 items-center gap-2 border-t border-border bg-gradient-to-t from-card/60 to-card/30 px-6 py-4 backdrop-blur-sm">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-border/60"
                onClick={handleClose}
              >
                Close
              </Button>
              {notification.unread && (
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-hero text-white shadow-md hover:opacity-95"
                  onClick={handleMarkRead}
                >
                  <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden />
                  Mark as read
                </Button>
              )}
            </div>
          </>
        ) : (
          /* ── Empty state when no notification is selected ─────── */
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
              <Mail className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <SheetTitle className="font-display text-base">No notification selected</SheetTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a notification from the list to see its details here.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClose} className="mt-2">
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ─── Internal helper ───────────────────────────────────────────── */

interface MetaCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}

/**
 * Small label/value card rendered inside the preview drawer. Mirrors the
 * glass-surface cards used elsewhere in Midori (admin notification modal,
 * teacher classes overview, …) so the visual language stays consistent.
 */
function MetaCard({ icon, label, value, className }: MetaCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-gradient-to-br from-card/70 to-card/40 p-3 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

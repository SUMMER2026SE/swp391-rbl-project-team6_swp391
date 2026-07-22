import { useMemo } from "react";

import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types/notification";

export type NotificationTabId = "all" | "unread" | NotificationType;

export interface NotificationTabDescriptor {
  id: NotificationTabId;
  label: string;
}

interface NotificationTypeTabsProps {
  notifications: Notification[];
  tabs?: NotificationTabDescriptor[];
  activeTab: NotificationTabId;
  onChange: (tab: NotificationTabId) => void;
  className?: string;
}

const DEFAULT_TABS: NotificationTabDescriptor[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "LESSON", label: "Lesson" },
  { id: "CONTEXT", label: "Context" },
  { id: "EXAM", label: "Exam" },
  { id: "APPROVED", label: "Approved" },
  { id: "SYSTEM", label: "System" },
];

/**
 * Shared tab bar used by the inbox. Replaces the bespoke tab bar that only
 * existed in the Teacher route; both Teacher and Student now surface the
 * same filters so power-users can slice their inbox identically across
 * roles.
 */
export function NotificationTypeTabs({
  notifications,
  tabs = DEFAULT_TABS,
  activeTab,
  onChange,
  className,
}: NotificationTypeTabsProps) {
  const counts = useMemo(() => {
    const acc = new Map<NotificationTabId, number>();
    acc.set("all", notifications.length);
    acc.set("unread", notifications.filter((n) => n.unread).length);
    for (const n of notifications) {
      acc.set(n.type, (acc.get(n.type) ?? 0) + 1);
    }
    return acc;
  }, [notifications]);

  return (
    <div
      role="tablist"
      aria-label="Notification filters"
      className={cn("mb-4 flex flex-wrap items-center gap-1 border-b border-border", className)}
    >
      {tabs.map((tab) => {
        const count = counts.get(tab.id) ?? 0;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {count}
            </span>
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

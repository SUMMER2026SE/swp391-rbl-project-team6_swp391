import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type NotificationResponse,
  type NotificationListResponse,
} from "@/lib/api/notifications";
import { api } from "@/lib/api/client";
import { getNotificationTypeConfig, type Notification } from "@/types/notification";
import {
  notificationSocket,
  type NotificationPushPayload,
  type NotificationSocketStatus,
} from "@/lib/websocket/notification-socket";
import {
  usePushNotification,
  type UsePushNotificationReturn,
} from "@/lib/hooks/usePushNotification";

interface NotificationCtx {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (notificationId: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  /**
   * Realtime push state. Components can use this to render a connection
   * indicator (e.g. a small dot in the bell area) or to debug dropped
   * notifications.
   */
  pushStatus: NotificationSocketStatus;
  /**
   * Push notification subscription state. The shape is whatever
   * `usePushNotification()` returns, exposed through the context so any
   * consumer (e.g. the bell dropdown) can render a subscription toggle
   * (loading spinner, error state, etc.) without duplicating the
   * subscription lifecycle.
   */
  pushNotification: UsePushNotificationReturn;
}

const NotificationCtx = createContext<NotificationCtx | null>(null);

function relativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return diffMins + "m ago";
  if (diffHours < 24) return diffHours + "h ago";
  if (diffDays < 7) return diffDays + "d ago";
  return date.toLocaleDateString();
}

function mapToNotification(n: NotificationResponse | NotificationPushPayload) {
  const config = getNotificationTypeConfig(((n.type as unknown) ?? "SYSTEM") as never);
  return {
    id: n.id,
    title: n.title,
    desc: n.content || "",
    time: relativeTime(n.createdAt),
    unread: !n.isRead,
    icon: config.icon,
    type: ((n.type as unknown) ?? "SYSTEM") as Notification["type"],
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<NotificationSocketStatus>("idle");

  // Push notification subscription
  const pushNotification = usePushNotification();

  // Register service worker for push notifications
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register service worker if not already registered
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          // Check if service worker is already registered
          return navigator.serviceWorker.getRegistration();
        })
        .then((existingRegistration) => {
          if (!existingRegistration) {
            // Register the service worker from public folder
            return navigator.serviceWorker.register("/service-worker.js", {
              scope: "/",
            });
          }
          return existingRegistration;
        })
        .catch((error) => {
          console.warn("[Push] Service worker registration failed:", error);
        });
    }
  }, []);

  // Keep the latest notifications in a ref so the WebSocket listener
  // (registered once at mount) can read/write without re-subscribing on
  // every state change. Re-subscribing on every render would defeat the
  // dedup logic and create a new closure each time.
  const notificationsRef = useRef<Notification[]>([]);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: NotificationListResponse = await getNotifications();
      setNotifications(data.notifications.map(mapToNotification));
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Idempotently merge a push payload into the local state.
   *
   * <ul>
   *   <li>If the notification id is new: prepend it and bump unread count.</li>
   *   <li>If the id already exists: update its content in place so the bell
   *       reflects the latest payload. We never decrement unread here, because
   *       the source of truth for "read" is still the server-side
   *       UserNotification row (handled by markRead / refresh).</li>
   * </ul>
   *
   * Returns true when the notification was newly inserted (i.e. the caller
   * should surface a toast), false when it was already known.
   */
  const applyPush = useCallback((payload: NotificationPushPayload): boolean => {
    let inserted = false;
    setNotifications((prev) => {
      const existingIndex = prev.findIndex((n) => n.id === payload.id);
      if (existingIndex >= 0) {
        // Idempotent update. We do NOT change `unread` here: the user may
        // have just marked this notification as read in another tab and a
        // subsequent refresh() is responsible for reconciling that.
        const next = prev.slice();
        next[existingIndex] = {
          ...next[existingIndex],
          title: payload.title,
          desc: payload.content || "",
          time: relativeTime(payload.createdAt),
          type: (payload.type ?? next[existingIndex].type) as Notification["type"],
        };
        return next;
      }
      const mapped = mapToNotification(payload);
      inserted = true;
      return [mapped, ...prev];
    });
    if (inserted && !payload.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
    return inserted;
  }, []);

  // Surface a toast only when the user is not currently inside the inbox.
  // The inbox already renders the new row, so a toast would be redundant.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isOnInboxRoute =
    pathname === "/student/notifications" || pathname === "/teacher/notifications";

  // ── WebSocket lifecycle ──────────────────────────────────────────────
  // The provider owns the socket lifetime. We open it when a token exists
  // and tear it down on unmount. Because the singleton lives in module
  // scope, React StrictMode's double-mount in development does not open
  // two sockets: the first effect tears the socket down before the second
  // effect runs.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFrame = (frame: { type: string; payload?: unknown }) => {
      if (frame.type !== "notification.created" || !frame.payload) {
        return;
      }
      const payload = frame.payload as NotificationPushPayload;
      const wasInserted = applyPush(payload);
      if (wasInserted && !isOnInboxRoute) {
        toast(payload.title, {
          description: payload.content || undefined,
        });
      }
    };
    const removeListener = notificationSocket.addListener(handleFrame);

    const removeStatusListener = notificationSocket.addStatusListener((status) => {
      setPushStatus(status);
    });

    if (api.getToken()) {
      notificationSocket.connect();
    }

    return () => {
      removeListener();
      removeStatusListener();
      // We intentionally do NOT disconnect on provider unmount: the socket
      // is a module-level singleton that the auth layer is responsible for
      // tearing down on logout (see logout effect below).
    };
    // isOnInboxRoute / applyPush are read inside the listener via the ref
    // pattern so the effect runs exactly once at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh whenever the active route is one of the in-app notification
  // pages, OR when the route first becomes one of those pages. The push
  // channel keeps the bell badge current on every page, so we only need a
  // full pull when the user opens the inbox itself (which expects the
  // canonical, server-sorted list).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOnInboxRoute) return;
    refresh();
  }, [isOnInboxRoute, refresh]);

  // Tie the socket to the auth token. A logout removes the token, which
  // makes connect() a no-op until the next login. We detect both
  // transitions through the auth context's user object.
  // We don't import useAuth here to avoid a circular dependency between
  // AuthProvider and NotificationProvider; instead we poll localStorage on
  // the login/logout events the auth context publishes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      if (api.getToken()) {
        notificationSocket.reconnectWithFreshToken();
      } else {
        notificationSocket.disconnect();
      }
    };
    window.addEventListener("midori:auth-changed", handler);
    return () => window.removeEventListener("midori:auth-changed", handler);
  }, []);

  // Listen for service worker messages (notification clicks)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK") {
        const notificationId = event.data.notificationId;

        // Refresh notifications to get the latest state
        refresh();

        // Show a toast with click confirmation
        if (notificationId) {
          toast.info("Notification clicked", {
            description: `Opening notification ${notificationId}`,
          });
        }
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleSWMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, [refresh]);

  const markRead = useCallback(async (notificationId: number) => {
    // Capture the previous state so we can restore exactly what was there if
    // the request fails. This avoids the previous bug where a concurrent
    // refresh() would race with the revert and leave unreadCount inconsistent.
    let previousUnread: boolean | null = null;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notificationId) {
          previousUnread = n.unread;
          return { ...n, unread: false };
        }
        return n;
      }),
    );
    if (previousUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    try {
      await markAsRead(notificationId);
    } catch {
      // Revert only if the notification was actually unread before
      if (previousUnread) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, unread: true } : n)),
        );
        setUnreadCount((prev) => prev + 1);
      }
      throw new Error("Failed to mark as read");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    // Snapshot current state for a precise revert
    const snapshot = notifications.map((n) => ({ ...n }));
    const previousCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
    try {
      await markAllAsRead();
    } catch {
      setNotifications(snapshot);
      setUnreadCount(previousCount);
      throw new Error("Failed to mark all as read");
    }
  }, [notifications, unreadCount]);

  return (
    <NotificationCtx.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refresh,
        markRead,
        markAllRead,
        pushStatus,
        pushNotification,
      }}
    >
      {children}
    </NotificationCtx.Provider>
  );
}

export function useNotifications(): NotificationCtx {
  const ctx = useContext(NotificationCtx);
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      refresh: async () => {},
      markRead: async () => {},
      markAllRead: async () => {},
      pushStatus: "idle",
      pushNotification: {
        isSupported: false,
        isSubscribed: false,
        isSubscribing: false,
        permission: "unsupported",
        error: null,
        subscribe: async () => false,
        unsubscribe: async () => false,
        checkSubscription: async () => {},
      },
    };
  }
  return ctx;
}

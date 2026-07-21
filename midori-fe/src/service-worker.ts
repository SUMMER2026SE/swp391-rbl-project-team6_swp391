/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "midori-push-v1";

// Notification click handler - navigate to correct page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  const notificationId = notificationData?.notificationId;

  // Determine the URL to open based on notification type
  let targetUrl = "/notifications";

  if (notificationId) {
    // If we have a notification ID, open notifications page
    // The frontend will handle showing the specific notification detail
    targetUrl = `/notifications?id=${notificationId}`;
  }

  // Check if there's already a window open
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window first
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.postMessage({
            type: "NOTIFICATION_CLICK",
            notificationId: notificationId,
          });
          return;
        }
      }

      // If no existing window, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});

// Push event handler - display the notification
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("[ServiceWorker] Push event but no data");
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    // If not JSON, try to get as text
    const text = event.data.text();
    data = {
      title: "Midori",
      body: text,
    };
  }

  const title = data.title || "Midori";
  // `vibrate` is part of the standard web Notifications API but missing from
  // the DOM lib bundled with our TypeScript build. Build the options object
  // using a type that explicitly allows the field so we get full type safety
  // on every other `NotificationOptions` property without resorting to `any`
  // or `@ts-expect-error`.
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: data.body || data.content || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/badge-72x72.png",
    tag: data.tag || `notification-${data.notificationId || Date.now()}`,
    data: {
      url: data.url || "/notifications",
      notificationId: data.notificationId,
    },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    silent: false,
  };

  // Handle different notification types
  if (data.type) {
    // Add notification type to data for custom styling if needed
    (options.data as Record<string, unknown>).type = data.type;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Install event
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

export {};

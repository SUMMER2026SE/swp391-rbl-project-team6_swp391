// MIDORI Push Notification Service Worker
// This file handles push notifications when the browser is closed/background

const CACHE_NAME = 'midori-push-v1';

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const notificationId = notificationData.notificationId;
  
  let targetUrl = '/notifications';
  if (notificationId) {
    targetUrl = `/notifications?id=${notificationId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            notificationId: notificationId,
          });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Push event handler
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[SW] Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    const text = event.data.text();
    data = { title: 'Midori', body: text };
  }

  const title = data.title || 'Midori';
  const options = {
    body: data.body || data.content || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || `notification-${data.notificationId || Date.now()}`,
    data: {
      url: data.url || '/notifications',
      notificationId: data.notificationId,
    },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    silent: false,
  };

  if (data.type) {
    options.data.type = data.type;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Install
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});

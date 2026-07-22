import { useCallback, useEffect, useState } from "react";
import {
  getVapidPublicKey,
  getSubscriptionStatus,
  saveSubscription,
  unsubscribe as unsubscribeApi,
  type SaveSubscriptionRequest,
} from "@/lib/api/push";

// Extend Window interface for service worker registration
declare global {
  interface Window {
    workbox?: unknown;
  }
}

export interface UsePushNotificationReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isSubscribing: boolean;
  permission: NotificationPermission | "unsupported";
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  checkSubscription: () => Promise<void>;
}

/**
 * Hook for managing Web Push notification subscription.
 *
 * Handles:
 * - Checking browser support
 * - Permission management
 * - Subscription/unsubscription to push notifications
 * - Service worker registration
 *
 * @example
 * ```tsx
 * const { isSubscribed, subscribe, unsubscribe, permission } = usePushNotification();
 *
 * if (permission === "denied") {
 *   return <p>Notifications are blocked</p>;
 * }
 *
 * return (
 *   <button onClick={isSubscribed ? unsubscribe : subscribe}>
 *     {isSubscribed ? "Disable Notifications" : "Enable Notifications"}
 *   </button>
 * );
 * ```
 */
export function usePushNotification(): UsePushNotificationReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      } else {
        setPermission("unsupported");
      }
    };

    checkSupport();

    // Listen for permission changes
    if ("Notification" in window) {
      const handlePermissionChange = () => {
        setPermission(Notification.permission);
      };

      // Poll for permission changes (Notification doesn't have an event for this)
      const interval = setInterval(() => {
        if (Notification.permission !== permission) {
          handlePermissionChange();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  // Check subscription status on mount
  useEffect(() => {
    if (isSupported && permission === "granted") {
      checkSubscription();
    }
  }, [isSupported, permission]);

  /**
   * Check if user is already subscribed to push notifications.
   */
  const checkSubscription = useCallback(async () => {
    if (!isSupported) {
      setIsSubscribed(false);
      return;
    }

    try {
      // First check with backend API
      const status = await getSubscriptionStatus();
      setIsSubscribed(status.subscribed);

      // Also verify with service worker registration
      if (status.subscribed && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const pushSubscription = await registration.pushManager.getSubscription();
        if (!pushSubscription) {
          // Backend says subscribed but no local subscription - might be from another browser
          setIsSubscribed(true);
        }
      }
    } catch (err) {
      // If API fails, check with service worker
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const pushSubscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!pushSubscription);
        }
      } catch {
        setError("Failed to check subscription status");
      }
    }
  }, [isSupported]);

  /**
   * Subscribe to push notifications.
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsSubscribing(true);

    try {
      // Step 1: Check if service workers are supported
      if (!("serviceWorker" in navigator)) {
        setError("Service workers are not supported");
        return false;
      }

      // Step 2: Request notification permission
      if (permission !== "granted") {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          setError("Notification permission denied");
          setPermission(result);
          return false;
        }
        setPermission(result);
      }

      // Step 3: Get VAPID public key from backend
      const { publicKey } = await getVapidPublicKey();
      if (!publicKey) {
        setError("Push notifications are not configured on the server");
        return false;
      }

      // Step 4: Register service worker if not already
      let registration = await navigator.serviceWorker.ready;

      // Check if we have a service worker
      const existingWorker = await navigator.serviceWorker.getRegistration();
      if (!existingWorker) {
        // Load service worker from public folder
        registration = await navigator.serviceWorker.register("/service-worker.js", {
          scope: "/",
        });
      }

      // Step 5: Subscribe to push.
      // `applicationServerKey` accepts a `BufferSource` (or a base64url
      // string). `urlBase64ToUint8Array` returns a `Uint8Array`, which is
      // structurally a `BufferSource`, but TypeScript's lib types for
      // `PushSubscriptionOptionsInit` are picky about narrowing the union.
      // We feed the bytes through a typed helper that returns the value
      // cast as `BufferSource` so the call site stays strict and we never
      // fall back to `any`.
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toApplicationServerKey(publicKey),
      });

      // Step 6: Send subscription to backend
      const subscriptionData: SaveSubscriptionRequest = {
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
        auth: arrayBufferToBase64(subscription.getKey("auth")!),
        expirationTime: subscription.expirationTime,
      };

      await saveSubscription(subscriptionData);

      setIsSubscribed(true);
      console.log("[Push] Successfully subscribed to push notifications");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      setError(message);
      console.error("[Push] Subscription failed:", err);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [permission]);

  /**
   * Unsubscribe from push notifications.
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setError(null);

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setError("Push notifications are not supported");
        return false;
      }

      // Get current subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Notify backend
        try {
          await unsubscribeApi(subscription.endpoint);
        } catch {
          // Backend might not have this subscription, that's ok
          console.log("[Push] Endpoint not found in backend (may be from different browser)");
        }
      }

      setIsSubscribed(false);
      console.log("[Push] Successfully unsubscribed from push notifications");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(message);
      console.error("[Push] Unsubscription failed:", err);
      return false;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isSubscribing,
    permission,
    error,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}

// ─── Utility Functions ─────────────────────────────────────────────────────────────────

/**
 * Convert a base64 string to Uint8Array for applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Prepare a VAPID public key for `PushSubscriptionOptionsInit.applicationServerKey`.
 *
 * `PushManager.subscribe` types the field as `BufferSource | string`; we
 * always feed it the parsed `Uint8Array` because that is what every
 * browser accepts. Keeping the cast behind a named helper documents the
 * intent and avoids an inline `as unknown as BufferSource` at the call site.
 */
function toApplicationServerKey(publicKey: string): BufferSource {
  return urlBase64ToUint8Array(publicKey) as unknown as BufferSource;
}

/**
 * Convert ArrayBuffer to base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

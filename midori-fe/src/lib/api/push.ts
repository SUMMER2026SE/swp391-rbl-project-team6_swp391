import { api } from "./client";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface VapidPublicKeyResponse {
  publicKey: string;
}

export interface SaveSubscriptionRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
  expirationTime?: number | null;
}

export interface SubscriptionResponse {
  subscribed: boolean;
  message: string;
  activeCount: number;
}

export interface SubscriptionStatusResponse {
  subscribed: boolean;
}

// ─── API Functions ─────────────────────────────────────────────────────────────────

/**
 * Get the VAPID public key from backend.
 * This key is used to subscribe to push notifications.
 */
export async function getVapidPublicKey(): Promise<VapidPublicKeyResponse> {
  return api.get<VapidPublicKeyResponse>("/push/vapid-public-key");
}

/**
 * Save push subscription to backend.
 */
export async function saveSubscription(subscription: SaveSubscriptionRequest): Promise<SubscriptionResponse> {
  return api.post<SubscriptionResponse>("/push/subscribe", subscription);
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribe(endpoint: string): Promise<SubscriptionResponse> {
  return api.post<SubscriptionResponse>("/push/unsubscribe", { endpoint });
}

/**
 * Get push subscription status.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  return api.get<SubscriptionStatusResponse>("/push/status");
}

import { api } from "@/lib/api/client";

/**
 * Realtime push channel for user notifications.
 *
 * <p>Speaks raw WebSocket (no STOMP) to {@code /ws/notifications?token=...}.
 * The connection auto-reconnects with exponential backoff and heartbeat
 * pings every 25s so a dead socket is detected before the broker timeout.
 *
 * <p>The class is intentionally framework-agnostic: it owns a single socket
 * per instance and emits parsed frames through an event listener. Multiple
 * subscribers can listen at once, so the {@code NotificationContext} and any
 * future consumer (e.g. analytics) can both react to the same stream.
 *
 * <p>The class also runs entirely in the browser: there is no React import,
 * no automatic reconnect on token refresh (the user logs out / back in, the
 * provider tears down and re-mounts the channel) and no localStorage mutation.
 */
export type NotificationPushPayload = {
  id: number;
  title: string;
  content: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationPushFrame =
  | { type: "hello"; userId: string }
  | { type: "pong" }
  | { type: "notification.created"; payload: NotificationPushPayload }
  | { type: string; payload?: unknown };

export type NotificationSocketStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed";

export type NotificationSocketListener = (frame: NotificationPushFrame) => void;
export type NotificationSocketStatusListener = (status: NotificationSocketStatus) => void;

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 25_000;
const HEARTBEAT_TIMEOUT_MS = 60_000;

function deriveWsBaseUrl(): string {
  // We need the bare WS host (no /api suffix). Read VITE_API_BASE_URL and
  // strip the trailing /api if present so we can reuse the same env var.
  const base = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api") as string;
  try {
    const url = new URL(base);
    url.pathname = url.pathname.replace(/\/api\/?$/, "");
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "ws://localhost:8080";
  }
}

export class NotificationSocket {
  private url: string;
  private ws: WebSocket | null = null;
  private listeners = new Set<NotificationSocketListener>();
  private statusListeners = new Set<NotificationSocketStatusListener>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatWatchdog: ReturnType<typeof setTimeout> | null = null;
  private explicitlyClosed = false;
  private status: NotificationSocketStatus = "idle";
  private currentToken: string | null = null;

  constructor() {
    this.url = `${deriveWsBaseUrl()}/ws/notifications`;
  }

  /**
   * Open (or re-open) the socket. Calling {@link connect} on an already-open
   * socket is a no-op. The token is re-read from the API client each time so
   * a fresh login is picked up automatically on the next reconnect.
   */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const token = api.getToken();
    if (!token) {
      // Without a token there is nothing to authenticate with - stay idle
      // and let the next connect() (after login) do the work.
      this.setStatus("idle");
      return;
    }
    this.currentToken = token;
    this.explicitlyClosed = false;

    let socket: WebSocket;
    try {
      socket = new WebSocket(`${this.url}?token=${encodeURIComponent(token)}`);
    } catch (err) {
      console.warn("[NotificationSocket] failed to construct WebSocket", err);
      this.scheduleReconnect();
      return;
    }
    this.ws = socket;
    this.setStatus("connecting");

    socket.addEventListener("open", () => {
      this.reconnectAttempts = 0;
      this.setStatus("open");
      this.startHeartbeat();
    });

    socket.addEventListener("message", (event) => {
      // A valid pong also satisfies the watchdog, so reset it on any frame.
      this.armHeartbeatWatchdog();
      this.dispatchRaw(event.data);
    });

    socket.addEventListener("close", (event) => {
      this.stopHeartbeat();
      this.ws = null;
      if (this.explicitlyClosed) {
        this.setStatus("closed");
        return;
      }
      // 4xxx codes are client errors (auth, malformed token) - retrying with
      // the same credentials will keep failing, so back off instead of
      // hammering the server. The token may have been refreshed in the
      // meantime; the next reconnect attempt will read the fresh token.
      if (event.code >= 4000 && event.code < 5000) {
        console.warn(
          `[NotificationSocket] closed code=${event.code} reason=${event.reason} - will retry with fresh token`,
        );
      } else {
        console.debug(
          `[NotificationSocket] closed code=${event.code} reason=${event.reason}`,
        );
      }
      this.setStatus("closed");
      this.scheduleReconnect();
    });

    socket.addEventListener("error", (event) => {
      console.warn("[NotificationSocket] error", event);
      // "error" is always followed by a "close" event, so we let the close
      // handler take care of scheduling the reconnect.
    });
  }

  disconnect(): void {
    this.explicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1000, "client-disconnect");
      } catch {
        // Best-effort close; the socket may already be in CLOSING state.
      }
      this.ws = null;
    }
    this.setStatus("closed");
  }

  /**
   * Force a fresh connection using the latest token. Used when the user
   * logs in or the auth context signals a credential change.
   */
  reconnectWithFreshToken(): void {
    this.reconnectAttempts = 0;
    if (this.ws) {
      try {
        this.ws.close(4000, "token-refresh");
      } catch {
        // Best-effort: the socket will fall through to the close handler
        // which will schedule a reconnect with the new token.
      }
    } else {
      this.connect();
    }
  }

  addListener(listener: NotificationSocketListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  addStatusListener(listener: NotificationSocketStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  getStatus(): NotificationSocketStatus {
    return this.status;
  }

  private dispatchRaw(raw: unknown): void {
    if (typeof raw !== "string") {
      return;
    }
    let frame: NotificationPushFrame;
    try {
      frame = JSON.parse(raw) as NotificationPushFrame;
    } catch {
      // The server may send a bare "pong" string in response to a heartbeat
      // ping; tolerate that case rather than logging noise.
      if (raw.trim() === "pong") {
        frame = { type: "pong" };
      } else {
        console.warn("[NotificationSocket] received non-JSON frame:", raw);
        return;
      }
    }
    for (const listener of this.listeners) {
      try {
        listener(frame);
      } catch (err) {
        // A buggy listener must not break the dispatch loop for other
        // subscribers. Log and continue so every consumer still receives
        // the frame.
        console.error("[NotificationSocket] listener threw", err);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.explicitlyClosed) {
      return;
    }
    // Pick up a fresh token on each retry so an expired token is naturally
    // replaced without a hard reload. This is what makes the channel survive
    // an access-token rotation triggered by a parallel HTTP call.
    const latestToken = api.getToken();
    if (!latestToken) {
      // No credentials - remain idle until the auth layer restores the token.
      this.setStatus("idle");
      return;
    }
    this.currentToken = latestToken;

    const delay = Math.min(
      INITIAL_BACKOFF_MS * 2 ** this.reconnectAttempts,
      MAX_BACKOFF_MS,
    );
    // Add a small jitter so multiple tabs do not reconnect in lockstep.
    const jitter = Math.floor(Math.random() * 500);
    this.reconnectAttempts++;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay + jitter);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }
      try {
        this.ws.send("ping");
      } catch (err) {
        console.warn("[NotificationSocket] heartbeat send failed", err);
      }
    }, HEARTBEAT_INTERVAL_MS);
    this.armHeartbeatWatchdog();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatWatchdog) {
      clearTimeout(this.heartbeatWatchdog);
      this.heartbeatWatchdog = null;
    }
  }

  /**
   * If no frame arrives within {@link HEARTBEAT_TIMEOUT_MS} we assume the
   * socket is dead (e.g. NAT table expired) and close it so the close
   * handler can reconnect. Receiving any frame (pong, hello, push) resets
   * this watchdog.
   */
  private armHeartbeatWatchdog(): void {
    if (this.heartbeatWatchdog) {
      clearTimeout(this.heartbeatWatchdog);
    }
    this.heartbeatWatchdog = setTimeout(() => {
      console.warn("[NotificationSocket] heartbeat timeout - forcing reconnect");
      if (this.ws) {
        try {
          this.ws.close(4001, "heartbeat-timeout");
        } catch {
          // Best-effort: the close handler will run regardless.
        }
      }
    }, HEARTBEAT_TIMEOUT_MS);
  }

  private setStatus(next: NotificationSocketStatus): void {
    if (this.status === next) {
      return;
    }
    this.status = next;
    for (const listener of this.statusListeners) {
      try {
        listener(next);
      } catch {
        // Listener errors must not affect status propagation for the rest
        // of the consumers; swallow and keep going.
      }
    }
  }
}

/**
 * Process-wide singleton. The notification context owns the lifecycle
 * (connect on login, disconnect on logout) and we keep this object stable so
 * React strict-mode double-effects don't open two sockets.
 */
export const notificationSocket = new NotificationSocket();
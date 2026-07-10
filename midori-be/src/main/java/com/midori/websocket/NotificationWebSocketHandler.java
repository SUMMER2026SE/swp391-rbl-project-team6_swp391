package com.midori.websocket;

import com.midori.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Push-notification WebSocket endpoint.
 *
 * <p>Protocol:
 * <ul>
 *   <li>Client opens {@code ws(s)://host/ws/notifications?token=<jwt>}.</li>
 *   <li>Server validates the token, binds the session to the userId, sends a
 *       {@code hello} frame, then keeps the socket idle.</li>
 *   <li>Server pushes JSON frames of the shape:
 *       <pre>{ "type": "notification.created", "payload": { ... } }</pre>
 *       where the payload matches {@code NotificationResponse}.</li>
 *   <li>Client may send {@code "ping"} frames; the server replies with
 *       {@code "pong"} so the client can detect dead sockets via heartbeat.</li>
 * </ul>
 *
 * <p>The handler is intentionally minimal and lock-light: it uses a
 * {@link ConcurrentHashMap} for user/session bookkeeping so concurrent inserts
 * and removals from many Tomcat threads are safe.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    public static final String ATTR_USER_ID = "userId";
    public static final String ATTR_EMAIL = "email";

    private final JwtTokenProvider jwtTokenProvider;

    /**
     * userId -> set of sessions (a user may have multiple tabs open, each with
     * its own WebSocket connection).
     */
    private final Map<UUID, java.util.Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        UUID userId = authenticate(session);
        if (userId == null) {
            close(session, CloseStatus.NOT_ACCEPTABLE.withReason("Invalid or missing token"));
            return;
        }
        session.getAttributes().put(ATTR_USER_ID, userId);
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);
        sendJson(session, "{\"type\":\"hello\",\"userId\":\"" + userId + "\"}");
        log.info("WS connected user={} session={} totalSessions={}",
                userId, session.getId(), countSessions(userId));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // The only client-initiated frame we recognise today is "ping".
        // Anything else is logged and ignored so the socket stays open.
        String body = message.getPayload();
        if (body != null && body.trim().equalsIgnoreCase("ping")) {
            sendJson(session, "{\"type\":\"pong\"}");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        UUID userId = (UUID) session.getAttributes().get(ATTR_USER_ID);
        if (userId != null) {
            java.util.Set<WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                }
            }
            log.info("WS closed user={} session={} reason={} remainingSessions={}",
                    userId, session.getId(), status, countSessions(userId));
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        UUID userId = (UUID) session.getAttributes().get(ATTR_USER_ID);
        log.warn("WS transport error user={} session={}: {}",
                userId, session.getId(), exception.getMessage());
        try {
            session.close(CloseStatus.SERVER_ERROR);
        } catch (IOException ignored) {
            // The socket may already be in an unusable state; the close call
            // is best-effort here and a failure is not actionable.
        }
    }

    /**
     * Push a JSON message to every open session belonging to {@code userId}.
     * Returns the number of sessions that successfully received the frame.
     * Failures are logged but do not propagate, so the call is safe to invoke
     * from inside a transactional notification-send path.
     */
    public int pushToUser(UUID userId, String json) {
        java.util.Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return 0;
        }
        int delivered = 0;
        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) {
                sessions.remove(session);
                continue;
            }
            try {
                synchronized (session) {
                    session.sendMessage(new TextMessage(json));
                }
                delivered++;
            } catch (IOException ex) {
                log.warn("Failed to push WS frame to user={} session={}: {}",
                        userId, session.getId(), ex.getMessage());
                try {
                    session.close(CloseStatus.SERVER_ERROR);
                } catch (IOException ignored) {
                    // Best-effort close; the session is already broken if the
                    // send failed, so swallow secondary errors here.
                }
                sessions.remove(session);
            }
        }
        if (sessions.isEmpty()) {
            userSessions.remove(userId);
        }
        return delivered;
    }

    public boolean hasActiveSession(UUID userId) {
        java.util.Set<WebSocketSession> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    public int activeUserCount() {
        return userSessions.size();
    }

    private int countSessions(UUID userId) {
        java.util.Set<WebSocketSession> sessions = userSessions.get(userId);
        return sessions == null ? 0 : sessions.size();
    }

    private UUID authenticate(WebSocketSession session) {
        String token = extractToken(session);
        if (token == null) {
            return null;
        }
        Claims claims = jwtTokenProvider.parseClaims(token);
        if (claims == null) {
            log.debug("WS auth: invalid or expired token");
            return null;
        }
        String email = claims.getSubject();
        String userIdStr = claims.get("userId", String.class);
        if (email == null || userIdStr == null) {
            return null;
        }
        try {
            UUID userId = UUID.fromString(userIdStr);
            session.getAttributes().put(ATTR_EMAIL, email);
            return userId;
        } catch (IllegalArgumentException ex) {
            log.warn("WS auth: malformed userId claim '{}'", userIdStr);
            return null;
        }
    }

    private String extractToken(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null || uri.getQuery() == null) {
            return null;
        }
        for (String pair : uri.getQuery().split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0 && "token".equals(pair.substring(0, eq))) {
                return java.net.URLDecoder.decode(pair.substring(eq + 1), java.nio.charset.StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    private void sendJson(WebSocketSession session, String json) {
        if (!session.isOpen()) {
            return;
        }
        try {
            synchronized (session) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException ex) {
            log.debug("Failed to send WS frame: {}", ex.getMessage());
        }
    }

    private void close(WebSocketSession session, CloseStatus status) {
        try {
            session.close(status);
        } catch (IOException ignored) {
            // Closing may fail if the underlying transport is already torn
            // down; we do not need to act on it.
        }
    }
}
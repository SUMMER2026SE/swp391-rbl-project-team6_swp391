package com.midori.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.dto.notification.NotificationResponse;
import com.midori.entity.UserNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Bridges the notification service layer with the WebSocket layer.
 *
 * <p>The service is the single place that knows how a {@link UserNotification}
 * becomes a wire payload. It is deliberately stateful on the bean but
 * stateless from the caller's perspective: any thread can call
 * {@link #pushToUsers(List)} and the resulting JSON frames are routed to
 * whichever userIds currently have an open WebSocket session.
 *
 * <p>Pushing is best-effort: if a recipient is offline the frame is dropped.
 * The unread notification is already persisted in the database, so the next
 * pull-style refresh (initial mount, route change) will surface it anyway.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationPushService {

    private final NotificationWebSocketHandler handler;
    private final ObjectMapper objectMapper;

    /**
     * Push the given freshly-persisted {@code userNotifications} to the
     * corresponding users. Each entry's {@link UserNotification#getUser()}
     * is used to identify the recipient; the embedded
     * {@link com.midori.entity.Notification} supplies title / content / type.
     *
     * <p>Returns the number of frames that were actually delivered over an
     * open socket. Zero is a perfectly normal outcome (recipient offline).
     */
    public int pushToUsers(List<UserNotification> userNotifications) {
        if (userNotifications == null || userNotifications.isEmpty()) {
            return 0;
        }
        int delivered = 0;
        for (UserNotification un : userNotifications) {
            if (un == null || un.getUser() == null || un.getNotification() == null) {
                continue;
            }
            delivered += pushSingle(un);
        }
        return delivered;
    }

    private int pushSingle(UserNotification un) {
        NotificationResponse payload = NotificationResponse.builder()
                .id(un.getNotification().getId())
                .title(un.getNotification().getTitle())
                .content(un.getNotification().getContent())
                .type(un.getNotification().getType())
                .isRead(Boolean.TRUE.equals(un.getIsRead()))
                .createdAt(un.getNotification().getCreatedAt())
                .build();

        String json;
        try {
            json = objectMapper.writeValueAsString(new PushFrame("notification.created", payload));
        } catch (JsonProcessingException ex) {
            log.warn("Failed to serialise push payload for notification id={}: {}",
                    un.getNotification().getId(), ex.getMessage());
            return 0;
        }

        UUID userId = un.getUser().getId();
        int n = handler.pushToUser(userId, json);
        if (n > 0) {
            log.debug("Pushed notification id={} to user={} ({} session(s))",
                    un.getNotification().getId(), userId, n);
        }
        return n;
    }

    /**
     * Wire envelope: {@code {"type": "...", "payload": {...}}}.
     * Using a typed envelope (rather than a flat payload) lets us extend the
     * protocol later (e.g. {@code notification.deleted}, {@code unread.count})
     * without breaking existing clients.
     */
    public record PushFrame(String type, Object payload) {}
}
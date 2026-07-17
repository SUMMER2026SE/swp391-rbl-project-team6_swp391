package com.midori.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String title;
    /**
     * Notification body. The DB column allows null (see V10__notifications.sql)
     * so the field is intentionally nullable here to mirror the storage
     * contract rather than imposing a non-null assumption that does not hold.
     */
    private String content;
    private String type;
    private Boolean isRead;
    /**
     * The instant this notification was delivered to the current user
     * (i.e. user_notification.created_at), NOT the instant the admin
     * created the draft.  This drives the relative-time display ("Just now",
     * "5m ago", …) so that a notification sent today is never shown as
     * "1 day ago" just because its Draft was created yesterday.
     */
    private Instant receivedAt;
}

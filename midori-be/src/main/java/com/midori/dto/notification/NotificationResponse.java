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
    private Instant createdAt;
}

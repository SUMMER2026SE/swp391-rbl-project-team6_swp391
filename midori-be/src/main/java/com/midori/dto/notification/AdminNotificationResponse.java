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
public class AdminNotificationResponse {

    private Long id;
    private String title;
    private String content;
    private String type;
    private Instant scheduledAt;
    private String targetType;
    private String targetRole;
    /**
     * Class code (e.g. "N5-A1") for SPECIFIC_CLASS notifications. Legacy
     * rows that used to hold a UUID string are still surfaced as-is; the FE
     * treats the value as opaque and only feeds it back to the verify/send
     * endpoints where the resolver normalises it.
     */
    private String classCode;
    private String displayStatus;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant sentAt;
    private Long recipientCount;
}

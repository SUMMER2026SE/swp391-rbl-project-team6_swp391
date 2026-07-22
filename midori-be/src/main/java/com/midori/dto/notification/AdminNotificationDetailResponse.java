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
public class AdminNotificationDetailResponse {

    private Long id;
    private String title;
    private String content;
    private String type;
    private Instant scheduledAt;
    private String targetType;
    private String targetRole;
    /**
     * Class code (e.g. "N5-A1") for SPECIFIC_CLASS notifications. See
     * {@link AdminNotificationResponse#getClassCode()} for the rationale.
     */
    private String classCode;
    private String displayStatus;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant sentAt;
    private Long recipientCount;
}

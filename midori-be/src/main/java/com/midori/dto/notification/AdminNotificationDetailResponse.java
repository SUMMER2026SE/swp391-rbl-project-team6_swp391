package com.midori.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

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
    private UUID targetClassId;
    private String displayStatus;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant sentAt;
    private Long recipientCount;
}

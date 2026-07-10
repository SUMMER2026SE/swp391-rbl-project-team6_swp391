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
public class SendNotificationResponse {

    private Boolean success;
    private Long notificationId;
    private String status;
    private Instant sentAt;
    private Long recipientCount;
}

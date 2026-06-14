package com.midori.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkReadResponse {

    private Long notificationId;
    private Boolean isRead;
    private String message;
}

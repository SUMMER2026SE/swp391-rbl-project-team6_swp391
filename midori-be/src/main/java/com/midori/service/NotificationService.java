package com.midori.service;

import com.midori.dto.notification.MarkReadResponse;
import com.midori.dto.notification.NotificationListResponse;

import java.util.UUID;

public interface NotificationService {

    NotificationListResponse getCurrentUserNotifications(UUID userId);

    MarkReadResponse markAsRead(Long notificationId, UUID userId);

    MarkReadResponse markAllAsRead(UUID userId);
}

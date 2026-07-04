package com.midori.service;

import com.midori.dto.notification.AdminNotificationDetailResponse;
import com.midori.dto.notification.AdminNotificationResponse;
import com.midori.dto.notification.CreateNotificationRequest;
import com.midori.dto.notification.MarkReadResponse;
import com.midori.dto.notification.NotificationListResponse;
import com.midori.dto.notification.SendNotificationRequest;
import com.midori.dto.notification.SendNotificationResponse;
import com.midori.dto.notification.UpdateNotificationRequest;
import com.midori.entity.NotificationType;
import com.midori.entity.Role;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    NotificationListResponse getCurrentUserNotifications(UUID userId);

    MarkReadResponse markAsRead(Long notificationId, UUID userId);

    MarkReadResponse markAllAsRead(UUID userId);

    SendNotificationResponse sendNotification(Long notificationId, SendNotificationRequest request);

    AdminNotificationDetailResponse createNotification(CreateNotificationRequest request);

    AdminNotificationDetailResponse updateNotification(Long id, UpdateNotificationRequest request);

    Page<AdminNotificationResponse> getAdminNotifications(String type, String keyword, Pageable pageable);

    AdminNotificationDetailResponse getAdminNotification(Long id);

    void deleteAdminNotification(Long id);

    /**
     * Process all notifications whose scheduledAt has elapsed but which have
     * not yet been sent. Intended to be invoked periodically by the scheduler.
     *
     * @return number of notifications that were processed (sent or skipped)
     */
    int processDueScheduledNotifications();
}

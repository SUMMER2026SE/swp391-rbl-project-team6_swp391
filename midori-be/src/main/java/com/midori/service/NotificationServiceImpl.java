package com.midori.service;

import com.midori.dto.notification.MarkReadResponse;
import com.midori.dto.notification.NotificationListResponse;
import com.midori.dto.notification.NotificationResponse;
import com.midori.entity.Notification;
import com.midori.entity.UserNotification;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final UserNotificationRepository userNotificationRepository;

    @Override
    @Transactional(readOnly = true)
    public NotificationListResponse getCurrentUserNotifications(UUID userId) {
        List<UserNotification> userNotifications = userNotificationRepository.findByUserIdWithNotification(userId);

        List<NotificationResponse> notifications = userNotifications.stream()
                .map(this::toNotificationResponse)
                .collect(Collectors.toList());

        long unreadCount = userNotificationRepository.countByUserIdAndIsReadFalse(userId);

        return NotificationListResponse.builder()
                .notifications(notifications)
                .unreadCount(unreadCount)
                .build();
    }

    @Override
    public MarkReadResponse markAsRead(Long notificationId, UUID userId) {
        UserNotification userNotification = userNotificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserNotification", "id", notificationId));

        userNotification.setIsRead(true);
        userNotification.setReadAt(Instant.now());
        userNotificationRepository.save(userNotification);

        return MarkReadResponse.builder()
                .notificationId(notificationId)
                .isRead(true)
                .message("Notification marked as read")
                .build();
    }

    @Override
    public MarkReadResponse markAllAsRead(UUID userId) {
        int updatedCount = userNotificationRepository.markAllAsReadByUserId(userId);

        String message = updatedCount > 0
                ? updatedCount + " notification(s) marked as read"
                : "No unread notifications";

        return MarkReadResponse.builder()
                .notificationId(null)
                .isRead(true)
                .message(message)
                .build();
    }

    private NotificationResponse toNotificationResponse(UserNotification userNotification) {
        Notification notification = userNotification.getNotification();
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .type(notification.getType())
                .isRead(userNotification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

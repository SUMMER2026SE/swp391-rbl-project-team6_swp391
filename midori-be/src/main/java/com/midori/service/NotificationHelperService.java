package com.midori.service;

import com.midori.entity.Notification;
import com.midori.entity.NotificationType;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserNotification;
import com.midori.entity.UserStatus;
import com.midori.repository.NotificationRepository;
import com.midori.repository.UserNotificationRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationHelperService {

    private final NotificationRepository notificationRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final UserRepository userRepository;

    /**
     * Create a single-user database notification.
     * Persists a Notification row and a UserNotification row for the given user.
     */
    public void createNotification(User user, String title, String content, NotificationType type) {
        if (user == null) {
            return;
        }
        Notification notification = Notification.builder()
                .title(title)
                .content(content)
                .type(type.name())
                .build();
        notification = notificationRepository.save(notification);

        UserNotification userNotification = UserNotification.builder()
                .user(user)
                .notification(notification)
                .isRead(false)
                .build();
        userNotificationRepository.save(userNotification);
    }

    /**
     * Broadcast a notification to every active user of a given role.
     * One Notification row is persisted, then one UserNotification row per user.
     * Use for events (e.g. lesson published) that need to reach an entire audience.
     */
    public void notifyAllByRole(Role role, UserStatus status, String title, String content, NotificationType type) {
        List<User> recipients = userRepository.findByRoleAndStatus(role, status);
        if (recipients == null || recipients.isEmpty()) {
            return;
        }

        Notification notification = Notification.builder()
                .title(title)
                .content(content)
                .type(type.name())
                .build();
        notification = notificationRepository.save(notification);

        List<UserNotification> links = new ArrayList<>(recipients.size());
        for (User recipient : recipients) {
            links.add(UserNotification.builder()
                    .user(recipient)
                    .notification(notification)
                    .isRead(false)
                    .build());
        }
        userNotificationRepository.saveAll(links);
    }
}

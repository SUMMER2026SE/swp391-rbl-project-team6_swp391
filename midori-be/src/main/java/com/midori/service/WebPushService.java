package com.midori.service;

import com.midori.dto.notification.NotificationResponse;
import com.midori.dto.push.SaveSubscriptionRequest;
import com.midori.dto.push.SubscriptionResponse;
import com.midori.entity.PushSubscription;
import com.midori.entity.User;
import com.midori.entity.UserNotification;
import com.midori.exception.BadRequestException;
import com.midori.repository.PushSubscriptionRepository;
import com.midori.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executor;

/**
 * Service for managing Web Push subscriptions and sending push notifications.
 */
@Slf4j
@Service
public class WebPushService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final UserRepository userRepository;
    private final Executor webPushTaskExecutor;
    private final boolean webPushEnabled;
    
    private PushService pushService;

    @Autowired
    public WebPushService(
            PushSubscriptionRepository pushSubscriptionRepository,
            UserRepository userRepository,
            @Qualifier("webPushTaskExecutor") Executor webPushTaskExecutor,
            @Qualifier("isWebPushEnabled") boolean webPushEnabled) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.userRepository = userRepository;
        this.webPushTaskExecutor = webPushTaskExecutor;
        this.webPushEnabled = webPushEnabled;
    }

    @Autowired(required = false)
    public void setPushService(@Qualifier("webPush") PushService pushService) {
        this.pushService = pushService;
    }

    /**
     * Save a push subscription for a user.
     */
    @Transactional
    public SubscriptionResponse saveSubscription(UUID userId, SaveSubscriptionRequest request, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Optional<PushSubscription> existing = pushSubscriptionRepository.findByEndpoint(request.getEndpoint());
        if (existing.isPresent()) {
            PushSubscription sub = existing.get();
            if (!sub.getUser().getId().equals(userId)) {
                sub.setUser(user);
            }
            sub.setActive(true);
            sub.setUserAgent(userAgent);
            sub.setAuth(request.getAuth());
            sub.setP256dh(request.getP256dh());
            if (request.getExpirationTime() != null) {
                sub.setExpirationTime(Instant.ofEpochMilli(request.getExpirationTime()));
            }
            pushSubscriptionRepository.save(sub);
        } else {
            PushSubscription sub = PushSubscription.builder()
                    .user(user)
                    .endpoint(request.getEndpoint())
                    .p256dh(request.getP256dh())
                    .auth(request.getAuth())
                    .userAgent(userAgent)
                    .expirationTime(request.getExpirationTime() != null 
                            ? Instant.ofEpochMilli(request.getExpirationTime()) 
                            : null)
                    .active(true)
                    .build();
            pushSubscriptionRepository.save(sub);
        }

        long count = pushSubscriptionRepository.countActiveByUserId(userId);
        return SubscriptionResponse.builder()
                .subscribed(true)
                .message("Push notification subscribed successfully")
                .activeCount(count)
                .build();
    }

    @Transactional
    public SubscriptionResponse unsubscribe(UUID userId, String endpoint) {
        Optional<PushSubscription> sub = pushSubscriptionRepository.findByUserIdAndEndpoint(userId, endpoint);
        if (sub.isEmpty()) {
            return SubscriptionResponse.builder()
                    .subscribed(false)
                    .message("Subscription not found")
                    .activeCount(pushSubscriptionRepository.countActiveByUserId(userId))
                    .build();
        }

        sub.get().setActive(false);
        pushSubscriptionRepository.save(sub.get());

        long count = pushSubscriptionRepository.countActiveByUserId(userId);
        return SubscriptionResponse.builder()
                .subscribed(false)
                .message("Push notification unsubscribed successfully")
                .activeCount(count)
                .build();
    }

    public boolean hasActiveSubscription(UUID userId) {
        return pushSubscriptionRepository.hasActiveSubscription(userId);
    }

    @Async("webPushTaskExecutor")
    public void sendPushToUser(UUID userId, NotificationResponse notification) {
        if (!webPushEnabled || pushService == null) {
            log.debug("WebPush disabled or not configured, skipping push to user {}", userId);
            return;
        }

        List<PushSubscription> subscriptions = pushSubscriptionRepository.findActiveByUserId(userId);
        if (subscriptions.isEmpty()) {
            log.debug("No active push subscriptions for user {}", userId);
            return;
        }

        for (PushSubscription sub : subscriptions) {
            sendPushToSubscription(sub, notification);
        }
    }

    @Async("webPushTaskExecutor")
    public void sendPushToUsers(List<UserNotification> userNotifications) {
        if (!webPushEnabled || pushService == null) {
            log.debug("WebPush disabled or not configured, skipping batch push");
            return;
        }

        if (userNotifications == null || userNotifications.isEmpty()) {
            return;
        }

        for (UserNotification un : userNotifications) {
            if (un == null || un.getUser() == null || un.getNotification() == null) {
                continue;
            }

            NotificationResponse payload = NotificationResponse.builder()
                    .id(un.getNotification().getId())
                    .title(un.getNotification().getTitle())
                    .content(un.getNotification().getContent())
                    .type(un.getNotification().getType())
                    .isRead(Boolean.TRUE.equals(un.getIsRead()))
                    .createdAt(un.getNotification().getCreatedAt())
                    .build();

            sendPushToUser(un.getUser().getId(), payload);
        }
    }

    private void sendPushToSubscription(PushSubscription subscription, NotificationResponse notification) {
        if (!subscription.isValid()) {
            log.debug("Invalid subscription for endpoint: {}", subscription.getEndpoint());
            return;
        }

        if (pushService == null) {
            log.debug("PushService not initialized, skipping push");
            return;
        }

        try {
            Subscription sub = new Subscription(
                    subscription.getEndpoint(),
                    new Subscription.Keys(subscription.getP256dh(), subscription.getAuth())
            );

            String payload = buildPushPayload(notification);
            Notification pushNotification = new Notification(sub, payload);

            pushService.send(pushNotification);
            
            log.debug("Push sent successfully to endpoint: {}", 
                    truncateEndpoint(subscription.getEndpoint()));
            
        } catch (Exception e) {
            String errorMessage = e.getMessage();
            log.error("Failed to send push to endpoint {}: {}", 
                    truncateEndpoint(subscription.getEndpoint()), errorMessage);
            
            if (errorMessage != null && 
                (errorMessage.contains("410") || errorMessage.contains("Gone") || errorMessage.contains("NOT_FOUND"))) {
                pushSubscriptionRepository.deactivateByEndpoint(subscription.getEndpoint());
            }
        }
    }

    private String buildPushPayload(NotificationResponse notification) {
        return String.format(
            "{\"title\":\"%s\",\"body\":\"%s\",\"icon\":\"%s\",\"badge\":\"%s\",\"tag\":\"notification-%d\",\"data\":{\"url\":\"%s\",\"notificationId\":%d}}",
            escapeJson(notification.getTitle()),
            escapeJson(notification.getContent() != null ? notification.getContent() : ""),
            "/icons/icon-192.png",
            "/icons/badge-72x72.png",
            notification.getId(),
            "/notifications",
            notification.getId()
        );
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String truncateEndpoint(String endpoint) {
        if (endpoint == null) return "null";
        if (endpoint.length() <= 50) return endpoint;
        return endpoint.substring(0, 50) + "...";
    }

    @Transactional
    public int cleanupExpiredSubscriptions() {
        int deleted = pushSubscriptionRepository.deleteExpiredSubscriptions();
        if (deleted > 0) {
            log.info("Cleaned up {} expired push subscriptions", deleted);
        }
        return deleted;
    }
}

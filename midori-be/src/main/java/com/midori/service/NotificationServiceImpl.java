package com.midori.service;

import com.midori.common.NotificationStatusConstants;
import com.midori.dto.notification.AdminNotificationDetailResponse;
import com.midori.dto.notification.AdminNotificationResponse;
import com.midori.dto.notification.CreateNotificationRequest;
import com.midori.dto.notification.MarkReadResponse;
import com.midori.dto.notification.NotificationListResponse;
import com.midori.dto.notification.NotificationResponse;
import com.midori.dto.notification.SendNotificationRequest;
import com.midori.dto.notification.SendNotificationResponse;
import com.midori.dto.notification.UpdateNotificationRequest;
import com.midori.entity.Notification;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserNotification;
import com.midori.entity.UserStatus;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ClassRepository;
import com.midori.repository.NotificationRepository;
import com.midori.repository.NotificationRepository.NotificationLatestSent;
import com.midori.repository.NotificationRepository.NotificationRecipientCount;
import com.midori.repository.UserNotificationRepository;
import com.midori.repository.UserRepository;
import com.midori.websocket.NotificationPushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final UserNotificationRepository userNotificationRepository;
    private final NotificationHelperService notificationHelperService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ClassRepository classRepository;
    private final NotificationPushService notificationPushService;

    @Override
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
    @Transactional
    public MarkReadResponse markAsRead(Long notificationId, UUID userId) {
        UserNotification userNotification = userNotificationRepository
                .findByNotificationIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserNotification", "notificationId", notificationId));

        if (Boolean.TRUE.equals(userNotification.getIsRead())) {
            return MarkReadResponse.builder()
                    .notificationId(notificationId)
                    .isRead(true)
                    .message("Notification already marked as read")
                    .build();
        }

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
    @Transactional
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

    @Override
    @Transactional
    public SendNotificationResponse sendNotification(Long notificationId, SendNotificationRequest request) {
        // Pessimistic lock on the Notification row. This serialises concurrent
        // send attempts for the SAME notification_id at the database layer:
        // the second transaction blocks until the first commits, then re-reads
        // the user_notifications table and skips the duplicates via the
        // application-level guard in NotificationHelperService.persistLinks.
        Notification notification = notificationRepository.findByIdForUpdate(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        String targetType = request.getTargetType();
        if (targetType == null || targetType.isBlank()) {
            throw new BadRequestException("targetType is required");
        }

        // Guard against resending an already-PUBLISHED notification. After
        // the first successful send the notification will have at least one
        // user_notifications row, so a non-zero count here means this send
        // would be a duplicate. We fail fast (HTTP 400) so the UI cannot
        // issue repeated Send calls against the same notification - this
        // is a defence-in-depth on top of the frontend sentIds guard.
        long existingRecipients = notificationRepository
                .countUserNotificationsByNotificationId(notificationId);
        if (existingRecipients > 0) {
            throw new BadRequestException(
                    "Notification has already been sent and cannot be sent again");
        }

        List<User> recipients = resolveRecipients(targetType, request);
        if (recipients.isEmpty()) {
            throw new BadRequestException("No recipients found for the selected target");
        }

        // Snapshot recipient count BEFORE the helper inserts so we can tell
        // exactly how many UserNotification rows were added vs already existed.
        long recipientCountBefore = notificationRepository
                .countUserNotificationsByNotificationId(notificationId);

        // Ask the helper for the exact rows it just persisted so we can push
        // them over the websocket. The helper still does the duplicate-skip
        // guard, so the returned list contains only the freshly-inserted
        // UserNotification rows - never pre-existing ones.
        List<UserNotification> newLinks = notificationHelperService
                .sendExistingNotificationAndReturnLinks(notification, recipients);

        long recipientCountAfter = notificationRepository
                .countUserNotificationsByNotificationId(notificationId);
        long newRows = recipientCountAfter - recipientCountBefore;

        Instant sentAt = notificationRepository.findLatestUserNotificationCreatedAt(notificationId);

        log.info("Sent notification id={} targetType={} requested={} newLinks={} totalRecipients={}",
                notificationId, targetType, recipients.size(), newRows, recipientCountAfter);

        // Schedule a realtime push once the surrounding transaction commits.
        // Registering the synchronisation here (instead of pushing inline) is
        // what guarantees that the receiving client never sees a "ghost"
        // notification: if the @Transactional method rolls back, the
        // afterCommit hook never fires and the WS frame is never sent.
        if (!newLinks.isEmpty()) {
            schedulePushAfterCommit(newLinks);
        }

        return SendNotificationResponse.builder()
                .success(true)
                .notificationId(notification.getId())
                .status(NotificationStatusConstants.STATUS_PUBLISHED)
                .sentAt(sentAt)
                .recipientCount(recipientCountAfter)
                .build();
    }

    /**
     * Register a transaction-synchronisation that fires only after the
     * current {@code @Transactional} boundary commits successfully. We push
     * outside the transaction so that (a) the data is durable when the
     * client receives it, and (b) a rollback never produces a "ghost"
     * notification in someone's inbox.
     */
    private void schedulePushAfterCommit(List<UserNotification> newLinks) {
        if (newLinks == null || newLinks.isEmpty()) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            // No transaction in flight (shouldn't happen for @Transactional
            // methods, but we guard anyway): push inline.
            try {
                notificationPushService.pushToUsers(newLinks);
            } catch (Exception ex) {
                log.warn("Inline push failed: {}", ex.getMessage());
            }
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    int delivered = notificationPushService.pushToUsers(newLinks);
                    log.debug("afterCommit push: {} frame(s) delivered for {} new link(s)",
                            delivered, newLinks.size());
                } catch (Exception ex) {
                    // The push is best-effort: a failure here must never
                    // affect the already-committed notification rows.
                    log.warn("WS push afterCommit failed: {}", ex.getMessage());
                }
            }
        });
    }

    @Override
    @Transactional
    public AdminNotificationDetailResponse createNotification(CreateNotificationRequest request) {
        String targetType = request.getTargetType();
        if (targetType == null || targetType.isBlank()) {
            throw new BadRequestException("targetType is required");
        }

        // SPECIFIC_CLASS branch is intentionally left untouched per current scope.
        // The validation below only enforces the *inverse* invariant: any non-ALL
        // audience that is not SPECIFIC_CLASS must not carry a targetClassId.
        boolean isSpecificClass = "SPECIFIC_CLASS".equalsIgnoreCase(targetType);
        if (!isSpecificClass && request.getTargetClassId() != null) {
            throw new BadRequestException(
                    "targetClassId must be null when targetType is " + targetType);
        }
        if (isSpecificClass) {
            if (request.getTargetClassId() == null) {
                throw new BadRequestException("classCode (class id) is required when target is SPECIFIC_CLASS");
            }
            if (!classRepository.existsById(request.getTargetClassId())) {
                throw new BadRequestException("Class not found for classCode: " + request.getTargetClassId());
            }
        }

        Notification notification = Notification.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .type(request.getType())
                .scheduledAt(request.getScheduledAt())
                .targetType(request.getTargetType())
                .targetRole(request.getTargetRole())
                .targetClassId(request.getTargetClassId())
                .build();

        notification = notificationRepository.save(notification);
        return buildAdminDetail(notification, 0L, null);
    }

    @Override
    @Transactional
    public AdminNotificationDetailResponse updateNotification(Long id, UpdateNotificationRequest request) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));

        // Editing is only allowed while the notification is still a Draft.
        // Once any recipient link has been created (status = PUBLISHED) the
        // record is immutable from the admin's perspective: user_inboxes already
        // reference the title/content, and modifying the source row would
        // desync what each recipient sees. We surface a 400 so the FE shows a
        // clear error instead of silently mutating a sent notification.
        long existingRecipients = notificationRepository
                .countUserNotificationsByNotificationId(id);
        if (existingRecipients > 0) {
            throw new BadRequestException(
                    "Published notification cannot be edited");
        }

        // SPECIFIC_CLASS branch: same validation as create. Reset targetRole
        // and targetClassId when the audience is not SPECIFIC_CLASS so the
        // previous selection does not leak through.
        String targetType = request.getTargetType();
        if (targetType == null || targetType.isBlank()) {
            throw new BadRequestException("targetType is required");
        }
        boolean isSpecificClass = "SPECIFIC_CLASS".equalsIgnoreCase(targetType);
        if (!isSpecificClass && request.getTargetClassId() != null) {
            throw new BadRequestException(
                    "targetClassId must be null when targetType is " + targetType);
        }
        if (isSpecificClass) {
            if (request.getTargetClassId() == null) {
                throw new BadRequestException(
                        "classCode (class id) is required when target is SPECIFIC_CLASS");
            }
            if (!classRepository.existsById(request.getTargetClassId())) {
                throw new BadRequestException(
                        "Class not found for classCode: " + request.getTargetClassId());
            }
        }

        notification.setTitle(request.getTitle());
        notification.setContent(request.getContent());
        notification.setType(request.getType());
        notification.setScheduledAt(request.getScheduledAt());
        notification.setTargetType(request.getTargetType());
        notification.setTargetRole(request.getTargetRole());
        notification.setTargetClassId(request.getTargetClassId());

        notification = notificationRepository.save(notification);

        long recipientCount = notificationRepository
                .countUserNotificationsByNotificationId(id);
        Instant latestSentAt = recipientCount > 0
                ? notificationRepository.findLatestUserNotificationCreatedAt(id)
                : null;
        return buildAdminDetail(notification, recipientCount, latestSentAt);
    }

    @Override
    public Page<AdminNotificationResponse> getAdminNotifications(String type, String keyword, Pageable pageable) {
        Page<Notification> notificationPage;

        if (keyword != null && !keyword.isBlank() && type != null && !type.isBlank()) {
            notificationPage = notificationRepository.findByTypeAndTitleContainingIgnoreCase(type, keyword, pageable);
        } else if (keyword != null && !keyword.isBlank()) {
            notificationPage = notificationRepository.findByTitleContainingIgnoreCase(keyword, pageable);
        } else if (type != null && !type.isBlank()) {
            notificationPage = notificationRepository.findByType(type, pageable);
        } else {
            notificationPage = notificationRepository.findAll(pageable);
        }

        List<Long> ids = notificationPage.getContent().stream()
                .map(Notification::getId)
                .collect(Collectors.toList());
        NotificationStats stats = loadStatsFor(ids);

        return notificationPage.map(n -> buildAdminSummary(n, stats));
    }

    @Override
    public AdminNotificationDetailResponse getAdminNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        NotificationStats stats = loadStatsFor(List.of(id));
        return buildAdminDetail(notification, stats.recipientCounts.getOrDefault(id, 0L),
                stats.latestSentAt.get(id));
    }

    @Override
    @Transactional
    public void deleteAdminNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification", "id", id);
        }
        notificationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public int processDueScheduledNotifications() {
        Instant now = Instant.now();
        List<Notification> due = notificationRepository.findDueScheduledNotifications(now);
        if (due.isEmpty()) {
            return 0;
        }
        int processed = 0;
        for (Notification notification : due) {
            try {
                SendNotificationRequest req = new SendNotificationRequest();
                // Map UI targetType -> send-layer targetType
                String targetType = notification.getTargetType() == null
                        ? "ALL" : notification.getTargetType().trim().toUpperCase();
                switch (targetType) {
                    case "ALL" -> req.setTargetType("ALL");
                    case "TEACHERS" -> {
                        req.setTargetType("ROLE");
                        req.setRole("TEACHER");
                    }
                    case "STUDENTS" -> {
                        req.setTargetType("ROLE");
                        req.setRole("STUDENT");
                    }
                    case "SPECIFIC_CLASS" -> {
                        req.setTargetType("CLASS");
                        req.setClassId(notification.getTargetClassId());
                    }
                    default -> req.setTargetType("ALL");
                }
                sendNotification(notification.getId(), req);
                processed++;
            } catch (Exception ex) {
                // Do not rethrow - one bad notification must not block the rest of the batch
                log.warn("Scheduled send failed for notification id={}: {}",
                        notification.getId(), ex.getMessage());
            }
        }
        log.info("Scheduler processed {} due notification(s)", processed);
        return processed;
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private List<User> resolveRecipients(String rawTargetType, SendNotificationRequest request) {
        String targetType = rawTargetType.trim().toUpperCase();
        return switch (targetType) {
            case "ALL" -> userRepository.findAllByStatus(UserStatus.ACTIVE);
            case "ROLE" -> {
                if (request.getRole() == null || request.getRole().isBlank()) {
                    throw new BadRequestException("role is required for targetType ROLE");
                }
                Role role;
                try {
                    role = Role.valueOf(request.getRole().trim().toUpperCase());
                } catch (IllegalArgumentException ex) {
                    throw new BadRequestException("Invalid role: " + request.getRole());
                }
                yield userRepository.findByRoleAndStatus(role, UserStatus.ACTIVE);
            }
            case "CLASS" -> {
                if (request.getClassId() == null) {
                    throw new BadRequestException("classId is required for targetType CLASS");
                }
                if (!notificationHelperService.classExists(request.getClassId())) {
                    throw new BadRequestException("Class not found for the supplied classId");
                }
                yield userRepository.findAllMembersByClassIdAndStatus(
                        request.getClassId(), UserStatus.ACTIVE);
            }
            default -> throw new BadRequestException("Unsupported targetType: " + rawTargetType);
        };
    }

    private NotificationStats loadStatsFor(List<Long> notificationIds) {
        if (notificationIds.isEmpty()) {
            return NotificationStats.empty();
        }
        Map<Long, Long> counts = new HashMap<>();
        for (NotificationRecipientCount row : notificationRepository.countRecipientsByNotificationIds(notificationIds)) {
            counts.put(row.getId(), row.getTotal());
        }
        Map<Long, Instant> latest = new HashMap<>();
        for (NotificationLatestSent row : notificationRepository.findLatestSentByNotificationIds(notificationIds)) {
            latest.put(row.getId(), row.getLastSentAt());
        }
        return new NotificationStats(counts, latest);
    }

    private AdminNotificationResponse buildAdminSummary(Notification n, NotificationStats stats) {
        long recipientCount = stats.recipientCounts.getOrDefault(n.getId(), 0L);
        Instant sentAt = stats.latestSentAt.get(n.getId());
        return AdminNotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .type(n.getType())
                .scheduledAt(n.getScheduledAt())
                .targetType(n.getTargetType())
                .targetRole(n.getTargetRole())
                .targetClassId(n.getTargetClassId())
                .displayStatus(n.resolveDisplayStatus(recipientCount))
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .sentAt(sentAt)
                .recipientCount(recipientCount)
                .build();
    }

    private AdminNotificationDetailResponse buildAdminDetail(Notification n, long recipientCount, Instant sentAt) {
        return AdminNotificationDetailResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .type(n.getType())
                .scheduledAt(n.getScheduledAt())
                .targetType(n.getTargetType())
                .targetRole(n.getTargetRole())
                .targetClassId(n.getTargetClassId())
                .displayStatus(n.resolveDisplayStatus(recipientCount))
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .sentAt(sentAt)
                .recipientCount(recipientCount)
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
                .receivedAt(userNotification.getCreatedAt())
                .build();
    }

    private record NotificationStats(Map<Long, Long> recipientCounts, Map<Long, Instant> latestSentAt) {
        static NotificationStats empty() {
            return new NotificationStats(Collections.emptyMap(), Collections.emptyMap());
        }
    }
}

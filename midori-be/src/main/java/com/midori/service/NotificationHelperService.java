package com.midori.service;

import com.midori.entity.ClassEntity;
import com.midori.entity.Notification;
import com.midori.entity.NotificationType;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserNotification;
import com.midori.entity.UserStatus;
import com.midori.exception.BadRequestException;
import com.midori.repository.ClassRepository;
import com.midori.repository.NotificationRepository;
import com.midori.repository.UserNotificationRepository;
import com.midori.repository.UserRepository;
import com.midori.websocket.NotificationPushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationHelperService {

    private final NotificationRepository notificationRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final NotificationPushService notificationPushService;

    /**
     * Check whether the supplied class id exists.
     */
    public boolean classExists(UUID classId) {
        return classId != null && classRepository.existsById(classId);
    }

    /**
     * Resolve a class identifier supplied by an admin (either a human-friendly
     * {@code classCode} like "N5-A1" or a UUID-shaped value) to a
     * {@link ClassEntity}. Returns {@code null} when the input is blank or no
     * matching class can be found. The lookup tries {@code findByClassCode}
     * first (the new canonical lookup) and falls back to {@code findById} for
     * UUID inputs to keep legacy callers working.
     */
    public ClassEntity findClassByCodeOrId(String codeOrId) {
        if (codeOrId == null || codeOrId.isBlank()) {
            return null;
        }
        String trimmed = codeOrId.trim();
        Optional<ClassEntity> byCode = classRepository.findByClassCode(trimmed);
        if (byCode.isPresent()) {
            return byCode.get();
        }
        try {
            UUID asUuid = UUID.fromString(trimmed);
            return classRepository.findById(asUuid).orElse(null);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    /**
     * Convenience wrapper that throws a {@link BadRequestException} when the
     * supplied identifier cannot be resolved. Used by services that must
     * surface a clear error to the admin UI instead of a generic 500.
     */
    public ClassEntity requireClassByCodeOrId(String codeOrId) {
        ClassEntity entity = findClassByCodeOrId(codeOrId);
        if (entity == null) {
            throw new BadRequestException("Class not found for classCode: " + codeOrId);
        }
        return entity;
    }

    /**
     * Create a single-user notification. Returns silently when the user is null.
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
        notificationRepository.save(notification);
        List<UserNotification> links = persistLinksAndReturn(notification, List.of(user));
        schedulePushAfterCommit(links);
    }

    /**
     * Broadcast a notification to every user of the given role and status.
     * No-op if no recipients match.
     */
    public void notifyAllByRole(Role role, UserStatus status, String title, String content, NotificationType type) {
        List<User> recipients = userRepository.findByRoleAndStatus(role, status);
        createNotificationForRecipients(recipients, title, content, type, role);
    }

    /**
     * Backwards-compatible overload without role metadata.
     */
    public void createNotificationForRecipients(List<User> recipients, String title, String content, NotificationType type) {
        createNotificationForRecipients(recipients, title, content, type, null);
    }

    /**
     * Create a notification and link it to the supplied recipients. No-op if recipients is empty/null.
     * Stores role/target metadata on the notification so admin list filters can show the intended audience.
     */
    public void createNotificationForRecipients(List<User> recipients, String title, String content, NotificationType type, Role role) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }
        Notification notification = Notification.builder()
                .title(title)
                .content(content)
                .type(type.name())
                .targetType(role == null ? "ALL" : "ROLE")
                .targetRole(role == null ? null : role.name())
                .build();
        notificationRepository.save(notification);
        List<UserNotification> links = persistLinksAndReturn(notification, recipients);
        schedulePushAfterCommit(links);
    }

    /**
     * Send an already-persisted notification to a new set of recipients.
     * Does not create a new Notification record. No-op if recipients is empty/null.
     */
    public void sendExistingNotification(Notification notification, List<User> recipients) {
        if (notification == null || recipients == null || recipients.isEmpty()) {
            return;
        }
        List<UserNotification> links = persistLinksAndReturn(notification, recipients);
        schedulePushAfterCommit(links);
    }

    /**
     * Send an already-persisted notification to a new set of recipients and
     * return the freshly-persisted {@link UserNotification} rows. Used by the
     * push path so we can broadcast exactly the rows that were just inserted
     * (and ignore the ones skipped by the duplicate guard).
     */
    public List<UserNotification> sendExistingNotificationAndReturnLinks(Notification notification, List<User> recipients) {
        if (notification == null || recipients == null || recipients.isEmpty()) {
            return List.of();
        }
        List<UserNotification> links = persistLinksAndReturn(notification, recipients);
        schedulePushAfterCommit(links);
        return links;
    }

    private List<UserNotification> persistLinksAndReturn(Notification notification, List<User> recipients) {
        if (notification == null || recipients == null || recipients.isEmpty()) {
            return List.of();
        }

        // Collect non-null candidate user ids
        List<UUID> candidateIds = new ArrayList<>(recipients.size());
        for (User r : recipients) {
            if (r != null && r.getId() != null) {
                candidateIds.add(r.getId());
            }
        }
        if (candidateIds.isEmpty()) {
            return List.of();
        }

        // Idempotency guard: drop users that already have a UserNotification
        // for this notification so a duplicate send / retry cannot create
        // duplicate rows. We resolve the existing set in one query to avoid
        // an N+1 lookup.
        List<UUID> existingIds = userNotificationRepository
                .findExistingUserIds(notification.getId(), candidateIds);
        if (existingIds == null) {
            existingIds = Collections.emptyList();
        }
        java.util.Set<UUID> existingSet = new java.util.HashSet<>(existingIds);

        List<UserNotification> links = new ArrayList<>(candidateIds.size());
        for (User recipient : recipients) {
            if (recipient == null || recipient.getId() == null) {
                continue;
            }
            if (existingSet.contains(recipient.getId())) {
                continue;
            }
            links.add(UserNotification.builder()
                    .user(recipient)
                    .notification(notification)
                    .isRead(false)
                    .build());
        }
        if (links.isEmpty()) {
            log.debug("No new user notification link(s) for notification id={} (all {} recipient(s) already linked)",
                    notification.getId(), candidateIds.size());
            return List.of();
        }
        List<UserNotification> saved = userNotificationRepository.saveAll(links);
        log.debug("Persisted {} new user notification link(s) for notification id={} (skipped {} duplicate(s))",
                saved.size(), notification.getId(), candidateIds.size() - saved.size());
        return saved;
    }

    /**
     * Schedule a realtime push for the freshly-persisted UserNotification
     * rows. The push fires only after the surrounding transaction commits, so
     * a rollback never produces a "ghost" notification in a client's inbox.
     */
    private void schedulePushAfterCommit(List<UserNotification> newLinks) {
        if (newLinks == null || newLinks.isEmpty()) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
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
                    log.warn("WS push afterCommit failed: {}", ex.getMessage());
                }
            }
        });
    }
}

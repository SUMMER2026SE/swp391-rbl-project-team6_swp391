package com.midori.repository;

import com.midori.entity.Notification;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByType(String type, Pageable pageable);

    Page<Notification> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    Page<Notification> findByTypeAndTitleContainingIgnoreCase(String type, String title, Pageable pageable);

    @Query("SELECT COUNT(un) FROM UserNotification un WHERE un.notification.id = :notificationId")
    long countUserNotificationsByNotificationId(@Param("notificationId") Long notificationId);

    @Query("SELECT MAX(un.createdAt) FROM UserNotification un WHERE un.notification.id = :notificationId")
    Instant findLatestUserNotificationCreatedAt(@Param("notificationId") Long notificationId);

    /**
     * Returns notifications whose scheduledAt has elapsed but which have not
     * been sent yet (i.e. have no UserNotification rows). Used by the scheduler
     * to pick up due notifications.
     */
    @Query("SELECT n FROM Notification n " +
            "WHERE n.scheduledAt IS NOT NULL " +
            "AND n.scheduledAt <= :now " +
            "AND NOT EXISTS (SELECT 1 FROM UserNotification un WHERE un.notification = n) " +
            "AND (n.targetType = 'ALL' OR n.targetType = 'TEACHERS' OR n.targetType = 'STUDENTS' OR n.targetType = 'SPECIFIC_CLASS')")
    List<Notification> findDueScheduledNotifications(@Param("now") Instant now);

    /**
     * Loads a notification with a database-level pessimistic write lock so that
     * concurrent send / send attempts for the same notification serialize at
     * the database layer. Used by NotificationServiceImpl.sendNotification to
     * close the race window in which two transactions could both observe
     * "no UserNotification exists yet" and then both insert the same rows.
     *
     * The lock is released when the surrounding @Transactional method commits
     * or rolls back.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT n FROM Notification n WHERE n.id = :id")
    Optional<Notification> findByIdForUpdate(@Param("id") Long id);

    /**
     * Batch query that returns recipient counts for a collection of notification ids.
     * Used by admin list/detail endpoints to avoid N+1 queries.
     */
    @Query("SELECT un.notification.id AS id, COUNT(un) AS total " +
            "FROM UserNotification un " +
            "WHERE un.notification.id IN :notificationIds " +
            "GROUP BY un.notification.id")
    List<NotificationRecipientCount> countRecipientsByNotificationIds(@Param("notificationIds") Collection<Long> notificationIds);

    /**
     * Batch query that returns the latest send timestamp for each notification id.
     */
    @Query("SELECT un.notification.id AS id, MAX(un.createdAt) AS lastSentAt " +
            "FROM UserNotification un " +
            "WHERE un.notification.id IN :notificationIds " +
            "GROUP BY un.notification.id")
    List<NotificationLatestSent> findLatestSentByNotificationIds(@Param("notificationIds") Collection<Long> notificationIds);

    /**
     * Returns the most recently sent notifications (those with at least one recipient).
     */
    @Query("SELECT DISTINCT n FROM Notification n " +
            "JOIN UserNotification un ON un.notification = n " +
            "ORDER BY un.createdAt DESC")
    List<Notification> findRecentNotifications(Pageable pageable);

    interface NotificationRecipientCount {
        Long getId();
        Long getTotal();
    }

    interface NotificationLatestSent {
        Long getId();
        Instant getLastSentAt();
    }
}

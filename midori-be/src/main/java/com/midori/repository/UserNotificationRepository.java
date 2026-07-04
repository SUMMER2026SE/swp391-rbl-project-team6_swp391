package com.midori.repository;

import com.midori.entity.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    @Query("SELECT un FROM UserNotification un JOIN FETCH un.notification WHERE un.user.id = :userId ORDER BY un.createdAt DESC")
    List<UserNotification> findByUserIdWithNotification(@Param("userId") UUID userId);

    Optional<UserNotification> findByNotificationIdAndUserId(Long notificationId, UUID userId);

    @Modifying
    @Query("UPDATE UserNotification un SET un.isRead = true, un.readAt = CURRENT_TIMESTAMP WHERE un.user.id = :userId AND un.isRead = false")
    int markAllAsReadByUserId(@Param("userId") UUID userId);

    long countByUserIdAndIsReadFalse(UUID userId);

    /**
     * Returns the set of user ids that already have a UserNotification for the
     * given notification. Used by the send/create helpers to filter out
     * duplicates before bulk insert, so a re-send / retry cannot create
     * duplicate rows.
     */
    @Query("SELECT un.user.id FROM UserNotification un " +
            "WHERE un.notification.id = :notificationId " +
            "AND un.user.id IN :userIds")
    List<UUID> findExistingUserIds(@Param("notificationId") Long notificationId,
                                    @Param("userIds") Collection<UUID> userIds);

    /**
     * Cheap existence check for a single (notification, user) pair.
     */
    boolean existsByNotificationIdAndUserId(Long notificationId, UUID userId);
}

package com.midori.entity;

import com.midori.common.NotificationStatusConstants;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "target_type", length = 50)
    private String targetType;

    @Column(name = "target_role", length = 50)
    private String targetRole;

    @Column(name = "target_class_id")
    private UUID targetClassId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Display status derived from current state.
     * - SCHEDULED: scheduledAt is set, still in the future, and no recipients yet
     * - PUBLISHED: at least one user_notification row exists for this notification
     * - DRAFT: no recipients yet and not scheduled
     *
     * SCHEDULED requires recipientCount == 0 so that a notification which was
     * already sent (and therefore has a sentAt) but whose scheduledAt is still
     * in the future does not keep reporting as "Scheduled".
     *
     * Note: PUBLISHED detection requires explicit recipientCount because
     * user_notifications is a lazy OneToMany collection and is not
     * initialised in list/grid queries.
     */
    public String resolveDisplayStatus(long recipientCount) {
        if (recipientCount > 0) {
            return NotificationStatusConstants.STATUS_PUBLISHED;
        }
        if (scheduledAt != null && scheduledAt.isAfter(Instant.now())) {
            return NotificationStatusConstants.STATUS_SCHEDULED;
        }
        return NotificationStatusConstants.STATUS_DRAFT;
    }
}

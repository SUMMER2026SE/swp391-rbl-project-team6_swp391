package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Stores Web Push subscription for each user/browser combination.
 * Each user can have multiple subscriptions (multiple browsers/devices).
 */
@Entity
@Table(name = "push_subscriptions",
       indexes = {
           @Index(name = "idx_push_sub_user_id", columnList = "user_id"),
           @Index(name = "idx_push_sub_endpoint", columnList = "endpoint")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_push_sub_endpoint", columnNames = "endpoint")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * The full push subscription endpoint URL from the browser.
     * This is unique per browser/device combination.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String endpoint;

    /**
     * The p256dh key (public key for encryption).
     * Stored as base64-encoded string.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String p256dh;

    /**
     * The auth key for push encryption.
     * Stored as base64-encoded string.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String auth;

    /**
     * User agent string for tracking which browser/device.
     */
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    /**
     * Optional subscription expiration time if browser provides one.
     */
    @Column(name = "expiration_time")
    private Instant expirationTime;

    /**
     * Whether this subscription is active.
     * Set to false when subscription becomes invalid (user unsubscribes or browser revokes).
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Check if this subscription is valid (active and not expired).
     */
    public boolean isValid() {
        if (!Boolean.TRUE.equals(active)) {
            return false;
        }
        if (expirationTime != null && expirationTime.isBefore(Instant.now())) {
            return false;
        }
        return true;
    }
}

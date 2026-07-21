package com.midori.repository;

import com.midori.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    /**
     * Find all active subscriptions for a user.
     */
    @Query("SELECT ps FROM PushSubscription ps WHERE ps.user.id = :userId AND ps.active = true AND (ps.expirationTime IS NULL OR ps.expirationTime > CURRENT_TIMESTAMP)")
    List<PushSubscription> findActiveByUserId(@Param("userId") UUID userId);

    /**
     * Find all active subscriptions for multiple users (batch send).
     */
    @Query("SELECT ps FROM PushSubscription ps WHERE ps.user.id IN :userIds AND ps.active = true AND (ps.expirationTime IS NULL OR ps.expirationTime > CURRENT_TIMESTAMP)")
    List<PushSubscription> findActiveByUserIds(@Param("userIds") List<UUID> userIds);

    /**
     * Find subscription by endpoint (for deduplication).
     */
    Optional<PushSubscription> findByEndpoint(String endpoint);

    /**
     * Find subscription by user and endpoint.
     */
    Optional<PushSubscription> findByUserIdAndEndpoint(UUID userId, String endpoint);

    /**
     * Deactivate subscription by endpoint.
     */
    @Modifying
    @Query("UPDATE PushSubscription ps SET ps.active = false WHERE ps.endpoint = :endpoint")
    int deactivateByEndpoint(@Param("endpoint") String endpoint);

    /**
     * Deactivate all subscriptions for a user.
     */
    @Modifying
    @Query("UPDATE PushSubscription ps SET ps.active = false WHERE ps.user.id = :userId")
    int deactivateAllByUserId(@Param("userId") UUID userId);

    /**
     * Count active subscriptions for a user.
     */
    @Query("SELECT COUNT(ps) FROM PushSubscription ps WHERE ps.user.id = :userId AND ps.active = true")
    long countActiveByUserId(@Param("userId") UUID userId);

    /**
     * Check if user has any active subscription.
     */
    @Query("SELECT CASE WHEN COUNT(ps) > 0 THEN true ELSE false END FROM PushSubscription ps WHERE ps.user.id = :userId AND ps.active = true")
    boolean hasActiveSubscription(@Param("userId") UUID userId);

    /**
     * Delete expired subscriptions (expired time is set and in the past).
     */
    @Modifying
    @Query("DELETE FROM PushSubscription ps WHERE ps.expirationTime IS NOT NULL AND ps.expirationTime < CURRENT_TIMESTAMP")
    int deleteExpiredSubscriptions();

    /**
     * Deactivate subscriptions that returned errors (410 Gone indicates they were unsubscribed).
     */
    @Modifying
    @Query("UPDATE PushSubscription ps SET ps.active = false WHERE ps.endpoint IN :endpoints")
    int deactivateByEndpoints(@Param("endpoints") List<String> endpoints);
}

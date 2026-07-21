package com.midori.dto.push;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for saving a new push subscription from frontend.
 * Maps to the PushSubscription JSON from the browser's PushManager.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveSubscriptionRequest {

    /**
     * The endpoint URL from PushSubscription.
     * Example: https://fcm.googleapis.com/fcm/send/...
     */
    @NotBlank(message = "Endpoint is required")
    private String endpoint;

    /**
     * The p256dh key (public key for encryption).
     * Base64-encoded without padding.
     */
    @NotBlank(message = "p256dh key is required")
    private String p256dh;

    /**
     * The auth secret key.
     * Base64-encoded.
     */
    @NotBlank(message = "Auth key is required")
    private String auth;

    /**
     * Optional expiration time from PushSubscription.
     * Null means no expiration.
     */
    private Long expirationTime;
}

package com.midori.dto.push;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for push subscription status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionResponse {

    /**
     * Whether the subscription was saved successfully.
     */
    private boolean subscribed;

    /**
     * Human-readable message.
     */
    private String message;

    /**
     * Number of active subscriptions for this user.
     */
    private long activeCount;
}

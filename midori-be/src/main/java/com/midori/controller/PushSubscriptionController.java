package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.push.SubscriptionResponse;
import com.midori.dto.push.VapidPublicKeyResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.WebPushService;
import com.midori.dto.push.SaveSubscriptionRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for managing push subscription (Web Push API).
 */
@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final WebPushService webPushService;
    
    @Qualifier("vapidPublicKeyValue")
    private final String vapidPublicKey;

    /**
     * Get the VAPID public key for frontend to use when subscribing.
     */
    @GetMapping("/vapid-public-key")
    public ResponseEntity<ApiResponse<VapidPublicKeyResponse>> getVapidPublicKey() {
        VapidPublicKeyResponse response = VapidPublicKeyResponse.builder()
                .publicKey(vapidPublicKey)
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Subscribe to push notifications.
     */
    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> subscribe(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody SaveSubscriptionRequest request,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        
        SubscriptionResponse response = webPushService.saveSubscription(
                user.getId(), request, userAgent);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Unsubscribe from push notifications.
     */
    @PostMapping("/unsubscribe")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> unsubscribe(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody UnsubscribeRequest request) {
        
        SubscriptionResponse response = webPushService.unsubscribe(user.getId(), request.endpoint());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Check subscription status.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<SubscriptionStatusResponse>> getStatus(
            @AuthenticationPrincipal CustomUserDetails user) {
        
        boolean hasSubscription = webPushService.hasActiveSubscription(user.getId());
        SubscriptionStatusResponse response = new SubscriptionStatusResponse(hasSubscription);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Request body for unsubscribe.
     */
    public record UnsubscribeRequest(String endpoint) {}

    /**
     * Response for subscription status check.
     */
    public record SubscriptionStatusResponse(boolean subscribed) {}
}

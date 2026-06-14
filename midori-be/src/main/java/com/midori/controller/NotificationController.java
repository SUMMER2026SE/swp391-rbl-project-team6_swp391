package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.notification.MarkReadResponse;
import com.midori.dto.notification.NotificationListResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<NotificationListResponse>> getCurrentUserNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = userDetails.getId();
        NotificationListResponse response = notificationService.getCurrentUserNotifications(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<MarkReadResponse>> markAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        UUID userId = userDetails.getId();
        MarkReadResponse response = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<MarkReadResponse>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = userDetails.getId();
        MarkReadResponse response = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

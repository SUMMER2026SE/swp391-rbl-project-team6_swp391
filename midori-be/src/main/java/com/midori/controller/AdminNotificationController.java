package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.notification.AdminNotificationDetailResponse;
import com.midori.dto.notification.AdminNotificationResponse;
import com.midori.dto.notification.ClassLookupResponse;
import com.midori.dto.notification.CreateNotificationRequest;
import com.midori.dto.notification.SendNotificationRequest;
import com.midori.dto.notification.SendNotificationResponse;
import com.midori.dto.notification.UpdateNotificationRequest;
import com.midori.entity.UserStatus;
import com.midori.exception.BadRequestException;
import com.midori.repository.UserRepository;
import com.midori.service.NotificationHelperService;
import com.midori.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;
    private final NotificationHelperService notificationHelperService;
    private final UserRepository userRepository;

    /**
     * Look up a class by its human-friendly {@code classCode} (e.g. "N5-A1").
     * Used by the admin notification form so the creator can verify the class
     * exists before submitting. UUID-shaped values are accepted as a fallback
     * for legacy data and for the rare case where an admin still has the UUID
     * at hand, but the recommended input is the class code exposed everywhere
     * else in the product.
     */
    @GetMapping("/classes/lookup")
    public ResponseEntity<ApiResponse<ClassLookupResponse>> lookupClass(@RequestParam("classCode") String classCode) {
        if (classCode == null || classCode.isBlank()) {
            throw new BadRequestException("classCode is required");
        }
        var entity = notificationHelperService.findClassByCodeOrId(classCode);
        if (entity == null) {
            throw new BadRequestException("Class not found for classCode: " + classCode);
        }
        long studentCount = userRepository.countByAssignedClassIdAndStatus(entity.getId(), UserStatus.ACTIVE);
        return ResponseEntity.ok(ApiResponse.success(ClassLookupResponse.from(entity, studentCount)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminNotificationResponse>>> getNotifications(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Default ordering: newest notifications first. The admin notification
        // page is a "push-style" feed (most recent at the top), so we sort by
        // createdAt DESC. createdAt is monotonic with id for rows created in
        // the same millisecond, so this also keeps a freshly-created Draft
        // visible at the top of the list instead of being pushed to the bottom
        // by the previous (id ASC) default ordering, which grouped older
        // Published items above newer Drafts and made Drafts look "delayed".
        // Tie-breaker by id DESC keeps the ordering deterministic when two
        // rows share the exact same createdAt.
        Sort newestFirst = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

        Page<AdminNotificationResponse> notifications = notificationService.getAdminNotifications(
                type, keyword, PageRequest.of(page, size, newestFirst));

        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminNotificationDetailResponse>> getNotification(@PathVariable Long id) {
        AdminNotificationDetailResponse notification = notificationService.getAdminNotification(id);
        return ResponseEntity.ok(ApiResponse.success(notification));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminNotificationDetailResponse>> createNotification(
            @Valid @RequestBody CreateNotificationRequest request) {
        AdminNotificationDetailResponse notification = notificationService.createNotification(request);
        return ResponseEntity.ok(ApiResponse.success("Notification created successfully", notification));
    }

    /**
     * Edit an existing DRAFT notification. Once a notification has been sent
     * (any user_notifications row exists) the service refuses the update with
     * a 400 — recipients already see the published content, so editing would
     * create an unread/now-stale mismatch in their inbox.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminNotificationDetailResponse>> updateNotification(
            @PathVariable Long id,
            @Valid @RequestBody UpdateNotificationRequest request) {
        AdminNotificationDetailResponse notification = notificationService.updateNotification(id, request);
        return ResponseEntity.ok(ApiResponse.success("Notification updated successfully", notification));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteAdminNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully"));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<ApiResponse<SendNotificationResponse>> sendNotification(
            @PathVariable Long id,
            @Valid @RequestBody SendNotificationRequest request) {
        SendNotificationResponse response = notificationService.sendNotification(id, request);
        return ResponseEntity.ok(ApiResponse.success("Notification sent successfully", response));
    }
}

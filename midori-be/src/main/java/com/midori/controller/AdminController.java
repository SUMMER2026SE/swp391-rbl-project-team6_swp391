package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.response.UserResponse;
import com.midori.service.AdminUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminUserService adminUserService;

    @GetMapping("/teachers/pending")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getPendingTeachers() {
        List<UserResponse> teachers = adminUserService.getPendingTeachers();
        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    @GetMapping("/teachers/active")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getActiveTeachers() {
        List<UserResponse> teachers = adminUserService.getActiveTeachers();
        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    @PutMapping("/{userId}/approve")
    public ResponseEntity<ApiResponse<UserResponse>> approveTeacher(@PathVariable UUID userId) {
        UserResponse teacher = adminUserService.approveTeacher(userId);
        return ResponseEntity.ok(ApiResponse.success("Teacher approved successfully", teacher));
    }

    @PutMapping("/{userId}/reject")
    public ResponseEntity<ApiResponse<UserResponse>> rejectTeacher(
            @PathVariable UUID userId,
            @Valid @RequestBody RejectTeacherRequest request) {
        UserResponse teacher = adminUserService.rejectTeacher(userId, request.reason().trim());
        return ResponseEntity.ok(ApiResponse.success("Teacher rejected successfully", teacher));
    }

    @PutMapping("/{userId}/suspend")
    public ResponseEntity<ApiResponse<UserResponse>> suspendUser(@PathVariable UUID userId) {
        UserResponse user = adminUserService.suspendUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Teacher suspended successfully", user));
    }

    @PutMapping("/{userId}/activate")
    public ResponseEntity<ApiResponse<UserResponse>> activateUser(@PathVariable UUID userId) {
        UserResponse user = adminUserService.activateUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", user));
    }

    public record RejectTeacherRequest(
            @NotBlank(message = "Reject reason is required")
            @Size(max = 1000, message = "Reject reason must not exceed 1000 characters")
            String reason
    ) {
    }
}

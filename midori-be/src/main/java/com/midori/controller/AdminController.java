package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.response.UserResponse;
import com.midori.service.AdminUserService;
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

    @PutMapping("/{userId}/approve")
    public ResponseEntity<ApiResponse<UserResponse>> approveTeacher(@PathVariable UUID userId) {
        UserResponse teacher = adminUserService.approveTeacher(userId);
        return ResponseEntity.ok(ApiResponse.success("Teacher approved successfully", teacher));
    }

    @PutMapping("/{userId}/suspend")
    public ResponseEntity<ApiResponse<UserResponse>> suspendUser(@PathVariable UUID userId) {
        UserResponse user = adminUserService.suspendUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User suspended successfully", user));
    }
}

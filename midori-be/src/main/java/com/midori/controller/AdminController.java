package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.request.BanUserRequest;
import com.midori.dto.response.AdminTeacherCertificateResponse;
import com.midori.dto.response.AdminTeacherResponse;
import com.midori.dto.response.AdminTeacherStatsResponse;
import com.midori.entity.Role;
import com.midori.entity.UserStatus;
import com.midori.exception.BadRequestException;
import com.midori.security.CustomUserDetails;
import com.midori.service.AdminUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public ResponseEntity<ApiResponse<List<AdminTeacherResponse>>> getPendingTeachers() {
        List<AdminTeacherResponse> teachers = adminUserService.getPendingTeachers();
        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    @GetMapping("/teachers/active")
    public ResponseEntity<ApiResponse<List<AdminTeacherResponse>>> getActiveTeachers() {
        List<AdminTeacherResponse> teachers = adminUserService.getActiveTeachers();
        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    @GetMapping("/teachers/stats")
    public ResponseEntity<ApiResponse<AdminTeacherStatsResponse>> getTeacherStats() {
        AdminTeacherStatsResponse stats = adminUserService.getTeacherStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PutMapping("/{userId}/approve")
    public ResponseEntity<ApiResponse<AdminTeacherResponse>> approveTeacher(@PathVariable UUID userId) {
        AdminTeacherResponse teacher = adminUserService.approveTeacher(userId);
        return ResponseEntity.ok(ApiResponse.success("Teacher approved successfully", teacher));
    }

    @PutMapping("/{userId}/reject")
    public ResponseEntity<ApiResponse<AdminTeacherResponse>> rejectTeacher(
            @PathVariable UUID userId,
            @Valid @RequestBody RejectTeacherRequest request) {
        AdminTeacherResponse teacher = adminUserService.rejectTeacher(userId, request.reason().trim());
        return ResponseEntity.ok(ApiResponse.success("Teacher rejected successfully", teacher));
    }

    @PutMapping("/{userId}/suspend")
    public ResponseEntity<ApiResponse<AdminTeacherResponse>> suspendUser(@PathVariable UUID userId) {
        AdminTeacherResponse user = adminUserService.suspendUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Teacher suspended successfully", user));
    }

    @PutMapping("/{userId}/activate")
    public ResponseEntity<ApiResponse<AdminTeacherResponse>> activateUser(@PathVariable UUID userId) {
        AdminTeacherResponse user = adminUserService.activateUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", user));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminTeacherResponse>>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Role roleFilter = null;
        if (role != null && !role.isBlank()) {
            try {
                roleFilter = Role.valueOf(role.toUpperCase().trim());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role. Must be STUDENT, TEACHER, or ADMIN");
            }
        }

        UserStatus statusFilter = null;
        if (status != null && !status.isBlank()) {
            try {
                statusFilter = UserStatus.valueOf(status.toUpperCase().trim());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status value");
            }
        }

        String searchKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        int pageSize = Math.min(Math.max(size, 1), 100);
        int pageNumber = Math.max(page, 0);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<AdminTeacherResponse> result = adminUserService.getAllUsers(roleFilter, statusFilter, searchKeyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{userId}/ban")
    public ResponseEntity<ApiResponse<AdminTeacherResponse>> banUser(
            @PathVariable UUID userId,
            @Valid @RequestBody BanUserRequest request,
            @AuthenticationPrincipal CustomUserDetails admin) {
        AdminTeacherResponse user = adminUserService.banUser(userId, request, admin.getId());
        return ResponseEntity.ok(ApiResponse.success("User banned successfully", user));
    }

    @PutMapping("/{userId}/restore")
    public ResponseEntity<ApiResponse<AdminTeacherResponse>> restoreUser(@PathVariable UUID userId) {
        AdminTeacherResponse user = adminUserService.restoreUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User restored successfully", user));
    }

    @GetMapping("/{userId}/certificates")
    public ResponseEntity<ApiResponse<List<AdminTeacherCertificateResponse>>> getTeacherCertificates(
            @PathVariable UUID userId) {
        List<AdminTeacherCertificateResponse> certificates = adminUserService.getTeacherCertificates(userId);
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    public record RejectTeacherRequest(
            @NotBlank(message = "Reject reason is required")
            @Size(max = 1000, message = "Reject reason must not exceed 1000 characters")
            String reason
    ) {
    }
}

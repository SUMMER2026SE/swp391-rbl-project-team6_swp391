package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.response.AdminTeacherCertificateResponse;
import com.midori.dto.response.AdminTeacherResponse;
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
    public ResponseEntity<ApiResponse<List<AdminTeacherResponse>>> getPendingTeachers() {
        List<AdminTeacherResponse> teachers = adminUserService.getPendingTeachers();
        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    @GetMapping("/teachers/active")
    public ResponseEntity<ApiResponse<List<AdminTeacherResponse>>> getActiveTeachers() {
        List<AdminTeacherResponse> teachers = adminUserService.getActiveTeachers();
        return ResponseEntity.ok(ApiResponse.success(teachers));
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

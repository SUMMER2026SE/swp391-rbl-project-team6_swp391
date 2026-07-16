package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.classdto.AdminClassResponse;
import com.midori.dto.classdto.ClassResponse;
import com.midori.dto.classdto.CreateClassRequest;
import com.midori.dto.classdto.StudentClassResponse;
import com.midori.dto.classdto.UpdateClassRequest;
import com.midori.security.CustomUserDetails;
import com.midori.service.AdminClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/classes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminClassController {

    private final AdminClassService adminClassService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminClassResponse>>> getAdminClasses(
            @RequestParam(name = "teacherId", required = false) UUID teacherId) {
        List<AdminClassResponse> classes = teacherId != null
                ? adminClassService.getAdminClassesByTeacher(teacherId)
                : adminClassService.getAdminClasses();
        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminClassResponse>> getAdminClassById(@PathVariable UUID id) {
        AdminClassResponse classResponse = adminClassService.getAdminClassById(id);
        return ResponseEntity.ok(ApiResponse.success(classResponse));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<ApiResponse<List<StudentClassResponse>>> getAdminClassStudents(
            @PathVariable UUID id) {
        List<StudentClassResponse> students = adminClassService.getClassStudents(id);
        return ResponseEntity.ok(ApiResponse.success(students));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminClassResponse>> createAdminClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateClassRequest request) {
        AdminClassResponse classResponse = adminClassService.createClass(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class created successfully", classResponse));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminClassResponse>> updateAdminClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateClassRequest request) {
        AdminClassResponse classResponse = adminClassService.updateClass(id, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class updated successfully", classResponse));
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<AdminClassResponse>> archiveAdminClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        AdminClassResponse classResponse = adminClassService.archiveClass(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class archived successfully", classResponse));
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<AdminClassResponse>> restoreAdminClass(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        AdminClassResponse classResponse = adminClassService.restoreClass(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Class restored successfully", classResponse));
    }
}

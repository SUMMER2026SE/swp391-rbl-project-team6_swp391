package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.certificate.TeacherCertificateRequest;
import com.midori.dto.certificate.TeacherCertificateResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.TeacherCertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teacher/certificates")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class TeacherCertificateController {

    private final TeacherCertificateService teacherCertificateService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeacherCertificateResponse>>> listCertificates(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<TeacherCertificateResponse> certificates = teacherCertificateService.listCertificates(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(certificates));
    }

    @GetMapping("/{certificateId}")
    public ResponseEntity<ApiResponse<TeacherCertificateResponse>> getCertificate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID certificateId) {
        TeacherCertificateResponse certificate = teacherCertificateService.getCertificate(certificateId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(certificate));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeacherCertificateResponse>> createCertificate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody TeacherCertificateRequest request) {
        TeacherCertificateResponse certificate = teacherCertificateService.createCertificate(request, userDetails.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Teacher certificate created successfully", certificate));
    }

    @PutMapping("/{certificateId}")
    public ResponseEntity<ApiResponse<TeacherCertificateResponse>> updateCertificate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID certificateId,
            @Valid @RequestBody TeacherCertificateRequest request) {
        TeacherCertificateResponse certificate = teacherCertificateService.updateCertificate(certificateId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Teacher certificate updated successfully", certificate));
    }

    @DeleteMapping("/{certificateId}")
    public ResponseEntity<ApiResponse<Void>> deleteCertificate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID certificateId) {
        teacherCertificateService.deleteCertificate(certificateId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Teacher certificate deleted successfully", null));
    }
}

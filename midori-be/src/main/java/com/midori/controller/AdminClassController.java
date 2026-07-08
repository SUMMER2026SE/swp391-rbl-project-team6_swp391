package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.classdto.AdminClassResponse;
import com.midori.service.AdminClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/classes")
@RequiredArgsConstructor
public class AdminClassController {

    private final AdminClassService adminClassService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminClassResponse>>> getAdminClasses() {
        List<AdminClassResponse> classes = adminClassService.getAdminClasses();
        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminClassResponse>> getAdminClassById(@PathVariable UUID id) {
        AdminClassResponse classResponse = adminClassService.getAdminClassById(id);
        return ResponseEntity.ok(ApiResponse.success(classResponse));
    }
}

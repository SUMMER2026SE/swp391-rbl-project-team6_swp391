package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.response.PublicTeacherResponse;
import com.midori.service.PublicTeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/teachers")
@RequiredArgsConstructor
public class PublicTeacherController {

    private final PublicTeacherService teacherService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PublicTeacherResponse>>> getActiveTeachers() {
        return ResponseEntity.ok(ApiResponse.success(teacherService.getActiveTeachers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublicTeacherResponse>> getTeacherDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(teacherService.getTeacherDetail(id)));
    }
}

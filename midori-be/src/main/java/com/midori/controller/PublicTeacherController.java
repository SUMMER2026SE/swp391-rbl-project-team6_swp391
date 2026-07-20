package com.midori.controller;

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
    public ResponseEntity<List<PublicTeacherResponse>> getActiveTeachers() {
        return ResponseEntity.ok(teacherService.getActiveTeachers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublicTeacherResponse> getTeacherDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(teacherService.getTeacherDetail(id));
    }
}

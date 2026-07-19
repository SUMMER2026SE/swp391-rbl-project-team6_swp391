package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.lesson.LessonResponse;
import com.midori.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LessonResponse>>> getAllLessons(
            @RequestParam(required = false) String level) {
        List<LessonResponse> lessons;
        if (level != null && !level.isBlank()) {
            lessons = lessonService.getLessonsByLevel(level);
        } else {
            lessons = lessonService.getAllLessons();
        }
        return ResponseEntity.ok(ApiResponse.success(lessons));
    }
}

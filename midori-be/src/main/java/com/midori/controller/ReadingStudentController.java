package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.reading.ReadingDetailResponse;
import com.midori.dto.reading.ReadingLessonResponse;
import com.midori.service.ReadingLessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/reading")
@RequiredArgsConstructor
public class ReadingStudentController {

    private final ReadingLessonService readingLessonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReadingLessonResponse>>> getReadingList(
            @RequestParam(required = false) String level) {
        List<ReadingLessonResponse> readings;
        if (level != null && !level.isBlank()) {
            readings = readingLessonService.getActiveReadingLessonsByLevel(level);
        } else {
            readings = readingLessonService.getActiveReadingLessons();
        }
        return ResponseEntity.ok(ApiResponse.success(readings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReadingDetailResponse>> getReadingDetail(
            @PathVariable UUID id) {
        ReadingDetailResponse detail = readingLessonService.getReadingLessonDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping("/level/{jlptLevel}")
    public ResponseEntity<ApiResponse<List<ReadingLessonResponse>>> getReadingByLevel(
            @PathVariable String jlptLevel) {
        List<ReadingLessonResponse> readings = readingLessonService.getActiveReadingLessonsByLevel(jlptLevel);
        return ResponseEntity.ok(ApiResponse.success(readings));
    }
}

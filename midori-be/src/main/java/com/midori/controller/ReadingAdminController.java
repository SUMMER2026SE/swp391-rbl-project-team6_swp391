package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.reading.ReadingDetailResponse;
import com.midori.dto.reading.ReadingLessonRequest;
import com.midori.dto.reading.ReadingLessonResponse;
import com.midori.dto.reading.ReadingLessonWithQuestionsRequest;
import com.midori.service.ReadingLessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/reading")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReadingAdminController {

    private final ReadingLessonService readingLessonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReadingLessonResponse>>> getAllLessons(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Boolean isActive) {
        List<ReadingLessonResponse> lessons;

        if (level != null && !level.isBlank()) {
            lessons = readingLessonService.getReadingLessonsByLevel(level);
        } else if (Boolean.FALSE.equals(isActive)) {
            lessons = readingLessonService.getAllReadingLessons();
        } else {
            lessons = readingLessonService.getAllReadingLessons();
        }

        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReadingDetailResponse>> getLessonDetail(@PathVariable UUID id) {
        ReadingDetailResponse detail = readingLessonService.getReadingLessonDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReadingDetailResponse>> createLesson(
            @Valid @RequestBody ReadingLessonWithQuestionsRequest request) {
        ReadingDetailResponse lesson = readingLessonService.createReadingLessonWithQuestions(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reading lesson created successfully", lesson));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReadingDetailResponse>> updateLesson(
            @PathVariable UUID id,
            @Valid @RequestBody ReadingLessonWithQuestionsRequest request) {
        ReadingDetailResponse lesson = readingLessonService.updateReadingLessonWithQuestions(id, request);
        return ResponseEntity.ok(ApiResponse.success("Reading lesson updated successfully", lesson));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable UUID id) {
        readingLessonService.deleteReadingLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Reading lesson deleted successfully", null));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<ReadingLessonResponse>> publishLesson(@PathVariable UUID id) {
        ReadingLessonResponse lesson = readingLessonService.publishLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Reading lesson published successfully", lesson));
    }

    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse<ReadingLessonResponse>> unpublishLesson(@PathVariable UUID id) {
        ReadingLessonResponse lesson = readingLessonService.unpublishLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Reading lesson unpublished successfully", lesson));
    }
}

package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.vocabulary.VocabularyDetailResponse;
import com.midori.dto.vocabulary.VocabularyLessonResponse;
import com.midori.dto.vocabulary.VocabularyLessonWithItemsRequest;
import com.midori.service.VocabularyLessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/vocabulary")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class VocabularyAdminController {

    private final VocabularyLessonService vocabularyLessonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VocabularyLessonResponse>>> getAllLessons(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Boolean isActive) {
        List<VocabularyLessonResponse> lessons;

        if (level != null && !level.isBlank()) {
            lessons = vocabularyLessonService.getVocabularyLessonsByLevel(level);
        } else if (Boolean.FALSE.equals(isActive)) {
            lessons = vocabularyLessonService.getAllVocabularyLessons();
        } else {
            lessons = vocabularyLessonService.getAllVocabularyLessons();
        }

        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VocabularyDetailResponse>> getLessonDetail(@PathVariable UUID id) {
        VocabularyDetailResponse detail = vocabularyLessonService.getVocabularyLessonDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VocabularyDetailResponse>> createLesson(
            @Valid @RequestBody VocabularyLessonWithItemsRequest request) {
        VocabularyDetailResponse lesson = vocabularyLessonService.createVocabularyLessonWithItems(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vocabulary lesson created successfully", lesson));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VocabularyDetailResponse>> updateLesson(
            @PathVariable UUID id,
            @Valid @RequestBody VocabularyLessonWithItemsRequest request) {
        VocabularyDetailResponse lesson = vocabularyLessonService.updateVocabularyLessonWithItems(id, request);
        return ResponseEntity.ok(ApiResponse.success("Vocabulary lesson updated successfully", lesson));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable UUID id) {
        vocabularyLessonService.deleteVocabularyLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Vocabulary lesson deleted successfully", null));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<VocabularyLessonResponse>> publishLesson(@PathVariable UUID id) {
        VocabularyLessonResponse lesson = vocabularyLessonService.publishLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Vocabulary lesson published successfully", lesson));
    }

    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse<VocabularyLessonResponse>> unpublishLesson(@PathVariable UUID id) {
        VocabularyLessonResponse lesson = vocabularyLessonService.unpublishLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Vocabulary lesson unpublished successfully", lesson));
    }
}
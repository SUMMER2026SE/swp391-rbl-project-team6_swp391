package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.vocabulary.*;
import com.midori.security.CustomUserDetails;
import com.midori.service.VocabularyService;
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
@RequestMapping("/api/teacher/vocabulary")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class VocabularyTeacherController {

    private final VocabularyService vocabularyService;

    @GetMapping("/lessons")
    public ResponseEntity<ApiResponse<List<VocabularyLessonResponse>>> listLessonsForManagement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String search) {
        List<VocabularyLessonResponse> lessons = vocabularyService.listLessonsForManagement(level, topic, search, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @GetMapping("/lessons/{lessonId}")
    public ResponseEntity<ApiResponse<VocabularyLessonDetailResponse>> getLessonDetailForManagement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID lessonId) {
        VocabularyLessonDetailResponse detail = vocabularyService.getLessonDetailForManagement(lessonId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping("/lessons")
    public ResponseEntity<ApiResponse<VocabularyLessonResponse>> createLesson(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VocabularyLessonCreateRequest request) {
        VocabularyLessonResponse lesson = vocabularyService.createLesson(request, userDetails.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lesson created successfully", lesson));
    }

    @PutMapping("/lessons/{lessonId}")
    public ResponseEntity<ApiResponse<VocabularyLessonResponse>> updateLesson(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID lessonId,
            @Valid @RequestBody VocabularyLessonUpdateRequest request) {
        VocabularyLessonResponse lesson = vocabularyService.updateLesson(lessonId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lesson updated successfully", lesson));
    }

    @DeleteMapping("/lessons/{lessonId}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID lessonId) {
        vocabularyService.deleteLesson(lessonId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lesson deleted successfully", null));
    }

    @PostMapping("/lessons/{lessonId}/words")
    public ResponseEntity<ApiResponse<VocabularyWordResponse>> addWord(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID lessonId,
            @Valid @RequestBody VocabularyWordCreateRequest request) {
        VocabularyWordResponse word = vocabularyService.addWord(lessonId, request, userDetails.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Word added successfully", word));
    }

    @PutMapping("/words/{wordId}")
    public ResponseEntity<ApiResponse<VocabularyWordResponse>> updateWord(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID wordId,
            @Valid @RequestBody VocabularyWordUpdateRequest request) {
        VocabularyWordResponse word = vocabularyService.updateWord(wordId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Word updated successfully", word));
    }

    @DeleteMapping("/words/{wordId}")
    public ResponseEntity<ApiResponse<Void>> deleteWord(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID wordId) {
        vocabularyService.deleteWord(wordId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Word deleted successfully", null));
    }

    @PatchMapping("/lessons/{lessonId}/publish")
    public ResponseEntity<ApiResponse<VocabularyLessonResponse>> publishLesson(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID lessonId) {
        VocabularyLessonResponse lesson = vocabularyService.publishLesson(lessonId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lesson published successfully", lesson));
    }

    @PatchMapping("/lessons/{lessonId}/unpublish")
    public ResponseEntity<ApiResponse<VocabularyLessonResponse>> unpublishLesson(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID lessonId) {
        VocabularyLessonResponse lesson = vocabularyService.unpublishLesson(lessonId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lesson unpublished successfully", lesson));
    }
}

package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.vocabulary.*;
import com.midori.repository.VocabularyLessonRepository;
import com.midori.repository.VocabularyWordRepository;
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
    private final VocabularyLessonRepository lessonRepository;
    private final VocabularyWordRepository wordRepository;

    @GetMapping("/lessons")
    public ResponseEntity<ApiResponse<List<VocabularyLessonResponse>>> listLessonsForManagement(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String search) {
        List<VocabularyLessonResponse> lessons = vocabularyService.listLessonsForManagement(level, topic, search);
        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @GetMapping("/lessons/{lessonId}")
    public ResponseEntity<ApiResponse<VocabularyLessonDetailResponse>> getLessonDetailForManagement(
            @PathVariable UUID lessonId) {
        VocabularyLessonDetailResponse detail = vocabularyService.getLessonDetailForManagement(lessonId);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping("/lessons")
    public ResponseEntity<ApiResponse<VocabularyLessonResponse>> createLesson(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VocabularyLessonCreateRequest request) {
        System.out.println("=== CREATE LESSON CONTROLLER ===");
        System.out.println("CreateLesson title = " + request.getTitle());
        System.out.println("CreateLesson words = " + request.getWords());
        System.out.println("CreateLesson words size = " + (request.getWords() == null ? "NULL" : request.getWords().size()));
        if (request.getWords() != null) {
            for (int i = 0; i < request.getWords().size(); i++) {
                var w = request.getWords().get(i);
                System.out.println("  Controller Word " + i + ": japanese=" + w.getJapanese() + ", vietnamese=" + w.getVietnamese());
            }
        }
        VocabularyLessonResponse lesson = vocabularyService.createLesson(request, userDetails.getId());
        System.out.println("=== CREATE LESSON DONE ===");
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lesson created successfully", lesson));
    }

    @PutMapping("/lessons/{lessonId}")
    public ResponseEntity<ApiResponse<VocabularyLessonResponse>> updateLesson(
            @PathVariable UUID lessonId,
            @Valid @RequestBody VocabularyLessonUpdateRequest request) {
        VocabularyLessonResponse lesson = vocabularyService.updateLesson(lessonId, request);
        return ResponseEntity.ok(ApiResponse.success("Lesson updated successfully", lesson));
    }

    @DeleteMapping("/lessons/{lessonId}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable UUID lessonId) {
        vocabularyService.deleteLesson(lessonId);
        return ResponseEntity.ok(ApiResponse.success("Lesson deleted successfully", null));
    }

    @PostMapping("/lessons/{lessonId}/words")
    public ResponseEntity<ApiResponse<VocabularyWordResponse>> addWord(
            @PathVariable UUID lessonId,
            @Valid @RequestBody VocabularyWordCreateRequest request) {
        System.out.println("[DEBUG addWord] lessonId=" + lessonId + ", japanese=" + request.getJapanese() + ", vietnamese=" + request.getVietnamese());
        VocabularyWordResponse word = vocabularyService.addWord(lessonId, request);
        System.out.println("[DEBUG addWord] RESULT: id=" + word.getId() + ", word=" + word.getWord() + ", meaning=" + word.getMeaning());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Word added successfully", word));
    }

    @PutMapping("/words/{wordId}")
    public ResponseEntity<ApiResponse<VocabularyWordResponse>> updateWord(
            @PathVariable UUID wordId,
            @Valid @RequestBody VocabularyWordUpdateRequest request) {
        VocabularyWordResponse word = vocabularyService.updateWord(wordId, request);
        return ResponseEntity.ok(ApiResponse.success("Word updated successfully", word));
    }

    @DeleteMapping("/words/{wordId}")
    public ResponseEntity<ApiResponse<Void>> deleteWord(@PathVariable UUID wordId) {
        vocabularyService.deleteWord(wordId);
        return ResponseEntity.ok(ApiResponse.success("Word deleted successfully", null));
    }

    @PatchMapping("/lessons/{lessonId}/publish")
    public ResponseEntity<ApiResponse<VocabularyLessonResponse>> publishLesson(@PathVariable UUID lessonId) {
        VocabularyLessonResponse lesson = vocabularyService.publishLesson(lessonId);
        return ResponseEntity.ok(ApiResponse.success("Lesson published successfully", lesson));
    }

    @PatchMapping("/lessons/{lessonId}/unpublish")
    public ResponseEntity<ApiResponse<VocabularyLessonResponse>> unpublishLesson(@PathVariable UUID lessonId) {
        VocabularyLessonResponse lesson = vocabularyService.unpublishLesson(lessonId);
        return ResponseEntity.ok(ApiResponse.success("Lesson unpublished successfully", lesson));
    }

    // DEBUG: Check words directly from database
    @GetMapping("/lessons/{lessonId}/debug")
    public ResponseEntity<ApiResponse<Object>> debugLessonWords(@PathVariable UUID lessonId) {
        var lesson = lessonRepository.findById(lessonId);
        if (!lesson.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("Lesson not found", null));
        }
        var words = wordRepository.findByLessonIdOrderByDisplayOrderAsc(lessonId);
        return ResponseEntity.ok(ApiResponse.success("DB words count: " + words.size(), words));
    }
}

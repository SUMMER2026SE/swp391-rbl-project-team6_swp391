package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.vocabulary.VocabularyDetailResponse;
import com.midori.dto.vocabulary.VocabularyLessonResponse;
import com.midori.service.VocabularyLessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/vocabulary")
@RequiredArgsConstructor
public class VocabularyStudentController {

    private final VocabularyLessonService vocabularyLessonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VocabularyLessonResponse>>> getVocabularyList(
            @RequestParam(required = false) String level) {
        List<VocabularyLessonResponse> vocabularies;
        if (level != null && !level.isBlank()) {
            vocabularies = vocabularyLessonService.getActiveVocabularyLessonsByLevel(level);
        } else {
            vocabularies = vocabularyLessonService.getActiveVocabularyLessons();
        }
        return ResponseEntity.ok(ApiResponse.success(vocabularies));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VocabularyDetailResponse>> getVocabularyDetail(
            @PathVariable UUID id) {
        VocabularyDetailResponse detail = vocabularyLessonService.getVocabularyLessonDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping("/level/{jlptLevel}")
    public ResponseEntity<ApiResponse<List<VocabularyLessonResponse>>> getVocabularyByLevel(
            @PathVariable String jlptLevel) {
        List<VocabularyLessonResponse> vocabularies = vocabularyLessonService.getActiveVocabularyLessonsByLevel(jlptLevel);
        return ResponseEntity.ok(ApiResponse.success(vocabularies));
    }
}
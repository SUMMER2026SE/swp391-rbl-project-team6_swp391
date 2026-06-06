package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.vocabulary.VocabularyLessonDetailResponse;
import com.midori.dto.vocabulary.VocabularyLessonResponse;
import com.midori.service.VocabularyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vocabulary")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyService vocabularyService;

    @GetMapping("/lessons")
    public ResponseEntity<ApiResponse<List<VocabularyLessonResponse>>> listPublishedLessons(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String search) {
        List<VocabularyLessonResponse> lessons = vocabularyService.listPublishedLessons(level, topic, search);
        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @GetMapping("/lessons/{lessonId}")
    public ResponseEntity<ApiResponse<VocabularyLessonDetailResponse>> getPublishedLessonDetail(
            @PathVariable java.util.UUID lessonId) {
        VocabularyLessonDetailResponse detail = vocabularyService.getPublishedLessonDetail(lessonId);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }
}

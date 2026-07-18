package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.grammar.GrammarDetailResponse;
import com.midori.dto.grammar.GrammarLessonResponse;
import com.midori.dto.grammar.GrammarLessonWithContentsRequest;
import com.midori.service.GrammarLessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/grammar")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class GrammarAdminController {

    private final GrammarLessonService grammarLessonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GrammarLessonResponse>>> getAllLessons(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Boolean isActive) {
        List<GrammarLessonResponse> lessons;

        if (level != null && !level.isBlank()) {
            lessons = grammarLessonService.getGrammarLessonsByLevel(level);
        } else {
            lessons = grammarLessonService.getAllGrammarLessons();
        }

        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GrammarDetailResponse>> getLessonDetail(@PathVariable UUID id) {
        GrammarDetailResponse detail = grammarLessonService.getGrammarLessonDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GrammarDetailResponse>> createLesson(
            @Valid @RequestBody GrammarLessonWithContentsRequest request) {
        GrammarDetailResponse lesson = grammarLessonService.createGrammarLessonWithContents(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Grammar lesson created successfully", lesson));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GrammarDetailResponse>> updateLesson(
            @PathVariable UUID id,
            @Valid @RequestBody GrammarLessonWithContentsRequest request) {
        GrammarDetailResponse lesson = grammarLessonService.updateGrammarLessonWithContents(id, request);
        return ResponseEntity.ok(ApiResponse.success("Grammar lesson updated successfully", lesson));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable UUID id) {
        grammarLessonService.deleteGrammarLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Grammar lesson deleted successfully", null));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<GrammarLessonResponse>> publishLesson(@PathVariable UUID id) {
        GrammarLessonResponse lesson = grammarLessonService.publishLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Grammar lesson published successfully", lesson));
    }

    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse<GrammarLessonResponse>> unpublishLesson(@PathVariable UUID id) {
        GrammarLessonResponse lesson = grammarLessonService.unpublishLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Grammar lesson unpublished successfully", lesson));
    }
}
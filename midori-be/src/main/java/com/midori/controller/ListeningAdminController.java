package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.listening.ListeningDetailResponse;
import com.midori.dto.listening.ListeningLessonResponse;
import com.midori.dto.listening.ListeningLessonWithQuestionsRequest;
import com.midori.service.ListeningLessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/listening")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ListeningAdminController {

    private final ListeningLessonService listeningLessonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ListeningLessonResponse>>> getAllLessons(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Boolean isActive) {
        List<ListeningLessonResponse> lessons;

        if (level != null && !level.isBlank()) {
            lessons = listeningLessonService.getListeningLessonsByLevel(level);
        } else if (Boolean.FALSE.equals(isActive)) {
            lessons = listeningLessonService.getAllListeningLessons();
        } else {
            lessons = listeningLessonService.getAllListeningLessons();
        }

        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> getLessonDetail(@PathVariable UUID id) {
        ListeningDetailResponse detail = listeningLessonService.getListeningLessonDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> createLesson(
            @Valid @RequestBody ListeningLessonWithQuestionsRequest request) {
        ListeningDetailResponse lesson = listeningLessonService.createListeningLessonWithQuestions(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Listening lesson created successfully", lesson));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ListeningDetailResponse>> updateLesson(
            @PathVariable UUID id,
            @Valid @RequestBody ListeningLessonWithQuestionsRequest request) {
        ListeningDetailResponse lesson = listeningLessonService.updateListeningLessonWithQuestions(id, request);
        return ResponseEntity.ok(ApiResponse.success("Listening lesson updated successfully", lesson));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable UUID id) {
        listeningLessonService.deleteListeningLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Listening lesson deleted successfully", null));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<ListeningLessonResponse>> publishLesson(@PathVariable UUID id) {
        ListeningLessonResponse lesson = listeningLessonService.publishLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Listening lesson published successfully", lesson));
    }

    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse<ListeningLessonResponse>> unpublishLesson(@PathVariable UUID id) {
        ListeningLessonResponse lesson = listeningLessonService.unpublishLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Listening lesson unpublished successfully", lesson));
    }
}

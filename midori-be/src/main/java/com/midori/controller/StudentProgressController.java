package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.progress.ProgressResponse;
import com.midori.dto.progress.ProgressStatsResponse;
import com.midori.dto.progress.ProgressUpdateRequest;
import com.midori.entity.ContentType;
import com.midori.exception.BadRequestException;
import com.midori.security.CustomUserDetails;
import com.midori.service.StudyProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/progress")
@RequiredArgsConstructor
public class StudentProgressController {

    private final StudyProgressService studyProgressService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProgressResponse>>> getProgressList(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String contentType) {
        UUID userId = userDetails.getId();
        List<ProgressResponse> progress;

        if (contentType != null && !contentType.isBlank()) {
            ContentType type = parseContentType(contentType);
            progress = studyProgressService.getProgressListByType(userId, type);
        } else {
            progress = studyProgressService.getProgressList(userId);
        }

        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ProgressStatsResponse>> getProgressStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ProgressStatsResponse stats = studyProgressService.getProgressStats(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PutMapping("/{contentType}/{contentId}")
    public ResponseEntity<ApiResponse<ProgressResponse>> updateProgress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String contentType,
            @PathVariable String contentId,
            @Valid @RequestBody ProgressUpdateRequest request) {
        ContentType type = parseContentType(contentType);
        ProgressResponse result = studyProgressService.updateProgress(
                userDetails.getId(), type, contentId, request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{contentType}/{contentId}/learned")
    public ResponseEntity<ApiResponse<ProgressResponse>> markAsLearned(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String contentType,
            @PathVariable String contentId) {
        ContentType type = parseContentType(contentType);
        ProgressResponse result = studyProgressService.markAsLearned(
                userDetails.getId(), type, contentId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/{contentType}/{contentId}/learned")
    public ResponseEntity<ApiResponse<ProgressResponse>> unmarkAsLearned(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String contentType,
            @PathVariable String contentId) {
        ContentType type = parseContentType(contentType);
        ProgressResponse result = studyProgressService.unmarkAsLearned(
                userDetails.getId(), type, contentId);
        if (result == null) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{contentType}/{contentId}/mastered")
    public ResponseEntity<ApiResponse<ProgressResponse>> markAsMastered(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String contentType,
            @PathVariable String contentId) {
        ContentType type = parseContentType(contentType);
        ProgressResponse result = studyProgressService.markAsMastered(
                userDetails.getId(), type, contentId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/{contentType}/{contentId}/mastered")
    public ResponseEntity<ApiResponse<ProgressResponse>> unmarkAsMastered(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String contentType,
            @PathVariable String contentId) {
        ContentType type = parseContentType(contentType);
        ProgressResponse result = studyProgressService.unmarkAsMastered(
                userDetails.getId(), type, contentId);
        if (result == null) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{contentType}/{contentId}/favorite")
    public ResponseEntity<ApiResponse<ProgressResponse>> toggleFavorite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String contentType,
            @PathVariable String contentId) {
        ContentType type = parseContentType(contentType);
        ProgressResponse result = studyProgressService.markAsFavorite(
                userDetails.getId(), type, contentId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{contentType}/{contentId}/complete")
    public ResponseEntity<ApiResponse<ProgressResponse>> markAsCompleted(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String contentType,
            @PathVariable String contentId) {
        ContentType type = parseContentType(contentType);
        ProgressResponse result = studyProgressService.markAsCompleted(
                userDetails.getId(), type, contentId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private ContentType parseContentType(String contentType) {
        try {
            return ContentType.valueOf(contentType.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid content type: " + contentType +
                    ". Must be one of: VOCABULARY, GRAMMAR, FLASHCARD, LESSON");
        }
    }
}

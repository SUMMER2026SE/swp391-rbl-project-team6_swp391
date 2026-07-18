package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.vocabulary.VocabularyFavoriteResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.StudentVocabularyFavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/vocabulary/favorites")
@RequiredArgsConstructor
public class StudentVocabularyFavoriteController {

    private final StudentVocabularyFavoriteService favoriteService;

    /**
     * GET /api/student/vocabulary/favorites
     * Get all favorites for the current student
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<VocabularyFavoriteResponse>>> getAllFavorites(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<VocabularyFavoriteResponse> favorites = favoriteService.getFavorites(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(favorites));
    }

    /**
     * GET /api/student/vocabulary/favorites/lesson/{lessonId}
     * Get all favorites for a specific lesson
     */
    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<ApiResponse<List<VocabularyFavoriteResponse>>> getFavoritesByLesson(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID lessonId) {
        List<VocabularyFavoriteResponse> favorites = favoriteService.getFavoritesByLesson(
                userDetails.getId(), lessonId);
        return ResponseEntity.ok(ApiResponse.success(favorites));
    }

    /**
     * GET /api/student/vocabulary/favorites/lesson/{lessonId}/ids
     * Get only the IDs of favorites for a specific lesson
     */
    @GetMapping("/lesson/{lessonId}/ids")
    public ResponseEntity<ApiResponse<List<UUID>>> getFavoriteIdsByLesson(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID lessonId) {
        List<UUID> favoriteIds = favoriteService.getFavoriteVocabularyItemIdsByLesson(
                userDetails.getId(), lessonId);
        return ResponseEntity.ok(ApiResponse.success(favoriteIds));
    }

    /**
     * GET /api/student/vocabulary/favorites/ids
     * Get all favorite vocabulary item IDs
     */
    @GetMapping("/ids")
    public ResponseEntity<ApiResponse<List<UUID>>> getAllFavoriteIds(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<UUID> favoriteIds = favoriteService.getFavoriteVocabularyItemIds(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(favoriteIds));
    }

    /**
     * POST /api/student/vocabulary/favorites/{vocabularyItemId}
     * Add a vocabulary item to favorites
     */
    @PostMapping("/{vocabularyItemId}")
    public ResponseEntity<ApiResponse<VocabularyFavoriteResponse>> addFavorite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID vocabularyItemId) {
        VocabularyFavoriteResponse favorite = favoriteService.addFavorite(
                userDetails.getId(), vocabularyItemId);
        return ResponseEntity.ok(ApiResponse.success("Added to favorites", favorite));
    }

    /**
     * DELETE /api/student/vocabulary/favorites/{vocabularyItemId}
     * Remove a vocabulary item from favorites
     */
    @DeleteMapping("/{vocabularyItemId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID vocabularyItemId) {
        favoriteService.removeFavorite(userDetails.getId(), vocabularyItemId);
        return ResponseEntity.ok(ApiResponse.success("Removed from favorites", null));
    }

    /**
     * GET /api/student/vocabulary/favorites/check/{vocabularyItemId}
     * Check if a vocabulary item is favorited
     */
    @GetMapping("/check/{vocabularyItemId}")
    public ResponseEntity<ApiResponse<Boolean>> checkFavorite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID vocabularyItemId) {
        boolean isFavorite = favoriteService.isFavorite(userDetails.getId(), vocabularyItemId);
        return ResponseEntity.ok(ApiResponse.success(isFavorite));
    }

    /**
     * POST /api/student/vocabulary/favorites/{vocabularyItemId}/toggle
     * Toggle favorite status
     */
    @PostMapping("/{vocabularyItemId}/toggle")
    public ResponseEntity<ApiResponse<VocabularyFavoriteResponse>> toggleFavorite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID vocabularyItemId) {
        VocabularyFavoriteResponse result = favoriteService.toggleFavorite(
                userDetails.getId(), vocabularyItemId);
        if (result == null) {
            return ResponseEntity.ok(ApiResponse.success("Removed from favorites", null));
        } else {
            return ResponseEntity.ok(ApiResponse.success("Added to favorites", result));
        }
    }
}

package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.flashcard.*;
import com.midori.security.CustomUserDetails;
import com.midori.service.FlashcardService;
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
@RequestMapping("/api/teacher/flashcard-sets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class FlashcardTeacherController {

    private final FlashcardService flashcardService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FlashcardSetResponse>>> listFlashcardSets(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search) {
        List<FlashcardSetResponse> sets = flashcardService.listFlashcardSetsForManagement(
                userDetails.getId(), level, search);
        return ResponseEntity.ok(ApiResponse.success(sets));
    }

    @GetMapping("/{setId}")
    public ResponseEntity<ApiResponse<FlashcardSetDetailResponse>> getFlashcardSet(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID setId) {
        FlashcardSetDetailResponse set = flashcardService.getFlashcardSetForManagement(setId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(set));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FlashcardSetResponse>> createFlashcardSet(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody FlashcardSetCreateRequest request) {
        FlashcardSetResponse set = flashcardService.createFlashcardSet(request, userDetails.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Flashcard set created successfully", set));
    }

    @PutMapping("/{setId}")
    public ResponseEntity<ApiResponse<FlashcardSetResponse>> updateFlashcardSet(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID setId,
            @Valid @RequestBody FlashcardSetUpdateRequest request) {
        FlashcardSetResponse set = flashcardService.updateFlashcardSet(setId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Flashcard set updated successfully", set));
    }

    @DeleteMapping("/{setId}")
    public ResponseEntity<ApiResponse<Void>> deleteFlashcardSet(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID setId) {
        flashcardService.deleteFlashcardSet(setId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Flashcard set deleted successfully", null));
    }

    @PostMapping("/{setId}/submit")
    public ResponseEntity<ApiResponse<FlashcardSetResponse>> submitFlashcardSet(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID setId) {
        FlashcardSetResponse set = flashcardService.submitFlashcardSet(setId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Flashcard set submitted for review", set));
    }

    @PostMapping("/{setId}/cards")
    public ResponseEntity<ApiResponse<FlashcardCardResponse>> addCard(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID setId,
            @Valid @RequestBody FlashcardCardCreateRequest request) {
        FlashcardCardResponse card = flashcardService.addCard(setId, request, userDetails.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Card added successfully", card));
    }
}

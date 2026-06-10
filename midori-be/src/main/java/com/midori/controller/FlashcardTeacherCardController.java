package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.flashcard.FlashcardCardResponse;
import com.midori.dto.flashcard.FlashcardCardUpdateRequest;
import com.midori.security.CustomUserDetails;
import com.midori.service.FlashcardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/teacher/flashcard-cards")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class FlashcardTeacherCardController {

    private final FlashcardService flashcardService;

    @PutMapping("/{cardId}")
    public ResponseEntity<ApiResponse<FlashcardCardResponse>> updateCard(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID cardId,
            @Valid @RequestBody FlashcardCardUpdateRequest request) {
        FlashcardCardResponse card = flashcardService.updateCard(cardId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Card updated successfully", card));
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<ApiResponse<Void>> deleteCard(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID cardId) {
        flashcardService.deleteCard(cardId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Card deleted successfully", null));
    }
}

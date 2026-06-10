package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.flashcard.FlashcardSetDetailResponse;
import com.midori.dto.flashcard.FlashcardSetResponse;
import com.midori.service.FlashcardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student/flashcard-sets")
@RequiredArgsConstructor
public class FlashcardStudentController {

    private final FlashcardService flashcardService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FlashcardSetResponse>>> listFlashcardSets(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search) {
        List<FlashcardSetResponse> sets = flashcardService.listApprovedFlashcardSets(level, search);
        return ResponseEntity.ok(ApiResponse.success(sets));
    }

    @GetMapping("/{setId}")
    public ResponseEntity<ApiResponse<FlashcardSetDetailResponse>> getFlashcardSet(
            @PathVariable UUID setId) {
        FlashcardSetDetailResponse set = flashcardService.getApprovedFlashcardSet(setId);
        return ResponseEntity.ok(ApiResponse.success(set));
    }
}

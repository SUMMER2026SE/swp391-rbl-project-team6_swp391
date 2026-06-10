package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.grammar.GrammarCreateRequest;
import com.midori.dto.grammar.GrammarResponse;
import com.midori.dto.grammar.GrammarStatsResponse;
import com.midori.dto.grammar.GrammarUpdateRequest;
import com.midori.security.CustomUserDetails;
import com.midori.service.GrammarService;
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
@RequestMapping("/api/teacher/grammar")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class GrammarTeacherController {

    private final GrammarService grammarService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GrammarResponse>>> listGrammars(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search) {
        List<GrammarResponse> grammars = grammarService.listGrammarsForManagement(userDetails.getId(), level, search);
        return ResponseEntity.ok(ApiResponse.success(grammars));
    }

    @GetMapping("/{grammarId}")
    public ResponseEntity<ApiResponse<GrammarResponse>> getGrammar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID grammarId) {
        GrammarResponse grammar = grammarService.getGrammarForManagement(grammarId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(grammar));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GrammarResponse>> createGrammar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody GrammarCreateRequest request) {
        GrammarResponse grammar = grammarService.createGrammar(request, userDetails.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Grammar created successfully", grammar));
    }

    @PutMapping("/{grammarId}")
    public ResponseEntity<ApiResponse<GrammarResponse>> updateGrammar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID grammarId,
            @Valid @RequestBody GrammarUpdateRequest request) {
        GrammarResponse grammar = grammarService.updateGrammar(grammarId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Grammar updated successfully", grammar));
    }

    @DeleteMapping("/{grammarId}")
    public ResponseEntity<ApiResponse<Void>> deleteGrammar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID grammarId) {
        grammarService.deleteGrammar(grammarId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Grammar deleted successfully", null));
    }

    @PostMapping("/{grammarId}/submit")
    public ResponseEntity<ApiResponse<GrammarResponse>> submitGrammar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID grammarId) {
        GrammarResponse grammar = grammarService.submitGrammar(grammarId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Grammar submitted for review", grammar));
    }

    @GetMapping("/{grammarId}/stats")
    public ResponseEntity<ApiResponse<GrammarStatsResponse>> getGrammarStats(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID grammarId) {
        GrammarStatsResponse stats = grammarService.getGrammarStats(grammarId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}

package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.grammar.GrammarPatternDetailResponse;
import com.midori.dto.grammar.GrammarPatternSummaryResponse;
import com.midori.service.GrammarPatternService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Student-facing endpoints for the Grammar Learning System.
 *
 * <p>GET /api/student/grammar/video/{videoId}  — list grammar detected in a video
 * <p>GET /api/student/grammar/{grammarId}      — detail + lazy Vietnamese translation
 */
@Slf4j
@RestController
@RequestMapping("/api/student/grammar")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentGrammarPatternController {

    private final GrammarPatternService grammarPatternService;

    /**
     * GET /api/student/grammar/video/{videoId}
     * Returns all grammar patterns detected in the given shadowing video.
     */
    @GetMapping("/video/{videoId}")
    public ResponseEntity<ApiResponse<List<GrammarPatternSummaryResponse>>> getForVideo(
            @PathVariable UUID videoId) {

        log.debug("[StudentGrammar] getForVideo videoId={}", videoId);
        List<GrammarPatternSummaryResponse> patterns = grammarPatternService.getForVideo(videoId);
        return ResponseEntity.ok(ApiResponse.success(patterns));
    }

    /**
     * GET /api/student/grammar/{grammarId}?videoId={videoId}
     * Returns full grammar detail. Lazily translates to Vietnamese on first request.
     * Subsequent requests are served from Redis cache or DB — Gemini is never called again.
     */
    @GetMapping("/{grammarId}")
    public ResponseEntity<ApiResponse<GrammarPatternDetailResponse>> getDetail(
            @PathVariable UUID grammarId,
            @RequestParam(required = false) UUID videoId) {

        log.debug("[StudentGrammar] getDetail grammarId={} videoId={}", grammarId, videoId);
        GrammarPatternDetailResponse detail =
                grammarPatternService.getDetailWithTranslation(grammarId, videoId);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }
}

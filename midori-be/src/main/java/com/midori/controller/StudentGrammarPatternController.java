package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.grammar.GrammarPatternDetailResponse;
import com.midori.dto.grammar.GrammarPatternSummaryResponse;
import com.midori.service.GrammarDetectorService;
import com.midori.service.GrammarPatternService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Student-facing endpoints for the Grammar Learning System.
 *
 * <p>GET /api/student/grammar/video/{videoId}  — list grammar detected in a video
 * <p>GET /api/student/grammar/{grammarId}      — detail + lazy Vietnamese translation
 */
@Slf4j
@RestController
@RequestMapping("/api/student/grammar-patterns")
@RequiredArgsConstructor
public class StudentGrammarPatternController {

    private final GrammarPatternService grammarPatternService;
    private final GrammarDetectorService grammarDetectorService;

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

    /**
     * POST /api/student/grammar-patterns/video/{videoId}/detect
     * Triggers grammar detection for a video (requires ADMIN or TEACHER role).
     */
    @PostMapping("/video/{videoId}/detect")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> detectForVideo(
            @PathVariable UUID videoId) {

        log.info("[StudentGrammar] Triggering grammar detection for videoId={}", videoId);
        grammarDetectorService.detectForVideo(videoId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "message", "Grammar detection triggered for video " + videoId
        )));
    }
}

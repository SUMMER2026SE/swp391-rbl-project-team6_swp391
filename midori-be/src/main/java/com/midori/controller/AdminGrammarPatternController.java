package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.entity.GrammarPattern;
import com.midori.repository.GrammarPatternRepository;
import com.midori.service.GrammarImporterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only endpoints for managing the Hanabira grammar pattern library.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/grammar-patterns")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminGrammarPatternController {

    private final GrammarImporterService grammarImporterService;
    private final GrammarPatternRepository grammarPatternRepository;

    /**
     * POST /api/admin/grammar-patterns/import
     * Manually trigger grammar JSON import (also runs automatically on startup).
     */
    @PostMapping("/import")
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerImport() {
        log.info("[AdminGrammarPattern] Manual import triggered.");
        int count = grammarImporterService.importAll();
        return ResponseEntity.ok(ApiResponse.success(
                "Grammar import complete",
                Map.of("newPatternsImported", count)
        ));
    }

    /**
     * GET /api/admin/grammar-patterns
     * List all grammar patterns in the library.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<GrammarPattern>>> listAll() {
        List<GrammarPattern> patterns = grammarPatternRepository.findAllOrdered();
        return ResponseEntity.ok(ApiResponse.success(patterns));
    }

    /**
     * GET /api/admin/grammar-patterns/stats
     * Count patterns by status.
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        long total = grammarPatternRepository.count();
        long translated = grammarPatternRepository.countByStatus(com.midori.entity.GrammarPatternStatus.TRANSLATED);
        long pending = grammarPatternRepository.countByStatus(com.midori.entity.GrammarPatternStatus.PENDING_TRANSLATION);
        long failed = grammarPatternRepository.countByStatus(com.midori.entity.GrammarPatternStatus.FAILED);

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "total", total,
                "translated", translated,
                "pending", pending,
                "failed", failed
        )));
    }
}

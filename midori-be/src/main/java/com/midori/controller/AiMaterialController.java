package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.ai.AiMaterialDetailResponse;
import com.midori.dto.ai.AiMaterialSummaryResponse;
import com.midori.service.AiMaterialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Student-safe endpoints backing the Student AI Sensei material selector.
 *
 * <p>Both endpoints are gated to STUDENT and ADMIN roles. The user id is
 * never read from the request body or query string — it is taken from the
 * authenticated principal only. Source: {@link com.midori.security.CustomUserDetails}.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai/materials")
@RequiredArgsConstructor
public class AiMaterialController {

    private final AiMaterialService aiMaterialService;

    /**
     * Lightweight list of published, active, non-deleted materials across
     * Vocabulary, Grammar, Reading and Listening.
     *
     * @param type   optional filter — one of VOCABULARY, GRAMMAR, READING, LISTENING (case-insensitive)
     * @param level  optional filter — JLPT level, e.g. N5
     * @param search optional free-text filter applied to title + description
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AiMaterialSummaryResponse>>> listMaterials(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search) {

        List<AiMaterialSummaryResponse> materials = aiMaterialService.listMaterials(type, level, search);
        return ResponseEntity.ok(ApiResponse.success(materials));
    }

    /**
     * Full material detail with formatted AI context. The response is
     * guaranteed to never contain teacher-only metadata; it returns a
     * formatted plain-text body capped at {@code MATERIAL_CONTENT_LIMIT}
     * characters.
     *
     * <p>Returns:
     * <ul>
     *   <li>{@code 400 Bad Request} if {@code type} is missing or invalid</li>
     *   <li>{@code 404 Not Found} if the material id is unknown OR the
     *       material is not visible to students (inactive / unpublished /
     *       hard-deleted)</li>
     * </ul>
     */
    @GetMapping("/{type}/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<AiMaterialDetailResponse>> getMaterialDetail(
            @PathVariable String type,
            @PathVariable UUID id) {

        AiMaterialDetailResponse detail = aiMaterialService.getMaterialDetail(type, id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }
}
